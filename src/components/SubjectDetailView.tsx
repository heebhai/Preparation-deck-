import { useState } from 'react';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { MilestoneKey, Subject } from '../types/syllabus';
import { getSubjectStats, getSubSubjectStats } from '../utils/syllabusMath';
import { SUBJECT_PALETTES } from '../utils/subjectTheme';
import { ChapterRow } from './ChapterRow';

interface SubjectDetailViewProps {
  subject: Subject;
  isDark: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
  onToggleMilestone: (
    subjectId: string,
    subSubjectId: string,
    chapterId: string,
    milestoneKey: MilestoneKey,
  ) => void;
}

export function SubjectDetailView({
  subject,
  isDark,
  onToggleTheme,
  onBack,
  onToggleMilestone,
}: SubjectDetailViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeSubId, setActiveSubId] = useState(subject.subSubjects[0]?.id ?? '');
  const activeSub =
    subject.subSubjects.find((s) => s.id === activeSubId) ?? subject.subSubjects[0];

  const palette = SUBJECT_PALETTES[subject.accent];
  const subjectStats = getSubjectStats(subject);
  const subStats = activeSub ? getSubSubjectStats(activeSub) : null;

  return (
    <motion.div
      key={`detail-${subject.id}`}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 32 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen flex flex-col"
    >
      {/* Compact Sticky Material 3 Top App Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#FAF8FC]/88 dark:bg-[#121318]/88 border-b border-[#E6E0EC]/80 dark:border-[#26252E]/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to subjects"
              data-testid="back-button"
              className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center text-[#1C1B1F] dark:text-[#F4EFF4] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] dark:focus-visible:ring-[#B9ADFF] transition-colors shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] truncate">
                {subject.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`text-xs sm:text-sm font-semibold tabular-nums ${palette.accentText}`}
              data-testid="detail-subject-progress"
            >
              {subjectStats.completedChapters}/{subjectStats.totalChapters} chapters
            </span>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="w-11 h-11 rounded-full flex items-center justify-center text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] dark:focus-visible:ring-[#B9ADFF] transition-colors cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Moon className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 pb-12 space-y-6">
        {/* Subject overview progress banner */}
        <div
          className={`rounded-2xl border p-5 ${palette.cardSurface}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-medium text-[#605D66] dark:text-[#AEA9B4]">
                {activeSub ? `${activeSub.name} · ${subStats?.completedChapters}/${subStats?.totalChapters} chapters done` : 'Subject overview'}
              </p>
              <p className="font-display text-xl font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] mt-0.5 tabular-nums">
                {subjectStats.chapterPercent}% completed
              </p>
            </div>
            <span className="text-xs font-medium tabular-nums text-[#49454F] dark:text-[#CAC4D0]">
              {subjectStats.completedMilestones} of {subjectStats.totalMilestones} tasks checked
            </span>
          </div>

          <div className={`h-2 w-full rounded-full overflow-hidden ${palette.trackBg}`}>
            <motion.div
              className={`h-full w-full rounded-full origin-left ${palette.progressFill}`}
              animate={{
                scaleX:
                  subjectStats.totalChapters === 0
                    ? 0
                    : subjectStats.completedChapters / subjectStats.totalChapters,
              }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* Sub-subject tabs / chips with animated selection indicator */}
        <div
          role="tablist"
          aria-label={`${subject.name} sub-subjects`}
          className="inline-flex max-w-full items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-2xl bg-[#EFEBF5] dark:bg-[#1B1A22] border border-[#E4DFF0] dark:border-[#2B2936]"
        >
          {subject.subSubjects.map((sub) => {
            const isSelected = sub.id === activeSub?.id;
            const stats = getSubSubjectStats(sub);
            return (
              <button
                key={sub.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                data-testid={`subsubject-tab-${sub.id}`}
                onClick={() => setActiveSubId(sub.id)}
                className={`relative min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] dark:focus-visible:ring-[#B9ADFF] cursor-pointer ${
                  isSelected
                    ? palette.tabActiveText
                    : 'text-[#49454F] dark:text-[#AEA9B4] hover:text-[#1C1B1F] dark:hover:text-[#F4EFF4]'
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="activeSubSubjectIndicator"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className={`absolute inset-0 rounded-xl z-0 shadow-xs ${palette.tabActiveBg}`}
                  />
                )}
                <span className="relative z-10 inline-flex items-center">
                  <span>{sub.name}</span>
                  <span className="ml-2 text-xs opacity-75 tabular-nums">
                    {stats.completedChapters}/{stats.totalChapters}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Chapter list with staggered fade-slide */}
        {activeSub && (
          <section
            key={activeSub.id}
            role="tabpanel"
            aria-label={`${activeSub.name} chapters`}
            className="space-y-3"
          >
            {activeSub.chapters.map((chapter, index) => (
              <ChapterRow
                key={chapter.id}
                chapter={chapter}
                index={index}
                accent={subject.accent}
                onToggleMilestone={(chapterId, milestoneKey) =>
                  onToggleMilestone(subject.id, activeSub.id, chapterId, milestoneKey)
                }
              />
            ))}
          </section>
        )}
      </main>
    </motion.div>
  );
}
