import { useState } from 'react';
import { Award, Calendar, CheckCircle2, Clock, Moon, Plus, RotateCcw, Sparkles, Sun } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { StudyLogEntry } from '../types/studyLog';
import type { Subject, SubjectAccent } from '../types/syllabus';
import {
  formatLongDateHeading,
  getLast7DaysStudySeries,
  getMonthlyCalendarData,
  getTodayChapterActivity,
  getTodayStudyLogs,
  shiftMonth,
} from '../utils/dailyStatsMath';
import {
  capDailyMinutes,
  formatDuration,
  formatStatDuration,
  formatStudyLogDate,
  formatStudyTaskList,
  getLocalDateKey,
  parseLocalDateKey,
  splitDurationEqually,
} from '../utils/studyLogMath';
import type { BadgeStatus } from '../utils/badgesMath';
import type { ScreenTimeByDate } from '../utils/screenTimeStorage';
import { SUBJECT_PALETTES } from '../utils/subjectTheme';
import { AchievementsCard } from './AchievementsCard';
import { Last7DaysBarChart } from './Last7DaysBarChart';
import { MonthlyCalendarCard } from './MonthlyCalendarCard';
import { ScreenTimeCard } from './ScreenTimeCard';

type StatsSubTab = 'daily' | 'monthly';

interface DailyStatsViewProps {
  subjects: ReadonlyArray<Subject>;
  studyLogs: ReadonlyArray<StudyLogEntry>;
  subjectAccents: Record<string, SubjectAccent>;
  badges: ReadonlyArray<BadgeStatus>;
  currentStreakDays: number;
  screenTimeMap: ScreenTimeByDate;
  onUpdateScreenTime: (dateKey: string, minutes: number) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenLogDialog: () => void;
}

