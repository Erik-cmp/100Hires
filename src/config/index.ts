import { Config } from '../types/index.js';
import { logError } from '../utils/logger.js';

export const loadConfig = (): Config => {
  const supadataApiKey = process.env.SUPADATA_API_KEY;
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;

  if (!supadataApiKey) {
    logError(
      'ERROR: SUPADATA_API_KEY environment variable is not set. Please set it in your .env file.'
    );
    process.exit(1);
  }

  if (!youtubeApiKey) {
    logError(
      'ERROR: YOUTUBE_API_KEY environment variable is not set. Please set it in your .env file.'
    );
    process.exit(1);
  }

  return {
    supadataApiKey,
    supadataApiEndpoint: process.env.SUPADATA_API_ENDPOINT || 'https://api.supadata.com',
    youtubeApiKey,
    researchTopic: 'Reddit marketing for B2B SaaS',
    keywords: [
      'reddit',
      'b2b',
      'saas',
      'marketing',
      'growth',
      'community',
      'demand generation',
      'content marketing',
      'organic marketing',
      'social media',
      'acquisition'
    ],
    outputDirectory: './research/youtube-transcripts',
    inputFile: './research/sources.md',
    maxResultsPerExpert: 20,
    retryAttempts: 3,
    retryDelay: 1000
  };
};
