export interface BoardExamSettings {
  examDateKey: string; // YYYY-MM-DD local calendar date
  isCustom: boolean;
}

export type ExamCountdownPhase = 'upcoming' | 'today' | 'passed';

export interface ExamCountdownSummary {
  examDateKey: string;
  formattedExamDate: string;
  daysRemaining: number; // >= 0 for upcoming/today, negative if passed
  headlineValue: string;
  headlineUnit: string;
  phase: ExamCountdownPhase;
  isCustom: boolean;
}
