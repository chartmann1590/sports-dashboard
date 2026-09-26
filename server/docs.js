import express from 'express';
import swaggerUiDist from 'swagger-ui-dist';
import { openapiSpec } from './openapi.js';

/**
 * Custom dark athletic theme HTML for Swagger UI matching ArenaPulse's aesthetic
 */
function renderSwaggerDocsHtml() {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ArenaPulse REST API — Interactive Documentation</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" type="text/css" href="/api/docs/swagger-ui/swagger-ui.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #07090e;
      --card-dark: #0d121f;
      --card-subtle: #111827;
      --border-dark: #1e293b;
      --border-hover: #334155;
      --text-primary: #f8fafc;
      --text-muted: #94a3b8;
      --accent-cyan: #06b6d4;
      --accent-blue: #3b82f6;
      --accent-emerald: #10b981;
      --accent-amber: #f59e0b;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg-dark);
      color: var(--text-primary);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* Custom Header Bar */
    .ap-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(7, 9, 14, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-dark);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .ap-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--text-primary);
    }

    .ap-logo {
      font-size: 24px;
      line-height: 1;
      filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.4));
    }

    .ap-title {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #ffffff 40%, var(--accent-cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .ap-badge {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 8px;
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.35);
      color: var(--accent-cyan);
      border-radius: 9999px;
    }

    .ap-nav {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .ap-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.15s ease;
      cursor: pointer;
      border: 1px solid var(--border-dark);
      background: var(--card-subtle);
      color: var(--text-muted);
    }

    .ap-btn:hover {
      background: #1e293b;
      color: #ffffff;
      border-color: var(--border-hover);
    }

    .ap-btn-primary {
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2));
      border: 1px solid rgba(6, 182, 212, 0.4);
      color: #38bdf8;
    }

    .ap-btn-primary:hover {
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.35), rgba(59, 130, 246, 0.35));
      color: #ffffff;
      border-color: #38bdf8;
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.25);
    }

    /* Swagger UI Dark Mode Theming Overrides */
    .swagger-ui {
      color: var(--text-primary);
      font-family: inherit;
    }

    .swagger-ui .wrapper {
      max-width: 1200px;
      padding: 0 20px;
    }

    .swagger-ui .topbar {
      display: none;
    }

    .swagger-ui .info {
      margin: 30px 0;
    }

    .swagger-ui .info .title {
      color: #ffffff !important;
      font-weight: 800;
      font-size: 2rem;
      letter-spacing: -0.02em;
    }

    .swagger-ui .info p,
    .swagger-ui .info li,
    .swagger-ui .info td {
      color: var(--text-muted) !important;
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .swagger-ui .info h1,
    .swagger-ui .info h2,
    .swagger-ui .info h3,
    .swagger-ui .info h4 {
      color: #f1f5f9 !important;
    }

    .swagger-ui .info a {
      color: var(--accent-cyan) !important;
      text-decoration: underline;
    }

    .swagger-ui .scheme-container {
      background: var(--card-dark) !important;
      box-shadow: none !important;
      border: 1px solid var(--border-dark) !important;
      border-radius: 12px;
      padding: 16px !important;
      margin-bottom: 24px !important;
    }

    .swagger-ui .opblock-tag {
      color: #ffffff !important;
      font-size: 1.25rem !important;
      font-weight: 700 !important;
      border-bottom: 1px solid var(--border-dark) !important;
      padding: 14px 0 !important;
      margin: 24px 0 12px 0 !important;
    }

    .swagger-ui .opblock-tag small {
      color: var(--text-muted) !important;
      font-weight: 400 !important;
      margin-left: 10px;
    }

    /* Operation Blocks */
    .swagger-ui .opblock {
      background: var(--card-dark) !important;
      border: 1px solid var(--border-dark) !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
      margin: 0 0 14px 0 !important;
      transition: border-color 0.15s ease;
    }

    .swagger-ui .opblock:hover {
      border-color: var(--border-hover) !important;
    }

    .swagger-ui .opblock .opblock-summary {
      padding: 10px 16px !important;
    }

    .swagger-ui .opblock .opblock-summary-method {
      border-radius: 8px !important;
      font-weight: 800 !important;
      font-size: 0.75rem !important;
      padding: 5px 12px !important;
      text-shadow: none !important;
    }

    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: rgba(6, 182, 212, 0.2) !important;
      color: #38bdf8 !important;
      border: 1px solid rgba(6, 182, 212, 0.4) !important;
    }

    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: rgba(16, 185, 129, 0.2) !important;
      color: #34d399 !important;
      border: 1px solid rgba(16, 185, 129, 0.4) !important;
    }

    .swagger-ui .opblock .opblock-summary-path {
      color: #f1f5f9 !important;
      font-family: 'JetBrains Mono', monospace !important;
      font-weight: 600 !important;
      font-size: 0.9rem !important;
    }

    .swagger-ui .opblock .opblock-summary-description {
      color: var(--text-muted) !important;
      font-size: 0.85rem !important;
    }

    .swagger-ui .opblock-body {
      background: #090e1a !important;
      border-top: 1px solid var(--border-dark) !important;
      border-radius: 0 0 12px 12px !important;
      padding: 16px !important;
    }

    .swagger-ui .opblock-section-header {
      background: transparent !important;
      box-shadow: none !important;
      border-bottom: 1px solid var(--border-dark) !important;
      padding: 10px 0 !important;
    }

    .swagger-ui .opblock-section-header h4 {
      color: #e2e8f0 !important;
      font-weight: 700 !important;
      font-size: 0.9rem !important;
    }

    .swagger-ui .tabheader-title {
      color: var(--text-muted) !important;
    }

    .swagger-ui table.parameters {
      border-collapse: collapse;
    }

    .swagger-ui table thead tr th {
      color: #94a3b8 !important;
      border-bottom: 1px solid var(--border-dark) !important;
      font-size: 0.75rem !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
    }

    .swagger-ui table tbody tr td {
      border-bottom: 1px solid rgba(30, 41, 59, 0.6) !important;
      color: #e2e8f0 !important;
    }

    .swagger-ui .parameter__name {
      color: #38bdf8 !important;
      font-family: 'JetBrains Mono', monospace !important;
      font-weight: 600 !important;
      font-size: 0.85rem !important;
    }

    .swagger-ui .parameter__type {
      color: #a855f7 !important;
      font-family: 'JetBrains Mono', monospace !important;
      font-size: 0.75rem !important;
    }

    .swagger-ui .parameter__deprecated {
      color: #ef4444 !important;
    }

    .swagger-ui .parameter__in {
      color: #64748b !important;
      font-style: italic;
    }

    .swagger-ui input[type=text],
    .swagger-ui textarea,
    .swagger-ui select {
      background: #0f172a !important;
      border: 1px solid var(--border-dark) !important;
      color: #f8fafc !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
      font-family: 'JetBrains Mono', monospace !important;
      font-size: 0.85rem !important;
    }

    .swagger-ui input[type=text]:focus,
    .swagger-ui textarea:focus,
    .swagger-ui select:focus {
      border-color: var(--accent-cyan) !important;
      outline: none !important;
      box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2) !important;
    }

    .swagger-ui .btn.execute {
      background: linear-gradient(135deg, #0284c7, #2563eb) !important;
      border: none !important;
      color: #ffffff !important;
      border-radius: 8px !important;
      font-weight: 700 !important;
      letter-spacing: 0.03em !important;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3) !important;
      transition: all 0.15s ease !important;
    }

    .swagger-ui .btn.execute:hover {
      box-shadow: 0 6px 16px rgba(2, 132, 199, 0.5) !important;
      transform: translateY(-1px);
    }

    .swagger-ui .btn.try-out__btn {
      background: #1e293b !important;
      border: 1px solid #334155 !important;
      color: #38bdf8 !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
    }

    .swagger-ui .btn.cancel {
      border: 1px solid #ef4444 !important;
      color: #ef4444 !important;
      background: rgba(239, 68, 68, 0.1) !important;
      border-radius: 8px !important;
    }

    .swagger-ui .btn.authorize {
      color: var(--accent-cyan) !important;
      border-color: var(--accent-cyan) !important;
    }

    .swagger-ui .responses-inner {
      background: transparent !important;
      padding: 0 !important;
    }

    .swagger-ui .response-col_status {
      color: #f1f5f9 !important;
      font-family: 'JetBrains Mono', monospace !important;
      font-weight: 700 !important;
    }

    .swagger-ui .response-col_description {
      color: var(--text-muted) !important;
    }

    .swagger-ui .highlight-code pre,
    .swagger-ui pre.microlight {
      background: #060911 !important;
      border: 1px solid var(--border-dark) !important;
      border-radius: 8px !important;
      color: #e2e8f0 !important;
      font-family: 'JetBrains Mono', monospace !important;
      font-size: 0.85rem !important;
    }

    .swagger-ui section.models {
      background: var(--card-dark) !important;
      border: 1px solid var(--border-dark) !important;
      border-radius: 12px !important;
      margin: 30px 0 !important;
    }

    .swagger-ui section.models h4 {
      color: #f1f5f9 !important;
      border-bottom: 1px solid var(--border-dark) !important;
    }

    .swagger-ui .model-box {
      background: #090e1a !important;
    }

    .swagger-ui .model-title {
      color: #38bdf8 !important;
      font-family: 'JetBrains Mono', monospace !important;
    }

    .swagger-ui .model {
      color: #cbd5e1 !important;
    }

    .swagger-ui .prop-type {
      color: #a855f7 !important;
    }

    .swagger-ui .prop-format {
      color: #64748b !important;
    }

    .swagger-ui svg.arrow {
      fill: #94a3b8 !important;
    }
  </style>
