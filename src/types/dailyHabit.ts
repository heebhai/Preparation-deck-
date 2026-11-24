export interface DailyHabit {
  id: string;
  title: string;
  emoji: string;
  isDefault?: boolean;
}

export interface DailyHabitsState {
  dateKey: string;
  habits: DailyHabit[];
  completedIds: string[];
}
