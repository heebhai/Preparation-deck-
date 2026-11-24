export type MilestoneKey = 'lecture' | 'notes' | 'practice' | 'extra';

export interface ChapterMilestones {
  lecture: boolean;
  notes: boolean;
  practice: boolean;
  extra: boolean;
}

export interface Chapter {
  id: string;
  name: string;
  milestones: ChapterMilestones;
  milestoneTimestamps?: Partial<Record<MilestoneKey, number>>;
}

export interface SubSubject {
  id: string;
  name: string;
  chapters: Chapter[];
}

export type SubjectAccent = 'mint' | 'apricot' | 'sky' | 'rose' | 'lavender';

export interface Subject {
  id: string;
  name: string;
  accent: SubjectAccent;
  subSubjects: SubSubject[];
}

export interface ProgressStats {
  completedChapters: number;
  totalChapters: number;
  completedMilestones: number;
  totalMilestones: number;
  chapterPercent: number;
  milestonePercent: number;
}

export interface ChapterSearchResult {
  subjectId: string;
  subjectName: string;
  subjectAccent: SubjectAccent;
  subSubjectId: string;
  subSubjectName: string;
  chapter: Chapter;
}
