package com.syllabustracker.model

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.syllabustracker.data.local.StudyLogChapterItem
import com.syllabustracker.data.local.StudyLogEntity
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.time.Instant
import java.time.LocalDate

data class RestoredBackupPayload(
    val subjects: List<Subject>,
    val studyLogs: List<StudyLogEntity>,
    val subjectGoals: List<SubjectStudyGoal>,
    val savedBadgesMap: Map<StudyBadgeId, Long>,
    val screenTimeByDate: Map<String, Int>,
    val dailyHabits: DailyHabitsState,
    val dailyTodosState: DailyTodosState,
    val examSettings: BoardExamSettings,
    val streakCount: Int,
    val heeCoinState: HeeCoinState = HeeCoinState()
)

object SyllabusBackupManager {
    const val BACKUP_APP_ID = "syllabus-tracker-class10"
    const val BACKUP_VERSION = 1

    fun createBackupJson(
        subjects: List<Subject>,
        studyLogs: List<StudyLogEntity>,
        subjectGoals: List<SubjectStudyGoal>,
        savedBadgesMap: Map<StudyBadgeId, Long>,
        screenTimeByDate: Map<String, Int>,
        dailyHabits: DailyHabitsState,
        dailyTodosState: DailyTodosState,
        examSettings: BoardExamSettings,
        streakCount: Int,
        heeCoinState: HeeCoinState = HeeCoinState()
    ): String {
        val subjectsArr = JSONArray().apply {
            subjects.forEach { subj ->
                put(
                    JSONObject().apply {
                        put("id", subj.id)
                        put("name", subj.name)
                        put("subSubjects", JSONArray().apply {
                            subj.subSubjects.forEach { sub ->
                                put(
                                    JSONObject().apply {
                                        put("id", sub.id)
                                        put("name", sub.name)
                                        put("chapters", JSONArray().apply {
                                            sub.chapters.forEach { ch ->
                                                put(
                                                    JSONObject().apply {
                                                        put("id", ch.id)
                                                        put("name", ch.name)
                                                        put("milestones", JSONObject().apply {
                                                            put("lecture", ch.milestones.lecture)
                                                            put("notes", ch.milestones.notes)
                                                            put("practice", ch.milestones.practice)
                                                            put("extra", ch.milestones.extra)
                                                        })
                                                        put("milestoneTimestamps", JSONObject().apply {
                                                            ch.milestoneTimestamps.forEach { (m, ts) ->
                                                                put(m.name.lowercase(), ts)
                                                            }
                                                        })
                                                    }
                                                )
                                            }
                                        })
                                    }
                                )
                            }
                        })
                    }
                )
            }
        }

        val logsArr = JSONArray().apply {
            studyLogs.forEach { log ->
                put(
                    JSONObject().apply {
                        put("id", log.id)
                        put("subjectId", log.subjectId)
                        put("subjectName", log.subjectName)
                        put("date", log.dateIso)
                        put("durationMinutes", log.durationMinutes)
                        put("createdAt", log.createdAt)
                        put("items", JSONArray().apply {
                            log.items.forEach { item ->
                                put(
                                    JSONObject().apply {
                                        put("subSubjectId", item.subSubjectId)
                                        put("subSubjectName", item.subSubjectName)
                                        put("chapterId", item.chapterId)
                                        put("chapterName", item.chapterName)
                                        put("tasks", JSONArray().apply {
                                            item.tasks.forEach { put(it.name.lowercase()) }
                                        })
                                    }
                                )
                            }
                        })
                    }
                )
            }
        }

        val goalsArr = JSONArray().apply {
            subjectGoals.forEach { goal ->
                put(
                    JSONObject().apply {
                        put("subjectId", goal.subjectId)
                        put("dailyMinutes", goal.dailyMinutes)
                        put("weeklyMinutes", goal.weeklyMinutes)
                    }
                )
            }
        }

        val badgesObj = JSONObject().apply {
            savedBadgesMap.forEach { (badgeId, unlockedAt) ->
                put(badgeId.storageKey, unlockedAt)
            }
        }

        val screenTimeObj = JSONObject().apply {
            screenTimeByDate.forEach { (dateIso, mins) ->
                put(dateIso, mins)
            }
        }

        val habitsObj = JSONObject().apply {
            put("dateKey", dailyHabits.dateIso)
            put("habits", JSONArray().apply {
                dailyHabits.habits.forEach { h ->
                    put(
                        JSONObject().apply {
                            put("id", h.id)
                            put("title", h.title)
                            put("emoji", h.emoji)
                            put("isDefault", h.isDefault)
                        }
                    )
                }
            })
            put("completedIds", JSONArray().apply {
                dailyHabits.completedIds.forEach { put(it) }
            })
        }

        val todosObj = JSONObject().apply {
            put("dateKey", dailyTodosState.dateIso)
            put("items", JSONArray().apply {
                dailyTodosState.items.forEach { item ->
                    put(
                        JSONObject().apply {
                            put("id", item.id)
                            put("title", item.title)
                            put("completed", item.completed)
                            put("createdAt", item.createdAt)
                        }
                    )
                }
            })
        }

        val examObj = JSONObject().apply {
            put("examDateKey", examSettings.examDateIso)
            put("isCustom", examSettings.isCustom)
        }

        val coinsObj = JSONObject().apply {
            put("balance", heeCoinState.balance.coerceAtLeast(0))
            put("rawBalance", heeCoinState.rawBalance)
            put("spentCoins", heeCoinState.spentCoins.coerceAtLeast(0))
            put("purchasedCounts", JSONObject().apply {
                heeCoinState.purchasedCounts.forEach { (id, count) ->
                    if (count > 0) put(id, count)
                }
            })
        }

        val dataObj = JSONObject().apply {
            put("subjects", subjectsArr)
            put("studyLogs", logsArr)
            put("subjectGoals", goalsArr)
            put("savedBadgesMap", badgesObj)
            put("screenTimeMap", screenTimeObj)
            put("dailyHabits", habitsObj)
            put("dailyTodosState", todosObj)
            put("examSettings", examObj)
            put("heeCoinState", coinsObj)
        }

        return JSONObject().apply {
            put("appId", BACKUP_APP_ID)
            put("version", BACKUP_VERSION)
            put("exportedAt", Instant.now().toString())
            put("streakCount", streakCount.coerceAtLeast(0))
            put("data", dataObj)
        }.toString(2)
    }

