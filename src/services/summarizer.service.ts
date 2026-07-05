/**
 * Summarizer service for generating summaries from transcripts
 * Abstract interface allows different LLM providers to be swapped
 */

import { VideoSummary, Transcript } from '../types/index.js';

export interface LLMProvider {
  generateSummary(transcript: string, topic: string): Promise<string>;
  generateKeyTakeaways(transcript: string, topic: string): Promise<string[]>;
  extractTopics(transcript: string): Promise<string[]>;
  assessRelevance(title: string, description: string, transcript: string, topic: string): Promise<string>;
}

/**
 * Default mock LLM provider for demonstration
 * In production, replace with OpenAI, Anthropic, or any LLM provider
 */
export class MockLLMProvider implements LLMProvider {
  async generateSummary(transcript: string, topic: string): Promise<string> {
    const sentences = transcript.split('.').filter(s => s.trim().length > 0);
    const summary = sentences
      .slice(0, Math.min(6, sentences.length))
      .map(s => s.trim() + '.')
      .join(' ')
      .substring(0, 500);

    return summary || `This video discusses content related to ${topic}.`;
  }

  async generateKeyTakeaways(transcript: string, _topic: string): Promise<string[]> {
    const lines = transcript.split('\n').filter(l => l.trim().length > 20);
    const takeaways = lines
      .slice(0, 8)
      .map(line => {
        // Clean up line and make it a bullet point
        return line.trim().substring(0, 100).replace(/^[-•*]\s*/, '');
      })
      .filter(t => t.length > 0);

    return takeaways.length > 0 ? takeaways : ['Key insights from the video.', 'Practical strategies discussed.'];
  }

  async extractTopics(transcript: string): Promise<string[]> {
    const commonTopics = [
      'Marketing',
      'Growth',
      'SaaS',
      'B2B',
      'Content',
      'Strategy',
      'Revenue',
      'Customer Acquisition',
      'Brand Building',
      'Social Media'
    ];

    const transcriptLower = transcript.toLowerCase();
    return commonTopics.filter(topic => transcriptLower.includes(topic.toLowerCase())).slice(0, 7);
  }

  async assessRelevance(
    title: string,
    _description: string,
    _transcript: string,
    topic: string
  ): Promise<string> {
    const titleLower = title.toLowerCase();
    const keywords = ['reddit', 'b2b', 'saas', 'marketing'];

    const matchedKeywords = keywords.filter(kw => titleLower.includes(kw));

    if (matchedKeywords.length > 0) {
      return `This video is relevant as it discusses ${matchedKeywords.join(', ')} in the context of ${topic}.`;
    }

    return `This video contains relevant insights related to ${topic}.`;
  }
}

export class SummarizerService {
  constructor(private llmProvider: LLMProvider) {}

  async generateVideoSummary(
    video: {
      title: string;
      url: string;
      channel: string;
      published: string;
      duration?: string;
    },
    transcript: Transcript,
    topic: string
  ): Promise<VideoSummary | null> {
    try {
      const [summary, keyTakeaways, mentionedTopics, relevance] = await Promise.all([
        this.llmProvider.generateSummary(transcript.text, topic),
        this.llmProvider.generateKeyTakeaways(transcript.text, topic),
        this.llmProvider.extractTopics(transcript.text),
        this.llmProvider.assessRelevance(video.title, '', transcript.text, topic)
      ]);

      return {
        title: video.title,
        url: video.url,
        channel: video.channel,
        published: video.published,
        duration: video.duration,
        transcript: transcript.text,
        summary,
        keyTakeaways,
        mentionedTopics,
        relevance
      };
    } catch (error) {
      console.error(`Failed to generate summary: ${error}`);
      return null;
    }
  }
}
