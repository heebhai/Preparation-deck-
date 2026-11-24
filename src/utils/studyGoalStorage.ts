import type { SubjectStudyGoal } from '../types/studyGoal';
import type { Subject } from '../types/syllabus';
import {
  createDefaultSubjectGoals,
  MAX_DAILY_GOAL_MINUTES,
  MAX_WEEKLY_GOAL_MINUTES,
} from './studyGoalMath';

const STORAGE_KEY = 'syllabus_tracker_subject_goals_v1';

export function loadSubjectGoals(subjects: ReadonlyArray<Subject>): SubjectStudyGoal[] {
  const defaults = createDefaultSubjectGoals(subjects);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      saveSubjectGoals(defaults);
      return defaults;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaults;
    }

    const parsedMap = new Map<string, SubjectStudyGoal>();
    for (const item of parsed) {
      if (
        item &&
        typeof item === 'object' &&
        typeof (item as SubjectStudyGoal).subjectId === 'string' &&
        typeof (item as SubjectStudyGoal).dailyMinutes === 'number' &&
        typeof (item as SubjectStudyGoal).weeklyMinutes === 'number'
      ) {
        const g = item as SubjectStudyGoal;
        parsedMap.set(g.subjectId, {
          subjectId: g.subjectId,
          dailyMinutes: Math.max(0, Math.min(MAX_DAILY_GOAL_MINUTES, Math.round(g.dailyMinutes))),
          weeklyMinutes: Math.max(0, Math.min(MAX_WEEKLY_GOAL_MINUTES, Math.round(g.weeklyMinutes))),
        });
      }
    }

    return defaults.map((def) => parsedMap.get(def.subjectId) ?? def);
  } catch {
    return defaults;
  }
}

export function saveSubjectGoals(goals: ReadonlyArray<SubjectStudyGoal>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch {
    // Ignore storage quota / privacy mode errors gracefully
  }
}
