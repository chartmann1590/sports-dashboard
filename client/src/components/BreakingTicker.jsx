import React from 'react';
import { Flame, Radio, ArrowRight } from 'lucide-react';
import { playClickSound } from '../utils/audio';

export default function BreakingTicker({ liveGames, onSelectGame, newsArticles = [] }) {
  if (!liveGames.length && !newsArticles.length) return null;

  return (
    <div className="bg-[#0e1320] border-b border-slate-800/80 py-1.5 px-4 overflow-hidden relative group">
      <div className="flex items-center gap-3">
        
        {/* Ticker Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black tracking-widest shrink-0 uppercase">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span>LIVE TICKER</span>
        </div>

        {/* Marquee Content */}
        <div className="overflow-hidden whitespace-nowrap w-full relative">
          <div className="inline-flex gap-8 animate-marquee group-hover:[animation-play-state:paused] text-xs font-medium text-slate-300">
            {/* Live games scores */}
            {liveGames.map((game) => (
              <button
                key={`ticker-${game.id}`}
                onClick={() => {
                  playClickSound();
                  onSelectGame(game);
                }}
                className="inline-flex items-center gap-2 hover:text-emerald-400 transition cursor-pointer"
              >
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-bold text-slate-400">
                  {game.league?.toUpperCase() || game.sport?.toUpperCase()}
                </span>
                <span className="text-white font-bold">{game.awayTeam.abbreviation || game.awayTeam.displayName}</span>
                <span className="text-emerald-400 font-mono font-black">{game.awayTeam.score}</span>
                <span className="text-slate-500">@</span>
                <span className="text-white font-bold">{game.homeTeam.abbreviation || game.homeTeam.displayName}</span>
                <span className="text-emerald-400 font-mono font-black">{game.homeTeam.score}</span>
                <span className="text-red-400 font-mono text-[10px] font-semibold bg-red-500/10 px-1 rounded">
                  {game.status.shortDetail || game.status.detail}
                </span>
                <span className="text-slate-600 ml-2">•</span>
              </button>
            ))}

            {/* News headlines */}
            {newsArticles.slice(0, 5).map((article, idx) => (
              <span key={`news-${idx}`} className="inline-flex items-center gap-2 text-slate-400">
                <Flame className="w-3 h-3 text-amber-400 inline" />
                <span className="text-slate-200">{article.headline}</span>
                <span className="text-slate-600 ml-2">•</span>
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
