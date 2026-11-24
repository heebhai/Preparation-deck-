import { useState, type FormEvent } from 'react';
import { Check, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { DailyHabitsState } from '../types/dailyHabit';

interface DailyHabitsCardProps {
  state: DailyHabitsState;
  onToggleHabit: (habitId: string) => void;
  onAddHabit: (title: string, emoji: string) => string | null;
  onRemoveHabit: (habitId: string) => void;
}

const HABIT_EMOJI_OPTIONS = ['✨', '🧘', '🥗', '🏃', '💧', '😴'] as const;

export function DailyHabitsCard({
  state,
  onToggleHabit,
  onAddHabit,
  onRemoveHabit,
}: DailyHabitsCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('✨');
  const [error, setError] = useState<string | null>(null);

  const completedCount = state.completedIds.length;
  const totalCount = state.habits.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validationError = onAddHabit(newTitle, selectedEmoji);
    if (validationError) {
      setError(validationError);
      return;
    }
    setNewTitle('');
    setSelectedEmoji('✨');
    setError(null);
    setIsAdding(false);
  };

  return (
    <section
      aria-label="Daily Habits"
      data-testid="daily-habits-section"
      className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] p-4 sm:p-5 space-y-3.5"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              allCompleted
                ? 'bg-[#DCFCE7] text-[#15803D] dark:bg-[#143D29] dark:text-[#6EE7B7]'
                : 'bg-[#F3EFFA] text-[#5B4BC4] dark:bg-[#262338] dark:text-[#C4BAFF]'
            }`}
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
              Daily Habits
            </h2>
            <p className="text-xs text-[#605D66] dark:text-[#AEA9B4]">
              Non-study wellness goals · resets daily
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            data-testid="daily-habits-count"
            className={`px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums transition-colors ${
              allCompleted
                ? 'bg-[#DCFCE7] text-[#15803D] dark:bg-[#143D29] dark:text-[#6EE7B7]'
                : 'bg-[#EFEBF5] text-[#5B4BC4] dark:bg-[#262338] dark:text-[#C4BAFF]'
            }`}
          >
            {completedCount}/{totalCount} done
          </span>

          <button
            type="button"
            onClick={() => {
              setIsAdding((prev) => !prev);
              setError(null);
            }}
            aria-expanded={isAdding}
            data-testid="toggle-add-habit-button"
            className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#F1EDF8] dark:bg-[#262336] text-[#5B4BC4] dark:text-[#C4BAFF] hover:bg-[#E5DFF3] dark:hover:bg-[#312D44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors cursor-pointer"
          >
            {isAdding ? (
              <>
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Close</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Optional compact inline add habit form */}
      <AnimatePresence initial={false}>
        {isAdding && (
          <motion.form
            onSubmit={handleSubmit}
            initial={prefersReducedMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
            data-testid="add-habit-form"
          >
            <div className="rounded-xl border border-[#E4DFF0] dark:border-[#2F2D3E] bg-[#FAF8FC] dark:bg-[#15141B] p-3 space-y-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                {HABIT_EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    aria-label={`Select ${emoji} icon`}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center border transition-colors cursor-pointer ${
                      selectedEmoji === emoji
                        ? 'bg-[#E5DFF8] border-[#5B4BC4] dark:bg-[#2F2A4D] dark:border-[#C4BAFF]'
                        : 'bg-white dark:bg-[#1D1B24] border-[#E4DFF0] dark:border-[#2F2D3E]'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="new-habit-input" className="sr-only">
                  New daily habit name
                </label>
                <input
                  id="new-habit-input"
                  type="text"
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. Read 10 pages, Walk outside..."
                  maxLength={48}
                  data-testid="new-habit-input"
                  className="flex-1 min-w-0 min-h-[40px] rounded-xl border border-[#DFD9EE] dark:border-[#343144] bg-white dark:bg-[#1B1A20] px-3 text-sm text-[#1C1B1F] dark:text-[#F4EFF4] placeholder:text-[#79747E] dark:placeholder:text-[#938F99] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]"
                />
                <button
                  type="submit"
                  data-testid="save-new-habit-button"
                  className="min-h-[40px] px-4 rounded-xl bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559] text-xs font-semibold hover:bg-[#4B3BB4] dark:hover:bg-[#D5CEFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors cursor-pointer shrink-0"
                >
                  Save
                </button>
              </div>

              {error && (
                <p
                  role="alert"
                  data-testid="add-habit-error"
                  className="text-xs font-medium text-[#DC2626] dark:text-[#FCA5A5]"
                >
                  {error}
                </p>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Habit Toggle Checkboxes Grid */}
      {state.habits.length === 0 ? (
        <p className="text-sm text-[#605D66] dark:text-[#AEA9B4] py-2">
          No daily habits yet. Tap Add to create one.
        </p>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
          data-testid="daily-habits-list"
        >
          {state.habits.map((habit) => {
            const isChecked = state.completedIds.includes(habit.id);
            return (
              <div
                key={habit.id}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
                  isChecked
                    ? 'bg-[#ECFDF5] border-[#86EFAC] dark:bg-[#112B20] dark:border-[#2E7D5B]'
                    : 'bg-[#FAF8FC] border-[#ECE7F3] dark:bg-[#15141B] dark:border-[#2B2936]'
                }`}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  onClick={() => onToggleHabit(habit.id)}
                  data-testid={`daily-habit-checkbox-${habit.id}`}
                  className="flex-1 min-w-0 min-h-[38px] flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] rounded-lg cursor-pointer"
                >
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-[#16A34A] border-[#16A34A] text-white dark:bg-[#34D399] dark:border-[#34D399] dark:text-[#052E16]'
                        : 'border-[#B9B2C8] dark:border-[#524E66] bg-white dark:bg-[#1B1A20]'
                    }`}
                  >
                    {isChecked && (
                      <Check className="w-3.5 h-3.5 stroke-[2.75]" aria-hidden="true" />
                    )}
                  </span>

                  <span className="text-base shrink-0" aria-hidden="true">
                    {habit.emoji}
                  </span>

                  <span
                    className={`text-sm font-medium truncate transition-colors ${
                      isChecked
                        ? 'line-through text-[#15803D] dark:text-[#6EE7B7]'
                        : 'text-[#1C1B1F] dark:text-[#F4EFF4]'
                    }`}
                  >
                    {habit.title}
                  </span>
                </button>

                {!habit.isDefault && (
                  <button
                    type="button"
                    onClick={() => onRemoveHabit(habit.id)}
                    aria-label={`Remove ${habit.title}`}
                    data-testid={`remove-habit-${habit.id}`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#79747E] hover:text-[#DC2626] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
