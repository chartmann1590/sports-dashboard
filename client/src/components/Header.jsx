import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Clock, 
  Flame,
  Radio,
  Bell,
  Download
} from 'lucide-react';
import { formatFriendlyDate, offsetDateString, getTodayString } from '../utils/date';
import { playClickSound } from '../utils/audio';

export default function Header({
  selectedDate,
  setSelectedDate,
  autoRefreshInterval,
  setAutoRefreshInterval,
  countdown,
  onManualRefresh,
  isRefreshing,
  isAudioEnabled,
  setIsAudioEnabled,
  isTVMode,
  setIsTVMode,
  totalLiveCount,
  onOpenNews,
  onOpenNotifications,
  activeSubscriptionCount = 0,
  installPrompt,
  onInstallPWA
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    playClickSound();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Fullscreen error: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handlePrevDay = () => {
    playClickSound();
    setSelectedDate(prev => offsetDateString(prev, -1));
  };

  const handleNextDay = () => {
    playClickSound();
    setSelectedDate(prev => offsetDateString(prev, 1));
  };

  const handleToday = () => {
    playClickSound();
    setSelectedDate(getTodayString());
  };

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDateHeader = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="sticky top-0 z-40 bg-[#07090e]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Live Indicator */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 shadow-lg shadow-emerald-500/20">
            <Radio className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-wider text-white">ARENA<span className="text-emerald-400">PULSE</span></span>
              {totalLiveCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                  {totalLiveCount} LIVE
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>Real-Time Sports Hub</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-mono">Zero-Key Live API</span>
            </p>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
          <button
            onClick={handlePrevDay}
            title="Previous Day"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              selectedDate === getTodayString() 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>{formatFriendlyDate(selectedDate)}</span>
          </button>

          <button
            onClick={handleNextDay}
            title="Next Day"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Date Picker Input */}
          <label className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition cursor-pointer relative" title="Choose specific date">
            <Calendar className="w-4 h-4" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  playClickSound();
                  setSelectedDate(e.target.value);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/70 border border-slate-800/80 px-3.5 py-1.5 rounded-xl text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">{formattedDateHeader}</span>
          <span className="text-slate-600">|</span>
          <span className="font-bold text-white">{formattedTime}</span>
        </div>

        {/* Controls: Auto-refresh, Audio, News, TV Mode, Fullscreen */}
        <div className="flex items-center gap-2">
          
          {/* Refresh Controls & Countdown */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1">
            <select
              value={autoRefreshInterval}
              onChange={(e) => {
                playClickSound();
                setAutoRefreshInterval(Number(e.target.value));
              }}
              className="bg-transparent text-xs text-slate-300 font-medium px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
              title="Auto-refresh interval"
            >
              <option value={10} className="bg-slate-900 text-white">10s Live</option>
              <option value={15} className="bg-slate-900 text-white">15s Live</option>
              <option value={30} className="bg-slate-900 text-white">30s Normal</option>
              <option value={60} className="bg-slate-900 text-white">60s Slow</option>
              <option value={0} className="bg-slate-900 text-white">Paused</option>
            </select>

            {autoRefreshInterval > 0 && (
              <span className="px-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 rounded border border-emerald-500/20" title="Next refresh in">
                {countdown}s
              </span>
            )}

            <button
              onClick={() => {
                playClickSound();
                onManualRefresh();
              }}
              disabled={isRefreshing}
              className={`p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition ml-1 ${
                isRefreshing ? 'animate-spin text-emerald-400' : ''
              }`}
              title="Refresh Now"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* PWA Install Button */}
          {installPrompt && (
            <button
              onClick={() => {
                playClickSound();
                onInstallPWA();
              }}
              className="px-3 py-1.5 rounded-xl border bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400/80 text-white hover:brightness-110 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 animate-pulse"
              title="Install ArenaPulse PWA App on your device"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Install App</span>
            </button>
          )}

          {/* Game Notifications Manager Bell */}
          <button
            onClick={() => {
              playClickSound();
              if (onOpenNotifications) onOpenNotifications();
            }}
            className={`p-2 rounded-xl border transition relative ${
              activeSubscriptionCount > 0
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title={`Live Game Alerts & Subscriptions (${activeSubscriptionCount} active)`}
          >
            <Bell className="w-4 h-4" />
            {activeSubscriptionCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow">
                {activeSubscriptionCount}
              </span>
            )}
          </button>

          {/* Audio Chime Toggle */}
          <button
            onClick={() => {
              playClickSound();
              setIsAudioEnabled(!isAudioEnabled);
            }}
            className={`p-2 rounded-xl border transition ${
              isAudioEnabled 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10' 
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={isAudioEnabled ? "Sound Alerts Enabled (Chimes on scores)" : "Sound Alerts Muted"}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* League News Button */}
          {onOpenNews && (
            <button
              onClick={() => {
                playClickSound();
                onOpenNews();
              }}
              className="px-3 py-1.5 rounded-xl border bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-medium transition flex items-center gap-1.5"
              title="Latest Sports News & Headlines"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Headlines</span>
            </button>
          )}

          {/* TV / Jumbotron Mode Toggle */}
          <button
            onClick={() => {
              playClickSound();
              setIsTVMode(!isTVMode);
            }}
            className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition flex items-center gap-2 shadow-sm ${
              isTVMode 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-cyan-500/30 ring-2 ring-cyan-400/40' 
                : 'bg-slate-900/90 border-slate-800 text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/10'
            }`}
            title="Toggle TV / Jumbotron Mode (Big Screen TV Display)"
          >
            <Tv className="w-4 h-4" />
            <span className="hidden sm:inline">TV MODE</span>
          </button>

          {/* Browser Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl transition"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen (F11)"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

        </div>

      </div>
    </header>
  );
}
