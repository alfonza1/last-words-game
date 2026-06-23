// ---------------------------------------------------------------------------
// Ads integration. PLACEHOLDER: until an ad network is wired up, the rewarded
// flow runs a short simulated "ad" and banners render a labelled empty slot.
// To enable for real: integrate a portal/AdSense SDK where marked and set
// VITE_ADS_ENABLED=true. See docs/DEPLOYMENT.md (#ads).
// ---------------------------------------------------------------------------
export const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED === 'true';

/** How long the placeholder rewarded "ad" runs (ms). */
export const REWARDED_AD_MS = 3000;

/**
 * Show a rewarded ad. Resolves true when the player has watched it through.
 * PLACEHOLDER — replace the body with a real rewarded SDK call (Poki /
 * CrazyGames / AdSense for Games / Ad Manager H5).
 */
export async function showRewardedAd(): Promise<boolean> {
  // TODO(setup): call the real rewarded-ad SDK and resolve on its reward event.
  await new Promise((r) => setTimeout(r, REWARDED_AD_MS));
  return true;
}
