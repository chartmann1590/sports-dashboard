import React, { useState, useEffect } from 'react';
import { X, Flame, ExternalLink, RefreshCw } from 'lucide-react';
import { playClickSound } from '../utils/audio';

export default function NewsDrawer({ isOpen, onClose, defaultLeague = 'nfl' }) {
  const [sport, setSport] = useState('football');
  const [league, setLeague] = useState(defaultLeague);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/news?sport=${sport}&league=${league}`);
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
      fetchNews();
    }
  }, [isOpen, sport, league]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
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

        {/* League selector tabs */}
        <div className="flex items-center gap-2 p-3 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto no-scrollbar text-xs">
          {[
            { name: 'NFL', s: 'football', l: 'nfl' },
            { name: 'CFB', s: 'football', l: 'college-football' },
            { name: 'MLB', s: 'baseball', l: 'mlb' },
            { name: 'NBA', s: 'basketball', l: 'nba' },
            { name: 'WNBA', s: 'basketball', l: 'wnba' },
            { name: 'EPL', s: 'soccer', l: 'eng.1' }
          ].map((item) => (
            <button
              key={item.l}
              onClick={() => {
                playClickSound();
                setSport(item.s);
                setLeague(item.l);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                league === item.l
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.name}
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
                    {item.headline}
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
