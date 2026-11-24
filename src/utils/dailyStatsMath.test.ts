import test from 'node:test';
import assert from 'node:assert/strict';
import type { StudyLogEntry } from '../types/studyLog';
import type { Subject } from '../types/syllabus';
import {
  formatLongDateHeading,
  formatMonthYearHeading,
  getLast7DaysStudySeries,
  getMonthlyCalendarData,
  getTodayChapterActivity,
  getTodayStudyLogs,
  shiftMonth,
} from './dailyStatsMath';
import { toggleChapterMilestone } from './syllabusMath';

test('formatLongDateHeading formats local YYYY-MM-DD cleanly', () => {
  assert.equal(formatLongDateHeading('2026-11-19'), 'Thursday, 19 Nov 2026');
});

test('getLast7DaysStudySeries returns 7 consecutive days ending on reference date', () => {
  const logs: StudyLogEntry[] = [
    { id: '1', subjectId: 'science', subjectName: 'Science', date: '2026-11-19', durationMinutes: 90, createdAt: 10 },
    { id: '2', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-19', durationMinutes: 30, createdAt: 20 },
    { id: '3', subjectId: 'sst', subjectName: 'Social Science', date: '2026-11-15', durationMinutes: 60, createdAt: 30 },
    { id: '4', subjectId: 'hindi', subjectName: 'Hindi', date: '2026-11-10', durationMinutes: 120, createdAt: 40 }, // Outside 7 days
  ];

  const series = getLast7DaysStudySeries(logs, '2026-11-19', '2026-11-19');
  assert.equal(series.length, 7);
  assert.equal(series[0].dateKey, '2026-11-13');
  assert.equal(series[6].dateKey, '2026-11-19');
  assert.equal(series[6].isToday, true);
  assert.equal(series[6].totalMinutes, 120);
  assert.equal(series[2].dateKey, '2026-11-15');
  assert.equal(series[2].totalMinutes, 60);

  // Verify 27-hour bug cannot happen on a single day in the 7-day chart
  const overflowLogs: StudyLogEntry[] = [
    { id: 'x1', subjectId: 'science', subjectName: 'Science', date: '2026-11-19', durationMinutes: 900, createdAt: 10 },
    { id: 'x2', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-19', durationMinutes: 720, createdAt: 20 },
  ];
  const cappedSeries = getLast7DaysStudySeries(overflowLogs, '2026-11-19', '2026-11-19');
  assert.equal(cappedSeries[6].totalMinutes, 1440);
});

test('getTodayStudyLogs filters strictly to reference date', () => {
  const logs: StudyLogEntry[] = [
    { id: '1', subjectId: 'science', subjectName: 'Science', date: '2026-11-19', durationMinutes: 45, createdAt: 10 },
    { id: '2', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-18', durationMinutes: 90, createdAt: 20 },
  ];
  const today = getTodayStudyLogs(logs, '2026-11-19');
  assert.equal(today.length, 1);
  assert.equal(today[0].id, '1');
});

test('getTodayChapterActivity filters strictly to milestones checked today and flags 4/4 completion', () => {
  const todayNoon = new Date(2026, 10, 19, 12, 0, 0).getTime();
  const yesterdayNoon = new Date(2026, 10, 18, 12, 0, 0).getTime();

  let subjects: Subject[] = [
    {
      id: 'science',
      name: 'Science',
      accent: 'mint',
      subSubjects: [
        {
          id: 'physics',
          name: 'Physics',
          chapters: [
            {
              id: 'phy-1',
              name: 'Ch 1: Light',
              milestones: { lecture: true, notes: true, practice: true, extra: false },
              milestoneTimestamps: {
                lecture: yesterdayNoon,
                notes: yesterdayNoon,
                practice: yesterdayNoon,
              },
            },
            {
              id: 'phy-2',
              name: 'Ch 2: Human Eye',
              milestones: { lecture: true, notes: false, practice: false, extra: false },
              milestoneTimestamps: { lecture: yesterdayNoon },
            },
          ],
        },
      ],
    },
  ];

  // Toggle Extra on phy-1 today -> completes all 4!
  subjects = toggleChapterMilestone(subjects, 'science', 'physics', 'phy-1', 'extra', todayNoon);
  // Toggle Notes on phy-2 today -> partial!
  subjects = toggleChapterMilestone(subjects, 'science', 'physics', 'phy-2', 'notes', todayNoon + 1000);

  const activity = getTodayChapterActivity(subjects, '2026-11-19');
  assert.equal(activity.length, 2);
  assert.equal(activity[0].chapter.id, 'phy-2');
  assert.equal(activity[0].isFullyComplete, false);
  assert.deepEqual(
    activity[0].checkedToday.map((c) => c.label),
    ['Notes'],
  );

  assert.equal(activity[1].chapter.id, 'phy-1');
  assert.equal(activity[1].isFullyComplete, true);
  assert.deepEqual(
    activity[1].checkedToday.map((c) => c.label),
    ['Extra'],
  );
});

test('getMonthlyCalendarData builds Monday-first grid with aggregated study logs, 24h cap, and chapter updates', () => {
  const nov18Noon = new Date(2026, 10, 18, 12, 0, 0).getTime();
  const subjects: Subject[] = [
    {
      id: 'maths',
      name: 'Mathematics',
      accent: 'sky',
      subSubjects: [
        {
          id: 'maths-core',
          name: 'Maths',
          chapters: [
            {
              id: 'math-1',
              name: 'Ch 1: Real Numbers',
              milestones: { lecture: true, notes: false, practice: false, extra: false },
              milestoneTimestamps: { lecture: nov18Noon },
            },
          ],
        },
      ],
    },
  ];
  const logs: StudyLogEntry[] = [
    { id: '1', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-19', durationMinutes: 150, createdAt: 10 },
    { id: '2', subjectId: 'science', subjectName: 'Science', date: '2026-11-17', durationMinutes: 50, createdAt: 20 },
    { id: '3', subjectId: 'sst', subjectName: 'Social Science', date: '2026-10-28', durationMinutes: 90, createdAt: 30 }, // Previous month
  ];

  // November 2026 starts on Sunday -> Monday-first leadingEmptySlots = 6
  const cal = getMonthlyCalendarData(2026, 10, logs, subjects, '2026-11-19');
  assert.equal(cal.monthLabel, 'November 2026');
  assert.equal(cal.leadingEmptySlots, 6);
  assert.equal(cal.days.length, 30);
  assert.equal(cal.totalMinutes, 200);
  assert.equal(cal.activeDays, 2);
  assert.equal(cal.totalSessions, 2);

  const day17 = cal.days[16];
  assert.equal(day17.dateKey, '2026-11-17');
  assert.equal(day17.totalMinutes, 50);
  assert.equal(day17.hasActivity, true);
  assert.equal(day17.intensity, 1);

  const day18 = cal.days[17];
  assert.equal(day18.chapterUpdatesCount, 1);
  assert.equal(day18.hasActivity, true);
  assert.equal(day18.intensity, 0);

  const day19 = cal.days[18];
  assert.equal(day19.isToday, true);
  assert.equal(day19.totalMinutes, 150);
  assert.equal(day19.intensity, 3);

  const day20 = cal.days[19];
  assert.equal(day20.isFuture, true);

  assert.equal(formatMonthYearHeading(2026, 0), 'January 2026');
  assert.deepEqual(shiftMonth(2026, 0, -1), { year: 2025, monthIndex: 11 });
});
