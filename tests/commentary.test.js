import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCommentary,
  cleanForSpeech,
  detectExcitement,
  resetCommentaryRotation,
  EXCITEMENT_BIG,
  EXCITEMENT_HUGE,
  EXCITEMENT_INTERESTING,
  EXCITEMENT_ROUTINE,
} from '../client/src/utils/commentary.js';

const footballGame = {
  sport: 'football',
  awayTeam: { id: '1', displayName: 'Eagles', abbreviation: 'PHI' },
  homeTeam: { id: '2', displayName: 'Cowboys', abbreviation: 'DAL' },
};

test('missed field goal is not treated as a huge moment', () => {
  const play = { id: 'p1', text: 'Missed 45-yard field goal attempt, wide right.' };
  const excitement = detectExcitement(play, footballGame);
  assert.notEqual(excitement, EXCITEMENT_HUGE);
  assert.equal(excitement, EXCITEMENT_INTERESTING);
});

test('interception -> excitement 2', () => {
  const play = { id: 'p2', text: 'Pass intercepted by the defense at midfield.' };
  assert.equal(detectExcitement(play, footballGame), EXCITEMENT_BIG);
});

test('long football gain (25+ yards) -> excitement 2', () => {
  const play = { id: 'p3', text: 'Deep pass complete for 32 yards.', statYardage: 32 };
  assert.equal(detectExcitement(play, footballGame), EXCITEMENT_BIG);
});

test('routine play -> excitement 0', () => {
  const play = { id: 'p4', text: 'Handoff up the middle for a gain of 2.' };
  assert.equal(detectExcitement(play, footballGame), EXCITEMENT_ROUTINE);
});

test('made field goal -> excitement 1', () => {
  const play = { id: 'p5', text: '45-yard field goal is GOOD.' };
  assert.equal(detectExcitement(play, footballGame), EXCITEMENT_INTERESTING);
});

test('cleanForSpeech collapses whitespace, strips URLs, and caps length', () => {
  assert.equal(cleanForSpeech('  Too   much\nspace  '), 'Too much space');
  assert.equal(cleanForSpeech('See https://example.com/x for details'), 'See for details');
  const long = `Start. ${'word '.repeat(200)}End.`;
  const cleaned = cleanForSpeech(long);
  assert.ok(cleaned.length <= 401, `expected capped length, got ${cleaned.length}`);
  assert.ok(cleaned.startsWith('Start.'));
});

test('color commentary rotates without immediate repeats', () => {
  resetCommentaryRotation();
  const play = { id: 'p6', text: 'Touchdown pass complete!', teamId: '1', scoringPlay: true };
  const s1 = buildCommentary(play, footballGame).script;
  const s2 = buildCommentary(play, footballGame).script;
  const s3 = buildCommentary(play, footballGame).script;
  assert.notEqual(s1, s2);
  assert.notEqual(s2, s3);
  assert.notEqual(s1, s3);
});

test('deterministic with a seed', () => {
  resetCommentaryRotation();
  const play = { id: 'p7', text: 'Touchdown run up the middle!', teamId: '2' };
  const a = buildCommentary(play, footballGame, { seed: 42 });
  const b = buildCommentary(play, footballGame, { seed: 42 });
  assert.deepEqual(a, b);
  assert.equal(a.excitement, EXCITEMENT_HUGE);
  assert.match(a.script, /Cowboys/);
});

test('unknown sport and missing data do not crash', () => {
  const r1 = buildCommentary({}, {});
  assert.equal(typeof r1.script, 'string');
  assert.equal(r1.excitement, EXCITEMENT_ROUTINE);
  const r2 = buildCommentary();
  assert.equal(typeof r2.script, 'string');
  const r3 = buildCommentary({ text: 'Goal!' }, { sport: 'quidditch' });
  assert.equal(typeof r3.script, 'string');
});

test('team abbreviation fallback when displayName is missing', () => {
  const game = {
    sport: 'football',
    awayTeam: { id: '1', abbreviation: 'PHI' },
    homeTeam: { id: '2', abbreviation: 'DAL' },
  };
  const { script } = buildCommentary({ id: 'p8', text: 'Touchdown!', teamId: '1' }, game, { seed: 1 });
  assert.match(script, /PHI/);
});
