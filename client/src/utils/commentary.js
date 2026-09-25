// Broadcaster-style play-by-play script builder.
// Pure ESM, no dependencies: turns a raw play feed object into a short,
// natural-sounding announcer script plus an excitement level.
//
// Excitement: 0 = routine, 1 = interesting, 2 = big, 3 = huge moment.

export const EXCITEMENT_ROUTINE = 0;
export const EXCITEMENT_INTERESTING = 1;
export const EXCITEMENT_BIG = 2;
export const EXCITEMENT_HUGE = 3;

export const SPEECH_RATE_BY_EXCITEMENT = [0.95, 1.0, 1.03, 1.08];
export const SPEECH_PITCH_BY_EXCITEMENT = [0.9, 1.0, 1.1, 1.22];

const FOOTBALL_LIKE = new Set(['football']);
const GOAL_SPORTS = new Set(['soccer', 'hockey']);

const SCORE_PATTERN = /touchdown|home run|grand slam|walk.?off|buzzer|hat trick|pick.?six/i;
const GOAL_WORD = /\bgoal\b/i;
const TURNOVER_PATTERN = /intercept|fumble|sack|steal|blocked|strikeout|double play|turnover/i;
const INTERESTING_PATTERN = /field goal|\bthree\b|three[- ]point|dunk|penalty|timeout|challenge/i;

// Lead-ins are templates; {team} is replaced with the play's team displayName.
const LEAD_INS = {
  football: {
    [EXCITEMENT_HUGE]: [
      'TOUCHDOWN, {team}!',
      '{team} finds the end zone! Touchdown!',
      'Touchdown! What a score for {team}!',
    ],
    [EXCITEMENT_BIG]: [
      'Oh no — turnover! The ball changes hands.',
      'What a defensive play! That ball is coming out.',
      'Turnover! A huge momentum swing.',
    ],
    [EXCITEMENT_INTERESTING]: [
      'A big gain here for {team}.',
      'First down, {team}!',
      'Chunk play for {team}.',
    ],
    [EXCITEMENT_ROUTINE]: ['{team} with the ball.', 'Here we go, {team}.', '{team} lines up again.'],
  },
  soccer: {
    [EXCITEMENT_HUGE]: [
      'GOAL for {team}!',
      'He scores! {team}!',
      "It's in! Goal for {team}!",
    ],
    [EXCITEMENT_BIG]: [
      'What a stop! Denied at the door.',
      'A massive tackle to win it back!',
    ],
    [EXCITEMENT_INTERESTING]: ['{team} pushing forward now.', 'Danger here for {team}.'],
    [EXCITEMENT_ROUTINE]: ['{team} on the ball.', 'Played around the back by {team}.'],
  },
  hockey: {
    [EXCITEMENT_HUGE]: [
      'He scores! {team}!',
      'GOAL! {team} lights the lamp!',
      "It's in! A goal for {team}!",
    ],
    [EXCITEMENT_BIG]: [
      'What a save! He absolutely stones him.',
      'A huge hit along the boards! The puck is loose.',
    ],
    [EXCITEMENT_INTERESTING]: ['{team} cycling the puck.', 'Power play pressure from {team}.'],
    [EXCITEMENT_ROUTINE]: ['{team} with possession.', 'Dumped in by {team}.'],
  },
  baseball: {
    [EXCITEMENT_HUGE]: [
      "It's gone! Home run, {team}!",
      'Outta here! A homer for {team}!',
    ],
    [EXCITEMENT_BIG]: [
      'Struck him out! What a pitch.',
      'Double play! Textbook 6-4-3.',
    ],
    [EXCITEMENT_INTERESTING]: ['{team} threatening here.', 'A base hit for {team}!'],
    [EXCITEMENT_ROUTINE]: ['{team} at the plate.', 'Here comes the pitch for {team}.'],
  },
  basketball: {
    [EXCITEMENT_HUGE]: [
      'He buries it! {team}!',
      'From downtown! {team}!',
    ],
    [EXCITEMENT_BIG]: [
      'Rejected! Get that outta here!',
      'A steal! {team} running the other way!',
    ],
    [EXCITEMENT_INTERESTING]: ['{team} with a bucket.', 'And-one opportunity for {team}.'],
    [EXCITEMENT_ROUTINE]: ['{team} with the rock.', '{team} setting up the offense.'],
  },
};

const GENERIC_LEAD_INS = {
  [EXCITEMENT_HUGE]: ['What a moment!', 'Unbelievable finish!'],
  [EXCITEMENT_BIG]: ['Oh no — turnover! The momentum swings.', 'What a defensive play!'],
  [EXCITEMENT_INTERESTING]: ['Now this is interesting.', 'Keep an eye on this.'],
  [EXCITEMENT_ROUTINE]: ['And the action continues.', 'Back underway here.'],
};

