import { useEffect, useState } from 'react';

export const CONNECTION_BRIEFING_DELAY_MS = 5_000;
const TIP_ROTATION_MS = 3_500;

export const CONNECTION_TIPS = [
  'Banked shots fire automatically when a zombie enters range.',
  'Puzzle modes trade rapid fire for heavier multi-shot volleys.',
  'Guest runs stay on this device until you sign in again.',
] as const;

export function connectingCopy(showBriefing: boolean, tipIndex: number) {
  if (!showBriefing) {
    return {
      status: 'CONNECTING…',
      title: null,
      detail: null,
      tip: null,
    };
  }

  return {
    status: 'STILL CONNECTING…',
    title: 'WAKING THE SAFEHOUSE',
    detail: 'The first connection after downtime can take a few more seconds. Your survivor data is safe.',
    tip: CONNECTION_TIPS[tipIndex % CONNECTION_TIPS.length],
  };
}

export function ConnectingScreen() {
  const [showBriefing, setShowBriefing] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    let rotationId: ReturnType<typeof setInterval> | undefined;
    const briefingId = setTimeout(() => {
      setShowBriefing(true);
      rotationId = setInterval(() => setTipIndex((current) => current + 1), TIP_ROTATION_MS);
    }, CONNECTION_BRIEFING_DELAY_MS);

    return () => {
      clearTimeout(briefingId);
      if (rotationId !== undefined) clearInterval(rotationId);
    };
  }, []);

  const copy = connectingCopy(showBriefing, tipIndex);

  return (
    <div className="crt flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-black tracking-tight text-neon-green drop-shadow-[0_0_18px_rgba(57,255,20,0.6)]">
          DEAD<span className="text-neon-pink"> KEYS</span>
        </h1>

        <div className="mt-6 animate-pulse text-sm font-black tracking-[0.28em] text-neon-green">{copy.status}</div>

        {copy.title && (
          <div className="mt-5 rounded-xl border border-neon-amber/35 bg-black/50 p-4 shadow-[0_0_22px_rgba(255,183,0,0.12)]">
            <div className="text-xs font-black tracking-[0.22em] text-neon-amber">{copy.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{copy.detail}</p>
            <div className="mt-4 border-t border-white/10 pt-3">
              <div className="text-[10px] font-black tracking-[0.25em] text-neon-cyan">SURVIVAL TIP</div>
              <p className="mt-1 text-xs leading-relaxed text-white/55">{copy.tip}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
