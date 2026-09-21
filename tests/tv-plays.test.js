import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTVPlays } from '../server/tvPlays.js';
import { fieldModel } from '../client/src/utils/fieldModel.js';

test('baseball keeps chronological order when sequence numbers reset', () => {
  const result = normalizeTVPlays({ plays: [
    { id: 'first', text: 'First pitch', sequenceNumber: '5' },
    { id: 'second', text: 'Second inning', sequenceNumber: '1' },
  ] });
  assert.deepEqual(result.map(p => p.id), ['first', 'second']);
});
test('drives preserve positions, inherit possession and deduplicate current drive', () => {
  const p = { id: 'a', text: 'Rush', end: { yardsToEndzone: 70, distance: 6 }, statYardage: 4 };
  const d = { team: { id: '12' }, plays: [p, { id: 'b', text: 'Pass', end: { yardsToEndzone: 55 } }] };
  const plays = normalizeTVPlays({ drives: { previous: [d], current: d } });
  assert.equal(plays.length, 2);
  assert.equal(plays[1].start.yardsToEndzone, 70);
  assert.equal(plays[0].teamId, '12');
  assert.deepEqual(fieldModel('football', plays[0]).start, [308, 250]);
  assert.deepEqual(fieldModel('football', plays[1]).end, [460, 250]);
});
test('commentary respects ascending or descending explicit sequence', () => {
  const a = { sequence: 0, text: 'Kickoff' }, b = { sequence: 1, text: 'Goal' };
  assert.deepEqual(normalizeTVPlays({ commentary: [b, a] }).map(p => p.text), ['Kickoff', 'Goal']);
  assert.deepEqual(normalizeTVPlays({ commentary: [a, b] }).map(p => p.text), ['Kickoff', 'Goal']);
});
test('zero-yard positions are valid and turnovers do not reverse the field', () => {
  const model = fieldModel('football', { start: { yardsToEndzone: 10, distance: 10 }, end: { yardsToEndzone: 0 } });
  assert.deepEqual(model.end, [900, 250]);
  assert.equal(model.firstDown, 900);
  const turnover = fieldModel('football', { start: { yardsToEndzone: 80 }, end: { yardsToEndzone: 20 }, isTurnover: true });
  assert.deepEqual(turnover.start, turnover.end);
});
test('all sport renderers provide bounded events and honest missing-data states', () => {
  for (const sport of ['football', 'basketball', 'baseball', 'soccer', 'hockey']) {
    const m = fieldModel(sport, { text: 'Shot', type: 'Shot' });
    assert.equal(m.label, 'Illustrative action');
    for (const [x, y] of [m.start, m.end]) assert.ok(x >= 0 && x <= 1000 && y >= 0 && y <= 500);
    assert.equal(fieldModel(sport, null).start, null);
    assert.equal(fieldModel(sport, { text: 'End of Game' }).start, null);
  }
});
