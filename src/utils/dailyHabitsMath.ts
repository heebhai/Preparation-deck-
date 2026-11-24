import type { DailyHabit, DailyHabitsState } from '../types/dailyHabit';
import { getLocalDateKey } from './studyLogMath';

export const DEFAULT_DAILY_HABITS: ReadonlyArray<DailyHabit> = [
  {
    id: 'habit-sleep-8h',
    title: 'Sleep 8 hours',
    emoji: '😴',
    isDefault: true,
  },
  {
    id: 'habit-drink-water',
    title: 'Drink water',
    emoji: '💧',
    isDefault: true,
  },
  {
    id: 'habit-move-stretch',
    title: '20m Exercise / Stretch',
    emoji: '🏃',
    isDefault: true,
  },
  {
    id: 'habit-screen-breaks',
    title: 'No-screen study breaks',
    emoji: '🌿',
    isDefault: true,
  },
] as const;

export function createDefaultDailyHabitsState(
  todayKey: string = getLocalDateKey(),
): DailyHabitsState {
  return {
    dateKey: todayKey,
    habits: DEFAULT_DAILY_HABITS.map((h) => ({ ...h })),
    completedIds: [],
  };
}

/**
 * Ensures checked habits automatically reset to unchecked when the calendar date changes,
 * while keeping the user's configured habit list intact.
 */
export function reconcileDailyHabitsForDate(
  state: DailyHabitsState,
  todayKey: string = getLocalDateKey(),
): DailyHabitsState {
  const validIds = new Set(state.habits.map((h) => h.id));
  if (state.dateKey !== todayKey) {
    return {
      dateKey: todayKey,
      habits: state.habits,
      completedIds: [],
    };
  }
  const uniqueValidCompleted = Array.from(
    new Set(state.completedIds.filter((id) => validIds.has(id))),
  );
  if (
    uniqueValidCompleted.length === state.completedIds.length &&
    state.dateKey === todayKey
  ) {
    return state;
  }
  return {
    dateKey: todayKey,
    habits: state.habits,
    completedIds: uniqueValidCompleted,
  };
}

export function toggleDailyHabit(
  state: DailyHabitsState,
  habitId: string,
  todayKey: string = getLocalDateKey(),
): DailyHabitsState {
  const reconciled = reconcileDailyHabitsForDate(state, todayKey);
  if (!reconciled.habits.some((h) => h.id === habitId)) {
    return reconciled;
  }
  const exists = reconciled.completedIds.includes(habitId);
  return {
    ...reconciled,
    completedIds: exists
      ? reconciled.completedIds.filter((id) => id !== habitId)
      : [...reconciled.completedIds, habitId],
  };
}

export function addDailyHabit(
  state: DailyHabitsState,
  rawTitle: string,
  emoji: string = '✨',
  todayKey: string = getLocalDateKey(),
): { nextState: DailyHabitsState; error: string | null } {
  const reconciled = reconcileDailyHabitsForDate(state, todayKey);
  const trimmed = rawTitle.trim();
  if (!trimmed) {
    return { nextState: reconciled, error: 'Please enter a habit name.' };
  }
  if (trimmed.length > 48) {
    return {
      nextState: reconciled,
      error: 'Habit name must be 48 characters or fewer.',
    };
  }
  if (
    reconciled.habits.some(
      (h) => h.title.toLowerCase() === trimmed.toLowerCase(),
    )
  ) {
    return { nextState: reconciled, error: 'This habit is already on your list.' };
  }

  const newHabit: DailyHabit = {
    id: `habit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: trimmed,
    emoji: emoji.trim() || '✨',
    isDefault: false,
  };

  return {
    nextState: {
      ...reconciled,
      habits: [...reconciled.habits, newHabit],
    },
    error: null,
  };
}

export function removeDailyHabit(
  state: DailyHabitsState,
  habitId: string,
  todayKey: string = getLocalDateKey(),
): DailyHabitsState {
  const reconciled = reconcileDailyHabitsForDate(state, todayKey);
  return {
    ...reconciled,
    habits: reconciled.habits.filter((h) => h.id !== habitId),
    completedIds: reconciled.completedIds.filter((id) => id !== habitId),
  };
}
