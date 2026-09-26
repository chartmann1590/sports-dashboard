/**
 * OpenAPI 3.0.3 Specification for ArenaPulse Sports Dashboard API
 */

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ArenaPulse Sports Dashboard API',
    version: '1.0.0',
    description: `## 🏟️ Welcome to the ArenaPulse REST API

ArenaPulse provides high-performance, real-time sports data feeds aggregated from public, unauthenticated sports endpoints. 
**No API keys, tokens, or subscriptions required.**

### Key Features
- **Aggregated Scoreboards**: Multi-league live scores, scheduled matchups, and final results in a single call.
- **Deep Game Center Data**: Detailed box scores, play-by-play narrative, scoring timelines, win probability momentum charts, venue conditions, and consensus betting odds.
- **Multi-League Coverage**: NFL, NCAA Football, MLB, NBA, WNBA, NCAA Men's Basketball, NHL, Premier League, MLS, UEFA Champions League, La Liga, Bundesliga, Serie A, and Liga MX.
- **Smart Announcer & TTS**: Real-time play-by-play commentary synthesis with optional on-device Kokoro TTS sidecar.
- **In-Memory Caching**: Intelligent multi-tiered caching ensures sub-millisecond response times and resilient fallback.

### Container & Network Access
- **Host Machine Access**: \`http://localhost:3000\`
- **Container Internal / Healthcheck**: \`http://127.0.0.1:3000\`
- **Docker Compose Service Network**: \`http://sports-dashboard:3000\`
`,
    contact: {
      name: 'ArenaPulse Sports Team',
      url: 'https://github.com/chartmann1590/sports-dashboard'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: '/',
      description: 'Current Host (Direct container, reverse proxy, or localhost)'
    },
    {
      url: 'http://localhost:3000',
      description: 'Default Local Development / Docker Host Port'
    }
  ],
  tags: [
    {
      name: 'System',
      description: 'Service health check, uptime, and OpenAPI specification'
    },
    {
      name: 'Leagues',
      description: 'Supported leagues configuration, categories, and identifiers'
    },
    {
      name: 'Scores',
      description: 'Live scores, schedules, and scoreboards across all or individual leagues'
    },
    {
      name: 'Games',
      description: 'Deep game summaries, box scores, play-by-play, stats, and odds'
    },
    {
      name: 'News',
      description: 'League news headlines, articles, and media'
    },
    {
      name: 'Audio & Announcer',
      description: 'Play-by-play text-to-speech commentary and sidecar management'
    }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Service Health Check',
        description: 'Returns health status, uptime, and ISO timestamp. Used for container healthchecks and liveness probes.',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Server is healthy and responding',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse'
                },
                example: {
                  status: 'healthy',
                  timestamp: '2026-09-26T13:30:00.000Z',
                  uptime: 124590.93
                }
              }
            }
          }
        }
      }
    },
    '/api/leagues': {
      get: {
        tags: ['Leagues'],
        summary: 'List Supported Sports Leagues',
        description: 'Returns the list of 14 supported leagues across Football, Baseball, Basketball, Hockey, and Soccer with display names and icons.',
        operationId: 'getLeagues',
        responses: {
          '200': {
            description: 'List of leagues supported by the dashboard',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LeaguesResponse'
                },
                example: {
                  leagues: [
                    { id: 'nfl', sport: 'football', league: 'nfl', name: 'NFL', category: 'Football', icon: '🏈' },
                    { id: 'college-football', sport: 'football', league: 'college-football', name: 'NCAA Football', category: 'Football', icon: '🎓' },
                    { id: 'mlb', sport: 'baseball', league: 'mlb', name: 'MLB', category: 'Baseball', icon: '⚾' },
                    { id: 'nba', sport: 'basketball', league: 'nba', name: 'NBA', category: 'Basketball', icon: '🏀' },
                    { id: 'wnba', sport: 'basketball', league: 'wnba', name: 'WNBA', category: 'Basketball', icon: '🏀' },
                    { id: 'mens-college-basketball', sport: 'basketball', league: 'mens-college-basketball', name: 'NCAA Basketball', category: 'Basketball', icon: '🎓' },
                    { id: 'nhl', sport: 'hockey', league: 'nhl', name: 'NHL', category: 'Hockey', icon: '🏒' },
                    { id: 'eng.1', sport: 'soccer', league: 'eng.1', name: 'Premier League', category: 'Soccer', icon: '⚽' },
                    { id: 'usa.1', sport: 'soccer', league: 'usa.1', name: 'MLS', category: 'Soccer', icon: '⚽' },
                    { id: 'uefa.champions', sport: 'soccer', league: 'uefa.champions', name: 'Champions League', category: 'Soccer', icon: '🏆' },
                    { id: 'esp.1', sport: 'soccer', league: 'esp.1', name: 'La Liga', category: 'Soccer', icon: '⚽' },
                    { id: 'ger.1', sport: 'soccer', league: 'ger.1', name: 'Bundesliga', category: 'Soccer', icon: '⚽' },
                    { id: 'ita.1', sport: 'soccer', league: 'ita.1', name: 'Serie A', category: 'Soccer', icon: '⚽' },
                    { id: 'mex.1', sport: 'soccer', league: 'mex.1', name: 'Liga MX', category: 'Soccer', icon: '⚽' }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/api/scores/all': {
      get: {
        tags: ['Scores'],
        summary: 'Aggregated Scoreboard (All Leagues)',
        description: 'Queries and merges live, scheduled, and completed games across all supported leagues concurrently. Games are normalized and pre-sorted with live games first, scheduled games next, and final games last.',
        operationId: 'getAllScores',
        parameters: [
          {
            name: 'date',
            in: 'query',
            required: false,
            description: 'Date filter in YYYYMMDD or YYYY-MM-DD format (e.g. 20260926 or 2026-09-26). Defaults to today.',
            schema: {
              type: 'string',
              example: '20260926'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Aggregated score results across all sports leagues',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AllScoresResponse'
                }
              }
            }
          },
          '500': {
            description: 'Internal server or feed retrieval error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/scores': {
      get: {
        tags: ['Scores'],
        summary: 'League-Specific Scoreboard',
        description: 'Fetches games and scoreboard metadata for a single specific league. Sport is automatically resolved if omitted.',
        operationId: 'getLeagueScores',
        parameters: [
          {
            name: 'league',
            in: 'query',
            required: false,
            description: 'League identifier slug (e.g. nfl, mlb, nba, eng.1, college-football, nhl). Default is "nfl".',
            schema: {
              type: 'string',
              default: 'nfl',
              example: 'nfl'
            }
          },
          {
            name: 'sport',
            in: 'query',
            required: false,
            description: 'Sport category (e.g. football, baseball, basketball, hockey, soccer). Inferred from league if omitted.',
            schema: {
              type: 'string',
              example: 'football'
            }
          },
          {
            name: 'date',
            in: 'query',
            required: false,
            description: 'Date in YYYYMMDD or YYYY-MM-DD format.',
            schema: {
              type: 'string',
              example: '20260926'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Scoreboard data and normalized events for the league',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ScoreboardResponse'
                }
              }
            }
          },
          '500': {
            description: 'Internal server or feed retrieval error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/game/{sport}/{league}/{id}': {
      get: {
        tags: ['Games'],
        summary: 'Deep Game Details by Sport, League, and Event ID',
        description: 'Fetches comprehensive game data: scoring plays chronology, drive breakdowns, team box scores, player statistics, win probability momentum curve, venue, weather, and betting odds.',
        operationId: 'getGameSummaryExplicit',
        parameters: [
          {
            name: 'sport',
            in: 'path',
            required: true,
            description: 'Sport name (e.g. football, baseball, basketball, hockey, soccer).',
            schema: {
              type: 'string',
              example: 'football'
            }
          },
          {
            name: 'league',
            in: 'path',
            required: true,
            description: 'League slug (e.g. nfl, college-football, mlb, nba, eng.1).',
            schema: {
              type: 'string',
              example: 'nfl'
            }
          },
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ESPN event / game ID (e.g. 401547432).',
            schema: {
              type: 'string',
              example: '401547432'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Full deep game summary and statistics',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GameSummaryResponse'
                }
              }
            }
          },
          '500': {
            description: 'Internal server error or game not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/game/{league}/{id}': {
      get: {
        tags: ['Games'],
        summary: 'Deep Game Details by League and Event ID',
        description: 'Convenience endpoint for deep game summary. Automatically resolves the parent sport category from the league identifier.',
        operationId: 'getGameSummaryShort',
        parameters: [
          {
            name: 'league',
            in: 'path',
            required: true,
            description: 'League slug (e.g. nfl, college-football, mlb, nba, eng.1, nhl).',
            schema: {
              type: 'string',
              example: 'nfl'
            }
          },
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ESPN event / game ID (e.g. 401547432).',
            schema: {
              type: 'string',
              example: '401547432'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Full deep game summary and statistics',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GameSummaryResponse'
                }
              }
            }
          },
          '500': {
            description: 'Internal server error or game not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/news': {
      get: {
        tags: ['News'],
        summary: 'Sports News & Headlines',
        description: 'Fetches top sports headlines, articles, photos, and recap stories from ESPN feeds for a specified league.',
        operationId: 'getNews',
        parameters: [
          {
            name: 'league',
            in: 'query',
            required: false,
            description: 'League slug (default: nfl).',
            schema: {
              type: 'string',
              default: 'nfl',
              example: 'nfl'
            }
          },
          {
            name: 'sport',
            in: 'query',
            required: false,
            description: 'Sport name (auto-resolved if omitted).',
            schema: {
              type: 'string',
              example: 'football'
            }
          }
        ],
        responses: {
          '200': {
            description: 'List of news articles and headlines',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/NewsResponse'
                }
              }
            }
          },
          '500': {
            description: 'Internal server or feed retrieval error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/tts/health': {
      get: {
        tags: ['Audio & Announcer'],
        summary: 'Announcer TTS Sidecar Health & Status',
        description: 'Checks if the optional Kokoro on-device TTS sidecar is active and ready to synthesize play-by-play speech.',
        operationId: 'getTTSHealth',
        responses: {
          '200': {
            description: 'Kokoro TTS sidecar is healthy and reachable',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    available: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          '503': {
            description: 'TTS sidecar is not configured or unreachable',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    available: { type: 'boolean', example: false },
                    reason: { type: 'string', example: 'TTS sidecar not configured' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/tts': {
      post: {
        tags: ['Audio & Announcer'],
        summary: 'Synthesize Announcer Play-by-Play Speech (WAV)',
        description: 'Synthesizes play-by-play commentary text into natural human-like speech using the on-device Kokoro TTS container. Returns binary audio/wav. Requires the "tts" Docker Compose profile.',
        operationId: 'synthesizeSpeech',
        requestBody: {
          required: true,
          description: 'TTS synthesis payload with commentary text and speech options',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TTSRequest'
              },
              example: {
                text: 'TOUCHDOWN Kansas City Chiefs! Patrick Mahomes connects on a 42 yard pass to Travis Kelce!',
                speed: 1.05,
                voice: 'am_michael'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Synthesized WAV audio stream',
            content: {
              'audio/wav': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          },
          '400': {
            description: 'Invalid input parameters (text missing or too long)',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                },
                example: {
                  error: 'text must be a non-empty string'
                }
              }
            }
          },
          '502': {
            description: 'Upstream TTS synthesis failure',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '503': {
            description: 'TTS sidecar not configured',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    available: { type: 'boolean', example: false },
                    reason: { type: 'string', example: 'TTS sidecar not configured' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/openapi.json': {
      get: {
        tags: ['System'],
        summary: 'OpenAPI 3.0.3 Specification Document',
        description: 'Returns the raw OpenAPI 3.0.3 JSON document describing all ArenaPulse API endpoints, models, parameters, and examples.',
        operationId: 'getOpenApiSpec',
        responses: {
          '200': {
            description: 'The OpenAPI 3.0.3 specification JSON',
            content: {
              'application/json': {
                schema: {
                  type: 'object'
                }
              }
            }
          }
        }
      }
    },
    '/api': {
      get: {
        tags: ['System'],
        summary: 'API Root & Endpoint Directory',
        description: 'Returns a complete machine-readable directory of API endpoints, versions, documentation links, and sample queries. When accessed from a web browser, automatically redirects to the interactive Swagger UI at /api/docs.',
        operationId: 'getApiDirectory',
        responses: {
          '200': {
            description: 'API directory and metadata',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiDirectoryResponse'
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'healthy' },
          timestamp: { type: 'string', format: 'date-time', example: '2026-09-26T13:30:00.000Z' },
          uptime: { type: 'number', description: 'Server uptime in seconds', example: 124590.93 }
        },
        required: ['status', 'timestamp', 'uptime']
      },
      League: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'nfl' },
          sport: { type: 'string', example: 'football' },
          league: { type: 'string', example: 'nfl' },
          name: { type: 'string', example: 'NFL' },
          category: { type: 'string', example: 'Football' },
          icon: { type: 'string', example: '🏈' }
        },
        required: ['id', 'sport', 'league', 'name', 'category', 'icon']
      },
      LeaguesResponse: {
        type: 'object',
        properties: {
          leagues: {
            type: 'array',
            items: { $ref: '#/components/schemas/League' }
          }
        },
        required: ['leagues']
      },
      CompetitorTeam: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '12' },
          name: { type: 'string', example: 'Kansas City Chiefs' },
          displayName: { type: 'string', example: 'Kansas City Chiefs' },
          shortDisplayName: { type: 'string', example: 'Chiefs' },
          abbreviation: { type: 'string', example: 'KC' },
          logo: { type: 'string', format: 'uri', example: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },
          color: { type: 'string', example: '#e31837' },
          alternateColor: { type: 'string', example: '#ffb81c' },
          score: { type: 'integer', example: 27 },
          recordSummary: { type: 'string', example: '3-0' },
          rank: { type: 'integer', nullable: true, example: null },
          winner: { type: 'boolean', nullable: true, example: true }
        }
      },
      GameStatus: {
        type: 'object',
        properties: {
          state: { type: 'string', enum: ['pre', 'in', 'post'], example: 'in' },
          detail: { type: 'string', example: '4th - 2:15' },
          shortDetail: { type: 'string', example: '2:15 - 4th' },
          period: { type: 'integer', example: 4 },
          clock: { type: 'string', example: '2:15' },
          isLive: { type: 'boolean', example: true },
          isFinal: { type: 'boolean', example: false },
          isScheduled: { type: 'boolean', example: false },
          isPostponed: { type: 'boolean', example: false },
          isDelayed: { type: 'boolean', example: false }
        }
      },
      GameEvent: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '401547432' },
          uid: { type: 'string', example: 's:20~l:28~e:401547432' },
          date: { type: 'string', format: 'date-time', example: '2026-09-26T20:15:00Z' },
          name: { type: 'string', example: 'Kansas City Chiefs at Baltimore Ravens' },
          shortName: { type: 'string', example: 'KC @ BAL' },
          sport: { type: 'string', example: 'football' },
          league: { type: 'string', example: 'nfl' },
          leagueName: { type: 'string', example: 'NFL' },
          status: { $ref: '#/components/schemas/GameStatus' },
          homeTeam: { $ref: '#/components/schemas/CompetitorTeam' },
          awayTeam: { $ref: '#/components/schemas/CompetitorTeam' },
          venue: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'M&T Bank Stadium' },
              city: { type: 'string', example: 'Baltimore' },
              state: { type: 'string', example: 'MD' },
              indoor: { type: 'boolean', example: false }
            }
          },
          broadcast: { type: 'string', example: 'NBC, Peacock' },
          odds: {
            type: 'object',
            properties: {
              details: { type: 'string', example: 'BAL -3.0' },
              overUnder: { type: 'number', example: 47.5 },
              spread: { type: 'number', example: -3.0 },
              provider: { type: 'string', example: 'ESPN BET' }
            }
          },
          situation: {
            type: 'object',
            description: 'In-game situational indicators (down, distance, possession, diamond runners, minutes)'
          },
          leaders: {
            type: 'array',
            items: { type: 'object' },
            description: 'Category leaders (passing, rushing, scoring, etc.)'
          }
        }
      },
      AllScoresResponse: {
        type: 'object',
        properties: {
          stats: {
            type: 'object',
            properties: {
              totalGames: { type: 'integer', example: 38 },
              liveTotal: { type: 'integer', example: 6 },
              upcomingTotal: { type: 'integer', example: 20 },
              finalTotal: { type: 'integer', example: 12 },
              timestamp: { type: 'string', format: 'date-time', example: '2026-09-26T13:30:00.000Z' }
            }
          },
          leagues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'nfl' },
                name: { type: 'string', example: 'NFL' },
                sport: { type: 'string', example: 'football' },
                category: { type: 'string', example: 'Football' },
                icon: { type: 'string', example: '🏈' },
                totalCount: { type: 'integer', example: 16 },
                liveCount: { type: 'integer', example: 3 },
                upcomingCount: { type: 'integer', example: 8 },
                finalCount: { type: 'integer', example: 5 }
              }
            }
          },
          games: {
            type: 'array',
            items: { $ref: '#/components/schemas/GameEvent' }
          }
        },
        required: ['stats', 'leagues', 'games']
      },
      ScoreboardResponse: {
        type: 'object',
        properties: {
          league: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'nfl' },
              sport: { type: 'string', example: 'football' },
              name: { type: 'string', example: 'NFL' },
              abbreviation: { type: 'string', example: 'NFL' }
            }
          },
          day: { type: 'object' },
          events: {
            type: 'array',
            items: { $ref: '#/components/schemas/GameEvent' }
          },
          error: { type: 'string', nullable: true }
        },
        required: ['league', 'events']
      },
      GameSummaryResponse: {
        type: 'object',
        properties: {
          venue: { type: 'object' },
          weather: { type: 'object' },
          officials: { type: 'array', items: { type: 'object' } },
          attendance: { type: 'integer', example: 71008 },
          broadcasts: { type: 'array', items: { type: 'object' } },
          odds: { type: 'object' },
          predictor: { type: 'object' },
          winProbability: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                homeWinPercentage: { type: 'number', example: 0.65 },
                playId: { type: 'string' },
                secondsLeft: { type: 'integer' }
              }
            }
          },
          scoringPlays: { type: 'array', items: { type: 'object' } },
          boxscore: { type: 'object', description: 'Side-by-side team statistics and player tables' },
          plays: { type: 'array', items: { type: 'object' }, description: 'Full chronological play-by-play' },
          drives: { type: 'object', description: 'Drive-by-drive breakdown' },
          header: { type: 'object' },
          leaders: { type: 'array', items: { type: 'object' } },
          recap: { type: 'object', description: 'Post-game editorial recap story and headline' },
          news: { type: 'array', items: { type: 'object' } },
          tvPlays: { type: 'array', items: { type: 'object' }, description: 'Normalized animation-ready TV plays' }
        }
      },
      NewsArticle: {
        type: 'object',
        properties: {
          headline: { type: 'string', example: 'Chiefs edge Ravens in overtime thriller' },
          description: { type: 'string', example: 'Patrick Mahomes throws game-winning touchdown pass in OT.' },
          published: { type: 'string', format: 'date-time', example: '2026-09-26T23:45:00Z' },
          byline: { type: 'string', example: 'Adam Schefter, ESPN Senior NFL Insider' },
          links: { type: 'object' },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: { type: 'string', format: 'uri' },
                caption: { type: 'string' }
              }
            }
          }
        }
      },
      NewsResponse: {
        type: 'object',
        properties: {
          articles: {
            type: 'array',
            items: { $ref: '#/components/schemas/NewsArticle' }
          }
        },
        required: ['articles']
      },
      TTSRequest: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Commentary script to synthesize into audio',
            maxLength: 1000,
            minLength: 1,
            example: 'Touchdown Kansas City! 42 yard pass to Travis Kelce!'
          },
          speed: {
            type: 'number',
            description: 'Speech speed multiplier (0.5 to 2.0)',
            default: 1.0,
            example: 1.05
          },
          voice: {
            type: 'string',
            description: 'Kokoro voice identifier',
            default: 'am_michael',
            example: 'am_michael'
          }
        },
        required: ['text']
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'ESPN API returned 404: Not Found' }
        },
        required: ['error']
      },
      ApiDirectoryResponse: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'ArenaPulse Sports Dashboard API' },
          version: { type: 'string', example: '1.0.0' },
          description: { type: 'string' },
          documentation: {
            type: 'object',
            properties: {
              interactive: { type: 'string', example: '/api/docs' },
              openapi_json: { type: 'string', example: '/api/openapi.json' },
              markdown_guide: { type: 'string', example: '/API.md' }
            }
          },
          endpoints: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                method: { type: 'string', example: 'GET' },
                path: { type: 'string', example: '/api/scores/all' },
                description: { type: 'string' },
                params: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    }
  }
};
