import React from 'react';
import { Search, Filter, ArrowUpDown, Flame, Radio } from 'lucide-react';
import { playClickSound } from '../utils/audio';

export default function LeagueBar({
  leagues,
  selectedLeagueId,
  onSelectLeague,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  liveCountByLeague
}) {
  return (
    <div className="bg-[#0b0f19] border-b border-slate-800/60 py-3 px-4 sm:px-6">
      <div className="max-w-[1920px] mx-auto space-y-3">
        
        {/* League Selector Carousel / Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* "All Sports" Button */}
          <button
            onClick={() => {
              playClickSound();
              onSelectLeague('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
              selectedLeagueId === 'all'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>ALL SPORTS</span>
            {liveCountByLeague['all'] > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500 text-white animate-pulse">
                {liveCountByLeague['all']}
              </span>
            )}
          </button>

          {/* League Pills */}
          {leagues.map((lg) => {
            const isSelected = selectedLeagueId === lg.id;
            const liveCount = liveCountByLeague[lg.id] || 0;
            const totalCount = lg.totalCount || 0;

            return (
              <button
                key={lg.id}
                onClick={() => {
                  playClickSound();
                  onSelectLeague(lg.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/70'
                }`}
              >
                <span>{lg.icon}</span>
                <span>{lg.name}</span>
                
                {liveCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500 text-white animate-pulse">
                    {liveCount}
                  </span>
                ) : totalCount > 0 ? (
                  <span className="text-[10px] font-mono text-slate-500">
                    {totalCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Filters, Search & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => { playClickSound(); setStatusFilter('all'); }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => { playClickSound(); setStatusFilter('live'); }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                statusFilter === 'live'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              Live Now
            </button>
            <button
              onClick={() => { playClickSound(); setStatusFilter('upcoming'); }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'upcoming'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-blue-400'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => { playClickSound(); setStatusFilter('final'); }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'final'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Final
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2 grow sm:grow-0">
            
            {/* Search Input */}
            <div className="relative grow sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by team, rank, city..."
                className="w-full bg-slate-900/90 border border-slate-800 pl-8 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl px-2 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="live-first" className="bg-slate-900 text-white">Live First</option>
                <option value="time" className="bg-slate-900 text-white">Start Time</option>
                <option value="close-game" className="bg-slate-900 text-white">Close Games (Margin)</option>
              </select>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
