export type GoalPeriod = 'daily' | 'weekly';

export interface SubjectStudyGoal {
  subjectId: string;
  dailyMinutes: number; // 0 means no daily goal set; max 1440 (24h)
  weeklyMinutes: number; // 0 means no weekly goal set; max 10080 (168h)
}
