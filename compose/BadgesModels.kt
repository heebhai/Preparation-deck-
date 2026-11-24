package com.syllabustracker.model

import android.content.Context
import com.syllabustracker.data.local.StudyLogEntity
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

enum class StudyBadgeId(
    val storageKey: String,
    val emoji: String,
    val title: String,
    val description: String
) {
    EARLY_BIRD(
        storageKey = "early-bird",
        emoji = "🌅",
        title = "Early Bird",
        description = "Study before 8:00 AM"
    ),
    NIGHT_OWL(
        storageKey = "night-owl",
        emoji = "🦉",
        title = "Night Owl",
        description = "Study after 10:00 PM"
    ),
    CHAPTER_CRUSHER(
        storageKey = "chapter-crusher",
        emoji = "📚",
        title = "Chapter Crusher",
        description = "Complete all 4 circles for any 1 chapter in a day"
    ),
    ON_FIRE(
        storageKey = "on-fire",
        emoji = "🔥",
        title = "On Fire",
        description = "Achieve a 3-day streak"
    ),
    DEEP_FOCUS(
        storageKey = "deep-focus",
        emoji = "🎯",
        title = "Deep Focus",
        description = "Log a single session of 3+ hours"
    )
}

data class StudyBadgeStatus(
    val id: StudyBadgeId,
    val emoji: String,
    val title: String,
    val description: String,
    val unlocked: Boolean,
    val unlockedAt: Long?
)

data class GamificationEvaluationResult(
    val badges: List<StudyBadgeStatus>,
    val newlyUnlocked: List<StudyBadgeStatus>,
    val updatedSavedMap: Map<StudyBadgeId, Long>,
    val bestStreakDays: Int,
    val currentStreakDays: Int
)

object StudyBadgeCalculator {
    const val STREAK_MIN_EXCLUSIVE_MINUTES = 20 // strictly > 20 minutes
    const val DEEP_FOCUS_MIN_MINUTES = 180 // 3+ hours single session

