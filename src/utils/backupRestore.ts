import { INITIAL_SYLLABUS } from '../data/syllabusData';
import type { AppBackupData, AppBackupPayload, BackupParseResult } from '../types/backup';
import type { DailyHabit, DailyHabitsState } from '../types/dailyHabit';
import type { DailyTodoItem, DailyTodosState } from '../types/dailyTodo';
import type { BoardExamSettings } from '../types/examCountdown';
import type { SubjectStudyGoal } from '../types/studyGoal';
import type { StudyLogChapterItem, StudyLogEntry } from '../types/studyLog';
import type { Chapter, MilestoneKey, Subject } from '../types/syllabus';
import type { BadgeId } from './badgesMath';
import {
  createDefaultDailyHabitsState,
  reconcileDailyHabitsForDate,
} from './dailyHabitsMath';
import {
  createDefaultDailyTodosState,
  reconcileDailyTodosForDate,
} from './dailyTodoMath';
import {
  createDefaultBoardExamSettings,
  validateExamDateKey,
} from './examCountdownMath';
import { sanitizeHeeCoinState } from './heeCoinStorage';
import { sanitizeQuotes } from './quoteMath';
import type { ScreenTimeByDate } from './screenTimeStorage';
import {
  createDefaultSubjectGoals,
  MAX_DAILY_GOAL_MINUTES,
  MAX_WEEKLY_GOAL_MINUTES,
} from './studyGoalMath';
import { getLocalDateKey } from './studyLogMath';

export const BACKUP_APP_ID = 'syllabus-tracker-class10';
export const BACKUP_VERSION = 1;

const VALID_MILESTONES: ReadonlyArray<MilestoneKey> = [
  'lecture',
  'notes',
  'practice',
  'extra',
];

const VALID_BADGE_IDS: ReadonlyArray<BadgeId> = [
  'early-bird',
  'night-owl',
  'chapter-crusher',
  'on-fire',
  'deep-focus',
];

export interface CreateBackupInput extends AppBackupData {
  streakCount: number;
  exportedAt?: string;
}

export function createBackupPayload(input: CreateBackupInput): AppBackupPayload {
  return {
    appId: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    streakCount: Math.max(0, Math.floor(input.streakCount)),
    data: {
      subjects: input.subjects,
      studyLogs: input.studyLogs,
      subjectGoals: input.subjectGoals,
      savedBadgesMap: input.savedBadgesMap,
      screenTimeMap: input.screenTimeMap,
      dailyHabits: input.dailyHabits,
      dailyTodosState: input.dailyTodosState,
      examSettings: input.examSettings,
      heeCoinState: input.heeCoinState,
      ...(input.quotes !== undefined ? { quotes: input.quotes } : {}),
      isDark: input.isDark,
    },
  };
}

