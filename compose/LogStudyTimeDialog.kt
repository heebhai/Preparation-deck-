package com.syllabustracker.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SelectableDates
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.syllabustracker.data.local.StudyLogChapterItem
import com.syllabustracker.data.local.StudyTimeFormatter
import com.syllabustracker.model.MilestoneType
import com.syllabustracker.model.Subject
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun LogStudyTimeDialog(
    subjects: List<Subject>,
    onDismiss: () -> Unit,
    onSave: (
        subjectId: String,
        subjectName: String,
        dateIso: String,
        durationMinutes: Int,
        items: List<StudyLogChapterItem>
    ) -> Unit
) {
    var selectedSubject by remember { mutableStateOf(subjects.first()) }
    var activeSubSubjectId by remember { mutableStateOf("all") }
    var dropdownExpanded by remember { mutableStateOf(false) }
    val selectedChapterTasks = remember { mutableStateMapOf<String, List<MilestoneType>>() }

    var hoursText by remember { mutableStateOf("1") }
    var minutesText by remember { mutableStateOf("30") }
    var selectedDateIso by remember { mutableStateOf(LocalDate.now().toString()) }
    var showDatePicker by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var dialogVisible by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        dialogVisible = true
    }

    val visibleChapters = remember(selectedSubject, activeSubSubjectId) {
        selectedSubject.subSubjects.flatMap { sub ->
            if (activeSubSubjectId != "all" && sub.id != activeSubSubjectId) emptyList()
            else sub.chapters.map { ch -> Triple(sub.id, sub.name, ch) }
        }
    }

    if (showDatePicker) {
        val todayMillis = LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
        val initialMillis = LocalDate.parse(selectedDateIso)
            .atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
        val pickerState = rememberDatePickerState(
            initialSelectedDateMillis = initialMillis,
            selectableDates = object : SelectableDates {
                override fun isSelectableDate(utcTimeMillis: Long): Boolean {
                    return utcTimeMillis <= todayMillis
                }
            }
        )

        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    pickerState.selectedDateMillis?.let { millis ->
                        selectedDateIso = Instant.ofEpochMilli(millis)
                            .atZone(ZoneOffset.UTC)
                            .toLocalDate()
                            .toString()
                    }
                    showDatePicker = false
                }) {
                    Text("OK")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Cancel")
                }
            }
        ) {
            DatePicker(state = pickerState)
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        AnimatedVisibility(
            visible = dialogVisible,
            enter = slideInVertically(initialOffsetY = { it / 2 }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { it / 2 }) + fadeOut()
        ) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 24.dp),
                shape = RoundedCornerShape(28.dp),
                color = MaterialTheme.colorScheme.background,
                tonalElevation = 6.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Log Study Time",
                                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                            )
                            Text(
                                text = "Select subject, chapters & tasks completed",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        IconButton(onClick = onDismiss) {
                            Icon(Icons.Rounded.Close, contentDescription = "Close dialog")
                        }
                    }

                    // 1. Subject Dropdown
                    ExposedDropdownMenuBox(
                        expanded = dropdownExpanded,
                        onExpandedChange = { dropdownExpanded = !dropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = selectedSubject.name,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Subject") },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = dropdownExpanded)
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                        )
                        ExposedDropdownMenu(
                            expanded = dropdownExpanded,
                            onDismissRequest = { dropdownExpanded = false }
                        ) {
                            subjects.forEach { subject ->
                                DropdownMenuItem(
                                    text = { Text(subject.name) },
                                    onClick = {
                                        selectedSubject = subject
                                        activeSubSubjectId = "all"
                                        selectedChapterTasks.clear()
                                        errorMessage = null
                                        dropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    // 2. Sub-subject Filter Chips
                    if (selectedSubject.subSubjects.size > 1) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = activeSubSubjectId == "all",
                                onClick = { activeSubSubjectId = "all" },
                                label = { Text("All") }
                            )
                            selectedSubject.subSubjects.forEach { sub ->
                                FilterChip(
                                    selected = activeSubSubjectId == sub.id,
                                    onClick = { activeSubSubjectId = sub.id },
                                    label = { Text(sub.name) }
                                )
                            }
                        }
                    }

                    // 3. Scrollable Compact Chapter Multi-Select Checklist
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 220.dp),
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surface,
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        LazyColumn {
                            items(visibleChapters, key = { (_, _, ch) -> ch.id }) { (_, subName, ch) ->
                                val isChecked = ch.id in selectedChapterTasks
                                val chosenTasks = selectedChapterTasks[ch.id].orEmpty()

                                Column(modifier = Modifier.fillMaxWidth()) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                errorMessage = null
                                                if (isChecked) {
                                                    selectedChapterTasks.remove(ch.id)
                                                } else {
                                                    selectedChapterTasks[ch.id] = emptyList()
                                                }
                                            }
                                            .padding(horizontal = 12.dp, vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Checkbox(
                                            checked = isChecked,
                                            onCheckedChange = { checked ->
                                                errorMessage = null
                                                if (checked) {
                                                    selectedChapterTasks[ch.id] = emptyList()
                                                } else {
                                                    selectedChapterTasks.remove(ch.id)
                                                }
                                            }
                                        )
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = ch.name,
                                                style = MaterialTheme.typography.bodyMedium.copy(
                                                    fontWeight = FontWeight.Medium
                                                ),
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                            if (activeSubSubjectId == "all" && selectedSubject.subSubjects.size > 1) {
                                                Text(
                                                    text = subName,
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }

                                    AnimatedVisibility(
                                        visible = isChecked,
                                        enter = expandVertically() + fadeIn(),
                                        exit = shrinkVertically() + fadeOut()
                                    ) {
                                        FlowRow(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(start = 48.dp, end = 12.dp, bottom = 10.dp),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            verticalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            MilestoneType.entries.forEach { task ->
                                                val taskActive = task in chosenTasks
                                                Surface(
                                                    shape = RoundedCornerShape(999.dp),
                                                    color = if (taskActive) Color(0xFFDCFCE7) else MaterialTheme.colorScheme.background,
                                                    border = BorderStroke(
                                                        1.dp,
                                                        if (taskActive) Color(0xFF4ADE80) else MaterialTheme.colorScheme.surfaceVariant
                                                    ),
                                                    modifier = Modifier.clickable {
                                                        errorMessage = null
                                                        val updated = if (taskActive) {
                                                            chosenTasks - task
                                                        } else {
                                                            chosenTasks + task
                                                        }
                                                        selectedChapterTasks[ch.id] = updated
                                                    }
                                                ) {
                                                    Row(
                                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                                        verticalAlignment = Alignment.CenterVertically
                                                    ) {
                                                        Box(
                                                            modifier = Modifier
                                                                .size(14.dp)
                                                                .clip(CircleShape)
                                                                .background(
                                                                    if (taskActive) Color(0xFF16A34A) else Color.Transparent
                                                                )
                                                                .border(
                                                                    1.dp,
                                                                    if (taskActive) Color(0xFF16A34A) else MaterialTheme.colorScheme.onSurfaceVariant,
                                                                    CircleShape
                                                                ),
                                                            contentAlignment = Alignment.Center
                                                        ) {
                                                            if (taskActive) {
                                                                Icon(
                                                                    imageVector = Icons.Rounded.Check,
                                                                    contentDescription = null,
                                                                    tint = Color.White,
                                                                    modifier = Modifier.size(10.dp)
                                                                )
                                                            }
                                                        }
                                                        Text(
                                                            text = task.label,
                                                            style = MaterialTheme.typography.labelSmall.copy(
                                                                fontWeight = FontWeight.Medium
                                                            ),
                                                            color = if (taskActive) Color(0xFF15803D) else MaterialTheme.colorScheme.onSurface
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                                }
                            }
                        }
                    }

                    // 4. Hours, Minutes & Date Picker
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedTextField(
                            value = hoursText,
                            onValueChange = {
                                hoursText = it.filter { ch -> ch.isDigit() }
                                errorMessage = null
                            },
                            label = { Text("Hours") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = minutesText,
                            onValueChange = {
                                minutesText = it.filter { ch -> ch.isDigit() }
                                errorMessage = null
                            },
                            label = { Text("Minutes") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    OutlinedButton(
                        onClick = { showDatePicker = true },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Date: ${StudyTimeFormatter.formatDateLabel(selectedDateIso)} ($selectedDateIso)")
                    }

                    if (errorMessage != null) {
                        Text(
                            text = errorMessage!!,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error
                        )
                    }

                    Spacer(modifier = Modifier.height(2.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        TextButton(onClick = onDismiss) {
                            Text("Cancel")
                        }
                        Button(onClick = {
                            val selectedItems = buildList {
                                for (sub in selectedSubject.subSubjects) {
                                    for (ch in sub.chapters) {
                                        val tasks = selectedChapterTasks[ch.id]
                                        if (tasks != null) {
                                            add(
                                                StudyLogChapterItem(
                                                    subSubjectId = sub.id,
                                                    subSubjectName = sub.name,
                                                    chapterId = ch.id,
                                                    chapterName = ch.name,
                                                    tasks = tasks
                                                )
                                            )
                                        }
                                    }
                                }
                            }

                            val hrs = hoursText.toIntOrNull() ?: 0
                            val mins = minutesText.toIntOrNull() ?: 0
                            val total = hrs * 60 + mins

                            when {
                                selectedItems.isEmpty() ->
                                    errorMessage = "Please select at least one chapter."
                                selectedItems.any { it.tasks.isEmpty() } ->
                                    errorMessage = "Select at least one task for each checked chapter."
                                hrs > 24 || mins > 59 || total <= 0 || total > StudyTimeFormatter.MAX_DAILY_MINUTES ->
                                    errorMessage = "Enter a valid duration between 1 minute and 24 hours."
                                else ->
                                    onSave(
                                        selectedSubject.id,
                                        selectedSubject.name,
                                        selectedDateIso,
                                        total,
                                        selectedItems
                                    )
                            }
                        }) {
                            Text("Save")
                        }
                    }
                }
            }
        }
    }
}
