import { useCallback, useEffect, useState } from 'react';

export const CONNECTION_GAME_DELAY_MS = 4_000;
const SIGNAL_KEYS = 'DEADKEYSZOMBIE';

export interface SignalScore {
  score: number;
  streak: number;
  misses: number;
  hit: boolean;
}

export function scoreSignalKey(target: string, pressed: string, score: number, streak: number, misses: number): SignalScore {
  const hit = pressed.toUpperCase() === target;
  if (!hit) return { score, streak: 0, misses: misses + 1, hit: false };
  const nextStreak = streak + 1;
  return {
    score: score + 100 + Math.min(400, streak * 25),
    streak: nextStreak,
    misses,
    hit: true,
  };
}

function randomSignalKey(previous?: string) {
  if (SIGNAL_KEYS.length === 1) return SIGNAL_KEYS;
  let next = previous;
  while (next === previous) {
    next = SIGNAL_KEYS[Math.floor(Math.random() * SIGNAL_KEYS.length)];
  }
  return next ?? 'D';
}

export function ConnectingScreen() {
  const [showGame, setShowGame] = useState(false);
  const [target, setTarget] = useState(() => randomSignalKey());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [misses, setMisses] = useState(0);
  const [lastHit, setLastHit] = useState(true);

  useEffect(() => {
    const gameId = setTimeout(() => setShowGame(true), CONNECTION_GAME_DELAY_MS);
    return () => clearTimeout(gameId);
  }, []);

  const purgeSignal = useCallback(
    (pressed: string) => {
      const result = scoreSignalKey(target, pressed, score, streak, misses);
      setScore(result.score);
      setStreak(result.streak);
      setMisses(result.misses);
      setLastHit(result.hit);
      if (result.hit) setTarget((current) => randomSignalKey(current));
    },
    [misses, score, streak, target],
  );

  useEffect(() => {
    if (!showGame) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1 || !/[a-z]/i.test(event.key)) return;
      event.preventDefault();
      purgeSignal(event.key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [purgeSignal, showGame]);

  return (
    <div className="crt relative flex h-full w-full items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="absolute inset-0 opacity-25">
        <div className="absolute left-[8%] top-[18%] h-px w-[34%] bg-neon-green/50" />
        <div className="absolute right-[10%] top-[32%] h-px w-[28%] bg-neon-pink/40" />
        <div className="absolute bottom-[20%] left-[18%] h-px w-[50%] bg-neon-cyan/30" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        <h1 className="text-4xl font-black tracking-tight text-neon-green drop-shadow-[0_0_18px_rgba(57,255,20,0.6)]">
          DEAD<span className="text-neon-pink"> KEYS</span>
        </h1>

        <div className="mt-4 animate-pulse text-sm font-black tracking-[0.28em] text-neon-green">CONNECTING…</div>

        {!showGame ? (
          <div className="mx-auto mt-6 flex w-40 items-center gap-2">
            {[0, 1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                className="h-1.5 flex-1 animate-pulse rounded-full bg-neon-green/50"
                style={{ animationDelay: `${bar * 120}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-neon-green/35 bg-black/65 text-left shadow-[0_0_30px_rgba(57,255,20,0.12)] backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[10px] font-black tracking-[0.2em]">
              <span className="text-neon-pink">DEAD SIGNAL // LIVE</span>
              <span className="animate-pulse text-neon-green">UPLINK UNSTABLE</span>
            </div>

            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">Intercepted key</div>
                  <p className="mt-1 max-w-xs text-xs leading-relaxed text-white/55">
                    Purge the infected keystroke before it reaches the safehouse.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 text-right text-[10px] uppercase tracking-wider text-white/35">
                  <span>Purged</span>
                  <span className="font-black text-neon-amber">{score.toLocaleString()}</span>
                  <span>Chain</span>
                  <span className="font-black text-neon-cyan">x{streak}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => purgeSignal(target)}
                aria-label={`Purge signal ${target}`}
                className={`group relative mx-auto mt-5 flex h-28 w-28 items-center justify-center rounded-xl border-2 bg-ink-900 font-mono text-6xl font-black transition active:scale-95 ${
                  lastHit
                    ? 'border-neon-green text-neon-green shadow-[0_0_24px_rgba(57,255,20,0.35)]'
                    : 'animate-shake border-neon-red text-neon-red shadow-[0_0_24px_rgba(255,56,96,0.4)]'
                }`}
              >
                <span className="absolute inset-2 rounded-md border border-white/10" />
                <span className="relative drop-shadow-[0_0_12px_currentColor]">{target}</span>
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
                <span className="rounded border border-white/15 bg-white/5 px-2 py-1 font-black text-white/75">PRESS {target}</span>
                <span>or tap the key</span>
              </div>

              <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-red">Breaches {misses}</span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-neon-green shadow-[0_0_8px_rgba(57,255,20,0.8)] transition-all"
                    style={{ width: `${20 + ((score / 100) % 8) * 10}%` }}
                  />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-white/35">holding the line…</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
