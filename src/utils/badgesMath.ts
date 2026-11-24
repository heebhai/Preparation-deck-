import type { StudyLogEntry } from '../types/studyLog';
import type { MilestoneKey, Subject } from '../types/syllabus';
import {
  getLocalDateKey,
  shiftLocalDateKey,
} from './studyLogMath';
import { isChapterComplete, MILESTONE_ITEMS } from './syllabusMath';

export type BadgeId =
  | 'early-bird'
  | 'night-owl'
  | 'chapter-crusher'
  | 'on-fire'
  | 'deep-focus';

export type BadgeTone = 'amber' | 'indigo' | 'emerald' | 'orange' | 'violet';

export interface BadgeDefinition {
  id: BadgeId;
  emoji: string;
  title: string;
  description: string;
  tone: BadgeTone;
}

export interface BadgeStatus extends BadgeDefinition {
  unlocked: boolean;
  unlockedAt: number | null;
}

export interface GamificationEvaluation {
  badges: BadgeStatus[];
  newlyUnlocked: BadgeStatus[];
  updatedSavedMap: Partial<Record<BadgeId, number>>;
  currentStreakDays: number;
  bestStreakDays: number;
}

export const BADGE_CATALOG: ReadonlyArray<BadgeDefinition> = [
  {
    id: 'early-bird',
    emoji: '🌅',
    title: 'Early Bird',
    description: 'Study before 8:00 AM',
    tone: 'amber',
  },
  {
    id: 'night-owl',
    emoji: '🦉',
    title: 'Night Owl',
    description: 'Study after 10:00 PM',
    tone: 'indigo',
  },
  {
    id: 'chapter-crusher',
    emoji: '📚',
    title: 'Chapter Crusher',
    description: 'Complete all 4 circles for any 1 chapter in a day',
    tone: 'emerald',
  },
  {
    id: 'on-fire',
    emoji: '🔥',
    title: 'On Fire',
    description: 'Achieve a 3-day streak',
    tone: 'orange',
  },
  {
    id: 'deep-focus',
    emoji: '🎯',
    title: 'Deep Focus',
    description: 'Log a single session of 3+ hours',
    tone: 'violet',
  },
] as const;

export const STREAK_MIN_SESSION_MINUTES = 21; // strictly > 20 minutes
export const DEEP_FOCUS_MIN_MINUTES = 180; // 3+ hours single session

/**
 * A day counts toward the study streak if EITHER:
 * - total study time logged for that day is >= 60 minutes, OR
 * - at least 2 chapter checkboxes were completed on that calendar day.
 */
export function collectQualifyingStreakDates(
  logs: ReadonlyArray<StudyLogEntry>,
  subjects: ReadonlyArray<Subject>,
): Set<string> {
  const minutesByDate = new Map<string, number>();
  for (const log of logs) {
    if (log.durationMinutes > 0 && log.date) {
      minutesByDate.set(
        log.date,
        (minutesByDate.get(log.date) ?? 0) + log.durationMinutes,
      );
    }
  }

  const checkboxesByDate = new Map<string, number>();
  for (const subject of subjects) {
    for (const sub of subject.subSubjects) {
      for (const chapter of sub.chapters) {
        const timestamps = chapter.milestoneTimestamps;
        for (const { key } of MILESTONE_ITEMS) {
          if (!chapter.milestones[key]) continue;
          const ts = timestamps?.[key];
          if (typeof ts === 'number' && Number.isFinite(ts)) {
            const dateKey = getLocalDateKey(new Date(ts));
            checkboxesByDate.set(dateKey, (checkboxesByDate.get(dateKey) ?? 0) + 1);
          }
        }
      }
    }
  }

  const qualifyingDates = new Set<string>();
  const allDates = new Set([...minutesByDate.keys(), ...checkboxesByDate.keys()]);

  for (const dateKey of allDates) {
    const totalMins = minutesByDate.get(dateKey) ?? 0;
    const totalChecks = checkboxesByDate.get(dateKey) ?? 0;
    if (totalMins >= 60 || totalChecks >= 2) {
      qualifyingDates.add(dateKey);
    }
  }

  return qualifyingDates;
}

export function calculateBestStreak(qualifyingDates: ReadonlySet<string>): number {
  if (qualifyingDates.size === 0) return 0;
  const sorted = Array.from(qualifyingDates).sort();
  let best = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (shiftLocalDateKey(prev, 1) === curr) {
      run += 1;
      if (run > best) {
        best = run;
      }
    } else {
      run = 1;
    }
  }
  return best;
}

/**
 * Current streak with optional Streak Protector support (1 day missed tolerance).
 */
export function calculateCurrentStreak(
  qualifyingDates: ReadonlySet<string>,
  todayKey: string = getLocalDateKey(),
  hasStreakProtector: boolean = false,
): number {
  if (qualifyingDates.size === 0) return 0;

  let anchor = todayKey;
  if (!qualifyingDates.has(anchor)) {
    const yesterday = shiftLocalDateKey(todayKey, -1);
    if (!qualifyingDates.has(yesterday)) {
      if (hasStreakProtector) {
        const dayBeforeYesterday = shiftLocalDateKey(todayKey, -2);
        if (qualifyingDates.has(dayBeforeYesterday)) {
          let streak = 0;
          let cursor = dayBeforeYesterday;
          while (qualifyingDates.has(cursor)) {
            streak += 1;
            cursor = shiftLocalDateKey(cursor, -1);
          }
          return streak;
        }
      }
      return 0;
    }
    anchor = yesterday;
  }

  let streak = 0;
  let cursor = anchor;
  let missedDays = 0;
  while (true) {
    if (qualifyingDates.has(cursor)) {
      streak += 1;
      cursor = shiftLocalDateKey(cursor, -1);
    } else {
      if (hasStreakProtector && missedDays === 0) {
        missedDays += 1;
        cursor = shiftLocalDateKey(cursor, -1);
      } else {
        break;
      }
    }
  }
  return streak;
}

