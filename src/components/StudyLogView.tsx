import { useState, type FormEvent } from 'react';
import {
  Calendar,
  CalendarDays,
  Check,
  Clock,
  Edit3,
  Moon,
  Plus,
  Shuffle,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { QuoteItem } from '../types/quote';
import type { StudyLogEntry } from '../types/studyLog';
import type { SubjectAccent } from '../types/syllabus';
import {
  formatDuration,
  formatStudyLogDate,
  formatStudyLogSummary,
  shiftLocalDateKey,
  sortStudyLogsNewestFirst,
} from '../utils/studyLogMath';
import { MAX_QUOTES } from '../utils/quoteMath';
import { SUBJECT_PALETTES } from '../utils/subjectTheme';

interface StudyLogViewProps {
  logs: ReadonlyArray<StudyLogEntry>;
  subjectAccents: Record<string, SubjectAccent>;
  isDark: boolean;
  onToggleTheme: () => void;
  onDeleteLog: (id: string) => void;
  onOpenLogDialog: () => void;
  quotes: ReadonlyArray<QuoteItem>;
  todayKey: string;
  onAddQuote: (text: string, author?: string) => string | null;
  onEditQuote: (id: string, text: string, author?: string) => void;
  onDeleteQuote: (id: string) => void;
  onScheduleQuote: (id: string, dateKey: string | null) => void;
  onShuffleQuotes: () => void;
  onRandomizeQuote: () => void;
}

interface SwipeableLogRowProps {
  log: StudyLogEntry;
  index: number;
  accent: SubjectAccent;
  onDelete: (id: string) => void;
}

function SwipeableLogRow({ log, index, accent, onDelete }: SwipeableLogRowProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const palette = SUBJECT_PALETTES[accent];
  const dateLabel = formatStudyLogDate(log.date);
  const durationLabel = formatDuration(log.durationMinutes);
  const summaryLabel = formatStudyLogSummary(log);

  return (
    <motion.div
      layout
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={
        prefersReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, x: -90, transition: { duration: 0.2 } }
      }
      transition={{
        duration: 0.26,
        delay: prefersReducedMotion ? 0 : Math.min(index, 8) * 0.035,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative overflow-hidden rounded-2xl"
      data-testid={`study-log-item-${log.id}`}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-end px-5 rounded-2xl transition-colors ${
          isDraggingLeft
            ? 'bg-[#B3261E] text-white dark:bg-[#931C16] dark:text-white'
            : 'bg-[#FCE8E6] text-[#B3261E] dark:bg-[#3A1C1B] dark:text-[#F2B8B5]'
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </div>
      </div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -120, right: 0 }}
        dragSnapToOrigin
        dragElastic={{ left: 0.18, right: 0 }}
        onDrag={(_, info) => {
          setIsDraggingLeft(info.offset.x < -72);
        }}
        onDragEnd={(_, info) => {
          setIsDraggingLeft(false);
          if (info.offset.x < -72 || info.velocity.x < -380) {
            onDelete(log.id);
          }
        }}
        className="relative z-10 flex items-center justify-between gap-3 rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] px-4 py-3.5 sm:px-5 cursor-grab active:cursor-grabbing touch-pan-y"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${palette.iconBg} ${palette.iconText}`}
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p
              className="font-display text-sm sm:text-[15px] font-semibold text-[#1C1B1F] dark:text-[#F4EFF4] leading-snug"
              data-testid={`study-log-text-${log.id}`}
            >
              {dateLabel} - {summaryLabel}{' '}
              <span className={`tabular-nums ${palette.accentText}`}>
                - {durationLabel}
              </span>
            </p>
            <p className="text-xs text-[#605D66] dark:text-[#AEA9B4] mt-0.5">
              Swipe left to delete
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDelete(log.id)}
          aria-label={`Delete ${dateLabel} ${log.subjectName} ${durationLabel}`}
          data-testid={`delete-log-${log.id}`}
          className="w-11 h-11 -mr-1 rounded-full flex items-center justify-center text-[#79747E] dark:text-[#938F99] hover:text-[#B3261E] dark:hover:text-[#F2B8B5] hover:bg-[#FCE8E6]/70 dark:hover:bg-[#3A1C1B]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B3261E] transition-colors shrink-0 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </motion.div>
    </motion.div>
  );
}

export function StudyLogView({
  logs,
  subjectAccents,
  isDark,
  onToggleTheme,
  onDeleteLog,
  onOpenLogDialog,
  quotes,
  todayKey,
  onAddQuote,
  onEditQuote,
  onDeleteQuote,
  onScheduleQuote,
  onShuffleQuotes,
  onRandomizeQuote,
}: StudyLogViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const sortedLogs = sortStudyLogsNewestFirst(logs);
  const totalMinutes = sortedLogs.reduce((sum, item) => sum + item.durationMinutes, 0);

  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [schedulingQuoteId, setSchedulingQuoteId] = useState<string | null>(null);
  const [customDateDraft, setCustomDateDraft] = useState<string>(todayKey);

  const tomorrowKey = shiftLocalDateKey(todayKey, 1);

  const handleAddQuoteSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = onAddQuote(newQuoteText, newQuoteAuthor);
    if (err) {
      setQuoteError(err);
      return;
    }
    setNewQuoteText('');
    setNewQuoteAuthor('');
    setQuoteError(null);
  };

  const handleChooseForDate = (targetDateKey: string) => {
    if (quotes.length === 0) return;
    if (schedulingQuoteId) {
      onScheduleQuote(schedulingQuoteId, targetDateKey);
      return;
    }
    const pool = quotes.filter((q) => q.scheduledDateKey !== targetDateKey);
    const source = pool.length > 0 ? pool : quotes;
    const picked = source[Math.floor(Math.random() * source.length)];
    onScheduleQuote(picked.id, targetDateKey);
  };

  return (
    <motion.div
      key="study-log-view"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen flex flex-col"
    >
      <header className="sticky top-0 z-30 pt-safe backdrop-blur-md bg-[#FAF8FC]/88 dark:bg-[#121318]/88 border-b border-[#E6E0EC]/80 dark:border-[#26252E]/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] whitespace-nowrap">
            Study Log
          </h1>

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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 pb-28 space-y-6">
        {/* Logged Sessions Section */}
        <section aria-label="Logged study sessions" className="space-y-4">
          <div className="flex items-center justify-between gap-3 px-0.5">
            <div>
              <h2 className="font-display text-base font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
                Logged Sessions
              </h2>
              <p
                className="text-xs text-[#605D66] dark:text-[#AEA9B4] mt-0.5 tabular-nums"
                data-testid="study-log-summary"
              >
                {sortedLogs.length} {sortedLogs.length === 1 ? 'session' : 'sessions'}{' '}
                <span aria-hidden="true" className="mx-1 opacity-50">·</span>{' '}
                {formatDuration(totalMinutes)} total
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenLogDialog}
              data-testid="log-study-from-history-button"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-[#EFEBF5] dark:bg-[#252333] text-xs sm:text-sm font-semibold text-[#5B4BC4] dark:text-[#C4BAFF] hover:bg-[#E4DFF0] dark:hover:bg-[#312E42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add Time</span>
            </button>
          </div>

          {sortedLogs.length > 0 ? (
            <div className="space-y-3" data-testid="study-log-list">
              <AnimatePresence initial={false}>
                {sortedLogs.map((log, index) => (
                  <SwipeableLogRow
                    key={log.id}
                    log={log}
                    index={index}
                    accent={subjectAccents[log.subjectId] ?? 'mint'}
                    onDelete={onDeleteLog}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div
              data-testid="study-log-empty-state"
              className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] px-6 py-10 text-center space-y-3"
            >
              <p className="font-display text-base font-semibold text-[#1C1B1F] dark:text-[#F4EFF4]">
                No study sessions logged yet
              </p>
              <p className="text-sm text-[#605D66] dark:text-[#AEA9B4]">
                Tap below to log your first study session.
              </p>
              <button
                type="button"
                onClick={onOpenLogDialog}
                className="inline-flex items-center justify-center min-h-[44px] px-5 py-2 rounded-xl bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559] text-sm font-semibold hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-opacity cursor-pointer"
              >
                Log Study Time
              </button>
            </div>
          )}
        </section>

        {/* Quote Manager Section */}
        <section
          aria-label="Quote Manager"
          data-testid="quote-manager-section"
          className="space-y-4 pt-5 border-t border-[#E6E0EC] dark:border-[#2D2B36]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-0.5">
            <div>
              <h2 className="font-display text-base font-semibold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#5B4BC4] dark:text-[#C4BAFF]" aria-hidden="true" />
                <span>Quote Manager</span>
              </h2>
              <p
                data-testid="quote-count-summary"
                className="text-xs text-[#605D66] dark:text-[#AEA9B4] mt-0.5 tabular-nums"
              >
                {quotes.length}/{MAX_QUOTES} quotes · Tap any quote to schedule it for a specific date
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onShuffleQuotes}
                data-testid="quote-shuffle-button"
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl bg-[#EFEBF5] dark:bg-[#252333] text-xs font-semibold text-[#5B4BC4] dark:text-[#C4BAFF] hover:bg-[#E4DFF0] dark:hover:bg-[#312E42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Shuffle</span>
              </button>

              <button
                type="button"
                onClick={onRandomizeQuote}
                data-testid="quote-randomize-button"
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl bg-[#EFEBF5] dark:bg-[#252333] text-xs font-semibold text-[#5B4BC4] dark:text-[#C4BAFF] hover:bg-[#E4DFF0] dark:hover:bg-[#312E42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Randomize</span>
              </button>

              <button
                type="button"
                onClick={() => handleChooseForDate(todayKey)}
                data-testid="quote-choose-today-button"
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559] text-xs font-semibold hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-opacity cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Choose for Today</span>
              </button>

              <button
                type="button"
                onClick={() => handleChooseForDate(tomorrowKey)}
                data-testid="quote-choose-tomorrow-button"
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl bg-[#EFEBF5] dark:bg-[#252333] text-xs font-semibold text-[#5B4BC4] dark:text-[#C4BAFF] hover:bg-[#E4DFF0] dark:hover:bg-[#312E42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Choose for Tomorrow</span>
              </button>
            </div>
          </div>

          {/* Add New Quote Form */}
          <form
            onSubmit={handleAddQuoteSubmit}
            className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] p-4 sm:p-5 space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#605D66] dark:text-[#AEA9B4]">
              Add New Quote (Max {MAX_QUOTES})
            </h3>
            {quoteError && (
              <p className="text-xs font-medium text-[#B3261E] dark:text-[#F2B8B5]" role="alert">
                {quoteError}
              </p>
            )}
            <div className="space-y-3">
              <label htmlFor="quote-input-text" className="sr-only">
                Motivational quote text
              </label>
              <textarea
                id="quote-input-text"
                value={newQuoteText}
                onChange={(e) => {
                  setNewQuoteText(e.target.value);
                  if (quoteError) setQuoteError(null);
                }}
                placeholder="Enter motivational quote..."
                rows={2}
                data-testid="quote-input-text"
                className="w-full rounded-xl border border-[#E4DFF0] dark:border-[#2C2A38] bg-[#F9F8FC] dark:bg-[#14131A] px-3.5 py-2.5 text-sm text-[#1C1B1F] dark:text-[#F4EFF4] placeholder:text-[#79747E] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]"
              />
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="quote-input-author" className="sr-only">
                  Quote author
                </label>
                <input
                  id="quote-input-author"
                  type="text"
                  value={newQuoteAuthor}
                  onChange={(e) => setNewQuoteAuthor(e.target.value)}
                  placeholder="Author (optional)"
                  data-testid="quote-input-author"
                  className="flex-1 min-h-[42px] rounded-xl border border-[#E4DFF0] dark:border-[#2C2A38] bg-[#F9F8FC] dark:bg-[#14131A] px-3.5 py-2 text-sm text-[#1C1B1F] dark:text-[#F4EFF4] placeholder:text-[#79747E] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]"
                />
                <button
                  type="submit"
                  disabled={quotes.length >= MAX_QUOTES}
                  data-testid="quote-add-submit"
                  className="inline-flex items-center justify-center min-h-[42px] px-5 py-2 rounded-xl bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559] text-sm font-semibold hover:opacity-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-opacity cursor-pointer shrink-0"
                >
                  Add Quote
                </button>
              </div>
            </div>
          </form>

          {/* Quotes List */}
          <div className="space-y-3" data-testid="quote-manager-list">
            {quotes.map((quote) => {
              const isEditing = editingQuoteId === quote.id;
              const isScheduling = schedulingQuoteId === quote.id;
              const isScheduledToday = quote.scheduledDateKey === todayKey;
              const isScheduledTomorrow = quote.scheduledDateKey === tomorrowKey;

              return (
                <article
                  key={quote.id}
                  data-testid={`quote-item-${quote.id}`}
                  className={`rounded-2xl border bg-white dark:bg-[#1B1A20] p-4 sm:p-5 space-y-3 transition-colors ${
                    isScheduling
                      ? 'border-[#5B4BC4] dark:border-[#B9ADFF]'
                      : 'border-[#E6E0EC] dark:border-[#2D2B36]'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        aria-label="Edit quote text"
                        rows={2}
                        className="w-full rounded-xl border border-[#E4DFF0] dark:border-[#2C2A38] bg-[#F9F8FC] dark:bg-[#14131A] px-3.5 py-2 text-sm text-[#1C1B1F] dark:text-[#F4EFF4] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]"
                      />
                      <input
                        type="text"
                        value={editAuthor}
                        onChange={(e) => setEditAuthor(e.target.value)}
                        aria-label="Edit quote author"
                        placeholder="Author"
                        className="w-full min-h-[40px] rounded-xl border border-[#E4DFF0] dark:border-[#2C2A38] bg-[#F9F8FC] dark:bg-[#14131A] px-3.5 py-2 text-sm text-[#1C1B1F] dark:text-[#F4EFF4] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingQuoteId(null)}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#605D66] dark:text-[#AEA9B4] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onEditQuote(quote.id, editText, editAuthor);
                            setEditingQuoteId(null);
                          }}
                          className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559] text-xs font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (isScheduling) {
                              setSchedulingQuoteId(null);
                            } else {
                              setSchedulingQuoteId(quote.id);
                              setCustomDateDraft(quote.scheduledDateKey || todayKey);
                            }
                          }}
                          aria-expanded={isScheduling}
                          aria-label={`Schedule quote: ${quote.text}`}
                          className="space-y-1.5 min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] rounded-lg cursor-pointer"
                        >
                          <p className="font-display text-sm sm:text-base font-semibold text-[#1C1B1F] dark:text-[#F4EFF4] leading-relaxed">
                            &ldquo;{quote.text}&rdquo;
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {quote.author && (
                              <span className="text-xs font-medium text-[#605D66] dark:text-[#AEA9B4]">
                                — {quote.author}
                              </span>
                            )}
                            {quote.scheduledDateKey && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  isScheduledToday
                                    ? 'bg-[#166534]/10 text-[#166534] dark:bg-[#34D399]/15 dark:text-[#34D399]'
                                    : 'bg-[#5B4BC4]/10 text-[#5B4BC4] dark:bg-[#C4BAFF]/15 dark:text-[#C4BAFF]'
                                }`}
                              >
                                <Calendar className="w-3 h-3" aria-hidden="true" />
                                {isScheduledToday
                                  ? 'Scheduled for Today'
                                  : isScheduledTomorrow
                                    ? 'Scheduled for Tomorrow'
                                    : `Scheduled: ${formatStudyLogDate(quote.scheduledDateKey)}`}
                              </span>
                            )}
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (isScheduling) {
                                setSchedulingQuoteId(null);
                              } else {
                                setSchedulingQuoteId(quote.id);
                                setCustomDateDraft(quote.scheduledDateKey || todayKey);
                              }
                            }}
                            aria-label={`Assign date for quote by ${quote.author || 'Unknown'}`}
                            title="Schedule for a date"
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                              isScheduling || quote.scheduledDateKey
                                ? 'bg-[#5B4BC4]/12 text-[#5B4BC4] dark:bg-[#C4BAFF]/15 dark:text-[#C4BAFF]'
                                : 'text-[#605D66] dark:text-[#AEA9B4] hover:bg-black/5 dark:hover:bg-white/10'
                            }`}
                          >
                            <Calendar className="w-4 h-4" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuoteId(quote.id);
                              setEditText(quote.text);
                              setEditAuthor(quote.author ?? '');
                            }}
                            aria-label={`Edit quote by ${quote.author || 'Unknown'}`}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#605D66] dark:text-[#AEA9B4] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteQuote(quote.id)}
                            aria-label={`Delete quote by ${quote.author || 'Unknown'}`}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#B3261E] dark:text-[#F2B8B5] hover:bg-[#B3261E]/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {isScheduling && (
                        <div
                          data-testid={`quote-schedule-panel-${quote.id}`}
                          className="pt-3 border-t border-[#ECE7F3] dark:border-[#2C2A38] flex flex-wrap items-center gap-2"
                        >
                          <label
                            htmlFor={`quote-date-${quote.id}`}
                            className="text-xs font-semibold text-[#605D66] dark:text-[#AEA9B4]"
                          >
                            Show on date:
                          </label>
                          <input
                            id={`quote-date-${quote.id}`}
                            type="date"
                            value={customDateDraft}
                            onChange={(e) => setCustomDateDraft(e.target.value)}
                            className="min-h-[38px] rounded-xl border border-[#DFD9EE] dark:border-[#343144] bg-[#FAF8FC] dark:bg-[#15141B] px-3 py-1 text-xs font-medium text-[#1C1B1F] dark:text-[#F4EFF4] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customDateDraft) {
                                onScheduleQuote(quote.id, customDateDraft);
                                setSchedulingQuoteId(null);
                              }
                            }}
                            className="inline-flex items-center gap-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559] text-xs font-semibold cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Assign Date</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onScheduleQuote(quote.id, todayKey);
                              setSchedulingQuoteId(null);
                            }}
                            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#EFEBF5] dark:bg-[#252333] text-xs font-semibold text-[#5B4BC4] dark:text-[#C4BAFF] cursor-pointer"
                          >
                            Today
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onScheduleQuote(quote.id, tomorrowKey);
                              setSchedulingQuoteId(null);
                            }}
                            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#EFEBF5] dark:bg-[#252333] text-xs font-semibold text-[#5B4BC4] dark:text-[#C4BAFF] cursor-pointer"
                          >
                            Tomorrow
                          </button>
                          {quote.scheduledDateKey && (
                            <button
                              type="button"
                              onClick={() => {
                                onScheduleQuote(quote.id, null);
                                setSchedulingQuoteId(null);
                              }}
                              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold text-[#B3261E] dark:text-[#F2B8B5] hover:bg-[#B3261E]/10 cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </motion.div>
  );
}
