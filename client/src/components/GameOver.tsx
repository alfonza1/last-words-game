import { useState } from 'react';
import type { GameMode } from '../types';
import type { RunResult } from './GameScreen';
import type { WpmBonus } from '../game/wpmBonus';
import { formatTime } from '../lib/utils';
import { showRewardedAd } from '../lib/ads';
import { AdBanner } from './AdBanner';

interface Props {
  result: RunResult;
  mode: GameMode;
  isHighScore: boolean;
  rewardCoins: number;
  wpmBonus: WpmBonus;
  /** Watch the rewarded ad → grant coins. Returns coins granted (throws on error). */
  onWatchAd: () => Promise<number>;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOver({
  result,
  mode,
  isHighScore,
  rewardCoins,
  wpmBonus,
  onWatchAd,
  onRestart,
  onMenu,
}: Props) {
  const [adPhase, setAdPhase] = useState<'idle' | 'playing' | 'claimed'>('idle');
  const [earned, setEarned] = useState(0);
  const [adError, setAdError] = useState<string | null>(null);
  const survived = result.survived && (result.style === 'riddles' || result.style === 'trivia');

  const watchAd = async () => {
    setAdError(null);
    setAdPhase('playing');
    try {
      await showRewardedAd();
      const coins = await onWatchAd();
      setEarned(coins);
      setAdPhase('claimed');
    } catch (e) {
      setAdPhase('idle');
      setAdError((e as Error)?.message || 'Couldn’t load an ad. Try again later.');
    }
  };

  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center gap-6 p-6 text-center">
      <h1
        className={`text-6xl font-black tracking-widest ${
          survived
            ? 'text-neon-green drop-shadow-[0_0_20px_rgba(57,255,20,0.8)]'
            : 'text-neon-red drop-shadow-[0_0_20px_rgba(255,56,96,0.8)]'
        }`}
      >
        {survived ? 'YOU SURVIVED' : 'GAME OVER'}
      </h1>
      {isHighScore && <div className="animate-pulse text-xl font-bold text-neon-amber">★ NEW HIGH SCORE ★</div>}

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

      {result.style === 'typing' && (
        <div className="rounded-lg border border-white/10 bg-ink-800/70 px-4 py-2">
          <div className="text-[10px] uppercase tracking-widest text-white/40">WPM Bonus</div>
          <div className="mt-1 flex items-center justify-center gap-4 text-sm font-black">
            <span className="text-neon-amber">+{wpmBonus.coins.toLocaleString()} Coins</span>
            <span className="text-neon-cyan">+{wpmBonus.score.toLocaleString()} Score</span>
          </div>
        </div>
      )}

      {/* Optional rewarded ad for bonus coins */}
      {adPhase === 'claimed' ? (
        <div className="rounded-lg border border-neon-green/50 bg-neon-green/10 px-4 py-2 text-sm font-bold text-neon-green">
          +{earned.toLocaleString()} bonus coins added 🪙
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={watchAd}
            disabled={adPhase === 'playing'}
            className="rounded-lg border border-neon-amber/60 bg-neon-amber/10 px-5 py-2 text-sm font-bold text-neon-amber hover:bg-neon-amber/20 disabled:opacity-60"
          >
            {adPhase === 'playing' ? 'Ad playing…' : `📺 Watch ad for +${rewardCoins} coins (optional)`}
          </button>
          {adError && <span className="text-xs text-neon-red">{adError}</span>}
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

      <AdBanner />

      {adPhase === 'playing' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/85">
          <div className="text-xs uppercase tracking-[0.3em] text-white/40">Advertisement</div>
          <div className="animate-pulse text-2xl font-black tracking-widest text-neon-green">PLAYING…</div>
          <div className="text-xs text-white/40">(placeholder — real rewarded ad goes here)</div>
        </div>
      )}
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
