package com.syllabustracker.data.local

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import com.syllabustracker.model.MilestoneType
import kotlinx.coroutines.flow.Flow
import org.json.JSONArray
import org.json.JSONObject
import java.time.DayOfWeek
import java.time.Duration
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.temporal.TemporalAdjusters

data class StudyLogChapterItem(
    val subSubjectId: String,
    val subSubjectName: String,
    val chapterId: String,
    val chapterName: String,
    val tasks: List<MilestoneType>
)

@Entity(tableName = "study_logs")
data class StudyLogEntity(
    @PrimaryKey val id: String,
    val subjectId: String,
    val subjectName: String,
    val dateIso: String, // YYYY-MM-DD
    val durationMinutes: Int,
    val createdAt: Long = System.currentTimeMillis(),
    val items: List<StudyLogChapterItem> = emptyList()
)

class StudyLogConverters {
    @TypeConverter
    fun fromChapterItems(items: List<StudyLogChapterItem>): String {
        val arr = JSONArray()
        items.forEach { item ->
            val obj = JSONObject()
            obj.put("subSubjectId", item.subSubjectId)
            obj.put("subSubjectName", item.subSubjectName)
            obj.put("chapterId", item.chapterId)
            obj.put("chapterName", item.chapterName)
            val tasksArr = JSONArray()
            item.tasks.forEach { tasksArr.put(it.name) }
            obj.put("tasks", tasksArr)
            arr.put(obj)
        }
        return arr.toString()
    }

    @TypeConverter
    fun toChapterItems(raw: String): List<StudyLogChapterItem> {
        if (raw.isBlank()) return emptyList()
        return runCatching {
            val arr = JSONArray(raw)
            buildList {
                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    val tasksArr = obj.optJSONArray("tasks") ?: JSONArray()
                    val tasks = buildList {
                        for (j in 0 until tasksArr.length()) {
                            runCatching { MilestoneType.valueOf(tasksArr.getString(j)) }
                                .getOrNull()?.let { add(it) }
                        }
                    }
                    add(
                        StudyLogChapterItem(
                            subSubjectId = obj.getString("subSubjectId"),
                            subSubjectName = obj.getString("subSubjectName"),
                            chapterId = obj.getString("chapterId"),
                            chapterName = obj.getString("chapterName"),
                            tasks = tasks
                        )
                    )
                }
            }
        }.getOrDefault(emptyList())
    }
}

@Dao
interface StudyLogDao {
    @Query("SELECT * FROM study_logs ORDER BY dateIso DESC, createdAt DESC")
    fun observeAllLogs(): Flow<List<StudyLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: StudyLogEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(logs: List<StudyLogEntity>)

    @Query("DELETE FROM study_logs WHERE id = :logId")
    suspend fun deleteById(logId: String)

    @Query("DELETE FROM study_logs")
    suspend fun deleteAll()
}

@Database(entities = [StudyLogEntity::class], version = 2, exportSchema = false)
@TypeConverters(StudyLogConverters::class)
abstract class SyllabusDatabase : RoomDatabase() {
    abstract fun studyLogDao(): StudyLogDao
}

data class StudyStatsSummary(
    val todayMinutes: Int,
    val weekMinutes: Int,
    val monthMinutes: Int
)

object DummyStudyLogData {
    fun seedLogs(today: LocalDate = LocalDate.now()): List<StudyLogEntity> = emptyList()
}

object StudyTimeFormatter {
    const val MAX_DAILY_MINUTES: Int = 24 * 60
    private val displayFormatter = DateTimeFormatter.ofPattern("d MMM")

    fun capDailyDuration(totalMinutes: Int): Int {
        if (totalMinutes <= 0) return 0
        val dayStart = LocalTime.MIDNIGHT
        val maxDayDuration = Duration.between(dayStart, LocalTime.MAX).plusNanos(1) // 24h
        val rawDuration = Duration.ofMinutes(totalMinutes.toLong())
        val capped = if (rawDuration > maxDayDuration) maxDayDuration else rawDuration
        return capped.toMinutes().toInt()
    }

    fun formatDuration(totalMinutes: Int): String {
        val safe = totalMinutes.coerceAtLeast(0)
        val hours = safe / 60
        val mins = safe % 60
        return when {
            hours == 0 -> "${mins}m"
            mins == 0 -> "${hours}h"
            else -> "${hours}h ${mins}m"
        }
    }

    fun formatStatDuration(totalMinutes: Int): String {
        val safe = totalMinutes.coerceAtLeast(0)
        if (safe == 0) return "0h 0m"
        return formatDuration(safe)
    }

    fun formatDateLabel(dateIso: String): String {
        return runCatching { LocalDate.parse(dateIso).format(displayFormatter) }
            .getOrDefault(dateIso)
    }

    fun splitDurationEqually(totalMinutes: Int, count: Int): List<Int> {
        if (count <= 0) return emptyList()
        val safe = totalMinutes.coerceAtLeast(0)
        val base = safe / count
        val remainder = safe % count
        return List(count) { idx -> if (idx < remainder) base + 1 else base }
    }

    fun formatLogSummary(log: StudyLogEntity): String {
        if (log.items.isEmpty()) return log.subjectName
        if (log.items.size == 1) {
            val item = log.items.first()
            return "${log.subjectName} > ${item.chapterName} (${item.tasks.joinToString(", ") { it.label }})"
        }
        val parts = log.items.joinToString(" + ") { item ->
            val shortCh = item.chapterName.substringBefore(":").trim()
            "$shortCh ${item.tasks.joinToString(", ") { it.label }}"
        }
        return "${log.subjectName}: $parts"
    }

    fun cappedMinutesByDate(logs: List<StudyLogEntity>): Map<String, Int> {
        return logs.filter { it.durationMinutes > 0 }
            .groupBy { it.dateIso }
            .mapValues { (_, entries) -> capDailyDuration(entries.sumOf { it.durationMinutes }) }
    }

    fun calculateStats(
        logs: List<StudyLogEntity>,
        today: LocalDate = LocalDate.now()
    ): StudyStatsSummary {
        val todayIso = today.toString()
        val weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        val weekEnd = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY))
        val monthPrefix = todayIso.substring(0, 7)

        val byDate = cappedMinutesByDate(logs)
        val todayMins = byDate[todayIso] ?: 0
        var weekMins = 0
        var monthMins = 0

        for ((dateIso, mins) in byDate) {
            val logDate = runCatching { LocalDate.parse(dateIso) }.getOrNull()
            if (logDate != null && !logDate.isBefore(weekStart) && !logDate.isAfter(weekEnd)) {
                weekMins += mins
            }
            if (dateIso.startsWith(monthPrefix)) {
                monthMins += mins
            }
        }

        return StudyStatsSummary(todayMins, weekMins, monthMins)
    }
}
