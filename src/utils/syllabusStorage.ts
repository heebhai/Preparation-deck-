import type { Subject } from '../types/syllabus';
import { INITIAL_SYLLABUS } from '../data/syllabusData';

const SYLLABUS_STORAGE_KEY = 'syllabus_tracker_subjects_v4';

function createFreshSyllabus(): Subject[] {
  return INITIAL_SYLLABUS.map((subject) => ({
    ...subject,
    subSubjects: subject.subSubjects.map((sub) => ({
      ...sub,
      chapters: sub.chapters.map((chapter) => ({
        ...chapter,
        milestones: {
          lecture: false,
          notes: false,
          practice: false,
          extra: false,
        },
        milestoneTimestamps: {},
      })),
    })),
  }));
}

export function loadSyllabusSubjects(): Subject[] {
  try {
    const raw = window.localStorage.getItem(SYLLABUS_STORAGE_KEY);
    if (raw === null) {
      const fresh = createFreshSyllabus();
      saveSyllabusSubjects(fresh);
      return fresh;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== INITIAL_SYLLABUS.length) {
      const fresh = createFreshSyllabus();
      saveSyllabusSubjects(fresh);
      return fresh;
    }
    return parsed as Subject[];
  } catch {
    return createFreshSyllabus();
  }
}

export function saveSyllabusSubjects(subjects: ReadonlyArray<Subject>): void {
  try {
    window.localStorage.setItem(SYLLABUS_STORAGE_KEY, JSON.stringify(subjects));
  } catch {
    // Ignore storage quota / privacy errors
  }
}
