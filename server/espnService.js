import { cache } from './cache.js';
import { normalizeTVPlays } from './tvPlays.js';

export const LEAGUES_CONFIG = [
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
  { id: 'mex.1', sport: 'soccer', league: 'mex.1', name: 'Liga MX', category: 'Soccer', icon: '⚽' },
];

/**
 * Resolve sport and league from configuration, inferring sport if omitted or mismatched
 */
export function resolveSportAndLeague(sport, league) {
  if (!league && sport) {
    const match = LEAGUES_CONFIG.find(l => l.id === sport.toLowerCase() || l.league === sport.toLowerCase());
    if (match) {
      return { sport: match.sport, league: match.league };
    }
  }

  const targetLeague = (league || sport || 'nfl').toLowerCase();
  const match = LEAGUES_CONFIG.find(l => l.id === targetLeague || l.league === targetLeague);
  if (match) {
    return { sport: match.sport, league: match.league };
  }

  return {
    sport: (sport || 'football').toLowerCase(),
    league: targetLeague
  };
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// AccuWeather Condition Mapping used by ESPN
const WEATHER_CONDITIONS = {
  '1': 'Sunny',
  '2': 'Mostly Sunny',
  '3': 'Partly Sunny',
  '4': 'Clear',
  '5': 'Mostly Clear',
  '6': 'Partly Cloudy',
  '7': 'Intermittent Clouds',
  '8': 'Mostly Cloudy',
  '11': 'Fog',
  '12': 'Showers',
  '13': 'Mostly Cloudy w/ Showers',
  '14': 'Partly Sunny w/ Showers',
  '15': 'Thunderstorms',
  '16': 'Mostly Cloudy w/ Thunderstorms',
  '17': 'Partly Sunny w/ Thunderstorms',
  '18': 'Rain',
  '19': 'Flurries',
  '20': 'Mostly Cloudy w/ Flurries',
  '21': 'Partly Sunny w/ Flurries',
  '22': 'Snow',
  '23': 'Mostly Cloudy w/ Snow',
  '24': 'Ice',
  '25': 'Sleet',
  '26': 'Freezing Rain',
  '29': 'Rain & Snow',
  '30': 'Hot',
  '31': 'Cold',
  '32': 'Windy'
};

// WMO Weather code mapping for Open-Meteo
const WMO_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Heavy Thunderstorm'
};

/**
 * Fetch live weather from free Open-Meteo for any city/venue
 */
async function getLiveWeatherFallback(city) {
  if (!city) return null;
  const cacheKey = `weather:city:${city.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'SportsPulse/1.0' } });
    const geoData = await geoRes.json();

    if (!geoData.results?.length) return null;
    const { latitude, longitude } = geoData.results[0];

    const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`;
    const wRes = await fetch(wUrl, { headers: { 'User-Agent': 'SportsPulse/1.0' } });
    const wData = await wRes.json();

    const cur = wData.current;
    if (!cur) return null;

    const weather = {
      temperature: Math.round(cur.temperature_2m),
      condition: WMO_CODES[cur.weather_code] || 'Fair',
      conditionId: String(cur.weather_code),
      wind: `${Math.round(cur.wind_speed_10m)} mph`,
      humidity: `${cur.relative_humidity_2m}%`,
      precipitation: null,
      indoor: false,
      displayValue: `${Math.round(cur.temperature_2m)}°F • ${WMO_CODES[cur.weather_code] || 'Fair'}`
    };

    // Cache for 1 hour
    cache.set(cacheKey, weather, 3600);
    return weather;
  } catch (err) {
    return null;
  }
}

/**
 * Format and normalize weather from ESPN or live fallback
 */
