import test from 'node:test';
import assert from 'node:assert/strict';
import type { StudyLogEntry } from '../types/studyLog';
import type { Subject } from '../types/syllabus';
import {
  calculateOverallGoalsSummary,
  calculateSubjectGoalProgressList,
  calculateSubjectLoggedMinutes,
  createDefaultSubjectGoals,
  splitMinutesToHoursAndMinutes,
  validateSubjectGoalInput,
} from './studyGoalMath';

const TEST_SUBJECTS: Subject[] = [
  { id: 'science', name: 'Science', accent: 'mint', subSubjects: [] },
  { id: 'maths', name: 'Mathematics', accent: 'sky', subSubjects: [] },
  { id: 'hindi', name: 'Hindi', accent: 'lavender', subSubjects: [] },
];

test('calculateSubjectLoggedMinutes filters by subject, period, and caps each day at 24h', () => {
  const logs: StudyLogEntry[] = [
    { id: '1', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-19', durationMinutes: 150, createdAt: 10 },
    { id: '2', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-17', durationMinutes: 90, createdAt: 20 },
    { id: '3', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-10', durationMinutes: 120, createdAt: 30 }, // Last week
    { id: '4', subjectId: 'science', subjectName: 'Science', date: '2026-11-19', durationMinutes: 60, createdAt: 40 },
    { id: '5', subjectId: 'hindi', subjectName: 'Hindi', date: '2026-11-19', durationMinutes: 1800, createdAt: 50 }, // Exceeds 24h
  ];

  assert.equal(calculateSubjectLoggedMinutes(logs, 'maths', 'daily', '2026-11-19'), 150);
  assert.equal(calculateSubjectLoggedMinutes(logs, 'maths', 'weekly', '2026-11-19'), 240);
  assert.equal(calculateSubjectLoggedMinutes(logs, 'science', 'daily', '2026-11-19'), 60);
  assert.equal(calculateSubjectLoggedMinutes(logs, 'hindi', 'daily', '2026-11-19'), 1440);
});

test('calculateSubjectGoalProgressList computes ring percent, goal-met state, and summary', () => {
  const logs: StudyLogEntry[] = [
    { id: '1', subjectId: 'maths', subjectName: 'Mathematics', date: '2026-11-19', durationMinutes: 150, createdAt: 10 },
    { id: '2', subjectId: 'science', subjectName: 'Science', date: '2026-11-19', durationMinutes: 45, createdAt: 20 },
  ];
  const goals = [
    { subjectId: 'science', dailyMinutes: 90, weeklyMinutes: 540 },
    { subjectId: 'maths', dailyMinutes: 120, weeklyMinutes: 720 },
    { subjectId: 'hindi', dailyMinutes: 0, weeklyMinutes: 0 },
  ];

  const dailyList = calculateSubjectGoalProgressList({
    subjects: TEST_SUBJECTS,
    logs,
    goals,
    period: 'daily',
    referenceDateKey: '2026-11-19',
  });

  assert.equal(dailyList[0].subjectId, 'science');
  assert.equal(dailyList[0].rawPercent, 50);
  assert.equal(dailyList[0].ringPercent, 50);
  assert.equal(dailyList[0].remainingMinutes, 45);
  assert.equal(dailyList[0].isGoalMet, false);

  assert.equal(dailyList[1].subjectId, 'maths');
  assert.equal(dailyList[1].rawPercent, 125);
  assert.equal(dailyList[1].ringPercent, 100);
  assert.equal(dailyList[1].remainingMinutes, 0);
  assert.equal(dailyList[1].isGoalMet, true);

  assert.equal(dailyList[2].subjectId, 'hindi');
  assert.equal(dailyList[2].hasGoal, false);
  assert.equal(dailyList[2].ringPercent, 0);

  const summary = calculateOverallGoalsSummary(dailyList);
  assert.equal(summary.activeGoalsCount, 2);
  assert.equal(summary.goalsMetCount, 1);
  assert.equal(summary.totalLoggedMinutes, 195);
  assert.equal(summary.totalTargetMinutes, 210);
  assert.equal(summary.overallPercent, 93);
});

test('createDefaultSubjectGoals and validateSubjectGoalInput behave safely', () => {
  const defaults = createDefaultSubjectGoals(TEST_SUBJECTS);
  assert.equal(defaults.length, 3);
  assert.equal(defaults[1].dailyMinutes, 120);
  assert.equal(defaults[1].weeklyMinutes, 720);

  assert.deepEqual(splitMinutesToHoursAndMinutes(150), { hours: 2, minutes: 30 });

  const ok = validateSubjectGoalInput({
    dailyHours: '1',
    dailyMinutes: '30',
    weeklyHours: '10',
    weeklyMinutes: '0',
  });
  assert.deepEqual(ok, {
    valid: true,
    dailyTotalMinutes: 90,
    weeklyTotalMinutes: 600,
  });

  const badDaily = validateSubjectGoalInput({
    dailyHours: '24',
    dailyMinutes: '10',
    weeklyHours: '10',
    weeklyMinutes: '0',
  });
  assert.equal(badDaily.valid, false);

  const badWeekly = validateSubjectGoalInput({
    dailyHours: '1',
    dailyMinutes: '0',
    weeklyHours: '169',
    weeklyMinutes: '0',
  });
  assert.equal(badWeekly.valid, false);
});
