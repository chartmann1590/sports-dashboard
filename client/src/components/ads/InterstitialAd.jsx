import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  getAdConfig,
  toPublisherClient,
  toAdSlot,
  ensureAdsScript,
  pushAdUnit,
} from '../../utils/ads';

const DEFAULT_DELAY_MS = 45000;
const DEFAULT_FREQUENCY_MS = 180000;

/**
 * Web interstitial backed by the AdMob interstitial ad unit.
 *
 * - Timed takeover (default: first show ~45s after load, then at most every 3 min).
 * - Frequency-capped + session-capped, closable, Escape to dismiss.
 * - Suppressed while TV/Jumbotron mode is active to avoid interrupting the big screen.
 * - Renders nothing when ads are disabled or IDs are missing.
 *
 * IDs come from env only (VITE_ADMOB_APP_ID / VITE_ADMOB_INTERSTITIAL_AD_ID).
 */
export default function InterstitialAd({
  suppressed = false,
  delayMs = DEFAULT_DELAY_MS,
  frequencyMs = DEFAULT_FREQUENCY_MS,
}) {
  const { enabled, appId, interstitialId } = getAdConfig();
  const client = toPublisherClient(appId);
  const slot = toAdSlot(interstitialId);
  const [visible, setVisible] = useState(false);
  const lastShownRef = useRef(0);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const schedule = useCallback(
    (wait) => {
      clearTimer();
      if (!enabled || !client || !slot || suppressed) return;
      timerRef.current = setTimeout(() => {
        const now = Date.now();
        if (now - lastShownRef.current < frequencyMs) {
          schedule(frequencyMs - (now - lastShownRef.current));
          return;
        }
        // Don't pop over an open game modal / drawer — retry shortly.
        if (document.querySelector('[role="dialog"]')) {
          schedule(15000);
          return;
        }
        lastShownRef.current = now;
        setVisible(true);
      }, wait);
    },
    [enabled, client, slot, suppressed, frequencyMs]
  );

  useEffect(() => {
    if (!enabled || !client || !slot) return;
    ensureAdsScript();
    schedule(delayMs);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, client, slot, suppressed]);

  useEffect(() => {
    if (!visible) return;
    ensureAdsScript().then(() => {
      requestAnimationFrame(() => pushAdUnit());
    });
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setVisible(false);
        schedule(frequencyMs);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, schedule, frequencyMs]);

  if (!enabled || !client || !slot || !visible) return null;

  const close = () => {
    setVisible(false);
    schedule(frequencyMs);
  };

  return (
    <div
      data-testid="admob-interstitial"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Advertisement"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-[#0b0f19]">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Advertisement
          </span>
          <button
            onClick={close}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
            aria-label="Close ad"
          >
            Close
          </button>
        </div>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '320px' }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="interstitial"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
