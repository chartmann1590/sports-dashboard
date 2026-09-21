import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Tv, X, Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Radio, Maximize2, Minimize2, ArrowUpRight } from 'lucide-react';
import SportField from './SportField';
import './TVMode.css';

function Team({ team, home, scheduled }) {
  return <div className={`tv-team ${home ? 'tv-team-home' : ''}`}>
    {team.logo && <img src={team.logo} alt="" />}
    <div><small>{home ? 'HOME' : 'AWAY'} / {team.recordSummary || '—'}</small><h2>{team.displayName}</h2></div>
    <strong>{scheduled ? '—' : team.score}</strong>
  </div>;
}

function GameBroadcast({ game, onOpenGame, onInteracting, modalOpen }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [replaying, setReplaying] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [flat, setFlat] = useState(false);
  const [panel, setPanel] = useState('plays');
  const [retry, setRetry] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let timeout;
    let controller;
    async function refresh() {
      controller = new AbortController();
      const requestTimeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(`/api/game/${encodeURIComponent(game.sport)}/${encodeURIComponent(game.league)}/${encodeURIComponent(game.id)}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Game feed unavailable');
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        if (!disposed) { setDetails(data); setError(''); setUpdated(new Date()); }
      } catch {
        if (!disposed) setError('Could not refresh the game feed. Showing the last available update.');
      } finally {
        clearTimeout(requestTimeout);
        if (!disposed) { setLoading(false); timeout = setTimeout(refresh, 20000); }
      }
    }
    refresh();
    return () => { disposed = true; controller.abort(); clearTimeout(timeout); };
  }, [game.id, game.league, game.sport, retry]);

  const plays = useMemo(() => details?.visualPlays || [], [details]);
  const selectedIndex = selectedId === null ? plays.length - 1 : plays.findIndex(p => p.id === selectedId);
  const selectedPlay = plays[selectedIndex] || plays.at(-1);
  const following = selectedId === null;
  useEffect(() => { onInteracting(!following || replaying); return () => onInteracting(false); }, [following, replaying, onInteracting]);
  useEffect(() => { if (following && listRef.current) listRef.current.scrollTop = 0; }, [plays.length, following]);
  useEffect(() => {
    if (!replaying || modalOpen) return;
    const timer = setTimeout(() => {
      if (selectedIndex < plays.length - 1) setSelectedId(plays[selectedIndex + 1].id);
      else setReplaying(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [replaying, selectedIndex, plays, modalOpen]);

  const selectPlay = index => { if (plays[index]) { setSelectedId(plays[index].id); setReplaying(false); } };
  const stats = details?.boxscore?.teams || [];
  const awayStats = stats.find(t => String(t.team.id) === String(game.awayTeam.id));
  const homeStats = stats.find(t => String(t.team.id) === String(game.homeTeam.id));
  const status = details?.rawStatus?.type?.detail || game.status.detail;
  const competitors = details?.header?.competitions?.[0]?.competitors || [];
  const currentTeam = (team, side) => ({ ...team, score: competitors.find(c => c.homeAway === side)?.score ?? team.score });
  return <>
    <div className="tv-scoreboard">
      <Team team={currentTeam(game.awayTeam, 'away')} scheduled={game.status.isScheduled} />
      <div className="tv-game-status"><span>{game.leagueName || game.league.toUpperCase()}</span><strong>{status}</strong><small>{game.broadcasts?.join(' · ') || game.venue?.name || 'Game center'}</small></div>
      <Team team={currentTeam(game.homeTeam, 'home')} home scheduled={game.status.isScheduled} />
    </div>
    <div className="tv-broadcast-grid">
      <section className="tv-arena" aria-label="Game visualization">
        <div className="tv-section-heading"><div><span className={`tv-status-dot ${game.status.isLive && following ? 'is-live' : ''}`} />{following ? (game.status.isLive ? 'FOLLOWING LIVE' : game.status.isFinal ? 'FINAL GAME / LAST PLAY' : 'PREGAME') : 'PLAY REPLAY'}</div><button onClick={() => setFlat(!flat)} aria-pressed={flat}>{flat ? '3D field' : 'Overhead view'}</button></div>
        <SportField game={game} play={selectedPlay} replayKey={replayKey} flat={flat} animate={!modalOpen} />
        <div className="tv-play-caption" aria-live="polite"><div><span>{selectedPlay?.period} {selectedPlay?.clock}</span>{selectedPlay?.scoringPlay && <b>SCORING PLAY</b>}{!following && <b>REPLAY</b>}</div><p>{selectedPlay?.text || (loading ? 'Loading play-by-play…' : game.status.isScheduled ? 'The matchup is set. Live plays will appear here when coverage begins.' : 'This feed has no play-by-play yet. Team stats and the full game center may still be available.')}</p>{selectedPlay?.awayScore != null && selectedPlay?.homeScore != null && <small>Score after this play: {game.awayTeam.abbreviation} {selectedPlay.awayScore} — {game.homeTeam.abbreviation} {selectedPlay.homeScore}</small>}</div>
        <div className="tv-replay-controls">
          <button aria-label="Previous play" disabled={selectedIndex <= 0} onClick={() => selectPlay(selectedIndex - 1)}><ChevronLeft size={19} /></button>
          <button disabled={!plays.length} onClick={() => { setReplayKey(k => k + 1); setSelectedId(selectedPlay.id); }}><RotateCcw size={17} /> Replay play</button>
          <button disabled={!plays.length} onClick={() => { if (replaying) setReplaying(false); else { if (following || selectedIndex === plays.length - 1) setSelectedId(plays[Math.max(0, plays.length - 8)].id); setReplaying(true); } }}>{replaying ? <Pause size={17} /> : <Play size={17} />}{replaying ? 'Pause replay' : 'Play sequence'}</button>
          <button aria-label="Next play" disabled={selectedIndex >= plays.length - 1 || !plays.length} onClick={() => selectPlay(selectedIndex + 1)}><ChevronRight size={19} /></button>
          <button className={`tv-follow ${following ? 'active' : ''}`} onClick={() => { setSelectedId(null); setReplaying(false); }}><Radio size={17} />{game.status.isLive ? 'Follow live' : 'Latest play'}</button>
        </div>
      </section>
      <aside className="tv-sidebar">
        <div className="tv-tabs" role="tablist" aria-label="Game information"><button role="tab" aria-selected={panel === 'plays'} onClick={() => setPanel('plays')}>Play-by-play <span>{plays.length}</span></button><button role="tab" aria-selected={panel === 'stats'} onClick={() => setPanel('stats')}>Team stats</button></div>
        {error && <div className="tv-feed-error" role="status">{error}<button onClick={() => setRetry(n => n + 1)}>Retry</button></div>}
        {panel === 'plays' ? <div className="tv-play-list" ref={listRef} role="tabpanel" aria-label="Play-by-play">
          {loading && <div className="tv-loading">Loading game coverage…</div>}
          {!loading && !plays.length && <div className="tv-empty"><Radio size={28} /><h3>{game.status.isScheduled ? 'Coverage starts with the game' : 'No plays available'}</h3><p>Check team stats or open the full game center. We’ll keep checking for new plays.</p></div>}
          {[...plays].reverse().map(p => <button key={p.id} className={`tv-play-row ${selectedPlay?.id === p.id ? 'selected' : ''}`} aria-pressed={selectedPlay?.id === p.id} onClick={() => { setSelectedId(p.id); setReplaying(false); }}><span className="tv-play-meta"><span>{p.period} {p.clock}</span><b>{p.scoringPlay ? 'SCORE' : p.type}</b></span><span>{p.text}</span></button>)}
        </div> : <div className="tv-stats" role="tabpanel" aria-label="Team stats"><div className="tv-stat-head"><b>{game.awayTeam.abbreviation}</b><span>TEAM COMPARISON</span><b>{game.homeTeam.abbreviation}</b></div>{awayStats?.statistics?.length ? awayStats.statistics.map(s => <div className="tv-stat-row" key={s.name}><strong>{s.displayValue}</strong><span>{s.label}</span><strong>{homeStats?.statistics?.find(h => h.name === s.name)?.displayValue ?? '—'}</strong></div>) : <div className="tv-empty">Team statistics will appear when the feed provides them.</div>}</div>}
        <div className="tv-sidebar-footer"><small>{updated ? `Updated ${updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · refreshes every 20s` : 'Connecting to game feed'}</small><button className="tv-open-center" onClick={() => onOpenGame(game)}>Open Full Game Center & Play-by-Play <ArrowUpRight size={18} /></button></div>
      </aside>
    </div>
  </>;
}

export default function TVMode({ games, onClose, selectedDate, totalLiveCount, onOpenGame, isGameCenterOpen }) {
  const ordered = useMemo(() => [...games].sort((a, b) => Number(b.status.isLive) - Number(a.status.isLive)), [games]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [fullscreenError, setFullscreenError] = useState('');
  const rootRef = useRef(null);
  const openRef = useRef(null);
  const index = Math.max(0, ordered.findIndex(g => g.id === selectedGameId));
  const game = ordered[index];
  const held = paused || interacting || isGameCenterOpen;
  const navigate = direction => { if (ordered.length) setSelectedGameId(ordered[(index + direction + ordered.length) % ordered.length].id); };
  const gameIds = ordered.map(g => g.id).join(',');
  useEffect(() => {
    const ids = gameIds ? gameIds.split(',') : [];
    if (held || ids.length < 2) return;
    const timer = setTimeout(() => setSelectedGameId(ids[(index + 1) % ids.length]), 30000);
    return () => clearTimeout(timer);
  }, [held, index, gameIds]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    rootRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);
  useEffect(() => {
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);
  useEffect(() => { if (!isGameCenterOpen && openRef.current) { openRef.current.focus(); openRef.current = null; } }, [isGameCenterOpen]);
  const openGame = g => { openRef.current = document.activeElement; onOpenGame(g); };
  useEffect(() => {
    const onKey = e => {
      if (isGameCenterOpen || e.defaultPrevented) return;
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'Tab') {
        const items = [...rootRef.current.querySelectorAll('button:not(:disabled)')].filter(el => el.getClientRects().length);
        const first = items[0], last = items.at(-1);
        if (e.shiftKey && (document.activeElement === first || document.activeElement === rootRef.current)) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
      if (e.target.closest('button, input, select, textarea, a, [role="tab"]')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); navigate(-1); }
      if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); }
      if (e.key === 'Enter' && game) { e.preventDefault(); openGame(game); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setFullscreenError('');
    } catch { setFullscreenError('Fullscreen is unavailable in this browser. TV mode still works in this window.'); }
  }
  return <div className="tv-mode" ref={rootRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="TV mode" inert={isGameCenterOpen ? true : undefined}>
    <header className="tv-header"><div className="tv-brand"><Tv size={25} /><strong>ARENA<span>VISION</span></strong><span className="tv-edition">GAME ROOM</span></div><div className="tv-header-meta"><span>{selectedDate}</span><span className="tv-live-count">{totalLiveCount} LIVE</span></div><div className="tv-header-controls"><button onClick={() => setPaused(!paused)} aria-label={paused ? 'Resume auto-cycle' : 'Pause auto-cycle'}>{paused ? <Play size={18} /> : <Pause size={18} />}<span>{held ? 'Game held' : 'Auto-cycle / 30s'}</span></button><button onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>{fullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}</button><button onClick={onClose} aria-label="Exit TV mode"><X size={22} /></button></div></header>
    {fullscreenError && <div role="status">{fullscreenError}</div>}
    <main className="tv-main">{game ? <GameBroadcast key={`${game.sport}-${game.league}-${game.id}`} game={game} onOpenGame={openGame} onInteracting={setInteracting} modalOpen={isGameCenterOpen} /> : <div className="tv-empty"><h2>No games on this date</h2><p>Exit TV mode and choose another date or league.</p></div>}</main>
    <footer className="tv-footer"><div className="tv-navigation"><button disabled={!ordered.length} onClick={() => navigate(-1)} aria-label="Previous game"><ChevronLeft /></button><span>{ordered.length ? index + 1 : 0} / {ordered.length}</span><button disabled={!ordered.length} onClick={() => navigate(1)} aria-label="Next game"><ChevronRight /></button></div><div className="tv-game-strip" aria-label="Choose a game">{ordered.map(g => <button key={`${g.league}-${g.id}`} className={g.id === game?.id ? 'active' : ''} aria-pressed={g.id === game?.id} onClick={() => setSelectedGameId(g.id)}><small>{g.status.isLive ? 'LIVE' : g.status.isFinal ? 'FINAL' : g.league.toUpperCase()}</small><span>{g.awayTeam.abbreviation} <b>{g.status.isScheduled ? 'vs' : g.awayTeam.score}</b> {g.homeTeam.abbreviation} <b>{g.status.isScheduled ? '' : g.homeTeam.score}</b></span></button>)}</div><small className="tv-key-hint">← → games · Space hold · Esc exit</small></footer>
  </div>;
}
