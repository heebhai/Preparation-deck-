package com.syllabustracker.model

import android.content.Context
import org.json.JSONObject

data class HeeCoinState(
    val balance: Int = 0,
    val rawBalance: Int = 0,
    val spentCoins: Int = 0,
    val purchasedCounts: Map<String, Int> = emptyMap()
)

data class StoreRewardItem(
    val id: String,
    val title: String,
    val description: String,
    val price: Int,
    val icon: String
)

data class CoinTransitionResult(
    val taskDelta: Int,
    val chapterBonusDelta: Int,
    val totalDelta: Int,
    val nextState: HeeCoinState
)

object HeeCoinCalculator {
    const val TASK_CHECK_COIN_VALUE = 1
    const val CHAPTER_COMPLETE_BONUS_COINS = 2

    val defaultCatalog = listOf(
        StoreRewardItem(
            id = "break-pass-15m",
            title = "Golden Break Pass (15m)",
            description = "Take a guilt-free 15-minute break after focused chapter tasks.",
            price = 3,
            icon = "☕"
        ),
        StoreRewardItem(
            id = "snack-chai-voucher",
            title = "Snack & Chai Voucher",
            description = "Celebrate completing a full chapter with your favourite study snack.",
            price = 6,
            icon = "🍪"
        ),
        StoreRewardItem(
            id = "scholar-gold-crest",
            title = "Hee Scholar Crest",
            description = "Collectible golden crest representing mastery in the Hee Empire.",
            price = 10,
            icon = "🛡️"
        ),
        StoreRewardItem(
            id = "music-session-30m",
            title = "Music Break Session",
            description = "Unwind with 30 minutes of your favourite playlist after board prep.",
            price = 15,
            icon = "🎧"
        ),
        StoreRewardItem(
            id = "weekend-movie-pass",
            title = "Weekend Movie Pass",
            description = "Earn a full weekend movie night for staying consistent across subjects.",
            price = 25,
            icon = "🎬"
        ),
        StoreRewardItem(
            id = "hee-empire-crown",
            title = "Hee Empire Crown",
            description = "Prestigious Class 10 Boards topper collectible for dedicated learners.",
            price = 40,
            icon = "👑"
        )
    )

    private fun Chapter.isAllComplete(): Boolean =
        milestones.lecture && milestones.notes && milestones.practice && milestones.extra

    fun applySyllabusDelta(
        current: HeeCoinState,
        prevSubjects: List<Subject>,
        nextSubjects: List<Subject>
    ): CoinTransitionResult {
        val prevMap = buildMap {
            prevSubjects.forEach { subj ->
                subj.subSubjects.forEach { sub ->
                    sub.chapters.forEach { ch -> put(ch.id, ch) }
                }
            }
        }

        var taskDelta = 0
        var chapterBonusDelta = 0

        nextSubjects.forEach { subj ->
            subj.subSubjects.forEach { sub ->
                sub.chapters.forEach { ch ->
                    val prev = prevMap[ch.id] ?: return@forEach
                    val pairs = listOf(
                        prev.milestones.lecture to ch.milestones.lecture,
                        prev.milestones.notes to ch.milestones.notes,
                        prev.milestones.practice to ch.milestones.practice,
                        prev.milestones.extra to ch.milestones.extra
                    )
                    pairs.forEach { (before, after) ->
                        if (!before && after) taskDelta += TASK_CHECK_COIN_VALUE
                        else if (before && !after) taskDelta -= TASK_CHECK_COIN_VALUE
                    }

                    val wasComplete = prev.isAllComplete()
                    val nowComplete = ch.isAllComplete()
                    if (!wasComplete && nowComplete) chapterBonusDelta += CHAPTER_COMPLETE_BONUS_COINS
                    else if (wasComplete && !nowComplete) chapterBonusDelta -= CHAPTER_COMPLETE_BONUS_COINS
                }
            }
        }

        val totalDelta = taskDelta + chapterBonusDelta
        if (totalDelta == 0) {
            return CoinTransitionResult(0, 0, 0, current)
        }
        val nextRaw = current.rawBalance + totalDelta
        return CoinTransitionResult(
            taskDelta = taskDelta,
            chapterBonusDelta = chapterBonusDelta,
            totalDelta = totalDelta,
            nextState = current.copy(
                rawBalance = nextRaw,
                balance = nextRaw.coerceAtLeast(0)
            )
        )
    }

    fun purchaseItem(current: HeeCoinState, item: StoreRewardItem): HeeCoinState? {
        if (item.price < 0 || current.balance < item.price) return null
        val nextRaw = current.rawBalance - item.price
        val nextCounts = current.purchasedCounts.toMutableMap().apply {
            put(item.id, (this[item.id] ?: 0) + 1)
        }
        return HeeCoinState(
            balance = nextRaw.coerceAtLeast(0),
            rawBalance = nextRaw,
            spentCoins = current.spentCoins + item.price,
            purchasedCounts = nextCounts
        )
    }
}

class HeeCoinLocalStore(context: Context) {
    private val prefs = context.getSharedPreferences("syllabus_hee_coins_prefs", Context.MODE_PRIVATE)

    fun load(): HeeCoinState {
        val rawBalance = prefs.getInt(KEY_RAW_BALANCE, 0)
        val spentCoins = prefs.getInt(KEY_SPENT_COINS, 0).coerceAtLeast(0)
        val countsRaw = prefs.getString(KEY_PURCHASED_COUNTS, null)
        val counts = mutableMapOf<String, Int>()
        if (!countsRaw.isNullOrBlank()) {
            runCatching {
                val obj = JSONObject(countsRaw)
                obj.keys().forEach { k ->
                    val c = obj.optInt(k, 0)
                    if (c > 0) counts[k] = c
                }
            }
        }
        return HeeCoinState(
            balance = rawBalance.coerceAtLeast(0),
            rawBalance = rawBalance,
            spentCoins = spentCoins,
            purchasedCounts = counts
        )
    }

    fun save(state: HeeCoinState) {
        val obj = JSONObject()
        state.purchasedCounts.forEach { (id, count) ->
            if (count > 0) obj.put(id, count)
        }
        prefs.edit()
            .putInt(KEY_BALANCE, state.balance)
            .putInt(KEY_RAW_BALANCE, state.rawBalance)
            .putInt(KEY_SPENT_COINS, state.spentCoins)
            .putString(KEY_PURCHASED_COUNTS, obj.toString())
            .apply()
    }

    companion object {
        private const val KEY_BALANCE = "hee_coins_balance"
        private const val KEY_RAW_BALANCE = "hee_coins_raw_balance"
        private const val KEY_SPENT_COINS = "hee_coins_spent"
        private const val KEY_PURCHASED_COUNTS = "hee_coins_purchased_counts"
    }
}
