package com.syllabustracker.model

import android.content.Context
import java.time.LocalDate

data class DailyHabit(
    val id: String,
    val title: String,
    val emoji: String,
    val isDefault: Boolean = false
)

data class DailyHabitsState(
    val dateIso: String,
    val habits: List<DailyHabit>,
    val completedIds: Set<String>
)

object DailyHabitDefaults {
    val defaultHabits = listOf(
        DailyHabit(id = "habit-sleep-8h", title = "Sleep 8 hours", emoji = "😴", isDefault = true),
        DailyHabit(id = "habit-drink-water", title = "Drink water", emoji = "💧", isDefault = true),
        DailyHabit(id = "habit-move-stretch", title = "20m Exercise / Stretch", emoji = "🏃", isDefault = true),
        DailyHabit(id = "habit-screen-breaks", title = "No-screen study breaks", emoji = "🌿", isDefault = true)
    )

    fun reconcileForDate(
        state: DailyHabitsState,
        todayIso: String = LocalDate.now().toString()
    ): DailyHabitsState {
        return if (state.dateIso != todayIso) {
            state.copy(dateIso = todayIso, completedIds = emptySet())
        } else {
            val validIds = state.habits.map { it.id }.toSet()
            state.copy(completedIds = state.completedIds.intersect(validIds))
        }
    }
}

class DailyHabitsLocalStore(context: Context) {
    private val prefs = context.getSharedPreferences("syllabus_daily_habits_prefs", Context.MODE_PRIVATE)

    fun load(todayIso: String = LocalDate.now().toString()): DailyHabitsState {
        val storedDate = prefs.getString("date_iso", todayIso) ?: todayIso
        val customEntries = prefs.getStringSet("custom_habits", emptySet()).orEmpty().mapNotNull { raw ->
            val parts = raw.split("||", limit = 3)
            if (parts.size == 3 && parts[0].isNotBlank() && parts[2].isNotBlank()) {
                DailyHabit(id = parts[0], emoji = parts[1], title = parts[2], isDefault = false)
            } else {
                null
            }
        }
        val habits = DailyHabitDefaults.defaultHabits + customEntries
        val completed = if (storedDate == todayIso) {
            prefs.getStringSet("completed_ids", emptySet()).orEmpty()
        } else {
            emptySet()
        }
        return DailyHabitDefaults.reconcileForDate(
            DailyHabitsState(dateIso = todayIso, habits = habits, completedIds = completed),
            todayIso
        )
    }

    fun save(state: DailyHabitsState) {
        val customSet = state.habits.filter { !it.isDefault }.map { "${it.id}||${it.emoji}||${it.title}" }.toSet()
        prefs.edit()
            .putString("date_iso", state.dateIso)
            .putStringSet("custom_habits", customSet)
            .putStringSet("completed_ids", state.completedIds)
            .apply()
    }
}
