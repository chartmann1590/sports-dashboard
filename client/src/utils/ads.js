// Central AdMob-for-web configuration.
//
// All AdMob / AdSense IDs come from Vite env vars — never hardcode them.
//   VITE_ADS_ENABLED               "true" | "false" (default: true in prod, false in dev)
//   VITE_ADMOB_APP_ID              e.g. ca-app-pub-XXXX~YYYY (injected via CI secrets / .env.local)
//   VITE_ADMOB_BANNER_AD_ID        e.g. ca-app-pub-XXXX/YYYYYY
//   VITE_ADMOB_INTERSTITIAL_AD_ID  e.g. ca-app-pub-XXXX/YYYYYY
//
// For local dev, copy client/.env.example -> client/.env.local and fill in
// values (that file is gitignored). For prod, values come from GitHub Secrets
// mapped to VITE_* in .github/workflows/prod-build.yml.

const readEnv = (key) => {
  try {
    return import.meta.env?.[key] ?? '';
  } catch {
    return '';
  }
};

export function getAdConfig() {
  const appId = (readEnv('VITE_ADMOB_APP_ID') || '').trim();
  const bannerId = (readEnv('VITE_ADMOB_BANNER_AD_ID') || '').trim();
  const interstitialId = (readEnv('VITE_ADMOB_INTERSTITIAL_AD_ID') || '').trim();
  const flag = (readEnv('VITE_ADS_ENABLED') || '').trim().toLowerCase();

  // Default: enabled in production builds, disabled in dev unless overridden.
  let enabled;
  if (flag === 'true' || flag === '1' || flag === 'yes') enabled = true;
  else if (flag === 'false' || flag === '0' || flag === 'no') enabled = false;
  else {
    try {
      enabled = Boolean(import.meta.env?.PROD);
    } catch {
      enabled = false;
    }
  }

  return { enabled, appId, bannerId, interstitialId };
}

/** Derive the AdSense publisher client (ca-pub-XXXX) from the AdMob app/ad id. */
export function toPublisherClient(admobId) {
  const m = String(admobId || '').match(/ca-app-pub-(\d+)/);
  return m ? `ca-pub-${m[1]}` : '';
}

/** Derive the numeric ad slot from a full ad unit id (ca-app-pub-XXXX/YYYYYY). */
export function toAdSlot(adUnitId) {
  const m = String(adUnitId || '').match(/\/(\d+)\s*$/);
  return m ? m[1] : '';
}

export function isAdsEnabled() {
  const { enabled, appId, bannerId } = getAdConfig();
  return enabled && Boolean(appId && bannerId);
}

let scriptPromise = null;

/**
 * Load the AdSense script once, using the publisher client derived from env.
 * Returns true when the script was injected, false when ads are disabled.
 */
export function ensureAdsScript() {
  if (typeof document === 'undefined') return Promise.resolve(false);
  const { enabled, appId } = getAdConfig();
  const client = toPublisherClient(appId);
  if (!enabled || !client) return Promise.resolve(false);

  if (document.querySelector(`script[data-ad-client="${client}"]`)) {
    return Promise.resolve(true);
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    s.setAttribute('data-ad-client', client);
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);

    // AdSense account meta helps auto-ads / verification without hardcoding.
    if (!document.querySelector('meta[name="google-adsense-account"]')) {
      const meta = document.createElement('meta');
      meta.name = 'google-adsense-account';
      meta.content = client;
      document.head.appendChild(meta);
    }
  });

  return scriptPromise;
}

/** Push a rendered <ins class="adsbygoogle"> unit. Safe to call repeatedly. */
export function pushAdUnit() {
  try {
    if (typeof window === 'undefined') return;
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  } catch {
    /* Ad blockers / unfilled inventory should never break the app */
  }
}
