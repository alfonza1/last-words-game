import { useEffect, useState } from 'react';
import { getLeaderboard, type LeaderboardEntry, type Leaderboards } from '../lib/api';
import { AdBanner } from './AdBanner';

type Board = 'typers' | 'solvers';
const MEDALS = ['🥇', '🥈', '🥉'];

/** Solvers board "Mode" label from a run's play style. */
const STYLE_LABEL: Record<string, string> = {
  riddles: 'Riddle',
  math: 'Math',
  trivia: 'Trivia',
  typing: 'Typing',
};
function modeLabel(e: LeaderboardEntry): string {
  return STYLE_LABEL[e.style] ?? 'Puzzle';
}

export function Leaderboard({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<Leaderboards | null>(null);
  const [error, setError] = useState(false);
  const [board, setBoard] = useState<Board>('typers');

  useEffect(() => {
    let cancelled = false;
    getLeaderboard(20)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const entries = data ? data[board] ?? null : null; // tolerate an older API response
  const cols = 'grid-cols-[2.75rem_1fr_5rem_4rem]';

  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-2xl flex-col gap-4 overflow-y-auto p-6">
      <button
        onClick={onBack}
        className="absolute left-4 top-4 z-10 rounded-md border border-white/15 bg-black/50 px-3 py-1.5 text-sm text-white/70 hover:border-neon-green hover:text-neon-green"
      >
        ← Back
      </button>

      <div className="mt-6 text-center">
        <h1 className="text-4xl font-black tracking-widest text-neon-green drop-shadow-[0_0_20px_rgba(57,255,20,0.55)]">
          LEADERBOARD
        </h1>
        <p className="mt-1 text-xs uppercase tracking-[0.35em] text-neon-cyan">🌍 Top 20 in the World</p>
      </div>

      {/* Board toggle: typers vs solvers (riddle / math / trivia) */}
      <div className="mx-auto flex w-full max-w-sm gap-2 rounded-lg border border-white/10 bg-ink-800/60 p-1">
        <button
          onClick={() => setBoard('typers')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition-all ${
            board === 'typers' ? 'bg-neon-green/15 text-neon-green shadow-neon' : 'text-white/55 hover:text-white/90'
          }`}
        >
          ⌨ Top Typers
        </button>
        <button
          onClick={() => setBoard('solvers')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition-all ${
            board === 'solvers' ? 'bg-neon-green/15 text-neon-green shadow-neon' : 'text-white/55 hover:text-white/90'
          }`}
        >
          🧩 Top Solvers
        </button>
      </div>
      <p className="-mt-2 text-center text-[11px] text-white/35">
        {board === 'typers' ? "Top scores - WPM shows each player's best." : 'Sharpest minds — Riddle, Math & Trivia Defense.'}
      </p>

      {error && <p className="text-center text-sm text-neon-red">Couldn’t load the leaderboard right now.</p>}
      {!error && entries === null && (
        <p className="animate-pulse text-center text-sm tracking-widest text-neon-green/70">LOADING…</p>
      )}
      {entries !== null && entries.length === 0 && (
        <p className="mt-8 text-center text-sm text-white/50">
          No scores yet — be the first {board === 'typers' ? 'typer' : 'solver'} on the board!
        </p>
      )}

      {entries !== null && entries.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10 shadow-neon">
          <div className={`grid ${cols} gap-2 bg-ink-700/70 px-4 py-2 text-[10px] uppercase tracking-widest text-white/40`}>
            <span>#</span>
            <span>Player</span>
            {board === 'typers' ? (
              <>
                <span className="text-right">Score</span>
                <span className="text-right">WPM</span>
              </>
            ) : (
              <>
                <span className="text-right">Score</span>
                <span className="text-right">Mode</span>
              </>
            )}
          </div>
          {entries.map((e, i) => (
            <Row key={e.id} e={e} rank={i} board={board} cols={cols} />
          ))}
        </div>
      )}

      <AdBanner className="mt-auto" />
    </div>
  );
}

function Row({ e, rank, board, cols }: { e: LeaderboardEntry; rank: number; board: Board; cols: string }) {
  const top = rank < 3;
  return (
    <div
      className={`grid ${cols} items-center gap-2 px-4 py-2 text-sm ${
        rank % 2 ? 'bg-ink-800/50' : 'bg-ink-800/20'
      } ${top ? 'bg-neon-amber/[0.06]' : ''}`}
    >
      <span className={`font-black ${top ? 'text-base text-neon-amber' : 'text-white/40'}`}>
        {top ? MEDALS[rank] : rank + 1}
      </span>
      <span className="truncate font-bold text-white/90">{e.name}</span>
      {board === 'typers' ? (
        <>
          <span className="text-right font-black text-neon-amber">{e.score.toLocaleString()}</span>
          <span className="text-right text-neon-cyan">{e.wpm}</span>
        </>
      ) : (
        <>
          <span className="text-right font-black text-neon-amber">{e.score.toLocaleString()}</span>
          <span className="text-right text-xs font-bold uppercase tracking-wide text-neon-cyan">{modeLabel(e)}</span>
        </>
      )}
    </div>
  );
}
