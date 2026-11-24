package com.syllabustracker.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material3.Checkbox
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextDecoration
import com.syllabustracker.data.local.StudyLogEntity
import com.syllabustracker.data.local.StudyStatsSummary
import com.syllabustracker.data.local.StudyTimeFormatter
import com.syllabustracker.model.BoardExamSettings
import com.syllabustracker.model.Chapter
import com.syllabustracker.model.DailyHabitsState
import com.syllabustracker.model.ExamCountdownCalculator
import com.syllabustracker.model.ExamCountdownPhase
import com.syllabustracker.model.ExamCountdownSummary
import com.syllabustracker.model.GoalPeriod
import com.syllabustracker.model.MilestoneType
import com.syllabustracker.model.StudyGoalCalculator
import com.syllabustracker.model.Subject
import com.syllabustracker.model.SubjectGoalProgress
import com.syllabustracker.model.SubjectStudyGoal
import com.syllabustracker.model.SubjectTone
import com.syllabustracker.ui.components.ChapterRow
import com.syllabustracker.ui.components.ProgressRing
import com.syllabustracker.ui.components.SubjectCard

private enum class HomeSectionTab(val label: String) {
    OVERVIEW("Overview"),
    STUDY_GOALS("Study Goals")
}

private data class ChapterSearchHit(
    val subjectId: String,
    val subjectName: String,
    val tone: SubjectTone,
    val subSubjectId: String,
    val subSubjectName: String,
    val chapter: Chapter
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    subjects: List<Subject>,
    studyLogs: List<StudyLogEntity>,
    studyStats: StudyStatsSummary,
    subjectGoals: List<SubjectStudyGoal>,
    dailyHabits: DailyHabitsState,
    examSettings: BoardExamSettings,
    examCountdown: ExamCountdownSummary,
    currentStreakDays: Int,
    onUpdateExamSettings: (BoardExamSettings) -> Unit,
    onToggleDailyHabit: (String) -> Unit,
    onAddDailyHabit: (String) -> Unit,
    onRemoveDailyHabit: (String) -> Unit,
    onUpdateSubjectGoals: (List<SubjectStudyGoal>) -> Unit,
    onSubjectClick: (Subject) -> Unit,
    onToggleMilestone: (subjectId: String, subSubjectId: String, chapterId: String, milestone: MilestoneType) -> Unit,
    onOpenLogStudyDialog: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showSettingsDialog by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }
    var homeSectionTab by remember { mutableStateOf(HomeSectionTab.OVERVIEW) }
    var goalPeriod by remember { mutableStateOf(GoalPeriod.DAILY) }
    var showGoalsDialog by remember { mutableStateOf(false) }
    var focusedGoalSubjectId by remember { mutableStateOf<String?>(null) }

    val trimmedQuery = searchQuery.trim()
    val isSearching = trimmedQuery.isNotEmpty()
    val goalProgressItems = remember(subjects, studyLogs, subjectGoals, goalPeriod) {
        StudyGoalCalculator.calculateProgressList(
            subjects = subjects,
            logs = studyLogs,
            goals = subjectGoals,
            period = goalPeriod
        )
    }

    val searchResults = remember(subjects, trimmedQuery) {
        if (trimmedQuery.isEmpty()) emptyList()
        else subjects.flatMap { subject ->
            subject.subSubjects.flatMap { sub ->
                sub.chapters.filter { ch ->
                    ch.name.contains(trimmedQuery, ignoreCase = true) ||
                        sub.name.contains(trimmedQuery, ignoreCase = true) ||
                        subject.name.contains(trimmedQuery, ignoreCase = true)
                }.map { ch ->
                    ChapterSearchHit(
                        subjectId = subject.id,
                        subjectName = subject.name,
                        tone = subject.tone,
                        subSubjectId = sub.id,
                        subSubjectName = sub.name,
                        chapter = ch
                    )
                }
            }
        }
    }

    val totalChapters = subjects.sumOf { it.totalChapters }
    val completedChapters = subjects.sumOf { it.completedChapters }
    val overallProgress = if (totalChapters == 0) 0f else completedChapters.toFloat() / totalChapters

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Syllabus Tracker",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                },
                actions = {
                    Surface(
                        modifier = Modifier.padding(end = 4.dp),
                        shape = RoundedCornerShape(999.dp),
                        color = if (currentStreakDays > 0) Color(0xFFFFEDD5) else MaterialTheme.colorScheme.surfaceVariant
                    ) {
                        Text(
                            text = "🔥 $currentStreakDays",
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                            color = if (currentStreakDays > 0) Color(0xFFC2410C) else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    IconButton(onClick = { showSettingsDialog = true }) {
                        Icon(
                            imageVector = Icons.Rounded.Settings,
                            contentDescription = "Open settings"
                        )
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onOpenLogStudyDialog,
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(
                    imageVector = Icons.Rounded.Add,
                    contentDescription = "Log study time"
                )
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            BoardExamCountdownBanner(
                summary = examCountdown,
                onOpenSettings = { showSettingsDialog = true }
            )

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                singleLine = true,
                shape = RoundedCornerShape(16.dp),
                placeholder = { Text("Search chapters across all subjects...") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Rounded.Search,
                        contentDescription = "Search chapters"
                    )
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(
                                imageVector = Icons.Rounded.Close,
                                contentDescription = "Clear search"
                            )
                        }
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                    unfocusedContainerColor = MaterialTheme.colorScheme.primaryContainer
                )
            )

            AnimatedContent(
                targetState = isSearching,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "HomeSearchTransition"
            ) { searching ->
                if (searching) {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        if (searchResults.isEmpty()) {
                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(24.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Text(
                                            text = "No chapters found for \"$trimmedQuery\"",
                                            style = MaterialTheme.typography.titleSmall
                                        )
                                        TextButton(onClick = { searchQuery = "" }) {
                                            Text("Clear search")
                                        }
                                    }
                                }
                            }
                        } else {
                            itemsIndexed(
                                items = searchResults,
                                key = { _, hit -> "${hit.subjectId}-${hit.subSubjectId}-${hit.chapter.id}" }
                            ) { index, hit ->
                                ChapterRow(
                                    chapter = hit.chapter,
                                    index = index,
                                    tone = hit.tone,
                                    contextLabel = "${hit.subjectName} · ${hit.subSubjectName}",
                                    onToggleMilestone = { milestone ->
                                        onToggleMilestone(hit.subjectId, hit.subSubjectId, hit.chapter.id, milestone)
                                    }
                                )
                            }
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                SingleChoiceSegmentedButtonRow {
                                    HomeSectionTab.entries.forEachIndexed { index, tab ->
                                        SegmentedButton(
                                            selected = homeSectionTab == tab,
                                            onClick = { homeSectionTab = tab },
                                            shape = SegmentedButtonDefaults.itemShape(
                                                index = index,
                                                count = HomeSectionTab.entries.size
                                            )
                                        ) {
                                            Text(tab.label)
                                        }
                                    }
                                }
                                if (homeSectionTab == HomeSectionTab.STUDY_GOALS) {
                                    TextButton(onClick = {
                                        focusedGoalSubjectId = null
                                        showGoalsDialog = true
                                    }) {
                                        Text("Edit Goals")
                                    }
                                }
                            }
                        }

                        if (homeSectionTab == HomeSectionTab.OVERVIEW) {
                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.primaryContainer
                                    )
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(20.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(
                                            modifier = Modifier.weight(1f),
                                            verticalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Text(
                                                text = "Academic Progress",
                                                style = MaterialTheme.typography.labelMedium,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            Text(
                                                text = "Keep up the steady pace",
                                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                                color = MaterialTheme.colorScheme.onPrimaryContainer
                                            )
                                            Text(
                                                text = "$completedChapters of $totalChapters chapters completed",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                        ProgressRing(progress = overallProgress)
                                    }
                                }
                            }

                            item {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    StudyStatCard(
                                        label = "Today",
                                        value = StudyTimeFormatter.formatStatDuration(studyStats.todayMinutes),
                                        modifier = Modifier.weight(1f)
                                    )
                                    StudyStatCard(
                                        label = "This Week",
                                        value = StudyTimeFormatter.formatStatDuration(studyStats.weekMinutes),
                                        modifier = Modifier.weight(1f)
                                    )
                                    StudyStatCard(
                                        label = "This Month",
                                        value = StudyTimeFormatter.formatStatDuration(studyStats.monthMinutes),
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }

                            item {
                                DailyHabitsSection(
                                    state = dailyHabits,
                                    onToggleHabit = onToggleDailyHabit,
                                    onAddHabit = onAddDailyHabit,
                                    onRemoveHabit = onRemoveDailyHabit
                                )
                            }

                            itemsIndexed(subjects, key = { _, item -> item.id }) { index, subject ->
                                SubjectCard(
                                    subject = subject,
                                    index = index,
                                    onClick = { onSubjectClick(subject) }
                                )
                            }
                        } else {
                            item {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    GoalPeriod.entries.forEach { period ->
                                        FilterChip(
                                            selected = goalPeriod == period,
                                            onClick = { goalPeriod = period },
                                            label = { Text(period.label) }
                                        )
                                    }
                                }
                            }

                            itemsIndexed(goalProgressItems, key = { _, item -> item.subjectId }) { _, item ->
                                SubjectGoalProgressCard(
                                    item = item,
                                    onEdit = {
                                        focusedGoalSubjectId = item.subjectId
                                        showGoalsDialog = true
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showGoalsDialog) {
        EditStudyGoalsDialog(
            subjects = subjects,
            goals = subjectGoals,
            initialSubjectId = focusedGoalSubjectId,
            onDismiss = { showGoalsDialog = false },
            onSave = { updated ->
                onUpdateSubjectGoals(updated)
                showGoalsDialog = false
            }
        )
    }
}

@Composable
private fun StudyStatCard(
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@Composable
private fun SubjectGoalProgressCard(
    item: SubjectGoalProgress,
    onEdit: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = item.subjectName,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = if (item.hasGoal) {
                        "${StudyTimeFormatter.formatDuration(item.loggedMinutes)} / ${StudyTimeFormatter.formatDuration(item.targetMinutes)}"
                    } else {
                        "${StudyTimeFormatter.formatDuration(item.loggedMinutes)} logged · No ${item.period.label.lowercase()} goal"
                    },
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                    color = if (item.isGoalMet) Color(0xFF16A34A) else MaterialTheme.colorScheme.primary
                )
                TextButton(onClick = onEdit, contentPadding = PaddingValues(0.dp)) {
                    Icon(Icons.Rounded.Edit, contentDescription = null)
                    Text(if (item.hasGoal) " Edit Goal" else " Set Goal")
                }
            }

            ProgressRing(
                progress = item.ringProgress,
                size = 84.dp,
                strokeWidth = 8.dp,
                label = null,
                activeColor = if (item.isGoalMet) Color(0xFF16A34A) else MaterialTheme.colorScheme.primary
            )
        }
    }
}

