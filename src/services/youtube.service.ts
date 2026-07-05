/**
 * YouTube search service
 * Searches for videos featuring marketing experts
 */

import axios from 'axios';
import { YouTubeVideo, SearchQuery } from '../types/index.js';
import { sleep } from '../utils/index.js';
import { logWarning } from '../utils/logger.js';

export class YouTubeService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate search queries for an expert
   */
  generateSearchQueries(expertName: string, keywords: string[]): SearchQuery[] {
    const queries: SearchQuery[] = [
      { query: `"${expertName}"`, priority: 1 },
      { query: `"${expertName}" interview`, priority: 2 },
      { query: `"${expertName}" podcast`, priority: 2 },
      { query: `"${expertName}" talk`, priority: 3 },
      { query: `"${expertName}" conference`, priority: 3 }
    ];

    // Add keyword-specific searches
    const selectedKeywords = keywords.slice(0, 3);
    for (const keyword of selectedKeywords) {
      queries.push({
        query: `"${expertName}" ${keyword}`,
        priority: 4
      });
    }

    return queries.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Search for videos (returns mock data - in production, this would use YouTube API)
   * For a real implementation, you'd need a YouTube API key
   */
  async searchVideos(
    _expertName: string,
    queries: SearchQuery[],
    maxResults: number = 20
  ): Promise<YouTubeVideo[]> {
    const allVideos: YouTubeVideo[] = [];
    const videoIds = new Set<string>();

    for (const searchQuery of queries) {
      if (allVideos.length >= maxResults) break;

      try {
        const videos = await this.performSearch(searchQuery.query, maxResults - allVideos.length);

        for (const video of videos) {
          if (!videoIds.has(video.id)) {
            videoIds.add(video.id);
            allVideos.push(video);
          }
        }

        // Be respectful with API usage
        await sleep(500);
      } catch (error) {
        logWarning(`Search failed for query: "${searchQuery.query}"`);
      }
    }

    return allVideos;
  }

  private async performSearch(query: string, maxResults: number): Promise<YouTubeVideo[]> {
    try {
      // YouTube Data API v3: https://developers.google.com/youtube/v3/docs/search/list
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          q: query,
          part: 'snippet',
          type: 'video',
          maxResults: Math.min(maxResults, 50),
          key: this.apiKey,
          order: 'relevance',
          videoDuration: 'medium'
        }
      });

      if (!response.data.items) {
        return [];
      }

      return response.data.items.map(
        (item: {
          id: { videoId: string };
          snippet: {
            title: string;
            channelTitle: string;
            description: string;
            publishedAt: string;
            thumbnails: { medium?: { url: string } };
          };
        }) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          thumbnailUrl: item.snippet.thumbnails.medium?.url || '',
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        })
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        console.warn('YouTube API quota exceeded or API key invalid');
      }
      return [];
    }
  }

  /**
   * Extract video ID from various YouTube URL formats
   */
  static extractVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Check if a video title/description contains relevant keywords
   */
  isRelevantContent(
    title: string,
    description: string,
    keywords: string[]
  ): boolean {
    const contentLower = `${title} ${description}`.toLowerCase();

    // Filter out obvious spam/unrelated content
    const excludePatterns = ['gaming', 'vlog', 'music', 'trailer', 'full episode', 'reaction'];
    for (const pattern of excludePatterns) {
      if (contentLower.includes(pattern) && !contentLower.includes('marketing')) {
        return false;
      }
    }

    // Check for relevant keywords
    const relevantCount = keywords.filter(keyword =>
      contentLower.includes(keyword.toLowerCase())
    ).length;

    return relevantCount > 0;
  }
}
