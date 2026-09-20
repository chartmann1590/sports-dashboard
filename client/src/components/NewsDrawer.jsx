import React, { useState, useEffect } from 'react';
import { X, Flame, ExternalLink, RefreshCw } from 'lucide-react';
import { playClickSound } from '../utils/audio';

export default function NewsDrawer({ isOpen, onClose, defaultLeague = 'nfl', leagues = [] }) {
  const [league, setLeague] = useState(defaultLeague);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync active league when drawer opens or defaultLeague changes
  useEffect(() => {
    if (defaultLeague && defaultLeague !== 'all') {
      setLeague(defaultLeague);
    }
  }, [defaultLeague, isOpen]);

  const fetchNews = async (targetLeague) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/news?league=${encodeURIComponent(targetLeague)}`);
      const data = await res.json();
      setNews(data.articles || []);
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNews(league);
    }
  }, [isOpen, league]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Use provided leagues or default complete league list
  const activeLeagues = leagues.length > 0 ? leagues : [
    { id: 'nfl', name: 'NFL', icon: '🏈' },
    { id: 'college-football', name: 'CFB', icon: '🎓' },
    { id: 'mlb', name: 'MLB', icon: '⚾' },
    { id: 'nba', name: 'NBA', icon: '🏀' },
    { id: 'wnba', name: 'WNBA', icon: '🏀' },
    { id: 'mens-college-basketball', name: 'NCAA Basketball', icon: '🎓' },
    { id: 'nhl', name: 'NHL', icon: '🏒' },
    { id: 'eng.1', name: 'Premier League', icon: '⚽' },
    { id: 'usa.1', name: 'MLS', icon: '⚽' },
    { id: 'uefa.champions', name: 'UCL', icon: '🏆' },
    { id: 'esp.1', name: 'La Liga', icon: '⚽' },
    { id: 'ger.1', name: 'Bundesliga', icon: '⚽' },
    { id: 'ita.1', name: 'Serie A', icon: '⚽' },
    { id: 'mex.1', name: 'Liga MX', icon: '⚽' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#0b0f19] border-l border-slate-800 h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-black text-white">Sports Headlines & News</h3>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic League selector tabs */}
        <div className="flex items-center gap-1.5 p-3 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto no-scrollbar text-xs">
          {activeLeagues.map((item) => (
            <button
              key={item.id || item.league}
              onClick={() => {
                playClickSound();
                setLeague(item.id || item.league);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                league === (item.id || item.league)
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        {/* News List */}
        <div className="p-5 overflow-y-auto grow space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
              <p className="text-xs">Fetching headlines...</p>
            </div>
          ) : news.length > 0 ? (
            news.map((item, idx) => (
              <div 
                key={item.id || idx}
                className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 space-y-3 transition group"
              >
                {item.image && (
                  <div className="rounded-xl overflow-hidden aspect-video bg-slate-800">
                    <img
                      src={item.image}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-emerald-400 transition leading-snug">
                    {item.links ? (
                      <a 
                        href={item.links} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 hover:underline"
                      >
                        <span>{item.headline}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 inline" />
                      </a>
                    ) : (
                      item.headline
                    )}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  {item.byline && (
                    <div className="text-[10px] text-slate-500 mt-2 font-mono">
                      By {item.byline}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              No headlines available for this league at this time.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
