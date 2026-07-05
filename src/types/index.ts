/**
 * Type definitions for the YouTube Research Automation service
 */

export interface Expert {
  name: string;
  title: string;
  company: string;
  linkedIn: string;
  website: string;
  relevance: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  url: string;
  duration?: string;
  viewCount?: number;
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[];
  relevantVideos: YouTubeVideo[];
}

export interface Transcript {
  videoId: string;
  text: string;
  lines: TranscriptLine[];
}

export interface TranscriptLine {
  time: string;
  text: string;
}

export interface VideoSummary {
  title: string;
  url: string;
  channel: string;
  published: string;
  duration?: string;
  transcript: string;
  summary: string;
  keyTakeaways: string[];
  mentionedTopics: string[];
  relevance: string;
}

export interface ProcessingResult {
  expert: string;
  videosFound: number;
  relevantVideos: number;
  transcriptsFetched: number;
  filesSaved: number;
  errors: string[];
}

export interface Config {
  supadataApiKey: string;
  supadataApiEndpoint: string;
  youtubeApiKey: string;
  researchTopic: string;
  keywords: string[];
  outputDirectory: string;
  inputFile: string;
  maxResultsPerExpert: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface SearchQuery {
  query: string;
  priority: number;
}
