import type { BoardExamSettings, ExamCountdownSummary } from '../types/examCountdown';
import { getLocalDateKey, parseLocalDateKey } from './studyLogMath';

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

const MS_PER_DAY = 86_400_000;

/**
 * Returns the upcoming CBSE Class 10th board exam start estimate (15 Feb of the
 * upcoming board cycle) relative to todayKey.
 */
export function getDefaultBoardExamDateKey(
  todayKey: string = getLocalDateKey(),
): string {
  const today = parseLocalDateKey(todayKey) ?? new Date();
  const year = today.getFullYear();
  const currentCycleKey = `${year}-02-15`;
  return todayKey <= currentCycleKey ? currentCycleKey : `${year + 1}-02-15`;
}

export function createDefaultBoardExamSettings(
  todayKey: string = getLocalDateKey(),
): BoardExamSettings {
  return {
    examDateKey: getDefaultBoardExamDateKey(todayKey),
    isCustom: false,
  };
}

export function validateExamDateKey(
  rawDateKey: string,
): { valid: true; dateKey: string } | { valid: false; error: string } {
  const trimmed = rawDateKey.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please select or enter an exam date.' };
  }
  const parsed = parseLocalDateKey(trimmed);
  if (!parsed) {
    return { valid: false, error: 'Enter a valid calendar date (YYYY-MM-DD).' };
  }
  const year = parsed.getFullYear();
  if (year < 2020 || year > 2040) {
    return {
      valid: false,
      error: 'Exam year must be between 2020 and 2040.',
    };
  }
  return { valid: true, dateKey: trimmed };
}

export function formatExamDisplayDate(dateKey: string): string {
  const parsed = parseLocalDateKey(dateKey);
  if (!parsed) {
    return dateKey;
  }
  const day = parsed.getDate();
  const month = MONTH_SHORT_NAMES[parsed.getMonth()];
  const year = parsed.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Computes exact whole calendar days between todayKey and examDateKey using UTC
 * midnight timestamps so Daylight Saving Time transitions never skew the count.
 */
export function calculateCalendarDaysBetween(
  fromDateKey: string,
  toDateKey: string,
): number {
  const fromDate = parseLocalDateKey(fromDateKey);
  const toDate = parseLocalDateKey(toDateKey);
  if (!fromDate || !toDate) {
    return 0;
  }
  const fromUtc = Date.UTC(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate(),
  );
  const toUtc = Date.UTC(
    toDate.getFullYear(),
    toDate.getMonth(),
    toDate.getDate(),
  );
  return Math.round((toUtc - fromUtc) / MS_PER_DAY);
}

export function evaluateExamCountdown(
  settings: BoardExamSettings,
  todayKey: string = getLocalDateKey(),
): ExamCountdownSummary {
  const validated = validateExamDateKey(settings.examDateKey);
  const effectiveDateKey = validated.valid
    ? validated.dateKey
    : getDefaultBoardExamDateKey(todayKey);

  const daysRemaining = calculateCalendarDaysBetween(todayKey, effectiveDateKey);
  const formattedExamDate = formatExamDisplayDate(effectiveDateKey);

  if (daysRemaining > 0) {
    return {
      examDateKey: effectiveDateKey,
      formattedExamDate,
      daysRemaining,
      headlineValue: String(daysRemaining),
      headlineUnit: daysRemaining === 1 ? 'day left' : 'days left',
      phase: 'upcoming',
      isCustom: settings.isCustom,
    };
  }

  if (daysRemaining === 0) {
    return {
      examDateKey: effectiveDateKey,
      formattedExamDate,
      daysRemaining: 0,
      headlineValue: '0',
      headlineUnit: 'Exam day today',
      phase: 'today',
      isCustom: settings.isCustom,
    };
  }

  const daysAgo = Math.abs(daysRemaining);
  return {
    examDateKey: effectiveDateKey,
    formattedExamDate,
    daysRemaining,
    headlineValue: '0',
    headlineUnit: daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`,
    phase: 'passed',
    isCustom: settings.isCustom,
  };
}
