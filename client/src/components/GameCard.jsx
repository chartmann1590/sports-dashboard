import React from 'react';
import { Tv, Radio, Clock, Award, ChevronRight, Circle } from 'lucide-react';
import { formatGameTime } from '../utils/date';
import { playClickSound } from '../utils/audio';

export default function GameCard({ game, onClick }) {
  const {
    status,
    homeTeam,
    awayTeam,
    situation,
    broadcasts = [],
    odds,
    leagueName,
    sport
  } = game;

  const isLive = status.isLive;
  const isFinal = status.isFinal;
  const isScheduled = status.isScheduled;

  return (
    <div
      onClick={() => {
        playClickSound();
        onClick(game);
      }}
      className={`glass-card rounded-2xl p-4 cursor-pointer relative overflow-hidden transition-all duration-200 group ${
        isLive 
          ? 'border-red-500/40 shadow-lg shadow-red-500/10 hover:border-red-400' 
          : 'border-slate-800/80 hover:border-slate-600'
      }`}
    >
      {/* Live Glow strip */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 animate-pulse" />
      )}

      {/* Card Header: League, Status & Broadcast */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/60 text-xs">
        
        {/* Left: League & Live Tag */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            {leagueName || game.league?.toUpperCase()}
          </span>

          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 font-black text-[11px] tracking-wide animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              {status.displayClock && status.displayClock !== '0:00' ? (
                <span>{status.detail}</span>
              ) : (
                <span>{status.shortDetail || 'LIVE'}</span>
              )}
            </span>
          ) : isFinal ? (
            <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 font-semibold text-[11px]">
              {status.shortDetail || 'Final'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-semibold text-[11px]">
              <Clock className="w-3 h-3" />
              <span>{formatGameTime(game.date) || status.detail}</span>
            </span>
          )}
        </div>

        {/* Right: Broadcast, Weather & Odds */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          {game.weather?.temperature !== null && game.weather?.temperature !== undefined && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/60 text-amber-300 text-[10px] font-semibold">
              <span>{game.weather.indoor ? '🏟️' : '☀️'}</span>
              <span>{game.weather.indoor ? 'Dome' : `${game.weather.temperature}°`}</span>
            </span>
          )}
          {broadcasts.length > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-300 text-[10px] font-bold">
              <Tv className="w-2.5 h-2.5 text-cyan-400" />
              <span>{broadcasts[0]}</span>
            </span>
          )}
          {odds?.details && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-800/40 text-slate-400 text-[10px]">
              {odds.details}
            </span>
          )}
        </div>

      </div>

      {/* Teams & Scores Matrix */}
      <div className="space-y-2.5">
        
        {/* Away Team Row */}
        <div className={`flex items-center justify-between p-1.5 rounded-xl transition ${
          awayTeam.isWinner ? 'bg-emerald-500/5 font-bold' : ''
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo */}
            <div className="w-8 h-8 rounded-full bg-slate-800/90 p-1 flex items-center justify-center shrink-0 border border-slate-700/50">
              <img
                src={awayTeam.logo}
                alt={awayTeam.name}
                className="w-full h-full object-contain filter drop-shadow"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png&w=64';
                }}
              />
            </div>

            {/* Name & Record */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {awayTeam.rank && (
                  <span className="text-[10px] font-black px-1 rounded bg-amber-500/20 text-amber-400">
                    #{awayTeam.rank}
                  </span>
                )}
                <span className={`text-sm truncate ${
                  awayTeam.isWinner ? 'text-white font-bold' : 'text-slate-200 font-medium'
                }`}>
                  {awayTeam.displayName}
                </span>
                {situation?.possession === awayTeam.id && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Possession" />
                )}
              </div>
              {awayTeam.recordSummary && (
                <div className="text-[10px] text-slate-500 font-mono">
                  {awayTeam.recordSummary}
                </div>
              )}
            </div>
          </div>

          {/* Away Score */}
          <div className="text-right pl-3 shrink-0">
            {isScheduled ? (
              <span className="text-xs text-slate-500 font-mono">-</span>
            ) : (
              <span className={`text-xl font-mono font-black tabular-nums ${
                awayTeam.isWinner 
                  ? 'text-emerald-400 font-black' 
                  : isLive ? 'text-white' : 'text-slate-300'
              }`}>
                {awayTeam.score}
              </span>
            )}
          </div>
        </div>

        {/* Home Team Row */}
        <div className={`flex items-center justify-between p-1.5 rounded-xl transition ${
          homeTeam.isWinner ? 'bg-emerald-500/5 font-bold' : ''
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo */}
            <div className="w-8 h-8 rounded-full bg-slate-800/90 p-1 flex items-center justify-center shrink-0 border border-slate-700/50">
              <img
                src={homeTeam.logo}
                alt={homeTeam.name}
                className="w-full h-full object-contain filter drop-shadow"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png&w=64';
                }}
              />
            </div>

            {/* Name & Record */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {homeTeam.rank && (
                  <span className="text-[10px] font-black px-1 rounded bg-amber-500/20 text-amber-400">
                    #{homeTeam.rank}
                  </span>
                )}
                <span className={`text-sm truncate ${
                  homeTeam.isWinner ? 'text-white font-bold' : 'text-slate-200 font-medium'
                }`}>
                  {homeTeam.displayName}
                </span>
                {situation?.possession === homeTeam.id && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Possession" />
                )}
              </div>
              {homeTeam.recordSummary && (
                <div className="text-[10px] text-slate-500 font-mono">
                  {homeTeam.recordSummary}
                </div>
              )}
            </div>
          </div>

          {/* Home Score */}
          <div className="text-right pl-3 shrink-0">
            {isScheduled ? (
              <span className="text-xs text-slate-500 font-mono">-</span>
            ) : (
              <span className={`text-xl font-mono font-black tabular-nums ${
                homeTeam.isWinner 
                  ? 'text-emerald-400 font-black' 
                  : isLive ? 'text-white' : 'text-slate-300'
              }`}>
                {homeTeam.score}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* In-Game Situation Banner (When Live) */}
      {isLive && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
          
          {/* Football Situation */}
          {sport === 'football' && (situation?.downDistanceText || situation?.lastPlay) && (
            <div className="bg-slate-900/90 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[11px]">
              <div className="text-amber-400 font-bold truncate">
                {situation.shortDownDistanceText || situation.downDistanceText}
                {situation.yardLine && ` • Ball on ${situation.yardLine}`}
              </div>
              {situation.isRedZone && (
                <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[10px] font-black shrink-0">
                  RED ZONE
                </span>
              )}
            </div>
          )}

          {/* Baseball Situation (Bases & Count) */}
          {sport === 'baseball' && (
            <div className="flex items-center justify-between bg-slate-900/90 rounded-lg px-2.5 py-1.5 text-[11px]">
              {/* Diamond */}
              <div className="flex items-center gap-2">
                <div className="relative w-5 h-5 rotate-45 border border-slate-700">
                  {/* 2nd base (top) */}
                  <div className={`absolute top-0 right-0 w-2 h-2 rounded-sm ${
                    situation.onSecond ? 'bg-amber-400' : 'bg-slate-800'
                  }`} />
                  {/* 3rd base (left) */}
                  <div className={`absolute top-0 left-0 w-2 h-2 rounded-sm ${
                    situation.onThird ? 'bg-amber-400' : 'bg-slate-800'
                  }`} />
                  {/* 1st base (right) */}
                  <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-sm ${
                    situation.onFirst ? 'bg-amber-400' : 'bg-slate-800'
                  }`} />
                </div>
                <div className="text-slate-400 text-[10px]">
                  B: <span className="text-white font-bold">{situation.balls || 0}</span> • 
                  S: <span className="text-white font-bold">{situation.strikes || 0}</span> • 
                  O: <span className="text-red-400 font-bold">{situation.outs || 0}</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                {situation.batter ? `Batting: ${situation.batter}` : ''}
              </div>
            </div>
          )}

          {/* Last play summary preview */}
          {situation?.lastPlay && (
            <p className="mt-1.5 text-[10px] text-slate-400 italic truncate">
              {situation.lastPlay}
            </p>
          )}

        </div>
      )}

      {/* Card Footer: View Details CTA */}
      <div className="mt-3 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-emerald-400 transition">
        <span>Game Center, Stats & Plays</span>
        <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
      </div>

    </div>
  );
}
