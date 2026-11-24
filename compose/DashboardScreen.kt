package com.syllabustracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.syllabustracker.data.local.StudyStatsSummary
import com.syllabustracker.data.local.StudyTimeFormatter
import com.syllabustracker.model.Chapter
import com.syllabustracker.model.DailyHabitsState
import com.syllabustracker.model.DailyTodoDayCalculator
import com.syllabustracker.model.DailyTodoItem
import com.syllabustracker.model.ExamCountdownPhase
import com.syllabustracker.model.ExamCountdownSummary
import com.syllabustracker.model.MilestoneType
import com.syllabustracker.model.Subject
import com.syllabustracker.model.SubjectTone
import com.syllabustracker.ui.components.ChapterRow
import com.syllabustracker.ui.components.ProgressRing
import kotlin.math.roundToInt

private data class DashboardSearchHit(
    val subjectId: String,
    val subjectName: String,
    val tone: SubjectTone,
    val subSubjectId: String,
    val subSubjectName: String,
    val chapter: Chapter
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    subjects: List<Subject>,
    studyStats: StudyStatsSummary,
    examCountdown: ExamCountdownSummary,
    currentStreakDays: Int,
    todayScreenTimeMinutes: Int,
    dailyHabits: DailyHabitsState,
    todos: List<DailyTodoItem>,
    onUpdateScreenTimeMinutes: (Int) -> Unit,
    onAddTodo: (String) -> Unit,
    onToggleTodo: (String) -> Unit,
    onRemoveTodo: (String) -> Unit,
    onToggleMilestone: (subjectId: String, subSubjectId: String, chapterId: String, milestone: MilestoneType) -> Unit,
    onOpenSettings: () -> Unit,
    onOpenLogStudyDialog: () -> Unit,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var newTaskTitle by remember { mutableStateOf("") }
    var showRemainingOnly by remember { mutableStateOf(false) }
    val workSummary = remember(todos) { DailyTodoDayCalculator.evaluateDailyWork(todos) }
    val displayedTodos = if (showRemainingOnly) workSummary.remainingItems else todos
    var screenHoursInput by remember(todayScreenTimeMinutes) {
        val hours = todayScreenTimeMinutes / 60f
        mutableStateOf(
            if (todayScreenTimeMinutes == 0) "0"
            else if (todayScreenTimeMinutes % 60 == 0) (todayScreenTimeMinutes / 60).toString()
            else String.format("%.1f", hours)
        )
    }

    val trimmedQuery = searchQuery.trim()
    val isSearching = trimmedQuery.isNotEmpty()
    val searchResults = remember(subjects, trimmedQuery) {
        if (trimmedQuery.isEmpty()) emptyList()
        else subjects.flatMap { subject ->
            subject.subSubjects.flatMap { sub ->
                sub.chapters.filter { ch ->
                    ch.name.contains(trimmedQuery, ignoreCase = true) ||
                        sub.name.contains(trimmedQuery, ignoreCase = true) ||
                        subject.name.contains(trimmedQuery, ignoreCase = true)
                }.map { ch ->
                    DashboardSearchHit(
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

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Dashboard",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                },
                actions = {
                    IconButton(onClick = onOpenSettings) {
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
                Icon(imageVector = Icons.Rounded.Add, contentDescription = "Log study time")
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
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
                    Icon(imageVector = Icons.Rounded.Search, contentDescription = "Search chapters")
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(imageVector = Icons.Rounded.Close, contentDescription = "Clear search")
                        }
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                    unfocusedContainerColor = MaterialTheme.colorScheme.primaryContainer
                )
            )

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 96.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                if (isSearching) {
                    itemsIndexed(
                        searchResults,
                        key = { _, hit -> "${hit.subjectId}-${hit.subSubjectId}-${hit.chapter.id}" }
                    ) { idx, hit ->
                        ChapterRow(
                            chapter = hit.chapter,
                            index = idx,
                            tone = hit.tone,
                            contextLabel = "${hit.subjectName} · ${hit.subSubjectName}",
                            onToggleMilestone = { chId, milestone ->
                                onToggleMilestone(hit.subjectId, hit.subSubjectId, chId, milestone)
                            }
                        )
                    }
                } else {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(20.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text(
                                        text = "Board Countdown",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Text(
                                        text = "Class 10 Boards",
                                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Text(
                                        text = "Target · ${examCountdown.formattedDate}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text(
                                        text = if (examCountdown.phase == ExamCountdownPhase.PASSED) "0" else examCountdown.headlineValue,
                                        style = MaterialTheme.typography.headlineLarge.copy(fontWeight = FontWeight.ExtraBold),
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Text(
                                        text = examCountdown.headlineUnit,
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Card(
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = "Daily Study Time",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = StudyTimeFormatter.formatStatDuration(studyStats.todayMinutes),
                                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold)
                                    )
                                }
                            }

                            Card(
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (currentStreakDays > 0) Color(0xFFFFF7ED) else MaterialTheme.colorScheme.surface
                                )
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = "Study Streak",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = "🔥 $currentStreakDays ${if (currentStreakDays == 1) "day" else "days"}",
                                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                                        color = if (currentStreakDays > 0) Color(0xFFC2410C) else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }

                    item {
                        val isWarning = todayScreenTimeMinutes > studyStats.todayMinutes
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isWarning) Color(0xFFFEF2F2) else MaterialTheme.colorScheme.surface
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Wasted Screen Time",
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Text(
                                        text = if (isWarning) "Higher than today's study time!" else "Hours scrolled today",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = if (isWarning) Color(0xFFDC2626) else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                OutlinedTextField(
                                    value = screenHoursInput,
                                    onValueChange = { raw ->
                                        screenHoursInput = raw
                                        val hrs = raw.toFloatOrNull()
                                        if (hrs != null && hrs >= 0f) {
                                            val mins = (hrs.coerceAtMost(24f) * 60f).roundToInt()
                                            onUpdateScreenTimeMinutes(mins)
                                        }
                                    },
                                    label = { Text("Hours") },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                    modifier = Modifier.fillMaxWidth(0.35f)
                                )
                            }
                        }
                    }

                    item {
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
                                        text = "${workSummary.formattedDayLabel} · Daily Work Progress",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Text(
                                        text = "${workSummary.progressPercent}% done · ${workSummary.remainingCount} remaining",
                                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Text(
                                        text = "Habits: ${dailyHabits.completedIds.size}/${dailyHabits.habits.size} · Study: ${StudyTimeFormatter.formatStatDuration(studyStats.todayMinutes)}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                ProgressRing(
                                    progress = workSummary.progressPercent / 100f,
                                    size = 76.dp,
                                    strokeWidth = 8.dp,
                                    label = null,
                                    activeColor = if (workSummary.progressPercent == 100) Color(0xFF16A34A) else MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }

                    item {
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
                                            text = "Daily Tasks & Goals",
                                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                        )
                                        Text(
                                            text = "${workSummary.formattedDayLabel} · ${workSummary.remainingCount} remaining · ${workSummary.completedCount}/${workSummary.totalCount} done",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        FilterChip(
                                            selected = !showRemainingOnly,
                                            onClick = { showRemainingOnly = false },
                                            label = { Text("All (${workSummary.totalCount})") }
                                        )
                                        FilterChip(
                                            selected = showRemainingOnly,
                                            onClick = { showRemainingOnly = true },
                                            label = { Text("Remaining (${workSummary.remainingCount})") }
                                        )
                                    }
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    OutlinedTextField(
                                        value = newTaskTitle,
                                        onValueChange = { newTaskTitle = it },
                                        placeholder = { Text("Add a task for today...") },
                                        singleLine = true,
                                        modifier = Modifier.weight(1f)
                                    )
                                    TextButton(
                                        onClick = {
                                            val trimmed = newTaskTitle.trim()
                                            if (trimmed.isNotEmpty()) {
                                                onAddTodo(trimmed)
                                                newTaskTitle = ""
                                            }
                                        }
                                    ) {
                                        Text("Add")
                                    }
                                }

                                if (displayedTodos.isEmpty()) {
                                    Text(
                                        text = if (todos.isEmpty()) "No tasks added for today yet." else "No remaining tasks for today!",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                } else {
                                    displayedTodos.forEach { todo ->
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(
                                                    if (todo.completed) Color(0xFFECFDF5)
                                                    else MaterialTheme.colorScheme.background
                                                )
                                                .clickable { onToggleTodo(todo.id) }
                                                .padding(horizontal = 8.dp, vertical = 4.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Checkbox(
                                                checked = todo.completed,
                                                onCheckedChange = { onToggleTodo(todo.id) }
                                            )
                                            Text(
                                                text = todo.title,
                                                style = MaterialTheme.typography.bodyMedium.copy(
                                                    textDecoration = if (todo.completed) TextDecoration.LineThrough else TextDecoration.None
                                                ),
                                                modifier = Modifier.weight(1f)
                                            )
                                            IconButton(onClick = { onRemoveTodo(todo.id) }) {
                                                Icon(
                                                    imageVector = Icons.Rounded.Delete,
                                                    contentDescription = "Delete task"
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
