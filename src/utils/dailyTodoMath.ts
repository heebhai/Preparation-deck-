import type { DailyTodoItem, DailyTodosState, DailyWorkSummary } from '../types/dailyTodo';
import { getLocalDateKey, parseLocalDateKey } from './studyLogMath';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function createDefaultDailyTodosState(
  todayKey: string = getLocalDateKey(),
): DailyTodosState {
  return {
    dateKey: todayKey,
    items: [],
  };
}

/**
 * Advances the daily task list when a new calendar day arrives:
 * completed tasks from previous days are cleared, while unfinished
 * tasks remain active as remaining tasks for the new day.
 */
export function reconcileDailyTodosForDate(
  state: DailyTodosState,
  todayKey: string = getLocalDateKey(),
): DailyTodosState {
  if (state.dateKey === todayKey) {
    return state;
  }
  return {
    dateKey: todayKey,
    items: state.items.filter((item) => !item.completed),
  };
}

export function formatDayHeaderLabel(dateKey: string): string {
  const parsed = parseLocalDateKey(dateKey);
  if (!parsed) {
    return dateKey;
  }
  const weekday = WEEKDAY_SHORT[parsed.getDay()];
  const day = parsed.getDate();
  const month = MONTH_SHORT[parsed.getMonth()];
  return `${weekday}, ${day} ${month}`;
}

export function getDailyWorkSummary(
  items: ReadonlyArray<DailyTodoItem>,
  dateKey: string = getLocalDateKey(),
): DailyWorkSummary {
  const totalCount = items.length;
  const remainingItems = items.filter((item) => !item.completed);
  const remainingCount = remainingItems.length;
  const completedCount = totalCount - remainingCount;
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return {
    dateKey,
    formattedDayLabel: formatDayHeaderLabel(dateKey),
    totalCount,
    completedCount,
    remainingCount,
    remainingItems,
    progressPercent,
  };
}

export function addDailyTodo(
  items: ReadonlyArray<DailyTodoItem>,
  rawTitle: string,
  now: number = Date.now(),
): { nextItems: DailyTodoItem[]; error: string | null } {
  const trimmed = rawTitle.trim();
  if (!trimmed) {
    return { nextItems: [...items], error: 'Please enter a task or goal.' };
  }
  if (trimmed.length > 80) {
    return {
      nextItems: [...items],
      error: 'Task must be 80 characters or fewer.',
    };
  }

  const newItem: DailyTodoItem = {
    id: `todo-${now}-${Math.random().toString(36).slice(2, 6)}`,
    title: trimmed,
    completed: false,
    createdAt: now,
  };

  return {
    nextItems: [newItem, ...items],
    error: null,
  };
}

export function toggleDailyTodo(
  items: ReadonlyArray<DailyTodoItem>,
  todoId: string,
): DailyTodoItem[] {
  return items.map((item) =>
    item.id === todoId ? { ...item, completed: !item.completed } : item,
  );
}

export function removeDailyTodo(
  items: ReadonlyArray<DailyTodoItem>,
  todoId: string,
): DailyTodoItem[] {
  return items.filter((item) => item.id !== todoId);
}

export function parseScreenTimeHoursInput(rawHours: string): number | null {
  const trimmed = rawHours.trim();
  if (!trimmed) {
    return 0;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  const clampedHours = Math.min(24, parsed);
  return Math.round(clampedHours * 60);
}

export function formatMinutesAsDecimalHours(totalMinutes: number): string {
  const safeMins = Math.max(0, Math.min(24 * 60, Math.round(totalMinutes)));
  if (safeMins === 0) {
    return '0';
  }
  const hours = safeMins / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(/\.0$/, '');
}
