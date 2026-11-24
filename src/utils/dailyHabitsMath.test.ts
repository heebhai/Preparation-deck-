import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addDailyHabit,
  createDefaultDailyHabitsState,
  reconcileDailyHabitsForDate,
  removeDailyHabit,
  toggleDailyHabit,
} from './dailyHabitsMath';

test('createDefaultDailyHabitsState starts unchecked with Sleep 8 hours and Drink water', () => {
  const state = createDefaultDailyHabitsState('2026-11-20');
  assert.equal(state.dateKey, '2026-11-20');
  assert.equal(state.completedIds.length, 0);
  assert.ok(state.habits.some((h) => h.title === 'Sleep 8 hours'));
  assert.ok(state.habits.some((h) => h.title === 'Drink water'));
});

test('toggleDailyHabit checks and unchecks habits on the same day', () => {
  const initial = createDefaultDailyHabitsState('2026-11-20');
  const checked = toggleDailyHabit(initial, 'habit-sleep-8h', '2026-11-20');
  assert.deepEqual(checked.completedIds, ['habit-sleep-8h']);

  const unchecked = toggleDailyHabit(checked, 'habit-sleep-8h', '2026-11-20');
  assert.deepEqual(unchecked.completedIds, []);
});

test('reconcileDailyHabitsForDate resets completed checkboxes when the calendar day changes', () => {
  const day1 = toggleDailyHabit(
    toggleDailyHabit(
      createDefaultDailyHabitsState('2026-11-20'),
      'habit-sleep-8h',
      '2026-11-20',
    ),
    'habit-drink-water',
    '2026-11-20',
  );
  assert.equal(day1.completedIds.length, 2);

  const day2 = reconcileDailyHabitsForDate(day1, '2026-11-21');
  assert.equal(day2.dateKey, '2026-11-21');
  assert.deepEqual(day2.completedIds, []);
  assert.equal(day2.habits.length, day1.habits.length);
});

test('addDailyHabit and removeDailyHabit validate and manage custom habits cleanly', () => {
  const base = createDefaultDailyHabitsState('2026-11-20');
  const invalid = addDailyHabit(base, '   ', '✨', '2026-11-20');
  assert.ok(invalid.error);

  const dup = addDailyHabit(base, 'sleep 8 hours', '😴', '2026-11-20');
  assert.ok(dup.error);

  const added = addDailyHabit(base, 'Meditate 10 mins', '🧘', '2026-11-20');
  assert.equal(added.error, null);
  assert.equal(added.nextState.habits.length, base.habits.length + 1);

  const addedHabit = added.nextState.habits[added.nextState.habits.length - 1];
  const checked = toggleDailyHabit(added.nextState, addedHabit.id, '2026-11-20');
  assert.ok(checked.completedIds.includes(addedHabit.id));

  const removed = removeDailyHabit(checked, addedHabit.id, '2026-11-20');
  assert.equal(removed.habits.length, base.habits.length);
  assert.ok(!removed.completedIds.includes(addedHabit.id));
});
