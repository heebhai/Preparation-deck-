import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  ShoppingBag,
  Timer,
} from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from 'motion/react';
import type { DailyHabitsState } from './types/dailyHabit';
import type { DailyTodosState } from './types/dailyTodo';
import type { BoardExamSettings } from './types/examCountdown';
import type { HeeCoinState, StoreItem } from './types/heeCoin';
import type { QuoteItem } from './types/quote';
import type { SubjectStudyGoal } from './types/studyGoal';
import type { StudyLogChapterItem, StudyLogEntry } from './types/studyLog';
import type { MilestoneKey, Subject, SubjectAccent } from './types/syllabus';
import {
  addQuote,
  assignQuoteSchedule,
  deleteQuote,
  editQuote,
  getDailyQuote,
  loadQuotes,
  randomizeDailyQuote,
  saveQuotes,
  shuffleQuotes,
} from './utils/quoteMath';
import {
  buildPomodoroLogPayload,
  calculateElapsedFocusMinutes,
  clampFocusMinutes,
  formatCountdown,
  getChaptersForSubject,
  getModeDefaultMinutes,
  type PomodoroMode,
} from './utils/pomodoroMath';
import {
  evaluateGamification,
  type BadgeId,
  type BadgeStatus,
} from './utils/badgesMath';
import {
  createBackupPayload,
  getBackupFilename,
  parseAndValidateBackupJson,
  serializeBackupPayload,
  triggerBackupDownload,
} from './utils/backupRestore';
import { loadSavedBadges, saveBadges } from './utils/badgeStorage';
import {
  addDailyHabit,
  reconcileDailyHabitsForDate,
  removeDailyHabit,
  toggleDailyHabit,
} from './utils/dailyHabitsMath';
import { loadDailyHabitsState, saveDailyHabitsState } from './utils/dailyHabitsStorage';
import {
  addDailyTodo,
  reconcileDailyTodosForDate,
  removeDailyTodo,
  toggleDailyTodo,
} from './utils/dailyTodoMath';
import { loadDailyTodosState, saveDailyTodosState } from './utils/dailyTodoStorage';
import { evaluateExamCountdown } from './utils/examCountdownMath';
import { loadBoardExamSettings, saveBoardExamSettings } from './utils/examCountdownStorage';
import {
  loadScreenTimeMap,
  saveScreenTimeMap,
  type ScreenTimeByDate,
} from './utils/screenTimeStorage';
import { loadSubjectGoals, saveSubjectGoals } from './utils/studyGoalStorage';
import { formatDuration, getLocalDateKey, parseLocalDateKey } from './utils/studyLogMath';
import { loadStudyLogs, saveStudyLogs } from './utils/studyLogStorage';
import { applyStudyLogToSubjects, toggleChapterMilestone } from './utils/syllabusMath';
import { loadSyllabusSubjects, saveSyllabusSubjects } from './utils/syllabusStorage';
import {
  applyRedeemCode,
  applySyllabusCoinTransition,
  purchaseStoreItem,
} from './utils/heeCoinMath';
import { loadHeeCoinState, saveHeeCoinState } from './utils/heeCoinStorage';
import { BadgeUnlockPopup } from './components/BadgeUnlockPopup';
import { DailyStatsView } from './components/DailyStatsView';
import { DashboardView } from './components/DashboardView';
import { HomeView } from './components/HomeView';
import { LogStudyTimeDialog } from './components/LogStudyTimeDialog';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PomodoroView, type PomodoroState } from './components/PomodoroView';
import { SettingsDialog } from './components/SettingsDialog';
import { StoreView } from './components/StoreView';
import { StudyGoalsDialog } from './components/StudyGoalsDialog';
import { StudyLogView } from './components/StudyLogView';
import { SubjectDetailView } from './components/SubjectDetailView';

type BottomTab =
  | 'dashboard'
  | 'syllabus'
  | 'focus'
  | 'daily-stats'
  | 'study-log'
  | 'store';

function playCompletionChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.38);
    });
  } catch {
    // Ignore audio context restriction errors gracefully
  }
}

