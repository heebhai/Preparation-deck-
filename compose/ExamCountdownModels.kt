package com.syllabustracker.model

import android.content.Context
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale

data class BoardExamSettings(
    val examDateIso: String,
    val isCustom: Boolean
)

enum class ExamCountdownPhase {
    UPCOMING, TODAY, PASSED
}

data class ExamCountdownSummary(
    val examDateIso: String,
    val formattedDate: String,
    val daysRemaining: Long,
    val headlineValue: String,
    val headlineUnit: String,
    val phase: ExamCountdownPhase,
    val isCustom: Boolean
)

object ExamCountdownCalculator {
    private val displayFormatter = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH)

    fun defaultExamDateIso(today: LocalDate = LocalDate.now()): String {
        val currentCycle = LocalDate.of(today.year, 2, 15)
        return if (!today.isAfter(currentCycle)) {
            currentCycle.toString()
        } else {
            LocalDate.of(today.year + 1, 2, 15).toString()
        }
    }

    fun defaultSettings(today: LocalDate = LocalDate.now()): BoardExamSettings =
        BoardExamSettings(
            examDateIso = defaultExamDateIso(today),
            isCustom = false
        )

    fun parseValidDateOrNull(raw: String): LocalDate? {
        return try {
            val parsed = LocalDate.parse(raw.trim())
            if (parsed.year in 2020..2040) parsed else null
        } catch (_: Exception) {
            null
        }
    }

    fun evaluate(
        settings: BoardExamSettings,
        today: LocalDate = LocalDate.now()
    ): ExamCountdownSummary {
        val targetDate = parseValidDateOrNull(settings.examDateIso)
            ?: LocalDate.parse(defaultExamDateIso(today))
        val daysRemaining = ChronoUnit.DAYS.between(today, targetDate)
        val formattedDate = targetDate.format(displayFormatter)

        return when {
            daysRemaining > 0 -> ExamCountdownSummary(
                examDateIso = targetDate.toString(),
                formattedDate = formattedDate,
                daysRemaining = daysRemaining,
                headlineValue = daysRemaining.toString(),
                headlineUnit = if (daysRemaining == 1L) "day left" else "days left",
                phase = ExamCountdownPhase.UPCOMING,
                isCustom = settings.isCustom
            )
            daysRemaining == 0L -> ExamCountdownSummary(
                examDateIso = targetDate.toString(),
                formattedDate = formattedDate,
                daysRemaining = 0L,
                headlineValue = "0",
                headlineUnit = "Exam day today",
                phase = ExamCountdownPhase.TODAY,
                isCustom = settings.isCustom
            )
            else -> {
                val daysAgo = -daysRemaining
                ExamCountdownSummary(
                    examDateIso = targetDate.toString(),
                    formattedDate = formattedDate,
                    daysRemaining = daysRemaining,
                    headlineValue = "0",
                    headlineUnit = if (daysAgo == 1L) "1 day ago" else "$daysAgo days ago",
                    phase = ExamCountdownPhase.PASSED,
                    isCustom = settings.isCustom
                )
            }
        }
    }
}

class ExamSettingsLocalStore(context: Context) {
    private val prefs = context.getSharedPreferences("syllabus_exam_countdown_prefs", Context.MODE_PRIVATE)

    fun load(today: LocalDate = LocalDate.now()): BoardExamSettings {
        val dateIso = prefs.getString(KEY_EXAM_DATE, null)
        val isCustom = prefs.getBoolean(KEY_IS_CUSTOM, false)
        if (dateIso == null || ExamCountdownCalculator.parseValidDateOrNull(dateIso) == null) {
            return ExamCountdownCalculator.defaultSettings(today)
        }
        return BoardExamSettings(examDateIso = dateIso, isCustom = isCustom)
    }

    fun save(settings: BoardExamSettings) {
        prefs.edit()
            .putString(KEY_EXAM_DATE, settings.examDateIso)
            .putBoolean(KEY_IS_CUSTOM, settings.isCustom)
            .apply()
    }

    companion object {
        private const val KEY_EXAM_DATE = "board_exam_date_iso"
        private const val KEY_IS_CUSTOM = "board_exam_is_custom"
    }
}