export function serializeBackupPayload(payload: AppBackupPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function getBackupFilename(dateKey: string = getLocalDateKey()): string {
  return `syllabus-tracker-backup-${dateKey}.json`;
}

export function triggerBackupDownload(jsonText: string, filename: string): void {
  const blob = new Blob([jsonText], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeSubjects(rawSubjects: unknown): Subject[] | null {
  if (!Array.isArray(rawSubjects)) return null;

  const chapterMap = new Map<string, Record<string, unknown>>();
  for (const subj of rawSubjects) {
    if (!isPlainObject(subj) || !Array.isArray(subj.subSubjects)) {
      return null;
    }
    for (const sub of subj.subSubjects) {
      if (!isPlainObject(sub) || !Array.isArray(sub.chapters)) {
        return null;
      }
      for (const ch of sub.chapters) {
        if (isPlainObject(ch) && typeof ch.id === 'string') {
          chapterMap.set(ch.id, ch);
        }
      }
    }
  }

  return INITIAL_SYLLABUS.map((baseSubj) => ({
    ...baseSubj,
    subSubjects: baseSubj.subSubjects.map((baseSub) => ({
      ...baseSub,
      chapters: baseSub.chapters.map((baseCh): Chapter => {
        const importedCh = chapterMap.get(baseCh.id);
        const rawMilestones =
          importedCh && isPlainObject(importedCh.milestones)
            ? importedCh.milestones
            : {};
        const rawTimestamps =
          importedCh && isPlainObject(importedCh.milestoneTimestamps)
            ? importedCh.milestoneTimestamps
            : {};

        const milestoneTimestamps: Partial<Record<MilestoneKey, number>> = {};
        for (const key of VALID_MILESTONES) {
          const ts = rawTimestamps[key];
          if (typeof ts === 'number' && Number.isFinite(ts) && ts > 0) {
            milestoneTimestamps[key] = ts;
          }
        }

        return {
          ...baseCh,
          milestones: {
            lecture: Boolean(rawMilestones.lecture),
            notes: Boolean(rawMilestones.notes),
            practice: Boolean(rawMilestones.practice),
            extra: Boolean(rawMilestones.extra),
          },
          milestoneTimestamps,
        };
      }),
    })),
  }));
}

function sanitizeStudyLogItem(raw: unknown): StudyLogChapterItem | null {
  if (!isPlainObject(raw)) return null;
  if (
    typeof raw.subSubjectId !== 'string' ||
    typeof raw.subSubjectName !== 'string' ||
    typeof raw.chapterId !== 'string' ||
    typeof raw.chapterName !== 'string'
  ) {
    return null;
  }
  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks.filter(
        (t): t is MilestoneKey =>
          typeof t === 'string' && (VALID_MILESTONES as ReadonlyArray<string>).includes(t),
      )
    : [];

  return {
    subSubjectId: raw.subSubjectId,
    subSubjectName: raw.subSubjectName,
    chapterId: raw.chapterId,
    chapterName: raw.chapterName,
    tasks,
  };
}

function sanitizeStudyLogs(rawLogs: unknown): StudyLogEntry[] | null {
  if (!Array.isArray(rawLogs)) return null;

  const validLogs: StudyLogEntry[] = [];
  for (const item of rawLogs) {
    if (!isPlainObject(item)) continue;
    if (
      typeof item.id !== 'string' ||
      typeof item.subjectId !== 'string' ||
      typeof item.subjectName !== 'string' ||
      typeof item.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
      typeof item.durationMinutes !== 'number' ||
      !Number.isFinite(item.durationMinutes) ||
      item.durationMinutes < 0 ||
      typeof item.createdAt !== 'number' ||
      !Number.isFinite(item.createdAt)
    ) {
      continue;
    }

    const sanitizedItems = Array.isArray(item.items)
      ? item.items
          .map(sanitizeStudyLogItem)
          .filter((entry): entry is StudyLogChapterItem => entry !== null)
      : undefined;

    validLogs.push({
      id: item.id,
      subjectId: item.subjectId,
      subjectName: item.subjectName,
      date: item.date,
      durationMinutes: Math.round(item.durationMinutes),
      createdAt: item.createdAt,
      ...(sanitizedItems ? { items: sanitizedItems } : {}),
    });
  }
  return validLogs;
}

function sanitizeSubjectGoals(
  rawGoals: unknown,
  subjects: ReadonlyArray<Subject>,
): SubjectStudyGoal[] {
  const defaults = createDefaultSubjectGoals(subjects);
  if (!Array.isArray(rawGoals)) return defaults;

  const map = new Map<string, SubjectStudyGoal>();
  for (const item of rawGoals) {
    if (
      isPlainObject(item) &&
      typeof item.subjectId === 'string' &&
      typeof item.dailyMinutes === 'number' &&
      Number.isFinite(item.dailyMinutes) &&
      typeof item.weeklyMinutes === 'number' &&
      Number.isFinite(item.weeklyMinutes)
    ) {
      map.set(item.subjectId, {
        subjectId: item.subjectId,
        dailyMinutes: Math.max(0, Math.min(MAX_DAILY_GOAL_MINUTES, Math.round(item.dailyMinutes))),
        weeklyMinutes: Math.max(0, Math.min(MAX_WEEKLY_GOAL_MINUTES, Math.round(item.weeklyMinutes))),
      });
    }
  }
  return defaults.map((def) => map.get(def.subjectId) ?? def);
}

function sanitizeBadgesMap(rawBadges: unknown): Partial<Record<BadgeId, number>> {
  if (!isPlainObject(rawBadges)) return {};
  const result: Partial<Record<BadgeId, number>> = {};
  for (const id of VALID_BADGE_IDS) {
    const val = rawBadges[id];
    if (typeof val === 'number' && Number.isFinite(val)) {
      result[id] = val;
    }
  }
  return result;
}

function sanitizeScreenTimeMap(rawMap: unknown): ScreenTimeByDate {
  if (!isPlainObject(rawMap)) return {};
  const result: ScreenTimeByDate = {};
  for (const [dateKey, mins] of Object.entries(rawMap)) {
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(dateKey) &&
      typeof mins === 'number' &&
      Number.isFinite(mins) &&
      mins >= 0
    ) {
      result[dateKey] = Math.min(24 * 60, Math.round(mins));
    }
  }
  return result;
}

function sanitizeDailyHabits(rawHabits: unknown, todayKey: string): DailyHabitsState {
  const fallback = createDefaultDailyHabitsState(todayKey);
  if (!isPlainObject(rawHabits)) return fallback;

  const dateKey =
    typeof rawHabits.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawHabits.dateKey)
      ? rawHabits.dateKey
      : todayKey;

  const habits: DailyHabit[] = Array.isArray(rawHabits.habits)
    ? rawHabits.habits
        .filter((h): h is DailyHabit => {
          return (
            isPlainObject(h) &&
            typeof h.id === 'string' &&
            h.id.length > 0 &&
            typeof h.title === 'string' &&
            h.title.trim().length > 0 &&
            typeof h.emoji === 'string'
          );
        })
        .map((h) => ({
          id: h.id,
          title: h.title.trim(),
          emoji: h.emoji,
          isDefault: Boolean(h.isDefault),
        }))
    : fallback.habits;

  const completedIds = Array.isArray(rawHabits.completedIds)
    ? rawHabits.completedIds.filter((id): id is string => typeof id === 'string')
    : [];

  return reconcileDailyHabitsForDate(
    {
      dateKey,
      habits: habits.length > 0 ? habits : fallback.habits,
      completedIds,
    },
    todayKey,
  );
}

function sanitizeDailyTodos(rawTodos: unknown, todayKey: string): DailyTodosState {
  if (Array.isArray(rawTodos)) {
    const items = rawTodos.filter(
      (item): item is DailyTodoItem =>
        isPlainObject(item) &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.completed === 'boolean' &&
        typeof item.createdAt === 'number' &&
        Number.isFinite(item.createdAt),
    );
    return { dateKey: todayKey, items };
  }

  if (isPlainObject(rawTodos) && Array.isArray(rawTodos.items)) {
    const dateKey =
      typeof rawTodos.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawTodos.dateKey)
        ? rawTodos.dateKey
        : todayKey;
    const items = rawTodos.items.filter(
      (item): item is DailyTodoItem =>
        isPlainObject(item) &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.completed === 'boolean' &&
        typeof item.createdAt === 'number' &&
        Number.isFinite(item.createdAt),
    );
    return reconcileDailyTodosForDate({ dateKey, items }, todayKey);
  }

  return createDefaultDailyTodosState(todayKey);
}

