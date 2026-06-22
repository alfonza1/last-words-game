import { useEffect, useRef } from 'react';

/**
 * requestAnimationFrame loop that calls `callback(dtSeconds)` each frame.
 * Delta time is clamped by the engine; this hook just measures it.
 */
export function useGameLoop(callback: (dt: number) => void, active: boolean) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      cbRef.current(dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
