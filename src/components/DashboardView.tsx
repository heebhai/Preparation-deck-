import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckSquare,
  Clock,
  Flame,
  Moon,
  Plus,
  Search,
  Settings,
  Smartphone,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { DailyHabitsState } from '../types/dailyHabit';
import type { DailyTodoItem } from '../types/dailyTodo';
import type { ExamCountdownSummary } from '../types/examCountdown';
import type { StudyLogEntry } from '../types/studyLog';
import type { MilestoneKey, Subject } from '../types/syllabus';
import { getScreenTimeStatus } from '../utils/badgesMath';
import {
  formatMinutesAsDecimalHours,
  getDailyWorkSummary,
  parseScreenTimeHoursInput,
} from '../utils/dailyTodoMath';
import {
  calculateStudyStats,
  formatStatDuration,
} from '../utils/studyLogMath';
import { searchChaptersAcrossSubjects } from '../utils/syllabusMath';
import { ChapterRow } from './ChapterRow';
import { ProgressRing } from './ProgressRing';
import { PWAInstallButton } from './PWAInstallButton';

import type { HeeCoinState } from '../types/heeCoin';
import type { QuoteItem } from '../types/quote';

const HEE_COIN_IMAGE_PATH = '/assets/aistudio/1795170963447_47dacc4d.png';

type TaskFilter = 'all' | 'remaining';

interface DashboardViewProps {
  todayKey: string;
  subjects: Subject[];
  studyLogs: ReadonlyArray<StudyLogEntry>;
  examCountdown: ExamCountdownSummary;
  currentStreakDays: number;
  todayScreenTimeMinutes: number;
  dailyHabits: DailyHabitsState;
  todos: ReadonlyArray<DailyTodoItem>;
  coinState: HeeCoinState;
  hasCrown: boolean;
  dailyQuote: QuoteItem;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUpdateScreenTime: (dateKey: string, minutes: number) => void;
  onAddTodo: (title: string) => string | null;
  onToggleTodo: (todoId: string) => void;
  onRemoveTodo: (todoId: string) => void;
  onToggleMilestone: (
    subjectId: string,
    subSubjectId: string,
    chapterId: string,
    milestoneKey: MilestoneKey,
  ) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenLogDialog: () => void;
}

