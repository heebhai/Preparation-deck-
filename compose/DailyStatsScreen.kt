package com.syllabustracker.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.ChevronLeft
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.EmojiEvents
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.syllabustracker.data.local.StudyLogEntity
import com.syllabustracker.data.local.StudyTimeFormatter
import com.syllabustracker.model.Chapter
import com.syllabustracker.model.MilestoneType
import com.syllabustracker.model.StudyBadgeId
import com.syllabustracker.model.StudyBadgeStatus
import com.syllabustracker.model.Subject
import com.syllabustracker.model.SubjectTone
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private enum class StatsSubTab(val label: String) {
    DAILY("Daily"),
    MONTHLY("Monthly")
}

private data class DailyBarPoint(
    val date: LocalDate,
    val dayLabel: String,
    val totalMinutes: Int,
    val isToday: Boolean,
    val isHighlighted: Boolean
)

private data class TodayChapterActivity(
    val subjectName: String,
    val subSubjectName: String,
    val tone: SubjectTone,
    val chapter: Chapter,
    val checkedToday: List<MilestoneType>,
    val isFullyComplete: Boolean,
    val latestTimestamp: Long
)

private data class MonthlyDayCell(
    val date: LocalDate,
    val totalMinutes: Int,
    val chapterUpdatesCount: Int,
    val isToday: Boolean,
    val isFuture: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DailyStatsScreen(
    subjects: List<Subject>,
    logs: List<StudyLogEntity>,
    badges: List<StudyBadgeStatus>,
    currentStreakDays: Int,
    screenTimeByDate: Map<String, Int>,
    onUpdateScreenTime: (String, Int) -> Unit,
    onOpenLogStudyDialog: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = isSystemInDarkTheme()
    val today = remember { LocalDate.now() }
    val currentMonth = remember(today) { YearMonth.from(today) }

    var activeSubTab by remember { mutableStateOf(StatsSubTab.DAILY) }
    var selectedDate by remember { mutableStateOf(today) }
    var viewedMonth by remember { mutableStateOf(currentMonth) }

    val selectedDateIso = remember(selectedDate) { selectedDate.toString() }
    val isViewingToday = selectedDate == today
    val dateHeading = remember(selectedDate) {
        selectedDate.format(DateTimeFormatter.ofPattern("EEEE, d MMM yyyy", Locale.getDefault()))
    }
    val shortDateLabel = remember(selectedDateIso) {
        StudyTimeFormatter.formatDateLabel(selectedDateIso)
    }

    val dayLogs = remember(logs, selectedDateIso) {
        logs.filter { it.dateIso == selectedDateIso && it.durationMinutes > 0 }
            .sortedByDescending { it.createdAt }
    }
    // Enforce strict 24h daily cap
    val dayTotalMinutes = remember(dayLogs) {
        StudyTimeFormatter.capDailyDuration(dayLogs.sumOf { it.durationMinutes })
    }

    val last7Days = remember(logs, selectedDate, today) {
        val cappedByDate = StudyTimeFormatter.cappedMinutesByDate(logs)
        val dayFmt = DateTimeFormatter.ofPattern("EEE", Locale.getDefault())
        (-6L..0L).map { offset ->
            val date = selectedDate.plusDays(offset)
            DailyBarPoint(
                date = date,
                dayLabel = date.format(dayFmt),
                totalMinutes = cappedByDate[date.toString()] ?: 0,
                isToday = date == today,
                isHighlighted = date == selectedDate
            )
        }
    }
    val last7TotalMinutes = remember(last7Days) { last7Days.sumOf { it.totalMinutes } }
    val selectedScreenTimeMinutes = screenTimeByDate[selectedDateIso] ?: 0

    val dayChapters = remember(subjects, selectedDate) {
        val zone = ZoneId.systemDefault()
        buildList {
            for (subject in subjects) {
                for (sub in subject.subSubjects) {
                    for (chapter in sub.chapters) {
                        val checked = mutableListOf<MilestoneType>()
                        var latestTs = 0L
                        for (m in MilestoneType.entries) {
                            val isChecked = when (m) {
                                MilestoneType.LECTURE -> chapter.milestones.lecture
                                MilestoneType.NOTES -> chapter.milestones.notes
                                MilestoneType.PRACTICE -> chapter.milestones.practice
                                MilestoneType.EXTRA -> chapter.milestones.extra
                            }
                            val ts = chapter.milestoneTimestamps[m]
                            if (isChecked && ts != null) {
                                val tsDate = Instant.ofEpochMilli(ts).atZone(zone).toLocalDate()
                                if (tsDate == selectedDate) {
                                    checked.add(m)
                                    if (ts > latestTs) latestTs = ts
                                }
                            }
                        }
                        if (checked.isNotEmpty()) {
                            add(
                                TodayChapterActivity(
                                    subjectName = subject.name,
                                    subSubjectName = sub.name,
                                    tone = subject.tone,
                                    chapter = chapter,
                                    checkedToday = checked,
                                    isFullyComplete = chapter.milestones.isComplete,
                                    latestTimestamp = latestTs
                                )
                            )
                        }
                    }
                }
            }
        }.sortedByDescending { it.latestTimestamp }
    }

    val monthCells = remember(viewedMonth, logs, subjects, today) {
        val cappedByDate = StudyTimeFormatter.cappedMinutesByDate(logs)
        val zone = ZoneId.systemDefault()
        val chapterUpdatesByDate = mutableMapOf<LocalDate, MutableSet<String>>()
        for (subject in subjects) {
            for (sub in subject.subSubjects) {
                for (chapter in sub.chapters) {
                    for (m in MilestoneType.entries) {
                        val ts = chapter.milestoneTimestamps[m] ?: continue
                        val d = Instant.ofEpochMilli(ts).atZone(zone).toLocalDate()
                        if (YearMonth.from(d) == viewedMonth) {
                            chapterUpdatesByDate.getOrPut(d) { mutableSetOf() }.add(chapter.id)
                        }
                    }
                }
            }
        }
        (1..viewedMonth.lengthOfMonth()).map { day ->
            val date = viewedMonth.atDay(day)
            MonthlyDayCell(
                date = date,
                totalMinutes = cappedByDate[date.toString()] ?: 0,
                chapterUpdatesCount = chapterUpdatesByDate[date]?.size ?: 0,
                isToday = date == today,
                isFuture = date.isAfter(today)
            )
        }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Daily Stats",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
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
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Daily / Monthly Segmented Control
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    SingleChoiceSegmentedButtonRow {
                        StatsSubTab.entries.forEachIndexed { index, tab ->
                            SegmentedButton(
                                selected = activeSubTab == tab,
                                onClick = { activeSubTab = tab },
                                shape = SegmentedButtonDefaults.itemShape(
                                    index = index,
                                    count = StatsSubTab.entries.size
                                )
                            ) {
                                Text(tab.label)
                            }
                        }
                    }

                    if (activeSubTab == StatsSubTab.DAILY && !isViewingToday) {
                        TextButton(onClick = {
                            selectedDate = today
                            viewedMonth = currentMonth
                        }) {
                            Text("Back to Today")
                        }
                    }
                }
            }

            item {
                AnimatedContent(
                    targetState = activeSubTab,
                    transitionSpec = { fadeIn() togetherWith fadeOut() },
                    label = "DailyMonthlySwitcher"
                ) { tab ->
                    if (tab == StatsSubTab.MONTHLY) {
                        MonthlyCalendarSection(
                            viewedMonth = viewedMonth,
                            currentMonth = currentMonth,
                            selectedDate = selectedDate,
                            cells = monthCells,
                            logs = logs,
                            isDark = isDark,
                            onPrevMonth = { viewedMonth = viewedMonth.minusMonths(1) },
                            onNextMonth = {
                                if (viewedMonth.isBefore(currentMonth)) {
                                    viewedMonth = viewedMonth.plusMonths(1)
                                }
                            },
                            onJumpTodayMonth = { viewedMonth = currentMonth },
                            onSelectDate = { tappedDate ->
                                selectedDate = tappedDate
                                activeSubTab = StatsSubTab.DAILY
                            }
                        )
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            // 1. Header Card: Selected Date + Total Hours Studied (capped at 24h)
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.primaryContainer
                                )
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(20.dp),
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = dateHeading,
                                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Text(
                                        text = if (isViewingToday) {
                                            "${StudyTimeFormatter.formatStatDuration(dayTotalMinutes)} studied today"
                                        } else {
                                            "${StudyTimeFormatter.formatStatDuration(dayTotalMinutes)} studied on $shortDateLabel"
                                        },
                                        style = MaterialTheme.typography.headlineMedium.copy(
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 30.sp
                                        ),
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                    Text(
                                        text = "${dayLogs.size} sessions logged · ${dayChapters.size} chapters updated",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            AchievementsSection(
                                badges = badges,
                                currentStreakDays = currentStreakDays,
                                isDark = isDark
                            )

                            ScreenTimeSection(
                                shortDateLabel = shortDateLabel,
                                isViewingToday = isViewingToday,
                                screenTimeMinutes = selectedScreenTimeMinutes,
                                studyTimeMinutes = dayTotalMinutes,
                                isDark = isDark,
                                onChangeScreenTime = { mins -> onUpdateScreenTime(selectedDateIso, mins) }
                            )

                            // 2. Last 7 Days Visual Bar Chart (Canvas)
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(18.dp),
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(
                                                text = if (isViewingToday) "Last 7 Days" else "7 Days Ending $shortDateLabel",
                                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                            Text(
                                                text = "Daily study time across all subjects",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                        Text(
                                            text = "${StudyTimeFormatter.formatDuration(last7TotalMinutes)} total",
                                            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }

                                    Last7DaysCanvasBarChart(
                                        series = last7Days,
                                        isDark = isDark,
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                }
                            }

                            // 3. Activity Box
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(18.dp),
                                    verticalArrangement = Arrangement.spacedBy(14.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = if (isViewingToday) "Today's Activity" else "Activity on $shortDateLabel",
                                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = "${dayChapters.size + dayLogs.size} entries",
                                            style = MaterialTheme.typography.labelMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }

                                    if (dayChapters.isEmpty() && dayLogs.isEmpty()) {
                                        Column(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(vertical = 24.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally,
                                            verticalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Rounded.Schedule,
                                                contentDescription = null,
                                                tint = MaterialTheme.colorScheme.primary,
                                                modifier = Modifier.size(32.dp)
                                            )
                                            Text(
                                                text = "No study sessions logged yet. Tap + to start!",
                                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                                                textAlign = TextAlign.Center,
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                        }
                                    } else {
                                        Text(
                                            text = if (isViewingToday) "CHAPTERS CHECKED TODAY" else "CHAPTERS CHECKED ON $shortDateLabel",
                                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )

                                        if (dayChapters.isEmpty()) {
                                            Text(
                                                text = "No chapters checked off for this day.",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        } else {
                                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                                dayChapters.forEach { item ->
                                                    TodayChapterCard(item = item, isDark = isDark)
                                                }
                                            }
                                        }

                                        HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)

                                        Text(
                                            text = if (isViewingToday) "STUDY TIME LOGGED TODAY" else "STUDY TIME LOGGED ON $shortDateLabel",
                                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )

                                        if (dayLogs.isEmpty()) {
                                            Text(
                                                text = "No manual study time logged for this day.",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        } else {
                                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                                dayLogs.forEach { log ->
                                                    AnimatedVisibility(
                                                        visible = true,
                                                        enter = fadeIn() + slideInVertically(initialOffsetY = { it / 4 })
                                                    ) {
                                                        TodayStudyLogCard(log = log)
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
    }
}

@Composable
private fun MonthlyCalendarSection(
    viewedMonth: YearMonth,
    currentMonth: YearMonth,
    selectedDate: LocalDate,
    cells: List<MonthlyDayCell>,
    logs: List<StudyLogEntity>,
    isDark: Boolean,
    onPrevMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onJumpTodayMonth: () -> Unit,
    onSelectDate: (LocalDate) -> Unit
) {
    val monthFormatter = remember { DateTimeFormatter.ofPattern("MMMM yyyy", Locale.getDefault()) }
    val totalMonthMinutes = remember(cells) { cells.sumOf { it.totalMinutes } }
    val activeDays = remember(cells) { cells.count { it.totalMinutes > 0 } }
    val monthPrefix = remember(viewedMonth) { viewedMonth.toString() }
    val totalSessions = remember(logs, monthPrefix) {
        logs.count { it.dateIso.startsWith(monthPrefix) && it.durationMinutes > 0 }
    }

    val leadingEmpty = remember(viewedMonth) {
        (viewedMonth.atDay(1).dayOfWeek.value - 1) // Monday = 0 .. Sunday = 6
    }
    val totalSlots = leadingEmpty + cells.size
    val rowCount = (totalSlots + 6) / 7

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            MonthlySummaryMiniCard("Month Total", StudyTimeFormatter.formatDuration(totalMonthMinutes), Modifier.weight(1f))
            MonthlySummaryMiniCard("Active Days", activeDays.toString(), Modifier.weight(1f))
            MonthlySummaryMiniCard("Sessions", totalSessions.toString(), Modifier.weight(1f))
        }

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
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.CalendarMonth,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = viewedMonth.format(monthFormatter),
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (viewedMonth != currentMonth) {
                            TextButton(onClick = onJumpTodayMonth) { Text("Today") }
                        }
                        IconButton(onClick = onPrevMonth) {
                            Icon(Icons.Rounded.ChevronLeft, contentDescription = "Previous month")
                        }
                        IconButton(
                            onClick = onNextMonth,
                            enabled = viewedMonth.isBefore(currentMonth)
                        ) {
                            Icon(Icons.Rounded.ChevronRight, contentDescription = "Next month")
                        }
                    }
                }

                Row(modifier = Modifier.fillMaxWidth()) {
                    listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun").forEach { wd ->
                        Text(
                            text = wd,
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    for (row in 0 until rowCount) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            for (col in 0 until 7) {
                                val slotIdx = row * 7 + col
                                val dayIdx = slotIdx - leadingEmpty
                                if (dayIdx !in cells.indices) {
                                    Spacer(modifier = Modifier.weight(1f).height(52.dp))
                                } else {
                                    val cell = cells[dayIdx]
                                    val isSelected = cell.date == selectedDate
                                    val bgColor = when {
                                        cell.isFuture -> Color.Transparent
                                        cell.totalMinutes >= 150 -> if (isDark) Color(0xFFB9ADFF) else Color(0xFF5B4BC4)
                                        cell.totalMinutes >= 60 -> if (isDark) Color(0xFF352E58) else Color(0xFFDDD5F8)
                                        cell.totalMinutes > 0 ->
                                            if (isDark) Color(0xFF25213A) else Color(0xFFEFEBF9)
                                        else -> MaterialTheme.colorScheme.background
                                    }
                                    val contentColor = when {
                                        cell.totalMinutes >= 150 -> if (isDark) Color(0xFF1B1252) else Color.White
                                        else -> MaterialTheme.colorScheme.onSurface
                                    }

                                    Column(
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(54.dp)
                                            .clip(RoundedCornerShape(12.dp))
                                            .alpha(if (cell.isFuture) 0.4f else 1f)
                                            .background(bgColor)
                                            .then(
                                                if (isSelected) {
                                                    Modifier.border(
                                                        2.dp,
                                                        MaterialTheme.colorScheme.primary,
                                                        RoundedCornerShape(12.dp)
                                                    )
                                                } else {
                                                    Modifier
                                                }
                                            )
                                            .clickable(enabled = !cell.isFuture) {
                                                onSelectDate(cell.date)
                                            }
                                            .padding(vertical = 6.dp, horizontal = 2.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            text = cell.date.dayOfMonth.toString(),
                                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                            color = contentColor
                                        )
                                        if (cell.totalMinutes > 0) {
                                            Text(
                                                text = StudyTimeFormatter.formatDuration(cell.totalMinutes),
                                                style = MaterialTheme.typography.labelSmall.copy(
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.SemiBold
                                                ),
                                                color = if (cell.totalMinutes >= 150) contentColor else MaterialTheme.colorScheme.primary,
                                                maxLines = 1
                                            )
                                        } else if (cell.chapterUpdatesCount > 0) {
                                            Box(
                                                modifier = Modifier
                                                    .size(6.dp)
                                                    .clip(CircleShape)
                                                    .background(Color(0xFF16A34A))
                                            )
                                        } else {
                                            Spacer(modifier = Modifier.height(6.dp))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                Text(
                    text = "Tap any date to filter stats & activity for that day",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun MonthlySummaryMiniCard(
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
private fun TodayStudyLogCard(log: StudyLogEntity) {
    val splitMins = StudyTimeFormatter.splitDurationEqually(log.durationMinutes, log.items.size)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        if (log.items.size <= 1) {
            val single = log.items.firstOrNull()
            val text = if (single != null) {
                "${StudyTimeFormatter.formatDuration(log.durationMinutes)} - ${log.subjectName} > ${single.chapterName} : ${single.tasks.joinToString(", ") { it.label }}"
            } else {
                "${StudyTimeFormatter.formatDuration(log.durationMinutes)} - ${log.subjectName}"
            }
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Rounded.Schedule,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = text,
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        } else {
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Rounded.Schedule,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = "${StudyTimeFormatter.formatDuration(log.durationMinutes)} - ${log.subjectName} (${log.items.size} chapters)",
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            log.items.forEachIndexed { idx, item ->
                Text(
                    text = "${StudyTimeFormatter.formatDuration(splitMins.getOrElse(idx) { 0 })} - ${log.subjectName} > ${item.chapterName} : ${item.tasks.joinToString(", ") { it.label }}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = 28.dp)
                )
            }
        }
    }
}

@Composable
private fun Last7DaysCanvasBarChart(
    series: List<DailyBarPoint>,
    isDark: Boolean,
    modifier: Modifier = Modifier
) {
    val maxMinutes = remember(series) { maxOf(60, series.maxOfOrNull { it.totalMinutes } ?: 0) }
    val todayBarColor = if (isDark) Color(0xFFB9ADFF) else Color(0xFF5B4BC4)
    val pastBarColor = if (isDark) Color(0xFF473E78) else Color(0xFFD6CFF6)
    val zeroBarColor = if (isDark) Color(0xFF282634) else Color(0xFFECE7F4)
    val gridColor = if (isDark) Color(0xFF2C2A36) else Color(0xFFEBE7F3)

    Column(modifier = modifier) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            series.forEach { point ->
                Text(
                    text = if (point.totalMinutes > 0) StudyTimeFormatter.formatDuration(point.totalMinutes) else "",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = if (point.isHighlighted) FontWeight.Bold else FontWeight.Medium,
                        fontSize = 10.sp
                    ),
                    color = if (point.isHighlighted) todayBarColor else MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f),
                    maxLines = 1
                )
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(140.dp)
        ) {
            val count = series.size.coerceAtLeast(1)
            val slotWidth = size.width / count
            val barWidth = (slotWidth * 0.52f).coerceAtMost(32.dp.toPx())
            val cornerPx = 8.dp.toPx()

            listOf(0.5f, 1f).forEach { ratio ->
                val y = size.height * (1f - ratio)
                drawLine(
                    color = gridColor,
                    start = Offset(0f, y),
                    end = Offset(size.width, y),
                    strokeWidth = 1.dp.toPx()
                )
            }

            series.forEachIndexed { index, point ->
                val centerX = slotWidth * index + slotWidth / 2f
                val left = centerX - barWidth / 2f
                val ratio = (point.totalMinutes.toFloat() / maxMinutes.toFloat()).coerceIn(0f, 1f)
                val barHeight = if (point.totalMinutes > 0) maxOf(10.dp.toPx(), size.height * ratio) else 4.dp.toPx()
                val top = size.height - barHeight

                val barColor = when {
                    point.totalMinutes == 0 -> zeroBarColor
                    point.isHighlighted -> todayBarColor
                    else -> pastBarColor
                }

                drawRoundRect(
                    color = barColor,
                    topLeft = Offset(left, top),
                    size = Size(barWidth, barHeight),
                    cornerRadius = CornerRadius(cornerPx, cornerPx)
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            series.forEach { point ->
                Text(
                    text = if (point.isToday) "Today" else point.dayLabel,
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = if (point.isHighlighted) FontWeight.Bold else FontWeight.Medium
                    ),
                    color = if (point.isHighlighted) todayBarColor else MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f),
                    maxLines = 1
                )
            }
        }
    }
}

@Composable
private fun TodayChapterCard(
    item: TodayChapterActivity,
    isDark: Boolean
) {
    val containerColor = if (item.isFullyComplete) {
        if (isDark) Color(0xFF123524) else Color(0xFFDCFCE7)
    } else {
        MaterialTheme.colorScheme.background
    }
    val borderColor = if (item.isFullyComplete) {
        if (isDark) Color(0xFF34D399) else Color(0xFF4ADE80)
    } else {
        MaterialTheme.colorScheme.surfaceVariant
    }
    val badgeBg = if (isDark) Color(0xFFFDE047) else Color(0xFFFACC15)
    val badgeFg = if (isDark) Color(0xFF2D1602) else Color(0xFF422006)
    val completeAccent = if (isDark) Color(0xFF6EE7B7) else Color(0xFF15803D)

    val badgeScale = remember { Animatable(if (item.isFullyComplete) 0.65f else 1f) }
    LaunchedEffect(item.isFullyComplete) {
        if (item.isFullyComplete) {
            badgeScale.snapTo(0.65f)
            badgeScale.animateTo(
                targetValue = 1f,
                animationSpec = spring(
                    dampingRatio = Spring.DampingRatioMediumBouncy,
                    stiffness = Spring.StiffnessMedium
                )
            )
        }
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = containerColor,
        border = BorderStroke(1.dp, borderColor)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.Top
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(
                            if (item.isFullyComplete) {
                                if (isDark) Color(0xFF34D399) else Color(0xFF16A34A)
                            } else {
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.14f)
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (item.isFullyComplete) Icons.Rounded.EmojiEvents else Icons.Rounded.CheckCircle,
                        contentDescription = null,
                        tint = if (item.isFullyComplete) {
                            if (isDark) Color(0xFF052E16) else Color.White
                        } else {
                            MaterialTheme.colorScheme.primary
                        },
                        modifier = Modifier.size(18.dp)
                    )
                }

                Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(
                        text = "${item.subjectName} · ${item.subSubjectName}",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                        color = if (item.isFullyComplete) completeAccent else MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = item.chapter.name,
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "Checked: ${item.checkedToday.joinToString(", ") { it.label }}",
                        style = MaterialTheme.typography.bodySmall,
                        color = if (item.isFullyComplete) completeAccent else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (item.isFullyComplete) {
                Spacer(modifier = Modifier.width(8.dp))
                Surface(
                    modifier = Modifier.scale(badgeScale.value),
                    shape = RoundedCornerShape(999.dp),
                    color = badgeBg
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.AutoAwesome,
                            contentDescription = null,
                            tint = badgeFg,
                            modifier = Modifier.size(12.dp)
                        )
                        Text(
                            text = "COMPLETE",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 10.sp
                            ),
                            color = badgeFg
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AchievementsSection(
    badges: List<StudyBadgeStatus>,
    currentStreakDays: Int,
    isDark: Boolean
) {
    val unlockedCount = badges.count { it.unlocked }
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Achievements",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = if (currentStreakDays >= 1) {
                            "$currentStreakDays-day streak active"
                        } else {
                            "Locked badges stay grey until unlocked"
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Text(
                    text = "$unlockedCount/${badges.size} unlocked",
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary
                )
            }

            badges.forEach { badge ->
                val accentBg = if (!badge.unlocked) {
                    if (isDark) Color(0xFF1F1F24) else Color(0xFFF4F4F5)
                } else {
                    when (badge.id) {
                        StudyBadgeId.EARLY_BIRD -> if (isDark) Color(0xFF2B2210) else Color(0xFFFFFBEB)
                        StudyBadgeId.NIGHT_OWL -> if (isDark) Color(0xFF1B1F38) else Color(0xFFEEF2FF)
                        StudyBadgeId.CHAPTER_CRUSHER -> if (isDark) Color(0xFF112A20) else Color(0xFFECFDF5)
                        StudyBadgeId.ON_FIRE -> if (isDark) Color(0xFF2E1A0E) else Color(0xFFFFF7ED)
                        StudyBadgeId.DEEP_FOCUS -> if (isDark) Color(0xFF201B33) else Color(0xFFF5F3FF)
                    }
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .alpha(if (badge.unlocked) 1f else 0.65f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(accentBg)
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = badge.emoji, fontSize = 24.sp)
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = badge.title,
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = if (badge.unlocked) MaterialTheme.colorScheme.onSurface else Color(0xFF71717A)
                        )
                        Text(
                            text = "${badge.description} · ${if (badge.unlocked) "Unlocked" else "Locked"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (badge.unlocked) MaterialTheme.colorScheme.onSurfaceVariant else Color(0xFF71717A)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ScreenTimeSection(
    shortDateLabel: String,
    isViewingToday: Boolean,
    screenTimeMinutes: Int,
    studyTimeMinutes: Int,
    isDark: Boolean,
    onChangeScreenTime: (Int) -> Unit
) {
    val isHigherThanStudy = screenTimeMinutes > 0 && screenTimeMinutes > studyTimeMinutes
    val hours = screenTimeMinutes / 60
    val mins = screenTimeMinutes % 60
    val containerColor = if (isHigherThanStudy) {
        if (isDark) Color(0xFF2A1215) else Color(0xFFFEF2F2)
    } else {
        MaterialTheme.colorScheme.surface
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Screen Time",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = if (isViewingToday) "Hours wasted scrolling today" else "Hours wasted scrolling on $shortDateLabel",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = hours.toString(),
                    onValueChange = { raw ->
                        val h = (raw.toIntOrNull() ?: 0).coerceIn(0, 24)
                        onChangeScreenTime((h * 60 + mins).coerceAtMost(24 * 60))
                    },
                    label = { Text("Hours") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = mins.toString(),
                    onValueChange = { raw ->
                        val m = (raw.toIntOrNull() ?: 0).coerceIn(0, 59)
                        onChangeScreenTime((hours * 60 + m).coerceAtMost(24 * 60))
                    },
                    label = { Text("Minutes") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
            }
            if (isHigherThanStudy) {
                Text(
                    text = "Warning: Screen time (${StudyTimeFormatter.formatStatDuration(screenTimeMinutes)}) is higher than your study time (${StudyTimeFormatter.formatStatDuration(studyTimeMinutes)})!",
                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                    color = if (isDark) Color(0xFFFCA5A5) else Color(0xFFDC2626)
                )
            }
        }
    }
}
