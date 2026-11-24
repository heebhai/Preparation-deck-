import type { GoalPeriod, SubjectStudyGoal } from '../types/studyGoal';
import type { StudyLogEntry } from '../types/studyLog';
import type { Subject, SubjectAccent } from '../types/syllabus';
import {
  capDailyMinutes,
  getLocalDateKey,
  getWeekBounds,
} from './studyLogMath';

export const MAX_DAILY_GOAL_MINUTES = 24 * 60; // 1440
export const MAX_WEEKLY_GOAL_MINUTES = 7 * 24 * 60; // 10080

const DEFAULT_GOAL_PRESETS: Record<string, { dailyMinutes: number; weeklyMinutes: number }> = {
  science: { dailyMinutes: 90, weeklyMinutes: 540 }, // 1h 30m / day, 9h / week
  sst: { dailyMinutes: 60, weeklyMinutes: 360 }, // 1h / day, 6h / week
  maths: { dailyMinutes: 120, weeklyMinutes: 720 }, // 2h / day, 12h / week
  english: { dailyMinutes: 45, weeklyMinutes: 240 }, // 45m / day, 4h / week
  hindi: { dailyMinutes: 45, weeklyMinutes: 240 }, // 45m / day, 4h / week
};

export interface SubjectGoalProgress {
  subjectId: string;
  subjectName: string;
  accent: SubjectAccent;
  period: GoalPeriod;
  loggedMinutes: number;
  targetMinutes: number;
  remainingMinutes: number;
  rawPercent: number;
  ringPercent: number; // clamped 0..100 for circular progress ring
  hasGoal: boolean;
  isGoalMet: boolean;
}

export interface OverallGoalsSummary {
  totalLoggedMinutes: number;
  totalTargetMinutes: number;
  goalsMetCount: number;
  activeGoalsCount: number;
  overallPercent: number;
}

export function createDefaultSubjectGoals(
  subjects: ReadonlyArray<Subject>,
): SubjectStudyGoal[] {
  return subjects.map((subject) => {
    const preset = DEFAULT_GOAL_PRESETS[subject.id] ?? {
      dailyMinutes: 60,
      weeklyMinutes: 360,
    };
    return {
      subjectId: subject.id,
      dailyMinutes: preset.dailyMinutes,
      weeklyMinutes: preset.weeklyMinutes,
    };
  });
}

export function calculateSubjectLoggedMinutes(
  logs: ReadonlyArray<StudyLogEntry>,
  subjectId: string,
  period: GoalPeriod,
  referenceDateKey: string = getLocalDateKey(),
): number {
  const byDate = new Map<string, number>();

  for (const log of logs) {
    if (log.subjectId !== subjectId) {
      continue;
    }
    if (!Number.isFinite(log.durationMinutes) || log.durationMinutes <= 0) {
      continue;
    }
    byDate.set(log.date, (byDate.get(log.date) ?? 0) + log.durationMinutes);
  }

  if (period === 'daily') {
    return capDailyMinutes(byDate.get(referenceDateKey) ?? 0);
  }

  const { startKey, endKey } = getWeekBounds(referenceDateKey);
  let weekTotal = 0;
  for (const [dateKey, rawMinutes] of byDate.entries()) {
    if (dateKey >= startKey && dateKey <= endKey) {
      weekTotal += capDailyMinutes(rawMinutes);
    }
  }
  return weekTotal;
}

