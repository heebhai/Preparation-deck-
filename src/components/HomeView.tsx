import { useState } from 'react';
import { Moon, Plus, Search, Settings, SlidersHorizontal, Sun, Target, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { DailyHabitsState } from '../types/dailyHabit';
import type { ExamCountdownSummary } from '../types/examCountdown';
import type { GoalPeriod, SubjectStudyGoal } from '../types/studyGoal';
import type { StudyLogEntry } from '../types/studyLog';
import type { MilestoneKey, Subject } from '../types/syllabus';
import {
  calculateOverallGoalsSummary,
  calculateSubjectGoalProgressList,
} from '../utils/studyGoalMath';
import { calculateStudyStats, formatDuration, formatStatDuration } from '../utils/studyLogMath';
import { getOverallStats, searchChaptersAcrossSubjects } from '../utils/syllabusMath';
import { BoardExamCountdownHeader } from './BoardExamCountdownHeader';
import { ChapterRow } from './ChapterRow';
import { DailyHabitsCard } from './DailyHabitsCard';
import { ProgressRing } from './ProgressRing';
import { PWAInstallButton } from './PWAInstallButton';
import { SubjectCard } from './SubjectCard';
import { SubjectGoalCard } from './SubjectGoalCard';

type HomeSlideTab = 'overview' | 'goals';

interface HomeViewProps {
  subjects: Subject[];
  studyLogs: ReadonlyArray<StudyLogEntry>;
  subjectGoals: ReadonlyArray<SubjectStudyGoal>;
  dailyHabits: DailyHabitsState;
  examCountdown: ExamCountdownSummary;
  currentStreakDays: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onSelectSubject: (subjectId: string) => void;
  onToggleMilestone: (
    subjectId: string,
    subSubjectId: string,
    chapterId: string,
    milestoneKey: MilestoneKey,
  ) => void;
  onToggleDailyHabit: (habitId: string) => void;
  onAddDailyHabit: (title: string, emoji: string) => string | null;
  onRemoveDailyHabit: (habitId: string) => void;
  onOpenLogDialog: () => void;
  onOpenGoalsDialog: (focusedSubjectId?: string | null) => void;
}

export function HomeView({
  subjects,
  studyLogs,
  subjectGoals,
  dailyHabits,
  examCountdown,
  currentStreakDays,
  searchQuery,
  onSearchChange,
  isDark,
  onToggleTheme,
  onOpenSettings,
  onSelectSubject,
  onToggleMilestone,
  onToggleDailyHabit,
  onAddDailyHabit,
  onRemoveDailyHabit,
  onOpenLogDialog,
  onOpenGoalsDialog,
}: HomeViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [homeTab, setHomeTab] = useState<HomeSlideTab>('overview');
  const [goalPeriod, setGoalPeriod] = useState<GoalPeriod>('daily');

  const overall = getOverallStats(subjects);
  const studyStats = calculateStudyStats(studyLogs);
  const goalProgressItems = calculateSubjectGoalProgressList({
    subjects,
    logs: studyLogs,
    goals: subjectGoals,
    period: goalPeriod,
  });
  const goalsSummary = calculateOverallGoalsSummary(goalProgressItems);

  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;
  const chapterResults = isSearching
    ? searchChaptersAcrossSubjects(subjects, trimmedQuery)
    : [];

  const summaryItems = [
    {
      id: 'today',
      label: 'Today',
      value: formatStatDuration(studyStats.todayMinutes),
      testId: 'stat-today',
    },
    {
      id: 'week',
      label: 'This Week',
      value: formatStatDuration(studyStats.weekMinutes),
      testId: 'stat-week',
    },
    {
      id: 'month',
      label: 'This Month',
      value: formatStatDuration(studyStats.monthMinutes),
      testId: 'stat-month',
    },
  ] as const;

  return (
    <motion.div
      key="home-view"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen flex flex-col"
    >
      {/* Compact Sticky Material 3 Top Bar */}
      <header className="sticky top-0 z-30 pt-safe backdrop-blur-md bg-[#FAF8FC]/88 dark:bg-[#121318]/88 border-b border-[#E6E0EC]/80 dark:border-[#26252E]/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] whitespace-nowrap truncate">
            Syllabus Tracker
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            <div
              data-testid="home-streak-counter"
              aria-label={`Study streak: ${currentStreakDays} ${currentStreakDays === 1 ? 'day' : 'days'}`}
              title="Daily streak: study 60m+ or check 2+ chapter boxes"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold tabular-nums border transition-colors ${
                currentStreakDays > 0
                  ? 'bg-[#FFF7ED] border-[#FDBA74] text-[#C2410C] dark:bg-[#3A1E0C] dark:border-[#9A3412] dark:text-[#FDBA74]'
                  : 'bg-[#F1EDF8] border-[#E4DFF0] text-[#605D66] dark:bg-[#1F1E28] dark:border-[#2E2C3A] dark:text-[#AEA9B4]'
              }`}
            >
              <span aria-hidden="true">🔥</span>
              <span data-testid="home-streak-value">{currentStreakDays}</span>
            </div>

            <PWAInstallButton />

            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Open settings"
              data-testid="open-settings-button"
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] dark:focus-visible:ring-[#B9ADFF] transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              data-testid="theme-toggle"
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] dark:focus-visible:ring-[#B9ADFF] transition-colors cursor-pointer"
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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 pb-28 space-y-5">
        {/* Board Exam Countdown Header */}
        <BoardExamCountdownHeader
          summary={examCountdown}
          onOpenSettings={onOpenSettings}
        />

        {/* Material 3 Search Bar directly under Board Exam Countdown */}
        <div role="search" aria-label="Search chapters" className="w-full">
          <label htmlFor="chapter-search-input" className="sr-only">
            Search chapters across all subjects
          </label>
          <div className="relative flex items-center rounded-2xl border border-[#E4DFF0] dark:border-[#2C2A38] bg-[#F1EDF8] dark:bg-[#1C1B24] focus-within:border-[#5B4BC4] dark:focus-within:border-[#B9ADFF] focus-within:ring-2 focus-within:ring-[#5B4BC4]/20 dark:focus-within:ring-[#B9ADFF]/20 transition-all">
            <Search
              className="w-5 h-5 ml-4 text-[#605D66] dark:text-[#AEA9B4] shrink-0 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="chapter-search-input"
              type="text"
              role="searchbox"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search chapters across all subjects..."
              data-testid="chapter-search-input"
              className="w-full min-h-[48px] bg-transparent px-3.5 py-2.5 text-sm sm:text-[15px] text-[#1C1B1F] dark:text-[#F4EFF4] placeholder:text-[#79747E] dark:placeholder:text-[#938F99] focus:outline-none"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search query"
                data-testid="clear-search-button"
                className="w-11 h-11 mr-1 rounded-full flex items-center justify-center text-[#605D66] dark:text-[#AEA9B4] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] dark:focus-visible:ring-[#B9ADFF] transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {isSearching ? (
            <motion.section
              key="search-results-section"
              aria-label="Chapter search results"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3.5"
            >
              <div className="flex items-baseline justify-between px-0.5">
                <h2 className="font-display text-base font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
                  Search Results
                </h2>
                <span
                  className="text-xs text-[#605D66] dark:text-[#AEA9B4] tabular-nums"
                  data-testid="search-results-count"
                >
                  {chapterResults.length}{' '}
                  {chapterResults.length === 1 ? 'chapter' : 'chapters'}
                </span>
              </div>

              {chapterResults.length > 0 ? (
                <div className="space-y-3" data-testid="chapter-search-results">
                  {chapterResults.map((result, index) => (
                    <ChapterRow
                      key={`${result.subjectId}-${result.subSubjectId}-${result.chapter.id}`}
                      chapter={result.chapter}
                      index={index}
                      accent={result.subjectAccent}
                      contextLabel={`${result.subjectName} · ${result.subSubjectName}`}
                      onToggleMilestone={(chapterId, milestoneKey) =>
                        onToggleMilestone(
                          result.subjectId,
                          result.subSubjectId,
                          chapterId,
                          milestoneKey,
                        )
                      }
                    />
                  ))}
                </div>
              ) : (
                <div
                  data-testid="search-empty-state"
                  className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] px-6 py-10 text-center space-y-3"
                >
                  <p className="font-display text-base font-semibold text-[#1C1B1F] dark:text-[#F4EFF4]">
                    No chapters found for &ldquo;{trimmedQuery}&rdquo;
                  </p>
                  <p className="text-sm text-[#605D66] dark:text-[#AEA9B4]">
                    Try searching for a chapter like &ldquo;Light&rdquo;, &ldquo;Polynomials&rdquo;, or a subject like &ldquo;Biology&rdquo;.
                  </p>
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="inline-flex items-center justify-center min-h-[44px] px-5 py-2 rounded-xl bg-[#EFEBF5] dark:bg-[#2A2836] text-sm font-medium text-[#5B4BC4] dark:text-[#C4BAFF] hover:bg-[#E4DFF0] dark:hover:bg-[#353245] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] dark:focus-visible:ring-[#B9ADFF] transition-colors cursor-pointer"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </motion.section>
          ) : (
            <div className="space-y-5">
              {/* Overview / Study Goals Segmented Slide Switcher */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div
                  role="tablist"
                  aria-label="Home view sections"
                  className="inline-flex p-1 rounded-2xl bg-[#EFEBF5] dark:bg-[#1E1C28] border border-[#E4DFF0] dark:border-[#2D2B3A]"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={homeTab === 'overview'}
                    onClick={() => setHomeTab('overview')}
                    data-testid="home-tab-overview"
                    className={`relative px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                      homeTab === 'overview'
                        ? 'text-white dark:text-[#1F1559]'
                        : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-[#F4EFF4]'
                    }`}
                  >
                    {homeTab === 'overview' && (
                      <motion.span
                        layoutId="home-slide-tab-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-[#5B4BC4] dark:bg-[#C4BAFF] z-0"
                      />
                    )}
                    <span className="relative z-10">Overview</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={homeTab === 'goals'}
                    onClick={() => setHomeTab('goals')}
                    data-testid="home-tab-goals"
                    className={`relative inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                      homeTab === 'goals'
                        ? 'text-white dark:text-[#1F1559]'
                        : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-[#F4EFF4]'
                    }`}
                  >
                    {homeTab === 'goals' && (
                      <motion.span
                        layoutId="home-slide-tab-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-[#5B4BC4] dark:bg-[#C4BAFF] z-0"
                      />
                    )}
                    <Target className="w-3.5 h-3.5 relative z-10" aria-hidden="true" />
                    <span className="relative z-10">Study Goals</span>
                  </button>
                </div>

                {homeTab === 'goals' && (
                  <button
                    type="button"
                    onClick={() => onOpenGoalsDialog(null)}
                    data-testid="edit-all-goals-button"
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#EFEBF5] dark:bg-[#262434] text-[#5B4BC4] dark:text-[#C4BAFF] hover:bg-[#E4DFF0] dark:hover:bg-[#312E42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Edit Goals</span>
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {homeTab === 'overview' ? (
                  <motion.div
                    key="home-overview-section"
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-5"
                  >
                    {/* Top Hero Progress Summary Card */}
                    <section
                      aria-label="Overall syllabus progress"
                      className="rounded-2xl border border-[#E4DFF0] dark:border-[#2A2836] bg-[#F3EFFA] dark:bg-[#1B1A24] p-5 sm:p-6 flex items-center justify-between gap-5"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <p className="text-xs font-medium text-[#5B4BC4] dark:text-[#C4BAFF]">
                          Academic Progress
                        </p>
                        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
                          Keep up the steady pace
                        </h2>
                        <p
                          className="text-sm text-[#49454F] dark:text-[#CAC4D0] tabular-nums"
                          data-testid="overall-chapters-text"
                        >
                          {overall.completedChapters} of {overall.totalChapters} chapters completed{' '}
                          <span aria-hidden="true" className="mx-1 opacity-50">·</span>{' '}
                          {overall.completedMilestones}/{overall.totalMilestones} tasks
                        </p>
                      </div>

                      <ProgressRing percent={overall.chapterPercent} size={108} strokeWidth={10} />
                    </section>

                    {/* Row of 3 Study Time Summary Cards: Today, This Week, This Month */}
                    <section
                      aria-label="Study time summary"
                      className="grid grid-cols-3 gap-2.5 sm:gap-4"
                    >
                      {summaryItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] px-3.5 py-3.5 sm:px-5 sm:py-4"
                        >
                          <p className="text-[11px] sm:text-xs font-medium text-[#605D66] dark:text-[#AEA9B4] truncate">
                            {item.label}
                          </p>
                          <p
                            data-testid={item.testId}
                            className="font-display text-base sm:text-xl font-bold tracking-tight tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] mt-1"
                          >
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </section>

                    {/* Daily Habits Section (Non-study goals, resets daily) */}
                    <DailyHabitsCard
                      state={dailyHabits}
                      onToggleHabit={onToggleDailyHabit}
                      onAddHabit={onAddDailyHabit}
                      onRemoveHabit={onRemoveDailyHabit}
                    />

                    {/* Scrollable Subject Cards */}
                    <section aria-label="Subjects" className="space-y-3.5 pt-1">
                      <div className="flex items-baseline justify-between px-0.5">
                        <h2 className="font-display text-base font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
                          Subjects
                        </h2>
                        <span
                          className="text-xs text-[#605D66] dark:text-[#AEA9B4] tabular-nums"
                          data-testid="subjects-count-label"
                        >
                          {subjects.length} subjects
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="subjects-grid">
                        {subjects.map((subject, index) => (
                          <SubjectCard
                            key={subject.id}
                            subject={subject}
                            index={index}
                            onSelect={onSelectSubject}
                          />
                        ))}
                      </div>
                    </section>
                  </motion.div>
                ) : (
                  <motion.div
                    key="home-goals-section"
                    data-testid="home-goals-panel"
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-5"
                  >
                    {/* Goals Summary Hero Card with Daily / Weekly Toggle */}
                    <section
                      aria-label="Study goals summary"
                      className="rounded-2xl border border-[#E4DFF0] dark:border-[#2A2836] bg-[#F3EFFA] dark:bg-[#1B1A24] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-medium text-[#5B4BC4] dark:text-[#C4BAFF]">
                          {goalPeriod === 'daily' ? 'Daily Study Goals' : 'Weekly Study Goals'}
                        </p>
                        <h2
                          className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] tabular-nums"
                          data-testid="goals-summary-heading"
                        >
                          {goalsSummary.activeGoalsCount > 0
                            ? `${goalsSummary.goalsMetCount} of ${goalsSummary.activeGoalsCount} goals met`
                            : 'No study goals set yet'}
                        </h2>
                        <p
                          className="text-sm text-[#49454F] dark:text-[#CAC4D0] tabular-nums"
                          data-testid="goals-summary-hours"
                        >
                          {goalsSummary.totalTargetMinutes > 0
                            ? `${formatDuration(goalsSummary.totalLoggedMinutes)} logged of ${formatDuration(goalsSummary.totalTargetMinutes)} target`
                            : 'Tap Edit Goals to define daily and weekly hours per subject'}
                        </p>
                      </div>

                      {/* Daily / Weekly Period Switcher */}
                      <div
                        role="tablist"
                        aria-label="Goal timeframe"
                        className="inline-flex self-start sm:self-center p-1 rounded-xl bg-white/80 dark:bg-[#14131C] border border-[#DFD9EE] dark:border-[#2E2B3E]"
                      >
                        <button
                          type="button"
                          role="tab"
                          aria-selected={goalPeriod === 'daily'}
                          onClick={() => setGoalPeriod('daily')}
                          data-testid="goal-period-daily"
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            goalPeriod === 'daily'
                              ? 'bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559]'
                              : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-[#F4EFF4]'
                          }`}
                        >
                          Daily
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={goalPeriod === 'weekly'}
                          onClick={() => setGoalPeriod('weekly')}
                          data-testid="goal-period-weekly"
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            goalPeriod === 'weekly'
                              ? 'bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559]'
                              : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-[#F4EFF4]'
                          }`}
                        >
                          Weekly
                        </button>
                      </div>
                    </section>

                    {/* Per-Subject Goal Progress Ring Cards */}
                    <section aria-label="Subject study hour goals" className="space-y-3.5">
                      <div className="flex items-baseline justify-between px-0.5">
                        <h2 className="font-display text-base font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
                          Subject Progress Rings
                        </h2>
                        <span className="text-xs text-[#605D66] dark:text-[#AEA9B4] tabular-nums">
                          {goalPeriod === 'daily' ? 'Today' : 'This Week'}
                        </span>
                      </div>

                      <div
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        data-testid="subject-goals-grid"
                      >
                        {goalProgressItems.map((item, index) => (
                          <SubjectGoalCard
                            key={`${goalPeriod}-${item.subjectId}`}
                            item={item}
                            index={index}
                            onEditGoal={(subjectId) => onOpenGoalsDialog(subjectId)}
                          />
                        ))}
                      </div>
                    </section>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Material 3 '+' Floating Action Button */}
      <motion.button
        type="button"
        onClick={onOpenLogDialog}
        aria-label="Log study time"
        data-testid="log-study-fab"
        whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-4 sm:right-8 z-30 w-14 h-14 rounded-2xl bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559] shadow-lg shadow-[#5B4BC4]/25 dark:shadow-black/40 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] dark:focus-visible:ring-[#B9ADFF] focus-visible:ring-offset-2 cursor-pointer"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} aria-hidden="true" />
      </motion.button>
    </motion.div>
  );
}
