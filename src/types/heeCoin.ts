export interface HeeCoinState {
  /** Current spendable Hee coin balance (clamped >= 0 for display). */
  balance: number;
  /** Signed internal ledger balance to prevent uncheck-at-zero farming exploits. */
  rawBalance: number;
  /** Total Hee coins spent across all Store purchases. */
  spentCoins: number;
  /** Count of purchases made per Store item ID. */
  purchasedCounts: Record<string, number>;
  /** Whether infinite redeem code is active. */
  redeemedInfinite?: boolean;
}

export interface StoreItem {
  id: string;
  title: string;
  description: string;
  price: number;
  icon: string;
}

export interface CoinDeltaSummary {
  taskDelta: number;
  chapterBonusDelta: number;
  totalDelta: number;
  nextState: HeeCoinState;
}
