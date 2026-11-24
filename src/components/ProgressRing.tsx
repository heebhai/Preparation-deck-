import { useEffect, useState } from 'react';
import { animate, useMotionValue, useReducedMotion } from 'motion/react';

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showLabel?: boolean;
  arcColorClassName?: string;
  trackColorClassName?: string;
  percentTextClassName?: string;
  valueTestId?: string;
  ariaLabel?: string;
}

export function ProgressRing({
  percent,
  size = 112,
  strokeWidth = 10,
  label = 'Overall',
  showLabel = true,
  arcColorClassName = 'text-[#5B4BC4] dark:text-[#B9ADFF]',
  trackColorClassName = 'text-[#E6E0EC] dark:text-[#2B2933]',
  percentTextClassName = 'text-2xl',
  valueTestId = 'overall-percent',
  ariaLabel,
}: ProgressRingProps) {
  const prefersReducedMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, percent));
  const [displayValue, setDisplayValue] = useState(prefersReducedMotion ? clamped : 0);
  const progressValue = useMotionValue(prefersReducedMotion ? clamped : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      progressValue.set(clamped);
      setDisplayValue(clamped);
      return;
    }

    const controls = animate(progressValue, clamped, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [clamped, prefersReducedMotion, progressValue]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (displayValue / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel ?? `${label} syllabus progress ${clamped}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={trackColorClassName}
        />
        {/* Animated progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={arcColorClassName}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={`font-display font-bold tracking-tight tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] leading-none ${percentTextClassName}`}
          data-testid={valueTestId}
        >
          {displayValue}%
        </span>
        {showLabel && (
          <span className="text-[11px] font-medium text-[#605D66] dark:text-[#AEA9B4] mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
