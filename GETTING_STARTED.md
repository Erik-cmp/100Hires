# Getting Started Guide

## Project Overview

This is a **production-quality Node.js + TypeScript service** that automates YouTube research for marketing experts. It reads expert profiles, searches for relevant videos, fetches transcripts, and generates AI-powered insights.

## What It Does

```
1. Read experts from research/sources.md
   ↓
2. Generate YouTube search queries for each expert
   ↓
3. Search YouTube for videos
   ↓
4. Filter by relevance (keywords matching)
   ↓
5. Fetch transcripts using Supadata API
   ↓
6. Generate AI summaries & key takeaways
   ↓
7. Save markdown files by expert
   ↓
8. Clean up empty directories
```

## Installation

### Prerequisites

- **Node.js 18+** - Download from https://nodejs.org/
- **pnpm** - Package manager (faster than npm)
  ```bash
  npm install -g pnpm
  ```

### Setup

1. **Clone or navigate to the project**
   ```bash
   cd c:\100Hires
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   # Edit .env file and add your Supadata API key
   echo "SUPADATA_API_KEY=your_actual_key_here" > .env
   ```

## Running the Application

### Development Mode (with hot reload)

```bash
pnpm dev
```

- Watches for file changes
- Automatically recompiles
- Great for testing

### Production Build

```bash
# Build
pnpm build

# Run
pnpm start
```

## Project Structure

```
100Hires/
├── src/
│   ├── config/
│   │   └── index.ts              # Configuration loader
│   ├── parsers/
│   │   └── index.ts              # Parse sources.md
│   ├── services/
│   │   ├── orchestrator.service.ts   # Main workflow
│   │   ├── supadata.service.ts       # Transcript API
│   │   ├── youtube.service.ts        # Video search
│   │   ├── summarizer.service.ts     # AI summaries
│   │   └── transcript.service.ts     # File I/O
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   ├── utils/
│   │   ├── index.ts              # Helper functions
│   │   └── logger.ts             # Logging utilities
│   ├── prompts/
│   │   └── summarization.md      # LLM instructions
│   └── index.ts                  # Entry point
├── research/
│   ├── sources.md                # Expert profiles (INPUT)
│   ├── youtube-transcripts/      # Generated transcripts (OUTPUT)
│   ├── linkedin-posts/           # (For future expansion)
│   └── other/
├── package.json
├── tsconfig.json
├── .env                          # Environment variables
├── .gitignore
├── IMPLEMENTATION.md             # Detailed documentation
└── ARCHITECTURE.md               # Design patterns

```

## Configuration

Edit `src/config/index.ts` to customize:

```typescript
export const loadConfig = (): Config => {
  return {
    // ... existing config
    researchTopic: 'Reddit marketing for B2B SaaS',
    keywords: [
      'reddit',
      'b2b',
      'saas',
      'marketing',
      'growth',
      // Add/remove keywords
    ],
    maxResultsPerExpert: 20,  // How many videos per expert
    retryAttempts: 3,         // API retry count
    retryDelay: 1000,         // Delay between retries (ms)
  };
};
```

## Input & Output

### Input: `research/sources.md`

Contains expert profiles in markdown format:

```markdown
## Kyle Munson

- Current title: Vice President, Growth Marketing
- Current company: Huntress
- LinkedIn profile: [link]
- Company website: [link]

### Why this expert?

Relevant because...
```

### Output: `research/youtube-transcripts/`

Generated markdown files organized by expert:

```
research/youtube-transcripts/
├── Kyle Munson/
│   ├── how-to-scale-growth-on-reddit.md
│   └── b2b-saas-marketing-tactics.md
├── Jason Lauritzen/
│   └── reddit-ads-case-study.md
└── ...
```

Each markdown contains:

```markdown
# Video Title

**Video Information:**
- URL: [link]
- Channel: Channel Name
- Published: 2024-01-15
- Duration: 45m 30s

## Transcript

[Full transcript...]

## Summary

[3-6 paragraph summary...]

## Key Takeaways

- Takeaway 1
- Takeaway 2
- ...

## Mentioned Topics

- Topic 1
- Topic 2
- ...

## Relevance

Why this is relevant to the research...
```

## Common Tasks

### Update Keywords

```typescript
// src/config/index.ts
keywords: [
  'reddit',
  'b2b',
  'saas',
  'product-led-growth',  // Add new keyword
  'inbound-marketing',   // Add new keyword
  // ... existing
]
```

### Change Output Location

```typescript
// src/config/index.ts
outputDirectory: './my-research-folder'
```

### Adjust API Ratelimiting

