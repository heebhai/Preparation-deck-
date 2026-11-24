import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyStudyLogToSubjects,
  countChapterMilestones,
  filterSubjectsByName,
  getOverallStats,
  getSubjectStats,
  getSubSubjectStats,
  isChapterComplete,
  searchChaptersAcrossSubjects,
  toggleChapterMilestone,
} from './syllabusMath';
import { INITIAL_SYLLABUS } from '../data/syllabusData';

test('isChapterComplete returns true only when all 4 milestones are true', () => {
  assert.equal(
    isChapterComplete({
      id: 'c1',
      name: 'Cell Biology',
      milestones: { lecture: true, notes: true, practice: true, extra: true },
    }),
    true,
  );
  assert.equal(
    isChapterComplete({
      id: 'c2',
      name: 'Genetics',
      milestones: { lecture: true, notes: true, practice: true, extra: false },
    }),
    false,
  );
});

test('countChapterMilestones counts checked items accurately', () => {
  assert.equal(
    countChapterMilestones({
      id: 'c1',
      name: 'Optics',
      milestones: { lecture: true, notes: false, practice: true, extra: false },
    }),
    2,
  );
});

test('INITIAL_SYLLABUS matches CBSE Class 10th NCERT structure and excludes deleted chapters', () => {
  assert.equal(INITIAL_SYLLABUS.length, 5);
  assert.deepEqual(
    INITIAL_SYLLABUS.map((s) => s.name),
    ['Science', 'Social Science', 'Mathematics', 'English', 'Hindi'],
  );

  // Verify exact chapter counts per subject
  const [science, sst, maths, english, hindi] = INITIAL_SYLLABUS;
  assert.equal(getSubjectStats(science).totalChapters, 13); // 5 Physics + 4 Chemistry + 4 Biology
  assert.equal(getSubjectStats(sst).totalChapters, 22); // 5 History + 7 Geography + 5 Civics + 5 Economics
  assert.equal(getSubjectStats(maths).totalChapters, 14); // 14 Maths chapters
  assert.equal(getSubjectStats(english).totalChapters, 28); // 19 First Flight (9 prose + 10 poems) + 9 Footprints
  assert.equal(getSubjectStats(hindi).totalChapters, 22); // 17 Kshitiz + 5 Kritika

  // Verify deleted NCERT Science chapters are excluded
  assert.equal(searchChaptersAcrossSubjects(INITIAL_SYLLABUS, 'Periodic Classification').length, 0);
  assert.equal(searchChaptersAcrossSubjects(INITIAL_SYLLABUS, 'Management of Natural Resources').length, 0);

  const overall = getOverallStats(INITIAL_SYLLABUS);
  assert.equal(overall.totalChapters, 99);
  assert.equal(overall.completedChapters, 0);
  assert.equal(overall.chapterPercent, 0);
});

test('toggleChapterMilestone completes a chapter when 4th milestone is checked', () => {
  const science = INITIAL_SYLLABUS[0];
  const physics = science.subSubjects[0];
  const incompleteChapter = physics.chapters.find((c) => !isChapterComplete(c));
  assert.ok(incompleteChapter, 'Expected at least one incomplete chapter in Physics');

  const beforeSubStats = getSubSubjectStats(physics);
  const beforeOverall = getOverallStats(INITIAL_SYLLABUS);

  let updated = INITIAL_SYLLABUS;
  for (const key of ['lecture', 'notes', 'practice', 'extra'] as const) {
    if (!incompleteChapter.milestones[key]) {
      updated = toggleChapterMilestone(updated, science.id, physics.id, incompleteChapter.id, key);
    }
  }

  const updatedPhysics = updated[0].subSubjects[0];
  const afterSubStats = getSubSubjectStats(updatedPhysics);
  assert.equal(afterSubStats.completedChapters, beforeSubStats.completedChapters + 1);

  const updatedOverall = getOverallStats(updated);
  assert.equal(updatedOverall.completedChapters, beforeOverall.completedChapters + 1);
});

test('applyStudyLogToSubjects auto-checks selected chapter milestones without unchecking existing ones', () => {
  const ts = 1_763_550_000_000;
  // Pre-check lecture+notes on sci-phy-4, then apply practice+extra
  let seeded = toggleChapterMilestone(INITIAL_SYLLABUS, 'science', 'physics', 'sci-phy-4', 'lecture', ts - 1000);
  seeded = toggleChapterMilestone(seeded, 'science', 'physics', 'sci-phy-4', 'notes', ts - 1000);

  const updated = applyStudyLogToSubjects(
    seeded,
    'science',
    [
      { chapterId: 'sci-phy-4', tasks: ['practice', 'extra'] },
      { chapterId: 'sci-phy-5', tasks: ['notes'] },
    ],
    ts,
  );

  const physics = updated[0].subSubjects[0];
  const phy4 = physics.chapters.find((c) => c.id === 'sci-phy-4');
  const phy5 = physics.chapters.find((c) => c.id === 'sci-phy-5');

  assert.ok(phy4 && phy5);
  assert.equal(isChapterComplete(phy4), true);
  assert.equal(phy4.milestoneTimestamps?.practice, ts);
  assert.equal(phy4.milestoneTimestamps?.extra, ts);
  assert.equal(phy5.milestones.lecture, false);
  assert.equal(phy5.milestones.notes, true);
  assert.equal(phy5.milestoneTimestamps?.notes, ts);
});

test('filterSubjectsByName filters subjects case-insensitively and handles empty queries', () => {
  assert.equal(filterSubjectsByName(INITIAL_SYLLABUS, '').length, 5);
  assert.equal(filterSubjectsByName(INITIAL_SYLLABUS, '   ').length, 5);

  const sci = filterSubjectsByName(INITIAL_SYLLABUS, 'sci');
  assert.deepEqual(
    sci.map((s) => s.name),
    ['Science', 'Social Science'],
  );

  const upper = filterSubjectsByName(INITIAL_SYLLABUS, '  MATH ');
  assert.deepEqual(
    upper.map((s) => s.name),
    ['Mathematics'],
  );

  const none = filterSubjectsByName(INITIAL_SYLLABUS, 'Sanskrit');
  assert.equal(none.length, 0);
});

test('searchChaptersAcrossSubjects finds NCERT chapters across all 5 subjects with parent metadata', () => {
  assert.equal(searchChaptersAcrossSubjects(INITIAL_SYLLABUS, '').length, 0);
  assert.equal(searchChaptersAcrossSubjects(INITIAL_SYLLABUS, '   ').length, 0);

  const lightResults = searchChaptersAcrossSubjects(INITIAL_SYLLABUS, 'light');
  assert.equal(lightResults.length, 1);
  assert.equal(lightResults[0].subjectName, 'Science');
  assert.equal(lightResults[0].subSubjectName, 'Physics');
  assert.equal(lightResults[0].chapter.id, 'sci-phy-1');

  const kritikaResults = searchChaptersAcrossSubjects(INITIAL_SYLLABUS, 'George Pancham');
  assert.equal(kritikaResults.length, 1);
  assert.equal(kritikaResults[0].subjectName, 'Hindi');
  assert.equal(kritikaResults[0].subSubjectName, 'Kritika');

  const footprintsResults = searchChaptersAcrossSubjects(INITIAL_SYLLABUS, 'Bholi');
  assert.equal(footprintsResults.length, 1);
  assert.equal(footprintsResults[0].subjectName, 'English');
  assert.equal(footprintsResults[0].subSubjectName, 'Footprints Without Feet');
});
