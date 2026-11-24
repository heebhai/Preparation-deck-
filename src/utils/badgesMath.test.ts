import test from 'node:test';
import assert from 'node:assert/strict';
import type { StudyLogEntry } from '../types/studyLog';
import type { Subject } from '../types/syllabus';
import {
  calculateBestStreak,
  calculateCurrentStreak,
  collectQualifyingStreakDates,
  evaluateGamification,
  getScreenTimeStatus,
} from './badgesMath';

const emptySubjects: Subject[] = [
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
            milestones: { lecture: false, notes: false, practice: false, extra: false },
          },
        ],
      },
    ],
  },
];

test('evaluateGamification starts with 0 streak and all 5 badges locked when empty', () => {
  const res = evaluateGamification([], emptySubjects, {}, '2026-11-19', 1000);
  assert.equal(res.currentStreakDays, 0);
  assert.equal(res.bestStreakDays, 0);
  assert.equal(res.badges.length, 5);
  assert.equal(res.badges.every((b) => !b.unlocked), true);
  assert.equal(res.newlyUnlocked.length, 0);
});

test('streak requires >= 60 minutes session or at least 2 completed chapter checkboxes and resets if a day is missed', () => {
  const shortOnly: StudyLogEntry[] = [
    { id: '1', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-19', durationMinutes: 59, createdAt: 10 },
  ];
  assert.equal(collectQualifyingStreakDates(shortOnly, emptySubjects).size, 0);

  const validSession: StudyLogEntry[] = [
    { id: '2', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-19', durationMinutes: 60, createdAt: 10 },
  ];
  const validDates = collectQualifyingStreakDates(validSession, emptySubjects);
  assert.equal(calculateCurrentStreak(validDates, '2026-11-19'), 1);

  // Missed yesterday (2026-11-18) and nothing today -> streak resets to 0
  const missedDates = new Set(['2026-11-17']);
  assert.equal(calculateCurrentStreak(missedDates, '2026-11-19'), 0);

  // 2 checkboxes alone count as a streak day
  const taskSubjects: Subject[] = [
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
              milestones: { lecture: true, notes: true, practice: false, extra: false },
              milestoneTimestamps: {
                lecture: new Date(2026, 10, 18, 14, 0, 0).getTime(),
                notes: new Date(2026, 10, 18, 15, 0, 0).getTime(),
              },
            },
          ],
        },
      ],
    },
  ];
  const combinedDates = collectQualifyingStreakDates(
    [
      { id: 'a', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-17', durationMinutes: 65, createdAt: 10 },
      { id: 'b', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-19', durationMinutes: 60, createdAt: 20 },
    ],
    taskSubjects,
  );
  assert.equal(calculateBestStreak(combinedDates), 3);
  assert.equal(calculateCurrentStreak(combinedDates, '2026-11-19'), 3);
});

test('awards Early Bird (<8 AM), Night Owl (>=10 PM), Chapter Crusher (all 4 in 1 day), On Fire (3-day streak), and Deep Focus (3h+ single session)', () => {
  const sixAm = new Date(2026, 10, 19, 6, 45, 0).getTime();
  const tenThirtyPm = new Date(2026, 10, 18, 22, 30, 0).getTime();
  const nineThirtyPm = new Date(2026, 10, 17, 21, 30, 0).getTime();

  // 21:30 should NOT unlock Night Owl (must be after 10:00 PM)
  const ninePmOnly = evaluateGamification(
    [{ id: 'n0', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-17', durationMinutes: 60, createdAt: nineThirtyPm }],
    emptySubjects,
    {},
    '2026-11-17',
    1000,
  );
  assert.equal(ninePmOnly.badges.find((b) => b.id === 'night-owl')?.unlocked, false);

  const crusherSubjects: Subject[] = [
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
              milestones: { lecture: true, notes: true, practice: true, extra: true },
              milestoneTimestamps: {
                lecture: sixAm,
                notes: sixAm + 1000,
                practice: sixAm + 2000,
                extra: sixAm + 3000,
              },
            },
          ],
        },
      ],
    },
  ];

  const logs: StudyLogEntry[] = [
    { id: '1', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-17', durationMinutes: 60, createdAt: nineThirtyPm },
    { id: '2', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-18', durationMinutes: 60, createdAt: tenThirtyPm },
    { id: '3', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-19', durationMinutes: 180, createdAt: sixAm },
  ];

  const res = evaluateGamification(logs, crusherSubjects, {}, '2026-11-19', 5000);
  assert.equal(res.currentStreakDays, 3);
  assert.equal(res.badges.every((b) => b.unlocked), true);
  assert.equal(res.newlyUnlocked.length, 5);

  // Persisted badges stay unlocked on subsequent evaluations and do not re-trigger newlyUnlocked
  const reloadRes = evaluateGamification([], emptySubjects, res.updatedSavedMap, '2026-11-19', 6000);
  assert.equal(reloadRes.badges.every((b) => b.unlocked), true);
  assert.equal(reloadRes.newlyUnlocked.length, 0);
});

test('Chapter Crusher does NOT unlock if 4 circles were completed across different days', () => {
  const day1 = new Date(2026, 10, 18, 12, 0, 0).getTime();
  const day2 = new Date(2026, 10, 19, 12, 0, 0).getTime();

  const splitSubjects: Subject[] = [
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
              milestones: { lecture: true, notes: true, practice: true, extra: true },
              milestoneTimestamps: {
                lecture: day1,
                notes: day1,
                practice: day2,
                extra: day2,
              },
            },
          ],
        },
      ],
    },
  ];

  const res = evaluateGamification([], splitSubjects, {}, '2026-11-19', 1000);
  assert.equal(res.badges.find((b) => b.id === 'chapter-crusher')?.unlocked, false);
});

test('getScreenTimeStatus flags warning only when screen time > study time', () => {
  assert.equal(getScreenTimeStatus(0, 0).isHigherThanStudy, false);
  assert.equal(getScreenTimeStatus(60, 60).isHigherThanStudy, false);
  assert.equal(getScreenTimeStatus(90, 60).isHigherThanStudy, true);
  assert.equal(getScreenTimeStatus(30, 60).isHigherThanStudy, false);
});
