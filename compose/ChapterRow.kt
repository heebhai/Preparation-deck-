package com.syllabustracker.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.scaleIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.syllabustracker.model.Chapter
import com.syllabustracker.model.MilestoneType
import com.syllabustracker.model.SubjectTone
import kotlinx.coroutines.delay

@Composable
fun ChapterRow(
    chapter: Chapter,
    index: Int,
    tone: SubjectTone,
    onToggleMilestone: (MilestoneType) -> Unit,
    modifier: Modifier = Modifier,
    contextLabel: String? = null
) {
    val darkTheme = isSystemInDarkTheme()
    val palette = subjectPalette(tone, darkTheme)
    val completed = chapter.milestones.isComplete

    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(chapter.id) {
        delay(index.coerceAtMost(8) * 35L)
        visible = true
    }

    val cardBg by animateColorAsState(
        targetValue = when {
            completed && darkTheme -> Color(0xFF162920)
            completed -> Color(0xFFE5F6EC)
            else -> MaterialTheme.colorScheme.surface
        },
        animationSpec = tween(260),
        label = "ChapterCardTint"
    )

    val completedGreen = if (darkTheme) Color(0xFF5FD39B) else Color(0xFF247A52)

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(280)) + slideInVertically(
            animationSpec = tween(320, easing = FastOutSlowInEasing),
            initialOffsetY = { it / 4 }
        )
    ) {
        Card(
            modifier = modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        if (!contextLabel.isNullOrBlank()) {
                            Text(
                                text = contextLabel,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Medium),
                                color = if (completed) completedGreen else palette.onContainer
                            )
                        }
                        Text(
                            text = chapter.name,
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = if (completed) "Completed · 4/4 tasks" else "${chapter.milestones.completedCount} of 4 tasks",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (completed) completedGreen else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    AnimatedVisibility(
                        visible = completed,
                        enter = scaleIn(
                            animationSpec = spring(
                                dampingRatio = Spring.DampingRatioMediumBouncy,
                                stiffness = Spring.StiffnessMedium
                            )
                        ) + fadeIn()
                    ) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(completedGreen),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Check,
                                contentDescription = "Chapter completed",
                                tint = if (darkTheme) Color(0xFF0D261A) else Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    MilestoneCircleCheckbox(
                        label = MilestoneType.LECTURE.label,
                        checked = chapter.milestones.lecture,
                        fillColor = if (completed) completedGreen else palette.progress,
                        onClick = { onToggleMilestone(MilestoneType.LECTURE) }
                    )
                    MilestoneCircleCheckbox(
                        label = MilestoneType.NOTES.label,
                        checked = chapter.milestones.notes,
                        fillColor = if (completed) completedGreen else palette.progress,
                        onClick = { onToggleMilestone(MilestoneType.NOTES) }
                    )
                    MilestoneCircleCheckbox(
                        label = MilestoneType.PRACTICE.label,
                        checked = chapter.milestones.practice,
                        fillColor = if (completed) completedGreen else palette.progress,
                        onClick = { onToggleMilestone(MilestoneType.PRACTICE) }
                    )
                    MilestoneCircleCheckbox(
                        label = MilestoneType.EXTRA.label,
                        checked = chapter.milestones.extra,
                        fillColor = if (completed) completedGreen else palette.progress,
                        onClick = { onToggleMilestone(MilestoneType.EXTRA) }
                    )
                }
            }
        }
    }
}

@Composable
private fun MilestoneCircleCheckbox(
    label: String,
    checked: Boolean,
    fillColor: Color,
    onClick: () -> Unit
) {
    val scale by animateFloatAsState(
        targetValue = if (checked) 1.08f else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMediumLow
        ),
        label = "CheckboxPopScale"
    )
    val bgColor by animateColorAsState(
        targetValue = if (checked) fillColor else Color.Transparent,
        animationSpec = tween(180),
        label = "CheckboxFillColor"
    )
    val borderColor = if (checked) fillColor else MaterialTheme.colorScheme.outline

    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 8.dp, vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Box(
            modifier = Modifier
                .scale(scale)
                .size(32.dp)
                .clip(CircleShape)
                .background(bgColor)
                .border(width = 2.dp, color = borderColor, shape = CircleShape),
            contentAlignment = Alignment.Center
        ) {
            AnimatedVisibility(visible = checked, enter = scaleIn() + fadeIn()) {
                Icon(
                    imageVector = Icons.Rounded.Check,
                    contentDescription = label,
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = if (checked) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
