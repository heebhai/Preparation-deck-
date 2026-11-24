import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_SYLLABUS } from '../data/syllabusData';
import {
  buildPomodoroLogPayload,
  calculateElapsedFocusMinutes,
  clampFocusMinutes,
  formatCountdown,
  getChaptersForSubject,
  getModeDefaultMinutes,
} from './pomodoroMath';

test('formatCountdown formats seconds as zero-padded MM:SS', () => {
  assert.equal(formatCountdown(1500), '25:00');
  assert.equal(formatCountdown(65), '01:05');
  assert.equal(formatCountdown(0), '00:00');
  assert.equal(formatCountdown(-5), '00:00');
});

test('clampFocusMinutes and getModeDefaultMinutes enforce bounds cleanly', () => {
  assert.equal(clampFocusMinutes(25), 25);
  assert.equal(clampFocusMinutes(0), 1);
  assert.equal(clampFocusMinutes(300), 180);
  assert.equal(getModeDefaultMinutes('focus', 45), 45);
  assert.equal(getModeDefaultMinutes('short-break', 45), 5);
  assert.equal(getModeDefaultMinutes('long-break', 45), 15);
});

test('getChaptersForSubject returns flattened chapters with sub-subject context', () => {
  const science = INITIAL_SYLLABUS[0];
  const chapters = getChaptersForSubject(science);
  assert.equal(chapters.length, 13);
  assert.equal(chapters[0].subjectId, 'science');
  assert.equal(chapters[0].subSubjectName, 'Physics');
  assert.equal(chapters[0].chapterId, 'sci-phy-1');
});

test('calculateElapsedFocusMinutes and buildPomodoroLogPayload compute auto-log data accurately', () => {
  assert.equal(calculateElapsedFocusMinutes(25, 1500), 0);
  assert.equal(calculateElapsedFocusMinutes(25, 0), 25);
  assert.equal(calculateElapsedFocusMinutes(25, 900), 10);

  const science = INITIAL_SYLLABUS[0];
  const chapter = getChaptersForSubject(science)[0];
  const payload = buildPomodoroLogPayload({
    subject: science,
    chapterOption: chapter,
    tasks: ['lecture', 'notes'],
    durationMinutes: 25,
    dateKey: '2026-11-19',
  });

  assert.equal(payload.subjectId, 'science');
  assert.equal(payload.durationMinutes, 25);
  assert.equal(payload.date, '2026-11-19');
  assert.equal(payload.items.length, 1);
  assert.equal(payload.items[0].chapterId, 'sci-phy-1');
  assert.deepEqual(payload.items[0].tasks, ['lecture', 'notes']);
});