async function resolveWeather(venue, rawWeather) {
  const isIndoor = Boolean(venue?.indoor);

  // If ESPN provided weather
  if (rawWeather && (rawWeather.temperature !== undefined || rawWeather.displayValue)) {
    const condition = WEATHER_CONDITIONS[rawWeather.conditionId] || rawWeather.condition || (rawWeather.conditionId ? 'Fair' : '');
    const temp = rawWeather.temperature !== undefined ? Math.round(rawWeather.temperature) : null;
    const wind = rawWeather.gust ? `Gusts to ${rawWeather.gust} mph` : (rawWeather.wind ? String(rawWeather.wind) : null);
    const precip = rawWeather.precipitation ? `${rawWeather.precipitation}%` : null;

    let displayValue = '';
    if (isIndoor) {
      displayValue = temp ? `${temp}°F Outside • Dome / Retractable Roof` : 'Dome / Climate Controlled (72°F)';
    } else if (temp !== null) {
      displayValue = condition ? `${temp}°F • ${condition}` : `${temp}°F`;
    } else {
      displayValue = rawWeather.displayValue || condition || 'Fair';
    }

    return {
      temperature: temp,
      condition: condition || (isIndoor ? 'Indoor Arena / Dome' : 'Fair'),
      conditionId: rawWeather.conditionId,
      wind,
      precipitation: precip,
      indoor: isIndoor,
      displayValue
    };
  }

  // If venue is indoor dome without weather
  if (isIndoor) {
    return {
      temperature: 72,
      condition: 'Climate Controlled (Dome)',
      conditionId: '4',
      wind: 'Calm (Indoor)',
      precipitation: '0%',
      indoor: true,
      displayValue: 'Climate-Controlled Dome (72°F)'
    };
  }

  // Query live weather fallback via city
  const city = venue?.city || venue?.address?.city;
  if (city) {
    const fallback = await getLiveWeatherFallback(city);
    if (fallback) {
      return {
        ...fallback,
        indoor: false
      };
    }
  }

  return null;
}

