import { useEffect, useState } from 'react';
import { getLeaderboard, type LeaderboardEntry, type Leaderboards } from '../lib/api';
import { AdBanner } from './AdBanner';

type Board = 'typers' | 'riddlers';
const MEDALS = ['🥇', '🥈', '🥉'];

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

  const entries = data ? data[board] : null;

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

      {/* Board toggle: typers vs riddlers */}
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
          onClick={() => setBoard('riddlers')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition-all ${
            board === 'riddlers' ? 'bg-neon-pink/15 text-neon-pink shadow-neon' : 'text-white/55 hover:text-white/90'
          }`}
        >
          🧩 Top Riddlers
        </button>
      </div>

      {error && <p className="text-center text-sm text-neon-red">Couldn’t load the leaderboard right now.</p>}
      {!error && entries === null && (
        <p className="animate-pulse text-center text-sm tracking-widest text-neon-green/70">LOADING…</p>
      )}
      {entries !== null && entries.length === 0 && (
        <p className="mt-8 text-center text-sm text-white/50">
          No scores yet — be the first {board === 'typers' ? 'typer' : 'riddler'} on the board!
        </p>
      )}

      {entries !== null && entries.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10 shadow-neon">
          <div className="grid grid-cols-[2.75rem_1fr_5rem_3.5rem_3.5rem] gap-2 bg-ink-700/70 px-4 py-2 text-[10px] uppercase tracking-widest text-white/40">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Score</span>
            <span className="text-right">Wave</span>
            <span className="text-right">WPM</span>
          </div>
          {entries.map((e, i) => (
            <Row key={e.id} e={e} rank={i} />
          ))}
        </div>
      )}

      <AdBanner className="mt-auto" />
    </div>
  );
}

function Row({ e, rank }: { e: LeaderboardEntry; rank: number }) {
  const top = rank < 3;
  return (
    <div
      className={`grid grid-cols-[2.75rem_1fr_5rem_3.5rem_3.5rem] items-center gap-2 px-4 py-2 text-sm ${
        rank % 2 ? 'bg-ink-800/50' : 'bg-ink-800/20'
      } ${top ? 'bg-neon-amber/[0.06]' : ''}`}
    >
      <span className={`font-black ${top ? 'text-base text-neon-amber' : 'text-white/40'}`}>
        {top ? MEDALS[rank] : rank + 1}
      </span>
      <div className="min-w-0">
        <div className="truncate font-bold text-white/90">{e.name}</div>
        <div className="text-[10px] uppercase tracking-widest text-white/35">{e.difficulty}</div>
      </div>
      <span className="text-right font-black text-neon-amber">{e.score.toLocaleString()}</span>
      <span className="text-right text-white/60">{e.wave}</span>
      <span className="text-right text-neon-cyan">{e.wpm}</span>
    </div>
  );
}
