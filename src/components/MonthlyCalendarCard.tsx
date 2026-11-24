import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { MonthlyCalendarData } from '../utils/dailyStatsMath';
import { formatDuration } from '../utils/studyLogMath';

interface MonthlyCalendarCardProps {
  calendar: MonthlyCalendarData;
  selectedDateKey: string;
  canGoNextMonth: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToTodayMonth: () => void;
  isCurrentMonth: boolean;
  onSelectDate: (dateKey: string) => void;
}

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function MonthlyCalendarCard({
  calendar,
  selectedDateKey,
  canGoNextMonth,
  onPrevMonth,
  onNextMonth,
  onJumpToTodayMonth,
  isCurrentMonth,
  onSelectDate,
}: MonthlyCalendarCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      key={`${calendar.year}-${calendar.monthIndex}`}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
      data-testid="monthly-calendar-view"
    >
      {/* Monthly Aggregated Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="rounded-2xl border border-[#E4DFF0] dark:border-[#2A2836] bg-[#F3EFFA] dark:bg-[#1B1A24] px-3.5 py-3.5 sm:px-4">
          <p className="text-[11px] sm:text-xs font-medium text-[#5B4BC4] dark:text-[#C4BAFF]">
            Month Total
          </p>
          <p
            className="font-display text-lg sm:text-2xl font-extrabold tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] mt-0.5"
            data-testid="monthly-total-hours"
          >
            {formatDuration(calendar.totalMinutes)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] px-3.5 py-3.5 sm:px-4">
          <p className="text-[11px] sm:text-xs font-medium text-[#605D66] dark:text-[#AEA9B4]">
            Active Days
          </p>
          <p
            className="font-display text-lg sm:text-2xl font-extrabold tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] mt-0.5"
            data-testid="monthly-active-days"
          >
            {calendar.activeDays}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] px-3.5 py-3.5 sm:px-4">
          <p className="text-[11px] sm:text-xs font-medium text-[#605D66] dark:text-[#AEA9B4]">
            Sessions
          </p>
          <p
            className="font-display text-lg sm:text-2xl font-extrabold tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] mt-0.5"
            data-testid="monthly-sessions-count"
          >
            {calendar.totalSessions}
          </p>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <section
        aria-label={`Study calendar for ${calendar.monthLabel}`}
        className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] p-4 sm:p-6 space-y-4"
      >
        {/* Month Navigation */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarDays
              className="w-4 h-4 text-[#5B4BC4] dark:text-[#C4BAFF] shrink-0"
              aria-hidden="true"
            />
            <h2
              className="font-display text-base sm:text-lg font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] truncate"
              data-testid="monthly-calendar-heading"
            >
              {calendar.monthLabel}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={onJumpToTodayMonth}
                data-testid="monthly-today-button"
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#EFEBF5] text-[#5B4BC4] dark:bg-[#272436] dark:text-[#C4BAFF] hover:bg-[#E4DFF0] dark:hover:bg-[#312D44] transition-colors cursor-pointer"
              >
                Today
              </button>
            )}
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="Previous month"
              data-testid="monthly-prev-button"
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              disabled={!canGoNextMonth}
              aria-label="Next month"
              data-testid="monthly-next-button"
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] disabled:opacity-35 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {WEEKDAY_HEADERS.map((day) => (
            <div
              key={day}
              className="text-[11px] font-semibold uppercase tracking-wider text-[#605D66] dark:text-[#AEA9B4] py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: calendar.leadingEmptySlots }).map((_, idx) => (
            <div key={`empty-${idx}`} aria-hidden="true" className="min-h-[54px] sm:min-h-[62px]" />
          ))}

          {calendar.days.map((cell) => {
            const isSelected = cell.dateKey === selectedDateKey;

            let toneClass =
              'bg-[#FAF8FC] dark:bg-[#15141B] text-[#1C1B1F] dark:text-[#F4EFF4] border-[#ECE7F3] dark:border-[#292734]';
            if (cell.intensity === 1) {
              toneClass =
                'bg-[#EFEBF9] dark:bg-[#25213A] text-[#2F2373] dark:text-[#DDD6FF] border-[#D9D0F2] dark:border-[#3A335C]';
            } else if (cell.intensity === 2) {
              toneClass =
                'bg-[#DDD5F8] dark:bg-[#352E58] text-[#241866] dark:text-[#ECE8FF] border-[#C1B3F0] dark:border-[#4D447D]';
            } else if (cell.intensity === 3) {
              toneClass =
                'bg-[#5B4BC4] dark:bg-[#B9ADFF] text-white dark:text-[#1B1252] border-[#5B4BC4] dark:border-[#B9ADFF]';
            }

            if (cell.isFuture) {
              toneClass =
                'bg-transparent dark:bg-transparent text-[#A09BA8] dark:text-[#555261] border-transparent opacity-45';
            }

            return (
              <button
                key={cell.dateKey}
                type="button"
                disabled={cell.isFuture}
                aria-pressed={isSelected}
                onClick={() => onSelectDate(cell.dateKey)}
                data-testid={`calendar-day-${cell.dateKey}`}
                data-has-logs={cell.totalMinutes > 0 ? 'true' : 'false'}
                aria-label={`${cell.dateKey}${
                  cell.totalMinutes > 0
                    ? `, ${formatDuration(cell.totalMinutes)} studied`
                    : cell.chapterUpdatesCount > 0
                      ? `, ${cell.chapterUpdatesCount} chapters updated`
                      : ', no study logs'
                }`}
                className={`relative min-h-[54px] sm:min-h-[62px] rounded-xl border px-0.5 py-1.5 sm:p-1.5 flex flex-col items-center justify-between transition-transform active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] ${toneClass} ${
                  isSelected
                    ? 'ring-2 ring-[#5B4BC4] dark:ring-[#C4BAFF] ring-offset-1 ring-offset-white dark:ring-offset-[#1B1A20]'
                    : ''
                } ${cell.isFuture ? 'cursor-default' : 'cursor-pointer hover:brightness-97 dark:hover:brightness-110'}`}
              >
                <div className="w-full flex items-center justify-between px-1">
                  <span
                    className={`text-xs font-bold tabular-nums leading-none ${
                      cell.isToday && cell.intensity < 3
                        ? 'text-[#5B4BC4] dark:text-[#C4BAFF]'
                        : ''
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {cell.isToday && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        cell.intensity === 3
                          ? 'bg-white dark:bg-[#1B1252]'
                          : 'bg-[#5B4BC4] dark:bg-[#C4BAFF]'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {cell.totalMinutes > 0 ? (
                  <span
                    className={`text-[9px] sm:text-[11px] tracking-tight font-semibold tabular-nums leading-tight whitespace-nowrap ${
                      cell.intensity === 3
                        ? 'text-white/95 dark:text-[#1B1252]/95'
                        : 'text-[#5B4BC4] dark:text-[#D1C8FF]'
                    }`}
                  >
                    {formatDuration(cell.totalMinutes)}
                  </span>
                ) : cell.chapterUpdatesCount > 0 ? (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#16A34A] dark:bg-[#34D399]"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="h-3" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend & Tap Hint */}
        <div className="pt-2 border-t border-[#EFEBF5] dark:border-[#2A2836] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#605D66] dark:text-[#AEA9B4]">
          <span>Tap any date to filter stats &amp; activity for that day</span>
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <span className="w-3 h-3 rounded-[4px] bg-[#FAF8FC] dark:bg-[#15141B] border border-[#E6E0EC] dark:border-[#2D2B36]" />
            <span className="w-3 h-3 rounded-[4px] bg-[#EFEBF9] dark:bg-[#25213A]" />
            <span className="w-3 h-3 rounded-[4px] bg-[#DDD5F8] dark:bg-[#352E58]" />
            <span className="w-3 h-3 rounded-[4px] bg-[#5B4BC4] dark:bg-[#B9ADFF]" />
            <span>More</span>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
