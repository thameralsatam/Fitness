import { LyricLine } from '../types';

export async function fileToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(base64);
    };
    reader.onerror = (err) => {
      console.error('[transcribeService] FileReader error converting blob to base64:', err);
      reject(err);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Transcribe audio track using the server-side Gemini multimodal API
 * Extracts accurate spoken words and start timestamps (in seconds).
 */
export async function transcribeAudioTrack(
  blob: Blob,
  mimeType = 'audio/mp3',
  lang: 'ar' | 'de' = 'ar',
  trackTitle?: string
): Promise<LyricLine[]> {
  console.log('[transcribeService] Starting transcription for audio blob...', {
    blobSize: blob.size,
    mimeType,
    lang,
    trackTitle,
  });

  let audioBase64: string;
  try {
    audioBase64 = await fileToBase64(blob);
    console.log('[transcribeService] Audio converted to base64 successfully, base64 length:', audioBase64.length);
  } catch (convErr) {
    console.error('[transcribeService] Error converting audio to base64:', convErr);
    throw new Error(lang === 'ar' ? 'فشل قراءة ملف الصوت' : 'Fehler beim Lesen der Audiodatei');
  }

  let response: Response;
  try {
    console.log('[transcribeService] Sending request to /api/transcribe...');
    response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioBase64,
        mimeType,
        language: lang,
        trackTitle,
      }),
    });
  } catch (networkErr: any) {
    console.error('[transcribeService] Network / Fetch error to /api/transcribe:', networkErr);
    throw new Error(
      lang === 'ar'
        ? `خطأ في الاتصال بالخادم: ${networkErr?.message || networkErr}`
        : `Verbindungsfehler: ${networkErr?.message || networkErr}`
    );
  }

  let data: any;
  try {
    data = await response.json();
    console.log('[transcribeService] Received response from /api/transcribe:', {
      status: response.status,
      ok: response.ok,
    });
  } catch (parseErr) {
    console.error('[transcribeService] Error parsing JSON response from server:', parseErr);
    throw new Error(lang === 'ar' ? 'استجابة غير صالحة من الخادم' : 'Ungültige Serverantwort');
  }

  if (!response.ok || !data.success) {
    const errorMsg = data?.error || (lang === 'ar' ? 'فشل استخراج الكلمات' : 'Transkription fehlgeschlagen');
    console.error('[transcribeService] Transcription failed:', errorMsg, data);
    throw new Error(errorMsg);
  }

  const rawLyrics: Array<{ time: number; text: string }> = data.lyrics || [];
  console.log('[transcribeService] Successfully parsed lyrics count:', rawLyrics.length);

  // Map and normalize to LyricLine
  return rawLyrics
    .map((item, idx) => ({
      id: `lyric_${Date.now()}_${idx}`,
      time: Math.max(0, parseFloat((Number(item.time) || 0).toFixed(2))),
      text: (item.text || '').trim(),
    }))
    .filter((item) => item.text.length > 0);
}

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
  let lrc = `[ti:${title}]\n[by:Gym Workout AI]\n`;
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
