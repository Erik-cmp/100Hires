/**
 * Transcript file management service
 */

import { promises as fs } from 'fs';
import path from 'path';
import { VideoSummary } from '../types/index.js';

export class TranscriptService {
  async saveTranscriptMarkdown(
    outputDir: string,
    expertName: string,
    videoSummary: VideoSummary
  ): Promise<string> {
    try {
      const expertDir = path.join(outputDir, expertName);
      await fs.mkdir(expertDir, { recursive: true });

      const fileName = this.generateFileName(videoSummary.title);
      const filePath = path.join(expertDir, fileName);

      const markdown = this.formatMarkdown(videoSummary);
      await fs.writeFile(filePath, markdown, 'utf-8');

      return filePath;
    } catch (error) {
      throw new Error(`Failed to save transcript: ${error}`);
    }
  }

  async deleteEmptyExpertDirs(outputDir: string): Promise<number> {
    try {
      const entries = await fs.readdir(outputDir, { withFileTypes: true });
      let deletedCount = 0;

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(outputDir, entry.name);
          const files = await fs.readdir(dirPath);

          // Delete if no markdown files exist
          const mdFiles = files.filter(f => f.endsWith('.md'));
          if (mdFiles.length === 0) {
            await fs.rm(dirPath, { recursive: true, force: true });
            deletedCount++;
          }
        }
      }

      return deletedCount;
    } catch (error) {
      throw new Error(`Failed to clean up directories: ${error}`);
    }
  }

  private generateFileName(title: string): string {
    const sanitized = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100)
      .replace(/-+$/, '');

    return `${sanitized}.md`;
  }

  private formatMarkdown(videoSummary: VideoSummary): string {
    const {
      title,
      url,
      channel,
      published,
      duration,
      transcript,
      summary,
      keyTakeaways,
      mentionedTopics,
      relevance
    } = videoSummary;

    const sections = [
      `# ${title}`,
      '',
      '**Video Information:**',
      `- URL: [${url}](${url})`,
      `- Channel: ${channel}`,
      `- Published: ${published}`,
      ...(duration ? [`- Duration: ${duration}`] : []),
      '',
      '## Transcript',
      '',
      '```',
      transcript,
      '```',
      '',
      '## Summary',
      '',
      summary,
      '',
      '## Key Takeaways',
      '',
      ...keyTakeaways.map(takeaway => `- ${takeaway}`),
      '',
      '## Mentioned Topics',
      '',
      ...mentionedTopics.map(topic => `- ${topic}`),
      '',
      '## Relevance',
      '',
      relevance
    ];

    return sections.join('\n');
  }

  /**
   * Get an overview of processed experts
   */
  async getProcessingStats(outputDir: string): Promise<{ expert: string; videoCount: number }[]> {
    try {
      const entries = await fs.readdir(outputDir, { withFileTypes: true });
      const stats = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(outputDir, entry.name);
          const files = await fs.readdir(dirPath);
          const mdFiles = files.filter(f => f.endsWith('.md'));

          stats.push({
            expert: entry.name,
            videoCount: mdFiles.length
          });
        }
      }

      return stats.sort((a, b) => b.videoCount - a.videoCount);
    } catch {
      return [];
    }
  }
}
