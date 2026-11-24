package com.syllabustracker.model

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.UUID

data class DailyTodoItem(
    val id: String,
    val title: String,
    val completed: Boolean,
    val createdAt: Long
)

data class DailyTodosState(
    val dateIso: String,
    val items: List<DailyTodoItem>
)

data class DailyWorkSummary(
    val dateIso: String,
    val formattedDayLabel: String,
    val totalCount: Int,
    val completedCount: Int,
    val remainingCount: Int,
    val remainingItems: List<DailyTodoItem>,
    val progressPercent: Int
)

object DailyTodoDayCalculator {
    private val dayLabelFormatter = DateTimeFormatter.ofPattern("EEE, d MMM", Locale.ENGLISH)

    fun reconcileForDate(
        state: DailyTodosState,
        todayIso: String = LocalDate.now().toString()
    ): DailyTodosState {
        if (state.dateIso == todayIso) return state
        return DailyTodosState(
            dateIso = todayIso,
            items = state.items.filterNot { it.completed }
        )
    }

    fun evaluateDailyWork(
        items: List<DailyTodoItem>,
        dateIso: String = LocalDate.now().toString()
    ): DailyWorkSummary {
        val remaining = items.filterNot { it.completed }
        val completedCount = items.size - remaining.size
        val percent = if (items.isEmpty()) 0 else ((completedCount * 100f) / items.size).toInt()
        val label = try {
            LocalDate.parse(dateIso).format(dayLabelFormatter)
        } catch (_: Exception) {
            dateIso
        }
        return DailyWorkSummary(
            dateIso = dateIso,
            formattedDayLabel = label,
            totalCount = items.size,
            completedCount = completedCount,
            remainingCount = remaining.size,
            remainingItems = remaining,
            progressPercent = percent
        )
    }
}

class DailyTodosLocalStore(context: Context) {
    private val prefs = context.getSharedPreferences("syllabus_dashboard_todos_prefs", Context.MODE_PRIVATE)

    fun load(todayIso: String = LocalDate.now().toString()): DailyTodosState {
        val savedDate = prefs.getString(KEY_DATE_ISO, todayIso) ?: todayIso
        val raw = prefs.getString(KEY_TODOS, null) ?: return DailyTodosState(todayIso, emptyList())
        val loadedItems = try {
            val array = JSONArray(raw)
            buildList {
                for (i in 0 until array.length()) {
                    val obj = array.optJSONObject(i) ?: continue
                    val id = obj.optString("id")
                    val title = obj.optString("title")
                    if (id.isNotBlank() && title.isNotBlank()) {
                        add(
                            DailyTodoItem(
                                id = id,
                                title = title,
                                completed = obj.optBoolean("completed", false),
                                createdAt = obj.optLong("createdAt", System.currentTimeMillis())
                            )
                        )
                    }
                }
            }
        } catch (_: Exception) {
            emptyList()
        }
        return DailyTodoDayCalculator.reconcileForDate(
            DailyTodosState(dateIso = savedDate, items = loadedItems),
            todayIso
        )
    }

    fun save(state: DailyTodosState) {
        val array = JSONArray()
        state.items.forEach { item ->
            array.put(
                JSONObject().apply {
                    put("id", item.id)
                    put("title", item.title)
                    put("completed", item.completed)
                    put("createdAt", item.createdAt)
                }
            )
        }
        prefs.edit()
            .putString(KEY_DATE_ISO, state.dateIso)
            .putString(KEY_TODOS, array.toString())
            .apply()
    }

    companion object {
        private const val KEY_DATE_ISO = "dashboard_todos_date_iso"
        private const val KEY_TODOS = "dashboard_todos_json"

        fun createItem(title: String): DailyTodoItem = DailyTodoItem(
            id = "todo-${UUID.randomUUID()}",
            title = title.trim(),
            completed = false,
            createdAt = System.currentTimeMillis()
        )
    }
}