    fun saveBackupToDownloads(context: Context, jsonContent: String): Result<String> {
        val fileName = "syllabus-tracker-backup-${LocalDate.now()}.json"
        return runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, fileName)
                    put(MediaStore.Downloads.MIME_TYPE, "application/json")
                    put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    put(MediaStore.Downloads.IS_PENDING, 1)
                }
                val resolver = context.contentResolver
                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                    ?: error("Could not create backup file in Downloads.")
                resolver.openOutputStream(uri)?.use { stream ->
                    stream.write(jsonContent.toByteArray(Charsets.UTF_8))
                } ?: error("Could not open Downloads output stream.")
                values.clear()
                values.put(MediaStore.Downloads.IS_PENDING, 0)
                resolver.update(uri, values, null, null)
            } else {
                @Suppress("DEPRECATION")
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                if (!downloadsDir.exists()) downloadsDir.mkdirs()
                File(downloadsDir, fileName).writeText(jsonContent, Charsets.UTF_8)
            }
            fileName
        }
    }

    fun parseAndValidateBackupJson(
        rawJson: String,
        todayIso: String = LocalDate.now().toString()
    ): Result<RestoredBackupPayload> {
        return runCatching {
            require(rawJson.isNotBlank()) { "Selected backup file is empty." }
            val root = JSONObject(rawJson)
            if (root.has("appId")) {
                require(root.optString("appId") == BACKUP_APP_ID) {
                    "This JSON file belongs to a different app."
                }
            }
            val dataObj = root.optJSONObject("data") ?: root
            val rawSubjects = dataObj.optJSONArray("subjects")
                ?: error("Backup file is missing syllabus data.")
            val rawLogs = dataObj.optJSONArray("studyLogs")
                ?: error("Backup file is missing study log data.")

            // Map imported chapters by id onto canonical subjects
            val chapterById = mutableMapOf<String, JSONObject>()
            for (i in 0 until rawSubjects.length()) {
                val subj = rawSubjects.optJSONObject(i) ?: continue
                val subs = subj.optJSONArray("subSubjects") ?: continue
                for (j in 0 until subs.length()) {
                    val sub = subs.optJSONArray("chapters")
                        ?.let { null }
                    val subObj = subs.optJSONObject(j) ?: continue
                    val chs = subObj.optJSONArray("chapters") ?: continue
                    for (k in 0 until chs.length()) {
                        val chObj = chs.optJSONObject(k) ?: continue
                        val chId = chObj.optString("id")
                        if (chId.isNotBlank()) chapterById[chId] = chObj
                    }
                }
            }

            val restoredSubjects = DummySyllabusData.subjects.map { baseSubj ->
                baseSubj.copy(
                    subSubjects = baseSubj.subSubjects.map { baseSub ->
                        baseSub.copy(
                            chapters = baseSub.chapters.map { baseCh ->
                                val importedCh = chapterById[baseCh.id]
                                val mObj = importedCh?.optJSONObject("milestones")
                                val tsObj = importedCh?.optJSONObject("milestoneTimestamps")
                                val timestamps = buildMap {
                                    if (tsObj != null) {
                                        MilestoneType.entries.forEach { m ->
                                            val ts = tsObj.optLong(m.name.lowercase(), -1L)
                                            if (ts > 0L) put(m, ts)
                                        }
                                    }
                                }
                                baseCh.copy(
                                    milestones = ChapterMilestones(
                                        lecture = mObj?.optBoolean("lecture", false) ?: false,
                                        notes = mObj?.optBoolean("notes", false) ?: false,
                                        practice = mObj?.optBoolean("practice", false) ?: false,
                                        extra = mObj?.optBoolean("extra", false) ?: false
                                    ),
                                    milestoneTimestamps = timestamps
                                )
                            }
                        )
                    }
                )
            }

            val restoredLogs = buildList {
                for (i in 0 until rawLogs.length()) {
                    val obj = rawLogs.optJSONObject(i) ?: continue
                    val id = obj.optString("id")
                    val subjectId = obj.optString("subjectId")
                    val subjectName = obj.optString("subjectName")
                    val dateIso = obj.optString("date").ifBlank { obj.optString("dateIso") }
                    val durationMinutes = obj.optInt("durationMinutes", -1)
                    val createdAt = obj.optLong("createdAt", System.currentTimeMillis())
                    if (id.isBlank() || subjectId.isBlank() || subjectName.isBlank() || dateIso.isBlank() || durationMinutes < 0) {
                        continue
                    }
                    val itemsArr = obj.optJSONArray("items")
                    val items = buildList {
                        if (itemsArr != null) {
                            for (j in 0 until itemsArr.length()) {
                                val itemObj = itemsArr.optJSONObject(j) ?: continue
                                val tasksArr = itemObj.optJSONArray("tasks") ?: JSONArray()
                                val tasks = buildList {
                                    for (k in 0 until tasksArr.length()) {
                                        val rawTask = tasksArr.optString(k).uppercase()
                                        runCatching { MilestoneType.valueOf(rawTask) }.getOrNull()?.let { add(it) }
                                    }
                                }
                                add(
                                    StudyLogChapterItem(
                                        subSubjectId = itemObj.optString("subSubjectId"),
                                        subSubjectName = itemObj.optString("subSubjectName"),
                                        chapterId = itemObj.optString("chapterId"),
                                        chapterName = itemObj.optString("chapterName"),
                                        tasks = tasks
                                    )
                                )
                            }
                        }
                    }
                    add(
                        StudyLogEntity(
                            id = id,
                            subjectId = subjectId,
                            subjectName = subjectName,
                            dateIso = dateIso,
                            durationMinutes = durationMinutes,
                            createdAt = createdAt,
                            items = items
                        )
                    )
                }
            }

            val defaultGoals = StudyGoalCalculator.defaultGoals(restoredSubjects)
            val goalsArr = dataObj.optJSONArray("subjectGoals")
            val goalsMap = mutableMapOf<String, SubjectStudyGoal>()
            if (goalsArr != null) {
                for (i in 0 until goalsArr.length()) {
                    val gObj = goalsArr.optJSONObject(i) ?: continue
                    val sId = gObj.optString("subjectId")
                    if (sId.isNotBlank()) {
                        goalsMap[sId] = SubjectStudyGoal(
                            subjectId = sId,
                            dailyMinutes = gObj.optInt("dailyMinutes", 0).coerceIn(0, 12 * 60),
                            weeklyMinutes = gObj.optInt("weeklyMinutes", 0).coerceIn(0, 84 * 60)
                        )
                    }
                }
            }
            val restoredGoals = defaultGoals.map { goalsMap[it.subjectId] ?: it }

            val badgesObj = dataObj.optJSONObject("savedBadgesMap")
            val restoredBadges = buildMap {
                if (badgesObj != null) {
                    StudyBadgeId.entries.forEach { badgeId ->
                        if (badgesObj.has(badgeId.storageKey)) {
                            val ts = badgesObj.optLong(badgeId.storageKey, -1L)
                            if (ts > 0L) put(badgeId, ts)
                        }
                    }
                }
            }

            val screenTimeObj = dataObj.optJSONObject("screenTimeMap")
            val restoredScreenTime = buildMap {
                if (screenTimeObj != null) {
                    screenTimeObj.keys().forEach { dateKey ->
                        val mins = screenTimeObj.optInt(dateKey, -1)
                        if (mins >= 0) put(dateKey, mins.coerceAtMost(24 * 60))
                    }
                }
            }

            val habitsObj = dataObj.optJSONObject("dailyHabits")
            val restoredHabits = if (habitsObj != null) {
                val hDate = habitsObj.optString("dateKey", todayIso).ifBlank { todayIso }
                val hArr = habitsObj.optJSONArray("habits")
                val parsedHabits = buildList {
                    if (hArr != null) {
                        for (i in 0 until hArr.length()) {
                            val h = hArr.optJSONObject(i) ?: continue
                            val id = h.optString("id")
                            val title = h.optString("title")
                            val emoji = h.optString("emoji", "✨")
                            if (id.isNotBlank() && title.isNotBlank()) {
                                add(DailyHabit(id = id, title = title, emoji = emoji, isDefault = h.optBoolean("isDefault", false)))
                            }
                        }
                    }
                }.ifEmpty { DailyHabitDefaults.defaultHabits }
                val cArr = habitsObj.optJSONArray("completedIds")
                val completed = buildSet {
                    if (cArr != null) {
                        for (i in 0 until cArr.length()) {
                            cArr.optString(i).takeIf { it.isNotBlank() }?.let { add(it) }
                        }
                    }
                }
                DailyHabitDefaults.reconcileForDate(
                    DailyHabitsState(dateIso = hDate, habits = parsedHabits, completedIds = completed),
                    todayIso
                )
            } else {
                DailyHabitsState(dateIso = todayIso, habits = DailyHabitDefaults.defaultHabits, completedIds = emptySet())
            }

            val todosObj = dataObj.optJSONObject("dailyTodosState")
            val restoredTodos = if (todosObj != null) {
                val tDate = todosObj.optString("dateKey", todayIso).ifBlank { todayIso }
                val tArr = todosObj.optJSONArray("items")
                val items = buildList {
                    if (tArr != null) {
                        for (i in 0 until tArr.length()) {
                            val item = tArr.optJSONObject(i) ?: continue
                            val id = item.optString("id")
                            val title = item.optString("title")
                            if (id.isNotBlank() && title.isNotBlank()) {
                                add(
                                    DailyTodoItem(
                                        id = id,
                                        title = title,
                                        completed = item.optBoolean("completed", false),
                                        createdAt = item.optLong("createdAt", System.currentTimeMillis())
                                    )
                                )
                            }
                        }
                    }
                }
                DailyTodoDayCalculator.reconcileForDate(DailyTodosState(dateIso = tDate, items = items), todayIso)
            } else {
                DailyTodosState(dateIso = todayIso, items = emptyList())
            }

            val examObj = dataObj.optJSONObject("examSettings")
            val restoredExam = if (examObj != null) {
                val rawDate = examObj.optString("examDateKey")
                val validDate = ExamCountdownCalculator.parseValidDateOrNull(rawDate)?.toString()
                    ?: ExamCountdownCalculator.defaultExamDateIso()
                BoardExamSettings(
                    examDateIso = validDate,
                    isCustom = examObj.optBoolean("isCustom", false)
                )
            } else {
                ExamCountdownCalculator.defaultSettings()
            }

            val coinsObj = dataObj.optJSONObject("heeCoinState")
            val restoredCoins = if (coinsObj != null) {
                val rawBal = coinsObj.optInt("rawBalance", coinsObj.optInt("balance", 0))
                val spent = coinsObj.optInt("spentCoins", 0).coerceAtLeast(0)
                val countsObj = coinsObj.optJSONObject("purchasedCounts")
                val counts = buildMap {
                    if (countsObj != null) {
                        countsObj.keys().forEach { id ->
                            val c = countsObj.optInt(id, 0)
                            if (c > 0) put(id, c)
                        }
                    }
                }
                HeeCoinState(
                    balance = rawBal.coerceAtLeast(0),
                    rawBalance = rawBal,
                    spentCoins = spent,
                    purchasedCounts = counts
                )
            } else {
                HeeCoinState()
            }

            RestoredBackupPayload(
                subjects = restoredSubjects,
                studyLogs = restoredLogs,
                subjectGoals = restoredGoals,
                savedBadgesMap = restoredBadges,
                screenTimeByDate = restoredScreenTime,
                dailyHabits = restoredHabits,
                dailyTodosState = restoredTodos,
                examSettings = restoredExam,
                streakCount = root.optInt("streakCount", 0).coerceAtLeast(0),
                heeCoinState = restoredCoins
            )
        }
    }
}
