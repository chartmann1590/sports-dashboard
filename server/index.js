import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  LEAGUES_CONFIG, 
  getAllScores, 
  getScoreboard, 
  getGameSummary, 
  getNews,
  resolveSportAndLeague
} from './espnService.js';
import { setupApiDocs } from './docs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(compression());
app.use(express.json());

// Request logger for API calls
app.use((req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/docs')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Setup Interactive API Documentation & OpenAPI Spec
setupApiDocs(app);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Supported leagues list
app.get('/api/leagues', (req, res) => {
  res.json({ leagues: LEAGUES_CONFIG });
});

// Aggregated live & upcoming games across all leagues
app.get('/api/scores/all', async (req, res) => {
  try {
    const { date } = req.query;
    const data = await getAllScores(date);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// League specific scoreboard (with optional ?date=YYYYMMDD or YYYY-MM-DD)
app.get('/api/scores', async (req, res) => {
  try {
    const { date } = req.query;
    const resolved = resolveSportAndLeague(req.query.sport, req.query.league);
    const data = await getScoreboard(resolved.sport, resolved.league, date);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deep Game Details by sport, league, and ID
app.get('/api/game/:sport/:league/:id', async (req, res) => {
  try {
    const { sport, league, id } = req.params;
    const resolved = resolveSportAndLeague(sport, league);
    const data = await getGameSummary(resolved.sport, resolved.league, id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deep Game Details by league and ID (automatic sport resolution)
app.get('/api/game/:league/:id', async (req, res) => {
  try {
    const { league, id } = req.params;
    const resolved = resolveSportAndLeague(null, league);
    const data = await getGameSummary(resolved.sport, resolved.league, id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// News headlines
app.get('/api/news', async (req, res) => {
  try {
    const resolved = resolveSportAndLeague(req.query.sport, req.query.league);
    const data = await getNews(resolved.sport, resolved.league);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TTS proxy for the TV mode play-by-play announcer.
// The Kokoro sidecar is opt-in (docker compose profile "tts"); without it the
// frontend falls back to the browser's built-in Web Speech API. No API keys.
const TTS_URL = process.env.TTS_URL || '';
const TTS_VOICE = process.env.TTS_VOICE || 'am_michael';

async function fetchWithTimeout(url, { timeoutMs = 3000, ...init } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

app.get('/api/tts/health', async (req, res) => {
  if (!TTS_URL) return res.status(503).json({ available: false, reason: 'TTS sidecar not configured' });
  try {
    const upstream = await fetchWithTimeout(`${TTS_URL}/v1/audio/voices`, { timeoutMs: 3000 });
    if (upstream.ok) return res.json({ available: true });
    return res.status(503).json({ available: false });
  } catch {
    return res.status(503).json({ available: false });
  }
});

app.post('/api/tts', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) return res.status(400).json({ error: 'text must be a non-empty string' });
  if (text.length > 1000) return res.status(400).json({ error: 'text too long (max 1000 chars)' });
  if (!TTS_URL) return res.status(503).json({ available: false, reason: 'TTS sidecar not configured' });
  const speed = Number(req.body.speed);
  try {
    const upstream = await fetchWithTimeout(`${TTS_URL}/v1/audio/speech`, {
      timeoutMs: 30000,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'kokoro',
        input: text,
        voice: req.body.voice || TTS_VOICE,
        response_format: 'wav',
        speed: Number.isFinite(speed) && speed > 0 ? speed : 1.0,
      }),
    });
    if (!upstream.ok) return res.status(502).json({ error: 'TTS synthesis failed' });
    const audio = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/wav');
    res.setHeader('Content-Length', audio.length);
    res.send(audio);
  } catch {
    return res.status(502).json({ error: 'TTS synthesis failed' });
  }
});

// Serve frontend in production
const distPath = path.join(__dirname, '..', 'client', 'dist');

// Serve service worker with proper headers
app.get('/sw.js', (req, res) => {
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(distPath, 'sw.js'));
});

app.use(express.static(distPath));

// API 404 handler for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    method: req.method,
    path: req.originalUrl || req.url,
    documentation: '/api/docs'
  });
});

// SPA Fallback for client routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api') && !req.url.startsWith('/docs')) {
    return res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        res.status(200).send('Sports Dashboard Server Running.');
      }
    });
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🏟️ ArenaPulse Sports Dashboard Server Started!`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`📖 API Docs:    http://localhost:${PORT}/api/docs`);
  console.log(`📄 OpenAPI Spec: http://localhost:${PORT}/api/openapi.json`);
  console.log(`=========================================`);
});