export function calculateSubjectGoalProgressList(params: {
  subjects: ReadonlyArray<Subject>;
  logs: ReadonlyArray<StudyLogEntry>;
  goals: ReadonlyArray<SubjectStudyGoal>;
  period: GoalPeriod;
  referenceDateKey?: string;
}): SubjectGoalProgress[] {
  const referenceDateKey = params.referenceDateKey ?? getLocalDateKey();
  const goalMap = new Map<string, SubjectStudyGoal>();
  for (const goal of params.goals) {
    goalMap.set(goal.subjectId, goal);
  }

  return params.subjects.map((subject) => {
    const goal = goalMap.get(subject.id);
    const targetMinutes =
      params.period === 'daily'
        ? Math.max(0, Math.min(MAX_DAILY_GOAL_MINUTES, Math.round(goal?.dailyMinutes ?? 0)))
        : Math.max(0, Math.min(MAX_WEEKLY_GOAL_MINUTES, Math.round(goal?.weeklyMinutes ?? 0)));

    const loggedMinutes = calculateSubjectLoggedMinutes(
      params.logs,
      subject.id,
      params.period,
      referenceDateKey,
    );

    const hasGoal = targetMinutes > 0;
    const rawPercent = hasGoal ? Math.round((loggedMinutes / targetMinutes) * 100) : 0;
    const ringPercent = hasGoal ? Math.max(0, Math.min(100, rawPercent)) : 0;
    const remainingMinutes = hasGoal ? Math.max(0, targetMinutes - loggedMinutes) : 0;
    const isGoalMet = hasGoal && loggedMinutes >= targetMinutes;

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      accent: subject.accent,
      period: params.period,
      loggedMinutes,
      targetMinutes,
      remainingMinutes,
      rawPercent,
      ringPercent,
      hasGoal,
      isGoalMet,
    };
  });
}

export function calculateOverallGoalsSummary(
  items: ReadonlyArray<SubjectGoalProgress>,
): OverallGoalsSummary {
  let totalLoggedMinutes = 0;
  let totalTargetMinutes = 0;
  let goalsMetCount = 0;
  let activeGoalsCount = 0;

  for (const item of items) {
    if (!item.hasGoal) {
      continue;
    }
    activeGoalsCount += 1;
    totalTargetMinutes += item.targetMinutes;
    totalLoggedMinutes += item.loggedMinutes;
    if (item.isGoalMet) {
      goalsMetCount += 1;
    }
  }

  const overallPercent =
    totalTargetMinutes > 0
      ? Math.min(100, Math.round((totalLoggedMinutes / totalTargetMinutes) * 100))
      : 0;

  return {
    totalLoggedMinutes,
    totalTargetMinutes,
    goalsMetCount,
    activeGoalsCount,
    overallPercent,
  };
}

export function splitMinutesToHoursAndMinutes(totalMinutes: number): {
  hours: number;
  minutes: number;
} {
  const safe = Math.max(0, Math.round(totalMinutes));
  return {
    hours: Math.floor(safe / 60),
    minutes: safe % 60,
  };
}

export function validateSubjectGoalInput(params: {
  dailyHours: string;
  dailyMinutes: string;
  weeklyHours: string;
  weeklyMinutes: string;
}):
  | { valid: true; dailyTotalMinutes: number; weeklyTotalMinutes: number }
  | { valid: false; error: string } {
  const dH = params.dailyHours.trim() === '' ? 0 : Number(params.dailyHours);
  const dM = params.dailyMinutes.trim() === '' ? 0 : Number(params.dailyMinutes);
  const wH = params.weeklyHours.trim() === '' ? 0 : Number(params.weeklyHours);
  const wM = params.weeklyMinutes.trim() === '' ? 0 : Number(params.weeklyMinutes);

  if (
    !Number.isInteger(dH) ||
    !Number.isInteger(dM) ||
    dH < 0 ||
    dH > 24 ||
    dM < 0 ||
    dM > 59
  ) {
    return {
      valid: false,
      error: 'Daily goal must use valid hours (0–24) and minutes (0–59).',
    };
  }

  const dailyTotalMinutes = dH * 60 + dM;
  if (dailyTotalMinutes > MAX_DAILY_GOAL_MINUTES) {
    return {
      valid: false,
      error: 'Daily goal cannot exceed 24 hours per day.',
    };
  }

  if (
    !Number.isInteger(wH) ||
    !Number.isInteger(wM) ||
    wH < 0 ||
    wH > 168 ||
    wM < 0 ||
    wM > 59
  ) {
    return {
      valid: false,
      error: 'Weekly goal must use valid hours (0–168) and minutes (0–59).',
    };
  }

  const weeklyTotalMinutes = wH * 60 + wM;
  if (weeklyTotalMinutes > MAX_WEEKLY_GOAL_MINUTES) {
    return {
      valid: false,
      error: 'Weekly goal cannot exceed 168 hours per week.',
    };
  }

  return {
    valid: true,
    dailyTotalMinutes,
    weeklyTotalMinutes,
  };
}
