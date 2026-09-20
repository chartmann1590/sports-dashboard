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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(compression());
app.use(express.json());

// Request logger for API calls
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

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

// Serve frontend in production
const distPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(distPath));

// SPA Fallback for client routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api/')) {
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
  console.log(`🏟️ SportsPulse Dashboard Server Started!`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
