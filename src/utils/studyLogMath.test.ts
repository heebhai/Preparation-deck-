import test from 'node:test';
import assert from 'node:assert/strict';
import type { StudyLogEntry } from '../types/studyLog';
import {
  calculateStudyStats,
  formatDuration,
  formatStudyLogDate,
  formatStudyLogSummary,
  MAX_DAILY_STUDY_MINUTES,
  shiftLocalDateKey,
  sortStudyLogsNewestFirst,
  splitDurationEqually,
  validateStudyEntryInput,
} from './studyLogMath';

test('formatDuration formats minutes, exact hours, and hours + minutes cleanly', () => {
  assert.equal(formatDuration(0), '0m');
  assert.equal(formatDuration(45), '45m');
  assert.equal(formatDuration(120), '2h');
  assert.equal(formatDuration(150), '2h 30m');
  assert.equal(formatDuration(75), '1h 15m');
});

test('formatStudyLogDate formats YYYY-MM-DD in day + short month without timezone shift', () => {
  assert.equal(formatStudyLogDate('2026-05-24'), '24 May');
  assert.equal(formatStudyLogDate('2026-11-19'), '19 Nov');
});

test('calculateStudyStats aggregates Today, This Week, and This Month accurately and caps each day at 24h', () => {
  // Thursday 2026-11-19 -> week is Mon 2026-11-16 to Sun 2026-11-22
  const ref = '2026-11-19';
  const logs: StudyLogEntry[] = [
    {
      id: '1',
      subjectId: 'science',
      subjectName: 'Science',
      date: '2026-11-19', // Today + This Week + This Month
      durationMinutes: 90,
      createdAt: 100,
    },
    {
      id: '2',
      subjectId: 'maths',
      subjectName: 'Mathematics',
      date: '2026-11-17', // This Week + This Month
      durationMinutes: 75,
      createdAt: 90,
    },
    {
      id: '3',
      subjectId: 'sst',
      subjectName: 'Social Science',
      date: '2026-11-05', // Same Month, previous week
      durationMinutes: 120,
      createdAt: 80,
    },
    {
      id: '4',
      subjectId: 'english',
      subjectName: 'English',
      date: '2026-10-29', // Previous month
      durationMinutes: 60,
      createdAt: 70,
    },
  ];

  const stats = calculateStudyStats(logs, ref);
  assert.equal(stats.todayMinutes, 90);
  assert.equal(stats.weekMinutes, 165);
  assert.equal(stats.monthMinutes, 285);

  // Regression test for the 27-hour bug: multiple logs on same day exceeding 24h must cap at 1440m (24h)
  const overflowLogs: StudyLogEntry[] = [
    { id: 'o1', subjectId: 'science', subjectName: 'Science', date: ref, durationMinutes: 900, createdAt: 1 },
    { id: 'o2', subjectId: 'maths', subjectName: 'Mathematics', date: ref, durationMinutes: 720, createdAt: 2 }, // 1620m = 27h raw
  ];
  const cappedStats = calculateStudyStats(overflowLogs, ref);
  assert.equal(cappedStats.todayMinutes, MAX_DAILY_STUDY_MINUTES);
  assert.equal(cappedStats.weekMinutes, MAX_DAILY_STUDY_MINUTES);
  assert.equal(cappedStats.monthMinutes, MAX_DAILY_STUDY_MINUTES);
});

test('sortStudyLogsNewestFirst orders by date descending then createdAt descending', () => {
  const logs: StudyLogEntry[] = [
    { id: 'a', subjectId: 'science', subjectName: 'Science', date: '2026-11-18', durationMinutes: 60, createdAt: 10 },
    { id: 'b', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-19', durationMinutes: 45, createdAt: 20 },
    { id: 'c', subjectId: 'hindi', subjectName: 'Hindi', date: '2026-11-19', durationMinutes: 30, createdAt: 30 },
  ];

  assert.deepEqual(
    sortStudyLogsNewestFirst(logs).map((l) => l.id),
    ['c', 'b', 'a'],
  );
});

test('shiftLocalDateKey shifts across month boundaries cleanly', () => {
  assert.equal(shiftLocalDateKey('2026-11-01', -1), '2026-10-31');
});

test('validateStudyEntryInput validates duration, date, and multi-chapter tasks', () => {
  const zero = validateStudyEntryInput({
    subjectId: 'science',
    hours: '0',
    minutes: '0',
    date: '2026-11-19',
    maxDate: '2026-11-19',
  });
  assert.equal(zero.valid, false);

  const future = validateStudyEntryInput({
    subjectId: 'science',
    hours: '1',
    minutes: '0',
    date: '2026-11-20',
    maxDate: '2026-11-19',
  });
  assert.equal(future.valid, false);

  const missingChapters = validateStudyEntryInput({
    subjectId: 'maths',
    hours: '1',
    minutes: '30',
    date: '2026-11-19',
    maxDate: '2026-11-19',
    selectedChapters: [],
    requireChapters: true,
  });
  assert.equal(missingChapters.valid, false);

  const missingTasks = validateStudyEntryInput({
    subjectId: 'maths',
    hours: '1',
    minutes: '30',
    date: '2026-11-19',
    maxDate: '2026-11-19',
    selectedChapters: [{ chapterId: 'math-1', tasks: [] }],
    requireChapters: true,
  });
  assert.equal(missingTasks.valid, false);

  const ok = validateStudyEntryInput({
    subjectId: 'maths',
    hours: '2',
    minutes: '30',
    date: '2026-11-18',
    maxDate: '2026-11-19',
    selectedChapters: [
      { chapterId: 'math-1', tasks: ['lecture'] },
      { chapterId: 'math-2', tasks: ['practice'] },
    ],
    requireChapters: true,
  });
  assert.deepEqual(ok, { valid: true, totalMinutes: 150 });
});

test('splitDurationEqually and formatStudyLogSummary format multi-chapter logs cleanly', () => {
  assert.deepEqual(splitDurationEqually(150, 2), [75, 75]);
  assert.deepEqual(splitDurationEqually(91, 2), [46, 45]);

  const multiLog: StudyLogEntry = {
    id: 'm1',
    subjectId: 'maths',
    subjectName: 'Mathematics',
    date: '2026-11-19',
    durationMinutes: 150,
    createdAt: 1,
    items: [
      {
        subSubjectId: 'maths-core',
        subSubjectName: 'Maths',
        chapterId: 'math-1',
        chapterName: 'Ch 1: Real Numbers',
        tasks: ['lecture'],
      },
      {
        subSubjectId: 'maths-core',
        subSubjectName: 'Maths',
        chapterId: 'math-2',
        chapterName: 'Ch 2: Polynomials',
        tasks: ['practice'],
      },
    ],
  };
  assert.equal(formatStudyLogSummary(multiLog), 'Mathematics: Ch 1 Lecture + Ch 2 Practice');
});
