import { useEffect, useState } from 'react';
import { getMobileExperienceSnapshot, type MobileExperienceSnapshot } from '../mobile/capabilities';

function sameSnapshot(a: MobileExperienceSnapshot, b: MobileExperienceSnapshot): boolean {
  return (
    a.nativeMobileShell === b.nativeMobileShell &&
    a.touchFirst === b.touchFirst &&
    a.hasDesktopPointer === b.hasDesktopPointer &&
    a.tabletOrSmallerViewport === b.tabletOrSmallerViewport &&
    a.mobileSpeechExperience === b.mobileSpeechExperience
  );
}

export function useMobileExperience(): MobileExperienceSnapshot {
  const [snapshot, setSnapshot] = useState(() => getMobileExperienceSnapshot());

  useEffect(() => {
    const update = () => {
      const next = getMobileExperienceSnapshot();
      setSnapshot((prev) => (sameSnapshot(prev, next) ? prev : next));
    };

    const coarse = window.matchMedia?.('(pointer: coarse)');
    const fine = window.matchMedia?.('(pointer: fine)');
    coarse?.addEventListener?.('change', update);
    fine?.addEventListener?.('change', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    update();

    return () => {
      coarse?.removeEventListener?.('change', update);
      fine?.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return snapshot;
}

