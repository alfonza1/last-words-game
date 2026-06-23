import type { Difficulty, GameMode, GameStats } from '../types';
import { formatTime } from '../lib/utils';
import { DIFFICULTY_CONFIGS } from '../game/difficulty';
import { AdBanner } from './AdBanner';

interface Props {
  stats: GameStats;
  difficulty: Difficulty;
  onStart: (mode: GameMode) => void;
  onNav: (screen: 'upgrades' | 'howto' | 'settings' | 'leaderboard') => void;
  onDifficulty: (d: Difficulty) => void;
}

const DIFFS: Difficulty[] = ['easy', 'normal', 'nightmare'];
const DIFF_BLURB: Record<Difficulty, string> = {
  easy: 'Words only — relaxed.',
  normal: 'Words + numbers.',
  nightmare: 'Words, numbers & symbols — exact case. Earn 2× coins. Enter if you dare.',
};

export function MainMenu({ stats, difficulty, onStart, onNav, onDifficulty }: Props) {
  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-center gap-10 p-6">
      <div className="text-center">
        <h1 className="text-6xl font-black tracking-tight text-neon-green drop-shadow-[0_0_24px_rgba(57,255,20,0.6)] sm:text-7xl">
          DEAD<span className="text-neon-pink"> KEYS</span>
        </h1>
        <p className="mt-2 text-sm tracking-[0.35em] text-neon-cyan">TYPE OR BE DEVOURED</p>
      </div>

      <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {/* Difficulty */}
          <div>
            <div className="mb-1.5 text-[11px] uppercase tracking-widest text-white/40">Difficulty</div>
            <div className="flex gap-2 rounded-lg border border-white/10 bg-ink-800/60 p-1">
              {DIFFS.map((d) => (
                <button
                  key={d}
                  onClick={() => onDifficulty(d)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition-all ${
                    difficulty === d ? 'bg-neon-green/15 text-neon-green shadow-neon' : 'text-white/55 hover:text-white/90'
                  }`}
                >
                  {DIFFICULTY_CONFIGS[d].label}
                </button>
              ))}
            </div>
            {/* Reserve 2 lines so switching difficulty never shifts the buttons. */}
            <p className="mt-1.5 min-h-[2.25rem] text-xs leading-snug text-white/40">{DIFF_BLURB[difficulty]}</p>
          </div>

          {/* Modes + nav */}
          <div className="space-y-3">
            <button className="menu-btn shadow-neon" onClick={() => onStart('survival')}>
              <span className="mr-3 inline-block w-6 text-center">▶</span>Start Survival
            </button>
            <button className="menu-btn text-base" onClick={() => onStart('bossrush')}>
              <span className="mr-3 inline-block w-6 text-center">💀</span>Boss Rush
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button className="menu-btn text-base" onClick={() => onNav('upgrades')}>
                <span className="mr-2 inline-block w-5 text-center">🛒</span>Store
              </button>
              <button className="menu-btn text-base" onClick={() => onNav('leaderboard')}>
                <span className="mr-2 inline-block w-5 text-center">🏆</span>Leaderboard
              </button>
              <button className="menu-btn text-base" onClick={() => onNav('howto')}>
                <span className="mr-2 inline-block w-5 text-center">❓</span>How to Play
              </button>
              <button className="menu-btn text-base" onClick={() => onNav('settings')}>
                <span className="mr-2 inline-block w-5 text-center">🔧</span>Settings
              </button>
            </div>
          </div>
        </div>

        {/* Records */}
        <div className="rounded-xl border border-white/10 bg-ink-800/70 p-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-neon-green">Records</h3>
          <dl className="space-y-1.5 text-sm">
            <Row k="Best Score" v={stats.bestScore.toLocaleString()} />
            <Row k="Longest Survival" v={formatTime(stats.longestSurvivalMs)} />
            <Row k="Highest WPM" v={stats.highestWpm} />
            <Row k="Best Accuracy" v={`${stats.bestAccuracy}%`} />
            <Row k="Total Kills" v={stats.totalKills} />
            <Row k="Bosses Defeated" v={stats.bossesDefeated} />
            <Row k="Longest Streak" v={stats.longestStreak} />
            <Row k="Coins" v={stats.totalCoins} />
          </dl>
        </div>
      </div>

      <p className="text-xs tracking-[0.25em] text-white/25">SURVIVE THE NIGHT · ONE WORD AT A TIME</p>
      <AdBanner />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-1">
      <dt className="text-white/50">{k}</dt>
      <dd className="font-bold text-neon-cyan">{v}</dd>
    </div>
  );
}
