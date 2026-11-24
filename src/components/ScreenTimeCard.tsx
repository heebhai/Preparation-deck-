import { AlertTriangle, Smartphone } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { getScreenTimeStatus } from '../utils/badgesMath';
import { formatStatDuration } from '../utils/studyLogMath';

interface ScreenTimeCardProps {
  selectedDateLabel: string;
  isViewingToday: boolean;
  screenTimeMinutes: number;
  studyTimeMinutes: number;
  onChangeScreenTime: (minutes: number) => void;
}

const PRESET_MINUTES = [0, 30, 60, 120, 180] as const;

export function ScreenTimeCard({
  selectedDateLabel,
  isViewingToday,
  screenTimeMinutes,
  studyTimeMinutes,
  onChangeScreenTime,
}: ScreenTimeCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const status = getScreenTimeStatus(screenTimeMinutes, studyTimeMinutes);
  const hours = Math.floor(status.screenTimeMinutes / 60);
  const mins = status.screenTimeMinutes % 60;

  const updateParts = (nextHoursRaw: number, nextMinsRaw: number) => {
    const safeHours = Number.isFinite(nextHoursRaw)
      ? Math.max(0, Math.min(24, Math.floor(nextHoursRaw)))
      : 0;
    const safeMins = Number.isFinite(nextMinsRaw)
      ? Math.max(0, Math.min(59, Math.floor(nextMinsRaw)))
      : 0;
    const total = Math.min(24 * 60, safeHours * 60 + safeMins);
    onChangeScreenTime(total);
  };

  return (
    <motion.section
      aria-label="Screen Time"
      data-testid="screen-time-section"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-2xl border p-5 sm:p-6 space-y-4 transition-colors ${
        status.isHigherThanStudy
          ? 'border-[#FCA5A5] bg-[#FEF2F2] dark:border-[#991B1B] dark:bg-[#2A1215]'
          : 'border-[#E6E0EC] bg-white dark:border-[#2D2B36] dark:bg-[#1B1A20]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              status.isHigherThanStudy
                ? 'bg-[#FEE2E2] text-[#DC2626] dark:bg-[#451A1E] dark:text-[#FCA5A5]'
                : 'bg-[#F3EFFA] text-[#5B4BC4] dark:bg-[#262338] dark:text-[#C4BAFF]'
            }`}
          >
            <Smartphone className="w-4 h-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
              Screen Time
            </h2>
            <p className="text-xs text-[#605D66] dark:text-[#AEA9B4]">
              {isViewingToday
                ? 'Hours wasted scrolling today'
                : `Hours wasted scrolling on ${selectedDateLabel}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1.5">
            <label htmlFor="screen-time-hours" className="sr-only">
              Screen time hours
            </label>
            <input
              id="screen-time-hours"
              type="number"
              inputMode="numeric"
              min={0}
              max={24}
              value={hours}
              onChange={(e) => updateParts(Number(e.target.value), mins)}
              data-testid="screen-time-hours-input"
              className="w-16 min-h-[42px] rounded-xl border border-[#DFD9EE] dark:border-[#343144] bg-[#FAF8FC] dark:bg-[#15141B] px-2.5 text-center font-display text-sm font-bold tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]"
            />
            <span className="text-xs font-semibold text-[#605D66] dark:text-[#AEA9B4]">
              h
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="screen-time-minutes" className="sr-only">
              Screen time minutes
            </label>
            <input
              id="screen-time-minutes"
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              value={mins}
              onChange={(e) => updateParts(hours, Number(e.target.value))}
              data-testid="screen-time-minutes-input"
              className="w-16 min-h-[42px] rounded-xl border border-[#DFD9EE] dark:border-[#343144] bg-[#FAF8FC] dark:bg-[#15141B] px-2.5 text-center font-display text-sm font-bold tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]"
            />
            <span className="text-xs font-semibold text-[#605D66] dark:text-[#AEA9B4]">
              m
            </span>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESET_MINUTES.map((preset) => {
            const isSelected = status.screenTimeMinutes === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onChangeScreenTime(preset)}
                data-testid={`screen-time-preset-${preset}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559]'
                    : 'bg-[#EFEBF5] text-[#49454F] dark:bg-[#262336] dark:text-[#CAC4D0] hover:bg-[#E4DFF0] dark:hover:bg-[#312D44]'
                }`}
              >
                {preset === 0 ? '0m' : formatStatDuration(preset)}
              </button>
            );
          })}
        </div>

        <span
          data-testid="screen-time-comparison"
          className="text-xs font-medium text-[#605D66] dark:text-[#AEA9B4] tabular-nums"
        >
          Study: {formatStatDuration(status.studyTimeMinutes)} vs Screen:{' '}
          {formatStatDuration(status.screenTimeMinutes)}
        </span>
      </div>

      {status.isHigherThanStudy && (
        <div
          role="alert"
          data-testid="screen-time-warning"
          className="flex items-start gap-2 rounded-xl bg-[#FEE2E2] dark:bg-[#451A1E] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#DC2626] dark:text-[#FCA5A5]"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Warning: Your screen time ({formatStatDuration(status.screenTimeMinutes)}) is
            higher than your study time ({formatStatDuration(status.studyTimeMinutes)})!
            Put the phone away and get back to focus.
          </span>
        </div>
      )}
    </motion.section>
  );
}
