# Technical Architecture & Design Decisions

## Overview

This document explains the architecture, design patterns, and key decisions for the YouTube Research Automation service.

## Design Principles

### 1. **Modularity & Separation of Concerns**

Each service handles a single responsibility:

```
┌─────────────────────────────────────────┐
│      ResearchOrchestrator               │ Coordinates workflow
├─────────────────────────────────────────┤
│ SourcesParser│YouTube│Supadata│Summary  │ Specialized services
├─────────────────────────────────────────┤
│ TranscriptService │ Config │ Utils      │ Supporting utilities
└─────────────────────────────────────────┘
```

**Benefits:**
- Easy to test each component independently
- Simple to swap implementations (e.g., YouTube API vs scraper)
- Clear error boundaries
- Reusable in other projects

### 2. **Dependency Injection**

Services receive dependencies rather than creating them:

```typescript
// Bad: Hard to test, tightly coupled
class YouTubeService {
  private supadata = new SupadataService(apiKey);
  // ...
}

// Good: Flexible, testable
class ResearchOrchestrator {
  constructor(
    private supadata: SupadataService,
    private youtube: YouTubeService,
    // ...
  ) {}
}
```

### 3. **Abstract Interfaces for Swappable Implementations**

The `LLMProvider` interface allows any summarization provider:

```typescript
interface LLMProvider {
  generateSummary(...): Promise<string>;
  // ...
}

// Easy to add new providers without modifying SummarizerService
new SummarizerService(new OpenAIProvider());
new SummarizerService(new AnthropicProvider());
new SummarizerService(new LocalLlamaProvider());
```

### 4. **Configuration-Driven Behavior**

No hardcoded values - everything is configurable:

```typescript
const config = {
  keywords: [...],        // What to search for
  maxResults: 20,         // How many to fetch
  retryAttempts: 3,       // Error resilience
  retryDelay: 1000,       // Request throttling
};
```

### 5. **Explicit Error Handling**

Never crash silently:

```typescript
// All errors are caught and reported
try {
  const transcript = await supadata.fetch(videoId);
} catch (error) {
  result.errors.push(`Failed: ${error}`);
  // Continue with next video
}
```

## Service Architecture

### SourcesParser

**Responsibility**: Parse markdown to extract expert data

**Why separate?**
- Input format may change (YAML, JSON, database)
- Reusable for other markdown sources
- Easy to test with sample inputs

**Parsing strategy:**
```markdown
## Expert Name
- Current title: Title
- Current company: Company
```

### YouTubeService

**Responsibility**: Find videos featuring experts

**Key method:**
```typescript
searchVideos(expertName, queries, maxResults)
  ↓
generateSearchQueries()    // Create search variations
  ↓
performSearch()            // Query YouTube (integration point)
  ↓
isRelevantContent()        // Filter spam/unrelated
  ↓
YouTubeVideo[]
```

**Design notes:**
- Generates multiple query variations (name, name + interview, etc.)
- Filters out obvious spam (gaming, vlogs, etc.)
- Returns standardized `YouTubeVideo` objects
- Ready for YouTube API v3 integration

### SupadataService

**Responsibility**: Fetch transcripts via API

