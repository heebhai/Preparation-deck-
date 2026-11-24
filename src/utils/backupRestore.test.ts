import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_SYLLABUS } from '../data/syllabusData';
import {
  BACKUP_APP_ID,
  createBackupPayload,
  getBackupFilename,
  parseAndValidateBackupJson,
  serializeBackupPayload,
} from './backupRestore';

test('createBackupPayload & parseAndValidateBackupJson round-trip restores all user data', () => {
  const modifiedSubjects = INITIAL_SYLLABUS.map((subj, sIdx) => ({
    ...subj,
    subSubjects: subj.subSubjects.map((sub, subIdx) => ({
      ...sub,
      chapters: sub.chapters.map((ch, cIdx) =>
        sIdx === 0 && subIdx === 0 && cIdx === 0
          ? {
              ...ch,
              milestones: { lecture: true, notes: true, practice: false, extra: false },
              milestoneTimestamps: { lecture: 1700000001000, notes: 1700000002000 },
            }
          : ch,
      ),
    })),
  }));

  const payload = createBackupPayload({
    streakCount: 5,
    exportedAt: '2026-11-20T10:00:00.000Z',
    subjects: modifiedSubjects,
    studyLogs: [
      {
        id: 'log-1',
        subjectId: 'science',
        subjectName: 'Science',
        date: '2026-11-20',
        durationMinutes: 90,
        createdAt: 1700000003000,
        items: [
          {
            subSubjectId: 'physics',
            subSubjectName: 'Physics',
            chapterId: 'sci-phy-1',
            chapterName: 'Ch 1: Light – Reflection and Refraction',
            tasks: ['lecture', 'notes'],
          },
        ],
      },
    ],
    subjectGoals: [
      { subjectId: 'science', dailyMinutes: 120, weeklyMinutes: 600 },
    ],
    savedBadgesMap: { 'early-bird': 1700000003000, 'on-fire': 1700000004000 },
    screenTimeMap: { '2026-11-20': 75 },
    dailyHabits: {
      dateKey: '2026-11-20',
      habits: [
        { id: 'sleep-8', title: 'Sleep 8 hours', emoji: '😴', isDefault: true },
      ],
      completedIds: ['sleep-8'],
    },
    dailyTodosState: {
      dateKey: '2026-11-20',
      items: [
        { id: 't1', title: 'Revise Physics Ch 1', completed: true, createdAt: 100 },
        { id: 't2', title: 'Solve Maths PYQs', completed: false, createdAt: 200 },
      ],
    },
    examSettings: { examDateKey: '2027-02-15', isCustom: true },
    heeCoinState: {
      balance: 9,
      rawBalance: 9,
      spentCoins: 3,
      purchasedCounts: { 'streak-protector': 1 },
      redeemedInfinite: false,
    },
    quotes: [
      {
        id: 'q-1',
        text: 'Stay consistent every day.',
        author: 'Mentor',
        scheduledDateKey: '2026-11-25',
        createdAt: 1700000005000,
      },
    ],
    isDark: true,
  });

  const json = serializeBackupPayload(payload);
  const parsed = parseAndValidateBackupJson(json, '2026-11-20');

  assert.equal(parsed.valid, true);
  if (!parsed.valid) return;

  assert.equal(parsed.payload.appId, BACKUP_APP_ID);
  assert.equal(parsed.payload.streakCount, 5);
  assert.equal(parsed.payload.data.studyLogs.length, 1);
  assert.equal(parsed.payload.data.studyLogs[0].durationMinutes, 90);
  assert.deepEqual(
    parsed.payload.data.subjects[0].subSubjects[0].chapters[0].milestones,
    { lecture: true, notes: true, practice: false, extra: false },
  );
  assert.equal(
    parsed.payload.data.subjects[0].subSubjects[0].chapters[0].milestoneTimestamps?.lecture,
    1700000001000,
  );
  assert.equal(parsed.payload.data.screenTimeMap['2026-11-20'], 75);
  assert.equal(parsed.payload.data.savedBadgesMap['on-fire'], 1700000004000);
  assert.deepEqual(parsed.payload.data.dailyHabits.completedIds, ['sleep-8']);
  assert.equal(parsed.payload.data.dailyTodosState.items.length, 2);
  assert.equal(parsed.payload.data.dailyTodosState.items[0].completed, true);
  assert.equal(parsed.payload.data.examSettings.examDateKey, '2027-02-15');
  assert.deepEqual(parsed.payload.data.heeCoinState, {
    balance: 9,
    rawBalance: 9,
    spentCoins: 3,
    purchasedCounts: { 'streak-protector': 1 },
    redeemedInfinite: false,
  });
  assert.equal(parsed.payload.data.quotes?.length, 1);
  assert.equal(parsed.payload.data.quotes?.[0].scheduledDateKey, '2026-11-25');
  assert.equal(parsed.payload.data.isDark, true);
});

test('parseAndValidateBackupJson rejects empty, malformed, wrong appId, and incomplete backups', () => {
  const emptyRes = parseAndValidateBackupJson('   ', '2026-11-20');
  assert.equal(emptyRes.valid, false);

  const badJsonRes = parseAndValidateBackupJson('{not valid json', '2026-11-20');
  assert.equal(badJsonRes.valid, false);

  const wrongAppRes = parseAndValidateBackupJson(
    JSON.stringify({ appId: 'other-app', data: { subjects: [], studyLogs: [] } }),
    '2026-11-20',
  );
  assert.equal(wrongAppRes.valid, false);

  const missingDataRes = parseAndValidateBackupJson(
    JSON.stringify({ appId: BACKUP_APP_ID, version: 1, data: { studyLogs: [] } }),
    '2026-11-20',
  );
  assert.equal(missingDataRes.valid, false);
});

test('getBackupFilename uses dated JSON filename format', () => {
  assert.equal(getBackupFilename('2026-11-20'), 'syllabus-tracker-backup-2026-11-20.json');
});
