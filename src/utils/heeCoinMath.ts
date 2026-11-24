import type { HeeCoinState, CoinDeltaSummary, StoreItem } from '../types/heeCoin';
import type { MilestoneKey, Subject } from '../types/syllabus';
import { isChapterComplete } from './syllabusMath';

const MILESTONE_KEYS: ReadonlyArray<MilestoneKey> = [
  'lecture',
  'notes',
  'practice',
  'extra',
];

export const TASK_CHECK_COIN_VALUE = 1;
export const CHAPTER_COMPLETE_BONUS_COINS = 2;

export const STORE_CATALOG: ReadonlyArray<StoreItem> = [
  {
    id: 'crown',
    title: 'Hee Empire Crown',
    description: 'Prestigious Class 10 Boards topper collectible for dedicated learners. Appears in your Dashboard header.',
    price: 500,
    icon: '👑',
  },
  {
    id: 'streak-protector',
    title: 'Streak Protector (1 Day)',
    description: 'Saves your streak for 1 missed day before it resets. Max 1 purchase active at a time.',
    price: 30,
    icon: '🛡️',
  },
];

export function createDefaultHeeCoinState(): HeeCoinState {
  return {
    balance: 0,
    rawBalance: 0,
    spentCoins: 0,
    purchasedCounts: {},
    redeemedInfinite: false,
  };
}

/**
 * Computes exact Hee coin changes between previous and next syllabus states:
 * - +1 coin per task circle checked (false -> true)
 * - -1 coin per task circle unchecked (true -> false) [anti-cheat]
 * - +2 bonus coins when a chapter becomes 4/4 complete
 * - -2 bonus coins if a 4/4 chapter drops below 4/4 [anti-cheat]
 */
export function calculateSyllabusCoinDelta(
  prevSubjects: ReadonlyArray<Subject>,
  nextSubjects: ReadonlyArray<Subject>,
): { taskDelta: number; chapterBonusDelta: number; totalDelta: number } {
  const prevChapterMap = new Map<
    string,
    { milestones: Record<MilestoneKey, boolean>; complete: boolean }
  >();

  for (const subj of prevSubjects) {
    for (const sub of subj.subSubjects) {
      for (const ch of sub.chapters) {
        prevChapterMap.set(ch.id, {
          milestones: { ...ch.milestones },
          complete: isChapterComplete(ch),
        });
      }
    }
  }

  let taskDelta = 0;
  let chapterBonusDelta = 0;

  for (const subj of nextSubjects) {
    for (const sub of subj.subSubjects) {
      for (const ch of sub.chapters) {
        const prev = prevChapterMap.get(ch.id);
        if (!prev) continue;

        for (const key of MILESTONE_KEYS) {
          const wasChecked = Boolean(prev.milestones[key]);
          const isChecked = Boolean(ch.milestones[key]);
          if (!wasChecked && isChecked) {
            taskDelta += TASK_CHECK_COIN_VALUE;
          } else if (wasChecked && !isChecked) {
            taskDelta -= TASK_CHECK_COIN_VALUE;
          }
        }

        const wasComplete = prev.complete;
        const isComplete = isChapterComplete(ch);
        if (!wasComplete && isComplete) {
          chapterBonusDelta += CHAPTER_COMPLETE_BONUS_COINS;
        } else if (wasComplete && !isComplete) {
          chapterBonusDelta -= CHAPTER_COMPLETE_BONUS_COINS;
        }
      }
    }
  }

  return {
    taskDelta,
    chapterBonusDelta,
    totalDelta: taskDelta + chapterBonusDelta,
  };
}

export function applySyllabusCoinTransition(
  current: HeeCoinState,
  prevSubjects: ReadonlyArray<Subject>,
  nextSubjects: ReadonlyArray<Subject>,
): CoinDeltaSummary {
  const { taskDelta, chapterBonusDelta, totalDelta } = calculateSyllabusCoinDelta(
    prevSubjects,
    nextSubjects,
  );

  if (totalDelta === 0) {
    return {
      taskDelta: 0,
      chapterBonusDelta: 0,
      totalDelta: 0,
      nextState: current,
    };
  }

  const nextRawBalance = current.rawBalance + totalDelta;
  const nextBalance = current.redeemedInfinite
    ? 999999
    : Math.max(0, nextRawBalance);

  return {
    taskDelta,
    chapterBonusDelta,
    totalDelta,
    nextState: {
      ...current,
      rawBalance: nextRawBalance,
      balance: nextBalance,
    },
  };
}

export function canAffordStoreItem(balance: number, price: number): boolean {
  return price >= 0 && balance >= price;
}

export function purchaseStoreItem(
  current: HeeCoinState,
  item: StoreItem,
): { purchased: boolean; nextState: HeeCoinState } {
  const currentCount = current.purchasedCounts[item.id] ?? 0;
  if (item.id === 'crown' && currentCount >= 1) {
    return { purchased: false, nextState: current };
  }
  if (item.id === 'streak-protector' && currentCount >= 1) {
    return { purchased: false, nextState: current };
  }

  const effectiveBalance = current.redeemedInfinite ? 999999 : current.balance;
  if (!canAffordStoreItem(effectiveBalance, item.price)) {
    return { purchased: false, nextState: current };
  }

  const nextRawBalance = current.redeemedInfinite
    ? current.rawBalance
    : current.rawBalance - item.price;
  const nextBalance = current.redeemedInfinite
    ? 999999
    : Math.max(0, nextRawBalance);

  return {
    purchased: true,
    nextState: {
      ...current,
      balance: nextBalance,
      rawBalance: nextRawBalance,
      spentCoins: current.spentCoins + item.price,
      purchasedCounts: {
        ...current.purchasedCounts,
        [item.id]: currentCount + 1,
      },
    },
  };
}

export function applyRedeemCode(
  current: HeeCoinState,
  code: string,
): { success: boolean; message: string; nextState: HeeCoinState } {
  const trimmed = code.trim();
  if (trimmed === 'Hee bhai zindabad') {
    return {
      success: true,
      message: 'Secret redeem code applied! Infinite Hee coins unlocked.',
      nextState: {
        ...current,
        redeemedInfinite: true,
        balance: 999999,
      },
    };
  }
  if (trimmed === 'Hee bhai murdabad') {
    return {
      success: true,
      message: 'Redeem code reversed. Balance restored to ledger count.',
      nextState: {
        ...current,
        redeemedInfinite: false,
        balance: Math.max(0, current.rawBalance),
      },
    };
  }
  return {
    success: false,
    message: 'Invalid redeem code.',
    nextState: current,
  };
}