**Key features:**
- Automatic retry with exponential backoff
- Rate limit handling (waits 5 seconds)
- Timeout protection (30 seconds)
- 404 handling (transcript doesn't exist)

**Implementation:**
```typescript
fetchTranscript(videoId)
  ↓
retry(..., attempts, delay)  // Resilience wrapper
  ↓
callSupadataAPI()            // Actual API call
  ↓
parseTranscript()            // Transform response
  ↓
Transcript {text, lines}
```

> Note: In the current workspace the original Supadata integration proved unreliable (endpoint DNS failures) and was replaced by a URL-first transcript pipeline. The active implementation fetches transcripts by video URL using a small Python helper that leverages `youtube-transcript-api`. The Node side runs a lightweight bridge (`YoutubeTranscriptService`) which execs `python/fetch_youtube_transcript.py` and parses JSON on stdout.

### Transcript Backend (Python bridge)

**Responsibility**: Retrieve transcripts by video URL using `youtube-transcript-api` (Python)

**Why this approach?**
- The Python `youtube-transcript-api` library offers robust transcript retrieval for many videos and handles edge cases.
- Keeps Node code simple: the Node service delegates transcript fetch to the Python helper and focuses on orchestration, summarization, and markdown formatting.

**Flow:**
```text
YouTubeVideo.url -> YoutubeTranscriptService (Node) -> spawn python/fetch_youtube_transcript.py --url <video_url>
python script uses youtube-transcript-api.fetch() -> formats timestamps -> prints JSON
Node parses JSON -> SummarizerService -> TranscriptService writes markdown
```

**Resilience:**
- Python helper returns structured `{ ok, videoId, text, lines, error? }` so Node can gracefully skip or retry.
- Supadata-style API client code is retained only as an optional, commented reference and is not used by default.

### SummarizerService

**Responsibility**: Generate insights from transcripts

**Stack:**
```typescript
SummarizerService
  ↓
LLMProvider (interface)
  ├─ MockLLMProvider      (current - proof of concept)
  ├─ OpenAIProvider       (easily added)
  ├─ AnthropicProvider    (easily added)
  └─ CustomProvider       (your choice)
```

**Why abstract LLM?**
- No vendor lock-in
- Easy testing with mock
- Swap providers based on cost/quality/availability

### TranscriptService

**Responsibility**: File I/O and directory management

**Operations:**
1. Create expert directories
2. Generate safe filenames
3. Format markdown output
4. Delete empty folders
5. Report statistics

**Markdown format:**
- Preserves all info (transcript, summary, takeaways)
- Human-readable
- Git-friendly (diffs show real changes)
- Easy to parse later if needed

### ResearchOrchestrator

**Responsibility**: Coordinate entire workflow

**Workflow:**
```
1. Load configuration
2. Read experts from sources.md
3. For each expert:
   a. Generate YouTube search queries
   b. Search for videos
   c. Filter relevant videos
   d. For each relevant video:
      i. Fetch transcript
      ii. Generate summary
      iii. Save markdown
4. Delete empty expert directories
5. Print final statistics
```

**Error handling strategy:**
- Never crash mid-expert
- Continue with next expert if one fails
- Collect all errors in result object
- Report errors at the end

## Type Safety

All interfaces defined in `src/types/index.ts`:

```typescript
interface Config {
  supadataApiKey: string;
  keywords: string[];
  // ...
}

interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  // ...
}
```

**Benefits:**
- Autocomplete in IDE
- Catch bugs at compile time
- Self-documenting code
- Easier refactoring

## Error Resilience

### Retry Pattern

```typescript
export const retry = async <T>(
  fn: () => Promise<T>,
  attempts: number,
  delay: number
): Promise<T | null>
```

Used for:
- API calls to Supadata
- File operations
- Network requests

### Graceful Degradation

- ✅ API down? Log warning, continue
- ✅ Transcript missing? Skip video, continue
- ✅ Invalid expert? Skip expert, continue
- ✅ Summary generation fails? Log error, skip

## Extensibility Points

### Adding a New Search Source

**Step 1**: Create new service

```typescript
// src/services/linkedin.service.ts
export class LinkedInService {
  async searchPosts(expertName: string): Promise<LinkedInPost[]> {
    // ...
  }
}
```

**Step 2**: Add to orchestrator

```typescript
constructor(
  private linkedIn: LinkedInService,
  // ...
) {}
```

**Step 3**: Add processing logic

```typescript
async processExpert(expert) {
  const posts = await this.linkedIn.searchPosts(expert.name);
  // Process like videos...
}
```

### Adding a New LLM Provider

**Step 1**: Implement interface

```typescript
export class OpenAIProvider implements LLMProvider {
  async generateSummary(transcript: string, topic: string): Promise<string> {
    const response = await openai.createChatCompletion({
      messages: [{ role: "user", content: transcript }],
      // ...
    });
    return response.choices[0].message.content;
  }
  // ... other methods
}
```

**Step 2**: Use in main

```typescript
const llmProvider = new OpenAIProvider(apiKey);
const summarizer = new SummarizerService(llmProvider);
```

### Adding Configuration Categories

**Step 1**: Update types

```typescript
interface Config {
  // ... existing
  newFeature: {
    enabled: boolean;
    options: string[];
  };
}
```

**Step 2**: Update config loader

```typescript
newFeature: {
  enabled: process.env.NEW_FEATURE_ENABLED === 'true',
  options: (process.env.NEW_FEATURE_OPTIONS || '').split(','),
}
```

## Testing Strategy

### Unit Testing

Each service can be tested in isolation:

```typescript
// Mock dependencies
const mockSupadata = new MockSupadataService();
const service = new YouTubeService(mockSupadata);

// Test
const result = await service.searchVideos('Kyle Munson', queries);
expect(result).toHaveLength(5);
```

### Integration Testing

Test workflow with sample data:

```bash
# Use test sources.md with dummy experts
pnpm test:integration
```

### Manual Testing

```bash
# Dev mode with logging
pnpm dev

# Watch for issues
# Check research/youtube-transcripts/ output
```

## Performance Considerations

### Memory

- Streams transcripts (doesn't load all at once)
- Deletes from memory after saving
- No persistent in-memory caches

### Network

- Respects API rate limits
- Includes delays between requests (500ms)
- Retry backoff: 1s → 2s → 4s
- Timeout: 30 seconds

### Disk

- Saves markdown files only (no duplicates)
- Deletes empty directories
- Efficient filename generation

## Security

### Secrets Management

```bash
# Good: Use environment variables
SUPADATA_API_KEY=your_key_here pnpm start

# Never commit secrets
git add .env
git commit -m "add .env"  # ❌ Wrong!

# Correct
echo ".env" >> .gitignore
git add .gitignore
git commit -m "ignore .env"  # ✅ Right!
```

### Input Validation

- Expert names validated
- URLs normalized
- Filenames sanitized
- Markdown escaped

## Monitoring & Observability

### Logging Levels

```typescript
log()       // Info - normal operation
logSuccess()// Success - milestone achieved
logWarning()// Warning - issue but continued
logError()  // Error - problem occurred
```

### Metrics Collected

```typescript
ProcessingResult {
  expert: string;
  videosFound: number;
  relevantVideos: number;
  transcriptsFetched: number;
  filesSaved: number;
  errors: string[];
}
```

### Final Report

```
├─ Experts Processed: 8/10
├─ Videos Found: 45
├─ Relevant Videos: 32
├─ Transcripts Fetched: 28
├─ Files Saved: 28
└─ Errors: 4
```

## Future Enhancements

1. **Progress persistence** - Save state if interrupted
2. **Parallel processing** - Process multiple experts simultaneously
3. **Database backend** - Store transcripts in DB instead of files
4. **Webhook support** - Trigger on demand
5. **Scheduling** - Run on cron (weekly, daily)
6. **Analytics dashboard** - Web UI to explore results
7. **Sentiment analysis** - Track sentiment trends
8. **Citation tracking** - Extract cited sources
9. **Speaker detection** - Identify key speakers in video
10. **Multi-language** - Support non-English transcripts

## References

- YouTube Data API: https://developers.google.com/youtube/v3
- TypeScript Best Practices: https://www.typescriptlang.org/docs/handbook/
- Node.js Streams: https://nodejs.org/api/stream.html
