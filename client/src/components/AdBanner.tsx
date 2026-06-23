import { ADS_ENABLED } from '../lib/ads';

/**
 * Banner ad slot. Renders nothing until ads are enabled (VITE_ADS_ENABLED=true);
 * when enabled it shows a labelled placeholder where the real banner/display ad
 * (e.g. AdSense) will mount. See docs/DEPLOYMENT.md.
 */
export function AdBanner({ className = '' }: { className?: string }) {
  if (!ADS_ENABLED) return null;
  return (
    <div
      className={`mx-auto flex h-[90px] w-full max-w-[728px] items-center justify-center rounded-lg border border-dashed border-white/15 bg-black/40 text-[10px] uppercase tracking-widest text-white/30 ${className}`}
    >
      Advertisement
    </div>
  );
}
