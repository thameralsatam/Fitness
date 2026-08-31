import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase payload limits for video-heavy JSON exports (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// In-memory temporary store for shared plans (24 hour expiration)
interface SharedPlanEntry {
  id: string;
  fileName: string;
  jsonStr: string;
  createdAt: number;
}
const sharedPlansStore = new Map<string, SharedPlanEntry>();

// Prune expired entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  const cutoff = 24 * 60 * 60 * 1000; // 24 hours
  for (const [id, entry] of sharedPlansStore.entries()) {
    if (now - entry.createdAt > cutoff) {
      sharedPlansStore.delete(id);
    }
  }
}, 30 * 60 * 1000);

// Server-side Direct Export Endpoint
app.post('/api/share-plan', (req, res) => {
  try {
    const { jsonStr, fileName } = req.body;
    if (!jsonStr) {
      return res.status(400).json({ error: 'Missing jsonStr' });
    }

    const id = crypto.randomBytes(4).toString('hex'); // 8 char hex ID
    const safeFileName = (fileName || 'workout_plan.json').replace(/[^\w\u0600-\u06FF.-]+/g, '_');

    sharedPlansStore.set(id, {
      id,
      fileName: safeFileName,
      jsonStr: typeof jsonStr === 'string' ? jsonStr : JSON.stringify(jsonStr),
      createdAt: Date.now(),
    });

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] === 'https' || req.protocol === 'https' ? 'https' : 'http';
    const downloadUrl = `${protocol}://${host}/api/download-plan/${id}/${encodeURIComponent(safeFileName)}`;

    res.json({
      success: true,
      id,
      downloadUrl,
      fileName: safeFileName,
    });
  } catch (err: any) {
    console.error('Error sharing plan:', err);
    res.status(500).json({ error: err?.message || 'Failed to create share link' });
  }
});

// Server-side Direct Download Endpoint with attachment headers (Android WebView Guaranteed Download)
app.get('/api/download-plan/:id/:fileName?', (req, res) => {
  const { id } = req.params;
  const entry = sharedPlansStore.get(id);

  if (!entry) {
    return res.status(404).send('<h1>رابط التنزيل منتهي الصلاحية أو غير موجود (Link Expired or Not Found)</h1>');
  }

  const encodedFileName = encodeURIComponent(entry.fileName);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
  res.setHeader('Content-Length', Buffer.byteLength(entry.jsonStr, 'utf-8').toString());
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.send(entry.jsonStr);
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
