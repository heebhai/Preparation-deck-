import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addQuote,
  assignQuoteSchedule,
  createSeededQuotes,
  deleteQuote,
  editQuote,
  getDailyQuote,
  MAX_QUOTES,
  randomizeDailyQuote,
  shuffleQuotes,
} from './quoteMath';

test('pre-loads 30 motivational quotes by default', () => {
  const seeded = createSeededQuotes(1000);
  assert.equal(seeded.length, 30);
  assert.ok(seeded.every((q) => q.text.length > 0 && q.scheduledDateKey === null));
});

test('getDailyQuote prioritizes scheduled quote for the date over deterministic pick', () => {
  const quotes = createSeededQuotes(1000);
  const target = quotes[5];
  const updated = assignQuoteSchedule(quotes, target.id, '2026-11-25');

  const picked = getDailyQuote(updated, '2026-11-25');
  assert.equal(picked.id, target.id);

  // Re-assigning another quote to the same date clears the old schedule
  const replacement = quotes[10];
  const reassigned = assignQuoteSchedule(updated, replacement.id, '2026-11-25');
  assert.equal(reassigned.find((q) => q.id === target.id)?.scheduledDateKey, null);
  assert.equal(getDailyQuote(reassigned, '2026-11-25').id, replacement.id);
});

test('enforces max 30 quotes limit and supports add, edit, delete, shuffle, randomize', () => {
  const seeded = createSeededQuotes(1000);
  assert.equal(seeded.length, MAX_QUOTES);

  // Cannot add 31st quote until one is deleted
  const blocked = addQuote(seeded, 'Extra quote', 'Tester');
  assert.ok(blocked.error);
  assert.equal(blocked.quotes.length, MAX_QUOTES);

  // Delete one, then add
  const afterDelete = deleteQuote(seeded, seeded[0].id);
  assert.equal(afterDelete.length, MAX_QUOTES - 1);

  const added = addQuote(afterDelete, 'Keep pushing forward', 'Custom');
  assert.equal(added.error, undefined);
  assert.equal(added.quotes.length, MAX_QUOTES);
  assert.equal(added.quotes[0].text, 'Keep pushing forward');

  // Edit quote
  const edited = editQuote(added.quotes, added.quotes[0].id, 'Updated quote', 'New Author');
  assert.equal(edited[0].text, 'Updated quote');
  assert.equal(edited[0].author, 'New Author');

  // Shuffle keeps same items
  const shuffled = shuffleQuotes(edited);
  assert.equal(shuffled.length, edited.length);

  // Randomize returns a valid item from the list
  const randomPick = randomizeDailyQuote(shuffled, shuffled[0].id);
  assert.notEqual(randomPick.id, shuffled[0].id);
});
