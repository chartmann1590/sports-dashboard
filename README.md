# 🏟️ ArenaPulse — Live Sports Dashboard & TV Jumbotron

A real-time, responsive multi-sport dashboard powered by **100% free, unauthenticated public sports feeds** (no API keys, tokens, or subscriptions required).

Designed for desktop, mobile, and **Big-Screen Living Room TV displays** with an immersive Dark Athletic glassmorphism aesthetic, live auto-refresh, sound alerts, play-by-play breakdowns, team box scores, betting odds, and league news.

---

## 🌟 Key Features

- **Zero-Key Free Live Data Feeds**:
  - Direct normalized proxy to ESPN's public endpoints.
  - High-resolution team logos, records, rankings, live scores, quarter/inning status, and start times.
  - In-game situational data: down & distance, yard lines, red zone indicators, baseball diamond base-runners & count, soccer match minutes, and basketball shot clocks.
- **Deep Game Center Modal**:
  - **Scoring Summary**: Chronological scoring timeline with team logos and play descriptions.
  - **Play-by-Play**: Full chronological or drive-by-drive breakdowns (down, distance, yardage, result).
  - **Box Score & Player Stats**: Side-by-side team comparison stats & player tables (passing, rushing, receiving, tackles, batting, pitching, shooting, etc.).
  - **Win Probability Chart**: Interactive momentum curve charting game swings.
  - **Game Info & Odds**: Stadium/venue, capacity, weather, attendance, officials, and consensus betting lines (Spread, Over/Under, Moneylines).
  - **Recap & News**: Full post-game stories, photos, and related league headlines.
- **📺 TV / Jumbotron Mode**:
  - Optimized for 4K / 1080p living room TVs with high-contrast cinema scoreboard cards.
  - Auto-cycling spotlight on live & close games.
  - Giant digital stadium clock and date.
  - **🎙️ Play-by-Play Announcer** (opt-in, free, no API keys): toggle "Announcer" in TV mode
    to hear each new play read aloud like a sports broadcaster — big moments get more
    excitement, faster pace, and higher pitch. Uses the browser's built-in voice by default,
    or the optional on-device Kokoro TTS sidecar for a more human-like voice
    (`docker compose --profile tts up --build -d`).
  - Keyboard / Remote shortcuts:
    - `◀` / `▶` Left/Right Arrow: Manually cycle games.
    - `Spacebar`: Pause / Resume auto-cycle.
    - `Enter`: Open deep game center.
    - `Esc`: Exit TV mode.
- **Multi-League Support**:
  - 🏈 **NFL** (National Football League)
  - 🎓 **NCAA Football** (College Football CFB)
  - ⚾ **MLB** (Major League Baseball)
  - 🏀 **NBA** & **WNBA**
  - 🎓 **NCAA Men's Basketball** (College Hoops)
  - 🏒 **NHL** (National Hockey League)
  - ⚽ **Premier League** (EPL)
  - ⚽ **MLS** (Major League Soccer)
  - 🏆 **UEFA Champions League**
  - ⚽ **La Liga**, **Bundesliga**, **Serie A**, **Liga MX**
- **Live Features & Controls**:
  - **Auto-Refresh**: 10s, 15s (default), 30s, 60s, or Paused with real-time radial countdown.
  - **Audio Alerts**: Web Audio API celebration chimes on scores and touchdowns (toggleable).
  - **Date Navigator**: Fast jump between Yesterday, Today, Tomorrow, or custom calendar date.
  - **Search & Filters**: Instant filter by team, city, ranking, live-only, upcoming, or final.
  - **Breaking Ticker**: Top live scores & ESPN breaking headlines marquee.

---

## 🔌 Public REST API & Complete Documentation

ArenaPulse exposes a clean, unauthenticated REST API accessible directly from the Docker container, host machine, or shared Docker networks. **No API keys or tokens required.**

