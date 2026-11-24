export interface DailyTodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface DailyTodosState {
  dateKey: string; // YYYY-MM-DD local calendar day
  items: DailyTodoItem[];
}

export interface DailyWorkSummary {
  dateKey: string;
  formattedDayLabel: string;
  totalCount: number;
  completedCount: number;
  remainingCount: number;
  remainingItems: DailyTodoItem[];
  progressPercent: number;
}
