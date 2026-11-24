import type { StudyLogEntry } from '../types/studyLog';
import type { Chapter, MilestoneKey, Subject, SubjectAccent } from '../types/syllabus';
import {
  aggregateMinutesByDate,
  getLocalDateKey,
  parseLocalDateKey,
  shiftLocalDateKey,
} from './studyLogMath';
import { isChapterComplete, MILESTONE_ITEMS } from './syllabusMath';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
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

export interface DailyBarPoint {
  dateKey: string;
  dayLabel: string;
  shortDate: string;
  totalMinutes: number;
  isToday: boolean;
}

export interface TodayChapterActivityItem {
  subjectId: string;
  subjectName: string;
  subjectAccent: SubjectAccent;
  subSubjectId: string;
  subSubjectName: string;
  chapter: Chapter;
  checkedToday: Array<{ key: MilestoneKey; label: string; timestamp: number }>;
  isFullyComplete: boolean;
  latestTimestamp: number;
}

export function formatLongDateHeading(dateKey: string = getLocalDateKey()): string {
  const parsed = parseLocalDateKey(dateKey);
  if (!parsed) {
    return dateKey;
  }
  const weekday = WEEKDAY_LONG[parsed.getDay()];
  const day = parsed.getDate();
  const month = MONTH_SHORT[parsed.getMonth()];
  const year = parsed.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

export function getLast7DaysStudySeries(
  logs: ReadonlyArray<StudyLogEntry>,
  referenceDateKey: string = getLocalDateKey(),
  todayKey: string = getLocalDateKey(),
): DailyBarPoint[] {
  const minutesByDate = aggregateMinutesByDate(logs);

  const series: DailyBarPoint[] = [];
  for (let offset = -6; offset <= 0; offset += 1) {
    const dateKey = shiftLocalDateKey(referenceDateKey, offset);
    const parsed = parseLocalDateKey(dateKey);
    const dayLabel = parsed ? WEEKDAY_SHORT[parsed.getDay()] : dateKey;
    const shortDate = parsed ? `${parsed.getDate()} ${MONTH_SHORT[parsed.getMonth()]}` : dateKey;

    series.push({
      dateKey,
      dayLabel,
      shortDate,
      totalMinutes: minutesByDate.get(dateKey) ?? 0,
      isToday: dateKey === todayKey,
    });
  }
  return series;
}

export function getTodayStudyLogs(
  logs: ReadonlyArray<StudyLogEntry>,
  todayKey: string = getLocalDateKey(),
): StudyLogEntry[] {
  return logs
    .filter((log) => log.date === todayKey && log.durationMinutes > 0)
    .sort((a, b) => b.createdAt - a.createdAt);
}

const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export interface MonthlyDayCell {
  dateKey: string;
  dayNumber: number;
  totalMinutes: number;
  sessionCount: number;
  chapterUpdatesCount: number;
  hasActivity: boolean;
  intensity: 0 | 1 | 2 | 3;
  isToday: boolean;
  isFuture: boolean;
}

export interface MonthlyCalendarData {
  year: number;
  monthIndex: number; // 0-11
  monthLabel: string;
  leadingEmptySlots: number; // Monday-first (0 = Mon ... 6 = Sun)
  days: MonthlyDayCell[];
  totalMinutes: number;
  activeDays: number;
  totalSessions: number;
}

export function formatMonthYearHeading(year: number, monthIndex: number): string {
  const monthName = MONTH_LONG[monthIndex] ?? '';
  return `${monthName} ${year}`;
}

export function shiftMonth(
  year: number,
  monthIndex: number,
  deltaMonths: number,
): { year: number; monthIndex: number } {
  const shifted = new Date(year, monthIndex + deltaMonths, 1);
  return {
    year: shifted.getFullYear(),
    monthIndex: shifted.getMonth(),
  };
}

export function getMonthlyCalendarData(
  year: number,
  monthIndex: number,
  logs: ReadonlyArray<StudyLogEntry>,
  subjects: ReadonlyArray<Subject>,
  todayKey: string = getLocalDateKey(),
): MonthlyCalendarData {
  const cappedMinutesByDate = aggregateMinutesByDate(logs);
  const sessionsByDate = new Map<string, number>();
  for (const log of logs) {
    if (log.durationMinutes > 0) {
      sessionsByDate.set(log.date, (sessionsByDate.get(log.date) ?? 0) + 1);
    }
  }

  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`;
  const chapterIdsByDate = new Map<string, Set<string>>();
  for (const subject of subjects) {
    for (const sub of subject.subSubjects) {
      for (const chapter of sub.chapters) {
        const timestamps = chapter.milestoneTimestamps;
        if (!timestamps) continue;
        for (const { key } of MILESTONE_ITEMS) {
          const ts = timestamps[key];
          if (chapter.milestones[key] && typeof ts === 'number') {
            const dateKey = getLocalDateKey(new Date(ts));
            if (dateKey.startsWith(monthPrefix)) {
              let set = chapterIdsByDate.get(dateKey);
              if (!set) {
                set = new Set<string>();
                chapterIdsByDate.set(dateKey, set);
              }
              set.add(chapter.id);
            }
          }
        }
      }
    }
  }

  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingEmptySlots = (firstDay.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6

  const days: MonthlyDayCell[] = [];
  let totalMinutes = 0;
  let activeDays = 0;
  let totalSessions = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const mins = cappedMinutesByDate.get(dateKey) ?? 0;
    const sessionCount = sessionsByDate.get(dateKey) ?? 0;
    const chapterUpdatesCount = chapterIdsByDate.get(dateKey)?.size ?? 0;
    const hasActivity = mins > 0 || chapterUpdatesCount > 0;

    let intensity: 0 | 1 | 2 | 3 = 0;
    if (mins >= 150) {
      intensity = 3;
    } else if (mins >= 60) {
      intensity = 2;
    } else if (mins > 0) {
      intensity = 1;
    }

    if (mins > 0) {
      totalMinutes += mins;
      activeDays += 1;
    }
    totalSessions += sessionCount;

    days.push({
      dateKey,
      dayNumber: day,
      totalMinutes: mins,
      sessionCount,
      chapterUpdatesCount,
      hasActivity,
      intensity,
      isToday: dateKey === todayKey,
      isFuture: dateKey > todayKey,
    });
  }

  return {
    year,
    monthIndex,
    monthLabel: formatMonthYearHeading(year, monthIndex),
    leadingEmptySlots,
    days,
    totalMinutes,
    activeDays,
    totalSessions,
  };
}

export function getTodayChapterActivity(
  subjects: ReadonlyArray<Subject>,
  todayKey: string = getLocalDateKey(),
): TodayChapterActivityItem[] {
  const items: TodayChapterActivityItem[] = [];

  for (const subject of subjects) {
    for (const subSubject of subject.subSubjects) {
      for (const chapter of subSubject.chapters) {
        const timestamps = chapter.milestoneTimestamps;
        if (!timestamps) {
          continue;
        }

        const checkedToday: Array<{ key: MilestoneKey; label: string; timestamp: number }> = [];
        let latestTimestamp = 0;

        for (const { key, label } of MILESTONE_ITEMS) {
          const ts = timestamps[key];
          if (chapter.milestones[key] && typeof ts === 'number') {
            const tsDateKey = getLocalDateKey(new Date(ts));
            if (tsDateKey === todayKey) {
              checkedToday.push({ key, label, timestamp: ts });
              if (ts > latestTimestamp) {
                latestTimestamp = ts;
              }
            }
          }
        }

        if (checkedToday.length > 0) {
          items.push({
            subjectId: subject.id,
            subjectName: subject.name,
            subjectAccent: subject.accent,
            subSubjectId: subSubject.id,
            subSubjectName: subSubject.name,
            chapter,
            checkedToday,
            isFullyComplete: isChapterComplete(chapter),
            latestTimestamp,
          });
        }
      }
    }
  }

  return items.sort((a, b) => b.latestTimestamp - a.latestTimestamp);
}
