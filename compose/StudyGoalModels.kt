package com.syllabustracker.model

import com.syllabustracker.data.local.StudyLogEntity
import com.syllabustracker.data.local.StudyTimeFormatter
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters

enum class GoalPeriod(val label: String) {
    DAILY("Daily"),
    WEEKLY("Weekly")
}

data class SubjectStudyGoal(
    val subjectId: String,
    val dailyMinutes: Int,
    val weeklyMinutes: Int
)

data class SubjectGoalProgress(
    val subjectId: String,
    val subjectName: String,
    val tone: SubjectTone,
    val period: GoalPeriod,
    val loggedMinutes: Int,
    val targetMinutes: Int,
    val remainingMinutes: Int,
    val ringProgress: Float,
    val hasGoal: Boolean,
    val isGoalMet: Boolean
)

object StudyGoalCalculator {
    private val defaultPresets = mapOf(
        "science" to (90 to 540),
        "sst" to (60 to 360),
        "maths" to (120 to 720),
        "english" to (45 to 240),
        "hindi" to (45 to 240)
    )

    fun defaultGoals(subjects: List<Subject>): List<SubjectStudyGoal> =
        subjects.map { subject ->
            val (daily, weekly) = defaultPresets[subject.id] ?: (60 to 360)
            SubjectStudyGoal(
                subjectId = subject.id,
                dailyMinutes = daily,
                weeklyMinutes = weekly
            )
        }

    fun calculateProgressList(
        subjects: List<Subject>,
        logs: List<StudyLogEntity>,
        goals: List<SubjectStudyGoal>,
        period: GoalPeriod,
        referenceDate: LocalDate = LocalDate.now()
    ): List<SubjectGoalProgress> {
        val goalMap = goals.associateBy { it.subjectId }
        val weekStart = referenceDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toString()
        val weekEnd = referenceDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)).toString()
        val todayIso = referenceDate.toString()

        return subjects.map { subject ->
            val goal = goalMap[subject.id]
            val targetMinutes = when (period) {
                GoalPeriod.DAILY -> (goal?.dailyMinutes ?: 0).coerceIn(0, 1440)
                GoalPeriod.WEEKLY -> (goal?.weeklyMinutes ?: 0).coerceIn(0, 10080)
            }

            val byDate = logs
                .filter { it.subjectId == subject.id && it.durationMinutes > 0 }
                .groupBy { it.dateIso }
                .mapValues { (_, entries) ->
                    StudyTimeFormatter.capDailyDuration(entries.sumOf { it.durationMinutes })
                }

            val loggedMinutes = when (period) {
                GoalPeriod.DAILY -> byDate[todayIso] ?: 0
                GoalPeriod.WEEKLY -> byDate
                    .filterKeys { it in weekStart..weekEnd }
                    .values
                    .sum()
            }

            val hasGoal = targetMinutes > 0
            val ringProgress = if (hasGoal) {
                (loggedMinutes.toFloat() / targetMinutes.toFloat()).coerceIn(0f, 1f)
            } else {
                0f
            }

            SubjectGoalProgress(
                subjectId = subject.id,
                subjectName = subject.name,
                tone = subject.tone,
                period = period,
                loggedMinutes = loggedMinutes,
                targetMinutes = targetMinutes,
                remainingMinutes = if (hasGoal) (targetMinutes - loggedMinutes).coerceAtLeast(0) else 0,
                ringProgress = ringProgress,
                hasGoal = hasGoal,
                isGoalMet = hasGoal && loggedMinutes >= targetMinutes
            )
        }
    }
}