async function fetchFromESPN(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Format and normalize a single event into a clean game model
 */
function normalizeEvent(event, sport, league, leagueName) {
  const competition = event.competitions?.[0] || {};
  const competitors = competition.competitors || [];
  
  const homeComp = competitors.find(c => c.homeAway === 'home') || competitors[0] || {};
  const awayComp = competitors.find(c => c.homeAway === 'away') || competitors[1] || {};

  const statusType = event.status?.type || {};
  const state = statusType.state || 'pre'; // 'pre', 'in', 'post'
  const isLive = state === 'in';
  const isFinal = state === 'post' || statusType.completed === true;
  const isScheduled = state === 'pre';

  // Format teams
  const formatTeam = (comp) => {
    const team = comp.team || {};
    return {
      id: team.id,
      name: team.name || team.displayName || 'Team',
      displayName: team.displayName || team.name || 'Team',
      shortDisplayName: team.shortDisplayName || team.abbreviation || team.name,
      abbreviation: team.abbreviation || '',
      logo: team.logo || (team.logos && team.logos[0]?.href) || `https://a.espncdn.com/i/teamlogos/${sport}/500/${team.abbreviation?.toLowerCase()}.png`,
      color: team.color ? `#${team.color}` : '#334155',
      alternateColor: team.alternateColor ? `#${team.alternateColor}` : '#64748b',
      score: comp.score !== undefined ? parseInt(comp.score, 10) || 0 : 0,
      records: comp.records?.map(r => ({ type: r.type, summary: r.summary })) || [],
      recordSummary: comp.records?.find(r => r.type === 'total')?.summary || comp.records?.[0]?.summary || '',
      rank: comp.curatedRank?.current && comp.curatedRank.current <= 25 ? comp.curatedRank.current : null,
      linescores: (comp.linescores || []).map(ls => ls.value),
      isWinner: comp.winner || false,
      homeAway: comp.homeAway
    };
  };

  const homeTeam = formatTeam(homeComp);
  const awayTeam = formatTeam(awayComp);

  // Situation data (down & distance, possession, baseball bases, outs)
  const situation = competition.situation || {};
  const situationData = {
    possession: situation.possession,
    possessionText: situation.possessionText,
    downDistanceText: situation.downDistanceText,
    shortDownDistanceText: situation.shortDownDistanceText,
    yardLine: situation.yardLine,
    isRedZone: situation.isRedZone || false,
    lastPlay: situation.lastPlay?.text || null,
    // Baseball
    balls: situation.balls,
    strikes: situation.strikes,
    outs: situation.outs,
    onFirst: Boolean(situation.onFirst),
    onSecond: Boolean(situation.onSecond),
    onThird: Boolean(situation.onThird),
    batter: situation.batter?.athlete?.displayName,
    pitcher: situation.pitcher?.athlete?.displayName,
  };

  // Broadcasts
  const broadcasts = [];
  if (competition.broadcasts) {
    for (const b of competition.broadcasts) {
      if (b.names) {
        broadcasts.push(...b.names);
      }
    }
  }

  // Odds / Betting
  const oddsData = competition.odds?.[0] || {};
  const odds = {
    details: oddsData.details || null, // e.g. "KC -3.5"
    overUnder: oddsData.overUnder || null, // e.g. 47.5
    spread: oddsData.spread || null,
    provider: oddsData.provider?.name || null
  };

  // Leaders
  const leaders = (competition.leaders || []).map(cat => ({
    name: cat.name,
    displayName: cat.displayName,
    leaders: (cat.leaders || []).map(l => ({
      displayValue: l.displayValue,
      athlete: {
        id: l.athlete?.id,
        name: l.athlete?.displayName,
        shortName: l.athlete?.shortName,
        headshot: l.athlete?.headshot,
        position: l.athlete?.position?.abbreviation,
        teamId: l.team?.id
      }
    }))
  }));

  const venue = competition.venue ? {
    name: competition.venue.fullName,
    city: competition.venue.address?.city,
    state: competition.venue.address?.state,
    indoor: Boolean(competition.venue.indoor)
  } : null;

  // Weather formatting
  let weather = null;
  if (competition.weather) {
    const w = competition.weather;
    const cond = WEATHER_CONDITIONS[w.conditionId] || w.condition || '';
    weather = {
      temperature: w.temperature !== undefined ? Math.round(w.temperature) : null,
      condition: cond,
      displayValue: w.displayValue || (w.temperature ? `${Math.round(w.temperature)}°F • ${cond}` : cond),
      indoor: Boolean(venue?.indoor)
    };
  } else if (venue?.indoor) {
    weather = {
      temperature: 72,
      condition: 'Climate-Controlled Dome',
      displayValue: 'Climate-Controlled (72°F)',
      indoor: true
    };
  }

  return {
    id: event.id,
    uid: event.uid,
    name: event.name,
    shortName: event.shortName,
    date: event.date,
    sport,
    league,
    leagueName: leagueName || event.league?.name || league.toUpperCase(),
    status: {
      state,
      detail: statusType.detail || statusType.description || 'Scheduled',
      shortDetail: statusType.shortDetail || statusType.detail || 'Scheduled',
      completed: isFinal,
      isLive,
      isScheduled,
      isFinal,
      period: event.status?.period || 0,
      clock: event.status?.clock || 0,
      displayClock: event.status?.displayClock || '0:00',
    },
    homeTeam,
    awayTeam,
    situation: situationData,
    broadcasts,
    odds,
    venue,
    weather,
    leaders,
    headlines: competition.headlines?.map(h => ({
      description: h.description,
      type: h.type,
      shortLinkText: h.shortLinkText
    })) || []
  };
}

/**
 * Fetch Scoreboard for a given league and optional date
 */
export async function getScoreboard(sport, league, date = null) {
  const cacheKey = `scoreboard:${sport}:${league}:${date || 'today'}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`;
  if (date) {
    const cleanDate = date.replace(/-/g, '');
    url += `?dates=${cleanDate}`;
  }

  try {
    const rawData = await fetchFromESPN(url);
    const leagueName = rawData.leagues?.[0]?.name || league.toUpperCase();
    const events = (rawData.events || []).map(event => 
      normalizeEvent(event, sport, league, leagueName)
    );

    const result = {
      league: {
        id: league,
        sport,
        name: leagueName,
        abbreviation: rawData.leagues?.[0]?.abbreviation || league.toUpperCase(),
        calendarType: rawData.leagues?.[0]?.calendarType,
        season: rawData.season
      },
      day: rawData.day,
      events
    };

    cache.set(cacheKey, result, 15);
    return result;
  } catch (error) {
    console.error(`Error fetching scoreboard for ${sport}/${league}:`, error.message);
    return {
      league: { id: league, sport, name: league.toUpperCase() },
      events: [],
      error: error.message
    };
  }
}

/**
 * Fetch All Live & Active Sports across primary leagues for today
 */
export async function getAllScores(date = null) {
  const cacheKey = `all-scores:${date || 'today'}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const promises = LEAGUES_CONFIG.map(cfg => 
    getScoreboard(cfg.sport, cfg.league, date).then(res => ({
      config: cfg,
      events: res.events || []
    })).catch(err => ({
      config: cfg,
      events: []
    }))
  );

  const results = await Promise.all(promises);

  let allGames = [];
  const leagueStats = [];

  for (const { config, events } of results) {
    const liveCount = events.filter(e => e.status.isLive).length;
    const upcomingCount = events.filter(e => e.status.isScheduled).length;
    const finalCount = events.filter(e => e.status.isFinal).length;

    leagueStats.push({
      id: config.id,
      name: config.name,
      sport: config.sport,
      league: config.league,
      category: config.category,
      icon: config.icon,
      totalCount: events.length,
      liveCount,
      upcomingCount,
      finalCount
    });

    allGames.push(...events);
  }

  // Sort games: Live first, then Scheduled by start date, then Final
  allGames.sort((a, b) => {
    if (a.status.isLive && !b.status.isLive) return -1;
    if (!a.status.isLive && b.status.isLive) return 1;
    if (a.status.isScheduled && b.status.isFinal) return -1;
    if (a.status.isFinal && b.status.isScheduled) return 1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const liveTotal = allGames.filter(g => g.status.isLive).length;
  const upcomingTotal = allGames.filter(g => g.status.isScheduled).length;
  const finalTotal = allGames.filter(g => g.status.isFinal).length;

  const response = {
    stats: {
      totalGames: allGames.length,
      liveTotal,
      upcomingTotal,
      finalTotal,
      timestamp: new Date().toISOString()
    },
    leagues: leagueStats,
    games: allGames
  };

  cache.set(cacheKey, response, 12);
  return response;
}

/**
 * Fetch Deep Game Summary (Play-by-play, Boxscore, Player Stats, Weather, Odds, Recap, Win Probability)
 */
export async function getGameSummary(sport, league, eventId) {
  const cacheKey = `summary:${sport}:${league}:${eventId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${eventId}`;
  
  try {
    const data = await fetchFromESPN(url);

    // Venue details
    const venue = data.gameInfo?.venue ? {
      name: data.gameInfo.venue.fullName,
      city: data.gameInfo.venue.address?.city,
      state: data.gameInfo.venue.address?.state,
      country: data.gameInfo.venue.address?.country,
      capacity: data.gameInfo.venue.capacity,
      indoor: Boolean(data.gameInfo.venue.indoor)
    } : null;

    // Resolve Weather with deep details & live fallback
    const weather = await resolveWeather(venue, data.gameInfo?.weather);

    // Normalize Boxscore (ensure teams are aligned)
    const boxscore = {
      teams: (data.boxscore?.teams || []).map(t => ({
        team: {
          id: t.team?.id,
          name: t.team?.displayName || t.team?.name,
          abbreviation: t.team?.abbreviation,
          logo: t.team?.logo || (t.team?.logos && t.team.logos[0]?.href),
          color: t.team?.color ? `#${t.team.color}` : null
        },
        statistics: (t.statistics || []).map(s => ({
          name: s.name,
          label: s.label || s.name,
          displayValue: s.displayValue
        }))
      })),
      players: (data.boxscore?.players || []).map(p => ({
        team: {
          id: p.team?.id,
          name: p.team?.displayName || p.team?.name,
          logo: p.team?.logo || (p.team?.logos && p.team.logos[0]?.href)
        },
        statistics: (p.statistics || []).map(cat => ({
          name: cat.name || cat.type || 'Stats',
          labels: cat.labels || [],
          descriptions: cat.descriptions || [],
          athletes: (cat.athletes || []).map(a => ({
            athlete: {
              id: a.athlete?.id,
              name: a.athlete?.displayName,
              shortName: a.athlete?.shortName,
              jersey: a.athlete?.jersey,
              position: a.athlete?.position?.abbreviation,
              headshot: a.athlete?.headshot?.href
            },
            stats: a.stats || []
          }))
        }))
      }))
    };

    // Normalize Plays / Drives
    let plays = [];
    if (data.plays && Array.isArray(data.plays)) {
      plays = data.plays.map(p => ({
        id: p.id,
        text: p.text || p.alternativeText,
        awayScore: p.awayScore,
        homeScore: p.homeScore,
        period: p.period?.displayValue || (p.period?.number ? `Period ${p.period.number}` : ''),
        clock: p.clock?.displayValue,
        scoringPlay: p.scoringPlay || false,
        scoreValue: p.scoreValue,
        team: p.team?.id,
        wallclock: p.wallclock,
        type: p.type?.text || p.type?.description
      }));
    } else if (data.drives) {
      const allDrives = [
        ...(data.drives.previous || []),
        ...(data.drives.current ? [data.drives.current] : [])
      ];
      plays = allDrives.map(drive => ({
        id: drive.id,
        team: drive.team?.displayName,
        teamLogo: drive.team?.logos?.[0]?.href,
        description: drive.description,
        result: drive.result,
        yards: drive.yards,
        playsCount: drive.plays?.length || drive.offensivePlays,
        timeOfPossession: drive.timeOfPossession,
        plays: (drive.plays || []).map(p => ({
          id: p.id,
          text: p.text,
          awayScore: p.awayScore,
          homeScore: p.homeScore,
          clock: p.clock?.displayValue,
          period: p.period?.number,
          downDistance: p.start?.downDistanceText,
          scoringPlay: p.scoringPlay || false
        }))
      }));
    } else if (data.commentary) {
      plays = data.commentary.map(c => ({
        id: c.id,
        text: c.text,
        time: c.time?.displayValue,
        playType: c.playType?.description,
        scoringPlay: c.scoringPlay
      }));
    }

    // Scoring Plays & Key Events (Soccer, Football, Baseball)
    const rawEvents = data.scoringPlays || data.keyEvents || [];
    const scoringPlays = rawEvents.map(sp => {
      const text = sp.text || sp.description || '';
      let eventType = sp.type?.text || sp.type?.description || 'Event';
      
      // Classify event type nicely
      const lower = text.toLowerCase();
      if (lower.includes('goal') || lower.includes('scores')) eventType = 'GOAL';
      else if (lower.includes('yellow card')) eventType = 'YELLOW CARD';
      else if (lower.includes('red card')) eventType = 'RED CARD';
      else if (lower.includes('substitution') || lower.includes('sub')) eventType = 'SUBSTITUTION';
      else if (lower.includes('touchdown') || lower.includes('td')) eventType = 'TOUCHDOWN';
      else if (lower.includes('field goal') || lower.includes('fg')) eventType = 'FIELD GOAL';
      else if (lower.includes('home run')) eventType = 'HOME RUN';

      return {
        id: sp.id,
        text,
        awayScore: sp.awayScore !== undefined && sp.awayScore !== null ? sp.awayScore : null,
        homeScore: sp.homeScore !== undefined && sp.homeScore !== null ? sp.homeScore : null,
        period: sp.period?.displayValue || (sp.period?.number ? `Period ${sp.period.number}` : (sp.clock?.displayValue || '')),
        clock: sp.clock?.displayValue,
        team: sp.team ? {
          id: sp.team.id,
          name: sp.team.displayName || sp.team.name,
          logo: sp.team.logos?.[0]?.href || sp.team.logo
        } : null,
        type: eventType
      };
    });

    // Calculate Win Probability Projection & Matchup Predictor
    const compStatus = data.header?.competitions?.[0]?.status?.type;
    const isLiveInPlay = compStatus?.state === 'in';
    const isFinalGame = compStatus?.completed === true || compStatus?.state === 'post';

    const homeComp = data.header?.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home');
    const awayComp = data.header?.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away');
    const homeScore = parseInt(homeComp?.score || 0, 10);
    const awayScore = parseInt(awayComp?.score || 0, 10);

    let homeWinProb = 50;
    let awayWinProb = 50;
    let projectionSource = 'Baseline Statistical Model';

    // Priority 1: Official ESPN Matchup Predictor (FPI/BPI)
    if (data.predictor) {
      const pHome = parseFloat(data.predictor.homeTeam?.gameProjection);
      const pAway = parseFloat(data.predictor.awayTeam?.gameProjection);
      if (!isNaN(pHome) && !isNaN(pAway) && (pHome > 0 || pAway > 0)) {
        const total = pHome + pAway;
        homeWinProb = Math.round((pHome / total) * 100);
        awayWinProb = 100 - homeWinProb;
        projectionSource = data.predictor.header || 'ESPN Matchup Predictor (FPI/BPI)';
      }
    }
    // Priority 2: Real-time live win probability feed
    else if (data.winprobability?.length > 0) {
      const lastPoint = data.winprobability[data.winprobability.length - 1];
      if (lastPoint && typeof lastPoint.homeWinPercentage === 'number') {
        homeWinProb = Math.max(1, Math.min(99, Math.round(lastPoint.homeWinPercentage * 100)));
        awayWinProb = 100 - homeWinProb;
        projectionSource = 'ESPN Real-Time Live Win Probability Model';
      }
    }
    // Priority 3: Consensus Odds / Pickcenter Moneyline or Spread
    else if (data.pickcenter?.length || data.odds?.length) {
      const oddsItem = (data.pickcenter || data.odds)[0];
      const homeML = oddsItem?.homeTeamOdds?.moneyLine;
      const awayML = oddsItem?.awayTeamOdds?.moneyLine;
      if (homeML && awayML && typeof homeML === 'number' && typeof awayML === 'number') {
        const calcProb = (ml) => ml < 0 ? (-ml / (-ml + 100)) : (100 / (ml + 100));
        const hRaw = calcProb(homeML);
        const aRaw = calcProb(awayML);
        if (hRaw + aRaw > 0) {
          homeWinProb = Math.round((hRaw / (hRaw + aRaw)) * 100);
          awayWinProb = 100 - homeWinProb;
          projectionSource = `Market Implied (${oddsItem.provider?.name || 'Consensus Odds'})`;
        }
      } else if (oddsItem?.spread !== undefined && oddsItem.spread !== null) {
        const spread = parseFloat(oddsItem.spread);
        if (!isNaN(spread)) {
          homeWinProb = Math.max(5, Math.min(95, Math.round(50 - spread * 3)));
          awayWinProb = 100 - homeWinProb;
          projectionSource = `Spread-Implied Model (${oddsItem.details || `Spread: ${spread}`})`;
        }
      }
    }

    // Adjust for completed and live games if no official ESPN live model
    if (isFinalGame) {
      homeWinProb = homeScore > awayScore ? 100 : (awayScore > homeScore ? 0 : 50);
      awayWinProb = 100 - homeWinProb;
      projectionSource = 'Official Final Result';
    } else if (isLiveInPlay && !data.winprobability?.length) {
      const diff = homeScore - awayScore;
      const period = data.header?.competitions?.[0]?.status?.period || 1;
      const multiplier = period >= 4 ? 12 : period >= 3 ? 9 : 6;
      homeWinProb = Math.max(2, Math.min(98, 50 + diff * multiplier));
      awayWinProb = 100 - homeWinProb;
      projectionSource = 'Live In-Game Momentum Tracker';
    }

    const projection = {
      homeWinPercentage: homeWinProb,
      awayWinPercentage: awayWinProb,
      projectedWinner: homeWinProb > awayWinProb ? 'home' : (awayWinProb > homeWinProb ? 'away' : 'even'),
      source: projectionSource,
      isLive: isLiveInPlay,
      isFinal: isFinalGame
    };

    // Formulate clean, plottable Win Probability Chart Points
    let winprobability = [];

    if (data.winprobability && data.winprobability.length > 0) {
      const totalPts = data.winprobability.length;
      const step = Math.max(1, Math.floor(totalPts / 50));
      const sampled = [];
      for (let i = 0; i < totalPts; i += step) {
        sampled.push(data.winprobability[i]);
      }
      if (sampled[sampled.length - 1] !== data.winprobability[totalPts - 1]) {
        sampled.push(data.winprobability[totalPts - 1]);
      }

      winprobability = sampled.map((wp, idx) => {
        const hPct = Math.max(0, Math.min(100, Math.round((wp.homeWinPercentage || 0) * 100)));
        return {
          step: idx + 1,
          index: idx,
          homeWinPercentage: hPct,
          awayWinPercentage: 100 - hPct,
          playId: wp.playId || String(idx),
          text: wp.play?.text || (idx === 0 ? 'Game Start' : `Play #${idx * step + 1}`)
        };
      });
    } else if (scoringPlays.length > 0) {
      winprobability.push({
        step: 1,
        index: 0,
        homeWinPercentage: 50,
        awayWinPercentage: 50,
        text: 'Kickoff / Start'
      });

      let currentHome = 50;
      scoringPlays.forEach((sp, idx) => {
        if (sp.homeScore !== null && sp.awayScore !== null) {
          const diff = sp.homeScore - sp.awayScore;
          currentHome = Math.max(5, Math.min(95, 50 + diff * 8));
        } else if ((sp.type === 'GOAL' || sp.type === 'TOUCHDOWN') && sp.team?.id) {
          // Attribute the swing to the team that actually scored: an away-team
          // goal must move the chart toward the away team, not the home team.
          const scorerId = String(sp.team.id);
          if (scorerId === String(homeComp?.id)) {
            currentHome = Math.max(10, Math.min(90, currentHome + 15));
          } else if (scorerId === String(awayComp?.id)) {
            currentHome = Math.max(10, Math.min(90, currentHome - 15));
          }
        }
        winprobability.push({
          step: idx + 2,
          index: idx + 1,
          homeWinPercentage: Math.round(currentHome),
          awayWinPercentage: 100 - Math.round(currentHome),
          text: sp.text?.slice(0, 45) || sp.type
        });
      });

      if (isFinalGame) {
        winprobability.push({
          step: winprobability.length + 1,
          index: winprobability.length,
          homeWinPercentage: homeScore > awayScore ? 100 : (awayScore > homeScore ? 0 : 50),
          awayWinPercentage: awayScore > homeScore ? 100 : (homeScore > awayScore ? 0 : 50),
          text: 'Final'
        });
      }
    } else {
      // Pre-game projection curve
      winprobability = [
        { step: 1, index: 0, homeWinPercentage: 50, awayWinPercentage: 50, text: 'Neutral Baseline (50%)' },
        { step: 2, index: 1, homeWinPercentage: homeWinProb, awayWinPercentage: awayWinProb, text: `Projected (${projectionSource})` }
      ];
    }

    // Article / Recap
    const article = data.article ? {
      headline: data.article.headline,
      description: data.article.description,
      story: data.article.story,
      byline: data.article.byline,
      images: (data.article.images || []).map(img => ({
        url: img.url,
        caption: img.caption,
        credit: img.credit
      })),
      published: data.article.published
    } : null;

    // News
    const news = (data.news?.articles || []).map(art => ({
      headline: art.headline,
      description: art.description,
      image: art.images?.[0]?.url,
      links: art.links?.web?.href,
      published: art.published
    }));

    // Game Info
    const gameInfo = {
      venue,
      attendance: data.gameInfo?.attendance,
      weather,
      officials: (data.gameInfo?.officials || []).map(o => ({
        name: o.displayName,
        position: o.position?.name
      }))
    };

    // Odds
    const odds = (data.pickcenter || data.odds || []).map(o => ({
      provider: o.provider?.name,
      details: o.details,
      overUnder: o.overUnder,
      spread: o.spread,
      awayMoneyLine: o.awayTeamOdds?.moneyLine,
      homeMoneyLine: o.homeTeamOdds?.moneyLine,
      consensus: o.consensus
    }));

    // Standings / Season Series
    const seasonSeries = (data.seasonseries || []).map(ss => ({
      description: ss.description,
      summary: ss.summary,
      completed: ss.completed
    }));

    const result = {
      header: data.header,
      visualPlays: normalizeTVPlays(data),
      boxscore,
      plays,
      isDrives: plays.some(p => Array.isArray(p.plays)),
      scoringPlays,
      winprobability,
      projection,
      article,
      news,
      gameInfo,
      odds,
      seasonSeries,
      rawStatus: data.header?.competitions?.[0]?.status
    };

    cache.set(cacheKey, result, 20);
    return result;
  } catch (error) {
    console.error(`Error fetching game summary for ${eventId}:`, error.message);
    return { error: error.message };
  }
}

/**
 * Fetch News Articles for a Sport / League
 */
export async function getNews(sport = 'football', league = 'nfl') {
  const cacheKey = `news:${sport}:${league}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/news`;
  try {
    const data = await fetchFromESPN(url);
    const articles = (data.articles || []).map(art => ({
      id: art.id,
      headline: art.headline,
      description: art.description,
      image: art.images?.[0]?.url,
      caption: art.images?.[0]?.caption,
      published: art.published,
      byline: art.byline,
      links: art.links?.web?.href
    }));

    cache.set(cacheKey, { articles }, 180);
    return { articles };
  } catch (error) {
    console.error(`Error fetching news for ${sport}/${league}:`, error.message);
    return { articles: [] };
  }
}
