import type { StudyLogChapterItem } from '../types/studyLog';
import type { MilestoneKey, Subject } from '../types/syllabus';

export type PomodoroMode = 'focus' | 'short-break' | 'long-break';

export interface ChapterOption {
  subjectId: string;
  subjectName: string;
  subSubjectId: string;
  subSubjectName: string;
  chapterId: string;
  chapterName: string;
}

export const FOCUS_PRESET_MINUTES = [15, 25, 45, 60] as const;
export const SHORT_BREAK_MINUTES = 5;
export const LONG_BREAK_MINUTES = 15;
export const MIN_FOCUS_MINUTES = 1;
export const MAX_FOCUS_MINUTES = 180;

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function clampFocusMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) {
    return 25;
  }
  return Math.max(MIN_FOCUS_MINUTES, Math.min(MAX_FOCUS_MINUTES, Math.round(minutes)));
}

export function getModeDefaultMinutes(mode: PomodoroMode, focusMinutes: number): number {
  switch (mode) {
    case 'focus':
      return clampFocusMinutes(focusMinutes);
    case 'short-break':
      return SHORT_BREAK_MINUTES;
    case 'long-break':
      return LONG_BREAK_MINUTES;
  }
}

export function getChaptersForSubject(subject: Subject | undefined): ChapterOption[] {
  if (!subject) {
    return [];
  }
  const options: ChapterOption[] = [];
  for (const sub of subject.subSubjects) {
    for (const ch of sub.chapters) {
      options.push({
        subjectId: subject.id,
        subjectName: subject.name,
        subSubjectId: sub.id,
        subSubjectName: sub.name,
        chapterId: ch.id,
        chapterName: ch.name,
      });
    }
  }
  return options;
}

export function calculateElapsedFocusMinutes(
  plannedMinutes: number,
  remainingSeconds: number,
): number {
  const totalPlannedSeconds = Math.max(60, Math.round(plannedMinutes) * 60);
  const elapsedSeconds = Math.max(0, totalPlannedSeconds - Math.max(0, remainingSeconds));
  if (elapsedSeconds === 0) {
    return 0;
  }
  return Math.max(1, Math.round(elapsedSeconds / 60));
}

export function buildPomodoroLogPayload(params: {
  subject: Subject;
  chapterOption?: ChapterOption;
  tasks: ReadonlyArray<MilestoneKey>;
  durationMinutes: number;
  dateKey: string;
}): {
  subjectId: string;
  subjectName: string;
  date: string;
  durationMinutes: number;
  items: StudyLogChapterItem[];
} {
  const items: StudyLogChapterItem[] = params.chapterOption
    ? [
        {
          subSubjectId: params.chapterOption.subSubjectId,
          subSubjectName: params.chapterOption.subSubjectName,
          chapterId: params.chapterOption.chapterId,
          chapterName: params.chapterOption.chapterName,
          tasks: [...params.tasks],
        },
      ]
    : [];

  return {
    subjectId: params.subject.id,
    subjectName: params.subject.name,
    date: params.dateKey,
    durationMinutes: Math.max(1, Math.round(params.durationMinutes)),
    items,
  };
}