```typescript
// src/config/index.ts
retryAttempts: 5,      // More retry attempts
retryDelay: 2000,      // Longer delay between retries
maxResultsPerExpert: 50 // Search more videos
```

### Use Different LLM Provider

```typescript
// src/index.ts
// Replace MockLLMProvider with your provider
const llmProvider = new OpenAIProvider(apiKey);
// or
const llmProvider = new AnthropicProvider(apiKey);
```

## Troubleshooting

### Error: "SUPADATA_API_KEY not found"

```bash
# Make sure .env has the key
cat .env

# If empty, set it:
echo "SUPADATA_API_KEY=your_key" > .env
```

### Error: "TypeScript compile error"

```bash
# Check for type errors
pnpm type-check

# Fix issues in src/ files
```

### Error: "No videos found"

- Check expert names in `research/sources.md`
- Verify keywords are relevant
- Try running with debug logging

## Extending the Service

### Add Support for LinkedIn

1. Create `src/services/linkedin.service.ts`
2. Implement similar to `youtube.service.ts`
3. Add to orchestrator
4. Output to `research/linkedin-posts/`

### Add Support for Podcasts

1. Create `src/services/podcast.service.ts`
2. Implement search & transcript logic
3. Add to orchestrator
4. Output to `research/podcasts/`

### Implement Real YouTube Search

The current implementation returns empty results. To add real YouTube search:

1. Get YouTube API key from: https://developers.google.com/youtube/v3/getting-started
2. Install YouTube client: `npm install --save youtube-api`
3. Update `src/services/youtube.service.ts` performSearch method
4. Call YouTube API v3 instead of returning empty

### Implement Real LLM Summarization

The current implementation uses mock summaries. To add real AI:

1. Get API key from OpenAI, Anthropic, or Claude
2. Create new LLM provider class:
   ```typescript
   export class OpenAIProvider implements LLMProvider {
     async generateSummary(transcript: string, topic: string): Promise<string> {
       // Call OpenAI API
     }
     // ... implement other methods
   }
   ```
3. Use in index.ts: `new SummarizerService(new OpenAIProvider(apiKey))`

## Monitoring & Logging

The service provides detailed logging:

```
✅ Reading experts
✅ Setting up output directory
✅ Validating Supadata API connection
[1/7] Processing experts
  Processing expert: Kyle Munson
    Searching for videos...
    Found 3 relevant videos
    ✓ Saved: Video Title 1
⚠️  No relevant videos found for: Expert Name
✅ Cleaning up empty directories

═══════════════════════════════════════════════════════════
PROCESSING COMPLETE
═══════════════════════════════════════════════════════════

Experts Processed: 8/10
Videos Found: 45
Relevant Videos: 32
Transcripts Fetched: 28
Files Saved: 28
Errors: 4
```

## Performance Notes

- **Smart Retries**: API failures automatically retry with backoff
- **Rate Limiting**: Respectful delays between requests
- **Error Recovery**: Continues if one expert fails
- **Memory Efficient**: Streams large transcripts

## Design Philosophy

1. **Modular** - Each service has one responsibility
2. **Testable** - Easy to test in isolation
3. **Extendable** - Add new sources/features easily
4. **Configurable** - No hardcoded values
5. **Resilient** - Handles errors gracefully

## File Organization

All source code is in TypeScript and located in `src/`:

- **Types** - `src/types/` - Interfaces and definitions
- **Config** - `src/config/` - Configuration management
- **Services** - `src/services/` - Business logic
- **Utils** - `src/utils/` - Helper functions
- **Parsers** - `src/parsers/` - Input parsing
- **Prompts** - `src/prompts/` - LLM instructions

## Next Steps

1. **Test the setup**: `pnpm build` should complete without errors
2. **Run in dev mode**: `pnpm dev` to see it in action
3. **Review outputs**: Check `research/youtube-transcripts/` for results
4. **Customize**: Update `src/config/index.ts` for your needs
5. **Extend**: Add LinkedIn, podcasts, or other sources

## Support & Resources

- **Architecture details**: See `ARCHITECTURE.md`
- **Full documentation**: See `IMPLEMENTATION.md`
- **Type definitions**: See `src/types/index.ts`
- **Configuration**: See `src/config/index.ts`

## Best Practices

✅ **Do:**
- Keep `.env` out of git (add to `.gitignore`)
- Update keywords when research topic changes
- Review generated summaries for quality
- Extend with new services for new sources

❌ **Don't:**
- Commit API keys to git
- Hardcode values - use config instead
- Skip error handling
- Make breaking changes without versioning

---

**Ready to get started?**

```bash
cd c:\100Hires
pnpm install
pnpm build
pnpm dev
```

Questions? Check the issue tracker or review the architecture documentation.
