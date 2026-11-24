import { Flame, Lock, Trophy } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { BadgeStatus, BadgeTone } from '../utils/badgesMath';

interface AchievementsCardProps {
  badges: ReadonlyArray<BadgeStatus>;
  currentStreakDays: number;
}

const UNLOCKED_TONE_CLASSES: Record<
  BadgeTone,
  { card: string; iconWrap: string; statusText: string }
> = {
  amber: {
    card: 'bg-[#FFFBEB] border-[#FDE68A] dark:bg-[#2B2210] dark:border-[#7A5816]',
    iconWrap: 'bg-[#FEF3C7] text-[#B45309] dark:bg-[#4D370D] dark:text-[#FCD34D]',
    statusText: 'text-[#B45309] dark:text-[#FCD34D]',
  },
  indigo: {
    card: 'bg-[#EEF2FF] border-[#C7D2FE] dark:bg-[#1B1F38] dark:border-[#3A437A]',
    iconWrap: 'bg-[#E0E7FF] text-[#4338CA] dark:bg-[#2C325E] dark:text-[#A5B4FC]',
    statusText: 'text-[#4338CA] dark:text-[#A5B4FC]',
  },
  emerald: {
    card: 'bg-[#ECFDF5] border-[#A7F3D0] dark:bg-[#112A20] dark:border-[#1E5C42]',
    iconWrap: 'bg-[#D1FAE5] text-[#047857] dark:bg-[#194231] dark:text-[#6EE7B7]',
    statusText: 'text-[#047857] dark:text-[#6EE7B7]',
  },
  orange: {
    card: 'bg-[#FFF7ED] border-[#FDBA74] dark:bg-[#2E1A0E] dark:border-[#7C3B14]',
    iconWrap: 'bg-[#FFEDD5] text-[#C2410C] dark:bg-[#4E2811] dark:text-[#FDBA74]',
    statusText: 'text-[#C2410C] dark:text-[#FDBA74]',
  },
  violet: {
    card: 'bg-[#F5F3FF] border-[#DDD6FE] dark:bg-[#201B33] dark:border-[#493C7A]',
    iconWrap: 'bg-[#EDE9FE] text-[#5B4BC4] dark:bg-[#332A57] dark:text-[#C4BAFF]',
    statusText: 'text-[#5B4BC4] dark:text-[#C4BAFF]',
  },
};

export function AchievementsCard({
  badges,
  currentStreakDays,
}: AchievementsCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <motion.section
      aria-label="Achievements"
      data-testid="achievements-section"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] p-5 sm:p-6 space-y-4"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[#F3EFFA] dark:bg-[#262338] text-[#5B4BC4] dark:text-[#C4BAFF] flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
              Achievements
            </h2>
            <p className="text-xs text-[#605D66] dark:text-[#AEA9B4]">
              Locked badges stay grey until you unlock them
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentStreakDays >= 1 && (
            <span
              data-testid="study-streak-badge"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFEDD5] text-[#C2410C] dark:bg-[#3E2210] dark:text-[#FDBA74] tabular-nums"
            >
              <Flame className="w-3.5 h-3.5" aria-hidden="true" />
              {currentStreakDays}-day streak
            </span>
          )}
          <span
            data-testid="achievements-count"
            className="text-xs sm:text-sm font-semibold tabular-nums text-[#5B4BC4] dark:text-[#C4BAFF]"
          >
            {unlockedCount}/{badges.length} unlocked
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {badges.map((badge, index) => {
          const unlockedStyle = UNLOCKED_TONE_CLASSES[badge.tone];
          return (
            <motion.div
              key={badge.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.2,
                delay: prefersReducedMotion ? 0 : Math.min(index, 5) * 0.04,
              }}
              data-testid={`achievement-card-${badge.id}`}
              data-unlocked={badge.unlocked ? 'true' : 'false'}
              className={`rounded-2xl border p-3.5 flex items-start gap-3 transition-all ${
                badge.unlocked
                  ? unlockedStyle.card
                  : 'bg-[#F4F4F5] border-[#E4E4E7] dark:bg-[#18181B] dark:border-[#27272A] opacity-75'
              }`}
            >
              <span
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl ${
                  badge.unlocked
                    ? unlockedStyle.iconWrap
                    : 'bg-[#E4E4E7] text-[#71717A] dark:bg-[#27272A] dark:text-[#A1A1AA] grayscale'
                }`}
                aria-hidden="true"
              >
                {badge.emoji}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`font-display text-sm font-bold leading-snug ${
                      badge.unlocked
                        ? 'text-[#1C1B1F] dark:text-[#F4EFF4]'
                        : 'text-[#52525B] dark:text-[#A1A1AA]'
                    }`}
                  >
                    {badge.title}
                  </p>
                  {!badge.unlocked && (
                    <Lock
                      className="w-3.5 h-3.5 text-[#71717A] dark:text-[#71717A] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <p
                  className={`text-xs mt-0.5 leading-snug ${
                    badge.unlocked
                      ? 'text-[#49454F] dark:text-[#CAC4D0]'
                      : 'text-[#71717A] dark:text-[#71717A]'
                  }`}
                >
                  {badge.description}
                </p>

                <p
                  className={`text-[11px] font-semibold mt-1.5 ${
                    badge.unlocked
                      ? unlockedStyle.statusText
                      : 'text-[#71717A] dark:text-[#71717A]'
                  }`}
                >
                  {badge.unlocked ? 'Unlocked' : 'Locked'}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
