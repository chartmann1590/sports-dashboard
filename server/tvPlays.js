// Keep the field data that the compact, legacy play log does not expose.
export function normalizeTVPlays(data) {
  let source = data.plays;
  if (!source?.length && data.drives) {
    source = [...(data.drives.previous || []), ...(data.drives.current ? [data.drives.current] : [])]
      .flatMap(d => (d.plays || []).map((p, i, all) => ({
        ...p,
        team: p.team || d.team,
        start: p.start || (i > 0 && !all[i - 1].isTurnover ? all[i - 1].end : null),
      })));
  }
  if (!source?.length) {
    source = [data.commentary, data.keyEvents, data.scoringPlays].find((s) => s?.length) || [];
    if (source.length > 1 && Number(source[0].sequence) > Number(source.at(-1).sequence)) source = [...source].reverse();
  }
  const seen = new Set();
  return source.map((p, index) => ({
    id: String(p.id ?? `${p.clock?.displayValue || p.time?.displayValue || ''}-${index}`),
    sequence: Number(p.sequenceNumber) || index,
    text: p.text || p.alternativeText || p.description || '',
    type: p.type?.text || p.type?.description || p.playType?.description || 'Play',
    period: `${p.period?.type === 'Top' || p.period?.type === 'Bottom' ? p.period.type + ' ' : ''}${p.period?.displayValue || (p.period?.number ? `Period ${p.period.number}` : '')}`,
    clock: p.clock?.displayValue || p.time?.displayValue || '',
    teamId: p.team?.id || null,
    scoringPlay: Boolean(p.scoringPlay),
    awayScore: p.awayScore ?? null,
    homeScore: p.homeScore ?? null,
    start: p.start || null,
    end: p.end || null,
    statYardage: p.statYardage ?? null,
    isTurnover: Boolean(p.isTurnover),
    count: p.resultCount || p.pitchCount || null,
    outs: p.outs ?? null,
    wallclock: p.wallclock || null,
  })).filter(p => {
    if (!p.text || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  }); // Preserve feed order: baseball sequence numbers restart within each at-bat.
}
