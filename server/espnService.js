import { cache } from './cache.js';

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

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

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
    venue: competition.venue ? {
      name: competition.venue.fullName,
      city: competition.venue.address?.city,
      state: competition.venue.address?.state,
      indoor: competition.venue.indoor
    } : null,
    weather: competition.weather ? {
      temperature: competition.weather.temperature,
      displayValue: competition.weather.displayValue,
      condition: competition.weather.conditionId
    } : null,
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
    // Format YYYYMMDD
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

    // Cache: 15s for live/recent, longer if past date
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

  // Query primary leagues in parallel
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
 * Fetch Deep Game Summary (Play-by-play, Boxscore, Player Stats, Odds, Recap, Win Probability)
 */
export async function getGameSummary(sport, league, eventId) {
  const cacheKey = `summary:${sport}:${league}:${eventId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${eventId}`;
  
  try {
    const data = await fetchFromESPN(url);

    // Normalize Boxscore
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
          logo: p.team?.logo
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
      // Football drives
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
      // Soccer minute commentary
      plays = data.commentary.map(c => ({
        id: c.id,
        text: c.text,
        time: c.time?.displayValue,
        playType: c.playType?.description,
        scoringPlay: c.scoringPlay
      }));
    }

    // Scoring Plays
    const scoringPlays = (data.scoringPlays || data.keyEvents || []).map(sp => ({
      id: sp.id,
      text: sp.text || sp.description,
      awayScore: sp.awayScore,
      homeScore: sp.homeScore,
      period: sp.period?.displayValue || (sp.period?.number ? `Quarter ${sp.period.number}` : (sp.clock?.displayValue || '')),
      clock: sp.clock?.displayValue,
      team: sp.team ? {
        id: sp.team.id,
        name: sp.team.displayName || sp.team.name,
        logo: sp.team.logos?.[0]?.href || sp.team.logo
      } : null,
      type: sp.type?.text || sp.type?.description
    }));

    // Win Probability Chart Points
    const winprobability = (data.winprobability || []).map(wp => ({
      homeWinPercentage: Math.round((wp.homeWinPercentage || 0) * 100),
      playId: wp.playId,
      secondsLeft: wp.secondsLeft,
      text: wp.play?.text
    }));

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
      venue: data.gameInfo?.venue ? {
        name: data.gameInfo.venue.fullName,
        city: data.gameInfo.venue.address?.city,
        state: data.gameInfo.venue.address?.state,
        capacity: data.gameInfo.venue.capacity,
        indoor: data.gameInfo.venue.indoor
      } : null,
      attendance: data.gameInfo?.attendance,
      weather: data.gameInfo?.weather ? {
        temperature: data.gameInfo.weather.temperature,
        displayValue: data.gameInfo.weather.displayValue,
        condition: data.gameInfo.weather.conditionId,
        wind: data.gameInfo.weather.wind
      } : null,
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
      boxscore,
      plays,
      isDrives: Boolean(data.drives),
      scoringPlays,
      winprobability,
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
