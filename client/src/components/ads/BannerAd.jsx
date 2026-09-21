import React, { useEffect, useRef } from 'react';
import {
  getAdConfig,
  toPublisherClient,
  toAdSlot,
  ensureAdsScript,
  pushAdUnit,
} from '../../utils/ads';

/**
 * Responsive display banner backed by AdMob/AdSense.
 *
 * IDs come from env only (VITE_ADMOB_APP_ID / VITE_ADMOB_BANNER_AD_ID).
 * Renders nothing when ads are disabled or IDs are missing, so dev builds
 * without secrets stay clean and prod enables automatically via CI secrets.
 */
export default function BannerAd({ placement = 'in-feed', className = '' }) {
  const insRef = useRef(null);
  const { enabled, appId, bannerId } = getAdConfig();
  const client = toPublisherClient(appId);
  const slot = toAdSlot(bannerId);

  useEffect(() => {
    if (!enabled || !client || !slot) return;
    let cancelled = false;
    ensureAdsScript().then((ok) => {
      if (!ok || cancelled) return;
      // Delay one frame so the <ins> is laid out before the push.
      requestAnimationFrame(() => {
        if (!cancelled) pushAdUnit();
      });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, client, slot, placement]);

  if (!enabled || !client || !slot) return null;

  const isSticky = placement === 'sticky-footer';

  return (
    <div
      data-testid={isSticky ? 'admob-banner-sticky' : 'admob-banner'}
      className={
        isSticky
          ? `fixed bottom-0 inset-x-0 z-40 flex justify-center border-t border-slate-800/80 bg-[#0b0f19]/95 backdrop-blur px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] ${className}`
          : `flex justify-center ${className}`
      }
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', maxWidth: isSticky ? '728px' : '970px', minHeight: isSticky ? '50px' : '90px' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
