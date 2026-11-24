import type { DailyHabitsState } from './dailyHabit';
import type { DailyTodosState } from './dailyTodo';
import type { BoardExamSettings } from './examCountdown';
import type { HeeCoinState } from './heeCoin';
import type { QuoteItem } from './quote';
import type { SubjectStudyGoal } from './studyGoal';
import type { StudyLogEntry } from './studyLog';
import type { Subject } from './syllabus';
import type { BadgeId } from '../utils/badgesMath';
import type { ScreenTimeByDate } from '../utils/screenTimeStorage';

export interface AppBackupData {
  subjects: Subject[];
  studyLogs: StudyLogEntry[];
  subjectGoals: SubjectStudyGoal[];
  savedBadgesMap: Partial<Record<BadgeId, number>>;
  screenTimeMap: ScreenTimeByDate;
  dailyHabits: DailyHabitsState;
  dailyTodosState: DailyTodosState;
  examSettings: BoardExamSettings;
  heeCoinState?: HeeCoinState;
  quotes?: QuoteItem[];
  isDark?: boolean;
}

export interface AppBackupPayload {
  appId: 'syllabus-tracker-class10';
  version: 1;
  exportedAt: string;
  streakCount: number;
  data: AppBackupData;
}

export type BackupParseResult =
  | {
      valid: true;
      payload: AppBackupPayload;
    }
  | {
      valid: false;
      error: string;
    };
