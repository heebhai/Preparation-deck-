package com.syllabustracker.ui

import android.app.Activity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.BarChart
import androidx.compose.material.icons.rounded.Book
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.Storefront
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.ui.unit.dp
import com.syllabustracker.data.local.StudyLogChapterItem
import com.syllabustracker.data.local.StudyLogDao
import com.syllabustracker.data.local.StudyLogEntity
import com.syllabustracker.data.local.StudyTimeFormatter
import com.syllabustracker.model.DailyHabit
import com.syllabustracker.model.DailyHabitDefaults
import com.syllabustracker.model.DailyHabitsLocalStore
import com.syllabustracker.model.DailyTodoDayCalculator
import com.syllabustracker.model.DailyTodosLocalStore
import com.syllabustracker.model.DummySyllabusData
import com.syllabustracker.model.ExamCountdownCalculator
import com.syllabustracker.model.ExamSettingsLocalStore
import com.syllabustracker.model.GamificationLocalStore
import com.syllabustracker.model.HeeCoinCalculator
import com.syllabustracker.model.HeeCoinLocalStore
import com.syllabustracker.model.MilestoneType
import com.syllabustracker.model.StudyBadgeCalculator
import com.syllabustracker.model.StudyBadgeStatus
import com.syllabustracker.model.StudyGoalCalculator
import com.syllabustracker.ui.components.LogStudyTimeDialog
import com.syllabustracker.ui.screens.DailyStatsScreen
import com.syllabustracker.ui.screens.DashboardScreen
import com.syllabustracker.ui.screens.HomeScreen
import com.syllabustracker.ui.screens.PomodoroMode
import com.syllabustracker.ui.screens.PomodoroScreen
import com.syllabustracker.ui.screens.PomodoroStatus
import com.syllabustracker.ui.screens.PomodoroUiState
import com.syllabustracker.ui.screens.StoreScreen
import com.syllabustracker.ui.screens.StudyLogScreen
import com.syllabustracker.ui.screens.SubjectDetailScreen
import com.syllabustracker.ui.screens.chaptersForSubject
import com.syllabustracker.ui.screens.formatCountdown
import com.syllabustracker.ui.theme.SyllabusTrackerTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

private enum class HomeTab {
    DASHBOARD, SYLLABUS, FOCUS, DAILY_STATS, STUDY_LOG, STORE
}

