# YouTube Research Automation Service

A production-quality Node.js + TypeScript service that automates YouTube research for marketing experts. Transcript retrieval in this workspace uses a small Python helper (the `youtube-transcript-api`) invoked from Node; a legacy Supadata integration exists as an optional/disabled reference.

## Overview

This service automatically:

1. **Reads expert profiles** from `research/sources.md`
2. **Searches YouTube** for videos featuring each expert
3. **Filters by relevance** to Reddit marketing for B2B SaaS
4. **Retrieves transcripts** using the Supadata API
5. **Generates insights** via AI summarization
6. **Organizes outputs** in `research/youtube-transcripts/`
7. **Cleans up** directories with no relevant videos

## Features

- ✅ **Modular Architecture** - Separation of concerns with independent services
- ✅ **Strong TypeScript Typing** - Full type safety throughout
- ✅ **Dependency Injection** - Easy to test and extend
- ✅ **Error Handling** - Graceful degradation with detailed logging
- ✅ **Configurable** - Keywords, retry logic, output paths all customizable
- ✅ **Production-Ready** - Proper logging, environment variable management, cleanup

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm package manager
- Python 3.8+ and `pip` (required for live transcript fetching)
- YouTube API key (`YOUTUBE_API_KEY`) for more reliable search results (recommended)

Note: The Supadata API is optional; the default pipeline uses the Python helper. If you have a Supadata account and prefer that backend you can set `SUPADATA_API_KEY` in `.env` and re-enable the client.

### Installation

```bash
# Install Node dependencies
pnpm install

# (Optional) Create .env file with SUPADATA_API_KEY if you plan to use Supadata
# echo "SUPADATA_API_KEY=your_key_here" > .env

# Install Python deps for transcript fetching (required for default transcript backend)
pip install -r python/requirements.txt
```

### Running

```bash
# Development mode (with hot reload)
pnpm dev

# Production build and run
pnpm build
pnpm start
```

## Configuration

Edit `src/config/index.ts` to customize:

- **Research topic** - What you're researching
- **Keywords** - Relevance filtering keywords
- **Output directory** - Where to save files
- **Input file** - Where to read experts from
- **API limits** - Max results per expert, retry logic

Example:

```typescript
return {
  supadataApiKey: process.env.SUPADATA_API_KEY!,
  researchTopic: 'Reddit marketing for B2B SaaS',
  keywords: [
    'reddit',
    'b2b',
    'saas',
    'marketing',
    'growth',
    // ... more keywords
  ],
  outputDirectory: './research/youtube-transcripts',
  inputFile: './research/sources.md',
  maxResultsPerExpert: 20,
  retryAttempts: 3,
  retryDelay: 1000
};
```

## Architecture

### Services

- **SourcesParser** - Extracts expert data from markdown
- **YouTubeService** - Searches for and validates videos
- **YoutubeTranscriptService** - Node-side bridge that invokes the Python helper to fetch transcripts by URL (default)
- **SummarizerService** - Generates AI summaries (LLM-agnostic)
- **TranscriptService** - Manages file I/O and cleanup
- **ResearchOrchestrator** - Coordinates the entire workflow

Note: A Supadata client implementation exists in prior commits but is not the default transcript backend in this workspace due to endpoint reliability issues.

### Project Structure

```
src/
├── config/           # Configuration management
├── parsers/          # Input parsing (sources.md)
├── prompts/          # LLM system prompts
├── services/         # Business logic
│   ├── youtube-transcript.service.ts  # Node->Python transcript bridge
│   ├── youtube.service.ts        # YouTube search
│   ├── summarizer.service.ts     # AI summarization
│   ├── transcript.service.ts     # File management
│   └── orchestrator.service.ts   # Workflow coordination
├── types/            # TypeScript interfaces
├── utils/            # Helper functions
└── index.ts          # Entry point
```

## Output Format

Each expert gets a directory containing markdown files:

```
research/youtube-transcripts/
├── Kyle Munson/
│   ├── video-title.md
│   └── another-video.md
├── Jason Lauritzen/
│   └── ...
└── [More experts]
```

