import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parser for JSON with large audio base64 limit (up to 60MB)
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Lazy initialize GoogleGenAI client with required User-Agent
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Audio Transcription & Lyrics Extraction Endpoint
app.post('/api/transcribe', async (req, res) => {
  console.log('[API /api/transcribe] Incoming transcription request...');
  try {
    const { audioBase64, mimeType = 'audio/mp3', language = 'ar', trackTitle = '' } = req.body;

    if (!audioBase64) {
      console.error('[API /api/transcribe] Missing audioBase64 in request body');
      return res.status(400).json({ error: 'audioBase64 is required in request body' });
    }

    const ai = getGenAIClient();
    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

    let normalizedMime = (mimeType || 'audio/mp3').toLowerCase();
    if (normalizedMime.includes('m4a') || normalizedMime.includes('mp4')) {
      normalizedMime = 'audio/mp4';
    } else if (normalizedMime.includes('webm')) {
      normalizedMime = 'audio/webm';
    } else if (normalizedMime.includes('wav')) {
      normalizedMime = 'audio/wav';
    } else if (normalizedMime.includes('ogg')) {
      normalizedMime = 'audio/ogg';
    } else if (normalizedMime.includes('aac')) {
      normalizedMime = 'audio/aac';
    } else if (normalizedMime.includes('flac')) {
      normalizedMime = 'audio/flac';
    } else {
      normalizedMime = 'audio/mp3';
    }

    console.log(
      `[API /api/transcribe] Audio size: ${Math.round(cleanBase64.length / 1024)} KB, mimeType: ${normalizedMime}, language: ${language}, trackTitle: "${trackTitle}"`
    );

    const promptText = `You are an expert audio transcriptionist and lyrics synchronizer.
Listen carefully to the provided audio${trackTitle ? ` (Track Title / Hint: "${trackTitle}")` : ''}.
Transcribe all spoken words, singing, or dialogue accurately in the exact sequence they occur in the audio.
Divide the speech into clear, readable phrases or word segments with precise start timestamps in seconds.

Language guidelines:
- If the audio is in Arabic, use correct, modern, and accurate Arabic spelling.
- If in German or English, use correct spelling and capitalization.

Output format:
Return a JSON array where each item has:
- "time": start timestamp in seconds (as a number, e.g. 0.0, 1.2, 3.5, 12.8)
- "text": the transcribed word or phrase`;

    let resultLyrics: Array<{ time: number; text: string }> = [];

    // Phase 1: Tiered models for audio transcription
    // 1. Primary (الأساسي الأقوى والأدق للتفريغ الصوتي): gemini-3.5-transcribe
    // 2. Secondary (الاحتياطي الأول المباشر بالقوة): gemini-3.7-flash
    // 3. Tertiary (احتياط الاحتياط - الثالث بالقوة): gemini-3.6-flash
    // 4. Fallback (احتياطي الأمان الشامل): gemini-2.5-flash / gemini-flash-latest
    const modelsToTry = [
      'gemini-3.5-transcribe', // 1. Primary (الأساسي)
      'gemini-3.7-flash',      // 2. Secondary (الاحتياطي الأول)
      'gemini-3.6-flash',      // 3. Tertiary (احتياط الاحتياط)
      'gemini-2.5-flash',      // 4. Fallback
      'gemini-flash-latest',   // 5. Ultimate Fallback
    ];
    let lastErr: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[API /api/transcribe] Phase 1 - Trying transcription model: ${modelName}...`);
        const isTranscribeOnly = modelName.includes('transcribe');

        const contentPayload: any = {
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType: normalizedMime,
                data: cleanBase64,
              },
            },
            {
              text: isTranscribeOnly
                ? `Transcribe all spoken words in this audio${trackTitle ? ` ("${trackTitle}")` : ''}. Format each line or word with start time in seconds like: [0.0s] Text`
                : promptText,
            },
          ],
        };

        if (!isTranscribeOnly) {
          contentPayload.config = {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.NUMBER, description: 'Start time of the line or word in seconds' },
                  text: { type: Type.STRING, description: 'Text of the spoken word or phrase' },
                },
                required: ['time', 'text'],
              },
            },
          };
        }

        const response = await ai.models.generateContent(contentPayload);
        const rawText = response.text || '';

        let parsed: any[] = [];
        try {
          parsed = JSON.parse(rawText);
        } catch {
          const match = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (match) {
            try {
              parsed = JSON.parse(match[0]);
            } catch {}
          }
        }

        // If plain text format with timestamps (e.g. from transcribe-only model)
        if ((!parsed || parsed.length === 0) && rawText.trim().length > 0) {
          const lines = rawText.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            // Match formats like: [01:23.45] text or [12.3s] text or 12.3s: text or [12.3] text
            const lrcMatch = trimmed.match(/^\[?(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]?\s*(.+)/);
            if (lrcMatch) {
              const mins = parseInt(lrcMatch[1], 10) || 0;
              const secs = parseInt(lrcMatch[2], 10) || 0;
              const frac = lrcMatch[3] ? parseFloat(`0.${lrcMatch[3]}`) : 0;
              parsed.push({ time: mins * 60 + secs + frac, text: lrcMatch[4].trim() });
              continue;
            }
            const secMatch = trimmed.match(/^\[?(\d+(?:\.\d+)?)\s*s?\]?\s*:?\s*(.+)/);
            if (secMatch) {
              parsed.push({ time: parseFloat(secMatch[1]), text: secMatch[2].trim() });
            }
          }
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          resultLyrics = parsed
            .map((item: any) => ({
              time: Math.max(0, parseFloat((Number(item.time) || 0).toFixed(2))),
              text: String(item.text || '').trim(),
            }))
            .filter((item: any) => item.text.length > 0);

          if (resultLyrics.length > 0) {
            console.log(`[API /api/transcribe] Phase 1 Success - Extracted ${resultLyrics.length} items using model ${modelName}.`);
            break;
          }
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(`[API /api/transcribe] Transcription model ${modelName} failed:`, err?.message || err);
      }
    }

    if (resultLyrics.length === 0 && lastErr) {
      throw lastErr;
    }

    // Sort lyrics by time ascending
    resultLyrics.sort((a, b) => (a.time || 0) - (b.time || 0));

    // Phase 2: Tiered Search Correction models (مع البحث على الإنترنت)
    // 1. Primary Search (الأساسي الأقوى للبحث والتدقيق): gemini-3.7-flash
    // 2. Secondary Search (الاحتياطي الأول المباشر بالقوة): gemini-3.6-flash
    // 3. Tertiary Search (احتياط الاحتياط - الثالث بالقوة): gemini-2.5-flash
    // 4. Fallback (احتياطي الأمان الشامل للبحث): gemini-flash-latest
    if (resultLyrics.length > 0) {
      const searchModelsToTry = [
        'gemini-3.7-flash',    // 1. Primary Search (الأساسي الأقوى)
        'gemini-3.6-flash',    // 2. Secondary Search (الاحتياطي الأول)
        'gemini-2.5-flash',    // 3. Tertiary Search (احتياط الاحتياط)
        'gemini-flash-latest', // 4. Fallback
      ];

      const textSample = resultLyrics.map((l) => l.text).join(' ');
      console.log(`[API /api/transcribe] Phase 2 - Searching web for authentic lyrics to correct errors for: "${trackTitle || textSample.slice(0, 60)}"...`);

      const correctionPrompt = `You are an expert lyrics proofreader and linguist.

INPUT TRANSCRIPTION FROM AUDIO (PRIMARY BASELINE WITH TIMESTAMPS):
Audio Track Title: "${trackTitle || 'Audio Track'}"
Language: ${language === 'ar' ? 'Arabic' : language === 'de' ? 'German' : 'English'}
Extracted Audio Segments:
${JSON.stringify(resultLyrics, null, 2)}

TASK:
1. Perform a web search to find authentic original lyrics, nasheed, poem, or text matching "${trackTitle || ''}" and excerpt: "${textSample.slice(0, 250)}".
2. If reliable authentic lyrics/text are found:
   - Compare the extracted audio lines against the official lyrics.
   - Correct misheard words, typos, and spelling or phonetic errors in each line.
   - STRICT RULE 1: Do NOT add missing verses, stanzas, or words that were NOT extracted from the audio. The audio may be only a snippet; only correct the extracted lines.
   - STRICT RULE 2: Keep the EXACT SAME number of items as the input array.
   - STRICT RULE 3: Keep each item's "time" timestamp UNCHANGED.
3. If no reliable authentic source is found or you cannot confirm the lyrics:
   - Return the EXACT SAME input array unchanged without inventing words.

OUTPUT FORMAT:
Return ONLY a JSON array of objects with keys "time" and "text". Example:
[
  { "time": 0.0, "text": "Corrected line text" }
]`;

      let correctionApplied = false;

      for (const searchModelName of searchModelsToTry) {
        try {
          console.log(`[API /api/transcribe] Phase 2 - Attempting search correction with model ${searchModelName}...`);
          const searchCorrectionResponse = await ai.models.generateContent({
            model: searchModelName,
            contents: correctionPrompt,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });

          const correctedRaw = searchCorrectionResponse.text || '';
          let correctedParsed: any[] = [];
          try {
            correctedParsed = JSON.parse(correctedRaw);
          } catch {
            const match = correctedRaw.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (match) {
              try {
                correctedParsed = JSON.parse(match[0]);
              } catch {}
            }
          }

          if (Array.isArray(correctedParsed) && correctedParsed.length === resultLyrics.length) {
            resultLyrics = resultLyrics.map((originalItem, idx) => {
              const correctedItem = correctedParsed[idx];
              const newText = (correctedItem && typeof correctedItem.text === 'string')
                ? correctedItem.text.trim()
                : originalItem.text;
              return {
                time: originalItem.time, // Strictly preserve original timestamp
                text: newText || originalItem.text,
              };
            });
            console.log(`[API /api/transcribe] Phase 2 Success - Smart web-grounded correction applied using model ${searchModelName}.`);
            correctionApplied = true;
            break; // Break search fallback loop on success
          } else {
            console.log(`[API /api/transcribe] Search model ${searchModelName} response did not match expected structure; trying next fallback model...`);
          }
        } catch (searchErr: any) {
          console.warn(`[API /api/transcribe] Search model ${searchModelName} failed:`, searchErr?.message || searchErr);
        }
      }

      if (!correctionApplied) {
        console.log('[API /api/transcribe] Search correction fallback models exhausted or skipped; retaining original audio transcription.');
      }
    }

    // Ensure final sort by time
    resultLyrics.sort((a, b) => (a.time || 0) - (b.time || 0));

    console.log(`[API /api/transcribe] Final result: ${resultLyrics.length} lines ready.`);
    res.json({
      success: true,
      lyrics: resultLyrics,
    });
  } catch (error: any) {
    console.error('[API /api/transcribe] Final Transcription API Error:', error?.message || error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to transcribe audio file',
      details: error?.status ? `Status: ${error.status}` : undefined,
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
