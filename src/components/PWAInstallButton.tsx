import { Download, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        data-testid="pwa-install-button"
        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl bg-[#5B4BC4] text-white dark:bg-[#C4BAFF] dark:text-[#1F1559] text-xs font-semibold shadow-xs hover:bg-[#4B3BB4] dark:hover:bg-[#D5CEFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4BC4] transition-colors cursor-pointer whitespace-nowrap"
      >
        <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          data-testid="pwa-ios-install-button"
          className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl border border-[#DFD9EE] dark:border-[#323042] bg-[#F1EDF8] dark:bg-[#232130] text-xs font-semibold text-[#5B4BC4] dark:text-[#C4BAFF] hover:bg-[#E7E1F4] dark:hover:bg-[#2D2A3D] transition-colors cursor-pointer whitespace-nowrap"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-[#E6E0EC] dark:border-[#2D2B36] bg-white dark:bg-[#1B1A20] p-6 shadow-xl space-y-3">
              <h3 className="font-display text-lg font-bold text-[#1C1B1F] dark:text-[#F4EFF4]">
                Add to Home Screen
              </h3>
              <p className="text-sm text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
                1. Tap the <strong>Share</strong> icon in your browser toolbar.
                <br />
                2. Scroll down and tap <strong>Add to Home Screen</strong> to use Syllabus Tracker like a native app.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-[#EFEBF5] dark:bg-[#2A2836] text-sm font-semibold text-[#1C1B1F] dark:text-[#F4EFF4] hover:bg-[#E4DFF0] dark:hover:bg-[#353245] transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
