import { LyricLine } from '../types';

/**
 * Parse standard LRC subtitle text format
 */
export function parseLrcFormat(lrcContent: string): LyricLine[] {
  const lines = lrcContent.split('\n');
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const matches = Array.from(rawLine.matchAll(timeRegex));
    if (matches.length === 0) continue;

    const text = rawLine.replace(timeRegex, '').trim();
    if (!text) continue;

    for (const match of matches) {
      const minutes = parseInt(match[1], 10) || 0;
      const seconds = parseInt(match[2], 10) || 0;
      const fraction = match[3] ? parseFloat(`0.${match[3]}`) : 0;
      const totalSeconds = minutes * 60 + seconds + fraction;

      result.push({
        id: `lrc_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
        time: parseFloat(totalSeconds.toFixed(2)),
        text,
      });
    }
  }

  result.sort((a, b) => a.time - b.time);
  return result;
}

/**
 * Export LyricLine[] to standard LRC text format
 */
export function exportToLrcFormat(lyrics: LyricLine[], title = ''): string {
  let lrc = `[ti:${title}]\n`;
  for (const line of lyrics) {
    const totalSecs = Math.max(0, line.time || 0);
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    const ms = Math.floor((totalSecs - Math.floor(totalSecs)) * 100);
    const timeTag = `[${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}.${ms < 10 ? '0' : ''}${ms}]`;
    lrc += `${timeTag} ${line.text}\n`;
  }
  return lrc;
}