function detectConditionMatches(
  logs: ReadonlyArray<StudyLogEntry>,
  subjects: ReadonlyArray<Subject>,
  bestStreakDays: number,
): Record<BadgeId, boolean> {
  let hasEarlyBird = false;
  let hasNightOwl = false;
  let hasChapterCrusher = false;
  let hasDeepFocus = false;

  for (const log of logs) {
    if (log.durationMinutes <= 0) continue;
    if (log.durationMinutes >= DEEP_FOCUS_MIN_MINUTES) {
      hasDeepFocus = true;
    }
    if (typeof log.createdAt === 'number' && Number.isFinite(log.createdAt)) {
      const createdDate = new Date(log.createdAt);
      if (getLocalDateKey(createdDate) === log.date) {
        const hour = createdDate.getHours();
        if (hour < 8) {
          hasEarlyBird = true;
        }
        if (hour >= 22) {
          hasNightOwl = true;
        }
      }
    }
  }

  const milestoneKeys: MilestoneKey[] = ['lecture', 'notes', 'practice', 'extra'];
  for (const subject of subjects) {
    for (const sub of subject.subSubjects) {
      for (const chapter of sub.chapters) {
        const timestamps = chapter.milestoneTimestamps;
        for (const key of milestoneKeys) {
          if (!chapter.milestones[key]) continue;
          const ts = timestamps?.[key];
          if (typeof ts === 'number' && Number.isFinite(ts)) {
            const dt = new Date(ts);
            const hour = dt.getHours();
            if (hour < 8) {
              hasEarlyBird = true;
            }
            if (hour >= 22) {
              hasNightOwl = true;
            }
          }
        }

        if (isChapterComplete(chapter) && timestamps) {
          const dayKeys = milestoneKeys.map((key) => {
            const ts = timestamps[key];
            return typeof ts === 'number' && Number.isFinite(ts)
              ? getLocalDateKey(new Date(ts))
              : null;
          });
          if (
            dayKeys[0] !== null &&
            dayKeys.every((day) => day === dayKeys[0])
          ) {
            hasChapterCrusher = true;
          }
        }
      }
    }
  }

  return {
    'early-bird': hasEarlyBird,
    'night-owl': hasNightOwl,
    'chapter-crusher': hasChapterCrusher,
    'on-fire': bestStreakDays >= 3,
    'deep-focus': hasDeepFocus,
  };
}

export function evaluateGamification(
  logs: ReadonlyArray<StudyLogEntry>,
  subjects: ReadonlyArray<Subject>,
  savedUnlockedMap: Partial<Record<BadgeId, number>> = {},
  todayKey: string = getLocalDateKey(),
  nowTimestamp: number = Date.now(),
  hasStreakProtector: boolean = false,
): GamificationEvaluation {
  const qualifyingDates = collectQualifyingStreakDates(logs, subjects);
  const bestStreakDays = calculateBestStreak(qualifyingDates);
  const currentStreakDays = calculateCurrentStreak(qualifyingDates, todayKey, hasStreakProtector);
  const conditionMatches = detectConditionMatches(logs, subjects, bestStreakDays);

  const updatedSavedMap: Partial<Record<BadgeId, number>> = { ...savedUnlockedMap };
  const newlyUnlocked: BadgeStatus[] = [];

  const badges: BadgeStatus[] = BADGE_CATALOG.map((def) => {
    const previouslyUnlockedAt = savedUnlockedMap[def.id];
    if (typeof previouslyUnlockedAt === 'number' && Number.isFinite(previouslyUnlockedAt)) {
      return {
        ...def,
        unlocked: true,
        unlockedAt: previouslyUnlockedAt,
      };
    }

    if (conditionMatches[def.id]) {
      updatedSavedMap[def.id] = nowTimestamp;
      const unlockedBadge: BadgeStatus = {
        ...def,
        unlocked: true,
        unlockedAt: nowTimestamp,
      };
      newlyUnlocked.push(unlockedBadge);
      return unlockedBadge;
    }

    return {
      ...def,
      unlocked: false,
      unlockedAt: null,
    };
  });

  return {
    badges,
    newlyUnlocked,
    updatedSavedMap,
    currentStreakDays,
    bestStreakDays,
  };
}

export function getScreenTimeStatus(
  screenTimeMinutes: number,
  studyTimeMinutes: number,
): {
  screenTimeMinutes: number;
  studyTimeMinutes: number;
  isHigherThanStudy: boolean;
} {
  const safeScreen = Math.max(0, Math.min(24 * 60, Math.round(screenTimeMinutes)));
  const safeStudy = Math.max(0, Math.round(studyTimeMinutes));
  return {
    screenTimeMinutes: safeScreen,
    studyTimeMinutes: safeStudy,
    isHigherThanStudy: safeScreen > 0 && safeScreen > safeStudy,
  };
}
