import type { DailyTodoItem, DailyTodosState } from '../types/dailyTodo';
import {
  createDefaultDailyTodosState,
  reconcileDailyTodosForDate,
} from './dailyTodoMath';
import { getLocalDateKey } from './studyLogMath';

const DAILY_TODOS_STORAGE_KEY = 'syllabus_tracker_dashboard_todos_v1';

function isTodoItem(item: unknown): item is DailyTodoItem {
  return (
    Boolean(item) &&
    typeof item === 'object' &&
    typeof (item as DailyTodoItem).id === 'string' &&
    typeof (item as DailyTodoItem).title === 'string' &&
    typeof (item as DailyTodoItem).completed === 'boolean' &&
    typeof (item as DailyTodoItem).createdAt === 'number'
  );
}

export function loadDailyTodosState(
  todayKey: string = getLocalDateKey(),
): DailyTodosState {
  try {
    const raw = window.localStorage.getItem(DAILY_TODOS_STORAGE_KEY);
    if (!raw) {
      return createDefaultDailyTodosState(todayKey);
    }
    const parsed: unknown = JSON.parse(raw);

    // Backward compatibility with flat array format
    if (Array.isArray(parsed)) {
      return {
        dateKey: todayKey,
        items: parsed.filter(isTodoItem),
      };
    }

    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as DailyTodosState).dateKey === 'string' &&
      Array.isArray((parsed as DailyTodosState).items)
    ) {
      const validState: DailyTodosState = {
        dateKey: (parsed as DailyTodosState).dateKey,
        items: (parsed as DailyTodosState).items.filter(isTodoItem),
      };
      return reconcileDailyTodosForDate(validState, todayKey);
    }

    return createDefaultDailyTodosState(todayKey);
  } catch {
    return createDefaultDailyTodosState(todayKey);
  }
}

export function saveDailyTodosState(state: DailyTodosState): void {
  try {
    window.localStorage.setItem(DAILY_TODOS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage quota or private mode failures
  }
}
