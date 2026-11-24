import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addDailyTodo,
  createDefaultDailyTodosState,
  formatDayHeaderLabel,
  formatMinutesAsDecimalHours,
  getDailyWorkSummary,
  parseScreenTimeHoursInput,
  reconcileDailyTodosForDate,
  removeDailyTodo,
  toggleDailyTodo,
} from './dailyTodoMath.ts';

test('addDailyTodo validates empty/overlong titles and prepends new tasks', () => {
  const emptyRes = addDailyTodo([], '   ');
  assert.ok(emptyRes.error);
  assert.equal(emptyRes.nextItems.length, 0);

  const tooLongRes = addDailyTodo([], 'a'.repeat(81));
  assert.ok(tooLongRes.error);

  const okRes = addDailyTodo([], 'Solve 15 Trigonometry PYQs', 1000);
  assert.equal(okRes.error, null);
  assert.equal(okRes.nextItems.length, 1);
  assert.equal(okRes.nextItems[0]?.title, 'Solve 15 Trigonometry PYQs');
  assert.equal(okRes.nextItems[0]?.completed, false);
});

test('toggleDailyTodo and removeDailyTodo update list cleanly', () => {
  const { nextItems: list1 } = addDailyTodo([], 'Revise Acids & Bases', 1000);
  const { nextItems: list2 } = addDailyTodo(list1, 'Read First Flight Ch 2', 2000);
  const firstId = list2[0]!.id;

  const toggled = toggleDailyTodo(list2, firstId);
  assert.equal(toggled[0]?.completed, true);
  assert.equal(toggled[1]?.completed, false);

  const toggledBack = toggleDailyTodo(toggled, firstId);
  assert.equal(toggledBack[0]?.completed, false);

  const removed = removeDailyTodo(toggledBack, firstId);
  assert.equal(removed.length, 1);
  assert.equal(removed[0]?.title, 'Revise Acids & Bases');
});

test('getDailyWorkSummary computes remaining tasks and daily progress percentage', () => {
  const emptySummary = getDailyWorkSummary([], '2026-11-20');
  assert.equal(emptySummary.progressPercent, 0);
  assert.equal(emptySummary.remainingCount, 0);
  assert.equal(emptySummary.formattedDayLabel, formatDayHeaderLabel('2026-11-20'));

  const { nextItems: list1 } = addDailyTodo([], 'Task 1', 1000);
  const { nextItems: list2 } = addDailyTodo(list1, 'Task 2', 2000);
  const summary0 = getDailyWorkSummary(list2, '2026-11-20');
  assert.equal(summary0.progressPercent, 0);
  assert.equal(summary0.remainingCount, 2);

  const oneDone = toggleDailyTodo(list2, list2[0]!.id);
  const summary50 = getDailyWorkSummary(oneDone, '2026-11-20');
  assert.equal(summary50.progressPercent, 50);
  assert.equal(summary50.completedCount, 1);
  assert.equal(summary50.remainingCount, 1);
  assert.equal(summary50.remainingItems[0]?.title, 'Task 1');

  const allDone = toggleDailyTodo(oneDone, list2[1]!.id);
  const summary100 = getDailyWorkSummary(allDone, '2026-11-20');
  assert.equal(summary100.progressPercent, 100);
  assert.equal(summary100.remainingCount, 0);
});

test('reconcileDailyTodosForDate clears completed tasks on new day and carries over remaining ones', () => {
  const initial = createDefaultDailyTodosState('2026-11-20');
  const { nextItems: list1 } = addDailyTodo(initial.items, 'Unfinished task', 1000);
  const { nextItems: list2 } = addDailyTodo(list1, 'Finished task', 2000);
  const updated = toggleDailyTodo(list2, list2[0]!.id);

  const sameDay = reconcileDailyTodosForDate(
    { dateKey: '2026-11-20', items: updated },
    '2026-11-20',
  );
  assert.equal(sameDay.items.length, 2);

  const nextDay = reconcileDailyTodosForDate(
    { dateKey: '2026-11-20', items: updated },
    '2026-11-21',
  );
  assert.equal(nextDay.dateKey, '2026-11-21');
  assert.equal(nextDay.items.length, 1);
  assert.equal(nextDay.items[0]?.title, 'Unfinished task');
  assert.equal(nextDay.items[0]?.completed, false);
});

test('parseScreenTimeHoursInput and formatMinutesAsDecimalHours convert hours accurately', () => {
  assert.equal(parseScreenTimeHoursInput(''), 0);
  assert.equal(parseScreenTimeHoursInput('0'), 0);
  assert.equal(parseScreenTimeHoursInput('1.5'), 90);
  assert.equal(parseScreenTimeHoursInput('30'), 24 * 60);
  assert.equal(parseScreenTimeHoursInput('-2'), null);
  assert.equal(parseScreenTimeHoursInput('abc'), null);

  assert.equal(formatMinutesAsDecimalHours(0), '0');
  assert.equal(formatMinutesAsDecimalHours(120), '2');
  assert.equal(formatMinutesAsDecimalHours(90), '1.5');
});