- 📖 **Interactive Swagger UI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- 📄 **OpenAPI 3.0.3 Specification**: [http://localhost:3000/api/openapi.json](http://localhost:3000/api/openapi.json)
- 📑 **Comprehensive Guide**: See [`API.md`](./API.md) for complete parameter definitions, response schemas, and client examples.

### Core Endpoints Quick Reference

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | `GET` | Service status, timestamp, and container uptime |
| `/api/leagues` | `GET` | All 14 supported leagues across Football, Baseball, Basketball, Hockey, Soccer |
| `/api/scores/all` | `GET` | Aggregated live, upcoming, and completed games across all leagues (`?date=YYYYMMDD`) |
| `/api/scores` | `GET` | Single league scoreboard (`?league=nfl&date=YYYYMMDD`) |
| `/api/game/:sport/:league/:id` | `GET` | Deep box score, play-by-play, scoring timeline, odds, weather, and recap |
| `/api/game/:league/:id` | `GET` | Deep game summary with auto-resolved sport |
| `/api/news` | `GET` | Top league sports headlines, articles, and photos (`?league=nfl`) |
| `/api/tts/health` | `GET` | Probe status of optional on-device Kokoro TTS announcer sidecar |
| `/api/tts` | `POST` | Synthesize announcer speech into WAV audio (`{ text, speed, voice }`) |
| `/api/openapi.json` | `GET` | Raw OpenAPI 3.0.3 specification JSON |
| `/api` | `GET` | Machine-readable API directory (redirects to `/api/docs` in browser) |

### Quick cURL Examples

```bash
# Health check
curl -s http://localhost:3000/api/health

# Aggregated live & upcoming scores across all leagues
curl -s "http://localhost:3000/api/scores/all"

# NFL scoreboard for a specific date
curl -s "http://localhost:3000/api/scores?league=nfl&date=20260926"

# Deep game details (box score, play-by-play, betting odds)
curl -s "http://localhost:3000/api/game/nfl/401547432"

# Interactive documentation
curl -s http://localhost:3000/api/openapi.json
```

---

## 🐳 Running with Docker (Recommended)

Start the dashboard in Docker with a single command:

```powershell
docker compose up -d
```

Open your browser at:
👉 **[http://localhost:3000](http://localhost:3000)**

To stop the container:
```powershell
docker compose down
```

### 🎙️ Optional on-device TTS for the TV announcer

The TV mode **Announcer** works out of the box with your browser's free built-in
speech voice — nothing to install, no keys, no accounts. For a more natural,
human-like broadcaster voice, you can run the optional on-device TTS sidecar:

```powershell
docker compose --profile tts up --build -d
```

What you get:

- **Kokoro 82M** text-to-speech, CPU-only, running entirely on your machine
  (~300–500 MB RAM in practice, capped at 1 GB / 2 CPUs so it stays light).
- No API keys, no paid services, no cloud calls — the model downloads once
  (~180 MB) into a named Docker volume on first start.
- The dashboard backend proxies it (`/api/tts`), so the browser never talks to
  the sidecar directly; without the profile enabled, the announcer silently
  falls back to the browser voice.

Environment variables (set in `docker-compose.yml`):

| Variable    | Default                | Purpose                                      |
|-------------|------------------------|----------------------------------------------|
| `TTS_URL`   | `http://kokoro-tts:8000` | Sidecar base URL (inert without the profile) |
| `TTS_VOICE` | `am_michael`           | Default Kokoro voice (`af_heart`, `af_nicole`, `am_adam`, `am_michael`, `bf_emma`, `bm_george`) |

---

## 💻 Running Locally (Without Docker)

### 1. Install dependencies
```powershell
npm install
npm --prefix client install
```

### 2. Build and Start
```powershell
# Build client
npm run build

# Start production server
npm start
```

### 3. Development Mode
```powershell
# Start backend API (Port 3000)
npm run dev:server

# In another terminal, start Vite client (Port 5173 with proxy to 3000)
npm run dev:client
```

---

## 🧪 End-to-End Browser Testing (Playwright)

To run the automated E2E browser test suite:

```powershell
python test_e2e.py
```

The test script automatically:
1. Opens Chromium at `http://localhost:3000`.
2. Tests branding, stats banners, and live game cards.
3. Tests league filtering (NFL, MLB, EPL, etc.).
4. Opens the Game Details modal and inspects Scoring Summary, Play-by-Play, Box Scores, and Game Info tabs.
5. Launches TV Jumbotron Mode, tests keyboard navigation and auto-cycle.
6. Opens the News Headlines drawer.
7. Saves high-res screenshots of every flow into `test-screenshots/`.
