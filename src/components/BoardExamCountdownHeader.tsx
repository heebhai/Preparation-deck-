import { CalendarClock, Settings2 } from 'lucide-react';
import type { ExamCountdownSummary } from '../types/examCountdown';

interface BoardExamCountdownHeaderProps {
  summary: ExamCountdownSummary;
  onOpenSettings: () => void;
}

export function BoardExamCountdownHeader({
  summary,
  onOpenSettings,
}: BoardExamCountdownHeaderProps) {
  const isToday = summary.phase === 'today';
  const isPassed = summary.phase === 'passed';
  const isUrgent = summary.phase === 'upcoming' && summary.daysRemaining <= 14;

  return (
    <section
      aria-label="Board Exam Countdown"
      data-testid="board-exam-countdown-header"
      className="rounded-2xl border border-[#DFD7F2] dark:border-[#2F2B42] bg-white dark:bg-[#1B1A22] px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between gap-3 sm:gap-4"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isToday || isUrgent
              ? 'bg-[#FFF7ED] text-[#C2410C] dark:bg-[#3A1E0C] dark:text-[#FDBA74]'
              : 'bg-[#F3EFFA] text-[#5B4BC4] dark:bg-[#26223A] dark:text-[#C4BAFF]'
          }`}
        >
          <CalendarClock className="w-5 h-5" aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <h2 className="font-display text-sm sm:text-base font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] truncate">
            Board Exam Countdown
          </h2>
          <p
            data-testid="board-exam-date-subtitle"
            className="text-xs text-[#605D66] dark:text-[#AEA9B4] truncate"
          >
            CBSE Class 10th
            <span aria-hidden="true" className="mx-1.5 opacity-55">
              ·
            </span>
            <span>{summary.formattedExamDate}</span>
            {!summary.isCustom && (
              <>
                <span aria-hidden="true" className="mx-1.5 opacity-55">
                  ·
                </span>
                <span>Estimated</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="text-right">
          {isPassed ? (
            <p
              data-testid="board-exam-days-value"
              className="font-display text-sm sm:text-base font-bold tracking-tight tabular-nums text-[#605D66] dark:text-[#AEA9B4]"
            >
              Passed
            </p>
          ) : (
            <p
              data-testid="board-exam-days-value"
              className={`font-display text-xl sm:text-2xl font-bold leading-none tracking-tight tabular-nums ${
                isToday || isUrgent
                  ? 'text-[#C2410C] dark:text-[#FDBA74]'
                  : 'text-[#5B4BC4] dark:text-[#C4BAFF]'
              }`}
            >
              {summary.headlineValue}
            </p>
          )}
          <p
            data-testid="board-exam-days-label"
            className="text-[11px] font-medium text-[#605D66] dark:text-[#AEA9B4] whitespace-nowrap mt-0.5"
          >
            {summary.headlineUnit}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Edit Board Exam date in settings"
          data-testid="countdown-edit-date-button"
          className="min-h-[44px] px-3 rounded-xl border border-[#E4DFF0] dark:border-[#322F42] bg-[#FAF8FC] dark:bg-[#14131A] text-xs font-semibold text-[#5B4BC4] dark:text-[#C4BAFF] hover:bg-[#EFEBF5] dark:hover:bg-[#262338] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Set date</span>
        </button>
      </div>
    </section>
  );
}