</head>
<body>
  <header class="ap-header">
    <a href="/" class="ap-brand">
      <span class="ap-logo">🏟️</span>
      <span class="ap-title">ArenaPulse</span>
      <span class="ap-badge">REST API v1.0.0</span>
    </a>
    <nav class="ap-nav">
      <a href="/" class="ap-btn ap-btn-primary">
        <span>⚡</span>
        <span>Open Live App</span>
      </a>
      <a href="/api/openapi.json" target="_blank" class="ap-btn">
        <span>📄</span>
        <span>OpenAPI JSON</span>
      </a>
      <a href="/api/scores/all" target="_blank" class="ap-btn">
        <span>📊</span>
        <span>Live Scores</span>
      </a>
      <a href="/api/health" target="_blank" class="ap-btn">
        <span>🟢</span>
        <span>Health</span>
      </a>
      <a href="https://github.com/chartmann1590/sports-dashboard" target="_blank" rel="noopener noreferrer" class="ap-btn">
        <span>🐙</span>
        <span>GitHub</span>
      </a>
    </nav>
  </header>

  <div id="swagger-ui"></div>

  <script src="/api/docs/swagger-ui/swagger-ui-bundle.js"></script>
  <script src="/api/docs/swagger-ui/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: "list",
        displayRequestDuration: true,
        persistAuthorization: true,
        showExtensions: true,
        showCommonExtensions: true
      });
    };
  </script>
