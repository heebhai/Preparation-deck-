import { BookOpen, ChevronRight, Compass, Feather, FlaskConical, Globe2 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { Subject } from '../types/syllabus';
import { getSubjectStats } from '../utils/syllabusMath';
import { SUBJECT_PALETTES } from '../utils/subjectTheme';

interface SubjectCardProps {
  subject: Subject;
  index: number;
  onSelect: (subjectId: string) => void;
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

export function SubjectCard({ subject, index, onSelect }: SubjectCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const palette = SUBJECT_PALETTES[subject.accent];
  const stats = getSubjectStats(subject);
  const ratio = stats.totalChapters === 0 ? 0 : stats.completedChapters / stats.totalChapters;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(subject.id)}
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
      transition={{
        duration: 0.36,
        delay: prefersReducedMotion ? 0 : index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      data-testid={`subject-card-${subject.id}`}
      className={`group w-full text-left rounded-2xl border p-5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] dark:focus-visible:ring-[#B9ADFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8FC] dark:focus-visible:ring-offset-[#121318] min-h-[112px] flex flex-col justify-between gap-4 cursor-pointer ${palette.cardSurface}`}
    >
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${palette.iconBg} ${palette.iconText}`}
          >
            <SubjectIcon id={subject.id} className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] truncate">
              {subject.name}
            </h2>
            <p className="text-xs text-[#605D66] dark:text-[#AEA9B4] mt-0.5 truncate">
              {subject.subSubjects.map((s) => s.name).join(' · ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pt-1">
          <span
            className={`text-sm font-semibold tabular-nums ${palette.accentText}`}
          >
            {stats.chapterPercent}%
          </span>
          <ChevronRight
            className="w-4 h-4 text-[#79747E] dark:text-[#938F99] transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="space-y-2 w-full">
        {/* Thin animated linear progress bar */}
        <div
          className={`h-1.5 w-full rounded-full overflow-hidden ${palette.trackBg}`}
          aria-hidden="true"
        >
          <motion.div
            className={`h-full w-full rounded-full origin-left ${palette.progressFill}`}
            initial={prefersReducedMotion ? { scaleX: ratio } : { scaleX: 0 }}
            animate={{ scaleX: ratio }}
            transition={{
              duration: 0.75,
              delay: prefersReducedMotion ? 0 : 0.14 + index * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-[#49454F] dark:text-[#CAC4D0]">
          <span className="font-medium tabular-nums" data-testid={`subject-count-${subject.id}`}>
            {stats.completedChapters}/{stats.totalChapters} chapters
          </span>
          <span className="tabular-nums text-[#79747E] dark:text-[#938F99]">
            {stats.completedMilestones}/{stats.totalMilestones} tasks
          </span>
        </div>
      </div>
    </motion.button>
  );
}
