import { useEffect, useState } from 'react';
import { getLeaderboard, type LeaderboardEntry } from '../lib/api';
import { AdBanner } from './AdBanner';

export function Leaderboard({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getLeaderboard(20)
      .then((e) => !cancelled && setEntries(e))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-2xl flex-col gap-4 overflow-y-auto p-6">
      <button
        onClick={onBack}
        className="absolute left-4 top-4 z-10 rounded-md border border-white/15 bg-black/50 px-3 py-1.5 text-sm text-white/70 hover:border-neon-green hover:text-neon-green"
      >
        ← Back
      </button>

      <h1 className="text-center text-3xl font-black tracking-wide text-neon-green">LEADERBOARD</h1>

      {error && <p className="text-center text-sm text-neon-red">Couldn’t load the leaderboard right now.</p>}
      {!error && entries === null && (
        <p className="animate-pulse text-center text-sm tracking-widest text-neon-green/70">LOADING…</p>
      )}
      {entries !== null && entries.length === 0 && (
        <p className="mt-8 text-center text-sm text-white/50">No scores yet — be the first to make the board!</p>
      )}

      {entries !== null && entries.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-[2.5rem_1fr_5rem_4rem_4rem] gap-2 bg-ink-700/70 px-4 py-2 text-[10px] uppercase tracking-widest text-white/40">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Score</span>
            <span className="text-right">Wave</span>
            <span className="text-right">WPM</span>
          </div>
          {entries.map((e, i) => (
            <div
              key={e.id}
              className={`grid grid-cols-[2.5rem_1fr_5rem_4rem_4rem] items-center gap-2 px-4 py-2 text-sm ${
                i % 2 ? 'bg-ink-800/50' : 'bg-ink-800/20'
              }`}
            >
              <span className={`font-black ${i === 0 ? 'text-neon-amber' : 'text-white/40'}`}>{i + 1}</span>
              <span className="truncate text-white/90">{e.name}</span>
              <span className="text-right font-bold text-neon-amber">{e.score.toLocaleString()}</span>
              <span className="text-right text-white/60">{e.wave}</span>
              <span className="text-right text-neon-cyan">{e.wpm}</span>
            </div>
          ))}
        </div>
      )}

      <AdBanner className="mt-auto" />
    </div>
  );
}