export function DailyStatsView({
  subjects,
  studyLogs,
  subjectAccents,
  badges,
  currentStreakDays,
  screenTimeMap,
  onUpdateScreenTime,
  isDark,
  onToggleTheme,
  onOpenLogDialog,
}: DailyStatsViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const todayKey = getLocalDateKey();
  const todayParsed = parseLocalDateKey(todayKey) ?? new Date();
  const currentYear = todayParsed.getFullYear();
  const currentMonthIndex = todayParsed.getMonth();

  const [subTab, setSubTab] = useState<StatsSubTab>('daily');
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [viewedMonth, setViewedMonth] = useState<{ year: number; monthIndex: number }>({
    year: currentYear,
    monthIndex: currentMonthIndex,
  });

  const isViewingToday = selectedDateKey === todayKey;
  const activeDateHeading = formatLongDateHeading(selectedDateKey);
  const shortSelectedDate = formatStudyLogDate(selectedDateKey);

  const series = getLast7DaysStudySeries(studyLogs, selectedDateKey, todayKey);
  const dayStudyLogs = getTodayStudyLogs(studyLogs, selectedDateKey);
  const dayChapters = getTodayChapterActivity(subjects, selectedDateKey);

  const dayRawMinutes = dayStudyLogs.reduce(
    (sum, item) => sum + item.durationMinutes,
    0,
  );
  // Strict 24h cap (never exceed 24h on a single calendar day)
  const dayTotalMinutes = capDailyMinutes(dayRawMinutes);
  const last7TotalMinutes = series.reduce((sum, p) => sum + p.totalMinutes, 0);
  const selectedScreenTimeMinutes = screenTimeMap[selectedDateKey] ?? 0;

  const monthlyCalendar = getMonthlyCalendarData(
    viewedMonth.year,
    viewedMonth.monthIndex,
    studyLogs,
    subjects,
    todayKey,
  );
  const isViewingCurrentMonth =
    viewedMonth.year === currentYear && viewedMonth.monthIndex === currentMonthIndex;
  const canGoNextMonth =
    viewedMonth.year < currentYear ||
    (viewedMonth.year === currentYear && viewedMonth.monthIndex < currentMonthIndex);

  const handleSelectCalendarDate = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setSubTab('daily');
  };

  return (
    <motion.div
      key="daily-stats-view"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen flex flex-col"
    >
      {/* Compact Sticky Top Bar */}
      <header className="sticky top-0 z-30 pt-safe backdrop-blur-md bg-[#FAF8FC]/88 dark:bg-[#121318]/88 border-b border-[#E6E0EC]/80 dark:border-[#26252E]/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] whitespace-nowrap">
            Daily Stats
          </h1>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            data-testid="theme-toggle"
            className="w-11 h-11 rounded-full flex items-center justify-center text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] dark:focus-visible:ring-[#B9ADFF] transition-colors cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 pb-28 space-y-5">
        {/* Daily / Monthly Sub-Tab Segmented Switcher */}
        <div className="flex items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Stats view mode"
            className="inline-flex p-1 rounded-2xl bg-[#EFEBF5] dark:bg-[#1E1C28] border border-[#E4DFF0] dark:border-[#2D2B3A]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'daily'}
              onClick={() => setSubTab('daily')}
              data-testid="stats-subtab-daily"
              className={`relative px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                subTab === 'daily'
                  ? 'text-white dark:text-[#1F1559]'
                  : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-[#F4EFF4]'
              }`}
            >
              {subTab === 'daily' && (
                <motion.span
                  layoutId="daily-stats-subtab-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-[#5B4BC4] dark:bg-[#C4BAFF] z-0"
                />
              )}
              <span className="relative z-10">Daily</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'monthly'}
              onClick={() => setSubTab('monthly')}
              data-testid="stats-subtab-monthly"
              className={`relative inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                subTab === 'monthly'
                  ? 'text-white dark:text-[#1F1559]'
                  : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-[#F4EFF4]'
              }`}
            >
              {subTab === 'monthly' && (
                <motion.span
                  layoutId="daily-stats-subtab-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-[#5B4BC4] dark:bg-[#C4BAFF] z-0"
                />
              )}
              <Calendar className="w-3.5 h-3.5 relative z-10" aria-hidden="true" />
              <span className="relative z-10">Monthly</span>
            </button>
          </div>

          {subTab === 'daily' && !isViewingToday && (
            <button
              type="button"
              onClick={() => {
                setSelectedDateKey(todayKey);
                setViewedMonth({ year: currentYear, monthIndex: currentMonthIndex });
              }}
              data-testid="back-to-today-button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#EFEBF5] dark:bg-[#262434] text-[#5B4BC4] dark:text-[#C4BAFF] hover:bg-[#E4DFF0] dark:hover:bg-[#312E42] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to Today</span>
            </button>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {subTab === 'monthly' ? (
            <MonthlyCalendarCard
              key="monthly-tab-panel"
              calendar={monthlyCalendar}
              selectedDateKey={selectedDateKey}
              canGoNextMonth={canGoNextMonth}
              isCurrentMonth={isViewingCurrentMonth}
              onPrevMonth={() =>
                setViewedMonth((prev) => shiftMonth(prev.year, prev.monthIndex, -1))
              }
              onNextMonth={() => {
                if (canGoNextMonth) {
                  setViewedMonth((prev) => shiftMonth(prev.year, prev.monthIndex, 1));
                }
              }}
              onJumpToTodayMonth={() =>
                setViewedMonth({ year: currentYear, monthIndex: currentMonthIndex })
              }
              onSelectDate={handleSelectCalendarDate}
            />
          ) : (
            <motion.div
              key={`daily-tab-panel-${selectedDateKey}`}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              {/* Header Card: Date + Total Hours Studied (capped at 24h) */}
              <section
                aria-label="Selected day study summary"
                className="rounded-2xl border border-[#E4DFF0] dark:border-[#2A2836] bg-[#F3EFFA] dark:bg-[#1B1A24] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p
                    className="text-xs sm:text-sm font-medium text-[#5B4BC4] dark:text-[#C4BAFF]"
                    data-testid="daily-stats-date"
                  >
                    {activeDateHeading}
                  </p>
                  <h2
                    className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4]"
                    data-testid="daily-stats-total-hours"
                  >
                    {formatStatDuration(dayTotalMinutes)}{' '}
                    {isViewingToday ? 'studied today' : `studied on ${shortSelectedDate}`}
                  </h2>
                </div>

                <div className="text-xs sm:text-sm text-[#49454F] dark:text-[#CAC4D0] tabular-nums sm:text-right">
                  <p className="font-medium">
                    {dayStudyLogs.length}{' '}
                    {dayStudyLogs.length === 1 ? 'session' : 'sessions'} logged
                  </p>
                  <p className="text-[#605D66] dark:text-[#AEA9B4] mt-0.5">
                    {dayChapters.length}{' '}
                    {dayChapters.length === 1 ? 'chapter' : 'chapters'} updated{' '}
                    {isViewingToday ? 'today' : `on ${shortSelectedDate}`}
                  </p>
                </div>
              </section>

              {/* Achievements Section (locked in grey, unlocked in color) */}
              <AchievementsCard
                badges={badges}
                currentStreakDays={currentStreakDays}
              />

              {/* Screen Time Tracker vs Study Time */}
              <ScreenTimeCard
                selectedDateLabel={shortSelectedDate}
                isViewingToday={isViewingToday}
                screenTimeMinutes={selectedScreenTimeMinutes}
                studyTimeMinutes={dayTotalMinutes}
                onChangeScreenTime={(minutes) =>
                  onUpdateScreenTime(selectedDateKey, minutes)
                }
              />

              {/* Last 7 Days Canvas Bar Chart */}
              <section
                aria-label="Last 7 days study chart"
                className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
                      {isViewingToday ? 'Last 7 Days' : `7 Days Ending ${shortSelectedDate}`}
                    </h2>
                    <p className="text-xs text-[#605D66] dark:text-[#AEA9B4] mt-0.5">
                      Daily study time across all subjects
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tabular-nums text-[#5B4BC4] dark:text-[#C4BAFF]">
                    {formatDuration(last7TotalMinutes)} total
                  </span>
                </div>

                <Last7DaysBarChart
                  series={series}
                  isDark={isDark}
                  selectedDateKey={selectedDateKey}
                />
              </section>

              {/* Selected Day's Activity Box */}
              <section
                aria-label={isViewingToday ? "Today's Activity" : `Activity on ${shortSelectedDate}`}
                data-testid="todays-activity-box"
                className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] p-5 sm:p-6 space-y-5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-base font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
                    {isViewingToday ? "Today's Activity" : `Activity on ${shortSelectedDate}`}
                  </h2>
                  <span className="text-xs text-[#605D66] dark:text-[#AEA9B4] tabular-nums">
                    {dayChapters.length + dayStudyLogs.length} entries
                  </span>
                </div>

                {dayChapters.length === 0 && dayStudyLogs.length === 0 ? (
                  <div
                    data-testid="daily-stats-empty-state"
                    className="rounded-2xl border border-dashed border-[#DFD9EE] dark:border-[#323042] bg-[#FAF8FC] dark:bg-[#15141B] px-5 py-9 text-center flex flex-col items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#EFEBF5] dark:bg-[#262336] text-[#5B4BC4] dark:text-[#C4BAFF] flex items-center justify-center">
                      <Clock className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <p className="font-display text-sm sm:text-base font-semibold text-[#1C1B1F] dark:text-[#F4EFF4]">
                        {isViewingToday
                          ? 'No study sessions logged yet. Tap + to start!'
                          : `No study sessions logged on ${shortSelectedDate}.`}
                      </p>
                      <p className="text-xs text-[#605D66] dark:text-[#AEA9B4]">
                        {isViewingToday
                          ? 'Use + to log study time, run a Focus timer, or check off chapters in Syllabus.'
                          : 'Select another day in Monthly view or return to Today to log a session.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Chapters Checked */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#605D66] dark:text-[#AEA9B4]">
                        {isViewingToday
                          ? 'Chapters Checked Today'
                          : `Chapters Checked on ${shortSelectedDate}`}
                      </h3>

                      {dayChapters.length > 0 ? (
                        <div className="space-y-2.5" data-testid="todays-chapters-list">
                          <AnimatePresence initial={false}>
                            {dayChapters.map((item, idx) => {
                              const palette = SUBJECT_PALETTES[item.subjectAccent];
                              return (
                                <motion.div
                                  key={`${item.subjectId}-${item.subSubjectId}-${item.chapter.id}`}
                                  layout
                                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    duration: 0.24,
                                    delay: prefersReducedMotion ? 0 : Math.min(idx, 6) * 0.04,
                                  }}
                                  data-testid={`today-chapter-${item.chapter.id}`}
                                  data-complete={item.isFullyComplete ? 'true' : 'false'}
                                  className={`rounded-2xl border p-4 flex items-start justify-between gap-3 transition-colors ${
                                    item.isFullyComplete
                                      ? 'bg-[#DCFCE7] border-[#4ADE80] dark:bg-[#123524] dark:border-[#34D399]'
                                      : 'bg-[#FAF8FC] border-[#E6E0EC] dark:bg-[#15141B] dark:border-[#2C2A36]'
                                  }`}
                                >
                                  <div className="flex items-start gap-3 min-w-0">
                                    <div
                                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                        item.isFullyComplete
                                          ? 'bg-[#16A34A] text-white dark:bg-[#34D399] dark:text-[#052E16]'
                                          : `${palette.iconBg} ${palette.iconText}`
                                      }`}
                                    >
                                      {item.isFullyComplete ? (
                                        <Award className="w-4 h-4" aria-hidden="true" />
                                      ) : (
                                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <p
                                        className={`text-xs font-medium ${
                                          item.isFullyComplete
                                            ? 'text-[#15803D] dark:text-[#6EE7B7]'
                                            : palette.accentText
                                        }`}
                                      >
                                        {item.subjectName} · {item.subSubjectName}
                                      </p>
                                      <p className="font-display text-sm sm:text-[15px] font-semibold text-[#1C1B1F] dark:text-[#F4EFF4] leading-snug mt-0.5">
                                        {item.chapter.name}
                                      </p>
                                      <p
                                        className={`text-xs mt-1 ${
                                          item.isFullyComplete
                                            ? 'text-[#166534] dark:text-[#A7F3D0] font-medium'
                                            : 'text-[#605D66] dark:text-[#AEA9B4]'
                                        }`}
                                      >
                                        Checked {isViewingToday ? 'today' : shortSelectedDate}:{' '}
                                        {item.checkedToday.map((c) => c.label).join(', ')}
                                      </p>
                                    </div>
                                  </div>

                                  {item.isFullyComplete && (
                                    <motion.span
                                      key={`badge-${item.chapter.id}`}
                                      initial={
                                        prefersReducedMotion
                                          ? { opacity: 1 }
                                          : { scale: 0.65, opacity: 0 }
                                      }
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{
                                        type: 'spring',
                                        stiffness: 420,
                                        damping: 18,
                                      }}
                                      data-testid={`complete-badge-${item.chapter.id}`}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FACC15] text-[#422006] dark:bg-[#FDE047] dark:text-[#2D1602] text-[11px] font-extrabold tracking-wide shrink-0 shadow-xs"
                                    >
                                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                                      <span>COMPLETE</span>
                                    </motion.span>
                                  )}
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <p
                          data-testid="todays-chapters-empty"
                          className="text-sm text-[#605D66] dark:text-[#AEA9B4] py-2"
                        >
                          {isViewingToday
                            ? 'No chapters checked off today yet.'
                            : `No chapters checked off on ${shortSelectedDate}.`}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-[#EFEBF5] dark:border-[#2A2836]" />

                    {/* Study Time Logged: [Time] - [Subject] > [Chapter] : [Task done] */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#605D66] dark:text-[#AEA9B4]">
                        {isViewingToday
                          ? 'Study Time Logged Today'
                          : `Study Time Logged on ${shortSelectedDate}`}
                      </h3>

                      {dayStudyLogs.length > 0 ? (
                        <div className="space-y-2.5" data-testid="todays-logs-list">
                          <AnimatePresence initial={false}>
                            {dayStudyLogs.map((log) => {
                              const palette = SUBJECT_PALETTES[subjectAccents[log.subjectId] ?? 'mint'];
                              const items = log.items ?? [];
                              const splitMins = splitDurationEqually(log.durationMinutes, items.length);

                              return (
                                <motion.div
                                  key={log.id}
                                  layout
                                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                                  data-testid={`today-study-log-${log.id}`}
                                  className="rounded-xl border border-[#ECE7F3] dark:border-[#2B2936] bg-[#FAF8FC] dark:bg-[#15141B] px-4 py-3 space-y-2"
                                >
                                  {items.length <= 1 ? (
                                    <div className="flex items-start gap-3">
                                      <span
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${palette.iconBg} ${palette.iconText}`}
                                      >
                                        <Clock className="w-4 h-4" aria-hidden="true" />
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-display text-sm font-semibold text-[#1C1B1F] dark:text-[#F4EFF4] leading-snug">
                                          <span className={`tabular-nums ${palette.accentText}`}>
                                            {formatDuration(log.durationMinutes)}
                                          </span>{' '}
                                          - {log.subjectName}
                                          {items[0] ? (
                                            <>
                                              {' '}
                                              &gt; {items[0].chapterName} :{' '}
                                              <span className="font-medium text-[#49454F] dark:text-[#CAC4D0]">
                                                {formatStudyTaskList(items[0].tasks)}
                                              </span>
                                            </>
                                          ) : null}
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <span
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${palette.iconBg} ${palette.iconText}`}
                                          >
                                            <Clock className="w-4 h-4" aria-hidden="true" />
                                          </span>
                                          <p className="font-display text-sm font-semibold text-[#1C1B1F] dark:text-[#F4EFF4] truncate">
                                            <span className={`tabular-nums ${palette.accentText}`}>
                                              {formatDuration(log.durationMinutes)}
                                            </span>{' '}
                                            - {log.subjectName} ({items.length} chapters)
                                          </p>
                                        </div>
                                      </div>
                                      <ul className="pl-10 space-y-1">
                                        {items.map((item, idx) => (
                                          <li
                                            key={`${log.id}-${item.chapterId}`}
                                            className="text-xs sm:text-[13px] text-[#49454F] dark:text-[#CAC4D0] leading-snug"
                                          >
                                            <span className="font-semibold tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4]">
                                              {formatDuration(splitMins[idx] ?? 0)}
                                            </span>{' '}
                                            - {log.subjectName} &gt; {item.chapterName} :{' '}
                                            <span className="font-medium">
                                              {formatStudyTaskList(item.tasks)}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </>
                                  )}
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <p
                          data-testid="todays-logs-empty"
                          className="text-sm text-[#605D66] dark:text-[#AEA9B4] py-2"
                        >
                          {isViewingToday
                            ? 'No manual study time logged today yet.'
                            : `No manual study time logged on ${shortSelectedDate}.`}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button (+) on Daily Stats Screen */}
      <motion.button
        type="button"
        onClick={onOpenLogDialog}
        aria-label="Log study time"
        data-testid="daily-stats-fab"
        whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-5 sm:right-8 z-30 w-14 h-14 rounded-2xl bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559] shadow-lg shadow-[#5B4BC4]/25 dark:shadow-black/40 flex items-center justify-center hover:bg-[#4D3EB3] dark:hover:bg-[#D5CEFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] focus-visible:ring-offset-2 transition-colors cursor-pointer"
      >
        <Plus className="w-6 h-6" aria-hidden="true" />
      </motion.button>
    </motion.div>
  );
}
