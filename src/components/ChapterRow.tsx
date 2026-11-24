import { Check } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Chapter, MilestoneKey, SubjectAccent } from '../types/syllabus';
import { countChapterMilestones, isChapterComplete, MILESTONE_ITEMS } from '../utils/syllabusMath';
import { SUBJECT_PALETTES } from '../utils/subjectTheme';

interface ChapterRowProps {
  chapter: Chapter;
  index: number;
  accent: SubjectAccent;
  contextLabel?: string;
  onToggleMilestone: (chapterId: string, milestoneKey: MilestoneKey) => void;
}

export function ChapterRow({
  chapter,
  index,
  accent,
  contextLabel,
  onToggleMilestone,
}: ChapterRowProps) {
  const prefersReducedMotion = useReducedMotion();
  const palette = SUBJECT_PALETTES[accent];
  const completed = isChapterComplete(chapter);
  const doneCount = countChapterMilestones(chapter);

  return (
    <motion.article
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        delay: prefersReducedMotion ? 0 : Math.min(index, 8) * 0.035,
        ease: [0.16, 1, 0.3, 1],
      }}
      data-testid={`chapter-row-${chapter.id}`}
      data-completed={completed ? 'true' : 'false'}
      className={`rounded-2xl border p-4 sm:p-5 transition-colors duration-250 ${
        completed
          ? 'bg-[#E5F6EC] border-[#B4E1C7] dark:bg-[#162920] dark:border-[#294D3B]'
          : 'bg-white border-[#E6E0EC] dark:bg-[#1B1A20] dark:border-[#2D2B36]'
      }`}
    >
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Chapter title & completion indicator */}
        <div className="flex items-start justify-between gap-3 min-w-0 sm:flex-1">
          <div className="min-w-0">
            {contextLabel && (
              <p
                className={`text-xs font-medium mb-0.5 truncate ${
                  completed
                    ? 'text-[#1D6342] dark:text-[#7ED9AC]'
                    : palette.accentText
                }`}
                data-testid={`chapter-context-${chapter.id}`}
              >
                {contextLabel}
              </p>
            )}
            <h3 className="font-display text-[15px] sm:text-base font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] leading-snug">
              {chapter.name}
            </h3>
            <p
              className={`text-xs mt-0.5 tabular-nums ${
                completed
                  ? 'text-[#1D6342] dark:text-[#7ED9AC] font-medium'
                  : 'text-[#605D66] dark:text-[#AEA9B4]'
              }`}
            >
              {completed ? 'Completed · 4/4 tasks' : `${doneCount} of 4 tasks`}
            </p>
          </div>

          {/* Subtle bounce green check icon when all 4 are checked */}
          <AnimatePresence>
            {completed && (
              <motion.div
                key="completed-badge"
                initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.35 }}
                animate={
                  prefersReducedMotion
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 1, scale: [0.35, 1.2, 0.96, 1] }
                }
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                className="w-7 h-7 rounded-full bg-[#247A52] dark:bg-[#5FD39B] text-white dark:text-[#0D261A] flex items-center justify-center shrink-0"
                aria-label={`${chapter.name} completed`}
                data-testid={`chapter-complete-icon-${chapter.id}`}
              >
                <Check className="w-4 h-4" strokeWidth={2.75} aria-hidden="true" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4 Circular Checkboxes: Lecture, Notes, Practice, Extra */}
        <div className="grid grid-cols-4 gap-2 shrink-0">
          {MILESTONE_ITEMS.map(({ key, label }) => {
            const isChecked = chapter.milestones[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isChecked}
                aria-label={`${chapter.name} ${label}`}
                data-testid={`milestone-${chapter.id}-${key}`}
                onClick={() => onToggleMilestone(chapter.id, key)}
                className="group/check w-full flex flex-col items-center justify-center gap-1.5 min-h-[48px] sm:min-w-[68px] px-1.5 py-1.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] dark:focus-visible:ring-[#B9ADFF] transition-colors cursor-pointer"
              >
                <motion.span
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : isChecked
                        ? { scale: [1, 1.22, 1] }
                        : { scale: 1 }
                  }
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.85 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-150 ${
                    isChecked
                      ? completed
                        ? 'bg-[#247A52] border-[#247A52] text-white dark:bg-[#5FD39B] dark:border-[#5FD39B] dark:text-[#0D261A]'
                        : palette.checkFill
                      : `bg-transparent ${palette.checkBorder} group-hover/check:border-[#1C1B1F]/50 dark:group-hover/check:border-white/50`
                  }`}
                >
                  <AnimatePresence initial={false}>
                    {isChecked && (
                      <motion.span
                        key="check-mark"
                        initial={prefersReducedMotion ? { scale: 1, opacity: 1 } : { scale: 0.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.3, opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        className="flex items-center justify-center"
                      >
                        <Check className="w-4 h-4" strokeWidth={2.75} aria-hidden="true" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.span>
                <span
                  className={`text-[11px] font-medium whitespace-nowrap transition-colors ${
                    isChecked
                      ? 'text-[#1C1B1F] dark:text-[#F4EFF4]'
                      : 'text-[#605D66] dark:text-[#AEA9B4]'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.article>
  );
}
