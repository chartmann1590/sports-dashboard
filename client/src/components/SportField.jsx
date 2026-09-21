import React, { useMemo } from 'react';
import { fieldModel } from '../utils/fieldModel';

function Markings({ sport, away, home }) {
  if (sport === 'football') return <>
    <rect x="30" y="35" width="940" height="430" rx="5" />
    <path d="M100 35V465 M900 35V465" />
    {Array.from({ length: 19 }, (_, i) => <g key={i}><path opacity={i % 2 ? '.55' : '.22'} d={`M${140 + i * 40} 35V465`} />{i % 2 === 1 && <><text x={140 + i * 40} y="90">{50 - Math.abs(9 - i) * 5}</text><text x={140 + i * 40} y="430">{50 - Math.abs(9 - i) * 5}</text></>}</g>)}
    {Array.from({ length: 49 }, (_, i) => <path key={i} d={`M${116 + i * 16} 195v12 M${116 + i * 16} 293v12`} opacity=".7" />)}
    <text transform="translate(68 250) rotate(-90)" className="endzone-label">{away}</text><text transform="translate(940 250) rotate(90)" className="endzone-label">{home}</text>
  </>;
  if (sport === 'baseball') return <>
    <path className="diamond-dirt" d="M500 420L235 160Q500 -65 765 160Z" />
    <path d="M500 420L235 160 M500 420L765 160" />
    <path className="infield-grass" d="M500 340L390 235L500 130L610 235Z" />
    <path d="M500 340L390 235L500 130L610 235Z" />
    <circle cx="500" cy="235" r="22" className="diamond-dirt" />
    {[[500, 340], [390, 235], [500, 130], [610, 235]].map(([x, y]) => <rect key={`${x}-${y}`} x={x - 7} y={y - 7} width="14" height="14" fill="white" transform={`rotate(45 ${x} ${y})`} />)}
    <text x="500" y="470">HOME PLATE</text>
  </>;
  return <>
    <rect x="45" y="35" width="910" height="430" rx={sport === 'hockey' ? 100 : 3} />
    <path d="M500 35V465" /><circle cx="500" cy="250" r="62" />
    {sport === 'soccer' && <><path d="M45 125H195V375H45 M955 125H805V375H955 M45 185H100V315H45 M955 185H900V315H955" /><path d="M45 210H20V290H45 M955 210H980V290H955" /><circle cx="150" cy="250" r="3" /><circle cx="850" cy="250" r="3" /></>}
    {sport === 'basketball' && <><path d="M45 175H235V325H45 M955 175H765V325H955 M100 35V80A190 190 0 0 1 100 420V465 M900 35V80A190 190 0 0 0 900 420V465" /><circle cx="235" cy="250" r="65" /><circle cx="765" cy="250" r="65" /><path d="M97 215V285 M903 215V285" /><circle cx="110" cy="250" r="12" /><circle cx="890" cy="250" r="12" /></>}
    {sport === 'hockey' && <><path className="blue-line" d="M345 35V465 M655 35V465" /><path className="red-line" d="M110 65V435 M890 65V435" />{[220, 780].flatMap(x => [145, 355].map(y => <circle key={`${x}-${y}`} className="red-line" cx={x} cy={y} r="50" />))}<path className="red-line" d="M110 215H75V285H110 M890 215H925V285H890" /></>}
  </>;
}

export default function SportField({ game, play, replayKey, flat, animate = true }) {
  const model = useMemo(() => fieldModel(game.sport, play), [game.sport, play]);
  const [x, y] = model.start || [500, 250];
  const [ex, ey] = model.end || [500, 250];
  return <div className={`field-stage ${flat ? 'field-flat' : ''}`}>
    <div className="field-annotation"><span>{game.sport.toUpperCase()} / PLAY VISUALIZER</span><span>{model.label}</span></div>
    <div className={`field-plane field-${game.sport}`}>
      <svg viewBox="0 0 1000 500" role="img" aria-label={`${game.sport} field. ${play ? model.action : 'Waiting for play-by-play'}. ${model.label}`}>
        <g className="field-lines"><Markings sport={game.sport} away={game.awayTeam.abbreviation} home={game.homeTeam.abbreviation} /></g>
        {model.start && <g key={`${play.id}-${replayKey}`}>
          {game.sport === 'football' && <><path className="scrimmage-line" d={`M${x} 35V465`} />{model.firstDown && <path className="first-down-line" d={`M${model.firstDown} 35V465`} />}</>}
          <path className="play-trail" d={`M${x} ${y}L${ex} ${ey}`} />
          <circle className="play-origin" cx={x} cy={y} r="9" />
          <circle className="play-destination" cx={ex} cy={ey} r="22" />
          <g className={`field-ball ${animate ? 'field-ball-moving' : ''}`} style={{ '--start-x': `${x}px`, '--start-y': `${y}px`, '--end-x': `${ex}px`, '--end-y': `${ey}px` }}>
            <ellipse cy="9" rx="15" ry="7" fill="#0008" />
            <circle r="11" fill={game.sport === 'basketball' ? '#ff9b41' : '#fff'} stroke="#10242c" strokeWidth="3" />
          </g>
        </g>}
      </svg>
    </div>
    {!play && <div className="field-waiting">{game.status.isScheduled ? 'Ready for tip-off, kick-off, or first pitch.' : 'Waiting for the play-by-play feed.'}<small>The field will update when plays arrive.</small></div>}
    <div className="field-legend"><span><i />{game.sport === 'football' ? 'Play start / line of scrimmage' : 'Play origin'}</span><span><i />{game.sport === 'football' ? 'Line to gain' : 'Event destination'}</span><span>Event-based animation · not player tracking</span></div>
  </div>;
}
