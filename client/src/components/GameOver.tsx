import type { GameMode } from '../types';
import type { RunResult } from './GameScreen';
import { formatTime } from '../lib/utils';

interface Props {
  result: RunResult;
  mode: GameMode;
  isHighScore: boolean;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOver({ result, mode, isHighScore, onRestart, onMenu }: Props) {
  const missed = Object.entries(result.missedWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-6xl font-black tracking-widest text-neon-red drop-shadow-[0_0_20px_rgba(255,56,96,0.8)]">
        GAME OVER
      </h1>
      {isHighScore && (
        <div className="animate-pulse text-xl font-bold text-neon-amber">★ NEW HIGH SCORE ★</div>
      )}

      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        <Big label="Score" value={result.score.toLocaleString()} accent="#ffb300" />
        <Big label="Wave" value={result.wave} accent="#39ff14" />
        <Big label="WPM" value={result.wpm} accent="#00f0ff" />
        <Big label="Accuracy" value={`${result.accuracy}%`} accent="#39ff14" />
        <Big label="Survived" value={formatTime(result.survivalMs)} accent="#e8ffe8" />
        <Big label="Kills" value={result.kills} accent="#ff2bd6" />
        <Big label="Bosses" value={result.bossesDefeated} accent="#ff2bd6" />
        <Big label="Coins" value={result.coins} accent="#ffd166" />
      </div>

      {missed.length > 0 && (
        <div className="w-full rounded-xl border border-white/10 bg-ink-800/70 p-4 text-left">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-neon-red">
            Weak Words
          </h3>
          <div className="flex flex-wrap gap-2">
            {missed.map(([word, n]) => (
              <span key={word} className="rounded bg-black/50 px-2 py-1 text-sm text-white/70">
                {word} <span className="text-neon-red">×{n}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex w-full max-w-md gap-3">
        <button className="menu-btn flex-1 text-center" onClick={onRestart}>
          ↻ Play Again
        </button>
        <button className="menu-btn flex-1 text-center" onClick={onMenu}>
          ⏏ Menu
        </button>
      </div>
      <p className="text-xs text-white/40">{mode.toUpperCase()} · press Enter to play again</p>
    </div>
  );
}

function Big({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-ink-800/80 p-3">
      <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="text-2xl font-black" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
