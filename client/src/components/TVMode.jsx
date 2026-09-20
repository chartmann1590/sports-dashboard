import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Clock, 
  Maximize2, 
  Minimize2, 
  X, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Radio,
  Sparkles
} from 'lucide-react';
import { playClickSound } from '../utils/audio';
import { formatGameTime } from '../utils/date';

export default function TVMode({ 
  games, 
  onClose, 
  selectedDate, 
  totalLiveCount,
  onOpenGame
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const idleTimeoutRef = useRef(null);

  // Filter prioritized games: live games first, then tight finishes / top games
  const prioritizedGames = [...games].sort((a, b) => {
    if (a.status.isLive && !b.status.isLive) return -1;
    if (!a.status.isLive && b.status.isLive) return 1;
    return 0;
  });

  const activeGame = prioritizedGames[currentIndex] || games[0];

  // Auto-cycle games every 12 seconds if not paused
  useEffect(() => {
    if (isPaused || prioritizedGames.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % prioritizedGames.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [isPaused, prioritizedGames.length]);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard controls for TV remotes / keyboards
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (prioritizedGames.length > 0) {
          playClickSound();
          setCurrentIndex((prev) => (prev + 1) % prioritizedGames.length);
        }
      } else if (e.key === 'ArrowLeft') {
        if (prioritizedGames.length > 0) {
          playClickSound();
          setCurrentIndex((prev) => (prev - 1 + prioritizedGames.length) % prioritizedGames.length);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        playClickSound();
        setIsPaused((prev) => !prev);
      } else if (e.key === 'Enter' && activeGame) {
        onOpenGame(activeGame);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prioritizedGames.length, activeGame, onClose, onOpenGame]);

  // Auto-hide controls after 4 seconds of idle mouse
  useEffect(() => {
    const handleMouseMove = () => {
      setIsControlsVisible(true);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(() => {
        setIsControlsVisible(false);
      }, 4000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#05070c] text-white flex flex-col justify-between select-none overflow-hidden font-sans">
      
      {/* Dynamic Ambient Stadium Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-slate-950 to-black"></div>

      {/* TOP BAR: TV Header & Stadium Clock */}
      <header className={`relative z-10 px-8 py-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300 ${
        isControlsVisible ? 'opacity-100' : 'opacity-30 hover:opacity-100'
      }`}>
        
        {/* Brand & Mode */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/25">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black tracking-wider text-white">
                ARENA<span className="text-cyan-400">VISION</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                TV JUMBOTRON
              </span>
              {totalLiveCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                  {totalLiveCount} LIVE NOW
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">
              Big Screen Sports Center
            </p>
          </div>
        </div>

        {/* Massive Digital Stadium Clock */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-3xl font-mono font-black text-white tracking-wider">
              {formattedTime}
            </div>
            <div className="text-xs font-medium text-slate-400">
              {formattedDate}
            </div>
          </div>

          {/* TV Quick Controls */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title={isPaused ? "Resume Auto-cycle (Space)" : "Pause Auto-cycle (Space)"}
            >
              {isPaused ? <Play className="w-5 h-5 text-emerald-400" /> : <Pause className="w-5 h-5 text-amber-400" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
              title="Exit TV Mode (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

      </header>

      {/* CENTER: Jumbotron Feature Arena */}
      <main className="relative z-10 px-8 py-6 grow flex flex-col justify-center max-w-7xl mx-auto w-full">
        {activeGame ? (
          <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border-2 border-slate-700/60 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            
            {/* Live Indicator Ribbon */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-xl bg-slate-800 text-sm font-black text-white uppercase tracking-wider">
                  {activeGame.leagueName || activeGame.league?.toUpperCase()}
                </span>

                {activeGame.status.isLive ? (
                  <span className="flex items-center gap-2 px-3 py-1 rounded-xl bg-red-500/20 text-red-400 font-black text-sm border border-red-500/40 animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    {activeGame.status.detail}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-xl bg-slate-800/80 text-slate-300 font-semibold text-sm">
                    {activeGame.status.detail}
                  </span>
                )}
              </div>

              {/* Game Info Pill */}
              <div className="flex items-center gap-3 text-sm text-slate-400 font-mono">
                {activeGame.broadcasts?.length > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-bold">
                    {activeGame.broadcasts[0]}
                  </span>
                )}
                {activeGame.odds?.details && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                    {activeGame.odds.details}
                  </span>
                )}
                <span className="text-slate-500">
                  Game {currentIndex + 1} of {prioritizedGames.length}
                </span>
              </div>
            </div>

            {/* Giant Matchup Display */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-8 items-center">
              
              {/* Away Team */}
              <div className="md:col-span-3 flex items-center gap-6">
                <img
                  src={activeGame.awayTeam.logo}
                  alt={activeGame.awayTeam.displayName}
                  className="w-24 h-24 sm:w-32 sm:h-32 object-contain filter drop-shadow-2xl"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png&w=128';
                  }}
                />
                <div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    {activeGame.awayTeam.displayName}
                  </h3>
                  <p className="text-base text-slate-400 font-mono mt-1">
                    {activeGame.awayTeam.recordSummary || 'Away Team'}
                  </p>
                </div>
              </div>

              {/* Big Center Score */}
              <div className="md:col-span-1 text-center">
                {activeGame.status.isScheduled ? (
                  <div className="text-xl font-mono text-slate-400 font-bold">VS</div>
                ) : (
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-5xl sm:text-7xl font-mono font-black text-white tabular-nums">
                      {activeGame.awayTeam.score}
                    </span>
                    <span className="text-3xl text-slate-600 font-mono">-</span>
                    <span className="text-5xl sm:text-7xl font-mono font-black text-white tabular-nums">
                      {activeGame.homeTeam.score}
                    </span>
                  </div>
                )}
              </div>

              {/* Home Team */}
              <div className="md:col-span-3 flex items-center justify-end gap-6 text-right">
                <div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    {activeGame.homeTeam.displayName}
                  </h3>
                  <p className="text-base text-slate-400 font-mono mt-1">
                    {activeGame.homeTeam.recordSummary || 'Home Team'}
                  </p>
                </div>
                <img
                  src={activeGame.homeTeam.logo}
                  alt={activeGame.homeTeam.displayName}
                  className="w-24 h-24 sm:w-32 sm:h-32 object-contain filter drop-shadow-2xl"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png&w=128';
                  }}
                />
              </div>

            </div>

            {/* In-Game Situation Banner for TV */}
            {activeGame.situation && (activeGame.situation.downDistanceText || activeGame.situation.lastPlay) && (
              <div className="mt-8 pt-6 border-t border-slate-800/80 bg-slate-950/60 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span className="text-base font-bold text-amber-400">
                    {activeGame.situation.downDistanceText}
                    {activeGame.situation.yardLine && ` • Ball on ${activeGame.situation.yardLine}`}
                  </span>
                </div>
                {activeGame.situation.lastPlay && (
                  <p className="text-sm text-slate-300 italic truncate max-w-xl">
                    "{activeGame.situation.lastPlay}"
                  </p>
                )}
              </div>
            )}

            {/* Click to open full details */}
            <div className="mt-6 flex items-center justify-center">
              <button
                onClick={() => onOpenGame(activeGame)}
                className="px-6 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-sm font-bold transition flex items-center gap-2"
              >
                <span>Open Full Game Center & Play-by-Play</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        ) : (
          <div className="text-center text-slate-500 py-16 text-xl">
            No games scheduled for today.
          </div>
        )}
      </main>

      {/* BOTTOM TICKER / CAROUSEL DOCK */}
      <footer className="relative z-10 bg-[#07090e]/95 border-t border-slate-800 px-8 py-3 flex items-center justify-between">
        
        {/* Navigation Arrows */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (prioritizedGames.length > 0) {
                playClickSound();
                setCurrentIndex((prev) => (prev - 1 + prioritizedGames.length) % prioritizedGames.length);
              }
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Previous Game (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              if (prioritizedGames.length > 0) {
                playClickSound();
                setCurrentIndex((prev) => (prev + 1) % prioritizedGames.length);
              }
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Next Game (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <span className="text-xs text-slate-400 font-medium">
            Use <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-mono text-[10px]">◀</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-mono text-[10px]">▶</kbd> to cycle • <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-mono text-[10px]">Space</kbd> to pause
          </span>
        </div>

        {/* Thumbnail Preview Strip */}
        <div className="hidden lg:flex items-center gap-3 overflow-x-auto no-scrollbar max-w-2xl">
          {prioritizedGames.slice(0, 8).map((g, idx) => (
            <button
              key={g.id}
              onClick={() => {
                playClickSound();
                setCurrentIndex(idx);
              }}
              className={`p-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                idx === currentIndex
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{g.awayTeam.abbreviation}</span>
              <span className="font-mono text-white">{g.awayTeam.score}</span>
              <span className="text-slate-600">@</span>
              <span>{g.homeTeam.abbreviation}</span>
              <span className="font-mono text-white">{g.homeTeam.score}</span>
              {g.status.isLive && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>

      </footer>

    </div>
  );
}