export default function App() {
  const [subjects, setSubjects] = useState<Subject[]>(() => loadSyllabusSubjects());
  const [studyLogs, setStudyLogs] = useState<StudyLogEntry[]>(() => loadStudyLogs());
  const [subjectGoals, setSubjectGoals] = useState<SubjectStudyGoal[]>(() =>
    loadSubjectGoals(subjects),
  );
  const [savedBadgesMap, setSavedBadgesMap] = useState<Partial<Record<BadgeId, number>>>(() =>
    loadSavedBadges(),
  );
  const [screenTimeMap, setScreenTimeMap] = useState<ScreenTimeByDate>(() =>
    loadScreenTimeMap(),
  );
  const [todayKey, setTodayKey] = useState<string>(() => getLocalDateKey());
  const [dailyHabits, setDailyHabits] = useState<DailyHabitsState>(() =>
    loadDailyHabitsState(getLocalDateKey()),
  );
  const [examSettings, setExamSettings] = useState<BoardExamSettings>(() =>
    loadBoardExamSettings(getLocalDateKey()),
  );
  const [dailyTodosState, setDailyTodosState] = useState<DailyTodosState>(() =>
    loadDailyTodosState(getLocalDateKey()),
  );
  const [heeCoinState, setHeeCoinState] = useState<HeeCoinState>(() =>
    loadHeeCoinState(),
  );
  const [quotes, setQuotes] = useState<QuoteItem[]>(() => loadQuotes());
  useEffect(() => {
    saveQuotes(quotes);
  }, [quotes]);

  const dailyQuote = useMemo(
    () => getDailyQuote(quotes, todayKey),
    [quotes, todayKey],
  );
  const [badgePopupQueue, setBadgePopupQueue] = useState<BadgeStatus[]>([]);
  const hasMountedRef = useRef<boolean>(false);
  const subjectsRef = useRef<Subject[]>(subjects);
  subjectsRef.current = subjects;
  const heeCoinStateRef = useRef<HeeCoinState>(heeCoinState);
  heeCoinStateRef.current = heeCoinState;

  const [activeTab, setActiveTab] = useState<BottomTab>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLogDialogOpen, setIsLogDialogOpen] = useState<boolean>(false);
  const [isGoalsDialogOpen, setIsGoalsDialogOpen] = useState<boolean>(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState<boolean>(false);
  const [focusedGoalSubjectId, setFocusedGoalSubjectId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const snackbarTimerRef = useRef<number | null>(null);

  const initialSubject = subjects[0];
  const initialChapter = getChaptersForSubject(initialSubject)[0];
  const [pomodoro, setPomodoro] = useState<PomodoroState>({
    mode: 'focus',
    focusMinutes: 25,
    plannedMinutes: 25,
    remainingSeconds: 25 * 60,
    status: 'idle',
    subjectId: initialSubject?.id ?? 'science',
    chapterId: initialChapter?.chapterId ?? '',
    selectedTasks: [],
    lastAutoLoggedMessage: null,
    completedFocusSessionsToday: 0,
  });
  const endTimestampRef = useRef<number | null>(null);
  const pomodoroRef = useRef<PomodoroState>(pomodoro);
  pomodoroRef.current = pomodoro;

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    saveSyllabusSubjects(subjects);
  }, [subjects]);

  useEffect(() => {
    saveStudyLogs(studyLogs);
  }, [studyLogs]);

  useEffect(() => {
    saveSubjectGoals(subjectGoals);
  }, [subjectGoals]);

  useEffect(() => {
    saveScreenTimeMap(screenTimeMap);
  }, [screenTimeMap]);

  useEffect(() => {
    saveDailyHabitsState(dailyHabits);
  }, [dailyHabits]);

  useEffect(() => {
    saveBoardExamSettings(examSettings);
  }, [examSettings]);

  useEffect(() => {
    saveDailyTodosState(dailyTodosState);
  }, [dailyTodosState]);

  useEffect(() => {
    saveHeeCoinState(heeCoinState);
  }, [heeCoinState]);

  // Reset daily habits, advance daily todos day system, and refresh exam countdown automatically if midnight passes
  useEffect(() => {
    const syncDateBoundary = () => {
      const nextTodayKey = getLocalDateKey();
      setTodayKey((prev) => (prev === nextTodayKey ? prev : nextTodayKey));
      setDailyHabits((prev) => reconcileDailyHabitsForDate(prev, nextTodayKey));
      setDailyTodosState((prev) => reconcileDailyTodosForDate(prev, nextTodayKey));
    };
    const intervalId = window.setInterval(syncDateBoundary, 30_000);
    window.addEventListener('focus', syncDateBoundary);
    document.addEventListener('visibilitychange', syncDateBoundary);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', syncDateBoundary);
      document.removeEventListener('visibilitychange', syncDateBoundary);
    };
  }, []);

  const examCountdown = useMemo(
    () => evaluateExamCountdown(examSettings, todayKey),
    [examSettings, todayKey],
  );

  const hasStreakProtector =
    (heeCoinState.purchasedCounts['streak-protector'] ?? 0) > 0;
  const hasCrown = (heeCoinState.purchasedCounts['crown'] ?? 0) > 0;

  const gamification = useMemo(
    () =>
      evaluateGamification(
        studyLogs,
        subjects,
        savedBadgesMap,
        todayKey,
        Date.now(),
        hasStreakProtector,
      ),
    [studyLogs, subjects, savedBadgesMap, todayKey, hasStreakProtector],
  );

  useEffect(() => {
    if (gamification.newlyUnlocked.length > 0) {
      setSavedBadgesMap(gamification.updatedSavedMap);
      saveBadges(gamification.updatedSavedMap);
      if (hasMountedRef.current) {
        setBadgePopupQueue((prev) => {
          const existingIds = new Set(prev.map((b) => b.id));
          const fresh = gamification.newlyUnlocked.filter((b) => !existingIds.has(b.id));
          return fresh.length > 0 ? [...prev, ...fresh] : prev;
        });
      }
    }
    hasMountedRef.current = true;
  }, [gamification]);

  useEffect(() => {
    return () => {
      if (snackbarTimerRef.current !== null) {
        window.clearTimeout(snackbarTimerRef.current);
      }
    };
  }, []);

  const showSuccessSnackbar = useCallback((message: string) => {
    if (snackbarTimerRef.current !== null) {
      window.clearTimeout(snackbarTimerRef.current);
    }
    setSnackbarMessage(message);
    snackbarTimerRef.current = window.setTimeout(() => {
      setSnackbarMessage(null);
      snackbarTimerRef.current = null;
    }, 3400);
  }, []);

  const subjectAccents = useMemo(() => {
    const map: Record<string, SubjectAccent> = {};
    for (const subject of subjects) {
      map[subject.id] = subject.accent;
    }
    return map;
  }, [subjects]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ?? null;

  const handleToggleMilestone = useCallback(
    (
      subjectId: string,
      subSubjectId: string,
      chapterId: string,
      milestoneKey: MilestoneKey,
    ) => {
      const prevSubjects = subjectsRef.current;
      const nextSubjects = toggleChapterMilestone(
        prevSubjects,
        subjectId,
        subSubjectId,
        chapterId,
        milestoneKey,
        Date.now(),
      );
      subjectsRef.current = nextSubjects;
      setSubjects(nextSubjects);

      const transition = applySyllabusCoinTransition(
        heeCoinStateRef.current,
        prevSubjects,
        nextSubjects,
      );
      heeCoinStateRef.current = transition.nextState;
      setHeeCoinState(transition.nextState);

      if (transition.chapterBonusDelta > 0) {
        showSuccessSnackbar(
          `Chapter complete! +${transition.chapterBonusDelta} bonus Hee coins`,
        );
      }
    },
    [showSuccessSnackbar],
  );

  const handleAddStudyLog = useCallback(
    (
      entry: {
        subjectId: string;
        subjectName: string;
        date: string;
        durationMinutes: number;
        items: StudyLogChapterItem[];
      },
      customSnackbar?: string,
    ) => {
      const now = Date.now();
      const newEntry: StudyLogEntry = {
        id: `log-${now}-${Math.random().toString(36).slice(2, 7)}`,
        subjectId: entry.subjectId,
        subjectName: entry.subjectName,
        date: entry.date,
        durationMinutes: entry.durationMinutes,
        createdAt: now,
        items: entry.items,
      };
      setStudyLogs((prev) => [newEntry, ...prev]);

      // Auto-check selected chapter tasks on the syllabus if any were specified
      const hasTasks = entry.items.some((item) => item.tasks.length > 0);
      if (hasTasks) {
        const todayKey = getLocalDateKey();
        let milestoneTimestamp = now;
        if (entry.date !== todayKey) {
          const parsedDate = parseLocalDateKey(entry.date);
          if (parsedDate) {
            parsedDate.setHours(12, 0, 0, 0);
            milestoneTimestamp = parsedDate.getTime();
          }
        }

        const prevSubjects = subjectsRef.current;
        const nextSubjects = applyStudyLogToSubjects(
          prevSubjects,
          entry.subjectId,
          entry.items.map((item) => ({
            chapterId: item.chapterId,
            tasks: item.tasks,
          })),
          milestoneTimestamp,
        );
        subjectsRef.current = nextSubjects;
        setSubjects(nextSubjects);

        const transition = applySyllabusCoinTransition(
          heeCoinStateRef.current,
          prevSubjects,
          nextSubjects,
        );
        heeCoinStateRef.current = transition.nextState;
        setHeeCoinState(transition.nextState);
      }

      showSuccessSnackbar(
        customSnackbar ??
          `Success! Logged ${formatDuration(entry.durationMinutes)} for ${entry.subjectName}`,
      );
    },
    [showSuccessSnackbar],
  );

  const handleDeleteStudyLog = (id: string) => {
    setStudyLogs((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePurchaseStoreItem = useCallback(
    (item: StoreItem) => {
      const res = purchaseStoreItem(heeCoinStateRef.current, item);
      heeCoinStateRef.current = res.nextState;
      setHeeCoinState(res.nextState);
      if (res.purchased) {
        showSuccessSnackbar(`Purchased ${item.title} for ${item.price} Hee coins!`);
      } else {
        showSuccessSnackbar(`${item.title} could not be purchased.`);
      }
    },
    [showSuccessSnackbar],
  );

  const handleRedeemCode = useCallback(
    (code: string) => {
      const res = applyRedeemCode(heeCoinStateRef.current, code);
      heeCoinStateRef.current = res.nextState;
      setHeeCoinState(res.nextState);
      showSuccessSnackbar(res.message);
    },
    [showSuccessSnackbar],
  );

  const handleAddQuote = useCallback(
    (text: string, author?: string): string | null => {
      const res = addQuote(quotes, text, author);
      if (res.error) return res.error;
      setQuotes(res.quotes);
      showSuccessSnackbar('Quote added successfully!');
      return null;
    },
    [quotes, showSuccessSnackbar],
  );

  const handleEditQuote = useCallback(
    (id: string, text: string, author?: string) => {
      setQuotes((prev) => editQuote(prev, id, text, author));
      showSuccessSnackbar('Quote updated successfully!');
    },
    [showSuccessSnackbar],
  );

  const handleDeleteQuote = useCallback(
    (id: string) => {
      setQuotes((prev) => deleteQuote(prev, id));
      showSuccessSnackbar('Quote deleted');
    },
    [showSuccessSnackbar],
  );

  const handleScheduleQuote = useCallback(
    (id: string, dateKey: string | null) => {
      setQuotes((prev) => assignQuoteSchedule(prev, id, dateKey));
      showSuccessSnackbar(dateKey ? `Quote scheduled for ${dateKey}` : 'Quote schedule cleared');
    },
    [showSuccessSnackbar],
  );

  const handleShuffleQuotes = useCallback(() => {
    setQuotes((prev) => shuffleQuotes(prev));
    showSuccessSnackbar('Quotes shuffled!');
  }, [showSuccessSnackbar]);

  const handleRandomizeQuote = useCallback(() => {
    const q = randomizeDailyQuote(quotes, dailyQuote.id);
    handleScheduleQuote(q.id, todayKey);
  }, [quotes, dailyQuote.id, handleScheduleQuote, todayKey]);

  const handleExportBackup = useCallback(() => {
    const currentDateKey = getLocalDateKey();
    const payload = createBackupPayload({
      streakCount: gamification.currentStreakDays,
      subjects,
      studyLogs,
      subjectGoals,
      savedBadgesMap,
      screenTimeMap,
      dailyHabits,
      dailyTodosState,
      examSettings,
      heeCoinState,
      quotes,
      isDark,
    });
    const jsonText = serializeBackupPayload(payload);
    triggerBackupDownload(jsonText, getBackupFilename(currentDateKey));
    showSuccessSnackbar('Backup saved successfully!');
  }, [
    dailyHabits,
    dailyTodosState,
    examSettings,
    gamification.currentStreakDays,
    heeCoinState,
    isDark,
    quotes,
    savedBadgesMap,
    screenTimeMap,
    showSuccessSnackbar,
    studyLogs,
    subjectGoals,
    subjects,
  ]);

  const handleImportBackup = useCallback(
    (rawJson: string): string | null => {
      const currentDateKey = getLocalDateKey();
      const result = parseAndValidateBackupJson(rawJson, currentDateKey);
      if (result.valid === false) {
        return result.error;
      }

      const restored = result.payload.data;
      const evaluated = evaluateGamification(
        restored.studyLogs,
        restored.subjects,
        restored.savedBadgesMap,
      );

      // Persist all restored stores immediately so reloads preserve the restored snapshot
      saveSyllabusSubjects(restored.subjects);
      saveStudyLogs(restored.studyLogs);
      saveSubjectGoals(restored.subjectGoals);
      saveBadges(evaluated.updatedSavedMap);
      saveScreenTimeMap(restored.screenTimeMap);
      saveDailyHabitsState(restored.dailyHabits);
      saveDailyTodosState(restored.dailyTodosState);
      saveBoardExamSettings(restored.examSettings);
      if (restored.heeCoinState) {
        saveHeeCoinState(restored.heeCoinState);
      }
      if (restored.quotes) {
        saveQuotes(restored.quotes);
      }

      // Avoid showing surprise badge popups for already-earned badges being restored
      hasMountedRef.current = false;
      setBadgePopupQueue([]);

      // Update all React state so every screen (Dashboard, Syllabus, Daily Stats, Study Log, Store) refreshes immediately
      subjectsRef.current = restored.subjects;
      setTodayKey(currentDateKey);
      setSubjects(restored.subjects);
      setStudyLogs(restored.studyLogs);
      setSubjectGoals(restored.subjectGoals);
      setSavedBadgesMap(evaluated.updatedSavedMap);
      setScreenTimeMap(restored.screenTimeMap);
      setDailyHabits(restored.dailyHabits);
      setDailyTodosState(restored.dailyTodosState);
      setExamSettings(restored.examSettings);
      if (restored.heeCoinState) {
        heeCoinStateRef.current = restored.heeCoinState;
        setHeeCoinState(restored.heeCoinState);
      }
      if (restored.quotes) {
        setQuotes(restored.quotes);
      }
      if (typeof restored.isDark === 'boolean') {
        setIsDark(restored.isDark);
      }

      setIsSettingsDialogOpen(false);
      showSuccessSnackbar('Data restored successfully!');
      return null;
    },
    [showSuccessSnackbar],
  );

  // Complete a focus session (either naturally at 00:00 or via "Finish & Log")
  const finalizeFocusSession = useCallback(
    (loggedMinutes: number, current: PomodoroState) => {
      const targetSubject =
        subjects.find((s) => s.id === current.subjectId) ?? subjects[0];
      const chapters = getChaptersForSubject(targetSubject);
      const targetChapter =
        chapters.find((c) => c.chapterId === current.chapterId) ?? chapters[0];

      let message = `Break complete! Ready to focus again.`;
      if (current.mode === 'focus' && targetSubject) {
        const payload = buildPomodoroLogPayload({
          subject: targetSubject,
          chapterOption: targetChapter,
          tasks: current.selectedTasks,
          durationMinutes: loggedMinutes,
          dateKey: getLocalDateKey(),
        });

        const chapterLabel = targetChapter ? ` · ${targetChapter.chapterName}` : '';
        message = `Auto-logged ${formatDuration(payload.durationMinutes)} for ${targetSubject.name}${chapterLabel}`;
        handleAddStudyLog(payload, `Pomodoro complete! ${message}`);
      } else {
        showSuccessSnackbar(message);
      }

      playCompletionChime();
      endTimestampRef.current = null;

      setPomodoro((prev) => {
        const nextMode: PomodoroMode =
          prev.mode === 'focus' ? 'short-break' : 'focus';
        const nextMins = getModeDefaultMinutes(nextMode, prev.focusMinutes);
        return {
          ...prev,
          mode: nextMode,
          plannedMinutes: nextMins,
          remainingSeconds: nextMins * 60,
          status: 'idle',
          lastAutoLoggedMessage: prev.mode === 'focus' ? message : null,
          completedFocusSessionsToday:
            prev.mode === 'focus'
              ? prev.completedFocusSessionsToday + 1
              : prev.completedFocusSessionsToday,
        };
      });
    },
    [handleAddStudyLog, showSuccessSnackbar, subjects],
  );

  // Live wall-clock countdown loop for active Pomodoro timer (persists across bottom-tab switches)
  useEffect(() => {
    if (pomodoro.status !== 'running') {
      return;
    }

    if (endTimestampRef.current === null) {
      endTimestampRef.current = Date.now() + pomodoroRef.current.remainingSeconds * 1000;
    }

    const intervalId = window.setInterval(() => {
      const targetEnd = endTimestampRef.current;
      if (targetEnd === null) return;
      const secsLeft = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));

      if (secsLeft <= 0) {
        window.clearInterval(intervalId);
        const snapshot = pomodoroRef.current;
        finalizeFocusSession(snapshot.plannedMinutes, snapshot);
      } else {
        setPomodoro((prev) =>
          prev.remainingSeconds === secsLeft
            ? prev
            : { ...prev, remainingSeconds: secsLeft },
        );
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [pomodoro.status, finalizeFocusSession]);

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <div className="min-h-screen w-full overflow-x-clip bg-[#FAF8FC] text-[#1C1B1F] dark:bg-[#121318] dark:text-[#F4EFF4]">
          <AnimatePresence mode="wait" initial={false}>
            {selectedSubject ? (
              <SubjectDetailView
                key={selectedSubject.id}
                subject={selectedSubject}
                isDark={isDark}
                onToggleTheme={() => setIsDark((prev) => !prev)}
                onBack={() => setSelectedSubjectId(null)}
                onToggleMilestone={handleToggleMilestone}
              />
            ) : activeTab === 'focus' ? (
              <PomodoroView
                key="focus"
                subjects={subjects}
                state={pomodoro}
                isDark={isDark}
                onToggleTheme={() => setIsDark((prev) => !prev)}
                onSelectMode={(mode) => {
                  endTimestampRef.current = null;
                  setPomodoro((prev) => {
                    const mins = getModeDefaultMinutes(mode, prev.focusMinutes);
                    return {
                      ...prev,
                      mode,
                      plannedMinutes: mins,
                      remainingSeconds: mins * 60,
                      status: 'idle',
                    };
                  });
                }}
                onSetFocusMinutes={(minutes) => {
                  const clamped = clampFocusMinutes(minutes);
                  endTimestampRef.current = null;
                  setPomodoro((prev) => ({
                    ...prev,
                    focusMinutes: clamped,
                    plannedMinutes: prev.mode === 'focus' ? clamped : prev.plannedMinutes,
                    remainingSeconds:
                      prev.mode === 'focus' ? clamped * 60 : prev.remainingSeconds,
                    status: 'idle',
                  }));
                }}
                onSelectSubject={(subjectId) => {
                  const subj = subjects.find((s) => s.id === subjectId);
                  const firstCh = getChaptersForSubject(subj)[0];
                  setPomodoro((prev) => ({
                    ...prev,
                    subjectId,
                    chapterId: firstCh?.chapterId ?? '',
                  }));
                }}
                onSelectChapter={(chapterId) =>
                  setPomodoro((prev) => ({ ...prev, chapterId }))
                }
                onToggleTask={(task) =>
                  setPomodoro((prev) => ({
                    ...prev,
                    selectedTasks: prev.selectedTasks.includes(task)
                      ? prev.selectedTasks.filter((t) => t !== task)
                      : [...prev.selectedTasks, task],
                  }))
                }
                onStartOrResume={() => {
                  endTimestampRef.current = Date.now() + pomodoro.remainingSeconds * 1000;
                  setPomodoro((prev) => ({
                    ...prev,
                    status: 'running',
                    lastAutoLoggedMessage: null,
                  }));
                }}
                onPause={() => {
                  endTimestampRef.current = null;
                  setPomodoro((prev) => ({ ...prev, status: 'paused' }));
                }}
                onReset={() => {
                  endTimestampRef.current = null;
                  setPomodoro((prev) => {
                    const mins = getModeDefaultMinutes(prev.mode, prev.focusMinutes);
                    return {
                      ...prev,
                      plannedMinutes: mins,
                      remainingSeconds: mins * 60,
                      status: 'idle',
                    };
                  });
                }}
                onFinishEarlyAndLog={() => {
                  const elapsedMins = calculateElapsedFocusMinutes(
                    pomodoro.plannedMinutes,
                    pomodoro.remainingSeconds,
                  );
                  if (elapsedMins >= 1) {
                    finalizeFocusSession(elapsedMins, pomodoro);
                  }
                }}
              />
            ) : activeTab === 'daily-stats' ? (
              <DailyStatsView
                key="daily-stats"
                subjects={subjects}
                studyLogs={studyLogs}
                subjectAccents={subjectAccents}
                badges={gamification.badges}
                currentStreakDays={gamification.currentStreakDays}
                screenTimeMap={screenTimeMap}
                onUpdateScreenTime={(dateKey, minutes) =>
                  setScreenTimeMap((prev) => ({
                    ...prev,
                    [dateKey]: Math.max(0, Math.min(24 * 60, Math.round(minutes))),
                  }))
                }
                isDark={isDark}
                onToggleTheme={() => setIsDark((prev) => !prev)}
                onOpenLogDialog={() => setIsLogDialogOpen(true)}
              />
            ) : activeTab === 'study-log' ? (
              <StudyLogView
                key="study-log"
                logs={studyLogs}
                subjectAccents={subjectAccents}
                isDark={isDark}
                onToggleTheme={() => setIsDark((prev) => !prev)}
                onDeleteLog={handleDeleteStudyLog}
                onOpenLogDialog={() => setIsLogDialogOpen(true)}
                quotes={quotes}
                todayKey={todayKey}
                onAddQuote={handleAddQuote}
                onEditQuote={handleEditQuote}
                onDeleteQuote={handleDeleteQuote}
                onScheduleQuote={handleScheduleQuote}
                onShuffleQuotes={handleShuffleQuotes}
                onRandomizeQuote={handleRandomizeQuote}
              />
            ) : activeTab === 'store' ? (
              <StoreView
                key="store"
                coinState={heeCoinState}
                isDark={isDark}
                onToggleTheme={() => setIsDark((prev) => !prev)}
                onPurchaseItem={handlePurchaseStoreItem}
                onRedeemCode={handleRedeemCode}
              />
            ) : activeTab === 'syllabus' ? (
              <HomeView
                key="home"
                subjects={subjects}
                studyLogs={studyLogs}
                subjectGoals={subjectGoals}
                dailyHabits={dailyHabits}
                examCountdown={examCountdown}
                currentStreakDays={gamification.currentStreakDays}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                isDark={isDark}
                onToggleTheme={() => setIsDark((prev) => !prev)}
                onOpenSettings={() => setIsSettingsDialogOpen(true)}
                onSelectSubject={(id) => setSelectedSubjectId(id)}
                onToggleMilestone={handleToggleMilestone}
                onToggleDailyHabit={(habitId) =>
                  setDailyHabits((prev) =>
                    toggleDailyHabit(prev, habitId, getLocalDateKey()),
                  )
                }
                onAddDailyHabit={(title, emoji) => {
                  const res = addDailyHabit(
                    dailyHabits,
                    title,
                    emoji,
                    getLocalDateKey(),
                  );
                  if (res.error) return res.error;
                  setDailyHabits(res.nextState);
                  return null;
                }}
                onRemoveDailyHabit={(habitId) =>
                  setDailyHabits((prev) =>
                    removeDailyHabit(prev, habitId, getLocalDateKey()),
                  )
                }
                onOpenLogDialog={() => setIsLogDialogOpen(true)}
                onOpenGoalsDialog={(subjectId) => {
                  setFocusedGoalSubjectId(subjectId ?? null);
                  setIsGoalsDialogOpen(true);
                }}
              />
            ) : (
              <DashboardView
                key="dashboard"
                todayKey={todayKey}
                subjects={subjects}
                studyLogs={studyLogs}
                examCountdown={examCountdown}
                currentStreakDays={gamification.currentStreakDays}
                todayScreenTimeMinutes={screenTimeMap[todayKey] ?? 0}
                dailyHabits={dailyHabits}
                todos={dailyTodosState.items}
                coinState={heeCoinState}
                hasCrown={hasCrown}
                dailyQuote={dailyQuote}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onUpdateScreenTime={(dateKey, minutes) =>
                  setScreenTimeMap((prev) => ({
                    ...prev,
                    [dateKey]: Math.max(0, Math.min(24 * 60, Math.round(minutes))),
                  }))
                }
                onAddTodo={(title) => {
                  const res = addDailyTodo(dailyTodosState.items, title);
                  if (res.error) return res.error;
                  setDailyTodosState({
                    dateKey: getLocalDateKey(),
                    items: res.nextItems,
                  });
                  return null;
                }}
                onToggleTodo={(todoId) =>
                  setDailyTodosState((prev) => ({
                    dateKey: getLocalDateKey(),
                    items: toggleDailyTodo(prev.items, todoId),
                  }))
                }
                onRemoveTodo={(todoId) =>
                  setDailyTodosState((prev) => ({
                    dateKey: getLocalDateKey(),
                    items: removeDailyTodo(prev.items, todoId),
                  }))
                }
                onToggleMilestone={handleToggleMilestone}
                isDark={isDark}
                onToggleTheme={() => setIsDark((prev) => !prev)}
                onOpenSettings={() => setIsSettingsDialogOpen(true)}
                onOpenLogDialog={() => setIsLogDialogOpen(true)}
              />
            )}
          </AnimatePresence>

          {/* Scrollable Tab Row Bottom Navigation Bar (Dashboard, Syllabus, Focus, Daily Stats, Study Log, Store) */}
          {!selectedSubject && (
            <nav
              aria-label="Primary navigation"
              data-testid="bottom-scrollable-nav"
              className="fixed bottom-0 left-0 right-0 z-40 pb-safe backdrop-blur-md bg-[#FAF8FC]/92 dark:bg-[#16151D]/92 border-t border-[#E6E0EC] dark:border-[#2A2836]"
            >
              <div
                role="tablist"
                aria-label="App sections"
                className="max-w-3xl mx-auto h-16 flex items-center overflow-x-auto no-scrollbar scroll-smooth snap-x snap-proximity px-2 gap-1 sm:justify-around"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'dashboard'}
                  onClick={(e) => {
                    setActiveTab('dashboard');
                    e.currentTarget.scrollIntoView({
                      behavior: 'smooth',
                      inline: 'nearest',
                      block: 'nearest',
                    });
                  }}
                  aria-current={activeTab === 'dashboard' ? 'page' : undefined}
                  data-testid="nav-tab-dashboard"
                  className="shrink-0 min-w-[74px] sm:min-w-[88px] px-2.5 snap-center flex flex-col items-center justify-center min-h-[48px] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
                >
                  <span
                    className={`px-3 py-1 rounded-full transition-colors ${
                      activeTab === 'dashboard'
                        ? 'bg-[#E5DFF8] text-[#3B2C8E] dark:bg-[#2F2A4D] dark:text-[#D1C8FF]'
                        : 'text-[#605D66] dark:text-[#AEA9B4]'
                    }`}
                  >
                    <LayoutDashboard className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span
                    className={`text-[11px] font-medium mt-0.5 whitespace-nowrap ${
                      activeTab === 'dashboard'
                        ? 'text-[#1C1B1F] dark:text-[#F4EFF4] font-semibold'
                        : 'text-[#605D66] dark:text-[#AEA9B4]'
                    }`}
                  >
                    Dashboard
                  </span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'syllabus'}
                  onClick={(e) => {
                    setActiveTab('syllabus');
                    e.currentTarget.scrollIntoView({
                      behavior: 'smooth',
                      inline: 'nearest',
                      block: 'nearest',
                    });
                  }}
                  aria-current={activeTab === 'syllabus' ? 'page' : undefined}
                  data-testid="nav-tab-syllabus"
                  className="shrink-0 min-w-[74px] sm:min-w-[88px] px-2.5 snap-center flex flex-col items-center justify-center min-h-[48px] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
                >
                  <span
                    className={`px-3.5 py-1 rounded-full transition-colors ${
                      activeTab === 'syllabus'
                        ? 'bg-[#E5DFF8] text-[#3B2C8E] dark:bg-[#2F2A4D] dark:text-[#D1C8FF]'
                        : 'text-[#605D66] dark:text-[#AEA9B4]'
                    }`}
                  >
                    <BookOpenCheck className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span
                    className={`text-[11px] font-medium mt-0.5 whitespace-nowrap ${
                      activeTab === 'syllabus'
                        ? 'text-[#1C1B1F] dark:text-[#F4EFF4] font-semibold'
                        : 'text-[#605D66] dark:text-[#AEA9B4]'
                    }`}
                  >
                    Syllabus
                  </span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'focus'}
                  onClick={(e) => {
                    setActiveTab('focus');
                    e.currentTarget.scrollIntoView({
                      behavior: 'smooth',
                      inline: 'nearest',
                      block: 'nearest',
                    });
                  }}
                  aria-current={activeTab === 'focus' ? 'page' : undefined}
                  data-testid="nav-tab-focus"
                  className="shrink-0 min-w-[74px] sm:min-w-[88px] px-2.5 snap-center relative flex flex-col items-center justify-center min-h-[48px] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
                >
                  <span
                    className={`relative px-3.5 py-1 rounded-full transition-colors ${
                      activeTab === 'focus'
                        ? 'bg-[#E5DFF8] text-[#3B2C8E] dark:bg-[#2F2A4D] dark:text-[#D1C8FF]'
                        : 'text-[#605D66] dark:text-[#AEA9B4]'
                    }`}
                  >
                    <Timer className="w-5 h-5" aria-hidden="true" />
                    {pomodoro.status === 'running' && (
                      <span
                        className="absolute top-0.5 right-1 w-2 h-2 rounded-full bg-[#16A34A] dark:bg-[#34D399] animate-pulse"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span
                    className={`text-[11px] font-medium mt-0.5 whitespace-nowrap tabular-nums ${
                      activeTab === 'focus'
                        ? 'text-[#1C1B1F] dark:text-[#F4EFF4] font-semibold'
                        : 'text-[#605D66] dark:text-[#AEA9B4]'
                    }`}
                  >
                    {pomodoro.status === 'running'
                      ? formatCountdown(pomodoro.remainingSeconds)
                      : 'Focus'}
                  </span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'daily-stats'}
                  onClick={(e) => {
                    setActiveTab('daily-stats');
                    e.currentTarget.scrollIntoView({
                      behavior: 'smooth',
                      inline: 'nearest',
                      block: 'nearest',
                    });
                  }}
                  aria-current={activeTab === 'daily-stats' ? 'page' : undefined}
                  data-testid="nav-tab-daily-stats"
                  className="shrink-0 min-w-[78px] sm:min-w-[92px] px-2.5 snap-center flex flex-col items-center justify-center min-h-[48px] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
                >
                  <span
                    className={`px-3.5 py-1 rounded-full transition-colors ${
                      activeTab === 'daily-stats'
                        ? 'bg-[#E5DFF8] text-[#3B2C8E] dark:bg-[#2F2A4D] dark:text-[#D1C8FF]'
                        : 'text-[#605D66] dark:text-[#AEA9B4]'
                    }`}
                  >
                    <BarChart3 className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span
                    className={`text-[11px] font-medium mt-0.5 whitespace-nowrap ${
                      activeTab === 'daily-stats'
                        ? 'text-[#1C1B1F] dark:text-[#F4EFF4] font-semibold'
                        : 'text-[#605D66] dark:text-[#AEA9B4]'
                    }`}
                  >
                    Daily Stats
                  </span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'study-log'}
                  onClick={(e) => {
                    setActiveTab('study-log');
                    e.currentTarget.scrollIntoView({
                      behavior: 'smooth',
                      inline: 'nearest',
                      block: 'nearest',
                    });
                  }}
                  aria-current={activeTab === 'study-log' ? 'page' : undefined}
                  data-testid="nav-tab-study-log"
                  className="shrink-0 min-w-[78px] sm:min-w-[92px] px-2.5 snap-center flex flex-col items-center justify-center min-h-[48px] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
                >
                  <span
                    className={`px-3.5 py-1 rounded-full transition-colors ${
                      activeTab === 'study-log'
                        ? 'bg-[#E5DFF8] text-[#3B2C8E] dark:bg-[#2F2A4D] dark:text-[#D1C8FF]'
                        : 'text-[#605D66] dark:text-[#AEA9B4]'
                    }`}
                  >
                    <Clock className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span
                    className={`text-[11px] font-medium mt-0.5 whitespace-nowrap ${
                      activeTab === 'study-log'
                        ? 'text-[#1C1B1F] dark:text-[#F4EFF4] font-semibold'
                        : 'text-[#605D66] dark:text-[#AEA9B4]'
                    }`}
                  >
                    Study Log
                  </span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'store'}
                  onClick={(e) => {
                    setActiveTab('store');
                    e.currentTarget.scrollIntoView({
                      behavior: 'smooth',
                      inline: 'nearest',
                      block: 'nearest',
                    });
                  }}
                  aria-current={activeTab === 'store' ? 'page' : undefined}
                  data-testid="nav-tab-store"
                  className="shrink-0 min-w-[74px] sm:min-w-[88px] px-2.5 snap-center flex flex-col items-center justify-center min-h-[48px] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] cursor-pointer"
                >
                  <span
                    className={`px-3.5 py-1 rounded-full transition-colors ${
                      activeTab === 'store'
                        ? 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#3B2B0D] dark:text-[#FCD34D]'
                        : 'text-[#605D66] dark:text-[#AEA9B4]'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span
                    className={`text-[11px] font-medium mt-0.5 whitespace-nowrap ${
                      activeTab === 'store'
                        ? 'text-[#1C1B1F] dark:text-[#F4EFF4] font-semibold'
                        : 'text-[#605D66] dark:text-[#AEA9B4]'
                    }`}
                  >
                    Store
                  </span>
                </button>
              </div>
            </nav>
          )}

          {/* Success Snackbar */}
          <AnimatePresence>
            {snackbarMessage && (
              <motion.div
                role="status"
                aria-live="polite"
                data-testid="study-log-success-snackbar"
                initial={{ opacity: 0, y: -14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={`fixed left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#166534] text-white dark:bg-[#34D399] dark:text-[#052E16] shadow-xl text-xs sm:text-sm font-semibold whitespace-nowrap max-w-[calc(100vw-2rem)] ${
                  isSettingsDialogOpen ? 'top-3' : 'top-[68px]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{snackbarMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <LogStudyTimeDialog
            isOpen={isLogDialogOpen}
            subjects={subjects}
            onClose={() => setIsLogDialogOpen(false)}
            onSave={handleAddStudyLog}
          />

          <StudyGoalsDialog
            isOpen={isGoalsDialogOpen}
            subjects={subjects}
            goals={subjectGoals}
            focusedSubjectId={focusedGoalSubjectId}
            onClose={() => setIsGoalsDialogOpen(false)}
            onSave={(nextGoals) => {
              setSubjectGoals(nextGoals);
              showSuccessSnackbar('Study hour goals updated');
            }}
          />

          <SettingsDialog
            isOpen={isSettingsDialogOpen}
            examSettings={examSettings}
            isDark={isDark}
            onToggleTheme={() => setIsDark((prev) => !prev)}
            onClose={() => setIsSettingsDialogOpen(false)}
            onSaveExamSettings={(nextSettings) => {
              setExamSettings(nextSettings);
              showSuccessSnackbar('Board exam countdown date saved');
            }}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />

          <BadgeUnlockPopup
            badge={badgePopupQueue[0] ?? null}
            remainingCount={badgePopupQueue.length}
            onDismiss={() => setBadgePopupQueue((prev) => prev.slice(1))}
          />

          <OfflineIndicator />
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}