    fun evaluate(
        logs: List<StudyLogEntity>,
        subjects: List<Subject>,
        savedUnlockedMap: Map<StudyBadgeId, Long> = emptyMap(),
        today: LocalDate = LocalDate.now(),
        nowMillis: Long = System.currentTimeMillis()
    ): GamificationEvaluationResult {
        val zone = ZoneId.systemDefault()
        val qualifyingDates = mutableSetOf<LocalDate>()
        var hasEarlyBird = false
        var hasNightOwl = false
        var hasChapterCrusher = false
        var hasDeepFocus = false

        logs.forEach { log ->
            if (log.durationMinutes > STREAK_MIN_EXCLUSIVE_MINUTES) {
                runCatching { LocalDate.parse(log.dateIso) }.getOrNull()?.let { qualifyingDates.add(it) }
            }
            if (log.durationMinutes >= DEEP_FOCUS_MIN_MINUTES) {
                hasDeepFocus = true
            }
            if (log.durationMinutes > 0) {
                val dt = Instant.ofEpochMilli(log.createdAt).atZone(zone)
                if (dt.toLocalDate().toString() == log.dateIso) {
                    if (dt.hour < 8) hasEarlyBird = true
                    if (dt.hour >= 22) hasNightOwl = true
                }
            }
        }

        subjects.forEach { subject ->
            subject.subSubjects.forEach { sub ->
                sub.chapters.forEach { chapter ->
                    val completedDays = mutableListOf<LocalDate?>()
                    MilestoneType.entries.forEach { m ->
                        val checked = when (m) {
                            MilestoneType.LECTURE -> chapter.milestones.lecture
                            MilestoneType.NOTES -> chapter.milestones.notes
                            MilestoneType.PRACTICE -> chapter.milestones.practice
                            MilestoneType.EXTRA -> chapter.milestones.extra
                        }
                        if (checked) {
                            val ts = chapter.milestoneTimestamps[m]
                            val dt = ts?.let { Instant.ofEpochMilli(it).atZone(zone) }
                            dt?.let {
                                qualifyingDates.add(it.toLocalDate())
                                if (it.hour < 8) hasEarlyBird = true
                                if (it.hour >= 22) hasNightOwl = true
                            }
                            completedDays.add(dt?.toLocalDate())
                        } else {
                            completedDays.add(null)
                        }
                    }
                    if (chapter.milestones.isComplete &&
                        completedDays.firstOrNull() != null &&
                        completedDays.all { it == completedDays.first() }
                    ) {
                        hasChapterCrusher = true
                    }
                }
            }
        }

        val sorted = qualifyingDates.sorted()
        var bestStreak = if (sorted.isEmpty()) 0 else 1
        var run = if (sorted.isEmpty()) 0 else 1
        for (i in 1 until sorted.size) {
            if (sorted[i - 1].plusDays(1) == sorted[i]) {
                run += 1
                if (run > bestStreak) bestStreak = run
            } else {
                run = 1
            }
        }

        var currentStreak = 0
        var cursor: LocalDate? = when {
            today in qualifyingDates -> today
            today.minusDays(1) in qualifyingDates -> today.minusDays(1)
            else -> null
        }
        while (cursor != null && cursor in qualifyingDates) {
            currentStreak += 1
            cursor = cursor.minusDays(1)
        }

        val matches = mapOf(
            StudyBadgeId.EARLY_BIRD to hasEarlyBird,
            StudyBadgeId.NIGHT_OWL to hasNightOwl,
            StudyBadgeId.CHAPTER_CRUSHER to hasChapterCrusher,
            StudyBadgeId.ON_FIRE to (bestStreak >= 3),
            StudyBadgeId.DEEP_FOCUS to hasDeepFocus
        )

        val updatedMap = savedUnlockedMap.toMutableMap()
        val newlyUnlocked = mutableListOf<StudyBadgeStatus>()

        val badges = StudyBadgeId.entries.map { def ->
            val previousTs = savedUnlockedMap[def]
            if (previousTs != null) {
                StudyBadgeStatus(
                    id = def,
                    emoji = def.emoji,
                    title = def.title,
                    description = def.description,
                    unlocked = true,
                    unlockedAt = previousTs
                )
            } else if (matches[def] == true) {
                updatedMap[def] = nowMillis
                val status = StudyBadgeStatus(
                    id = def,
                    emoji = def.emoji,
                    title = def.title,
                    description = def.description,
                    unlocked = true,
                    unlockedAt = nowMillis
                )
                newlyUnlocked.add(status)
                status
            } else {
                StudyBadgeStatus(
                    id = def,
                    emoji = def.emoji,
                    title = def.title,
                    description = def.description,
                    unlocked = false,
                    unlockedAt = null
                )
            }
        }

        return GamificationEvaluationResult(
            badges = badges,
            newlyUnlocked = newlyUnlocked,
            updatedSavedMap = updatedMap,
            bestStreakDays = bestStreak,
            currentStreakDays = currentStreak
        )
    }
}

class GamificationLocalStore(context: Context) {
    private val prefs = context.getSharedPreferences("syllabus_gamification_prefs", Context.MODE_PRIVATE)

    fun loadUnlockedBadges(): Map<StudyBadgeId, Long> {
        val result = mutableMapOf<StudyBadgeId, Long>()
        StudyBadgeId.entries.forEach { badge ->
            val ts = prefs.getLong("badge_${badge.storageKey}", -1L)
            if (ts > 0L) result[badge] = ts
        }
        return result
    }

    fun saveUnlockedBadges(map: Map<StudyBadgeId, Long>) {
        prefs.edit().apply {
            map.forEach { (badge, ts) ->
                putLong("badge_${badge.storageKey}", ts)
            }
            apply()
        }
    }

    fun loadScreenTimeByDate(): Map<String, Int> {
        val result = mutableMapOf<String, Int>()
        prefs.all.forEach { (key, value) ->
            if (key.startsWith("screen_time_") && value is Int && value >= 0) {
                result[key.removePrefix("screen_time_")] = value.coerceIn(0, 24 * 60)
            }
        }
        return result
    }

    fun saveScreenTime(dateIso: String, minutes: Int) {
        prefs.edit().putInt("screen_time_$dateIso", minutes.coerceIn(0, 24 * 60)).apply()
    }
}
