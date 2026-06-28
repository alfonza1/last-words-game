export interface MobileExperienceSnapshot {
  nativeMobileShell: boolean;
  touchFirst: boolean;
  hasDesktopPointer: boolean;
  tabletOrSmallerViewport: boolean;
  mobileSpeechExperience: boolean;
}

interface CapacitorBridge {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

declare global {
  interface Window {
    Capacitor?: CapacitorBridge;
  }
}

function queryMedia(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(query).matches;
}

function isNativeMobileShell(): boolean {
  if (typeof window === 'undefined') return false;
  const bridge = window.Capacitor;
  if (!bridge) return false;
  if (typeof bridge.isNativePlatform === 'function') return bridge.isNativePlatform();
  const platform = bridge.getPlatform?.();
  return platform === 'android' || platform === 'ios';
}

export function getMobileExperienceSnapshot(): MobileExperienceSnapshot {
  if (typeof window === 'undefined') {
    return {
      nativeMobileShell: false,
      touchFirst: false,
      hasDesktopPointer: true,
      tabletOrSmallerViewport: false,
      mobileSpeechExperience: false,
    };
  }

  const nativeMobileShell = isNativeMobileShell();
  const touchFirst = queryMedia('(pointer: coarse)');
  const hasDesktopPointer = queryMedia('(pointer: fine)');
  const tabletOrSmallerViewport = Math.max(window.innerWidth, window.innerHeight) <= 1366;
  const mobileSpeechExperience = nativeMobileShell || (touchFirst && !hasDesktopPointer && tabletOrSmallerViewport);

  return {
    nativeMobileShell,
    touchFirst,
    hasDesktopPointer,
    tabletOrSmallerViewport,
    mobileSpeechExperience,
  };
}