@Composable
fun SyllabusTrackerApp(studyLogDao: StudyLogDao) {
    var subjects by remember { mutableStateOf(DummySyllabusData.subjects) }
    var subjectGoals by remember { mutableStateOf(StudyGoalCalculator.defaultGoals(subjects)) }
    var selectedSubjectId by remember { mutableStateOf<String?>(null) }
    var activeTab by remember { mutableStateOf(HomeTab.DASHBOARD) }
    var showLogDialog by remember { mutableStateOf(false) }
    var showSettingsDialog by remember { mutableStateOf(false) }

    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current
    val gamificationStore = remember(context) { GamificationLocalStore(context) }
    val habitsStore = remember(context) { DailyHabitsLocalStore(context) }
    val examStore = remember(context) { ExamSettingsLocalStore(context) }
    val todosStore = remember(context) { DailyTodosLocalStore(context) }
    val coinStore = remember(context) { HeeCoinLocalStore(context) }
    var savedBadgesMap by remember { mutableStateOf(gamificationStore.loadUnlockedBadges()) }
    var screenTimeByDate by remember { mutableStateOf(gamificationStore.loadScreenTimeByDate()) }
    var dailyHabits by remember { mutableStateOf(habitsStore.load()) }
    var examSettings by remember { mutableStateOf(examStore.load()) }
    var dailyTodosState by remember { mutableStateOf(todosStore.load()) }
    var heeCoinState by remember { mutableStateOf(coinStore.load()) }
    val examCountdown = remember(examSettings) { ExamCountdownCalculator.evaluate(examSettings) }
    var badgePopupQueue by remember { mutableStateOf<List<StudyBadgeStatus>>(emptyList()) }
    var hasHydrated by remember { mutableStateOf(false) }

    val studyLogs by studyLogDao.observeAllLogs().collectAsState(initial = emptyList())
    var pomodoroState by remember {
        val firstSubj = DummySyllabusData.subjects.firstOrNull()
        val firstCh = chaptersForSubject(firstSubj).firstOrNull()
        mutableStateOf(
            PomodoroUiState(
                subjectId = firstSubj?.id ?: "science",
                chapterId = firstCh?.chapterId ?: ""
            )
        )
    }

    val studyStats = remember(studyLogs) { StudyTimeFormatter.calculateStats(studyLogs) }
    val gamification = remember(studyLogs, subjects, savedBadgesMap) {
        StudyBadgeCalculator.evaluate(
            logs = studyLogs,
            subjects = subjects,
            savedUnlockedMap = savedBadgesMap
        )
    }

    val importBackupLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        coroutineScope.launch {
            val rawJson = runCatching {
                context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }.orEmpty()
            }.getOrElse { "" }
            val parsed = SyllabusBackupManager.parseAndValidateBackupJson(rawJson, LocalDate.now().toString())
            parsed.onSuccess { restored ->
                studyLogDao.deleteAll()
                studyLogDao.insertAll(restored.studyLogs)
                subjects = restored.subjects
                subjectGoals = restored.subjectGoals
                savedBadgesMap = restored.savedBadgesMap
                gamificationStore.saveUnlockedBadges(restored.savedBadgesMap)
                screenTimeByDate = restored.screenTimeByDate
                restored.screenTimeByDate.forEach { (dateIso, mins) ->
                    gamificationStore.saveScreenTime(dateIso, mins)
                }
                dailyHabits = restored.dailyHabits
                habitsStore.save(restored.dailyHabits)
                dailyTodosState = restored.dailyTodosState
                todosStore.save(restored.dailyTodosState)
                examSettings = restored.examSettings
                examStore.save(restored.examSettings)
                heeCoinState = restored.heeCoinState
                coinStore.save(restored.heeCoinState)
                showSettingsDialog = false
                snackbarHostState.showSnackbar("Data restored successfully!", duration = SnackbarDuration.Short)
            }.onFailure { err ->
                snackbarHostState.showSnackbar(err.message ?: "Invalid backup file.", duration = SnackbarDuration.Short)
            }
        }
    }

    LaunchedEffect(gamification) {
        if (gamification.newlyUnlocked.isNotEmpty()) {
            savedBadgesMap = gamification.updatedSavedMap
            gamificationStore.saveUnlockedBadges(gamification.updatedSavedMap)
            if (hasHydrated) {
                badgePopupQueue = badgePopupQueue + gamification.newlyUnlocked
            }
        }
        hasHydrated = true
    }

    val toggleMilestone: (String, String, String, MilestoneType) -> Unit =
        { subjectId, subId, chapterId, milestone ->
            val prevSubjects = subjects
            val nextSubjects = prevSubjects.map { subj ->
                if (subj.id != subjectId) subj
                else subj.copy(
                    subSubjects = subj.subSubjects.map { sub ->
                        if (sub.id != subId) sub
                        else sub.copy(
                            chapters = sub.chapters.map { ch ->
                                if (ch.id != chapterId) ch
                                else {
                                    val m = ch.milestones
                                    val nextChecked = when (milestone) {
                                        MilestoneType.LECTURE -> !m.lecture
                                        MilestoneType.NOTES -> !m.notes
                                        MilestoneType.PRACTICE -> !m.practice
                                        MilestoneType.EXTRA -> !m.extra
                                    }
                                    val updatedTimestamps = ch.milestoneTimestamps.toMutableMap().apply {
                                        if (nextChecked) put(milestone, System.currentTimeMillis())
                                        else remove(milestone)
                                    }
                                    ch.copy(
                                        milestones = when (milestone) {
                                            MilestoneType.LECTURE -> m.copy(lecture = nextChecked)
                                            MilestoneType.NOTES -> m.copy(notes = nextChecked)
                                            MilestoneType.PRACTICE -> m.copy(practice = nextChecked)
                                            MilestoneType.EXTRA -> m.copy(extra = nextChecked)
                                        },
                                        milestoneTimestamps = updatedTimestamps
                                    )
                                }
                            }
                        )
                    }
                )
            }
            subjects = nextSubjects
            val coinResult = HeeCoinCalculator.applySyllabusDelta(heeCoinState, prevSubjects, nextSubjects)
            if (coinResult.totalDelta != 0) {
                heeCoinState = coinResult.nextState
                coinStore.save(coinResult.nextState)
            }
        }

    val applyStudyLogMilestones: (String, List<StudyLogChapterItem>, Long) -> Unit =
        { subjectId, items, timestamp ->
            val prevSubjects = subjects
            val tasksByChapter = items.associate { it.chapterId to it.tasks }
            val nextSubjects = prevSubjects.map { subj ->
                if (subj.id != subjectId) subj
                else subj.copy(
                    subSubjects = subj.subSubjects.map { sub ->
                        sub.copy(
                            chapters = sub.chapters.map { ch ->
                                val tasks = tasksByChapter[ch.id].orEmpty()
                                if (tasks.isEmpty()) ch
                                else {
                                    var m = ch.milestones
                                    val updatedTs = ch.milestoneTimestamps.toMutableMap()
                                    for (t in tasks) {
                                        m = when (t) {
                                            MilestoneType.LECTURE -> m.copy(lecture = true)
                                            MilestoneType.NOTES -> m.copy(notes = true)
                                            MilestoneType.PRACTICE -> m.copy(practice = true)
                                            MilestoneType.EXTRA -> m.copy(extra = true)
                                        }
                                        updatedTs[t] = timestamp
                                    }
                                    ch.copy(milestones = m, milestoneTimestamps = updatedTs)
                                }
                            }
                        )
                    }
                )
            }
            subjects = nextSubjects
            val coinResult = HeeCoinCalculator.applySyllabusDelta(heeCoinState, prevSubjects, nextSubjects)
            if (coinResult.totalDelta != 0) {
                heeCoinState = coinResult.nextState
                coinStore.save(coinResult.nextState)
            }
        }

    val finalizePomodoro: (Int, PomodoroUiState) -> Unit = { loggedMins, current ->
        val subj = subjects.find { it.id == current.subjectId } ?: subjects.firstOrNull()
        val ch = chaptersForSubject(subj).find { it.chapterId == current.chapterId }
        val now = System.currentTimeMillis()
        var bannerMsg: String? = null
        if (current.mode == PomodoroMode.FOCUS && subj != null) {
            val items = if (ch != null) {
                listOf(
                    StudyLogChapterItem(
                        subSubjectId = ch.subSubjectId,
                        subSubjectName = ch.subSubjectName,
                        chapterId = ch.chapterId,
                        chapterName = ch.chapterName,
                        tasks = current.selectedTasks.toList()
                    )
                )
            } else emptyList()
            if (current.selectedTasks.isNotEmpty() && items.isNotEmpty()) {
                applyStudyLogMilestones(subj.id, items, now)
            }
            bannerMsg = "Auto-logged ${StudyTimeFormatter.formatDuration(loggedMins)} for ${subj.name}${ch?.let { " · ${it.chapterName}" } ?: ""}"
            coroutineScope.launch {
                studyLogDao.insertLog(
                    StudyLogEntity(
                        id = UUID.randomUUID().toString(),
                        subjectId = subj.id,
                        subjectName = subj.name,
                        dateIso = LocalDate.now().toString(),
                        durationMinutes = loggedMins.coerceAtLeast(1),
                        createdAt = now,
                        items = items
                    )
                )
                snackbarHostState.showSnackbar("Pomodoro complete! $bannerMsg", duration = SnackbarDuration.Short)
            }
        }
        val nextMode = if (current.mode == PomodoroMode.FOCUS) PomodoroMode.SHORT_BREAK else PomodoroMode.FOCUS
        val nextMins = if (nextMode == PomodoroMode.FOCUS) current.focusMinutes else nextMode.defaultMinutes
        pomodoroState = current.copy(
            mode = nextMode,
            plannedMinutes = nextMins,
            remainingSeconds = nextMins * 60,
            status = PomodoroStatus.IDLE,
            lastAutoLoggedMessage = bannerMsg,
            completedSessionsToday = if (current.mode == PomodoroMode.FOCUS) current.completedSessionsToday + 1 else current.completedSessionsToday
        )
    }

    LaunchedEffect(pomodoroState.status) {
        while (pomodoroState.status == PomodoroStatus.RUNNING) {
            delay(1000L)
            if (pomodoroState.status != PomodoroStatus.RUNNING) break
            val next = (pomodoroState.remainingSeconds - 1).coerceAtLeast(0)
            if (next <= 0) {
                finalizePomodoro(pomodoroState.plannedMinutes, pomodoroState)
                break
            } else {
                pomodoroState = pomodoroState.copy(remainingSeconds = next)
            }
        }
    }

    SyllabusTrackerTheme {
        val selectedSubject = subjects.find { it.id == selectedSubjectId }

        Scaffold(
            snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
            bottomBar = {
                if (selectedSubject == null) {
                    val tabItems = listOf(
                        Triple(HomeTab.DASHBOARD, "Dashboard", Icons.Rounded.Home),
                        Triple(HomeTab.SYLLABUS, "Syllabus", Icons.Rounded.Book),
                        Triple(
                            HomeTab.FOCUS,
                            if (pomodoroState.status == PomodoroStatus.RUNNING) {
                                formatCountdown(pomodoroState.remainingSeconds)
                            } else {
                                "Focus"
                            },
                            Icons.Rounded.Timer
                        ),
                        Triple(HomeTab.DAILY_STATS, "Daily Stats", Icons.Rounded.BarChart),
                        Triple(HomeTab.STUDY_LOG, "Study Log", Icons.Rounded.Schedule),
                        Triple(HomeTab.STORE, "Store", Icons.Rounded.Storefront)
                    )
                    Surface(
                        color = MaterialTheme.colorScheme.surface,
                        tonalElevation = 3.dp
                    ) {
                        ScrollableTabRow(
                            selectedTabIndex = activeTab.ordinal,
                            edgePadding = 12.dp,
                            divider = {}
                        ) {
                            tabItems.forEach { (tab, label, icon) ->
                                Tab(
                                    selected = activeTab == tab,
                                    onClick = { activeTab = tab },
                                    icon = { Icon(icon, contentDescription = label) },
                                    text = { Text(text = label, maxLines = 1) }
                                )
                            }
                        }
                    }
                }
            }
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                AnimatedContent(
                    targetState = selectedSubjectId,
                    transitionSpec = {
                        if (targetState != null) {
                            (slideInHorizontally(tween(280)) { it } + fadeIn(tween(220))) togetherWith
                                (slideOutHorizontally(tween(240)) { -it / 4 } + fadeOut(tween(180)))
                        } else {
                            (slideInHorizontally(tween(280)) { -it / 4 } + fadeIn(tween(220))) togetherWith
                                (slideOutHorizontally(tween(240)) { it } + fadeOut(tween(180)))
                        }
                    },
                    label = "ScreenNavigationTransition"
                ) { currentSubjectId ->
                    val currentSubject = subjects.find { it.id == currentSubjectId }
                    if (currentSubject == null) {
                        when (activeTab) {
                            HomeTab.DASHBOARD -> {
                                val todayIso = LocalDate.now().toString()
                                val activeTodosState = DailyTodoDayCalculator.reconcileForDate(dailyTodosState, todayIso)
                                DashboardScreen(
                                    subjects = subjects,
                                    studyStats = studyStats,
                                    examCountdown = examCountdown,
                                    currentStreakDays = gamification.currentStreakDays,
                                    todayScreenTimeMinutes = screenTimeByDate[todayIso] ?: 0,
                                    dailyHabits = dailyHabits,
                                    todos = activeTodosState.items,
                                    onUpdateScreenTimeMinutes = { mins ->
                                        val clamped = mins.coerceIn(0, 24 * 60)
                                        screenTimeByDate = screenTimeByDate.toMutableMap().apply {
                                            put(todayIso, clamped)
                                        }
                                        gamificationStore.saveScreenTime(todayIso, clamped)
                                    },
                                    onAddTodo = { title ->
                                        val next = activeTodosState.copy(
                                            dateIso = todayIso,
                                            items = listOf(DailyTodosLocalStore.createItem(title)) + activeTodosState.items
                                        )
                                        dailyTodosState = next
                                        todosStore.save(next)
                                    },
                                    onToggleTodo = { id ->
                                        val next = activeTodosState.copy(
                                            dateIso = todayIso,
                                            items = activeTodosState.items.map { if (it.id == id) it.copy(completed = !it.completed) else it }
                                        )
                                        dailyTodosState = next
                                        todosStore.save(next)
                                    },
                                    onRemoveTodo = { id ->
                                        val next = activeTodosState.copy(
                                            dateIso = todayIso,
                                            items = activeTodosState.items.filterNot { it.id == id }
                                        )
                                        dailyTodosState = next
                                        todosStore.save(next)
                                    },
                                    onToggleMilestone = toggleMilestone,
                                    onOpenSettings = { showSettingsDialog = true },
                                    onOpenLogStudyDialog = { showLogDialog = true }
                                )
                            }
                            HomeTab.SYLLABUS -> {
                                HomeScreen(
                                    subjects = subjects,
                                    studyLogs = studyLogs,
                                    studyStats = studyStats,
                                    subjectGoals = subjectGoals,
                                    dailyHabits = dailyHabits,
                                    examSettings = examSettings,
                                    examCountdown = examCountdown,
                                    currentStreakDays = gamification.currentStreakDays,
                                    onUpdateExamSettings = { next ->
                                        examSettings = next
                                        examStore.save(next)
                                    },
                                    onToggleDailyHabit = { habitId ->
                                        val todayIso = LocalDate.now().toString()
                                        val reconciled = DailyHabitDefaults.reconcileForDate(dailyHabits, todayIso)
                                        val nextCompleted = reconciled.completedIds.toMutableSet().apply {
                                            if (!add(habitId)) remove(habitId)
                                        }
                                        val updated = reconciled.copy(completedIds = nextCompleted)
                                        dailyHabits = updated
                                        habitsStore.save(updated)
                                    },
                                    onAddDailyHabit = { title ->
                                        val todayIso = LocalDate.now().toString()
                                        val reconciled = DailyHabitDefaults.reconcileForDate(dailyHabits, todayIso)
                                        val newHabit = DailyHabit(
                                            id = "habit-${UUID.randomUUID()}",
                                            title = title.trim(),
                                            emoji = "✨",
                                            isDefault = false
                                        )
                                        val updated = reconciled.copy(habits = reconciled.habits + newHabit)
                                        dailyHabits = updated
                                        habitsStore.save(updated)
                                    },
                                    onRemoveDailyHabit = { habitId ->
                                        val todayIso = LocalDate.now().toString()
                                        val reconciled = DailyHabitDefaults.reconcileForDate(dailyHabits, todayIso)
                                        val updated = reconciled.copy(
                                            habits = reconciled.habits.filterNot { it.id == habitId },
                                            completedIds = reconciled.completedIds - habitId
                                        )
                                        dailyHabits = updated
                                        habitsStore.save(updated)
                                    },
                                    onUpdateSubjectGoals = { subjectGoals = it },
                                    onSubjectClick = { selectedSubjectId = it.id },
                                    onToggleMilestone = toggleMilestone,
                                    onOpenLogStudyDialog = { showLogDialog = true }
                                )
                            }
                            HomeTab.FOCUS -> {
                                PomodoroScreen(
                                    subjects = subjects,
                                    state = pomodoroState,
                                    onSelectMode = { mode ->
                                        val mins = if (mode == PomodoroMode.FOCUS) pomodoroState.focusMinutes else mode.defaultMinutes
                                        pomodoroState = pomodoroState.copy(
                                            mode = mode,
                                            plannedMinutes = mins,
                                            remainingSeconds = mins * 60,
                                            status = PomodoroStatus.IDLE
                                        )
                                    },
                                    onSetFocusMinutes = { mins ->
                                        val safe = mins.coerceIn(1, 180)
                                        pomodoroState = pomodoroState.copy(
                                            focusMinutes = safe,
                                            plannedMinutes = if (pomodoroState.mode == PomodoroMode.FOCUS) safe else pomodoroState.plannedMinutes,
                                            remainingSeconds = if (pomodoroState.mode == PomodoroMode.FOCUS) safe * 60 else pomodoroState.remainingSeconds,
                                            status = PomodoroStatus.IDLE
                                        )
                                    },
                                    onSelectSubject = { subjId ->
                                        val firstCh = chaptersForSubject(subjects.find { it.id == subjId }).firstOrNull()
                                        pomodoroState = pomodoroState.copy(
                                            subjectId = subjId,
                                            chapterId = firstCh?.chapterId.orEmpty()
                                        )
                                    },
                                    onSelectChapter = { chId ->
                                        pomodoroState = pomodoroState.copy(chapterId = chId)
                                    },
                                    onToggleTask = { task ->
                                        val next = pomodoroState.selectedTasks.toMutableSet().apply {
                                            if (!add(task)) remove(task)
                                        }
                                        pomodoroState = pomodoroState.copy(selectedTasks = next)
                                    },
                                    onStartOrResume = {
                                        pomodoroState = pomodoroState.copy(
                                            status = PomodoroStatus.RUNNING,
                                            lastAutoLoggedMessage = null
                                        )
                                    },
                                    onPause = {
                                        pomodoroState = pomodoroState.copy(status = PomodoroStatus.PAUSED)
                                    },
                                    onReset = {
                                        val mins = if (pomodoroState.mode == PomodoroMode.FOCUS) pomodoroState.focusMinutes else pomodoroState.mode.defaultMinutes
                                        pomodoroState = pomodoroState.copy(
                                            plannedMinutes = mins,
                                            remainingSeconds = mins * 60,
                                            status = PomodoroStatus.IDLE
                                        )
                                    },
                                    onFinishEarlyAndLog = {
                                        val elapsedMins = ((pomodoroState.plannedMinutes * 60 - pomodoroState.remainingSeconds) / 60).coerceAtLeast(1)
                                        finalizePomodoro(elapsedMins, pomodoroState)
                                    }
                                )
                            }
                            HomeTab.DAILY_STATS -> {
                                DailyStatsScreen(
                                    subjects = subjects,
                                    logs = studyLogs,
                                    badges = gamification.badges,
                                    currentStreakDays = gamification.currentStreakDays,
                                    screenTimeByDate = screenTimeByDate,
                                    onUpdateScreenTime = { dateIso, mins ->
                                        val clamped = mins.coerceIn(0, 24 * 60)
                                        screenTimeByDate = screenTimeByDate.toMutableMap().apply {
                                            put(dateIso, clamped)
                                        }
                                        gamificationStore.saveScreenTime(dateIso, clamped)
                                    },
                                    onOpenLogStudyDialog = { showLogDialog = true }
                                )
                            }
                            HomeTab.STUDY_LOG -> {
                                StudyLogScreen(
                                    logs = studyLogs,
                                    onDeleteLog = { id ->
                                        coroutineScope.launch { studyLogDao.deleteById(id) }
                                    }
                                )
                            }
                            HomeTab.STORE -> {
                                StoreScreen(
                                    coinState = heeCoinState,
                                    onPurchaseItem = { item ->
                                        val updated = HeeCoinCalculator.purchaseItem(heeCoinState, item)
                                        if (updated != null) {
                                            heeCoinState = updated
                                            coinStore.save(updated)
                                            coroutineScope.launch {
                                                snackbarHostState.showSnackbar(
                                                    "Purchased ${item.title} for ${item.price} Hee coins!",
                                                    duration = SnackbarDuration.Short
                                                )
                                            }
                                        }
                                    }
                                )
                            }
                        }
                    } else {
                        SubjectDetailScreen(
                            subject = currentSubject,
                            onBack = { selectedSubjectId = null },
                            onToggleMilestone = { subId, chapterId, milestone ->
                                toggleMilestone(currentSubject.id, subId, chapterId, milestone)
                            }
                        )
                    }
                }
            }
        }

        if (showLogDialog) {
            LogStudyTimeDialog(
                subjects = subjects,
                onDismiss = { showLogDialog = false },
                onSave = { subjectId, subjectName, dateIso, durationMinutes, items ->
                    val now = System.currentTimeMillis()
                    val todayIso = LocalDate.now().toString()
                    val milestoneTimestamp = if (dateIso == todayIso) {
                        now
                    } else {
                        LocalDate.parse(dateIso)
                            .atTime(12, 0)
                            .atZone(ZoneId.systemDefault())
                            .toInstant()
                            .toEpochMilli()
                    }
                    applyStudyLogMilestones(subjectId, items, milestoneTimestamp)
                    coroutineScope.launch {
                        studyLogDao.insertLog(
                            StudyLogEntity(
                                id = UUID.randomUUID().toString(),
                                subjectId = subjectId,
                                subjectName = subjectName,
                                dateIso = dateIso,
                                durationMinutes = durationMinutes,
                                createdAt = now,
                                items = items
                            )
                        )
                        snackbarHostState.showSnackbar(
                            message = "Success! Logged ${StudyTimeFormatter.formatDuration(durationMinutes)} for $subjectName",
                            duration = SnackbarDuration.Short
                        )
                    }
                    showLogDialog = false
                }
            )
        }

        val activeBadgePopup = badgePopupQueue.firstOrNull()
        if (activeBadgePopup != null) {
            AlertDialog(
                onDismissRequest = { badgePopupQueue = badgePopupQueue.drop(1) },
                title = {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(text = activeBadgePopup.emoji, fontSize = 44.sp)
                        Text(
                            text = "Badge Unlocked: ${activeBadgePopup.title}",
                            fontWeight = FontWeight.ExtraBold,
                            textAlign = TextAlign.Center
                        )
                    }
                },
                text = {
                    Text(
                        text = activeBadgePopup.description,
                        textAlign = TextAlign.Center
                    )
                },
                confirmButton = {
                    TextButton(onClick = { badgePopupQueue = badgePopupQueue.drop(1) }) {
                        Text("Awesome!")
                    }
                }
            )
        }
        if (showSettingsDialog) {
            AlertDialog(
                onDismissRequest = { showSettingsDialog = false },
                title = {
                    Text(
                        text = "Settings · Backup & Restore",
                        fontWeight = FontWeight.Bold
                    )
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "Export all study logs, syllabus ticks, streaks, screen time, and daily tasks to Downloads as a JSON file, or restore from a previous backup."
                        )
                        Button(
                            onClick = {
                                val json = SyllabusBackupManager.createBackupJson(
                                    subjects = subjects,
                                    studyLogs = studyLogs,
                                    subjectGoals = subjectGoals,
                                    savedBadgesMap = savedBadgesMap,
                                    screenTimeByDate = screenTimeByDate,
                                    dailyHabits = dailyHabits,
                                    dailyTodosState = dailyTodosState,
                                    examSettings = examSettings,
                                    streakCount = gamification.currentStreakDays,
                                    heeCoinState = heeCoinState
                                )
                                SyllabusBackupManager.saveBackupToDownloads(context, json)
                                    .onSuccess {
                                        showSettingsDialog = false
                                        coroutineScope.launch {
                                            snackbarHostState.showSnackbar(
                                                "Backup saved successfully!",
                                                duration = SnackbarDuration.Short
                                            )
                                        }
                                    }
                                    .onFailure { err ->
                                        coroutineScope.launch {
                                            snackbarHostState.showSnackbar(
                                                err.message ?: "Could not save backup.",
                                                duration = SnackbarDuration.Short
                                            )
                                        }
                                    }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Export Data (Backup)")
                        }
                        OutlinedButton(
                            onClick = { importBackupLauncher.launch(arrayOf("application/json", "*/*")) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Import Data (Restore)")
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showSettingsDialog = false }) {
                        Text("Close")
                    }
                }
            )
        }
    }
}
