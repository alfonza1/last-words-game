// ---------------------------------------------------------------------------
// Ads integration. PLACEHOLDER-first: the rewarded flow runs a short simulated
// "ad", and banners render a labelled empty slot — UNTIL you configure a real
// provider, at which point they upgrade in place:
//   • Banners       → Google AdSense (set VITE_ADSENSE_CLIENT + VITE_ADSENSE_SLOT)
//   • Rewarded video → drop a real rewarded SDK into showRewardedAd()
// Everything is gated behind VITE_ADS_ENABLED so nothing shows until you opt in.
// See docs/DEPLOYMENT.md (#ads).
// ---------------------------------------------------------------------------
export const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED === 'true';

// Google AdSense publisher id ("ca-pub-XXXXXXXXXXXXXXXX") and the default ad-unit
// (slot) id. When both ads are enabled AND a client id is set, <AdBanner/> mounts
// a real AdSense unit; otherwise it falls back to the labelled placeholder.
export const ADSENSE_CLIENT = (import.meta.env.VITE_ADSENSE_CLIENT ?? '').trim();
export const ADSENSE_SLOT = (import.meta.env.VITE_ADSENSE_SLOT ?? '').trim();

/** True only when banners can render a real, configured AdSense unit. */
export const ADSENSE_READY = ADS_ENABLED && ADSENSE_CLIENT.length > 0;

/** How long the placeholder rewarded "ad" runs (ms). */
export const REWARDED_AD_MS = 3000;

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

let scriptInjected = false;

/**
 * Inject the AdSense loader script once. No-op until AdSense is configured, when
 * off the browser, or if it's already on the page.
 */
export function loadAdSense(): void {
  if (scriptInjected || !ADSENSE_READY || typeof document === 'undefined') return;
  scriptInjected = true;
  if (document.querySelector('script[data-dk-adsense]')) return;
  const s = document.createElement('script');
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.dataset.dkAdsense = 'true';
  document.head.appendChild(s);
}

/**
 * Show a rewarded ad. Resolves true when the player has watched it through.
 * PLACEHOLDER — replace the body with a real rewarded SDK call (Poki /
 * CrazyGames / AdSense for Games / Ad Manager H5) that resolves on its reward
 * event. The coin grant itself is server-authoritative (POST /api/profile/reward).
 */
export async function showRewardedAd(): Promise<boolean> {
  // TODO(setup): call the real rewarded-ad SDK and resolve on its reward event.
  await new Promise((r) => setTimeout(r, REWARDED_AD_MS));
  return true;
}
