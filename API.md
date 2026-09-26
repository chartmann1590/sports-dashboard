# 🏟️ ArenaPulse REST API Reference & Documentation

Welcome to the **ArenaPulse REST API**. The API provides free, high-performance, real-time sports data feeds aggregated from unauthenticated public sports endpoints.

- **Zero-Key Access**: No API keys, developer tokens, or subscriptions required.
- **Interactive Documentation**: Available directly at [`/api/docs`](http://localhost:3000/api/docs) via Swagger UI.
- **OpenAPI 3.0.3 Specification**: Available in raw JSON at [`/api/openapi.json`](http://localhost:3000/api/openapi.json).
- **Service Endpoint Catalog**: Available at [`/api`](http://localhost:3000/api).

---

## 🌐 Network & Container Access

ArenaPulse runs in a Docker container and binds to `0.0.0.0:3000`. Depending on where you are calling the API from, use the corresponding base URL:

| Context | Base URL | Notes |
|---|---|---|
| **Host Machine (Browser / Scripts)** | `http://localhost:3000` | Port `3000` mapped in `docker-compose.yml` |
| **Inside the Container / Healthcheck** | `http://127.0.0.1:3000` | Used by Docker container healthcheck |
| **Another Docker Compose Service / Sidecar** | `http://sports-dashboard:3000` | Service name within shared Docker network |
| **Local Area Network (LAN)** | `http://<HOST_IP>:3000` | Accessible from smart TVs, mobile phones, etc. |

### CORS & Request Headers
- **CORS**: Enabled for all origins (`*`) with preflight `OPTIONS` support.
- **Compression**: `gzip` / `deflate` enabled.
- **Content-Type**: `application/json; charset=utf-8` for data endpoints, `audio/wav` for the TTS synthesis endpoint, and `text/html` for the interactive documentation.

---

## 📑 Interactive Documentation (Swagger UI)

To explore endpoints interactively, inspect schemas, and test live queries directly in your browser:

👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

> [!TIP]
> Navigating directly to `/docs` automatically redirects to `/api/docs`. Navigating to `/api` from any standard browser also opens the interactive Swagger UI.

---

## ⚡ Quick Endpoints Summary

| Method | Endpoint | Description | Cache TTL |
|---|---|---|---|
| `GET` | [`/api/health`](#1-get-apihealth) | Service health check, uptime, and timestamp | None |
| `GET` | [`/api/leagues`](#2-get-apileagues) | List all 14 supported sports leagues and categories | In-memory |
| `GET` | [`/api/scores/all`](#3-get-apiscoresall) | Aggregated scores across all leagues (live first) | 12s |
| `GET` | [`/api/scores`](#4-get-apiscores) | Scoreboard for a single league (with optional date) | 15s |
| `GET` | [`/api/game/:sport/:league/:id`](#5-get-apigamesportleagueid) | Deep game summary, plays, boxscore, odds, and recap | 15s |
| `GET` | [`/api/game/:league/:id`](#6-get-apigameleagueid) | Deep game summary (auto-resolved sport) | 15s |
| `GET` | [`/api/news`](#7-get-apinews) | Top league sports news, headlines, and photos | 120s |
| `GET` | [`/api/tts/health`](#8-get-apittshealth) | Check on-device Kokoro TTS announcer availability | ~3s probe |
| `POST` | [`/api/tts`](#9-post-apitts) | Synthesize announcer speech into WAV audio | Upstream |
| `GET` | [`/api/openapi.json`](#10-get-apiopenapijson) | Raw OpenAPI 3.0.3 specification JSON | Static |
| `GET` | [`/api`](#11-get-api) | API root endpoint directory & metadata | Static |

---

## 📚 Endpoint Details & Examples

### 1. `GET /api/health`
Health probe for container orchestrators, uptime monitoring, and load balancers.

#### Request
```bash
curl -s http://localhost:3000/api/health
```

#### Response `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-09-26T13:30:00.000Z",
  "uptime": 124590.93
}
```

---

### 2. `GET /api/leagues`
Returns all 14 supported sports leagues across Football, Baseball, Basketball, Hockey, and Soccer with display names and icons.

#### Request
```bash
curl -s http://localhost:3000/api/leagues
```

#### Response `200 OK`
```json
{
  "leagues": [
    { "id": "nfl", "sport": "football", "league": "nfl", "name": "NFL", "category": "Football", "icon": "🏈" },
    { "id": "college-football", "sport": "football", "league": "college-football", "name": "NCAA Football", "category": "Football", "icon": "🎓" },
    { "id": "mlb", "sport": "baseball", "league": "mlb", "name": "MLB", "category": "Baseball", "icon": "⚾" },
    { "id": "nba", "sport": "basketball", "league": "nba", "name": "NBA", "category": "Basketball", "icon": "🏀" },
    { "id": "wnba", "sport": "basketball", "league": "wnba", "name": "WNBA", "category": "Basketball", "icon": "🏀" },
    { "id": "mens-college-basketball", "sport": "basketball", "league": "mens-college-basketball", "name": "NCAA Basketball", "category": "Basketball", "icon": "🎓" },
    { "id": "nhl", "sport": "hockey", "league": "nhl", "name": "NHL", "category": "Hockey", "icon": "🏒" },
    { "id": "eng.1", "sport": "soccer", "league": "eng.1", "name": "Premier League", "category": "Soccer", "icon": "⚽" },
    { "id": "usa.1", "sport": "soccer", "league": "usa.1", "name": "MLS", "category": "Soccer", "icon": "⚽" },
    { "id": "uefa.champions", "sport": "soccer", "league": "uefa.champions", "name": "Champions League", "category": "Soccer", "icon": "🏆" },
    { "id": "esp.1", "sport": "soccer", "league": "esp.1", "name": "La Liga", "category": "Soccer", "icon": "⚽" },
    { "id": "ger.1", "sport": "soccer", "league": "ger.1", "name": "Bundesliga", "category": "Soccer", "icon": "⚽" },
    { "id": "ita.1", "sport": "soccer", "league": "ita.1", "name": "Serie A", "category": "Soccer", "icon": "⚽" },
    { "id": "mex.1", "sport": "soccer", "league": "mex.1", "name": "Liga MX", "category": "Soccer", "icon": "⚽" }
  ]
}
```

---

### 3. `GET /api/scores/all`
Aggregates live, upcoming, and completed games across all supported leagues concurrently. Games are normalized and sorted with active live games first, followed by scheduled games by start time, and completed final games last.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `date` | `string` | No | Today | Filter by date in `YYYYMMDD` or `YYYY-MM-DD` format (e.g. `20260926` or `2026-09-26`). |

#### Request
```bash
curl -s "http://localhost:3000/api/scores/all?date=20260926"
```

#### Response `200 OK`
```json
{
  "stats": {
    "totalGames": 42,
    "liveTotal": 7,
    "upcomingTotal": 23,
    "finalTotal": 12,
    "timestamp": "2026-09-26T13:30:00.000Z"
  },
  "leagues": [
    {
      "id": "nfl",
      "name": "NFL",
      "sport": "football",
      "league": "nfl",
      "category": "Football",
      "icon": "🏈",
      "totalCount": 16,
      "liveCount": 3,
      "upcomingCount": 8,
      "finalCount": 5
    }
  ],
  "games": [
    {
      "id": "401547432",
      "name": "Kansas City Chiefs at Baltimore Ravens",
      "shortName": "KC @ BAL",
      "sport": "football",
      "league": "nfl",
      "leagueName": "NFL",
      "date": "2026-09-26T20:15:00Z",
      "status": {
        "state": "in",
        "detail": "4th - 2:15",
        "shortDetail": "2:15 - 4th",
        "period": 4,
        "clock": "2:15",
        "isLive": true,
        "isFinal": false,
        "isScheduled": false
      },
      "homeTeam": {
        "id": "33",
        "name": "Ravens",
        "displayName": "Baltimore Ravens",
        "abbreviation": "BAL",
        "logo": "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png",
        "color": "#241773",
        "score": 24,
        "recordSummary": "2-1"
      },
      "awayTeam": {
        "id": "12",
        "name": "Chiefs",
        "displayName": "Kansas City Chiefs",
        "abbreviation": "KC",
        "logo": "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
        "color": "#e31837",
        "score": 27,
        "recordSummary": "3-0"
      },
      "venue": {
        "name": "M&T Bank Stadium",
        "city": "Baltimore",
        "state": "MD",
        "indoor": false
      },
      "broadcasts": ["NBC", "Peacock"],
      "odds": {
        "details": "BAL -3.0",
        "overUnder": 47.5,
        "spread": -3.0,
        "provider": "ESPN BET"
      },
      "situation": {
        "downDistanceText": "3rd & 4 at BAL 38",
        "possession": "12",
        "isRedZone": false
      }
    }
  ]
}
```

---

### 4. `GET /api/scores`
Fetches the scoreboard and events for an individual sport/league and date.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `league` | `string` | No | `nfl` | League identifier (e.g. `nfl`, `mlb`, `nba`, `eng.1`, `nhl`). |
| `sport` | `string` | No | Auto | Sport category (e.g. `football`, `baseball`). Inferred if omitted. |
| `date` | `string` | No | Today | Date in `YYYYMMDD` or `YYYY-MM-DD` format. |

#### Request
```bash
curl -s "http://localhost:3000/api/scores?league=mlb&date=20260926"
```

---

### 5. `GET /api/game/:sport/:league/:id`
Fetches deep game breakdown including:
- **Scoring Summary**: Chronological scoring events with play descriptions.
- **Play-by-Play**: Full play narrative, yards, downs, and results.
- **Box Score & Player Statistics**: Passing, rushing, receiving, pitching, batting, shooting, and defense stats.
- **Win Probability**: Minute-by-minute win probability progression.
- **Game Info & Odds**: Stadium/venue, capacity, weather conditions, officials, and consensus betting odds.
- **Editorial Recap**: Post-game article, photos, and quotes.

#### Path Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `sport` | `string` | Yes | Sport identifier (e.g. `football`, `baseball`, `basketball`, `hockey`, `soccer`). |
| `league` | `string` | Yes | League slug (e.g. `nfl`, `mlb`, `nba`, `eng.1`). |
| `id` | `string` | Yes | ESPN event/game ID (e.g. `401547432`). |

#### Request
```bash
curl -s "http://localhost:3000/api/game/football/nfl/401547432"
```

---

### 6. `GET /api/game/:league/:id`
Convenience shorthand for deep game summary. The sport category is automatically inferred from the league.

#### Request
```bash
curl -s "http://localhost:3000/api/game/nfl/401547432"
```

---

### 7. `GET /api/news`
Fetches top sports headlines, articles, photos, and recap stories from ESPN feeds.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `league` | `string` | No | `nfl` | League identifier (e.g. `nfl`, `nba`, `mlb`, `eng.1`). |
| `sport` | `string` | No | Auto | Sport category (auto-inferred if omitted). |

#### Request
```bash
curl -s "http://localhost:3000/api/news?league=nba"
```

---

### 8. `GET /api/tts/health`
Probes whether the optional Kokoro on-device TTS sidecar is active and ready to synthesize speech.

#### Response `200 OK` (Sidecar Active)
```json
{
  "available": true
}
```

#### Response `503 Service Unavailable` (Sidecar Disabled)
```json
{
  "available": false,
  "reason": "TTS sidecar not configured"
}
```

---

### 9. `POST /api/tts`
Synthesizes commentary text into speech audio using Kokoro TTS (requires `--profile tts`).

#### Request Headers
```http
Content-Type: application/json
```

#### Request Body
```json
{
  "text": "TOUCHDOWN Kansas City Chiefs! Patrick Mahomes completes a 42-yard pass to Travis Kelce!",
  "speed": 1.05,
  "voice": "am_michael"
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `text` | `string` | Yes | - | Commentary text to speak (1–1000 characters). |
| `speed` | `number` | No | `1.0` | Speech speed multiplier (e.g. `0.9` to `1.3`). |
| `voice` | `string` | No | `am_michael` | Voice name (`am_michael`, `af_heart`, `af_nicole`, `am_adam`, `bf_emma`, `bm_george`). |

#### Response `200 OK`
Returns binary audio stream with `Content-Type: audio/wav`.

---

### 10. `GET /api/openapi.json`
Returns the raw OpenAPI 3.0.3 specification JSON describing all endpoints, models, parameters, and examples.

```bash
curl -s http://localhost:3000/api/openapi.json
```

---

### 11. `GET /api`
Returns the machine-readable API catalog and directory. When accessed from a standard browser (`Accept: text/html`), it redirects automatically to `/api/docs`.

```bash
curl -s -H "Accept: application/json" http://localhost:3000/api
```

---

## 💻 Client Integration Examples

### JavaScript / TypeScript
```javascript
// Fetch all live and upcoming games
async function fetchLiveScores() {
  const response = await fetch('http://localhost:3000/api/scores/all');
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  
  const liveGames = data.games.filter(g => g.status.isLive);
  console.log(`Found ${liveGames.length} live games:`);
  liveGames.forEach(g => {
    console.log(`${g.awayTeam.displayName} ${g.awayTeam.score} - ${g.homeTeam.score} ${g.homeTeam.displayName} (${g.status.shortDetail})`);
  });
}
```

### Python
```python
import requests

def get_nfl_scoreboard():
    url = "http://localhost:3000/api/scores?league=nfl"
    res = requests.get(url, timeout=5)
    res.raise_for_status()
    data = res.json()
    for event in data.get("events", []):
        print(f"{event['name']} - Status: {event['status']['detail']}")

get_nfl_scoreboard()
```

---

## 🐳 Docker Deployment & Container-to-Container Calling

When deploying multiple containers via `docker-compose.yml`, other containers on the same Docker network can query the dashboard API directly via the service name:

```yaml
services:
  sports-dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000

  my-analytics-service:
    image: my-service:latest
    environment:
      - SPORTS_API_URL=http://sports-dashboard:3000
    depends_on:
      - sports-dashboard
```

From inside `my-analytics-service`, you can query:
`http://sports-dashboard:3000/api/scores/all`
with zero network hops over the internet and sub-millisecond latency.
