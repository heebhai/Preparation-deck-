import { useEffect, useState, type FormEvent } from 'react';
import { RotateCcw, Target, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { SubjectStudyGoal } from '../types/studyGoal';
import type { Subject } from '../types/syllabus';
import {
  createDefaultSubjectGoals,
  splitMinutesToHoursAndMinutes,
  validateSubjectGoalInput,
} from '../utils/studyGoalMath';
import { SUBJECT_PALETTES } from '../utils/subjectTheme';

interface GoalDraft {
  dailyHours: string;
  dailyMinutes: string;
  weeklyHours: string;
  weeklyMinutes: string;
}

interface StudyGoalsDialogProps {
  isOpen: boolean;
  subjects: ReadonlyArray<Subject>;
  goals: ReadonlyArray<SubjectStudyGoal>;
  focusedSubjectId?: string | null;
  onClose: () => void;
  onSave: (nextGoals: SubjectStudyGoal[]) => void;
}

function buildDraftMap(
  subjects: ReadonlyArray<Subject>,
  goals: ReadonlyArray<SubjectStudyGoal>,
): Record<string, GoalDraft> {
  const goalMap = new Map<string, SubjectStudyGoal>();
  for (const g of goals) {
    goalMap.set(g.subjectId, g);
  }

  const drafts: Record<string, GoalDraft> = {};
  for (const subject of subjects) {
    const goal = goalMap.get(subject.id);
    const d = splitMinutesToHoursAndMinutes(goal?.dailyMinutes ?? 0);
    const w = splitMinutesToHoursAndMinutes(goal?.weeklyMinutes ?? 0);
    drafts[subject.id] = {
      dailyHours: String(d.hours),
      dailyMinutes: String(d.minutes),
      weeklyHours: String(w.hours),
      weeklyMinutes: String(w.minutes),
    };
  }
  return drafts;
}

export function StudyGoalsDialog({
  isOpen,
  subjects,
  goals,
  focusedSubjectId,
  onClose,
  onSave,
}: StudyGoalsDialogProps) {
  const prefersReducedMotion = useReducedMotion();
  const [drafts, setDrafts] = useState<Record<string, GoalDraft>>(() =>
    buildDraftMap(subjects, goals),
  );
  const [activeSubjectId, setActiveSubjectId] = useState<string>(
    focusedSubjectId ?? subjects[0]?.id ?? 'science',
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDrafts(buildDraftMap(subjects, goals));
      setActiveSubjectId(focusedSubjectId || subjects[0]?.id || 'science');
      setError(null);
    }
  }, [isOpen, subjects, goals, focusedSubjectId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeSubject =
    subjects.find((s) => s.id === activeSubjectId) ?? subjects[0];
  const activeDraft = drafts[activeSubject?.id ?? ''] ?? {
    dailyHours: '0',
    dailyMinutes: '0',
    weeklyHours: '0',
    weeklyMinutes: '0',
  };

  const updateField = (
    subjectId: string,
    field: keyof GoalDraft,
    value: string,
  ) => {
    setError(null);
    setDrafts((prev) => ({
      ...prev,
      [subjectId]: {
        ...(prev[subjectId] ?? {
          dailyHours: '0',
          dailyMinutes: '0',
          weeklyHours: '0',
          weeklyMinutes: '0',
        }),
        [field]: value,
      },
    }));
  };

  const handleResetDefaults = () => {
    setError(null);
    const defaults = createDefaultSubjectGoals(subjects);
    setDrafts(buildDraftMap(subjects, defaults));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextGoals: SubjectStudyGoal[] = [];

    for (const subject of subjects) {
      const draft = drafts[subject.id] ?? {
        dailyHours: '0',
        dailyMinutes: '0',
        weeklyHours: '0',
        weeklyMinutes: '0',
      };
      const result = validateSubjectGoalInput(draft);
      if (result.valid === false) {
        setActiveSubjectId(subject.id);
        setError(`${subject.name}: ${result.error}`);
        return;
      }
      nextGoals.push({
        subjectId: subject.id,
        dailyMinutes: result.dailyTotalMinutes,
        weeklyMinutes: result.weeklyTotalMinutes,
      });
    }

    onSave(nextGoals);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="study-goals-dialog-title"
            data-testid="study-goals-dialog"
            initial={
              prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 48 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 36 }
            }
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#FAF8FC] dark:bg-[#1B1A22] border border-[#E4DFF0] dark:border-[#2E2C3A] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3 border-b border-[#ECE7F4] dark:border-[#2B2936]">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#EFEBF5] dark:bg-[#282536] text-[#5B4BC4] dark:text-[#C4BAFF] flex items-center justify-center">
                  <Target className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="study-goals-dialog-title"
                    className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]"
                  >
                    Study Hour Goals
                  </h2>
                  <p className="text-xs text-[#605D66] dark:text-[#AEA9B4]">
                    Define daily &amp; weekly targets per subject
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close Study Hour Goals dialog"
                className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-[#605D66] dark:text-[#AEA9B4] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
              noValidate
            >
              {/* Subject Selector Chips */}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0]">
                  Subject
                </span>
                <div
                  className="flex flex-wrap gap-1.5"
                  role="tablist"
                  aria-label="Select subject to configure goal"
                >
                  {subjects.map((subject) => {
                    const isActive = subject.id === activeSubject?.id;
                    const palette = SUBJECT_PALETTES[subject.accent];
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => {
                          setActiveSubjectId(subject.id);
                          setError(null);
                        }}
                        data-testid={`goal-dialog-subject-${subject.id}`}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                          isActive
                            ? `${palette.tabActiveBg} ${palette.tabActiveText} ring-1 ring-current/25`
                            : 'bg-[#EFEBF5] text-[#49454F] dark:bg-[#262433] dark:text-[#CAC4D0] hover:bg-[#E4DFF0] dark:hover:bg-[#312E42]'
                        }`}
                      >
                        {subject.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeSubject && (
                <div className="rounded-2xl border border-[#E4DFF0] dark:border-[#2E2C3A] bg-white dark:bg-[#14131A] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-[#1C1B1F] dark:text-[#F4EFF4]">
                      {activeSubject.name} Targets
                    </h3>
                    <span className="text-[11px] text-[#605D66] dark:text-[#AEA9B4]">
                      Set 0h 0m to clear a goal
                    </span>
                  </div>

                  {/* Daily Goal */}
                  <div className="space-y-1.5">
                    <span className="block text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0]">
                      Daily Goal
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label
                          htmlFor="goal-daily-hours"
                          className="block text-[11px] text-[#605D66] dark:text-[#AEA9B4] mb-1"
                        >
                          Hours (0–24)
                        </label>
                        <input
                          id="goal-daily-hours"
                          type="number"
                          min={0}
                          max={24}
                          step={1}
                          inputMode="numeric"
                          value={activeDraft.dailyHours}
                          onChange={(e) =>
                            updateField(activeSubject.id, 'dailyHours', e.target.value)
                          }
                          data-testid="goal-daily-hours-input"
                          className="w-full min-h-[44px] rounded-xl border border-[#D8D2E5] dark:border-[#343242] bg-[#FAF8FC] dark:bg-[#1B1A22] px-3.5 py-2 text-sm font-medium tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] focus:border-[#5B4BC4] dark:focus:border-[#B9ADFF] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]/20"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="goal-daily-minutes"
                          className="block text-[11px] text-[#605D66] dark:text-[#AEA9B4] mb-1"
                        >
                          Minutes (0–59)
                        </label>
                        <input
                          id="goal-daily-minutes"
                          type="number"
                          min={0}
                          max={59}
                          step={1}
                          inputMode="numeric"
                          value={activeDraft.dailyMinutes}
                          onChange={(e) =>
                            updateField(activeSubject.id, 'dailyMinutes', e.target.value)
                          }
                          data-testid="goal-daily-minutes-input"
                          className="w-full min-h-[44px] rounded-xl border border-[#D8D2E5] dark:border-[#343242] bg-[#FAF8FC] dark:bg-[#1B1A22] px-3.5 py-2 text-sm font-medium tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] focus:border-[#5B4BC4] dark:focus:border-[#B9ADFF] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Weekly Goal */}
                  <div className="space-y-1.5">
                    <span className="block text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0]">
                      Weekly Goal
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label
                          htmlFor="goal-weekly-hours"
                          className="block text-[11px] text-[#605D66] dark:text-[#AEA9B4] mb-1"
                        >
                          Hours (0–168)
                        </label>
                        <input
                          id="goal-weekly-hours"
                          type="number"
                          min={0}
                          max={168}
                          step={1}
                          inputMode="numeric"
                          value={activeDraft.weeklyHours}
                          onChange={(e) =>
                            updateField(activeSubject.id, 'weeklyHours', e.target.value)
                          }
                          data-testid="goal-weekly-hours-input"
                          className="w-full min-h-[44px] rounded-xl border border-[#D8D2E5] dark:border-[#343242] bg-[#FAF8FC] dark:bg-[#1B1A22] px-3.5 py-2 text-sm font-medium tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] focus:border-[#5B4BC4] dark:focus:border-[#B9ADFF] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]/20"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="goal-weekly-minutes"
                          className="block text-[11px] text-[#605D66] dark:text-[#AEA9B4] mb-1"
                        >
                          Minutes (0–59)
                        </label>
                        <input
                          id="goal-weekly-minutes"
                          type="number"
                          min={0}
                          max={59}
                          step={1}
                          inputMode="numeric"
                          value={activeDraft.weeklyMinutes}
                          onChange={(e) =>
                            updateField(activeSubject.id, 'weeklyMinutes', e.target.value)
                          }
                          data-testid="goal-weekly-minutes-input"
                          className="w-full min-h-[44px] rounded-xl border border-[#D8D2E5] dark:border-[#343242] bg-[#FAF8FC] dark:bg-[#1B1A22] px-3.5 py-2 text-sm font-medium tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] focus:border-[#5B4BC4] dark:focus:border-[#B9ADFF] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p
                  role="alert"
                  data-testid="goal-form-error"
                  className="text-xs font-medium text-[#B3261E] dark:text-[#F2B8B5] px-1"
                >
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  data-testid="reset-goals-button"
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5B4BC4] dark:text-[#C4BAFF] hover:bg-[#EFEBF5] dark:hover:bg-[#282536] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reset defaults</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    data-testid="save-goals-button"
                    className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold bg-[#5B4BC4] text-white hover:bg-[#4D3EB3] dark:bg-[#C4BAFF] dark:text-[#1F1559] dark:hover:bg-[#D5CEFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
                  >
                    Save Goals
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