export function DashboardView({
  todayKey,
  subjects,
  studyLogs,
  examCountdown,
  currentStreakDays,
  todayScreenTimeMinutes,
  dailyHabits,
  todos,
  coinState,
  hasCrown,
  dailyQuote,
  searchQuery,
  onSearchChange,
  onUpdateScreenTime,
  onAddTodo,
  onToggleTodo,
  onRemoveTodo,
  onToggleMilestone,
  isDark,
  onToggleTheme,
  onOpenSettings,
  onOpenLogDialog,
}: DashboardViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const studyStats = calculateStudyStats(studyLogs, todayKey);
  const workSummary = getDailyWorkSummary(todos, todayKey);
  const screenTimeStatus = getScreenTimeStatus(
    todayScreenTimeMinutes,
    studyStats.todayMinutes,
  );

  const [screenHoursDraft, setScreenHoursDraft] = useState<string>(() =>
    formatMinutesAsDecimalHours(todayScreenTimeMinutes),
  );
  const [isEditingScreenHours, setIsEditingScreenHours] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [taskError, setTaskError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditingScreenHours) {
      setScreenHoursDraft(formatMinutesAsDecimalHours(todayScreenTimeMinutes));
    }
  }, [todayScreenTimeMinutes, isEditingScreenHours]);

  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;
  const chapterResults = isSearching
    ? searchChaptersAcrossSubjects(subjects, trimmedQuery)
    : [];

  const completedTodosCount = workSummary.completedCount;
  const displayedTodos =
    taskFilter === 'remaining' ? workSummary.remainingItems : todos;
  const isUrgentCountdown =
    examCountdown.phase === 'today' ||
    (examCountdown.phase === 'upcoming' && examCountdown.daysRemaining <= 14);

  const handleScreenHoursChange = (rawValue: string) => {
    setScreenHoursDraft(rawValue);
    const parsedMinutes = parseScreenTimeHoursInput(rawValue);
    if (parsedMinutes !== null) {
      onUpdateScreenTime(todayKey, parsedMinutes);
    }
  };

  const handleScreenHoursBlur = () => {
    setIsEditingScreenHours(false);
    const parsedMinutes = parseScreenTimeHoursInput(screenHoursDraft);
    if (parsedMinutes !== null) {
      onUpdateScreenTime(todayKey, parsedMinutes);
      setScreenHoursDraft(formatMinutesAsDecimalHours(parsedMinutes));
    } else {
      setScreenHoursDraft(formatMinutesAsDecimalHours(todayScreenTimeMinutes));
    }
  };

  const handleTodoSubmit = (e: FormEvent) => {
    e.preventDefault();
    const error = onAddTodo(newTaskTitle);
    if (error) {
      setTaskError(error);
      return;
    }
    setNewTaskTitle('');
    setTaskError(null);
  };

  return (
    <motion.div
      key="dashboard-view"
      data-testid="dashboard-view"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen flex flex-col"
    >
      {/* Compact Sticky Top Bar */}
      <header className="sticky top-0 z-30 pt-safe backdrop-blur-md bg-[#FAF8FC]/88 dark:bg-[#121318]/88 border-b border-[#E6E0EC]/80 dark:border-[#26252E]/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] whitespace-nowrap truncate">
            Dashboard
          </h1>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Hee Coin balance with coin icon (no background) */}
            <div
              data-testid="dashboard-coin-badge"
              className="flex items-center gap-1.5 px-1 py-1"
            >
              <span className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src={HEE_COIN_IMAGE_PATH}
                  alt="Hee coins"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center scale-150"
                />
              </span>
              <span
                data-testid="dashboard-coin-balance-value"
                className="font-display text-xs sm:text-sm font-bold tabular-nums text-amber-700 dark:text-amber-300"
              >
                {coinState.redeemedInfinite ? '∞' : coinState.balance}
              </span>
            </div>

            {/* Crown Icon if purchased */}
            {hasCrown && (
              <span
                data-testid="dashboard-crown-badge"
                title="Hee Empire Crown (Premium)"
                className="w-7 h-7 flex items-center justify-center text-base shrink-0"
              >
                👑
              </span>
            )}

            {/* Streak Counter (fire icon) */}
            <div
              data-testid="dashboard-streak-badge"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 dark:bg-orange-400/10 border border-orange-500/20 dark:border-orange-400/20"
            >
              <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" aria-hidden="true" />
              <span
                data-testid="dashboard-streak-badge-value"
                className="font-display text-xs sm:text-sm font-bold tabular-nums text-orange-700 dark:text-orange-300"
              >
                {currentStreakDays}
              </span>
            </div>

            <PWAInstallButton />

            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Open settings"
              data-testid="dashboard-settings-button"
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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 pb-28 space-y-4 sm:space-y-5">
        {/* Daily Quote Box (exact same width and horizontal padding as main Progress Bar) */}
        <section
          aria-label="Daily Quote"
          data-testid="dashboard-daily-quote-card"
          className="rounded-2xl border border-[#DFD7F2] dark:border-[#2F2B42] bg-white dark:bg-[#1B1A22] p-4 sm:p-5 flex items-start justify-between gap-3 sm:gap-4"
        >
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#5B4BC4] dark:text-[#C4BAFF]">
              <span>Daily Quote</span>
              {dailyQuote.scheduledDateKey === todayKey && (
                <>
                  <span aria-hidden="true" className="opacity-50">
                    ·
                  </span>
                  <span className="text-[#15803D] dark:text-[#6EE7B7]">
                    Scheduled for today
                  </span>
                </>
              )}
            </div>
            <p
              data-testid="dashboard-daily-quote-text"
              className="font-display text-sm sm:text-base font-semibold text-[#1C1B1F] dark:text-[#F4EFF4] leading-relaxed"
            >
              &ldquo;{dailyQuote.text}&rdquo;
            </p>
            {dailyQuote.author && (
              <p
                data-testid="dashboard-daily-quote-author"
                className="text-xs text-[#605D66] dark:text-[#AEA9B4]"
              >
                — {dailyQuote.author}
              </p>
            )}
          </div>
        </section>

        {/* 6. Search Bar at the top of Dashboard (reuses chapter search logic) */}
        <div role="search" aria-label="Search chapters" className="w-full">
          <label htmlFor="dashboard-search-input" className="sr-only">
            Search chapters across all subjects
          </label>
          <div className="relative flex items-center rounded-2xl border border-[#E4DFF0] dark:border-[#2C2A38] bg-[#F1EDF8] dark:bg-[#1C1B24] focus-within:border-[#5B4BC4] dark:focus-within:border-[#B9ADFF] focus-within:ring-2 focus-within:ring-[#5B4BC4]/20 dark:focus-within:ring-[#B9ADFF]/20 transition-all">
            <Search
              className="w-5 h-5 ml-4 text-[#605D66] dark:text-[#AEA9B4] shrink-0 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="dashboard-search-input"
              type="text"
              role="searchbox"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search chapters across all subjects..."
              data-testid="dashboard-search-input"
              className="w-full min-h-[48px] bg-transparent px-3.5 py-2.5 text-sm sm:text-[15px] text-[#1C1B1F] dark:text-[#F4EFF4] placeholder:text-[#79747E] dark:placeholder:text-[#938F99] focus:outline-none"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search query"
                data-testid="dashboard-clear-search"
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
              key="dashboard-search-results"
              aria-label="Chapter search results"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3.5"
            >
              <div className="flex items-baseline justify-between px-0.5">
                <h2 className="font-display text-base font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
                  Search Results
                </h2>
                <span
                  className="text-xs text-[#605D66] dark:text-[#AEA9B4] tabular-nums"
                  data-testid="dashboard-search-count"
                >
                  {chapterResults.length}{' '}
                  {chapterResults.length === 1 ? 'chapter' : 'chapters'}
                </span>
              </div>

              {chapterResults.length > 0 ? (
                <div className="space-y-3" data-testid="dashboard-search-list">
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
                  data-testid="dashboard-search-empty"
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
                    className="inline-flex items-center justify-center min-h-[44px] px-5 py-2 rounded-xl bg-[#EFEBF5] dark:bg-[#2A2836] text-sm font-medium text-[#5B4BC4] dark:text-[#C4BAFF] hover:bg-[#E4DFF0] dark:hover:bg-[#353245] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors cursor-pointer"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </motion.section>
          ) : (
            <motion.div
              key="dashboard-cards-grid"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4 sm:space-y-5"
            >
              {/* 1. Prominent Board Countdown Hero Card */}
              <section
                aria-label="Board Countdown"
                data-testid="dashboard-board-countdown-card"
                className="rounded-3xl border border-[#DFD7F2] dark:border-[#2E2A40] bg-[#F3EFFA] dark:bg-[#1B1A24] p-5 sm:p-6 flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#5B4BC4] dark:text-[#C4BAFF]">
                    <CalendarClock className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Board Countdown</span>
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
                    Class 10 Boards
                  </h2>
                  <p className="text-xs sm:text-sm text-[#49454F] dark:text-[#CAC4D0]">
                    Target date · {examCountdown.formattedExamDate}
                    {!examCountdown.isCustom && (
                      <>
                        <span aria-hidden="true" className="mx-1.5 opacity-50">
                          ·
                        </span>
                        <button
                          type="button"
                          onClick={onOpenSettings}
                          className="font-semibold text-[#5B4BC4] dark:text-[#C4BAFF] underline underline-offset-2 hover:opacity-80 cursor-pointer"
                        >
                          Edit date
                        </button>
                      </>
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-white dark:bg-[#14131A] border border-[#E4DFF0] dark:border-[#2F2B42] px-4 py-3 sm:px-6 sm:py-4 text-center shrink-0 min-w-[104px] sm:min-w-[126px]">
                  <p
                    data-testid="dashboard-countdown-days"
                    className={`font-display text-3xl sm:text-4xl font-extrabold leading-none tabular-nums ${
                      isUrgentCountdown
                        ? 'text-[#C2410C] dark:text-[#FDBA74]'
                        : 'text-[#5B4BC4] dark:text-[#C4BAFF]'
                    }`}
                  >
                    {examCountdown.phase === 'passed'
                      ? '0'
                      : examCountdown.headlineValue}
                  </p>
                  <p
                    data-testid="dashboard-countdown-unit"
                    className="text-xs font-semibold text-[#605D66] dark:text-[#AEA9B4] mt-1 whitespace-nowrap"
                  >
                    {examCountdown.headlineUnit}
                  </p>
                </div>
              </section>

              {/* 2, 3, 5: Compact Metrics Bento Row (Daily Study Time, Streak, Wasted Screen Time) */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* 2. Daily Study Time Box */}
                <section
                  aria-label="Daily Study Time"
                  data-testid="dashboard-daily-study-card"
                  className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] p-4 sm:p-5 flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#605D66] dark:text-[#AEA9B4]">
                      Daily Study Time
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-[#F3EFFA] dark:bg-[#262338] text-[#5B4BC4] dark:text-[#C4BAFF] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div>
                    <p
                      data-testid="dashboard-study-time-value"
                      className="font-display text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4]"
                    >
                      {formatStatDuration(studyStats.todayMinutes)}
                    </p>
                    <p className="text-xs text-[#605D66] dark:text-[#AEA9B4] mt-0.5">
                      Logged from Study Logs today
                    </p>
                  </div>
                </section>

                {/* 5. Streak Box */}
                <section
                  aria-label="Study Streak"
                  data-testid="dashboard-streak-card"
                  className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-2.5 ${
                    currentStreakDays > 0
                      ? 'border-[#FDBA74] bg-[#FFF7ED] dark:border-[#9A3412] dark:bg-[#2D180A]'
                      : 'border-[#E6E0EC] bg-white dark:border-[#2D2B36] dark:bg-[#1B1A20]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#605D66] dark:text-[#AEA9B4]">
                      Study Streak
                    </span>
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        currentStreakDays > 0
                          ? 'bg-[#FFEDD5] text-[#C2410C] dark:bg-[#431407] dark:text-[#FDBA74]'
                          : 'bg-[#F3EFFA] text-[#605D66] dark:bg-[#262338] dark:text-[#AEA9B4]'
                      }`}
                    >
                      <Flame className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div>
                    <p
                      data-testid="dashboard-streak-value"
                      className={`font-display text-2xl sm:text-3xl font-bold tracking-tight tabular-nums flex items-center gap-1.5 ${
                        currentStreakDays > 0
                          ? 'text-[#C2410C] dark:text-[#FDBA74]'
                          : 'text-[#1C1B1F] dark:text-[#F4EFF4]'
                      }`}
                    >
                      <span aria-hidden="true">🔥</span>
                      <span>{currentStreakDays}</span>
                      <span className="text-sm font-semibold text-[#605D66] dark:text-[#AEA9B4]">
                        {currentStreakDays === 1 ? 'day' : 'days'}
                      </span>
                    </p>
                    <p className="text-xs text-[#605D66] dark:text-[#AEA9B4] mt-0.5">
                      Study 60m+ or check 2+ boxes daily
                    </p>
                  </div>
                </section>

                {/* 3. Wasted Screen Time Box */}
                <section
                  aria-label="Wasted Screen Time"
                  data-testid="dashboard-screen-time-card"
                  className={`col-span-2 lg:col-span-1 rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-2.5 transition-colors ${
                    screenTimeStatus.isHigherThanStudy
                      ? 'border-[#FCA5A5] bg-[#FEF2F2] dark:border-[#991B1B] dark:bg-[#2A1215]'
                      : 'border-[#E6E0EC] bg-white dark:border-[#2D2B36] dark:bg-[#1B1A20]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#605D66] dark:text-[#AEA9B4]">
                      Wasted Screen Time
                    </span>
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        screenTimeStatus.isHigherThanStudy
                          ? 'bg-[#FEE2E2] text-[#DC2626] dark:bg-[#451A1E] dark:text-[#FCA5A5]'
                          : 'bg-[#F3EFFA] text-[#5B4BC4] dark:bg-[#262338] dark:text-[#C4BAFF]'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label htmlFor="dashboard-screen-time-hours" className="sr-only">
                        Hours scrolled today
                      </label>
                      <input
                        id="dashboard-screen-time-hours"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={24}
                        step={0.5}
                        value={screenHoursDraft}
                        onFocus={() => setIsEditingScreenHours(true)}
                        onChange={(e) => handleScreenHoursChange(e.target.value)}
                        onBlur={handleScreenHoursBlur}
                        data-testid="dashboard-screen-time-input"
                        className="w-24 min-h-[44px] rounded-xl border border-[#DFD9EE] dark:border-[#343144] bg-[#FAF8FC] dark:bg-[#15141B] px-3 font-display text-lg font-bold tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]"
                      />
                      <span className="text-sm font-semibold text-[#49454F] dark:text-[#CAC4D0]">
                        hrs today
                      </span>
                    </div>

                    {screenTimeStatus.isHigherThanStudy ? (
                      <p
                        role="alert"
                        data-testid="dashboard-screen-time-warning"
                        className="text-xs font-semibold text-[#DC2626] dark:text-[#FCA5A5] flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Higher than today&apos;s study time</span>
                      </p>
                    ) : (
                      <p className="text-xs text-[#605D66] dark:text-[#AEA9B4]">
                        Saved locally · {formatStatDuration(todayScreenTimeMinutes)}
                      </p>
                    )}
                  </div>
                </section>
              </div>

              {/* Daily Work Progress Window (% completed + Day Remaining Daily Tasks) */}
              <section
                aria-label="Daily Work Progress"
                data-testid="dashboard-daily-progress-card"
                className="rounded-2xl border border-[#DFD7F2] dark:border-[#2F2B42] bg-white dark:bg-[#1B1A22] p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#5B4BC4] dark:text-[#C4BAFF]">
                    <span data-testid="dashboard-day-label">
                      {workSummary.formattedDayLabel}
                    </span>
                    <span aria-hidden="true" className="opacity-50">
                      ·
                    </span>
                    <span>Daily Work Progress</span>
                  </div>

                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <h2
                      data-testid="dashboard-daily-progress-percent"
                      className="font-display text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4]"
                    >
                      {workSummary.progressPercent}% done
                    </h2>
                    <span
                      data-testid="dashboard-remaining-tasks-count"
                      className="text-xs sm:text-sm font-semibold tabular-nums text-[#605D66] dark:text-[#AEA9B4]"
                    >
                      {workSummary.remainingCount} remaining
                    </span>
                  </div>

                  {workSummary.totalCount === 0 ? (
                    <p className="text-xs text-[#605D66] dark:text-[#AEA9B4]">
                      No daily tasks yet · Add tasks below to track today&apos;s completion percentage.
                    </p>
                  ) : workSummary.remainingCount === 0 ? (
                    <p className="text-xs font-medium text-[#15803D] dark:text-[#6EE7B7]">
                      All {workSummary.totalCount} daily tasks completed for today!
                    </p>
                  ) : (
                    <p
                      data-testid="dashboard-remaining-preview"
                      className="text-xs text-[#49454F] dark:text-[#CAC4D0] truncate"
                    >
                      Remaining:{' '}
                      {workSummary.remainingItems
                        .slice(0, 3)
                        .map((item) => item.title)
                        .join(' · ')}
                      {workSummary.remainingItems.length > 3
                        ? ` (+${workSummary.remainingItems.length - 3} more)`
                        : ''}
                    </p>
                  )}

                  <p className="text-[11px] text-[#605D66] dark:text-[#AEA9B4] tabular-nums">
                    Habits: {dailyHabits.completedIds.length}/{dailyHabits.habits.length} done
                    <span aria-hidden="true" className="mx-1.5 opacity-50">
                      ·
                    </span>
                    Study today: {formatStatDuration(studyStats.todayMinutes)}
                  </p>
                </div>

                <div className="flex items-center shrink-0">
                  <ProgressRing
                    percent={workSummary.progressPercent}
                    size={84}
                    strokeWidth={8}
                    label="Daily"
                    percentTextClassName="text-lg"
                    valueTestId="dashboard-daily-progress-ring-value"
                    ariaLabel={`Daily work progress ${workSummary.progressPercent}%`}
                    arcColorClassName={
                      workSummary.progressPercent === 100
                        ? 'text-[#16A34A] dark:text-[#34D399]'
                        : 'text-[#5B4BC4] dark:text-[#B9ADFF]'
                    }
                  />
                </div>
              </section>

              {/* 4. Daily Tasks & Goals To-Do List Box */}
              <section
                aria-label="Daily Tasks and Goals"
                data-testid="dashboard-tasks-card"
                className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] p-4 sm:p-5 space-y-3.5"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-[#F3EFFA] dark:bg-[#262338] text-[#5B4BC4] dark:text-[#C4BAFF] flex items-center justify-center shrink-0">
                      <CheckSquare className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-display text-base font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
                        Daily Tasks &amp; Goals
                      </h2>
                      <p className="text-xs text-[#605D66] dark:text-[#AEA9B4] tabular-nums">
                        {workSummary.formattedDayLabel} · {workSummary.remainingCount} remaining ·{' '}
                        {completedTodosCount}/{todos.length} done
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      role="tablist"
                      aria-label="Filter daily tasks"
                      className="inline-flex p-0.5 rounded-xl bg-[#EFEBF5] dark:bg-[#242230] border border-[#E4DFF0] dark:border-[#2E2B3D]"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={taskFilter === 'all'}
                        onClick={() => setTaskFilter('all')}
                        data-testid="dashboard-todos-filter-all"
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          taskFilter === 'all'
                            ? 'bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559]'
                            : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-[#F4EFF4]'
                        }`}
                      >
                        All ({todos.length})
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={taskFilter === 'remaining'}
                        onClick={() => setTaskFilter('remaining')}
                        data-testid="dashboard-todos-filter-remaining"
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          taskFilter === 'remaining'
                            ? 'bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559]'
                            : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-[#F4EFF4]'
                        }`}
                      >
                        Remaining ({workSummary.remainingCount})
                      </button>
                    </div>

                    <span
                      data-testid="dashboard-todos-count"
                      className="sr-only"
                    >
                      {completedTodosCount}/{todos.length} done
                    </span>
                  </div>
                </div>

                <form onSubmit={handleTodoSubmit} className="flex items-center gap-2" noValidate>
                  <label htmlFor="dashboard-new-task-input" className="sr-only">
                    Add a daily task or goal
                  </label>
                  <input
                    id="dashboard-new-task-input"
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => {
                      setNewTaskTitle(e.target.value);
                      if (taskError) setTaskError(null);
                    }}
                    placeholder="Add a task (e.g. Complete Ch 4 Maths exercise)..."
                    maxLength={80}
                    data-testid="dashboard-todo-input"
                    className="flex-1 min-w-0 min-h-[44px] rounded-xl border border-[#DFD9EE] dark:border-[#343144] bg-[#FAF8FC] dark:bg-[#15141B] px-3.5 text-sm text-[#1C1B1F] dark:text-[#F4EFF4] placeholder:text-[#79747E] dark:placeholder:text-[#938F99] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]"
                  />
                  <button
                    type="submit"
                    data-testid="dashboard-add-todo-button"
                    className="min-h-[44px] px-4 rounded-xl bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559] text-xs sm:text-sm font-semibold hover:bg-[#4B3BB4] dark:hover:bg-[#D5CEFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Add</span>
                  </button>
                </form>

                {taskError && (
                  <p
                    role="alert"
                    data-testid="dashboard-todo-error"
                    className="text-xs font-medium text-[#DC2626] dark:text-[#FCA5A5]"
                  >
                    {taskError}
                  </p>
                )}

                {displayedTodos.length === 0 ? (
                  <p
                    data-testid="dashboard-todos-empty"
                    className="text-sm text-[#605D66] dark:text-[#AEA9B4] py-2"
                  >
                    {todos.length === 0
                      ? 'No tasks added for today yet. Add a task above to get started.'
                      : 'No remaining tasks! All tasks for today are completed.'}
                  </p>
                ) : (
                  <ul
                    key={taskFilter}
                    className="space-y-2"
                    data-testid="dashboard-todos-list"
                  >
                    {displayedTodos.map((item) => (
                      <motion.li
                        key={item.id}
                        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
                          item.completed
                            ? 'bg-[#ECFDF5] border-[#86EFAC] dark:bg-[#112B20] dark:border-[#2E7D5B]'
                            : 'bg-[#FAF8FC] border-[#ECE7F3] dark:bg-[#15141B] dark:border-[#2B2936]'
                        }`}
                      >
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={item.completed}
                            onClick={() => onToggleTodo(item.id)}
                            data-testid={`dashboard-todo-checkbox-${item.id}`}
                            className="flex-1 min-w-0 min-h-[40px] flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] rounded-lg cursor-pointer"
                          >
                            <span
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                item.completed
                                  ? 'bg-[#16A34A] border-[#16A34A] text-white dark:bg-[#34D399] dark:border-[#34D399] dark:text-[#052E16]'
                                  : 'border-[#B9B2C8] dark:border-[#524E66] bg-white dark:bg-[#1B1A20]'
                              }`}
                            >
                              {item.completed && (
                                <Check className="w-3.5 h-3.5 stroke-[2.75]" aria-hidden="true" />
                              )}
                            </span>

                            <span
                              className={`text-sm font-medium break-words transition-colors ${
                                item.completed
                                  ? 'line-through text-[#15803D] dark:text-[#6EE7B7]'
                                  : 'text-[#1C1B1F] dark:text-[#F4EFF4]'
                              }`}
                            >
                              {item.title}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onRemoveTodo(item.id)}
                            aria-label={`Delete task ${item.title}`}
                            data-testid={`dashboard-todo-delete-${item.id}`}
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#79747E] hover:text-[#DC2626] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </motion.li>
                      ))}
                  </ul>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Material 3 '+' Floating Action Button */}
      <motion.button
        type="button"
        onClick={onOpenLogDialog}
        aria-label="Log study time"
        data-testid="dashboard-log-study-fab"
        whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-4 sm:right-8 z-30 w-14 h-14 rounded-2xl bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559] shadow-lg shadow-[#5B4BC4]/25 dark:shadow-black/40 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] dark:focus-visible:ring-[#B9ADFF] focus-visible:ring-offset-2 cursor-pointer"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} aria-hidden="true" />
      </motion.button>
    </motion.div>
  );
}
