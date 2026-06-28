import type { GameState } from '../types';
import { isPrefix, type MatchOptions } from '../game/typing';

/** Render a word with the already-typed prefix highlighted. */
function Highlighted({ text, matched, big }: { text: string; matched: number; big?: boolean }) {
  return (
    <span className={big ? 'text-3xl tracking-wide' : ''}>
      <span className="text-neon-green">{text.slice(0, matched)}</span>
      <span className={big ? 'text-white' : 'text-white/80'}>{text.slice(matched)}</span>
    </span>
  );
}

/**
 * Bottom-of-screen typing UI. The words are a stable, ordered queue independent
 * of the zombies. You always type the FIRST word; on a hit the list shifts left
 * and a fresh word appends at the end, so the order never jumps around.
 */
export function TypeBar({ s, opts, input }: { s: GameState; opts: MatchOptions; input: string }) {
  const queue = s.wordQueue;
  const typed = input.trim();

  // Typing Defense only shows the words still needed to clear the wave, so the
  // last word of a wave stands alone instead of trailing words you won't type.
  const visibleCount = Math.max(1, Math.min(queue.length, s.wordsToClearWave));
  const visibleQueue = queue.slice(0, visibleCount);

  // The active word is always the first in the queue.
  const active = queue[0] ?? '';
  const onTrack = active.length > 0 && typed.length > 0 && isPrefix(input, active, opts);
  const wrong = active.length > 0 && typed.length > 0 && !onTrack; // mistyped → go red
  const activeMatched = onTrack ? Math.min(typed.length, active.length) : 0;

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-2">
      {/* Active (first) word */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-[0.35em] text-white/40">Type this</span>
        <div className="font-mono font-bold">
          {active ? (
            wrong ? (
              <span className="text-3xl tracking-wide text-neon-red">{active}</span>
            ) : (
              <Highlighted text={active} matched={activeMatched} big />
            )
          ) : (
            <span className="text-3xl text-neon-red">—</span>
          )}
        </div>
      </div>

      {/* The ordered queue — only the first is active; the rest are upcoming. */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {visibleQueue.map((word, i) => {
          const isFirst = i === 0;
          const matched = isFirst ? activeMatched : 0;
          const firstWrong = isFirst && wrong;
          return (
            <span
              key={i}
              className={`rounded-md border bg-black/60 px-2.5 py-1 font-mono text-sm ${
                firstWrong
                  ? 'border-neon-red text-neon-red shadow-[0_0_10px_rgba(255,56,96,0.5)]'
                  : isFirst
                    ? 'border-neon-green shadow-neon text-white/90'
                    : 'border-white/10 text-white/45'
              }`}
            >
              {firstWrong ? (
                <span>{word}</span>
              ) : matched > 0 ? (
                <Highlighted text={word} matched={matched} />
              ) : (
                <span>{word}</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
