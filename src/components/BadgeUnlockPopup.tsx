import { Sparkles } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { BadgeStatus } from '../utils/badgesMath';

interface BadgeUnlockPopupProps {
  badge: BadgeStatus | null;
  remainingCount: number;
  onDismiss: () => void;
}

const CONFETTI_PIECES = [
  { x: -110, y: -95, rotate: -45, color: '#FACC15', size: 10 },
  { x: 115, y: -90, rotate: 55, color: '#34D399', size: 9 },
  { x: -130, y: 12, rotate: -80, color: '#F472B6', size: 8 },
  { x: 128, y: 18, rotate: 72, color: '#60A5FA', size: 10 },
  { x: -75, y: -125, rotate: 28, color: '#FB923C', size: 8 },
  { x: 78, y: -122, rotate: -34, color: '#A78BFA', size: 9 },
  { x: -88, y: 88, rotate: 64, color: '#2DD4BF', size: 8 },
  { x: 92, y: 85, rotate: -58, color: '#FACC15', size: 9 },
  { x: 0, y: -135, rotate: 18, color: '#F87171', size: 10 },
  { x: -42, y: 105, rotate: -22, color: '#818CF8', size: 8 },
  { x: 44, y: 108, rotate: 38, color: '#4ADE80', size: 8 },
  { x: 145, y: -42, rotate: -65, color: '#FBBF24', size: 7 },
] as const;

export function BadgeUnlockPopup({
  badge,
  remainingCount,
  onDismiss,
}: BadgeUnlockPopupProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          key="badge-unlock-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="badge-unlock-title"
          data-testid="badge-unlock-popup"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
          onClick={onDismiss}
        >
          <motion.div
            key="badge-unlock-card"
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, scale: 0.85, y: 16 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.92, y: 12 }
            }
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl border border-[#FDE68A] dark:border-[#7A5816] bg-white dark:bg-[#1B1A24] p-7 text-center shadow-2xl overflow-visible"
          >
            {/* Animated Confetti Particles (re-triggers cleanly per badge) */}
            {!prefersReducedMotion && (
              <div
                key={`confetti-${badge.id}`}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
              >
                {CONFETTI_PIECES.map((piece, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ x: 0, y: 0, scale: 0.3, opacity: 1, rotate: 0 }}
                    animate={{
                      x: piece.x,
                      y: piece.y,
                      scale: [0.6, 1.15, 0.9],
                      opacity: [1, 1, 0],
                      rotate: piece.rotate * 2,
                    }}
                    transition={{
                      duration: 1.15,
                      delay: idx * 0.02,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      width: piece.size,
                      height: piece.size * 0.65,
                      backgroundColor: piece.color,
                    }}
                    className="absolute rounded-xs"
                  />
                ))}
              </div>
            )}

            {/* Glowing Medal (re-triggers spring per badge) */}
            <div
              key={`medal-${badge.id}`}
              className="relative mx-auto w-24 h-24 flex items-center justify-center mb-4"
            >
              {!prefersReducedMotion && (
                <motion.div
                  aria-hidden="true"
                  animate={{
                    scale: [1, 1.18, 1],
                    opacity: [0.45, 0.8, 0.45],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FACC15]/50 via-[#FB923C]/40 to-[#A78BFA]/50 blur-md"
                />
              )}
              <motion.div
                initial={prefersReducedMotion ? undefined : { rotate: -18, scale: 0.55 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A] to-[#F59E0B] dark:from-[#4B360C] dark:via-[#785716] dark:to-[#B45309] border-4 border-white dark:border-[#1B1A24] shadow-xl flex items-center justify-center text-4xl"
              >
                <span aria-hidden="true">{badge.emoji}</span>
              </motion.div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] dark:bg-[#3B2E12] text-[#B45309] dark:text-[#FCD34D] text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Badge Unlocked!</span>
            </div>

            <h3
              id="badge-unlock-title"
              className="font-display text-2xl font-extrabold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]"
            >
              {badge.title}
            </h3>

            <p className="text-sm text-[#49454F] dark:text-[#CAC4D0] mt-1.5">
              {badge.description}
            </p>

            <button
              type="button"
              onClick={onDismiss}
              data-testid="badge-unlock-dismiss"
              className="mt-6 w-full min-h-[46px] rounded-2xl bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559] font-display text-sm font-bold shadow-md shadow-[#5B4BC4]/25 hover:bg-[#4B3BB4] dark:hover:bg-[#D5CEFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors cursor-pointer"
            >
              {remainingCount > 1 ? `Next Badge (${remainingCount - 1} left)` : 'Keep Grinding!'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
