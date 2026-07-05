/**
 * YouTube transcript service powered by a Python helper using youtube-transcript-api.
 */

import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { Transcript } from '../types/index.js';
import { logWarning } from '../utils/logger.js';

const execFileAsync = promisify(execFile);

interface TranscriptHelperResult {
  ok: boolean;
  videoId: string;
  text: string;
  lines: Array<{ time: string; text: string }>;
  error?: string;
}

export class YoutubeTranscriptService {
  private readonly scriptPath: string;
  private readonly commandCandidates: Array<{ command: string; args: string[] }>;

  constructor() {
    this.scriptPath = path.resolve(process.cwd(), 'python', 'fetch_youtube_transcript.py');
    this.commandCandidates = [
      { command: 'python', args: [] },
      { command: 'py', args: ['-3'] },
      { command: 'python3', args: [] }
    ];
  }

  async fetchTranscript(videoUrl: string): Promise<Transcript | null> {
    const helperResult = await this.runPythonHelper(videoUrl);

    if (!helperResult || !helperResult.ok) {
      const videoId = this.extractVideoId(videoUrl) ?? videoUrl;
      logWarning(`Transcript unavailable for video ${videoId}`);
      return null;
    }

    return {
      videoId: helperResult.videoId,
      text: helperResult.text,
      lines: helperResult.lines
    };
  }

  private async runPythonHelper(videoUrl: string): Promise<TranscriptHelperResult | null> {
    const errors: string[] = [];

    for (const candidate of this.commandCandidates) {
      try {
        const { stdout } = await execFileAsync(
          candidate.command,
          [...candidate.args, this.scriptPath, videoUrl],
          {
            timeout: 60000,
            maxBuffer: 10 * 1024 * 1024,
            windowsHide: true
          }
        );

        const parsed = JSON.parse(stdout.toString().trim()) as TranscriptHelperResult;
        return parsed;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${candidate.command}: ${message}`);
      }
    }

    logWarning(`Transcript helper failed for ${videoUrl}. Tried: ${errors.join(' | ')}`);
    return null;
  }

  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /[?&]v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }
}