function sanitizeExamSettings(rawExam: unknown, todayKey: string): BoardExamSettings {
  if (!isPlainObject(rawExam) || typeof rawExam.examDateKey !== 'string') {
    return createDefaultBoardExamSettings(todayKey);
  }
  const validated = validateExamDateKey(rawExam.examDateKey);
  if (!validated.valid) {
    return createDefaultBoardExamSettings(todayKey);
  }
  return {
    examDateKey: validated.dateKey,
    isCustom: Boolean(rawExam.isCustom),
  };
}

export function parseAndValidateBackupJson(
  rawText: string,
  todayKey: string = getLocalDateKey(),
): BackupParseResult {
  if (!rawText || rawText.trim().length === 0) {
    return { valid: false, error: 'Selected backup file is empty.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      valid: false,
      error: 'Invalid JSON file. Please select a valid Syllabus Tracker backup file.',
    };
  }

  if (!isPlainObject(parsed)) {
    return {
      valid: false,
      error: 'Invalid backup format. Expected a JSON backup object.',
    };
  }

  if (parsed.appId !== undefined && parsed.appId !== BACKUP_APP_ID) {
    return {
      valid: false,
      error: 'This JSON file belongs to a different app and cannot be restored here.',
    };
  }

  const rawData = isPlainObject(parsed.data) ? parsed.data : parsed;
  const subjects = sanitizeSubjects(rawData.subjects);
  const studyLogs = sanitizeStudyLogs(rawData.studyLogs);

  if (!subjects || !studyLogs) {
    return {
      valid: false,
      error: 'Backup file is missing valid syllabus or study log data.',
    };
  }

  const subjectGoals = sanitizeSubjectGoals(rawData.subjectGoals, subjects);
  const savedBadgesMap = sanitizeBadgesMap(rawData.savedBadgesMap);
  const screenTimeMap = sanitizeScreenTimeMap(rawData.screenTimeMap);
  const dailyHabits = sanitizeDailyHabits(rawData.dailyHabits, todayKey);
  const dailyTodosState = sanitizeDailyTodos(rawData.dailyTodosState, todayKey);
  const examSettings = sanitizeExamSettings(rawData.examSettings, todayKey);
  const heeCoinState = sanitizeHeeCoinState(rawData.heeCoinState);
  const quotes =
    rawData.quotes !== undefined ? sanitizeQuotes(rawData.quotes) : undefined;
  const isDark = typeof rawData.isDark === 'boolean' ? rawData.isDark : undefined;

  const streakCount =
    typeof parsed.streakCount === 'number' && Number.isFinite(parsed.streakCount)
      ? Math.max(0, Math.floor(parsed.streakCount))
      : 0;

  return {
    valid: true,
    payload: {
      appId: BACKUP_APP_ID,
      version: BACKUP_VERSION,
      exportedAt:
        typeof parsed.exportedAt === 'string'
          ? parsed.exportedAt
          : new Date().toISOString(),
      streakCount,
      data: {
        subjects,
        studyLogs,
        subjectGoals,
        savedBadgesMap,
        screenTimeMap,
        dailyHabits,
        dailyTodosState,
        examSettings,
        heeCoinState,
        ...(quotes !== undefined ? { quotes } : {}),
        ...(isDark !== undefined ? { isDark } : {}),
      },
    },
  };
}
