import type {
  Chapter,
  ChapterSearchResult,
  MilestoneKey,
  ProgressStats,
  Subject,
  SubSubject,
} from '../types/syllabus';

export const MILESTONE_ITEMS: ReadonlyArray<{ key: MilestoneKey; label: string }> = [
  { key: 'lecture', label: 'Lecture' },
  { key: 'notes', label: 'Notes' },
  { key: 'practice', label: 'Practice' },
  { key: 'extra', label: 'Extra' },
];

export function isChapterComplete(chapter: Chapter): boolean {
  const { lecture, notes, practice, extra } = chapter.milestones;
  return lecture && notes && practice && extra;
}

export function countChapterMilestones(chapter: Chapter): number {
  const { lecture, notes, practice, extra } = chapter.milestones;
  return Number(lecture) + Number(notes) + Number(practice) + Number(extra);
}

export function getSubSubjectStats(subSubject: SubSubject): ProgressStats {
  const totalChapters = subSubject.chapters.length;
  let completedChapters = 0;
  let completedMilestones = 0;
  const totalMilestones = totalChapters * 4;

  for (const chapter of subSubject.chapters) {
    if (isChapterComplete(chapter)) {
      completedChapters += 1;
    }
    completedMilestones += countChapterMilestones(chapter);
  }

  return {
    completedChapters,
    totalChapters,
    completedMilestones,
    totalMilestones,
    chapterPercent: totalChapters === 0 ? 0 : Math.round((completedChapters / totalChapters) * 100),
    milestonePercent: totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100),
  };
}

export function getSubjectStats(subject: Subject): ProgressStats {
  let completedChapters = 0;
  let totalChapters = 0;
  let completedMilestones = 0;
  let totalMilestones = 0;

  for (const sub of subject.subSubjects) {
    const stats = getSubSubjectStats(sub);
    completedChapters += stats.completedChapters;
    totalChapters += stats.totalChapters;
    completedMilestones += stats.completedMilestones;
    totalMilestones += stats.totalMilestones;
  }

  return {
    completedChapters,
    totalChapters,
    completedMilestones,
    totalMilestones,
    chapterPercent: totalChapters === 0 ? 0 : Math.round((completedChapters / totalChapters) * 100),
    milestonePercent: totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100),
  };
}

export function getOverallStats(subjects: ReadonlyArray<Subject>): ProgressStats {
  let completedChapters = 0;
  let totalChapters = 0;
  let completedMilestones = 0;
  let totalMilestones = 0;

  for (const subject of subjects) {
    const stats = getSubjectStats(subject);
    completedChapters += stats.completedChapters;
    totalChapters += stats.totalChapters;
    completedMilestones += stats.completedMilestones;
    totalMilestones += stats.totalMilestones;
  }

  return {
    completedChapters,
    totalChapters,
    completedMilestones,
    totalMilestones,
    chapterPercent: totalChapters === 0 ? 0 : Math.round((completedChapters / totalChapters) * 100),
    milestonePercent: totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100),
  };
}

export function toggleChapterMilestone(
  subjects: ReadonlyArray<Subject>,
  subjectId: string,
  subSubjectId: string,
  chapterId: string,
  milestoneKey: MilestoneKey,
  nowTimestamp: number = Date.now(),
): Subject[] {
  return subjects.map((subject) => {
    if (subject.id !== subjectId) {
      return subject;
    }
    return {
      ...subject,
      subSubjects: subject.subSubjects.map((sub) => {
        if (sub.id !== subSubjectId) {
          return sub;
        }
        return {
          ...sub,
          chapters: sub.chapters.map((chapter) => {
            if (chapter.id !== chapterId) {
              return chapter;
            }
            const nextValue = !chapter.milestones[milestoneKey];
            const nextTimestamps: Partial<Record<MilestoneKey, number>> = {
              ...(chapter.milestoneTimestamps ?? {}),
            };
            if (nextValue) {
              nextTimestamps[milestoneKey] = nowTimestamp;
            } else {
              delete nextTimestamps[milestoneKey];
            }
            return {
              ...chapter,
              milestones: {
                ...chapter.milestones,
                [milestoneKey]: nextValue,
              },
              milestoneTimestamps: nextTimestamps,
            };
          }),
        };
      }),
    };
  });
}

export function applyStudyLogToSubjects(
  subjects: ReadonlyArray<Subject>,
  subjectId: string,
  items: ReadonlyArray<{ chapterId: string; tasks: ReadonlyArray<MilestoneKey> }>,
  timestamp: number = Date.now(),
): Subject[] {
  if (items.length === 0) {
    return [...subjects];
  }

  const tasksByChapter = new Map<string, ReadonlyArray<MilestoneKey>>();
  for (const item of items) {
    if (item.tasks.length > 0) {
      tasksByChapter.set(item.chapterId, item.tasks);
    }
  }

  return subjects.map((subject) => {
    if (subject.id !== subjectId) {
      return subject;
    }
    return {
      ...subject,
      subSubjects: subject.subSubjects.map((sub) => ({
        ...sub,
        chapters: sub.chapters.map((chapter) => {
          const tasks = tasksByChapter.get(chapter.id);
          if (!tasks || tasks.length === 0) {
            return chapter;
          }
          const nextMilestones = { ...chapter.milestones };
          const nextTimestamps: Partial<Record<MilestoneKey, number>> = {
            ...(chapter.milestoneTimestamps ?? {}),
          };
          for (const taskKey of tasks) {
            nextMilestones[taskKey] = true;
            nextTimestamps[taskKey] = timestamp;
          }
          return {
            ...chapter,
            milestones: nextMilestones,
            milestoneTimestamps: nextTimestamps,
          };
        }),
      })),
    };
  });
}

export function filterSubjectsByName(
  subjects: ReadonlyArray<Subject>,
  query: string,
): Subject[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [...subjects];
  }
  return subjects.filter((subject) =>
    subject.name.toLowerCase().includes(normalized),
  );
}

export function searchChaptersAcrossSubjects(
  subjects: ReadonlyArray<Subject>,
  query: string,
): ChapterSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordStartRegex = new RegExp(`(?:^|[\\s(/–-])${escaped}`, 'i');

  const results: ChapterSearchResult[] = [];
  for (const subject of subjects) {
    const matchesSubject = wordStartRegex.test(subject.name);
    for (const subSubject of subject.subSubjects) {
      const matchesSub = wordStartRegex.test(subSubject.name);
      for (const chapter of subSubject.chapters) {
        const matchesChapter = chapter.name.toLowerCase().includes(normalized);
        if (matchesChapter || matchesSub || matchesSubject) {
          results.push({
            subjectId: subject.id,
            subjectName: subject.name,
            subjectAccent: subject.accent,
            subSubjectId: subSubject.id,
            subSubjectName: subSubject.name,
            chapter,
          });
        }
      }
    }
  }
  return results;
}
