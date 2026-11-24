package com.syllabustracker.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.syllabustracker.model.Subject
import com.syllabustracker.model.SubjectTone
import com.syllabustracker.ui.theme.SubjectAccents
import com.syllabustracker.ui.theme.SubjectPastelTokens
import kotlinx.coroutines.delay

@Composable
fun subjectPalette(tone: SubjectTone, darkTheme: Boolean = isSystemInDarkTheme()): SubjectPastelTokens {
    return when (tone) {
        SubjectTone.MINT -> if (darkTheme) SubjectAccents.MintDark else SubjectAccents.MintLight
        SubjectTone.APRICOT -> if (darkTheme) SubjectAccents.ApricotDark else SubjectAccents.ApricotLight
        SubjectTone.SKY -> if (darkTheme) SubjectAccents.SkyDark else SubjectAccents.SkyLight
        SubjectTone.ROSE -> if (darkTheme) SubjectAccents.RoseDark else SubjectAccents.RoseLight
        SubjectTone.LAVENDER -> if (darkTheme) SubjectAccents.LavenderDark else SubjectAccents.LavenderLight
    }
}

@Composable
fun SubjectCard(
    subject: Subject,
    index: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val palette = subjectPalette(subject.tone)
    val targetFraction = if (subject.totalChapters == 0) 0f else {
        subject.completedChapters.toFloat() / subject.totalChapters.toFloat()
    }

    var visible by remember { mutableStateOf(false) }
    var barFraction by remember { mutableStateOf(0f) }

    LaunchedEffect(subject.id, targetFraction) {
        delay(index * 60L)
        visible = true
        barFraction = targetFraction
    }

    val animatedBar by animateFloatAsState(
        targetValue = barFraction,
        animationSpec = tween(durationMillis = 700, easing = FastOutSlowInEasing),
        label = "SubjectLinearProgress"
    )

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(320)) + slideInVertically(
            animationSpec = tween(360, easing = FastOutSlowInEasing),
            initialOffsetY = { it / 3 }
        )
    ) {
        Card(
            modifier = modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .clickable(onClick = onClick),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = palette.container)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = subject.name,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${(targetFraction * 100).toInt()}%",
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                        color = palette.onContainer
                    )
                }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(palette.track)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(animatedBar)
                            .height(6.dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(palette.progress)
                    )
                }

                Spacer(modifier = Modifier.height(2.dp))

                Text(
                    text = "${subject.completedChapters}/${subject.totalChapters} chapters",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