const COLOR_COMMENTARY = [
  'What a play!',
  'Unbelievable!',
  'The crowd is on its feet!',
  'You love to see it!',
  "That's how you do it!",
];

// Internal rotation counters so consecutive plays vary without repeats.
const rotation = { lead: 0, color: 0 };

/** Reset internal rotation counters (useful for deterministic tests). */
export function resetCommentaryRotation() {
  rotation.lead = 0;
  rotation.color = 0;
}

function pickRotating(pool, seed) {
  if (!pool.length) return '';
  const index = typeof seed === 'number' && Number.isFinite(seed)
    ? Math.abs(Math.floor(seed)) % pool.length
    : (rotation.lead++ % pool.length);
  return pool[index];
}

function pickColor(seed) {
  const index = typeof seed === 'number' && Number.isFinite(seed)
    ? Math.abs(Math.floor(seed)) % COLOR_COMMENTARY.length
    : (rotation.color++ % COLOR_COMMENTARY.length);
  return COLOR_COMMENTARY[index];
}

/**
 * Collapse whitespace, strip URLs, and cap length at a sentence boundary.
 */
export function cleanForSpeech(text) {
  let s = String(text ?? '').replace(/\s+/g, ' ').trim();
  s = s.replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim();
  if (s.length > 400) {
    const cut = s.slice(0, 400);
    const boundaries = ['. ', '! ', '? ', '; '].map(m => cut.lastIndexOf(m));
    const at = Math.max(...boundaries);
    s = (at > 200 ? cut.slice(0, at + 1) : cut).trim();
  }
  return s;
}

/** Resolve the play's team to a displayName (falling back to abbreviation). */
export function resolveTeamName(play, game = {}) {
  const teams = [game?.awayTeam, game?.homeTeam].filter(Boolean);
  const found = teams.find(t => String(t.id) === String(play?.teamId));
  if (!found) return '';
  return String(found.displayName || found.abbreviation || '');
}

/**
 * Classify how exciting a play is: 0 (routine) to 3 (huge moment).
 * Case-insensitive; uses regexes on text+type plus play flags.
 */
export function detectExcitement(play = {}, game = {}) {
  const text = String(play?.text ?? '');
  const type = String(play?.type ?? '');
  const haystack = `${text} ${type}`;
  const sport = String(game?.sport ?? play?.sport ?? '').toLowerCase();
  const stripped = haystack.replace(/\bfield goal\b/gi, '').replace(/\bgoal line\b/gi, '');

  if (play?.scoringPlay || SCORE_PATTERN.test(haystack)) return EXCITEMENT_HUGE;
  if (GOAL_SPORTS.has(sport) && GOAL_WORD.test(stripped)) return EXCITEMENT_HUGE;

  if (play?.isTurnover || TURNOVER_PATTERN.test(haystack)) return EXCITEMENT_BIG;
  const yards = Number(play?.statYardage);
  if (FOOTBALL_LIKE.has(sport) && Number.isFinite(yards) && yards >= 25) return EXCITEMENT_BIG;

  if (INTERESTING_PATTERN.test(haystack)) return EXCITEMENT_INTERESTING;
  if (Number.isFinite(yards) && yards >= 10) return EXCITEMENT_INTERESTING;

  return EXCITEMENT_ROUTINE;
}

/**
 * Build a broadcaster-style script for a play.
 * Returns { script, excitement }. Pass opts.seed for deterministic rotation.
 */
export function buildCommentary(play = {}, game = {}, opts = {}) {
  const excitement = detectExcitement(play, game);
  const team = resolveTeamName(play, game);
  const sport = String(game?.sport ?? play?.sport ?? '').toLowerCase();
  const pool = LEAD_INS[sport]?.[excitement] || GENERIC_LEAD_INS[excitement] || [];
  let lead = pickRotating(pool, opts.seed);
  lead = lead.replaceAll('{team}', team).replace(/\s+/g, ' ').trim()
    .replace(/,\s*([!.?])/g, '$1')       // "TOUCHDOWN, !" -> "TOUCHDOWN!"
    .replace(/\s+([!.?])/g, '$1');

  const body = cleanForSpeech(play?.text) || cleanForSpeech(play?.type);
  const color = excitement === EXCITEMENT_HUGE ? pickColor(opts.seed) : '';
  const script = [lead, body, color].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return { script, excitement };
}
