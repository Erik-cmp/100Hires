#!/usr/bin/env python3
"""Fetch a YouTube transcript for a URL using youtube-transcript-api."""

from __future__ import annotations

import json
import re
import sys
from typing import Any, Dict, List, Optional

from youtube_transcript_api import YouTubeTranscriptApi


def extract_video_id(url: str) -> Optional[str]:
    patterns = [
        r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/shorts/)([A-Za-z0-9_-]{11})",
        r"[?&]v=([A-Za-z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def format_timestamp(seconds: float) -> str:
    total_milliseconds = int(round(seconds * 1000))
    hours, remainder = divmod(total_milliseconds, 3600 * 1000)
    minutes, remainder = divmod(remainder, 60 * 1000)
    secs, milliseconds = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{milliseconds:03d}"


def fetch_transcript(video_id: str) -> List[Dict[str, Any]]:
    try:
        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id, languages=["en"])
        return transcript.to_raw_data()
    except Exception:
        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id)
        return transcript.to_raw_data()


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "Missing YouTube URL"}), file=sys.stderr)
        return 1

    url = sys.argv[1]
    video_id = extract_video_id(url)
    if not video_id:
        print(json.dumps({"ok": False, "error": "Could not extract video ID"}), file=sys.stderr)
        return 1

    try:
        transcript_items = fetch_transcript(video_id)
        lines = []
        formatted_lines = []

        for item in transcript_items:
            timestamp = format_timestamp(float(item.get("start", 0.0)))
            text = str(item.get("text", "")).replace("\n", " ").strip()
            if not text:
                continue
            lines.append({"time": timestamp, "text": text})
            formatted_lines.append(f"{timestamp} {text}")

        result = {
            "ok": True,
            "videoId": video_id,
            "text": "\n".join(formatted_lines),
            "lines": lines,
        }
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(json.dumps({"ok": False, "videoId": video_id, "error": str(exc)}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())