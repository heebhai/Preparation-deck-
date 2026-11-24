import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_SYLLABUS } from '../data/syllabusData';
import type { HeeCoinState } from '../types/heeCoin';
import {
  applyRedeemCode,
  applySyllabusCoinTransition,
  canAffordStoreItem,
  createDefaultHeeCoinState,
  purchaseStoreItem,
  STORE_CATALOG,
} from './heeCoinMath';
import { toggleChapterMilestone } from './syllabusMath';

test('checking task circles adds +1 Hee coin and unchecking subtracts 1 (anti-cheat)', () => {
  const s0 = INITIAL_SYLLABUS;
  let coins = createDefaultHeeCoinState();
  assert.equal(coins.balance, 0);

  // Check Lecture -> +1
  const s1 = toggleChapterMilestone(s0, 'science', 'physics', 'sci-phy-1', 'lecture', 1000);
  const res1 = applySyllabusCoinTransition(coins, s0, s1);
  coins = res1.nextState;
  assert.equal(res1.taskDelta, 1);
  assert.equal(res1.chapterBonusDelta, 0);
  assert.equal(coins.balance, 1);

  // Uncheck Lecture -> -1 (back to 0, cannot farm coins)
  const s2 = toggleChapterMilestone(s1, 'science', 'physics', 'sci-phy-1', 'lecture', 2000);
  const res2 = applySyllabusCoinTransition(coins, s1, s2);
  coins = res2.nextState;
  assert.equal(res2.totalDelta, -1);
  assert.equal(coins.balance, 0);
});

test('completing all 4 boxes for a chapter grants +2 bonus Hee coins and unchecking revokes bonus', () => {
  const s0 = INITIAL_SYLLABUS;
  let coins = createDefaultHeeCoinState();

  const s1 = toggleChapterMilestone(s0, 'science', 'physics', 'sci-phy-1', 'lecture', 1000);
  coins = applySyllabusCoinTransition(coins, s0, s1).nextState;
  assert.equal(coins.balance, 1);

  const s2 = toggleChapterMilestone(s1, 'science', 'physics', 'sci-phy-1', 'notes', 2000);
  coins = applySyllabusCoinTransition(coins, s1, s2).nextState;
  assert.equal(coins.balance, 2);

  const s3 = toggleChapterMilestone(s2, 'science', 'physics', 'sci-phy-1', 'practice', 3000);
  coins = applySyllabusCoinTransition(coins, s2, s3).nextState;
  assert.equal(coins.balance, 3);

  // 4th check triggers +1 task + 2 chapter bonus = +3 (total 6)
  const s4 = toggleChapterMilestone(s3, 'science', 'physics', 'sci-phy-1', 'extra', 4000);
  const res4 = applySyllabusCoinTransition(coins, s3, s4);
  coins = res4.nextState;
  assert.equal(res4.taskDelta, 1);
  assert.equal(res4.chapterBonusDelta, 2);
  assert.equal(coins.balance, 6);

  // Anti-cheat: uncheck Extra -> loses 1 task + 2 bonus = -3 (back to 3)
  const s5 = toggleChapterMilestone(s4, 'science', 'physics', 'sci-phy-1', 'extra', 5000);
  const res5 = applySyllabusCoinTransition(coins, s4, s5);
  coins = res5.nextState;
  assert.equal(res5.totalDelta, -3);
  assert.equal(coins.balance, 3);

  // Re-check Extra -> back to 6 (not 8!)
  const s6 = toggleChapterMilestone(s5, 'science', 'physics', 'sci-phy-1', 'extra', 6000);
  coins = applySyllabusCoinTransition(coins, s5, s6).nextState;
  assert.equal(coins.balance, 6);
});

test('anti-cheat prevents farming coins even after spending balance down to zero', () => {
  const s0 = INITIAL_SYLLABUS;
  let coins: HeeCoinState = {
    balance: 0,
    rawBalance: -30,
    spentCoins: 30,
    purchasedCounts: { 'streak-protector': 1 },
    redeemedInfinite: false,
  };

  let curr = s0;
  for (const key of ['lecture', 'notes', 'practice', 'extra'] as const) {
    const next = toggleChapterMilestone(curr, 'science', 'physics', 'sci-phy-1', key, 2000);
    coins = applySyllabusCoinTransition(coins, curr, next).nextState;
    curr = next;
  }
  assert.equal(coins.balance, 0);
});

test('purchaseStoreItem validates balance and subtracts item price cleanly', () => {
  const protectorItem = STORE_CATALOG.find((item) => item.id === 'streak-protector')!; // 30 coins
  let coins = { ...createDefaultHeeCoinState(), balance: 20, rawBalance: 20 };

  assert.equal(canAffordStoreItem(coins.balance, protectorItem.price), false);
  const failRes = purchaseStoreItem(coins, protectorItem);
  assert.equal(failRes.purchased, false);
  assert.equal(failRes.nextState.balance, 20);

  coins = { ...coins, balance: 50, rawBalance: 50 };
  assert.equal(canAffordStoreItem(coins.balance, protectorItem.price), true);
  const okRes = purchaseStoreItem(coins, protectorItem);
  assert.equal(okRes.purchased, true);
  assert.equal(okRes.nextState.balance, 20);
  assert.equal(okRes.nextState.spentCoins, 30);
  assert.equal(okRes.nextState.purchasedCounts[protectorItem.id], 1);
});

test('redeem codes toggle 999999 balance and restore rawBalance without breaking checkbox math', () => {
  const s0 = INITIAL_SYLLABUS;
  let coins: HeeCoinState = {
    ...createDefaultHeeCoinState(),
    balance: 15,
    rawBalance: 15,
  };

  // Unlock infinite coins
  const r1 = applyRedeemCode(coins, 'Hee bhai zindabad');
  assert.equal(r1.success, true);
  coins = r1.nextState;
  assert.equal(coins.balance, 999999);
  assert.equal(coins.rawBalance, 15);

  // Checking a box while infinite updates rawBalance (15 -> 16) while display stays 999999
  const s1 = toggleChapterMilestone(s0, 'science', 'physics', 'sci-phy-1', 'lecture', 1000);
  coins = applySyllabusCoinTransition(coins, s0, s1).nextState;
  assert.equal(coins.balance, 999999);
  assert.equal(coins.rawBalance, 16);

  // Buying Crown while infinite succeeds and preserves rawBalance
  const crown = STORE_CATALOG.find((item) => item.id === 'crown')!;
  const bought = purchaseStoreItem(coins, crown);
  assert.equal(bought.purchased, true);
  coins = bought.nextState;
  assert.equal(coins.purchasedCounts['crown'], 1);

  // Revert redeem code -> restores exact rawBalance (16)
  const r2 = applyRedeemCode(coins, 'Hee bhai murdabad');
  assert.equal(r2.success, true);
  coins = r2.nextState;
  assert.equal(coins.redeemedInfinite, false);
  assert.equal(coins.balance, 16);
});
