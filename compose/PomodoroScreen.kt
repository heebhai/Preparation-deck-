package com.syllabustracker.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.syllabustracker.data.local.StudyTimeFormatter
import com.syllabustracker.model.MilestoneType
import com.syllabustracker.model.Subject

enum class PomodoroMode(val label: String, val defaultMinutes: Int) {
    FOCUS("Focus", 25),
    SHORT_BREAK("Break 5m", 5),
    LONG_BREAK("Long 15m", 15)
}

enum class PomodoroStatus {
    IDLE, RUNNING, PAUSED
}

data class PomodoroChapterOption(
    val subSubjectId: String,
    val subSubjectName: String,
    val chapterId: String,
    val chapterName: String
)

data class PomodoroUiState(
    val mode: PomodoroMode = PomodoroMode.FOCUS,
    val focusMinutes: Int = 25,
    val plannedMinutes: Int = 25,
    val remainingSeconds: Int = 25 * 60,
    val status: PomodoroStatus = PomodoroStatus.IDLE,
    val subjectId: String = "science",
    val chapterId: String = "sci-phy-1",
    val selectedTasks: Set<MilestoneType> = emptySet(),
    val lastAutoLoggedMessage: String? = null,
    val completedSessionsToday: Int = 0
)

fun formatCountdown(seconds: Int): String {
    val safe = seconds.coerceAtLeast(0)
    val mins = safe / 60
    val secs = safe % 60
    return "%02d:%02d".format(mins, secs)
}

