import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Volume2, 
  Trash2, 
  Sparkles,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  getSubscriptions, 
  unsubscribeFromGame, 
  saveSubscriptions,
  getGlobalPreferences, 
  saveGlobalPreferences,
  sendTestNotification,
  isNotificationSupported
} from '../utils/notifications';
import { playClickSound } from '../utils/audio';

export default function NotificationModal({ isOpen, onClose, onSelectGame }) {
  const [permission, setPermission] = useState(getNotificationPermission());
  const [subscriptions, setSubscriptions] = useState(getSubscriptions());
  const [globalPrefs, setGlobalPrefs] = useState(getGlobalPreferences());
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
      setSubscriptions(getSubscriptions());
      setGlobalPrefs(getGlobalPreferences());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSubsChanged = () => {
      setSubscriptions(getSubscriptions());
    };
    window.addEventListener('arenapulse:subscriptions-changed', handleSubsChanged);
    return () => window.removeEventListener('arenapulse:subscriptions-changed', handleSubsChanged);
  }, []);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    playClickSound();
    const result = await requestNotificationPermission();
    setPermission(result);
  };

  const handleTogglePref = (key) => {
    playClickSound();
    const updated = { ...globalPrefs, [key]: !globalPrefs[key] };
    setGlobalPrefs(updated);
    saveGlobalPreferences(updated);
  };

  const handleUnsubscribe = (gameId) => {
    playClickSound();
    unsubscribeFromGame(gameId);
    setSubscriptions(getSubscriptions());
  };

  const handleClearAll = () => {
    playClickSound();
    saveSubscriptions({});
    setSubscriptions({});
  };

  const handleSendTest = async () => {
    playClickSound();
    setTestSent(true);
    await sendTestNotification();
    setTimeout(() => setTestSent(false), 3000);
  };

  const subList = Object.values(subscriptions);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-[#0b0f19] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-[#101728]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                Live Game Notifications
              </h2>
              <p className="text-xs text-slate-400">
                PWA & browser alerts for touchdowns, quarters, and final scores while the dashboard is open
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar grow">
          
          {/* Permission Status Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            permission === 'granted' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : permission === 'denied'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <div className="flex items-center gap-3">
              {permission === 'granted' ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold capitalize">
                  Browser Permissions: {permission}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {permission === 'granted' 
                    ? 'Ready! You will receive instant push alerts for subscribed games.' 
                    : permission === 'denied'
                    ? 'Notifications are blocked in your browser settings. Enable them to get live alerts.'
                    : 'Grant permission to allow instant game notifications even when in another tab.'}
                </p>
              </div>
            </div>

            {permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shrink-0 shadow-md"
              >
                Enable
              </button>
            )}
          </div>

          {/* Alert Category Preferences */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Notification Triggers
            </h3>
            
            <div className="grid grid-cols-1 gap-2.5">
              
              {/* Touchdowns & Scores */}
              <label 
                onClick={() => handleTogglePref('touchdowns')}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏈</span>
                  <div>
                    <p className="text-sm font-bold text-white">Touchdowns & Scoring Plays</p>
                    <p className="text-xs text-slate-400">Live TDs, goals, field goals, and runs scored</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={globalPrefs.touchdowns} 
                  onChange={() => {}} 
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              {/* Quarter & Period Updates */}
              <label 
                onClick={() => handleTogglePref('quarters')}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">⏱️</span>
                  <div>
                    <p className="text-sm font-bold text-white">Quarter & Halftime Updates</p>
                    <p className="text-xs text-slate-400">Score summaries at the end of each quarter/period</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={globalPrefs.quarters} 
                  onChange={() => {}} 
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              {/* Final Score */}
              <label 
                onClick={() => handleTogglePref('finalScore')}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏆</span>
                  <div>
                    <p className="text-sm font-bold text-white">Final Score & Winner</p>
                    <p className="text-xs text-slate-400">Game conclusion with final score and winning team</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={globalPrefs.finalScore} 
                  onChange={() => {}} 
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

            </div>
          </div>

          {/* Active Subscribed Games */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tracked Games ({subList.length})
              </h3>
              {subList.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Unsubscribe All</span>
                </button>
              )}
            </div>

            {subList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
                <BellOff className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No games subscribed yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click the <Bell className="w-3.5 h-3.5 inline text-cyan-400 mx-0.5" /> bell icon on any game card or in the game details modal to track live plays and scoring updates!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {subList.map((sub) => (
                  <div 
                    key={sub.gameId}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div 
                      className="flex items-center gap-3 cursor-pointer grow min-w-0"
                      onClick={() => {
                        if (onSelectGame) {
                          onClose();
                          onSelectGame(sub.gameId);
                        }
                      }}
                    >
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300 uppercase">
                        {sub.leagueName || sub.league}
                      </span>
                      <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                        <span>{sub.awayTeam?.name}</span>
                        <span className="text-slate-500 font-normal">@</span>
                        <span>{sub.homeTeam?.name}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnsubscribe(sub.gameId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition ml-2 shrink-0"
                      title="Unsubscribe from this game"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between gap-3">
          <button
            onClick={handleSendTest}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{testSent ? 'Test Alert Dispatched!' : 'Send Test Notification'}</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-lg shadow-emerald-500/20"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
