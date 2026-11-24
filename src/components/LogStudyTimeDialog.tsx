import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { StudyLogChapterItem } from '../types/studyLog';
import type { MilestoneKey, Subject } from '../types/syllabus';
import { getLocalDateKey, validateStudyEntryInput } from '../utils/studyLogMath';
import { MILESTONE_ITEMS } from '../utils/syllabusMath';

interface LogStudyTimeDialogProps {
  isOpen: boolean;
  subjects: ReadonlyArray<Subject>;
  onClose: () => void;
  onSave: (entry: {
    subjectId: string;
    subjectName: string;
    date: string;
    durationMinutes: number;
    items: StudyLogChapterItem[];
  }) => void;
}

export function LogStudyTimeDialog({
  isOpen,
  subjects,
  onClose,
  onSave,
}: LogStudyTimeDialogProps) {
  const prefersReducedMotion = useReducedMotion();
  const todayKey = getLocalDateKey();

  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? 'science');
  const [activeSubSubjectId, setActiveSubSubjectId] = useState<string>('all');
  const [selectedChapterTasks, setSelectedChapterTasks] = useState<
    Record<string, MilestoneKey[]>
  >({});
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('30');
  const [date, setDate] = useState(todayKey);
  const [error, setError] = useState<string | null>(null);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === subjectId) ?? subjects[0],
    [subjects, subjectId],
  );

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      const initialSubject = subjects[0];
      setSubjectId(initialSubject?.id ?? 'science');
      setActiveSubSubjectId('all');
      setSelectedChapterTasks({});
      setHours('1');
      setMinutes('30');
      setDate(getLocalDateKey());
      setError(null);
    }
  }, [isOpen, subjects]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const visibleChapters = useMemo(() => {
    if (!selectedSubject) {
      return [];
    }
    return selectedSubject.subSubjects.flatMap((sub) => {
      if (activeSubSubjectId !== 'all' && sub.id !== activeSubSubjectId) {
        return [];
      }
      return sub.chapters.map((chapter) => ({
        subSubjectId: sub.id,
        subSubjectName: sub.name,
        chapter,
      }));
    });
  }, [selectedSubject, activeSubSubjectId]);

  const selectedEntries = useMemo(() => {
    if (!selectedSubject) {
      return [];
    }
    const items: StudyLogChapterItem[] = [];
    for (const sub of selectedSubject.subSubjects) {
      for (const ch of sub.chapters) {
        const tasks = selectedChapterTasks[ch.id];
        if (tasks) {
          items.push({
            subSubjectId: sub.id,
            subSubjectName: sub.name,
            chapterId: ch.id,
            chapterName: ch.name,
            tasks,
          });
        }
      }
    }
    return items;
  }, [selectedSubject, selectedChapterTasks]);

  const toggleChapterSelection = (chapterId: string) => {
    setError(null);
    setSelectedChapterTasks((prev) => {
      if (chapterId in prev) {
        const next = { ...prev };
        delete next[chapterId];
        return next;
      }
      return {
        ...prev,
        [chapterId]: [],
      };
    });
  };

  const toggleChapterTask = (chapterId: string, taskKey: MilestoneKey) => {
    setError(null);
    setSelectedChapterTasks((prev) => {
      const current = prev[chapterId] ?? [];
      const exists = current.includes(taskKey);
      const updated = exists
        ? current.filter((t) => t !== taskKey)
        : [...current, taskKey];
      return {
        ...prev,
        [chapterId]: updated,
      };
    });
  };

  const handleSubjectChange = (nextSubjectId: string) => {
    setSubjectId(nextSubjectId);
    setActiveSubSubjectId('all');
    setSelectedChapterTasks({});
    setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validation = validateStudyEntryInput({
      subjectId,
      hours,
      minutes,
      date,
      maxDate: getLocalDateKey(),
      selectedChapters: selectedEntries.map((item) => ({
        chapterId: item.chapterId,
        tasks: item.tasks,
      })),
      requireChapters: true,
    });

    if (validation.valid === false) {
      setError(validation.error);
      return;
    }

    onSave({
      subjectId,
      subjectName: selectedSubject?.name ?? subjectId,
      date,
      durationMinutes: validation.totalMinutes,
      items: selectedEntries,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          {/* Material 3 Slide-Up Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-study-time-title"
            data-testid="log-study-dialog"
            initial={
              prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 56 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 40 }
            }
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#FAF8FC] dark:bg-[#1B1A22] border border-[#E4DFF0] dark:border-[#2E2C3A] shadow-2xl overflow-hidden"
          >
            {/* Sticky Header */}
            <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3 border-b border-[#ECE7F4] dark:border-[#2B2936]">
              <div>
                <h2
                  id="log-study-time-title"
                  className="font-display text-xl font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]"
                >
                  Log Study Time
                </h2>
                <p className="text-xs text-[#605D66] dark:text-[#AEA9B4] mt-0.5">
                  Select subject, chapters &amp; tasks completed
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Log Study Time dialog"
                className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-[#605D66] dark:text-[#AEA9B4] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] dark:focus-visible:ring-[#B9ADFF] cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
              noValidate
            >
              {/* 1. Subject Dropdown */}
              <div className="space-y-1.5">
                <label
                  htmlFor="study-subject-select"
                  className="block text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0]"
                >
                  Subject
                </label>
                <div className="relative">
                  <select
                    id="study-subject-select"
                    value={subjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    data-testid="study-subject-select"
                    className="w-full appearance-none min-h-[46px] rounded-2xl border border-[#D8D2E5] dark:border-[#343242] bg-white dark:bg-[#14131A] px-4 pr-10 py-2.5 text-sm font-medium text-[#1C1B1F] dark:text-[#F4EFF4] focus:border-[#5B4BC4] dark:focus:border-[#B9ADFF] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]/20"
                  >
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="w-4 h-4 text-[#605D66] dark:text-[#AEA9B4] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* 2. Sub-subject Filter Chips */}
              {selectedSubject && selectedSubject.subSubjects.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0]">
                      Sub-subject &amp; Chapters
                    </span>
                    <span
                      className="text-xs font-medium text-[#5B4BC4] dark:text-[#C4BAFF] tabular-nums"
                      data-testid="selected-chapters-count"
                    >
                      {selectedEntries.length}{' '}
                      {selectedEntries.length === 1 ? 'chapter' : 'chapters'} selected
                    </span>
                  </div>

                  {selectedSubject.subSubjects.length > 1 && (
                    <div
                      className="flex flex-wrap gap-1.5"
                      role="tablist"
                      aria-label="Filter chapters by sub-subject"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeSubSubjectId === 'all'}
                        onClick={() => setActiveSubSubjectId('all')}
                        data-testid="dialog-subsubject-all"
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                          activeSubSubjectId === 'all'
                            ? 'bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559]'
                            : 'bg-[#EFEBF5] text-[#49454F] dark:bg-[#262433] dark:text-[#CAC4D0] hover:bg-[#E4DFF0] dark:hover:bg-[#312E42]'
                        }`}
                      >
                        All
                      </button>
                      {selectedSubject.subSubjects.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          role="tab"
                          aria-selected={activeSubSubjectId === sub.id}
                          onClick={() => setActiveSubSubjectId(sub.id)}
                          data-testid={`dialog-subsubject-${sub.id}`}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                            activeSubSubjectId === sub.id
                              ? 'bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559]'
                              : 'bg-[#EFEBF5] text-[#49454F] dark:bg-[#262433] dark:text-[#CAC4D0] hover:bg-[#E4DFF0] dark:hover:bg-[#312E42]'
                          }`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Scrollable Compact Multi-Select Chapter List */}
                  <div
                    className="max-h-52 overflow-y-auto rounded-2xl border border-[#DFD9EC] dark:border-[#302E3D] bg-white dark:bg-[#14131A] divide-y divide-[#F0ECF7] dark:divide-[#24222E]"
                    data-testid="dialog-chapter-list"
                  >
                    {visibleChapters.map(({ subSubjectName, chapter }) => {
                      const isSelected = chapter.id in selectedChapterTasks;
                      const chosenTasks = selectedChapterTasks[chapter.id] ?? [];

                      return (
                        <div key={chapter.id} className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => toggleChapterSelection(chapter.id)}
                            aria-pressed={isSelected}
                            data-testid={`dialog-chapter-toggle-${chapter.id}`}
                            className="w-full flex items-center gap-2.5 text-left min-h-[36px] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
                          >
                            <span
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-[#5B4BC4] border-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:border-[#C4BAFF] dark:text-[#1F1559]'
                                  : 'border-[#B9B2C8] dark:border-[#49465A] bg-transparent'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.75]" />}
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-[13px] font-medium text-[#1C1B1F] dark:text-[#F4EFF4] leading-snug truncate">
                                {chapter.name}
                              </p>
                              {activeSubSubjectId === 'all' &&
                                selectedSubject.subSubjects.length > 1 && (
                                  <p className="text-[11px] text-[#605D66] dark:text-[#AEA9B4]">
                                    {subSubjectName}
                                  </p>
                                )}
                            </div>
                          </button>

                          {/* Expand/Collapse 4 Task Checkboxes */}
                          <AnimatePresence initial={false}>
                            {isSelected && (
                              <motion.div
                                initial={
                                  prefersReducedMotion
                                    ? { opacity: 1 }
                                    : { height: 0, opacity: 0 }
                                }
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={
                                  prefersReducedMotion
                                    ? { opacity: 0 }
                                    : { height: 0, opacity: 0 }
                                }
                                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                              >
                                <div
                                  className="pl-7 pt-2 pb-1 flex flex-wrap gap-1.5"
                                  data-testid={`dialog-tasks-${chapter.id}`}
                                >
                                  {MILESTONE_ITEMS.map(({ key, label }) => {
                                    const active = chosenTasks.includes(key);
                                    return (
                                      <button
                                        key={key}
                                        type="button"
                                        onClick={() => toggleChapterTask(chapter.id, key)}
                                        aria-pressed={active}
                                        data-testid={`dialog-task-${chapter.id}-${key}`}
                                        className={`inline-flex items-center gap-1 min-h-[32px] px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                                          active
                                            ? 'bg-[#DCFCE7] border-[#4ADE80] text-[#15803D] dark:bg-[#143D29] dark:border-[#34D399] dark:text-[#6EE7B7]'
                                            : 'bg-[#FAF8FC] border-[#DDD7E8] text-[#49454F] dark:bg-[#1E1C26] dark:border-[#333142] dark:text-[#CAC4D0] hover:border-[#5B4BC4]'
                                        }`}
                                      >
                                        <span
                                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                                            active
                                              ? 'bg-[#16A34A] border-[#16A34A] text-white dark:bg-[#34D399] dark:border-[#34D399] dark:text-[#052E16]'
                                              : 'border-[#9B95A8] dark:border-[#5E5A70]'
                                          }`}
                                        >
                                          {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                        </span>
                                        <span>{label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Total Time Spent (Hours & Minutes) & Date Picker */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="study-hours-input"
                    className="block text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0]"
                  >
                    Hours
                  </label>
                  <input
                    id="study-hours-input"
                    type="number"
                    min={0}
                    max={24}
                    step={1}
                    inputMode="numeric"
                    value={hours}
                    onChange={(e) => {
                      setHours(e.target.value);
                      setError(null);
                    }}
                    data-testid="study-hours-input"
                    className="w-full min-h-[46px] rounded-2xl border border-[#D8D2E5] dark:border-[#343242] bg-white dark:bg-[#14131A] px-3.5 py-2 text-sm font-medium tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] focus:border-[#5B4BC4] dark:focus:border-[#B9ADFF] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="study-minutes-input"
                    className="block text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0]"
                  >
                    Minutes
                  </label>
                  <input
                    id="study-minutes-input"
                    type="number"
                    min={0}
                    max={59}
                    step={1}
                    inputMode="numeric"
                    value={minutes}
                    onChange={(e) => {
                      setMinutes(e.target.value);
                      setError(null);
                    }}
                    data-testid="study-minutes-input"
                    className="w-full min-h-[46px] rounded-2xl border border-[#D8D2E5] dark:border-[#343242] bg-white dark:bg-[#14131A] px-3.5 py-2 text-sm font-medium tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] focus:border-[#5B4BC4] dark:focus:border-[#B9ADFF] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]/20"
                  />
                </div>

                <div className="space-y-1.5 col-span-3 sm:col-span-1">
                  <label
                    htmlFor="study-date-input"
                    className="block text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0]"
                  >
                    Date
                  </label>
                  <input
                    id="study-date-input"
                    type="date"
                    value={date}
                    max={todayKey}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setError(null);
                    }}
                    data-testid="study-date-input"
                    className="w-full min-h-[46px] rounded-2xl border border-[#D8D2E5] dark:border-[#343242] bg-white dark:bg-[#14131A] px-3 py-2 text-sm font-medium tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] focus:border-[#5B4BC4] dark:focus:border-[#B9ADFF] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]/20"
                  />
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  data-testid="study-form-error"
                  className="text-xs font-medium text-[#B3261E] dark:text-[#F2B8B5] px-1"
                >
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-medium text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-study-log-button"
                  className="min-h-[44px] px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#5B4BC4] text-white hover:bg-[#4D3EB3] dark:bg-[#C4BAFF] dark:text-[#1F1559] dark:hover:bg-[#D5CEFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] focus-visible:ring-offset-2 transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
