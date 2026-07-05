/**
 * Main entry point for the YouTube Research Automation service
 */

import dotenv from 'dotenv';
import { loadConfig } from './config/index.js';
import { SourcesParser } from './parsers/index.js';
import { YouTubeService } from './services/youtube.service.js';
import { YoutubeTranscriptService } from './services/supadata.service.js';
import { SummarizerService, MockLLMProvider } from './services/summarizer.service.js';
import { TranscriptService } from './services/transcript.service.js';
import { ResearchOrchestrator } from './services/orchestrator.service.js';
import { logSuccess, logError, logSeparator } from './utils/logger.js';

// Load environment variables
dotenv.config();

async function main() {
  try {
    logSeparator();
    console.log('🚀 YouTube Research Automation Service');
    logSeparator();

    // Load configuration
    const config = loadConfig();

    // Initialize services
    const sourcesParser = new SourcesParser();
    const youtubeService = new YouTubeService(config.youtubeApiKey);
    const transcriptService = new YoutubeTranscriptService();
    const llmProvider = new MockLLMProvider(); // Replace with real provider
    const summarizerService = new SummarizerService(llmProvider);
    const markdownService = new TranscriptService();

    // Create orchestrator
    const orchestrator = new ResearchOrchestrator(
      sourcesParser,
      youtubeService,
      transcriptService,
      summarizerService,
      markdownService,
      config
    );

    // Run the pipeline
    await orchestrator.run();

    logSeparator();
    logSuccess('Research automation completed successfully!');
    logSeparator();

    process.exit(0);
  } catch (error) {
    logSeparator();
    logError(`Fatal error: ${error}`);
    logSeparator();
    process.exit(1);
  }
}

main();
