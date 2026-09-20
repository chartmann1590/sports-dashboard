import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import LeagueBar from './components/LeagueBar';
import BreakingTicker from './components/BreakingTicker';
import GameCard from './components/GameCard';
import GameDetailsModal from './components/GameDetailsModal';
import TVMode from './components/TVMode';
import NewsDrawer from './components/NewsDrawer';
import { getTodayString } from './utils/date';
import { playScoreSound } from './utils/audio';
import { Flame, Radio, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedLeagueId, setSelectedLeagueId] = useState('all');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(15);
  const [countdown, setCountdown] = useState(15);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isTVMode, setIsTVMode] = useState(false);

  const [games, setGames] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [newsArticles, setNewsArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedGame, setSelectedGame] = useState(null);
  const [isNewsOpen, setIsNewsOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'live', 'upcoming', 'final'
  const [sortBy, setSortBy] = useState('live-first');

  // Track previous game scores to trigger audio & confetti on live changes
  const previousScoresRef = useRef({});

  // Fetch data
  const fetchData = async (isSilent = false) => {
    try {
      if (!isSilent) setIsRefreshing(true);

      if (selectedLeagueId === 'all') {
        const res = await fetch(`/api/scores/all?date=${selectedDate}`);
        const data = await res.json();
        
        // Detect score changes
        if (data.games && isAudioEnabled) {
          let scoreChanged = false;
          data.games.forEach(g => {
            const prev = previousScoresRef.current[g.id];
            const currentTotal = (g.awayTeam.score || 0) + (g.homeTeam.score || 0);
            if (prev !== undefined && prev !== currentTotal && g.status.isLive) {
              scoreChanged = true;
            }
            previousScoresRef.current[g.id] = currentTotal;
          });

          if (scoreChanged) {
            playScoreSound();
            confetti({ particleCount: 30, spread: 60, origin: { y: 0.85 } });
          }
        }

        setGames(data.games || []);
        if (data.leagues) {
          setLeagues(data.leagues);
        }
      } else {
        const res = await fetch(`/api/scores?league=${encodeURIComponent(selectedLeagueId)}&date=${selectedDate}`);
        const data = await res.json();
        setGames(data.events || []);
      }
    } catch (err) {
      console.error('Failed to load sports data:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  // Fetch supported leagues list on mount
  useEffect(() => {
    fetch('/api/leagues')
      .then(res => res.json())
      .then(data => {
        if (data.leagues?.length) {
          setLeagues(prev => {
            if (!prev.length) return data.leagues;
            return prev;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch news for breaking ticker dynamically based on selected league
  useEffect(() => {
    const targetLeague = selectedLeagueId !== 'all' ? selectedLeagueId : 'nfl';
    fetch(`/api/news?league=${encodeURIComponent(targetLeague)}`)
      .then(res => res.json())
      .then(data => setNewsArticles(data.articles || []))
      .catch(() => {});
  }, [selectedLeagueId]);

  // Effect: Date or League change triggers load
  useEffect(() => {
    setLoading(true);
    fetchData(false);
    setCountdown(autoRefreshInterval);
  }, [selectedDate, selectedLeagueId]);

  // Effect: Auto-refresh countdown timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData(true);
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, selectedDate, selectedLeagueId, isAudioEnabled]);

  // Calculate live count by league
  const liveCountByLeague = useMemo(() => {
    const counts = { all: 0 };
    games.forEach(g => {
      if (g.status.isLive) {
        counts.all = (counts.all || 0) + 1;
        counts[g.league] = (counts[g.league] || 0) + 1;
        counts[g.sport] = (counts[g.sport] || 0) + 1;
      }
    });
    return counts;
  }, [games]);

  // Filter & Sort Games
  const displayedGames = useMemo(() => {
    return games
      .filter((game) => {
        // Status filter
        if (statusFilter === 'live' && !game.status.isLive) return false;
        if (statusFilter === 'upcoming' && !game.status.isScheduled) return false;
        if (statusFilter === 'final' && !game.status.isFinal) return false;

        // Search term filter
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchHome = game.homeTeam?.displayName?.toLowerCase().includes(q) || game.homeTeam?.name?.toLowerCase().includes(q);
          const matchAway = game.awayTeam?.displayName?.toLowerCase().includes(q) || game.awayTeam?.name?.toLowerCase().includes(q);
          const matchLeague = game.leagueName?.toLowerCase().includes(q) || game.league?.toLowerCase().includes(q);
          return matchHome || matchAway || matchLeague;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'live-first') {
          if (a.status.isLive && !b.status.isLive) return -1;
          if (!a.status.isLive && b.status.isLive) return 1;
          if (a.status.isScheduled && b.status.isFinal) return -1;
          if (a.status.isFinal && b.status.isScheduled) return 1;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'time') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'close-game') {
          const diffA = Math.abs((a.homeTeam?.score || 0) - (a.awayTeam?.score || 0));
          const diffB = Math.abs((b.homeTeam?.score || 0) - (b.awayTeam?.score || 0));
          return diffA - diffB;
        }
        return 0;
      });
  }, [games, statusFilter, searchTerm, sortBy]);

  const liveGames = useMemo(() => games.filter(g => g.status.isLive), [games]);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-emerald-500/30">
      
      {/* Top Header */}
      <Header
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        autoRefreshInterval={autoRefreshInterval}
        setAutoRefreshInterval={setAutoRefreshInterval}
        countdown={countdown}
        onManualRefresh={() => fetchData(false)}
        isRefreshing={isRefreshing}
        isAudioEnabled={isAudioEnabled}
        setIsAudioEnabled={setIsAudioEnabled}
        isTVMode={isTVMode}
        setIsTVMode={setIsTVMode}
        totalLiveCount={liveCountByLeague['all'] || 0}
        onOpenNews={() => setIsNewsOpen(true)}
      />

      {/* League Selection Bar */}
      <LeagueBar
        leagues={leagues}
        selectedLeagueId={selectedLeagueId}
        onSelectLeague={setSelectedLeagueId}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        liveCountByLeague={liveCountByLeague}
      />

      {/* Breaking News / Live Scores Ticker */}
      <BreakingTicker
        liveGames={liveGames}
        newsArticles={newsArticles}
        onSelectGame={(g) => setSelectedGame(g)}
      />

      {/* Main Content Area */}
      <main className="max-w-[1920px] mx-auto w-full p-4 sm:p-6 grow flex flex-col space-y-6">
        
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border-slate-800/80">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Games</p>
              <p className="text-2xl font-mono font-black text-white mt-1">{games.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/80 text-slate-300">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border-slate-800/80">
            <div>
              <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Live In-Play</p>
              <p className="text-2xl font-mono font-black text-red-400 mt-1">{liveCountByLeague['all'] || 0}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border-slate-800/80">
            <div>
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Upcoming</p>
              <p className="text-2xl font-mono font-black text-blue-400 mt-1">
                {games.filter(g => g.status.isScheduled).length}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Flame className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border-slate-800/80">
            <div>
              <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-mono font-black text-emerald-400 mt-1">
                {games.filter(g => g.status.isFinal).length}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Scoreboards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 text-slate-400 space-y-4 grow">
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="text-sm font-semibold tracking-wide">Syncing live scores and match statistics...</p>
          </div>
        ) : displayedGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onClick={(g) => setSelectedGame(g)}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-16 text-center space-y-4 max-w-xl mx-auto my-auto border-slate-800">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Games Found</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              There are no matching games scheduled for this date with the active filters. Try picking another date, switching sports, or clearing your search filter.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => {
                  setSelectedLeagueId('all');
                  setStatusFilter('all');
                  setSearchTerm('');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition"
              >
                Show All Sports
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0b0f19] px-6 py-4 text-center text-xs text-slate-500">
        <p>ArenaPulse Live Dashboard • Powered by free, unauthenticated sports data feeds • Auto-updates live</p>
      </footer>

      {/* Deep Game Details Modal */}
      {selectedGame && (
        <GameDetailsModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}

      {/* TV / Jumbotron Fullscreen Mode */}
      {isTVMode && (
        <TVMode
          games={games}
          onClose={() => setIsTVMode(false)}
          selectedDate={selectedDate}
          totalLiveCount={liveCountByLeague['all'] || 0}
          onOpenGame={(g) => setSelectedGame(g)}
        />
      )}

      {/* League News Drawer */}
      <NewsDrawer
        isOpen={isNewsOpen}
        onClose={() => setIsNewsOpen(false)}
        defaultLeague={selectedLeagueId !== 'all' ? selectedLeagueId : 'nfl'}
        leagues={leagues}
      />

    </div>
  );
}
