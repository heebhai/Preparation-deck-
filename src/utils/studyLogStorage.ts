import type { StudyLogEntry } from '../types/studyLog';

const STORAGE_KEY = 'syllabus_tracker_study_logs_v3';

export function loadStudyLogs(): StudyLogEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      // Fresh start: save empty array so fake logs never reappear, while preserving user logs on reload
      saveStudyLogs([]);
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is StudyLogEntry =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as StudyLogEntry).id === 'string' &&
        typeof (item as StudyLogEntry).subjectId === 'string' &&
        typeof (item as StudyLogEntry).subjectName === 'string' &&
        typeof (item as StudyLogEntry).date === 'string' &&
        typeof (item as StudyLogEntry).durationMinutes === 'number' &&
        typeof (item as StudyLogEntry).createdAt === 'number',
    );
  } catch {
    return [];
  }
}

export function saveStudyLogs(logs: ReadonlyArray<StudyLogEntry>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // Ignore storage quota / privacy mode errors gracefully
  }
}
