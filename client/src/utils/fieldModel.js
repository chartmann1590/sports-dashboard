const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const finite = v => typeof v === 'number' && Number.isFinite(v);

// Coordinates are intentionally illustrative unless a football yard position is supplied.
// Public play-by-play does not contain continuous player/ball tracking.
export function fieldModel(sport, play) {
  const text = `${play?.type || ''} ${play?.text || ''}`.toLowerCase();
  const model = { start: [240, 250], end: [650, 250], label: 'Illustrative action', action: play?.type || 'Awaiting play', supported: true };
  if (!play) return { ...model, start: null, end: null };
  if (sport === 'football') {
    let a = play.start?.yardsToEndzone;
    const b = play.isTurnover ? null : play.end?.yardsToEndzone;
    const inferredStart = !finite(a) && finite(b) && finite(play.statYardage);
    if (inferredStart) a = b + play.statYardage;
    if (finite(a)) {
      model.start = [100 + (100 - clamp(a, 0, 100)) * 8, 250];
      model.end = finite(b) ? [100 + (100 - clamp(b, 0, 100)) * 8, 250] : model.start;
      model.label = finite(b) ? 'Reported yard positions · offense moves right' : 'Reported line of scrimmage';
      if (inferredStart) model.label = 'Reported end spot + play yardage · offense moves right';
      const distance = play.start?.distance;
      if (finite(distance)) model.firstDown = Math.min(900, model.start[0] + distance * 8);
    } else {
      model.start = [350, 250];
      model.end = [finite(play.statYardage) ? clamp(350 + play.statYardage * 8, 100, 900) : 520, 250];
    }
    model.action = play.start?.downDistanceText || play.type || 'Football play';
  } else if (sport === 'basketball') {
    const shot = /shot|jumper|layup|dunk|pointer|free throw/.test(text);
    model.start = [text.includes('three') || text.includes('3-point') ? 620 : 760, 310];
    model.end = shot ? [890, 250] : [570, 200];
    model.action = /miss/.test(text) ? 'Shot missed' : /makes|made/.test(text) ? 'Basket made' : play.type;
  } else if (sport === 'baseball') {
    const contact = /home run|homers|hit|single|double|triple|flies|ground/.test(text);
    model.start = contact ? [500, 340] : [500, 235];
    model.end = /home run|homers/.test(text) ? [730, 105] : contact ? [650, 180] : [500, 340];
    model.action = /home run|homers/.test(text) ? 'Home run' : /strikeout|strikes out/.test(text) ? 'Strikeout' : play.type;
  } else if (sport === 'soccer') {
    model.start = [640, /left/.test(text) ? 150 : 310];
    model.end = /goal|shot|saved|miss/.test(text) ? [935, 250] : [770, 220];
  } else if (sport === 'hockey') {
    model.start = [710, 320];
    model.end = /shot|goal|save/.test(text) ? [890, 250] : [570, 190];
  } else return { ...model, supported: false, start: null, end: null };
  // Administrative events have no meaningful physical trajectory.
  if (/timeout|end of|end period|end inning|end game|game end|start inning|period start|lineups|substitution|yellow card|red card|review|challenge|delay/.test(text)) {
    model.start = null;
    model.end = null;
    model.label = 'Game event · no position reported';
  }
  return model;
}
