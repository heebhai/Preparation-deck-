import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateCalendarDaysBetween,
  createDefaultBoardExamSettings,
  evaluateExamCountdown,
  formatExamDisplayDate,
  getDefaultBoardExamDateKey,
  validateExamDateKey,
} from './examCountdownMath.ts';

test('getDefaultBoardExamDateKey picks upcoming Feb 15 CBSE exam cycle', () => {
  assert.equal(getDefaultBoardExamDateKey('2026-11-20'), '2027-02-15');
  assert.equal(getDefaultBoardExamDateKey('2027-01-10'), '2027-02-15');
  assert.equal(getDefaultBoardExamDateKey('2027-02-15'), '2027-02-15');
  assert.equal(getDefaultBoardExamDateKey('2027-02-16'), '2028-02-15');
});

test('evaluateExamCountdown calculates exact days remaining for upcoming, today, and passed dates', () => {
  const upcoming = evaluateExamCountdown(
    { examDateKey: '2027-02-15', isCustom: false },
    '2026-11-20',
  );
  assert.equal(upcoming.daysRemaining, 87);
  assert.equal(upcoming.headlineValue, '87');
  assert.equal(upcoming.headlineUnit, 'days left');
  assert.equal(upcoming.phase, 'upcoming');
  assert.equal(upcoming.formattedExamDate, '15 Feb 2027');

  const oneDay = evaluateExamCountdown(
    { examDateKey: '2027-02-15', isCustom: true },
    '2027-02-14',
  );
  assert.equal(oneDay.daysRemaining, 1);
  assert.equal(oneDay.headlineUnit, 'day left');

  const today = evaluateExamCountdown(
    { examDateKey: '2027-02-15', isCustom: true },
    '2027-02-15',
  );
  assert.equal(today.daysRemaining, 0);
  assert.equal(today.phase, 'today');
  assert.equal(today.headlineUnit, 'Exam day today');

  const passed = evaluateExamCountdown(
    { examDateKey: '2027-02-15', isCustom: true },
    '2027-02-20',
  );
  assert.equal(passed.daysRemaining, -5);
  assert.equal(passed.phase, 'passed');
  assert.equal(passed.headlineUnit, '5 days ago');
});

test('calculateCalendarDaysBetween handles leap years and DST boundaries cleanly', () => {
  assert.equal(calculateCalendarDaysBetween('2024-02-28', '2024-03-01'), 2);
  assert.equal(calculateCalendarDaysBetween('2026-10-31', '2026-11-05'), 5);
});

test('validateExamDateKey validates calendar format and year bounds', () => {
  assert.deepEqual(validateExamDateKey('2027-02-18'), {
    valid: true,
    dateKey: '2027-02-18',
  });
  assert.equal(validateExamDateKey('').valid, false);
  assert.equal(validateExamDateKey('2027-02-30').valid, false);
  assert.equal(validateExamDateKey('2015-02-15').valid, false);
});

test('createDefaultBoardExamSettings and formatExamDisplayDate return readable output', () => {
  const defaults = createDefaultBoardExamSettings('2026-11-20');
  assert.equal(defaults.examDateKey, '2027-02-15');
  assert.equal(defaults.isCustom, false);
  assert.equal(formatExamDisplayDate(defaults.examDateKey), '15 Feb 2027');
});
