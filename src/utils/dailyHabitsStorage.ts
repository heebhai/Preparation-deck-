import type { DailyHabit, DailyHabitsState } from '../types/dailyHabit';
import {
  createDefaultDailyHabitsState,
  reconcileDailyHabitsForDate,
} from './dailyHabitsMath';
import { getLocalDateKey } from './studyLogMath';

const DAILY_HABITS_STORAGE_KEY = 'syllabus_tracker_daily_habits_v1';

function isValidHabit(value: unknown): value is DailyHabit {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    record.id.length > 0 &&
    typeof record.title === 'string' &&
    record.title.trim().length > 0 &&
    typeof record.emoji === 'string'
  );
}

export function loadDailyHabitsState(
  todayKey: string = getLocalDateKey(),
): DailyHabitsState {
  try {
    const raw = window.localStorage.getItem(DAILY_HABITS_STORAGE_KEY);
    if (!raw) {
      const fresh = createDefaultDailyHabitsState(todayKey);
      saveDailyHabitsState(fresh);
      return fresh;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return createDefaultDailyHabitsState(todayKey);
    }

    const record = parsed as Record<string, unknown>;
    const dateKey =
      typeof record.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(record.dateKey)
        ? record.dateKey
        : todayKey;
    const habits = Array.isArray(record.habits)
      ? record.habits.filter(isValidHabit)
      : createDefaultDailyHabitsState(todayKey).habits;
    const completedIds = Array.isArray(record.completedIds)
      ? record.completedIds.filter((id): id is string => typeof id === 'string')
      : [];

    const reconciled = reconcileDailyHabitsForDate(
      {
        dateKey,
        habits: habits.length > 0 ? habits : createDefaultDailyHabitsState(todayKey).habits,
        completedIds,
      },
      todayKey,
    );

    if (reconciled.dateKey !== dateKey) {
      saveDailyHabitsState(reconciled);
    }
    return reconciled;
  } catch {
    return createDefaultDailyHabitsState(todayKey);
  }
}

export function saveDailyHabitsState(state: DailyHabitsState): void {
  try {
    window.localStorage.setItem(DAILY_HABITS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota / privacy errors
  }
}
