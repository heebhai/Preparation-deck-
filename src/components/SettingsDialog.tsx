import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Download,
  HardDriveDownload,
  Moon,
  RotateCcw,
  Settings,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { BoardExamSettings } from '../types/examCountdown';
import {
  createDefaultBoardExamSettings,
  evaluateExamCountdown,
  formatExamDisplayDate,
  validateExamDateKey,
} from '../utils/examCountdownMath';
import { getLocalDateKey } from '../utils/studyLogMath';

interface SettingsDialogProps {
  isOpen: boolean;
  examSettings: BoardExamSettings;
  isDark: boolean;
  onToggleTheme: () => void;
  onClose: () => void;
  onSaveExamSettings: (nextSettings: BoardExamSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (rawJson: string) => string | null;
}

export function SettingsDialog({
  isOpen,
  examSettings,
  isDark,
  onToggleTheme,
  onClose,
  onSaveExamSettings,
  onExportBackup,
  onImportBackup,
}: SettingsDialogProps) {
  const prefersReducedMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dateInput, setDateInput] = useState<string>(examSettings.examDateKey);
  const [isCustomDraft, setIsCustomDraft] = useState<boolean>(examSettings.isCustom);
  const [error, setError] = useState<string | null>(null);
  const [backupStatusMessage, setBackupStatusMessage] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setDateInput(examSettings.examDateKey);
      setIsCustomDraft(examSettings.isCustom);
      setError(null);
      setBackupStatusMessage(null);
      setBackupError(null);
      setIsImporting(false);
    }
  }, [isOpen, examSettings]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const todayKey = getLocalDateKey();
  const defaultSettings = createDefaultBoardExamSettings(todayKey);
  const validationPreview = validateExamDateKey(dateInput);
  const previewSummary = validationPreview.valid
    ? evaluateExamCountdown(
        { examDateKey: validationPreview.dateKey, isCustom: isCustomDraft },
        todayKey,
      )
    : null;

  const handleResetDefault = () => {
    setDateInput(defaultSettings.examDateKey);
    setIsCustomDraft(false);
    setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateExamDateKey(dateInput);
    if (result.valid === false) {
      setError(result.error);
      return;
    }
    onSaveExamSettings({
      examDateKey: result.dateKey,
      isCustom: isCustomDraft,
    });
    onClose();
  };

  const handleExportClick = () => {
    setBackupError(null);
    onExportBackup();
    setBackupStatusMessage('Backup saved successfully!');
  };

  const handleImportButtonClick = () => {
    setBackupError(null);
    setBackupStatusMessage(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsImporting(true);
    setBackupError(null);
    setBackupStatusMessage(null);
    try {
      const rawText = await file.text();
      const importErr = onImportBackup(rawText);
      if (importErr) {
        setBackupError(importErr);
      } else {
        setBackupStatusMessage('Data restored successfully!');
      }
    } catch {
      setBackupError('Unable to read the selected file. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-dialog-title"
            data-testid="settings-dialog"
            initial={
              prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 40 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 28 }
            }
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-md max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#FAF8FC] dark:bg-[#1B1A22] border border-[#E4DFF0] dark:border-[#2E2C3A] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3 border-b border-[#ECE7F4] dark:border-[#2B2936]">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#EFEBF5] dark:bg-[#282536] text-[#5B4BC4] dark:text-[#C4BAFF] flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="settings-dialog-title"
                    className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]"
                  >
                    Settings
                  </h2>
                  <p className="text-xs text-[#605D66] dark:text-[#AEA9B4]">
                    Backup &amp; restore, board exam countdown &amp; theme
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close Settings"
                className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-[#605D66] dark:text-[#AEA9B4] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 min-h-0 flex flex-col"
              noValidate
            >
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Backup & Restore Card */}
              <div
                data-testid="backup-restore-card"
                className="rounded-2xl border border-[#E4DFF0] dark:border-[#2E2C3A] bg-white dark:bg-[#14131A] p-4 space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-[#F3EFFA] dark:bg-[#26223A] text-[#5B4BC4] dark:text-[#C4BAFF] flex items-center justify-center shrink-0 mt-0.5">
                    <HardDriveDownload className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold text-[#1C1B1F] dark:text-[#F4EFF4]">
                      Backup &amp; Restore
                    </h3>
                    <p className="text-xs text-[#605D66] dark:text-[#AEA9B4]">
                      Save or restore study logs, syllabus ticks, streaks, screen time, and daily tasks as JSON.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportClick}
                    data-testid="export-backup-button"
                    className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#5B4BC4] text-white hover:bg-[#4D3EB3] dark:bg-[#C4BAFF] dark:text-[#1F1559] dark:hover:bg-[#D5CEFF] text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
                  >
                    <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Export Data (Backup)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleImportButtonClick}
                    disabled={isImporting}
                    data-testid="import-backup-button"
                    className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#DFD9EE] dark:border-[#343144] bg-[#FAF8FC] dark:bg-[#1B1A22] text-[#1C1B1F] dark:text-[#F4EFF4] hover:bg-[#EFEBF5] dark:hover:bg-[#282536] disabled:opacity-60 text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
                  >
                    <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{isImporting ? 'Restoring...' : 'Import Data (Restore)'}</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleFileSelected}
                  data-testid="import-backup-file-input"
                  className="sr-only"
                  tabIndex={-1}
                  aria-label="Choose JSON backup file to restore"
                />

                {backupStatusMessage && (
                  <p
                    role="status"
                    data-testid="backup-restore-status"
                    className="rounded-xl bg-[#ECFDF5] dark:bg-[#112B20] border border-[#86EFAC] dark:border-[#2E7D5B] px-3 py-2 text-xs font-semibold text-[#15803D] dark:text-[#6EE7B7] flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{backupStatusMessage}</span>
                  </p>
                )}

                {backupError && (
                  <p
                    role="alert"
                    data-testid="backup-restore-error"
                    className="rounded-xl bg-[#FEF2F2] dark:bg-[#2E1619] border border-[#FECACA] dark:border-[#7F1D1D] px-3 py-2 text-xs font-semibold text-[#B3261E] dark:text-[#FCA5A5]"
                  >
                    {backupError}
                  </p>
                )}
              </div>

              {/* Board Exam Date Card */}
              <div className="rounded-2xl border border-[#E4DFF0] dark:border-[#2E2C3A] bg-white dark:bg-[#14131A] p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-[#F3EFFA] dark:bg-[#26223A] text-[#5B4BC4] dark:text-[#C4BAFF] flex items-center justify-center shrink-0 mt-0.5">
                    <CalendarDays className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold text-[#1C1B1F] dark:text-[#F4EFF4]">
                      CBSE Class 10th Exam Date
                    </h3>
                    <p className="text-xs text-[#605D66] dark:text-[#AEA9B4]">
                      Set your first board exam date to track days remaining on the Home screen.
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="exam-date-input"
                    className="block text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0] mb-1.5"
                  >
                    Exam start date
                  </label>
                  <input
                    id="exam-date-input"
                    type="date"
                    value={dateInput}
                    onChange={(e) => {
                      setDateInput(e.target.value);
                      setIsCustomDraft(true);
                      setError(null);
                    }}
                    data-testid="exam-date-input"
                    className="w-full min-h-[44px] rounded-xl border border-[#D8D2E5] dark:border-[#343242] bg-[#FAF8FC] dark:bg-[#1B1A22] px-3.5 py-2 text-sm font-medium tabular-nums text-[#1C1B1F] dark:text-[#F4EFF4] focus:border-[#5B4BC4] dark:focus:border-[#B9ADFF] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]/20"
                  />
                </div>

                {previewSummary && (
                  <div
                    data-testid="settings-countdown-preview"
                    className="rounded-xl bg-[#F3EFFA] dark:bg-[#232033] px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-[#49454F] dark:text-[#CAC4D0]">
                      {previewSummary.formattedExamDate}
                    </span>
                    <span className="font-bold tabular-nums text-[#5B4BC4] dark:text-[#C4BAFF]">
                      {previewSummary.phase === 'upcoming'
                        ? `${previewSummary.headlineValue} ${previewSummary.headlineUnit}`
                        : previewSummary.headlineUnit}
                    </span>
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    data-testid="exam-date-error"
                    className="text-xs font-medium text-[#B3261E] dark:text-[#F2B8B5]"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleResetDefault}
                  data-testid="reset-exam-date-button"
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold text-[#5B4BC4] dark:text-[#C4BAFF] hover:bg-[#EFEBF5] dark:hover:bg-[#282536] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    Use estimated default ({formatExamDisplayDate(defaultSettings.examDateKey)})
                  </span>
                </button>
              </div>

              {/* Appearance Preference */}
              <div className="rounded-2xl border border-[#E4DFF0] dark:border-[#2E2C3A] bg-white dark:bg-[#14131A] p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-[#1C1B1F] dark:text-[#F4EFF4]">
                    Appearance
                  </p>
                  <p className="text-xs text-[#605D66] dark:text-[#AEA9B4]">
                    {isDark ? 'Dark mode enabled' : 'Light mode enabled'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onToggleTheme}
                  data-testid="settings-theme-toggle"
                  className="min-h-[44px] px-3.5 rounded-xl border border-[#E4DFF0] dark:border-[#343242] bg-[#FAF8FC] dark:bg-[#1B1A22] text-xs font-semibold text-[#1C1B1F] dark:text-[#F4EFF4] hover:bg-[#EFEBF5] dark:hover:bg-[#282536] transition-colors inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {isDark ? (
                    <>
                      <Sun className="w-4 h-4" aria-hidden="true" />
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" aria-hidden="true" />
                      <span>Dark</span>
                    </>
                  )}
                </button>
              </div>
              </div>

              {/* Sticky Footer Actions */}
              <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-[#ECE7F4] dark:border-[#2B2936] bg-[#FAF8FC] dark:bg-[#1B1A22] shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  data-testid="save-settings-button"
                  className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold bg-[#5B4BC4] text-white hover:bg-[#4D3EB3] dark:bg-[#C4BAFF] dark:text-[#1F1559] dark:hover:bg-[#D5CEFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
