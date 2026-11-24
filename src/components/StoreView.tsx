import { useState, type FormEvent } from 'react';
import { Coins, Moon, ShoppingBag, Sun } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { HeeCoinState, StoreItem } from '../types/heeCoin';
import { canAffordStoreItem, STORE_CATALOG } from '../utils/heeCoinMath';

const HEE_COIN_IMAGE_PATH = '/assets/aistudio/1795170963447_47dacc4d.png';

interface StoreViewProps {
  coinState: HeeCoinState;
  isDark: boolean;
  onToggleTheme: () => void;
  onPurchaseItem: (item: StoreItem) => void;
  onRedeemCode: (code: string) => void;
}

export function StoreView({
  coinState,
  isDark,
  onToggleTheme,
  onPurchaseItem,
  onRedeemCode,
}: StoreViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [coinImgFailed, setCoinImgFailed] = useState<boolean>(false);
  const [redeemInput, setRedeemInput] = useState<string>('');

  return (
    <motion.div
      key="store-view"
      data-testid="store-view"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen flex flex-col"
    >
      {/* Compact Sticky Top Bar */}
      <header className="sticky top-0 z-30 pt-safe backdrop-blur-md bg-[#FAF8FC]/88 dark:bg-[#121318]/88 border-b border-[#E6E0EC]/80 dark:border-[#26252E]/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4] whitespace-nowrap">
            Store
          </h1>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            data-testid="theme-toggle"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] dark:focus-visible:ring-[#B9ADFF] transition-colors cursor-pointer shrink-0"
          >
            {isDark ? (
              <Sun className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 pb-28 space-y-6">
        {/* Big Glowing Hee Coins Balance Card */}
        <section
          aria-label="Hee coins balance"
          data-testid="store-balance-card"
          className="relative overflow-hidden rounded-3xl border border-[#EAC564] dark:border-[#8D681B] bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7]/85 to-[#FFF7E0] dark:from-[#281E0B] dark:via-[#1F170A] dark:to-[#181410] p-5 sm:p-7 shadow-[0_0_40px_rgba(217,119,6,0.24)] dark:shadow-[0_0_42px_rgba(245,158,11,0.22)]"
        >
          <div className="relative z-10 flex items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 min-w-0">
              <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#9A6700] dark:text-[#FCD34D]">
                Hee Coins Balance
              </p>

              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span
                  data-testid="store-coin-balance"
                  className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums text-[#451A03] dark:text-[#FEF3C7]"
                >
                  {coinState.redeemedInfinite ? '∞' : coinState.balance}
                </span>
                <span className="font-display text-base sm:text-lg font-bold text-[#92400E] dark:text-[#FDE68A]">
                  Hee coins
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#78350F] dark:text-[#E5C98B] leading-relaxed">
                +1 coin per task circle checked · +2 bonus when all 4 boxes in a chapter are done
              </p>

              <p
                data-testid="store-spent-summary"
                className="text-xs font-medium text-[#9A6700] dark:text-[#D9B76C] tabular-nums pt-0.5"
              >
                Spent so far: {coinState.spentCoins} Hee coins
              </p>
            </div>

            {/* Glowing Coin Emblem using attached PNG image */}
            <div
              className="relative w-22 h-22 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-br from-[#FDE68A] via-[#D97706] to-[#92400E] shadow-[0_0_28px_rgba(217,119,6,0.45)] shrink-0"
              data-testid="store-coin-emblem"
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-[#2C1E0B] flex items-center justify-center">
                {coinImgFailed ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#FCD34D]">
                    <Coins className="w-8 h-8" aria-hidden="true" />
                    <span className="text-[10px] font-bold mt-0.5">HEE</span>
                  </div>
                ) : (
                  <img
                    src={HEE_COIN_IMAGE_PATH}
                    alt="Hee Empire coin"
                    referrerPolicy="no-referrer"
                    onError={() => setCoinImgFailed(true)}
                    className="w-full h-full object-cover object-center scale-[1.52]"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Redeem Code Section */}
        <section
          aria-label="Redeem Code"
          data-testid="store-redeem-section"
          className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] p-4 sm:p-5 space-y-3"
        >
          <h2 className="font-display text-base font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
            Redeem Code
          </h2>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onRedeemCode(redeemInput);
              setRedeemInput('');
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={redeemInput}
              onChange={(e) => setRedeemInput(e.target.value)}
              placeholder="Enter redeem code..."
              data-testid="store-redeem-input"
              className="flex-1 min-h-[44px] rounded-xl border border-[#DFD9EE] dark:border-[#343144] bg-[#FAF8FC] dark:bg-[#15141B] px-3.5 text-sm text-[#1C1B1F] dark:text-[#F4EFF4] focus:outline-none focus:ring-2 focus:ring-[#5B4BC4]"
            />
            <button
              type="submit"
              data-testid="store-redeem-button"
              className="min-h-[44px] px-5 rounded-xl bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559] text-sm font-semibold hover:bg-[#4B3BB4] dark:hover:bg-[#D5CEFF] transition-colors shrink-0 cursor-pointer"
            >
              Redeem
            </button>
          </form>
        </section>

        {/* Rewards Store Grid */}
        <section aria-label="Reward items" className="space-y-3.5">
          <div className="flex items-baseline justify-between gap-2 px-0.5">
            <div className="flex items-center gap-2">
              <ShoppingBag
                className="w-4 h-4 text-[#5B4BC4] dark:text-[#C4BAFF]"
                aria-hidden="true"
              />
              <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
                Rewards Catalog
              </h2>
            </div>
            <span className="text-xs text-[#605D66] dark:text-[#AEA9B4] tabular-nums">
              {STORE_CATALOG.length} rewards
            </span>
          </div>

          <div
            data-testid="store-items-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"
          >
            {STORE_CATALOG.map((item) => {
              const effectiveBalance = coinState.redeemedInfinite ? 999999 : coinState.balance;
              const ownedCount = coinState.purchasedCounts[item.id] ?? 0;
              const isLimitReached =
                (item.id === 'crown' || item.id === 'streak-protector') &&
                ownedCount >= 1;
              const affordable =
                !isLimitReached && canAffordStoreItem(effectiveBalance, item.price);

              return (
                <article
                  key={item.id}
                  data-testid={`store-item-${item.id}`}
                  className="rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] p-4 sm:p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        aria-hidden="true"
                        className="w-11 h-11 rounded-2xl bg-[#FAF8FC] dark:bg-[#24222D] border border-[#ECE7F3] dark:border-[#322F3F] flex items-center justify-center text-xl shrink-0"
                      >
                        {item.icon}
                      </span>

                      {ownedCount > 0 && (
                        <span
                          data-testid={`store-owned-${item.id}`}
                          className="text-xs font-semibold text-[#15803D] dark:text-[#6EE7B7] tabular-nums"
                        >
                          {item.id === 'streak-protector' ? 'Active ×1' : `Owned ×${ownedCount}`}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-display text-base font-bold tracking-tight text-[#1C1B1F] dark:text-[#F4EFF4]">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-[#605D66] dark:text-[#AEA9B4] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#F0ECF7] dark:border-[#292734] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-full overflow-hidden border border-[#D4AF37]/70 bg-[#2C1E0B] flex items-center justify-center shrink-0">
                        {coinImgFailed ? (
                          <Coins className="w-3.5 h-3.5 text-[#FCD34D]" aria-hidden="true" />
                        ) : (
                          <img
                            src={HEE_COIN_IMAGE_PATH}
                            alt=""
                            aria-hidden="true"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover object-center scale-[1.52]"
                          />
                        )}
                      </span>
                      <span className="font-display text-sm font-bold tabular-nums text-[#78350F] dark:text-[#FCD34D] whitespace-nowrap">
                        {item.price} coins
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!affordable}
                      onClick={() => onPurchaseItem(item)}
                      data-testid={`store-buy-${item.id}`}
                      aria-disabled={!affordable}
                      className={`min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] ${
                        affordable
                          ? 'bg-[#5B4BC4] text-white hover:bg-[#4D3EB3] dark:bg-[#C4BAFF] dark:text-[#1F1559] dark:hover:bg-[#D5CEFF] cursor-pointer'
                          : 'bg-[#E6E3EC] text-[#8E8A96] dark:bg-[#262530] dark:text-[#6B6778] cursor-not-allowed opacity-75'
                      }`}
                    >
                      {isLimitReached ? 'Owned' : 'Buy'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </motion.div>
  );
}