@Composable
private fun EditStudyGoalsDialog(
    subjects: List<Subject>,
    goals: List<SubjectStudyGoal>,
    initialSubjectId: String?,
    onDismiss: () -> Unit,
    onSave: (List<SubjectStudyGoal>) -> Unit
) {
    var activeSubjectId by remember { mutableStateOf(initialSubjectId ?: subjects.firstOrNull()?.id.orEmpty()) }
    var goalMap by remember(goals) {
        mutableStateOf(goals.associateBy { it.subjectId }.toMutableMap())
    }
    val currentGoal = goalMap[activeSubjectId] ?: SubjectStudyGoal(activeSubjectId, 60, 360)
    var dailyHours by remember(activeSubjectId, goalMap) { mutableStateOf((currentGoal.dailyMinutes / 60).toString()) }
    var dailyMinutes by remember(activeSubjectId, goalMap) { mutableStateOf((currentGoal.dailyMinutes % 60).toString()) }
    var weeklyHours by remember(activeSubjectId, goalMap) { mutableStateOf((currentGoal.weeklyMinutes / 60).toString()) }
    var weeklyMinutes by remember(activeSubjectId, goalMap) { mutableStateOf((currentGoal.weeklyMinutes % 60).toString()) }

    fun syncDraft() {
        val dM = ((dailyHours.toIntOrNull() ?: 0).coerceIn(0, 24) * 60 + (dailyMinutes.toIntOrNull() ?: 0).coerceIn(0, 59)).coerceAtMost(1440)
        val wM = ((weeklyHours.toIntOrNull() ?: 0).coerceIn(0, 168) * 60 + (weeklyMinutes.toIntOrNull() ?: 0).coerceIn(0, 59)).coerceAtMost(10080)
        goalMap = goalMap.toMutableMap().apply {
            put(activeSubjectId, SubjectStudyGoal(activeSubjectId, dM, wM))
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Study Hour Goals") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    subjects.take(3).forEach { subject ->
                        FilterChip(
                            selected = subject.id == activeSubjectId,
                            onClick = {
                                syncDraft()
                                activeSubjectId = subject.id
                            },
                            label = { Text(subject.name.take(7)) }
                        )
                    }
                }
                Text("Daily Goal", style = MaterialTheme.typography.labelMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = dailyHours,
                        onValueChange = { dailyHours = it },
                        label = { Text("Hours") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = dailyMinutes,
                        onValueChange = { dailyMinutes = it },
                        label = { Text("Minutes") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text("Weekly Goal", style = MaterialTheme.typography.labelMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = weeklyHours,
                        onValueChange = { weeklyHours = it },
                        label = { Text("Hours") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = weeklyMinutes,
                        onValueChange = { weeklyMinutes = it },
                        label = { Text("Minutes") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                syncDraft()
                onSave(subjects.map { goalMap[it.id] ?: SubjectStudyGoal(it.id, 60, 360) })
            }) { Text("Save Goals") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@Composable
private fun DailyHabitsSection(
    state: DailyHabitsState,
    onToggleHabit: (String) -> Unit,
    onAddHabit: (String) -> Unit,
    onRemoveHabit: (String) -> Unit
) {
    var showAddInput by remember { mutableStateOf(false) }
    var draftHabitTitle by remember { mutableStateOf("") }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Daily Habits",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Non-study wellness goals · resets daily",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${state.completedIds.size}/${state.habits.size} done",
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.primary
                    )
                    TextButton(onClick = { showAddInput = !showAddInput }) {
                        Text(if (showAddInput) "Close" else "+ Add")
                    }
                }
            }

            if (showAddInput) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = draftHabitTitle,
                        onValueChange = { draftHabitTitle = it },
                        placeholder = { Text("e.g. Meditate 10m") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    TextButton(
                        onClick = {
                            val trimmed = draftHabitTitle.trim()
                            if (trimmed.isNotEmpty()) {
                                onAddHabit(trimmed)
                                draftHabitTitle = ""
                                showAddInput = false
                            }
                        }
                    ) {
                        Text("Save")
                    }
                }
            }

            state.habits.forEach { habit ->
                val isChecked = habit.id in state.completedIds
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            if (isChecked) Color(0xFFECFDF5)
                            else MaterialTheme.colorScheme.background
                        )
                        .clickable { onToggleHabit(habit.id) }
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = isChecked,
                        onCheckedChange = { onToggleHabit(habit.id) }
                    )
                    Text(
                        text = "${habit.emoji} ${habit.title}",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Medium,
                            textDecoration = if (isChecked) TextDecoration.LineThrough else TextDecoration.None
                        ),
                        color = if (isChecked) Color(0xFF15803D) else MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.weight(1f)
                    )
                    if (!habit.isDefault) {
                        IconButton(onClick = { onRemoveHabit(habit.id) }) {
                            Icon(
                                imageVector = Icons.Rounded.Delete,
                                contentDescription = "Remove habit"
                            )
                        }
                    }
                }
            }
        }
    }

    if (showSettingsDialog) {
        BoardExamSettingsDialog(
            currentSettings = examSettings,
            onDismiss = { showSettingsDialog = false },
            onSave = { next ->
                onUpdateExamSettings(next)
                showSettingsDialog = false
            }
        )
    }
}

