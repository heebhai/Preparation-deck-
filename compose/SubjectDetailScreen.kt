package com.syllabustracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.PrimaryScrollableTabRow
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.syllabustracker.model.MilestoneType
import com.syllabustracker.model.Subject
import com.syllabustracker.ui.components.ChapterRow

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubjectDetailScreen(
    subject: Subject,
    onBack: () -> Unit,
    onToggleMilestone: (subSubjectId: String, chapterId: String, milestone: MilestoneType) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedTabIndex by remember(subject.id) { mutableIntStateOf(0) }
    val activeSubSubject = subject.subSubjects.getOrNull(selectedTabIndex)

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                title = {
                    Text(
                        text = subject.name,
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            if (subject.subSubjects.isNotEmpty()) {
                PrimaryScrollableTabRow(selectedTabIndex = selectedTabIndex) {
                    subject.subSubjects.forEachIndexed { idx, subSubject ->
                        Tab(
                            selected = selectedTabIndex == idx,
                            onClick = { selectedTabIndex = idx },
                            text = { Text(subSubject.name) }
                        )
                    }
                }
            }

            if (activeSubSubject != null) {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    itemsIndexed(
                        items = activeSubSubject.chapters,
                        key = { _, ch -> "${activeSubSubject.id}-${ch.id}" }
                    ) { index, chapter ->
                        ChapterRow(
                            chapter = chapter,
                            index = index,
                            tone = subject.tone,
                            onToggleMilestone = { milestone ->
                                onToggleMilestone(activeSubSubject.id, chapter.id, milestone)
                            }
                        )
                    }
                }
            }
        }
    }
}