Each markdown file contains:

```markdown
# Video Title

**Video Information:**
- URL: [link](url)
- Channel: Channel Name
- Published: 2024-01-15
- Duration: 45m 30s

## Transcript

[Full transcript text]

## Summary

[3-6 paragraph summary]

## Key Takeaways

- Takeaway 1
- Takeaway 2
- ...

## Mentioned Topics

- Topic 1
- Topic 2
- ...

## Relevance

[Explanation of relevance to research topic]
```

## Extending for Other Sources

The service is designed to be easily extended:

### Adding LinkedIn Posts

1. Create `LinkedInService` following `YouTubeService` pattern
2. Add to `ResearchOrchestrator`
3. Save outputs to `research/linkedin-posts/`

### Adding Podcast Support

1. Create `PodcastService` with podcast-specific search
2. Reuse `SupadataService` or extend for podcast APIs
3. Save to `research/podcasts/`

### Swapping LLM Providers

The `SummarizerService` uses an abstract `LLMProvider` interface:

```typescript
// Current: MockLLMProvider
const llmProvider = new MockLLMProvider();

// Easy to replace with:
const llmProvider = new OpenAIProvider(apiKey);
// or
const llmProvider = new AnthropicProvider(apiKey);
// or
const llmProvider = new LocalLlamaProvider();
```

Create a new provider by implementing:

```typescript
export interface LLMProvider {
  generateSummary(transcript: string, topic: string): Promise<string>;
  generateKeyTakeaways(transcript: string, topic: string): Promise<string[]>;
  extractTopics(transcript: string): Promise<string[]>;
  assessRelevance(
    title: string,
    description: string,
    transcript: string,
    topic: string
  ): Promise<string>;
}
```

## Logging

Clear progress indicators:

```
✅ Reading experts
✅ Setting up output directory
✅ Validating transcript backend (Python helper or Supadata)
[1/7] Processing experts
  Processing expert: Kyle Munson
    Searching for videos...
    Found 3 relevant videos
    ✓ Saved: Video Title 1
    ✓ Saved: Video Title 2
⚠️  No relevant videos found for: Jason Lauritzen
✅ Cleaning up empty directories
```

## Error Handling

The service gracefully handles:

- ✅ Missing transcripts - Logs warning, continues
- ✅ API rate limits - Retries with exponential backoff
- ✅ Network errors - Retries with configurable attempts
- ✅ Invalid expert data - Skips and reports
- ✅ Empty results - Cleans up directories

## Performance

- **Resilient**: Retries failed API calls
- **Respectful**: Includes delays between requests
- **Memory-efficient**: Streams large transcripts
- **Parallel-ready**: Can add concurrent processing

## Contributing

To extend or modify:

1. **New service?** Create in `src/services/`
2. **New type?** Add to `src/types/index.ts`
3. **New utilities?** Add to `src/utils/`
4. **New config?** Update `src/config/index.ts`

## Troubleshooting

### "SUPADATA_API_KEY not found"

```bash
# Make sure .env file exists with:
echo "SUPADATA_API_KEY=your_actual_key" > .env
```

### No videos found

- Check expert names in `research/sources.md`
- Verify keywords in config match your research
- Check YouTube search queries being generated

### Transcripts not fetching

- Ensure Python deps are installed: `pip install -r python/requirements.txt`
- Verify the active Python interpreter is on PATH and usable by Node (the orchestrator spawns `python`)
- If using Supadata: verify `SUPADATA_API_KEY` and endpoint accessibility
- If transcripts are missing for specific videos they may not provide captions or the library could fail for region/age-restricted videos

### TypeScript errors

```bash
pnpm type-check  # Check types
pnpm lint        # Check linting
```

## Technologies

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3
- **Package Manager**: pnpm
- **HTTP Client**: Axios
- **Configuration**: dotenv
- **Build**: tsx + tsc

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs for detailed error messages
3. Verify environment variables and configuration
4. Check Supadata API documentation
