import { BookOpen, CheckCircle2, Compass, Feather, FlaskConical, Globe2, Pencil } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { SubjectGoalProgress } from '../utils/studyGoalMath';
import { formatDuration } from '../utils/studyLogMath';
import { SUBJECT_PALETTES } from '../utils/subjectTheme';
import { ProgressRing } from './ProgressRing';

interface SubjectGoalCardProps {
  item: SubjectGoalProgress;
  index: number;
  onEditGoal: (subjectId: string) => void;
}

function SubjectIcon({ id, className }: { id: string; className?: string }) {
  switch (id) {
    case 'science':
      return <FlaskConical className={className} strokeWidth={2} aria-hidden="true" />;
    case 'sst':
      return <Globe2 className={className} strokeWidth={2} aria-hidden="true" />;
    case 'maths':
      return <Compass className={className} strokeWidth={2} aria-hidden="true" />;
    case 'english':
      return <BookOpen className={className} strokeWidth={2} aria-hidden="true" />;
    case 'hindi':
    default:
      return <Feather className={className} strokeWidth={2} aria-hidden="true" />;
  }
}

export function SubjectGoalCard({ item, index, onEditGoal }: SubjectGoalCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const palette = SUBJECT_PALETTES[item.accent];
  const periodLabel = item.period === 'daily' ? 'Daily goal' : 'Weekly goal';

  const statusText = !item.hasGoal
    ? `No ${item.period} goal set`
    : item.isGoalMet
      ? item.loggedMinutes > item.targetMinutes
        ? `Goal met (+${formatDuration(item.loggedMinutes - item.targetMinutes)})`
        : 'Goal met!'
      : `${formatDuration(item.remainingMinutes)} left`;

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: prefersReducedMotion ? 0 : index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      data-testid={`subject-goal-card-${item.subjectId}`}
      className={`rounded-2xl border p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${palette.cardSurface}`}
    >
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${palette.iconBg} ${palette.iconText}`}
          >
            <SubjectIcon id={item.subjectId} className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-base sm:text-lg font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] truncate">
                {item.subjectName}
              </h3>
              {item.isGoalMet && (
                <span
                  data-testid={`goal-met-badge-${item.subjectId}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#15803D] dark:bg-[#143D29] dark:text-[#6EE7B7]"
                >
                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                  <span>Goal Met</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#605D66] dark:text-[#AEA9B4] mt-0.5">
              {periodLabel}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p
            className="font-display text-sm sm:text-[15px] font-bold tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4]"
            data-testid={`goal-progress-text-${item.subjectId}`}
          >
            {item.hasGoal
              ? `${formatDuration(item.loggedMinutes)} / ${formatDuration(item.targetMinutes)}`
              : `${formatDuration(item.loggedMinutes)} logged`}
          </p>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`text-xs font-medium tabular-nums ${
                item.isGoalMet
                  ? 'text-[#15803D] dark:text-[#6EE7B7]'
                  : item.hasGoal
                    ? palette.accentText
                    : 'text-[#605D66] dark:text-[#AEA9B4]'
              }`}
              data-testid={`goal-status-text-${item.subjectId}`}
            >
              {statusText}
            </span>
            <button
              type="button"
              onClick={() => onEditGoal(item.subjectId)}
              aria-label={`Edit study goal for ${item.subjectName}`}
              data-testid={`edit-goal-${item.subjectId}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/75 dark:bg-black/20 text-[#49454F] dark:text-[#DED8E1] hover:bg-white dark:hover:bg-black/35 border border-black/[0.06] dark:border-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors cursor-pointer"
            >
              <Pencil className="w-3 h-3" aria-hidden="true" />
              <span>{item.hasGoal ? 'Edit' : 'Set Goal'}</span>
            </button>
          </div>
        </div>
      </div>

      <ProgressRing
        percent={item.ringPercent}
        size={84}
        strokeWidth={8}
        showLabel={false}
        percentTextClassName="text-base sm:text-lg"
        arcColorClassName={
          item.isGoalMet
            ? 'text-[#16A34A] dark:text-[#34D399]'
            : palette.ringStroke
        }
        trackColorClassName={palette.ringTrack}
        valueTestId={`goal-ring-percent-${item.subjectId}`}
        ariaLabel={`${item.subjectName} ${item.period} study goal progress ${item.ringPercent}%`}
      />
    </motion.div>
  );
}