</body>
</html>`;
}

/**
 * Configure Swagger UI and API Documentation routes on Express app
 */
export function setupApiDocs(app) {
  // 1. Static assets from swagger-ui-dist
  const swaggerDistPath = swaggerUiDist.getAbsoluteFSPath();
  app.use('/api/docs/swagger-ui', express.static(swaggerDistPath, {
    maxAge: '1d',
    index: false
  }));

  // 2. OpenAPI Specification JSON endpoint
  app.get('/api/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(openapiSpec);
  });

  // Alias for swagger.json
  app.get('/api/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(openapiSpec);
  });

  // 3. Interactive Documentation UI (/api/docs and /api/docs/)
  app.get(['/api/docs', '/api/docs/'], (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(renderSwaggerDocsHtml());
  });

  // 4. Convenience redirect from /docs to /api/docs
  app.get(['/docs', '/docs/'], (req, res) => {
    res.redirect(301, '/api/docs');
  });

  // 5. Root API endpoint directory (/api)
  app.get('/api', (req, res) => {
    // If a web browser requested HTML, redirect to interactive docs
    const acceptHeader = req.headers['accept'] || '';
    if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
      return res.redirect('/api/docs');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      name: 'ArenaPulse Sports Dashboard API',
      version: '1.0.0',
      description: 'Real-time Multi-Sport Dashboard with Free Live Data, Box Scores, Play-by-Play, and TV Jumbotron Mode',
      status: 'online',
      documentation: {
        interactive: '/api/docs',
        openapi_spec: '/api/openapi.json',
        swagger_spec: '/api/swagger.json',
        markdown_guide: 'https://github.com/chartmann1590/sports-dashboard/blob/main/API.md'
      },
      endpoints: {
        health: {
          method: 'GET',
          path: '/api/health',
          description: 'Server health check, timestamp, and uptime status'
        },
        leagues: {
          method: 'GET',
          path: '/api/leagues',
          description: 'List of all 14 supported sports leagues across 5 categories'
        },
        allScores: {
          method: 'GET',
          path: '/api/scores/all',
          description: 'Aggregated live and upcoming scores across all leagues',
          queryParams: {
            date: 'Date in YYYYMMDD or YYYY-MM-DD (e.g. ?date=20260926)'
          }
        },
        leagueScores: {
          method: 'GET',
          path: '/api/scores',
          description: 'League-specific scoreboard and events',
          queryParams: {
            league: 'League ID (e.g. nfl, mlb, nba, eng.1)',
            sport: 'Sport slug (optional, auto-inferred)',
            date: 'Date in YYYYMMDD or YYYY-MM-DD'
          }
        },
        gameSummary: {
          method: 'GET',
          path: '/api/game/:sport/:league/:id',
          description: 'Deep game summary, scoring timeline, boxscore, plays, odds, and recap'
        },
        gameSummaryShort: {
          method: 'GET',
          path: '/api/game/:league/:id',
          description: 'Deep game summary with auto-resolved sport'
        },
        news: {
          method: 'GET',
          path: '/api/news',
          description: 'Top sports news headlines and articles',
          queryParams: {
            league: 'League ID (default: nfl)',
            sport: 'Sport slug (optional, auto-inferred)'
          }
        },
        ttsHealth: {
          method: 'GET',
          path: '/api/tts/health',
          description: 'Check Kokoro on-device TTS sidecar availability'
        },
        ttsSynthesize: {
          method: 'POST',
          path: '/api/tts',
          description: 'Synthesize announcer play-by-play speech (WAV audio)'
        }
      }
    });
  });
}
