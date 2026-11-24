import type { MilestoneKey } from './syllabus';

export interface StudyLogChapterItem {
  subSubjectId: string;
  subSubjectName: string;
  chapterId: string;
  chapterName: string;
  tasks: MilestoneKey[];
}

export interface StudyLogEntry {
  id: string;
  subjectId: string;
  subjectName: string;
  date: string; // YYYY-MM-DD local calendar date
  durationMinutes: number;
  createdAt: number;
  items?: StudyLogChapterItem[];
}

export interface StudyTimeStats {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
}
