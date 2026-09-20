import React, { useState, useEffect } from 'react';
import { 
  X, 
  Tv, 
  MapPin, 
  CloudSun, 
  DollarSign, 
  Users, 
  Award, 
  Activity, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { playClickSound } from '../utils/audio';

export default function GameDetailsModal({ game, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scoring'); // 'scoring', 'plays', 'boxscore', 'winprob', 'gameinfo', 'recap'
  const [playsFilter, setPlaysFilter] = useState('all'); // 'all', 'scoring'

  // Fetch deep summary from backend
  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/game/${game.sport}/${game.league}/${game.id}`);
      const data = await res.json();
      setDetails(data);
    } catch (err) {
      console.error('Error fetching game details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [game.id]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const {
    homeTeam,
    awayTeam,
    status,
    leagueName,
    sport,
    odds,
    broadcasts,
    venue,
    weather
  } = game;

  // Header linescores: find quarters / periods
  const awayLinescores = homeTeam.linescores || [];
  const homeLinescores = awayTeam.linescores || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-5xl bg-[#0b0f19] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Matchup Banner */}
        <div className="relative bg-gradient-to-br from-slate-900 via-[#101728] to-slate-950 p-6 border-b border-slate-800">
          
          {/* Close button */}
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition z-10"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top meta tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-bold text-slate-200 uppercase tracking-wider">
              {leagueName || game.league?.toUpperCase()}
            </span>
            {status.isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/30 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {status.detail}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-400 font-semibold text-xs">
                {status.detail}
              </span>
            )}

            {broadcasts?.length > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-300 text-xs font-bold">
                <Tv className="w-3.5 h-3.5 text-cyan-400" />
                <span>{broadcasts.join(', ')}</span>
              </span>
            )}
          </div>

          {/* Large Matchup Score Display */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
            
            {/* Away Team */}
            <div className="md:col-span-3 flex items-center gap-4">
              <img
                src={awayTeam.logo}
                alt={awayTeam.displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain filter drop-shadow-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png&w=128';
                }}
              />
              <div>
                <div className="flex items-center gap-2">
                  {awayTeam.rank && (
                    <span className="text-xs font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                      #{awayTeam.rank}
                    </span>
                  )}
                  <h2 className="text-xl sm:text-2xl font-black text-white">{awayTeam.displayName}</h2>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{awayTeam.recordSummary || 'Away'}</p>
              </div>
            </div>

            {/* Score in Center */}
            <div className="md:col-span-1 text-center py-2 md:py-0">
              {status.isScheduled ? (
                <div className="text-slate-400 font-mono text-sm font-semibold">VS</div>
              ) : (
                <div className="flex md:flex-col items-center justify-center gap-2 md:gap-0">
                  <div className="flex items-center justify-center gap-3">
                    <span className={`text-3xl sm:text-4xl font-mono font-black tabular-nums ${
                      awayTeam.isWinner ? 'text-emerald-400' : 'text-white'
                    }`}>
                      {awayTeam.score}
                    </span>
                    <span className="text-slate-600 text-xl font-mono">-</span>
                    <span className={`text-3xl sm:text-4xl font-mono font-black tabular-nums ${
                      homeTeam.isWinner ? 'text-emerald-400' : 'text-white'
                    }`}>
                      {homeTeam.score}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Home Team */}
            <div className="md:col-span-3 flex items-center justify-end gap-4 text-right">
              <div>
                <div className="flex items-center justify-end gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white">{homeTeam.displayName}</h2>
                  {homeTeam.rank && (
                    <span className="text-xs font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                      #{homeTeam.rank}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{homeTeam.recordSummary || 'Home'}</p>
              </div>
              <img
                src={homeTeam.logo}
                alt={homeTeam.displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain filter drop-shadow-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png&w=128';
                }}
              />
            </div>

          </div>

          {/* Linescore preview table (if scores by quarter or inning exist) */}
          {(awayTeam.linescores?.length > 0 || homeTeam.linescores?.length > 0) && (
            <div className="mt-5 pt-4 border-t border-slate-800/80 overflow-x-auto">
              <table className="w-full max-w-md mx-auto text-center text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="text-left py-1 pr-3">TEAM</th>
                    {(awayTeam.linescores?.length ? awayTeam.linescores : homeTeam.linescores).map((_, i) => (
                      <th key={i} className="px-2 py-1">{i + 1}</th>
                    ))}
                    <th className="px-2 py-1 text-white font-bold">T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr>
                    <td className="text-left py-1.5 pr-3 font-semibold text-slate-300">{awayTeam.abbreviation || awayTeam.name}</td>
                    {(awayTeam.linescores || []).map((sc, i) => (
                      <td key={i} className="px-2 py-1.5 text-slate-400">{sc}</td>
                    ))}
                    <td className="px-2 py-1.5 font-bold text-white">{awayTeam.score}</td>
                  </tr>
                  <tr>
                    <td className="text-left py-1.5 pr-3 font-semibold text-slate-300">{homeTeam.abbreviation || homeTeam.name}</td>
                    {(homeTeam.linescores || []).map((sc, i) => (
                      <td key={i} className="px-2 py-1.5 text-slate-400">{sc}</td>
                    ))}
                    <td className="px-2 py-1.5 font-bold text-white">{homeTeam.score}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-slate-900/90 border-b border-slate-800 px-6 py-2">
          {[
            { id: 'scoring', label: 'Scoring Summary' },
            { id: 'plays', label: 'Play-by-Play' },
            { id: 'boxscore', label: 'Box Score & Stats' },
            { id: 'winprob', label: 'Win Probability' },
            { id: 'gameinfo', label: 'Game Info & Odds' },
            { id: 'recap', label: 'Recap & News' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                playClickSound();
                setActiveTab(tab.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto grow space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-sm font-medium">Loading real-time stats and play-by-play...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: SCORING SUMMARY */}
              {activeTab === 'scoring' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Scoring Timeline</span>
                  </h3>

                  {details?.scoringPlays?.length > 0 ? (
                    <div className="space-y-2.5">
                      {details.scoringPlays.map((play, idx) => (
                        <div 
                          key={play.id || idx}
                          className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex items-start justify-between gap-4 hover:border-slate-700 transition"
                        >
                          <div className="flex items-start gap-3">
                            {play.team?.logo && (
                              <img 
                                src={play.team.logo} 
                                alt={play.team.name} 
                                className="w-7 h-7 object-contain shrink-0 mt-0.5" 
                              />
                            )}
                            <div>
                              <div className="text-xs font-semibold text-emerald-400">
                                {play.period} {play.clock ? `• ${play.clock}` : ''}
                              </div>
                              <p className="text-sm text-slate-100 mt-0.5 font-medium">{play.text}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 font-mono font-bold text-sm bg-slate-800/70 px-2.5 py-1 rounded-lg border border-slate-700/50">
                            <span className="text-slate-300">{play.awayScore}</span>
                            <span className="text-slate-500 mx-1.5">-</span>
                            <span className="text-slate-300">{play.homeScore}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      No scoring plays recorded yet for this game.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PLAY-BY-PLAY */}
              {activeTab === 'plays' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span>{details?.isDrives ? 'Drive-by-Drive Plays' : 'Play-by-Play Log'}</span>
                    </h3>
                  </div>

                  {details?.plays?.length > 0 ? (
                    <div className="space-y-3">
                      {details.isDrives ? (
                        /* Football Drives */
                        details.plays.map((drive, dIdx) => (
                          <div key={drive.id || dIdx} className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="bg-slate-800/70 px-4 py-2.5 flex items-center justify-between text-xs font-medium">
                              <div className="flex items-center gap-2 font-bold text-white">
                                <span>{drive.team}</span>
                                <span className="text-slate-400 font-normal">• {drive.description}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                drive.result?.toLowerCase().includes('touchdown') || drive.result?.toLowerCase().includes('td')
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : drive.result?.toLowerCase().includes('field goal') || drive.result?.toLowerCase().includes('fg')
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-slate-700 text-slate-300'
                              }`}>
                                {drive.result}
                              </span>
                            </div>

                            <div className="divide-y divide-slate-800/60 p-2 space-y-1">
                              {drive.plays?.map((p, pIdx) => (
                                <div key={p.id || pIdx} className="px-3 py-2 text-xs flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    {p.downDistance && (
                                      <span className="font-bold text-amber-400 mr-2">{p.downDistance}</span>
                                    )}
                                    <span className="text-slate-300">{p.text}</span>
                                  </div>
                                  {p.clock && (
                                    <span className="text-slate-500 font-mono shrink-0">{p.clock}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        /* Standard Play Log (Baseball, Basketball, Soccer) */
                        details.plays.map((play, pIdx) => (
                          <div key={play.id || pIdx} className="bg-slate-900/60 border border-slate-800/70 rounded-xl p-3 text-xs flex items-start justify-between gap-3">
                            <div>
                              <span className="text-cyan-400 font-semibold mr-2">{play.period || play.time || ''}</span>
                              <span className="text-slate-200">{play.text}</span>
                            </div>
                            {play.scoringPlay && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold shrink-0">
                                SCORE
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Play-by-play data is not available or game has not started.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: BOX SCORE & PLAYER STATS */}
              {activeTab === 'boxscore' && (
                <div className="space-y-6">
                  {/* Team Statistics Head-to-Head Comparison */}
                  {details?.boxscore?.teams?.length >= 2 && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Team Comparison</h4>

                      <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800 pb-2">
                        <span className="text-white">{details.boxscore.teams[0].team.name}</span>
                        <span className="text-slate-500">STAT</span>
                        <span className="text-white">{details.boxscore.teams[1].team.name}</span>
                      </div>

                      <div className="space-y-3">
                        {details.boxscore.teams[0].statistics?.map((stat0, idx) => {
                          const stat1 = details.boxscore.teams[1].statistics?.[idx];
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-mono font-bold text-slate-200">{stat0.displayValue}</span>
                                <span className="text-slate-400 font-medium">{stat0.label}</span>
                                <span className="font-mono font-bold text-slate-200">{stat1?.displayValue || '-'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Player Stats Tables */}
                  {details?.boxscore?.players?.length > 0 ? (
                    <div className="space-y-6">
                      {details.boxscore.players.map((teamPlayerStats, tIdx) => (
                        <div key={tIdx} className="space-y-3">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            {teamPlayerStats.team.logo && (
                              <img src={teamPlayerStats.team.logo} alt="" className="w-5 h-5 object-contain" />
                            )}
                            <span>{teamPlayerStats.team.name} Player Stats</span>
                          </h4>

                          {teamPlayerStats.statistics?.map((cat, cIdx) => (
                            <div key={cIdx} className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-x-auto">
                              <div className="bg-slate-800/80 px-4 py-2 text-xs font-bold text-slate-300">
                                {cat.name}
                              </div>
                              <table className="w-full text-xs text-left">
                                <thead className="text-[10px] text-slate-400 uppercase bg-slate-900/60 border-b border-slate-800">
                                  <tr>
                                    <th className="px-4 py-2 font-semibold">ATHLETE</th>
                                    {cat.labels?.map((lbl, lIdx) => (
                                      <th key={lIdx} className="px-2.5 py-2 font-semibold text-right">{lbl}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono">
                                  {cat.athletes?.map((a, aIdx) => (
                                    <tr key={aIdx} className="hover:bg-slate-800/40 transition">
                                      <td className="px-4 py-2 font-sans font-medium text-white whitespace-nowrap">
                                        {a.athlete.name} {a.athlete.position ? `(${a.athlete.position})` : ''}
                                      </td>
                                      {a.stats?.map((val, vIdx) => (
                                        <td key={vIdx} className="px-2.5 py-2 text-right text-slate-300 whitespace-nowrap">
                                          {val}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      Individual player stats are not yet posted for this event.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: WIN PROBABILITY */}
              {activeTab === 'winprob' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Win Probability Momentum</span>
                  </h3>

                  {details?.winprobability?.length > 0 ? (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={details.winprobability}>
                            <XAxis dataKey="secondsLeft" hide />
                            <YAxis domain={[0, 100]} unit="%" stroke="#64748b" />
                            <Tooltip 
                              formatter={(value) => [`${value}%`, `${homeTeam.displayName} Win%`]}
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                            />
                            <ReferenceLine y={50} stroke="#475569" strokeDasharray="3 3" />
                            <Line 
                              type="monotone" 
                              dataKey="homeWinPercentage" 
                              stroke="#10b981" 
                              strokeWidth={2.5} 
                              dot={false} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800">
                        <span>100% {awayTeam.displayName}</span>
                        <span className="font-semibold text-slate-300">50/50 Toss-Up</span>
                        <span>100% {homeTeam.displayName}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Win probability model is not available for this competition.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: GAME INFO & ODDS */}
              {activeTab === 'gameinfo' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Venue & Location */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <span>Stadium & Location</span>
                    </h4>
                    <p className="text-base font-bold text-white">{details?.gameInfo?.venue?.name || venue?.name || 'Stadium Info Unavailable'}</p>
                    {(details?.gameInfo?.venue?.city || venue?.city) && (
                      <p className="text-xs text-slate-400">
                        {details?.gameInfo?.venue?.city || venue?.city}, {details?.gameInfo?.venue?.state || venue?.state}
                      </p>
                    )}
                    {details?.gameInfo?.venue?.capacity && (
                      <p className="text-xs text-slate-400">
                        Capacity: <span className="text-slate-200 font-mono font-semibold">{details.gameInfo.venue.capacity.toLocaleString()}</span>
                      </p>
                    )}
                    {details?.gameInfo?.attendance && (
                      <p className="text-xs text-slate-400">
                        Attendance: <span className="text-slate-200 font-mono font-semibold">{details.gameInfo.attendance.toLocaleString()}</span>
                      </p>
                    )}
                  </div>

                  {/* Weather */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <CloudSun className="w-4 h-4 text-amber-400" />
                      <span>Weather & Conditions</span>
                    </h4>
                    {details?.gameInfo?.weather?.displayValue || weather?.displayValue ? (
                      <div className="space-y-1">
                        <p className="text-base font-bold text-white">
                          {details?.gameInfo?.weather?.displayValue || weather?.displayValue}
                        </p>
                        {details?.gameInfo?.weather?.wind && (
                          <p className="text-xs text-slate-400">Wind: {details.gameInfo.weather.wind}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Weather data unavailable or indoor venue.</p>
                    )}
                  </div>

                  {/* Odds & Betting Lines */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 md:col-span-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Betting Lines & Consensus</span>
                    </h4>

                    {details?.odds?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        {details.odds.map((odd, idx) => (
                          <div key={idx} className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1 text-xs">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">{odd.provider || 'Consensus'}</div>
                            {odd.details && <div className="text-white font-bold">{odd.details}</div>}
                            {odd.overUnder && <div className="text-slate-300">O/U: <span className="font-mono font-semibold">{odd.overUnder}</span></div>}
                            {odd.spread && <div className="text-slate-300">Spread: <span className="font-mono font-semibold">{odd.spread}</span></div>}
                          </div>
                        ))}
                      </div>
                    ) : odds?.details ? (
                      <div className="text-sm font-semibold text-white">{odds.details}</div>
                    ) : (
                      <p className="text-xs text-slate-500">No active betting odds posted.</p>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 6: RECAP & NEWS */}
              {activeTab === 'recap' && (
                <div className="space-y-6">
                  {/* Main Recap Story */}
                  {details?.article ? (
                    <article className="space-y-4">
                      <h3 className="text-xl font-black text-white leading-tight">
                        {details.article.headline}
                      </h3>
                      {details.article.byline && (
                        <p className="text-xs text-emerald-400 font-medium">{details.article.byline}</p>
                      )}

                      {details.article.images?.[0]?.url && (
                        <div className="rounded-2xl overflow-hidden border border-slate-800">
                          <img 
                            src={details.article.images[0].url} 
                            alt="" 
                            className="w-full max-h-96 object-cover" 
                          />
                          {details.article.images[0].caption && (
                            <p className="text-[11px] text-slate-400 p-2.5 bg-slate-900/90 italic">
                              {details.article.images[0].caption}
                            </p>
                          )}
                        </div>
                      )}

                      <div 
                        className="text-sm text-slate-300 leading-relaxed space-y-3 prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: details.article.story || details.article.description }}
                      />
                    </article>
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      No game recap written yet.
                    </div>
                  )}

                  {/* Related League News */}
                  {details?.news?.length > 0 && (
                    <div className="pt-6 border-t border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Related Headlines</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {details.news.map((item, idx) => (
                          <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                            <p className="font-bold text-white hover:text-emerald-400 transition">{item.headline}</p>
                            <p className="text-slate-400 line-clamp-2">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
