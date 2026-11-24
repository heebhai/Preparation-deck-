import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import type { DailyBarPoint } from '../utils/dailyStatsMath';
import { formatDuration } from '../utils/studyLogMath';

interface Last7DaysBarChartProps {
  series: ReadonlyArray<DailyBarPoint>;
  isDark: boolean;
  selectedDateKey?: string;
}

export function Last7DaysBarChart({ series, isDark, selectedDateKey }: Last7DaysBarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    let animationFrameId = 0;
    let progress = prefersReducedMotion ? 1 : 0;
    const startTime = performance.now();
    const duration = 550;

    const draw = (t: number) => {
      const width = container.clientWidth;
      if (width <= 0) {
        return;
      }
      const height = 188;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const padTop = 26;
      const padBottom = 32;
      const padX = 8;
      const chartWidth = width - padX * 2;
      const chartHeight = height - padTop - padBottom;

      const maxMinutes = Math.max(
        60,
        ...series.map((p) => p.totalMinutes),
      );
      const niceMax = Math.ceil(maxMinutes / 30) * 30;

      // Subtle horizontal reference lines
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(28,27,31,0.07)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (const frac of [0.5, 1]) {
        const y = padTop + chartHeight * (1 - frac);
        ctx.beginPath();
        ctx.moveTo(padX, y);
        ctx.lineTo(width - padX, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Baseline
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(28,27,31,0.12)';
      ctx.beginPath();
      ctx.moveTo(padX, padTop + chartHeight);
      ctx.lineTo(width - padX, padTop + chartHeight);
      ctx.stroke();

      const slotWidth = chartWidth / Math.max(series.length, 1);
      const barWidth = Math.min(34, Math.max(18, slotWidth * 0.52));

      series.forEach((point, idx) => {
        const isHighlighted = selectedDateKey ? point.dateKey === selectedDateKey : point.isToday;
        const cx = padX + slotWidth * idx + slotWidth / 2;
        const x = cx - barWidth / 2;
        const targetHeight =
          point.totalMinutes <= 0 ? 4 : Math.max(8, (point.totalMinutes / niceMax) * chartHeight);
        const currentHeight = targetHeight * t;
        const y = padTop + chartHeight - currentHeight;

        const radius = Math.min(8, barWidth / 2, currentHeight / 2);

        if (point.totalMinutes === 0) {
          ctx.fillStyle = isDark ? '#2B2938' : '#E7E2F0';
        } else if (isHighlighted) {
          ctx.fillStyle = isDark ? '#B9ADFF' : '#5B4BC4';
        } else {
          ctx.fillStyle = isDark ? '#544B82' : '#BEB5EA';
        }

        // Draw rounded-top bar
        ctx.beginPath();
        ctx.moveTo(x, padTop + chartHeight);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, padTop + chartHeight);
        ctx.closePath();
        ctx.fill();

        // Value label above non-zero bars
        if (point.totalMinutes > 0 && t > 0.7) {
          ctx.fillStyle = isHighlighted
            ? isDark
              ? '#D4CCFF'
              : '#4234A6'
            : isDark
              ? '#AEA9B4'
              : '#605D66';
          ctx.font = '600 10px "DM Sans", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(formatDuration(point.totalMinutes), cx, Math.max(12, y - 6));
        }

        // Day label below baseline
        ctx.fillStyle = isHighlighted
          ? isDark
            ? '#F4EFF4'
            : '#1C1B1F'
          : isDark
            ? '#AEA9B4'
            : '#605D66';
        ctx.font = isHighlighted
          ? '700 11px "Plus Jakarta Sans", system-ui, sans-serif'
          : '500 11px "DM Sans", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(point.isToday ? 'Today' : point.dayLabel, cx, padTop + chartHeight + 18);
      });

      ctx.restore();
    };

    const tick = (now: number) => {
      if (prefersReducedMotion) {
        progress = 1;
        draw(1);
        return;
      }
      const elapsed = now - startTime;
      const raw = Math.min(1, elapsed / duration);
      // Cubic ease-out
      progress = 1 - Math.pow(1 - raw, 3);
      draw(progress);
      if (raw < 1) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    const observer = new ResizeObserver(() => {
      draw(progress);
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [series, isDark, prefersReducedMotion, selectedDateKey]);

  const summaryAria = series
    .map((p) => `${p.isToday ? 'Today' : p.dayLabel}: ${formatDuration(p.totalMinutes)}`)
    .join(', ');

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Study time over the last 7 days. ${summaryAria}`}
        data-testid="daily-stats-bar-chart"
        className="block w-full h-[188px]"
      />
    </div>
  );
}
