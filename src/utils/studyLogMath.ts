import type { StudyLogChapterItem, StudyLogEntry, StudyTimeStats } from '../types/studyLog';
import type { MilestoneKey } from '../types/syllabus';

export const MAX_DAILY_STUDY_MINUTES = 24 * 60; // 1440 minutes (24h cap)

const MONTH_SHORT_NAMES = [
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

const MILESTONE_LABELS: Record<MilestoneKey, string> = {
  lecture: 'Lecture',
  notes: 'Notes',
  practice: 'Practice',
  extra: 'Extra',
};

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(dateKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

export function shiftLocalDateKey(baseDateKey: string, deltaDays: number): string {
  const parsed = parseLocalDateKey(baseDateKey);
  if (!parsed) {
    return baseDateKey;
  }
  parsed.setDate(parsed.getDate() + deltaDays);
  return getLocalDateKey(parsed);
}

export function formatDuration(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

export function formatStatDuration(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  if (safeMinutes === 0) {
    return '0h 0m';
  }
  return formatDuration(safeMinutes);
}

export function formatStudyLogDate(dateKey: string): string {
  const parsed = parseLocalDateKey(dateKey);
  if (!parsed) {
    return dateKey;
  }
  const day = parsed.getDate();
  const month = MONTH_SHORT_NAMES[parsed.getMonth()];
  return `${day} ${month}`;
}

export function getWeekBounds(referenceDateKey: string): { startKey: string; endKey: string } {
  const ref = parseLocalDateKey(referenceDateKey) ?? new Date();
  // Monday-based week (0 = Mon ... 6 = Sun)
  const dayIndex = (ref.getDay() + 6) % 7;
  const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - dayIndex);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return {
    startKey: getLocalDateKey(start),
    endKey: getLocalDateKey(end),
  };
}

export function capDailyMinutes(totalMinutes: number): number {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return 0;
  }
  return Math.min(MAX_DAILY_STUDY_MINUTES, Math.round(totalMinutes));
}

export function aggregateMinutesByDate(
  logs: ReadonlyArray<StudyLogEntry>,
): Map<string, number> {
  const rawByDate = new Map<string, number>();
  for (const log of logs) {
    if (!Number.isFinite(log.durationMinutes) || log.durationMinutes <= 0) {
      continue;
    }
    rawByDate.set(log.date, (rawByDate.get(log.date) ?? 0) + log.durationMinutes);
  }

  const cappedByDate = new Map<string, number>();
  for (const [dateKey, total] of rawByDate.entries()) {
    cappedByDate.set(dateKey, capDailyMinutes(total));
  }
  return cappedByDate;
}

export function calculateStudyStats(
  logs: ReadonlyArray<StudyLogEntry>,
  referenceDateKey: string = getLocalDateKey(),
): StudyTimeStats {
  const { startKey: weekStart, endKey: weekEnd } = getWeekBounds(referenceDateKey);
  const monthPrefix = referenceDateKey.slice(0, 7); // YYYY-MM
  const cappedByDate = aggregateMinutesByDate(logs);

  const todayMinutes = cappedByDate.get(referenceDateKey) ?? 0;
  let weekMinutes = 0;
  let monthMinutes = 0;

  for (const [dateKey, mins] of cappedByDate.entries()) {
    if (dateKey >= weekStart && dateKey <= weekEnd) {
      weekMinutes += mins;
    }
    if (dateKey.startsWith(monthPrefix)) {
      monthMinutes += mins;
    }
  }

  return {
    todayMinutes,
    weekMinutes,
    monthMinutes,
  };
}

export function sortStudyLogsNewestFirst(
  logs: ReadonlyArray<StudyLogEntry>,
): StudyLogEntry[] {
  return [...logs].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.createdAt - a.createdAt;
  });
}

export function formatStudyTaskList(tasks: ReadonlyArray<MilestoneKey>): string {
  return tasks.map((t) => MILESTONE_LABELS[t]).join(', ');
}

export function formatShortChapterLabel(chapterName: string): string {
  const colonIdx = chapterName.indexOf(':');
  if (colonIdx > 0) {
    return chapterName.slice(0, colonIdx).trim();
  }
  return chapterName;
}

export function formatStudyLogSummary(log: StudyLogEntry): string {
  if (!log.items || log.items.length === 0) {
    return log.subjectName;
  }
  if (log.items.length === 1) {
    const item = log.items[0];
    return `${log.subjectName} > ${item.chapterName} (${formatStudyTaskList(item.tasks)})`;
  }
  const parts = log.items.map(
    (item) => `${formatShortChapterLabel(item.chapterName)} ${formatStudyTaskList(item.tasks)}`,
  );
  return `${log.subjectName}: ${parts.join(' + ')}`;
}

export function splitDurationEqually(
  totalMinutes: number,
  itemCount: number,
): number[] {
  if (itemCount <= 0) {
    return [];
  }
  const safeTotal = Math.max(0, Math.round(totalMinutes));
  const base = Math.floor(safeTotal / itemCount);
  const remainder = safeTotal % itemCount;
  return Array.from({ length: itemCount }, (_, idx) =>
    idx < remainder ? base + 1 : base,
  );
}

export function validateStudyEntryInput(params: {
  subjectId: string;
  hours: string;
  minutes: string;
  date: string;
  maxDate?: string;
  selectedChapters?: ReadonlyArray<{ chapterId: string; tasks: ReadonlyArray<MilestoneKey> }>;
  requireChapters?: boolean;
}): { valid: true; totalMinutes: number } | { valid: false; error: string } {
  if (!params.subjectId.trim()) {
    return { valid: false, error: 'Please select a subject.' };
  }

  if (params.requireChapters) {
    const selected = params.selectedChapters ?? [];
    if (selected.length === 0) {
      return { valid: false, error: 'Please select at least one chapter.' };
    }
    const missingTasks = selected.some((ch) => ch.tasks.length === 0);
    if (missingTasks) {
      return {
        valid: false,
        error: 'Select at least one task (Lecture, Notes, Practice, or Extra) for each checked chapter.',
      };
    }
  }

  const parsedHours = params.hours.trim() === '' ? 0 : Number(params.hours);
  const parsedMinutes = params.minutes.trim() === '' ? 0 : Number(params.minutes);

  if (
    !Number.isInteger(parsedHours) ||
    !Number.isInteger(parsedMinutes) ||
    parsedHours < 0 ||
    parsedHours > 24 ||
    parsedMinutes < 0 ||
    parsedMinutes > 59
  ) {
    return { valid: false, error: 'Enter valid hours (0–24) and minutes (0–59).' };
  }

  const totalMinutes = parsedHours * 60 + parsedMinutes;
  if (totalMinutes <= 0) {
    return { valid: false, error: 'Please enter at least 1 minute of study time.' };
  }
  if (totalMinutes > MAX_DAILY_STUDY_MINUTES) {
    return { valid: false, error: 'Total study time for one entry cannot exceed 24 hours.' };
  }

  if (!parseLocalDateKey(params.date)) {
    return { valid: false, error: 'Please select a valid date.' };
  }
  if (params.maxDate && params.date > params.maxDate) {
    return { valid: false, error: 'Future dates cannot be logged.' };
  }

  return { valid: true, totalMinutes };
}

export type { StudyLogChapterItem };
