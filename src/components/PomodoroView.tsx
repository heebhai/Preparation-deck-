import { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Coffee,
  Flame,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sun,
  Timer,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { MilestoneKey, Subject } from '../types/syllabus';
import {
  clampFocusMinutes,
  FOCUS_PRESET_MINUTES,
  formatCountdown,
  getChaptersForSubject,
  LONG_BREAK_MINUTES,
  SHORT_BREAK_MINUTES,
  type PomodoroMode,
} from '../utils/pomodoroMath';
import { formatDuration } from '../utils/studyLogMath';
import { SUBJECT_PALETTES } from '../utils/subjectTheme';
import { MILESTONE_ITEMS } from '../utils/syllabusMath';

export interface PomodoroState {
  mode: PomodoroMode;
  focusMinutes: number;
  plannedMinutes: number;
  remainingSeconds: number;
  status: 'idle' | 'running' | 'paused';
  subjectId: string;
  chapterId: string;
  selectedTasks: MilestoneKey[];
  lastAutoLoggedMessage: string | null;
  completedFocusSessionsToday: number;
}

interface PomodoroViewProps {
  subjects: ReadonlyArray<Subject>;
  state: PomodoroState;
  isDark: boolean;
  onToggleTheme: () => void;
  onSelectMode: (mode: PomodoroMode) => void;
  onSetFocusMinutes: (minutes: number) => void;
  onSelectSubject: (subjectId: string) => void;
  onSelectChapter: (chapterId: string) => void;
  onToggleTask: (task: MilestoneKey) => void;
  onStartOrResume: () => void;
  onPause: () => void;
  onReset: () => void;
  onFinishEarlyAndLog: () => void;
}

export function PomodoroView({
  subjects,
  state,
  isDark,
  onToggleTheme,
  onSelectMode,
  onSetFocusMinutes,
  onSelectSubject,
  onSelectChapter,
  onToggleTask,
  onStartOrResume,
  onPause,
  onReset,
  onFinishEarlyAndLog,
}: PomodoroViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [customMinutesInput, setCustomMinutesInput] = useState(
    String(state.focusMinutes),
  );

  const selectedSubject =
    subjects.find((s) => s.id === state.subjectId) ?? subjects[0];
  const palette = SUBJECT_PALETTES[selectedSubject?.accent ?? 'mint'];

  const chapterOptions = useMemo(
    () => getChaptersForSubject(selectedSubject),
    [selectedSubject],
  );
  const selectedChapter =
    chapterOptions.find((c) => c.chapterId === state.chapterId) ??
    chapterOptions[0];

  const totalSeconds = Math.max(60, state.plannedMinutes * 60);
  const elapsedSeconds = Math.max(0, totalSeconds - state.remainingSeconds);
  const progressFraction = Math.max(
    0,
    Math.min(1, state.remainingSeconds / totalSeconds),
  );

  // SVG countdown ring geometry
  const ringSize = 236;
  const strokeWidth = 12;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progressFraction);

  const isLockedDuringRun = state.status !== 'idle';
  const canFinishEarly =
    state.mode === 'focus' &&
    state.status !== 'idle' &&
    elapsedSeconds >= 60;

  const modeTitle =
    state.mode === 'focus'
      ? 'Focus Session'
      : state.mode === 'short-break'
        ? 'Short Break'
        : 'Long Break';

  const statusLabel =
    state.status === 'running'
      ? state.mode === 'focus'
        ? 'Focusing live'
        : 'Resting'
      : state.status === 'paused'
        ? 'Paused'
        : 'Ready';

  const handleApplyCustomMinutes = () => {
    const parsed = Number(customMinutesInput);
    const clamped = clampFocusMinutes(parsed);
    setCustomMinutesInput(String(clamped));
    onSetFocusMinutes(clamped);
  };

  return (
    <motion.div
      key="pomodoro-view"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen flex flex-col"
    >
      {/* Compact Sticky Top Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#FAF8FC]/88 dark:bg-[#121318]/88 border-b border-[#E6E0EC]/80 dark:border-[#26252E]/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-xl font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] whitespace-nowrap">
              Focus Timer
            </h1>
            {state.completedFocusSessionsToday > 0 && (
              <span
                data-testid="pomodoro-completed-count"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFEBF5] text-[#5B4BC4] dark:bg-[#272436] dark:text-[#C4BAFF] tabular-nums"
              >
                <Flame className="w-3 h-3" aria-hidden="true" />
                {state.completedFocusSessionsToday} today
              </span>
            )}
          </div>

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
        {/* Auto-log Confirmation Banner */}
        {state.lastAutoLoggedMessage && (
          <div
            role="status"
            data-testid="pomodoro-autolog-banner"
            className="rounded-2xl border border-[#86EFAC] dark:border-[#34D399]/50 bg-[#DCFCE7] dark:bg-[#123524] px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#15803D] dark:text-[#6EE7B7]"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{state.lastAutoLoggedMessage}</span>
          </div>
        )}

        {/* Mode Segmented Control */}
        <div className="flex justify-center">
          <div
            role="tablist"
            aria-label="Pomodoro timer mode"
            className="inline-flex p-1 rounded-2xl bg-[#EFEBF5] dark:bg-[#1E1C28] border border-[#E4DFF0] dark:border-[#2D2B3A]"
          >
            {(
              [
                { id: 'focus', label: 'Focus', icon: Timer },
                { id: 'short-break', label: `Break ${SHORT_BREAK_MINUTES}m`, icon: Coffee },
                { id: 'long-break', label: `Long ${LONG_BREAK_MINUTES}m`, icon: Coffee },
              ] as const
            ).map(({ id, label, icon: Icon }) => {
              const active = state.mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectMode(id)}
                  data-testid={`pomodoro-mode-${id}`}
                  className={`relative inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'text-white dark:text-[#1F1559]'
                      : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-[#F4EFF4]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="pomodoro-mode-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-[#5B4BC4] dark:bg-[#C4BAFF] z-0"
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" aria-hidden="true" />
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Countdown Hero Card */}
          <section
            aria-label="Live Pomodoro timer"
            className="lg:col-span-6 rounded-2xl border border-[#E4DFF0] dark:border-[#2A2836] bg-[#F3EFFA] dark:bg-[#1B1A24] p-6 flex flex-col items-center text-center space-y-5"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5B4BC4] dark:text-[#C4BAFF]">
                {modeTitle} · {statusLabel}
              </p>
              {state.mode === 'focus' && selectedSubject && (
                <p
                  className="text-sm font-medium text-[#49454F] dark:text-[#CAC4D0] truncate max-w-xs"
                  data-testid="pomodoro-active-target"
                >
                  {selectedSubject.name}
                  {selectedChapter ? ` · ${selectedChapter.chapterName}` : ''}
                </p>
              )}
            </div>

            {/* Circular Countdown Ring */}
            <div
              className="relative inline-flex items-center justify-center"
              style={{ width: ringSize, height: ringSize }}
              role="timer"
              aria-live="off"
              aria-label={`${modeTitle} remaining ${formatCountdown(state.remainingSeconds)}`}
            >
              <svg
                width={ringSize}
                height={ringSize}
                viewBox={`0 0 ${ringSize} ${ringSize}`}
                className="-rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className={
                    state.mode === 'focus'
                      ? palette.ringTrack
                      : 'text-[#DCE6DF] dark:text-[#26382E]'
                  }
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className={`transition-[stroke-dashoffset] duration-300 ${
                    state.mode === 'focus'
                      ? palette.ringStroke
                      : 'text-[#2B7A58] dark:text-[#7AD9AE]'
                  }`}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
                <span
                  data-testid="pomodoro-countdown"
                  className="font-display text-5xl font-extrabold tracking-tight tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4]"
                >
                  {formatCountdown(state.remainingSeconds)}
                </span>
                <span className="text-xs font-medium text-[#605D66] dark:text-[#AEA9B4] mt-1.5 tabular-nums">
                  {state.mode === 'focus'
                    ? `${formatDuration(state.plannedMinutes)} auto-logs on finish`
                    : `${state.plannedMinutes}m break`}
                </span>
              </div>
            </div>

            {/* Duration Presets (Focus Mode & Idle Only) */}
            {state.mode === 'focus' && (
              <div className="w-full space-y-2.5">
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {FOCUS_PRESET_MINUTES.map((mins) => {
                    const active = state.focusMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        disabled={isLockedDuringRun}
                        onClick={() => {
                          setCustomMinutesInput(String(mins));
                          onSetFocusMinutes(mins);
                        }}
                        data-testid={`pomodoro-preset-${mins}`}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${
                          active
                            ? 'bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559]'
                            : 'bg-white/80 dark:bg-[#14131A] text-[#49454F] dark:text-[#CAC4D0] border border-[#DFD9EC] dark:border-[#2E2C3A] hover:border-[#5B4BC4]'
                        }`}
                      >
                        {mins}m
                      </button>
                    );
                  })}

                  <div className="inline-flex items-center gap-1 ml-1">
                    <label htmlFor="pomodoro-custom-minutes" className="sr-only">
                      Custom focus minutes
                    </label>
                    <input
                      id="pomodoro-custom-minutes"
                      type="number"
                      min={1}
                      max={180}
                      disabled={isLockedDuringRun}
                      value={customMinutesInput}
                      onChange={(e) => setCustomMinutesInput(e.target.value)}
                      onBlur={handleApplyCustomMinutes}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCustomMinutes();
                        }
                      }}
                      data-testid="pomodoro-custom-minutes-input"
                      className="w-14 h-8 rounded-lg border border-[#D8D2E5] dark:border-[#343242] bg-white dark:bg-[#14131A] px-2 text-center text-xs font-semibold tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] disabled:opacity-50"
                    />
                    <span className="text-[11px] text-[#605D66] dark:text-[#AEA9B4]">min</span>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full pt-1">
              <button
                type="button"
                onClick={state.status === 'running' ? onPause : onStartOrResume}
                data-testid="pomodoro-toggle-button"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-2.5 rounded-2xl text-sm font-bold bg-[#5B4BC4] text-white hover:bg-[#4D3EB3] dark:bg-[#C4BAFF] dark:text-[#1F1559] dark:hover:bg-[#D5CEFF] shadow-md shadow-[#5B4BC4]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors cursor-pointer"
              >
                {state.status === 'running' ? (
                  <>
                    <Pause className="w-4 h-4" aria-hidden="true" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {state.status === 'paused'
                        ? 'Resume'
                        : state.mode === 'focus'
                          ? 'Start Focus'
                          : 'Start Break'}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onReset}
                aria-label="Reset timer"
                data-testid="pomodoro-reset-button"
                className="inline-flex items-center justify-center gap-1.5 min-h-[48px] px-4 py-2.5 rounded-2xl text-sm font-semibold bg-white/85 dark:bg-[#14131A] text-[#49454F] dark:text-[#CAC4D0] border border-[#DDD7E8] dark:border-[#302E3D] hover:bg-white dark:hover:bg-[#23212E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Reset</span>
              </button>

              {canFinishEarly && (
                <button
                  type="button"
                  onClick={onFinishEarlyAndLog}
                  data-testid="pomodoro-finish-early-button"
                  className="inline-flex items-center justify-center gap-1.5 min-h-[48px] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-[#DCFCE7] text-[#15803D] dark:bg-[#143D29] dark:text-[#6EE7B7] border border-[#86EFAC] dark:border-[#34D399]/50 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Finish &amp; Log</span>
                </button>
              )}
            </div>
          </section>

          {/* Subject & Chapter Selection Card */}
          <section
            aria-label="Focus subject and chapter"
            className="lg:col-span-6 rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${palette.iconBg} ${palette.iconText}`}
                >
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
                    Study Target
                  </h2>
                  <p className="text-xs text-[#605D66] dark:text-[#AEA9B4]">
                    Auto-logs to Daily Stats &amp; Study Log when complete
                  </p>
                </div>
              </div>
            </div>

            {/* Subject Selection */}
            <div className="space-y-1.5">
              <label
                htmlFor="pomodoro-subject-select"
                className="block text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0]"
              >
                Subject
              </label>
              <select
                id="pomodoro-subject-select"
                value={selectedSubject?.id ?? ''}
                disabled={isLockedDuringRun}
                onChange={(e) => onSelectSubject(e.target.value)}
                data-testid="pomodoro-subject-select"
                className="w-full min-h-[46px] rounded-2xl border border-[#D8D2E5] dark:border-[#343242] bg-[#FAF8FC] dark:bg-[#14131A] px-3.5 py-2.5 text-sm font-medium text-[#1C1B1F] dark:text-[#F4EFF4] focus:border-[#5B4BC4] dark:focus:border-[#B9ADFF] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]/20 disabled:opacity-60"
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Selection */}
            <div className="space-y-1.5">
              <label
                htmlFor="pomodoro-chapter-select"
                className="block text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0]"
              >
                Chapter
              </label>
              <select
                id="pomodoro-chapter-select"
                value={selectedChapter?.chapterId ?? ''}
                disabled={isLockedDuringRun}
                onChange={(e) => onSelectChapter(e.target.value)}
                data-testid="pomodoro-chapter-select"
                className="w-full min-h-[46px] rounded-2xl border border-[#D8D2E5] dark:border-[#343242] bg-[#FAF8FC] dark:bg-[#14131A] px-3.5 py-2.5 text-sm font-medium text-[#1C1B1F] dark:text-[#F4EFF4] focus:border-[#5B4BC4] dark:focus:border-[#B9ADFF] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]/20 disabled:opacity-60"
              >
                {chapterOptions.map((option) => (
                  <option key={option.chapterId} value={option.chapterId}>
                    {selectedSubject && selectedSubject.subSubjects.length > 1
                      ? `${option.subSubjectName} — ${option.chapterName}`
                      : option.chapterName}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Task Auto-Check Selection */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0]">
                  Tasks to auto-check on completion
                </span>
                <span className="text-[11px] text-[#605D66] dark:text-[#AEA9B4]">
                  Optional
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {MILESTONE_ITEMS.map(({ key, label }) => {
                  const active = state.selectedTasks.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={isLockedDuringRun}
                      aria-pressed={active}
                      onClick={() => onToggleTask(key)}
                      data-testid={`pomodoro-task-${key}`}
                      className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors disabled:opacity-60 cursor-pointer ${
                        active
                          ? 'bg-[#DCFCE7] border-[#4ADE80] text-[#15803D] dark:bg-[#143D29] dark:border-[#34D399] dark:text-[#6EE7B7]'
                          : 'bg-[#FAF8FC] border-[#DDD7E8] text-[#49454F] dark:bg-[#14131A] dark:border-[#333142] dark:text-[#CAC4D0] hover:border-[#5B4BC4]'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                          active
                            ? 'bg-[#16A34A] border-[#16A34A] text-white dark:bg-[#34D399] dark:border-[#34D399] dark:text-[#052E16]'
                            : 'border-[#9B95A8] dark:border-[#5E5A70]'
                        }`}
                      >
                        {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>
    </motion.div>
  );
}
