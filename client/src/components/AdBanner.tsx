import { useEffect, useRef } from 'react';
import { ADS_ENABLED, ADSENSE_CLIENT, ADSENSE_READY, ADSENSE_SLOT, loadAdSense } from '../lib/ads';

interface Props {
  /** AdSense ad-unit (slot) id. Defaults to VITE_ADSENSE_SLOT. */
  slot?: string;
  className?: string;
}

/**
 * Responsive banner ad slot. Three states:
 *   • ads disabled                       → renders nothing.
 *   • enabled but AdSense not configured → labelled placeholder (dev/preview).
 *   • enabled + AdSense configured       → a real <ins class="adsbygoogle"> unit.
 * See docs/DEPLOYMENT.md (#ads).
 */
export function AdBanner({ slot = ADSENSE_SLOT, className = '' }: Props) {
  const live = ADSENSE_READY && slot.length > 0;
  const pushed = useRef(false);

  useEffect(() => {
    if (!live || pushed.current) return;
    loadAdSense();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (err) {
      // A failed push (e.g. blocked by an ad blocker) shouldn't break the screen.
      console.error('[dk] adsense push failed', err);
    }
  }, [live]);

  if (!ADS_ENABLED) return null;

  if (!live) {
    return (
      <div
        className={`mx-auto flex h-[90px] w-full max-w-[728px] items-center justify-center rounded-lg border border-dashed border-white/15 bg-black/40 text-[10px] uppercase tracking-widest text-white/30 ${className}`}
      >
        Advertisement
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle mx-auto block w-full max-w-[728px] ${className}`}
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
