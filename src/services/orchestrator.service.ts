/**
 * Main orchestrator service
 * Coordinates the YouTube research workflow
 */

import { promises as fs } from 'fs';
import { Expert, ProcessingResult } from '../types/index.js';
import { SourcesParser } from '../parsers/index.js';
import { YouTubeService } from './youtube.service.js';
import { YoutubeTranscriptService } from './supadata.service.js';
import { SummarizerService } from './summarizer.service.js';
import { TranscriptService } from './transcript.service.js';
import { log, logSuccess, logWarning, logError, logStep } from '../utils/logger.js';
import { sleep } from '../utils/index.js';

export class ResearchOrchestrator {
  constructor(
    private sourcesParser: SourcesParser,
    private youtubeService: YouTubeService,
    private transcriptFetcher: YoutubeTranscriptService,
    private summarizerService: SummarizerService,
    private transcriptService: TranscriptService,
    private config: any
  ) {}

  async run(): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];

    try {
      // Step 1: Read experts
      logStep(1, 4, 'Reading experts from sources.md');
      const experts = await this.sourcesParser.parseExperts(this.config.inputFile);
      if (experts.length === 0) {
        logError('No experts found in sources.md');
        return results;
      }
      logSuccess(`Found ${experts.length} experts`);

      // Step 2: Validate output directory
      logStep(2, 4, 'Setting up output directory');
      await fs.mkdir(this.config.outputDirectory, { recursive: true });
      logSuccess(`Output directory ready: ${this.config.outputDirectory}`);

      // Step 3: Process each expert
      logStep(3, 4, 'Processing experts');
      for (const expert of experts) {
        log(`\nProcessing expert: ${expert.name}`);
        const result = await this.processExpert(expert);
        results.push(result);
      }

      // Step 4: Cleanup
      logStep(4, 4, 'Cleaning up empty directories');
      const deletedCount = await this.transcriptService.deleteEmptyExpertDirs(
        this.config.outputDirectory
      );
      if (deletedCount > 0) {
        logSuccess(`Deleted ${deletedCount} empty expert directories`);
      }

      // Print final stats
      this.printFinalStats(results);

      return results;
    } catch (error) {
      logError(`Orchestration failed: ${error}`);
      throw error;
    }
  }

  private async processExpert(expert: Expert): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      expert: expert.name,
      videosFound: 0,
      relevantVideos: 0,
      transcriptsFetched: 0,
      filesSaved: 0,
      errors: []
    };

    try {
      // Generate search queries
      const queries = this.youtubeService.generateSearchQueries(
        expert.name,
        this.config.keywords
      );

      // Search for videos
      log(`  Searching for videos...`);
      const videos = await this.youtubeService.searchVideos(
        expert.name,
        queries,
        this.config.maxResultsPerExpert
      );

      result.videosFound = videos.length;

      if (videos.length === 0) {
        logWarning(`  No videos found for ${expert.name}`);
        return result;
      }

      // Filter relevant videos
      const relevantVideos = videos.filter(video =>
        this.youtubeService.isRelevantContent(
          video.title,
          video.description,
          this.config.keywords
        )
      );

      result.relevantVideos = relevantVideos.length;
      log(`  Found ${relevantVideos.length} relevant videos`);

      // Process each video
      for (const video of relevantVideos) {
        try {
          const transcript = await this.transcriptFetcher.fetchTranscript(video.url);

          if (!transcript) {
            result.errors.push(`Transcript unavailable for: ${video.title}`);
            continue;
          }

          result.transcriptsFetched++;

          // Generate summary
          const summary = await this.summarizerService.generateVideoSummary(
            {
              title: video.title,
              url: video.url,
              channel: video.channelTitle,
              published: video.publishedAt,
              duration: video.duration
            },
            transcript,
            this.config.researchTopic
          );

          if (!summary) {
            result.errors.push(`Failed to summarize: ${video.title}`);
            continue;
          }

          // Save to file
          await this.transcriptService.saveTranscriptMarkdown(
            this.config.outputDirectory,
            expert.name,
            summary
          );

          result.filesSaved++;
          log(`    ✓ Saved: ${video.title}`);

          // Be respectful with API usage
          await sleep(500);
        } catch (error) {
          result.errors.push(`Error processing ${video.title}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to process expert: ${error}`);
    }

    return result;
  }

  private printFinalStats(results: ProcessingResult[]): void {
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('PROCESSING COMPLETE');
    console.log('═'.repeat(80));

    const totalExperts = results.length;
    const expertsWithVideos = results.filter(r => r.videosFound > 0).length;
    const totalVideosFound = results.reduce((sum, r) => sum + r.videosFound, 0);
    const totalRelevantVideos = results.reduce((sum, r) => sum + r.relevantVideos, 0);
    const totalTranscripts = results.reduce((sum, r) => sum + r.transcriptsFetched, 0);
    const totalFilesSaved = results.reduce((sum, r) => sum + r.filesSaved, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(`\nExperts Processed: ${expertsWithVideos}/${totalExperts}`);
    console.log(`Videos Found: ${totalVideosFound}`);
    console.log(`Relevant Videos: ${totalRelevantVideos}`);
    console.log(`Transcripts Fetched: ${totalTranscripts}`);
    console.log(`Files Saved: ${totalFilesSaved}`);
    console.log(`Errors: ${totalErrors}`);

    if (totalErrors > 0) {
      console.log('\nErrors encountered:');
      for (const result of results) {
        if (result.errors.length > 0) {
          console.log(`\n${result.expert}:`);
          for (const error of result.errors) {
            console.log(`  • ${error}`);
          }
        }
      }
    }
  }
}
