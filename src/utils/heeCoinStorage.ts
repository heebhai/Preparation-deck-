import type { HeeCoinState } from '../types/heeCoin';
import { createDefaultHeeCoinState } from './heeCoinMath';

const HEE_COINS_STORAGE_KEY = 'syllabus_tracker_hee_coins_v1';

export function sanitizeHeeCoinState(raw: unknown): HeeCoinState {
  const defaults = createDefaultHeeCoinState();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return defaults;
  }

  const record = raw as Record<string, unknown>;
  const spentCoins =
    typeof record.spentCoins === 'number' &&
    Number.isFinite(record.spentCoins) &&
    record.spentCoins >= 0
      ? Math.floor(record.spentCoins)
      : 0;

  const rawBalance =
    typeof record.rawBalance === 'number' && Number.isFinite(record.rawBalance)
      ? Math.trunc(record.rawBalance)
      : typeof record.balance === 'number' &&
          Number.isFinite(record.balance) &&
          record.balance >= 0
        ? Math.floor(record.balance)
        : 0;

  const balance = Math.max(0, rawBalance);

  const purchasedCounts: Record<string, number> = {};
  if (
    record.purchasedCounts &&
    typeof record.purchasedCounts === 'object' &&
    !Array.isArray(record.purchasedCounts)
  ) {
    for (const [key, count] of Object.entries(
      record.purchasedCounts as Record<string, unknown>,
    )) {
      if (
        typeof count === 'number' &&
        Number.isFinite(count) &&
        count > 0
      ) {
        purchasedCounts[key] = Math.floor(count);
      }
    }
  }

  const redeemedInfinite =
    typeof record.redeemedInfinite === 'boolean'
      ? record.redeemedInfinite
      : record.redeemMode === 'infinite';

  const effectiveBalance = redeemedInfinite ? 999999 : balance;

  return {
    balance: effectiveBalance,
    rawBalance,
    spentCoins,
    purchasedCounts,
    redeemedInfinite,
  };
}

export function loadHeeCoinState(): HeeCoinState {
  try {
    const raw = window.localStorage.getItem(HEE_COINS_STORAGE_KEY);
    if (!raw) {
      return createDefaultHeeCoinState();
    }
    return sanitizeHeeCoinState(JSON.parse(raw));
  } catch {
    return createDefaultHeeCoinState();
  }
}

export function saveHeeCoinState(state: HeeCoinState): void {
  try {
    window.localStorage.setItem(HEE_COINS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or private mode errors
  }
}