fun chaptersForSubject(subject: Subject?): List<PomodoroChapterOption> {
    if (subject == null) return emptyList()
    return subject.subSubjects.flatMap { sub ->
        sub.chapters.map { ch ->
            PomodoroChapterOption(
                subSubjectId = sub.id,
                subSubjectName = sub.name,
                chapterId = ch.id,
                chapterName = ch.name
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun PomodoroScreen(
    subjects: List<Subject>,
    state: PomodoroUiState,
    onSelectMode: (PomodoroMode) -> Unit,
    onSetFocusMinutes: (Int) -> Unit,
    onSelectSubject: (String) -> Unit,
    onSelectChapter: (String) -> Unit,
    onToggleTask: (MilestoneType) -> Unit,
    onStartOrResume: () -> Unit,
    onPause: () -> Unit,
    onReset: () -> Unit,
    onFinishEarlyAndLog: () -> Unit,
    modifier: Modifier = Modifier
) {
    val selectedSubject = subjects.find { it.id == state.subjectId } ?: subjects.firstOrNull()
    val chapterOptions = remember(selectedSubject) { chaptersForSubject(selectedSubject) }
    val selectedChapter = chapterOptions.find { it.chapterId == state.chapterId } ?: chapterOptions.firstOrNull()

    val totalSeconds = (state.plannedMinutes * 60).coerceAtLeast(60)
    val elapsedSeconds = (totalSeconds - state.remainingSeconds).coerceAtLeast(0)
    val progress = (state.remainingSeconds.toFloat() / totalSeconds.toFloat()).coerceIn(0f, 1f)
    val isLocked = state.status != PomodoroStatus.IDLE

    var subjectExpanded by remember { mutableStateOf(false) }
    var chapterExpanded by remember { mutableStateOf(false) }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Focus Timer",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                }
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (state.lastAutoLoggedMessage != null) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFDCFCE7))
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Rounded.CheckCircle, contentDescription = null, tint = Color(0xFF15803D))
                            Text(
                                text = state.lastAutoLoggedMessage,
                                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                                color = Color(0xFF15803D)
                            )
                        }
                    }
                }
            }

            item {
                SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                    PomodoroMode.entries.forEachIndexed { index, mode ->
                        SegmentedButton(
                            selected = state.mode == mode,
                            onClick = { onSelectMode(mode) },
                            shape = SegmentedButtonDefaults.itemShape(
                                index = index,
                                count = PomodoroMode.entries.size
                            )
                        ) {
                            Text(mode.label)
                        }
                    }
                }
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = if (state.mode == PomodoroMode.FOCUS && selectedSubject != null) {
                                "${selectedSubject.name}${selectedChapter?.let { " · ${it.chapterName}" } ?: ""}"
                            } else {
                                state.mode.label
                            },
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Box(
                            modifier = Modifier.size(210.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            val trackColor = MaterialTheme.colorScheme.surfaceVariant
                            val activeColor = if (state.mode == PomodoroMode.FOCUS) {
                                MaterialTheme.colorScheme.primary
                            } else {
                                Color(0xFF2B7A58)
                            }
                            Canvas(modifier = Modifier.fillMaxSize()) {
                                val stroke = 12.dp.toPx()
                                drawArc(
                                    color = trackColor,
                                    startAngle = -90f,
                                    sweepAngle = 360f,
                                    useCenter = false,
                                    style = Stroke(width = stroke, cap = StrokeCap.Round)
                                )
                                drawArc(
                                    color = activeColor,
                                    startAngle = -90f,
                                    sweepAngle = 360f * progress,
                                    useCenter = false,
                                    style = Stroke(width = stroke, cap = StrokeCap.Round)
                                )
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = formatCountdown(state.remainingSeconds),
                                    style = MaterialTheme.typography.displayMedium.copy(
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 44.sp
                                    ),
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                Text(
                                    text = if (state.mode == PomodoroMode.FOCUS) {
                                        "${StudyTimeFormatter.formatDuration(state.plannedMinutes)} auto-logs"
                                    } else {
                                        "${state.plannedMinutes}m break"
                                    },
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        if (state.mode == PomodoroMode.FOCUS) {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                listOf(15, 25, 45, 60).forEach { mins ->
                                    FilterChip(
                                        selected = state.focusMinutes == mins,
                                        onClick = { onSetFocusMinutes(mins) },
                                        enabled = !isLocked,
                                        label = { Text("${mins}m") }
                                    )
                                }
                            }
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Button(
                                onClick = if (state.status == PomodoroStatus.RUNNING) onPause else onStartOrResume,
                                shape = RoundedCornerShape(14.dp)
                            ) {
                                Icon(
                                    imageVector = if (state.status == PomodoroStatus.RUNNING) {
                                        Icons.Rounded.Pause
                                    } else {
                                        Icons.Rounded.PlayArrow
                                    },
                                    contentDescription = null
                                )
                                Text(
                                    when (state.status) {
                                        PomodoroStatus.RUNNING -> " Pause"
                                        PomodoroStatus.PAUSED -> " Resume"
                                        PomodoroStatus.IDLE -> if (state.mode == PomodoroMode.FOCUS) " Start Focus" else " Start Break"
                                    }
                                )
                            }
                            OutlinedButton(onClick = onReset, shape = RoundedCornerShape(14.dp)) {
                                Icon(Icons.Rounded.Refresh, contentDescription = null)
                                Text(" Reset")
                            }
                            if (state.mode == PomodoroMode.FOCUS && state.status != PomodoroStatus.IDLE && elapsedSeconds >= 60) {
                                OutlinedButton(onClick = onFinishEarlyAndLog, shape = RoundedCornerShape(14.dp)) {
                                    Text("Finish & Log")
                                }
                            }
                        }
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
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Study Target",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold)
                        )

                        ExposedDropdownMenuBox(
                            expanded = subjectExpanded && !isLocked,
                            onExpandedChange = { if (!isLocked) subjectExpanded = it }
                        ) {
                            OutlinedTextField(
                                value = selectedSubject?.name.orEmpty(),
                                onValueChange = {},
                                readOnly = true,
                                enabled = !isLocked,
                                label = { Text("Subject") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = subjectExpanded) },
                                modifier = Modifier.menuAnchor().fillMaxWidth()
                            )
                            ExposedDropdownMenu(
                                expanded = subjectExpanded && !isLocked,
                                onDismissRequest = { subjectExpanded = false }
                            ) {
                                subjects.forEach { subj ->
                                    DropdownMenuItem(
                                        text = { Text(subj.name) },
                                        onClick = {
                                            onSelectSubject(subj.id)
                                            subjectExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        ExposedDropdownMenuBox(
                            expanded = chapterExpanded && !isLocked,
                            onExpandedChange = { if (!isLocked) chapterExpanded = it }
                        ) {
                            OutlinedTextField(
                                value = selectedChapter?.chapterName.orEmpty(),
                                onValueChange = {},
                                readOnly = true,
                                enabled = !isLocked,
                                label = { Text("Chapter") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = chapterExpanded) },
                                modifier = Modifier.menuAnchor().fillMaxWidth()
                            )
                            ExposedDropdownMenu(
                                expanded = chapterExpanded && !isLocked,
                                onDismissRequest = { chapterExpanded = false }
                            ) {
                                chapterOptions.forEach { option ->
                                    DropdownMenuItem(
                                        text = { Text("${option.subSubjectName} · ${option.chapterName}") },
                                        onClick = {
                                            onSelectChapter(option.chapterId)
                                            chapterExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        Text(
                            text = "Auto-check tasks on finish (optional)",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            MilestoneType.entries.forEach { task ->
                                FilterChip(
                                    selected = task in state.selectedTasks,
                                    onClick = { onToggleTask(task) },
                                    enabled = !isLocked,
                                    label = { Text(task.label) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