@Composable
private fun BoardExamCountdownBanner(
    summary: ExamCountdownSummary,
    onOpenSettings: () -> Unit
) {
    val isUrgent = summary.phase == ExamCountdownPhase.TODAY ||
        (summary.phase == ExamCountdownPhase.UPCOMING && summary.daysRemaining <= 14)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Board Exam Countdown",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "CBSE Class 10th · ${summary.formattedDate}" +
                        if (!summary.isCustom) " · Estimated" else "",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = if (summary.phase == ExamCountdownPhase.PASSED) "Passed" else summary.headlineValue,
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                        color = if (isUrgent) Color(0xFFC2410C) else MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = summary.headlineUnit,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                IconButton(onClick = onOpenSettings) {
                    Icon(
                        imageVector = Icons.Rounded.Edit,
                        contentDescription = "Edit Board Exam date"
                    )
                }
            }
        }
    }
}

@Composable
private fun BoardExamSettingsDialog(
    currentSettings: BoardExamSettings,
    onDismiss: () -> Unit,
    onSave: (BoardExamSettings) -> Unit
) {
    var dateInput by remember(currentSettings) { mutableStateOf(currentSettings.examDateIso) }
    var isCustom by remember(currentSettings) { mutableStateOf(currentSettings.isCustom) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Settings") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "CBSE Class 10th Board Exam Date (YYYY-MM-DD)",
                    style = MaterialTheme.typography.labelLarge
                )
                OutlinedTextField(
                    value = dateInput,
                    onValueChange = {
                        dateInput = it
                        isCustom = true
                        errorMessage = null
                    },
                    singleLine = true,
                    placeholder = { Text("2027-02-15") },
                    isError = errorMessage != null,
                    modifier = Modifier.fillMaxWidth()
                )
                errorMessage?.let { msg ->
                    Text(
                        text = msg,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
                TextButton(
                    onClick = {
                        val defaults = ExamCountdownCalculator.defaultSettings()
                        dateInput = defaults.examDateIso
                        isCustom = false
                        errorMessage = null
                    }
                ) {
                    Text("Reset to estimated default")
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val parsed = ExamCountdownCalculator.parseValidDateOrNull(dateInput)
                    if (parsed == null) {
                        errorMessage = "Enter a valid date as YYYY-MM-DD (2020–2040)."
                    } else {
                        onSave(BoardExamSettings(examDateIso = parsed.toString(), isCustom = isCustom))
                    }
                }
            ) {
                Text("Save Settings")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

