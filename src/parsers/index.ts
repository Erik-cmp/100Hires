/**
 * Parser for sources.md to extract expert information
 */

import { promises as fs } from 'fs';
import { Expert } from '../types/index.js';
import { logError } from '../utils/logger.js';

export class SourcesParser {
  async parseExperts(filePath: string): Promise<Expert[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.extractExperts(content);
    } catch (error) {
      logError(`Failed to read sources file: ${filePath}`);
      throw error;
    }
  }

  private extractExperts(content: string): Expert[] {
    const experts: Expert[] = [];
    const sections = content.split(/\n## /);

    for (const section of sections) {
      if (section.trim().length === 0) continue;

      const expert = this.parseExpertSection(section);
      if (expert) {
        experts.push(expert);
      }
    }

    return experts;
  }

  private parseExpertSection(section: string): Expert | null {
    const lines = section.split('\n').map(l => l.trim());

    // First line should be the name
    const name = lines[0];
    if (!name || name.length < 2) return null;

    let title = '';
    let company = '';
    let linkedIn = '';
    let website = '';
    let relevance = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('- Current title:')) {
        title = this.extractValue(line);
      } else if (line.startsWith('- Current company:')) {
        company = this.extractValue(line);
      } else if (line.startsWith('- LinkedIn profile:')) {
        linkedIn = this.extractValue(line);
      } else if (line.startsWith('- Company website:')) {
        website = this.extractValue(line);
      } else if (line.startsWith('### Why this expert?')) {
        // Everything after "Why this expert?" until next section is relevance
        const relevanceIndex = section.indexOf('### Why this expert?');
        const nextSectionIndex = section.indexOf('###', relevanceIndex + 1);
        const end = nextSectionIndex === -1 ? section.length : nextSectionIndex;
        relevance = section.substring(relevanceIndex, end).replace('### Why this expert?', '').trim();
      }
    }

    // Only include if we have at least name and company
    if (!name || !company) return null;

    return {
      name,
      title,
      company,
      linkedIn: this.cleanUrl(linkedIn),
      website: this.cleanUrl(website),
      relevance
    };
  }

  private extractValue(line: string): string {
    const parts = line.split(': ');
    return parts.slice(1).join(': ').trim();
  }

  private cleanUrl(url: string): string {
    if (!url) return '';
    // Remove markdown link syntax if present
    const match = url.match(/\[(.*?)\]\((.*?)\)/);
    if (match) {
      return match[2];
    }
    return url;
  }
}
