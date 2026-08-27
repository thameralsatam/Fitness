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

// Body parser for JSON with large audio base64 limit (up to 50MB)
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
  try {
    const { audioBase64, mimeType = 'audio/mp3', language = 'ar' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required in request body' });
    }

    const ai = getGenAIClient();
    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

    const promptText = `You are a precision audio transcriber and lyrics synchronizer.
Transcribe this audio file into timestamped lines (synchronized lyrics / karaoke subtitles).
Return an exact JSON array of objects.
Each object must have:
- "time": start timestamp in seconds as a float number (e.g. 0.0, 3.4, 12.8) indicating when this line begins.
- "text": the spoken or sung words in that line in the original language (Arabic, German, English, etc.), spelled accurately.

Rules:
1. Divide the transcript into natural, short sentences or musical phrasing lines.
2. Keep timestamps strictly synchronized with the audio.
3. If the audio is in Arabic, use proper Arabic script with clear words.
4. Output valid JSON matching the schema.`;

    let resultLyrics: Array<{ time: number; text: string }> = [];

    try {
      // Use gemini-3.7-flash with multimodal audio support and structured JSON schema
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          {
            inlineData: {
              mimeType: mimeType || 'audio/mp3',
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: {
                  type: Type.NUMBER,
                  description: 'Start timestamp in seconds from audio beginning',
                },
                text: {
                  type: Type.STRING,
                  description: 'Spoken/sung lyric text for this segment',
                },
              },
              required: ['time', 'text'],
            },
          },
        },
      });

      const responseText = response.text || '[]';
      resultLyrics = JSON.parse(responseText);
    } catch (flashJsonError) {
      console.warn('gemini-3.7-flash with schema failed, retrying without strict schema:', flashJsonError);

      // Fallback: gemini-3.7-flash without schema, parse json from text
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          {
            inlineData: {
              mimeType: mimeType || 'audio/mp3',
              data: cleanBase64,
            },
          },
          {
            text: `${promptText}\n\nRespond ONLY with a valid JSON array of objects: [{"time": 0.0, "text": "..."}] without markdown codeblocks or other commentary.`,
          },
        ],
      });

      const rawText = fallbackResponse.text || '[]';
      const cleanJsonMatch = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (cleanJsonMatch) {
        resultLyrics = JSON.parse(cleanJsonMatch[0]);
      } else {
        resultLyrics = JSON.parse(rawText.trim());
      }
    }

    // Sort lyrics by time ascending
    resultLyrics.sort((a, b) => (a.time || 0) - (b.time || 0));

    res.json({
      success: true,
      lyrics: resultLyrics,
    });
  } catch (error: any) {
    console.error('Transcription API error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to transcribe audio file',
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
