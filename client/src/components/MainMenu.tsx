import type { CharacterLoadout, Difficulty, GameMode, GameStats, PuzzleStyle } from '../types';
import { formatTime } from '../lib/utils';
import { DIFFICULTY_CONFIGS } from '../game/difficulty';
import { AdBanner } from './AdBanner';
import { CharacterAvatar } from './CharacterAvatar';

interface Props {
  stats: GameStats;
  riddleStats: GameStats;
  difficulty: Difficulty;
  character: CharacterLoadout;
  username: string;
  riddleMode: boolean;
  puzzleStyle: PuzzleStyle;
  onStart: (mode: GameMode) => void;
  onNav: (screen: 'upgrades' | 'closet' | 'howto' | 'settings' | 'leaderboard') => void;
  onDifficulty: (d: Difficulty) => void;
  onRiddleMode: (v: boolean) => void;
  onPuzzleStyle: (s: PuzzleStyle) => void;
}

/** A play style for the menu: plain typing, or one of the puzzle styles. */
type Style = 'typing' | PuzzleStyle;
const STYLE_ORDER: Style[] = ['typing', 'riddles', 'math', 'trivia'];

const STYLE_META: Record<Style, { label: string; icon: string; active: string; blurb: string; tagWord: string }> = {
  typing: {
    label: 'Typing',
    icon: '⌨',
    active: 'bg-neon-green/15 text-neon-green shadow-neon',
    blurb: 'Type the words — each completed word fires one shot.',
    tagWord: 'WORD',
  },
  riddles: {
    label: 'Riddle',
    icon: '🧩',
    active: 'bg-neon-pink/15 text-neon-pink shadow-neon',
    blurb: 'Solve short riddles to fire a multi-kill volley.',
    tagWord: 'RIDDLE',
  },
  math: {
    label: 'Math',
    icon: '➗',
    active: 'bg-neon-cyan/15 text-neon-cyan shadow-neon',
    blurb: 'Solve math problems to fire a multi-kill volley.',
    tagWord: 'PROBLEM',
  },
  trivia: {
    label: 'Trivia',
    icon: '❓',
    active: 'bg-neon-amber/15 text-neon-amber shadow-neon',
    blurb: 'Answer trivia questions to fire a multi-kill volley.',
    tagWord: 'QUESTION',
  },
};

const DIFFS: Difficulty[] = ['easy', 'normal', 'nightmare'];
const DIFF_BLURB: Record<Style, Record<Difficulty, string>> = {
  typing: {
    easy: 'Short words with a relaxed horde.',
    normal: 'Words and numbers against the full outbreak.',
    nightmare: 'Exact-case words, numbers, and symbols. Earn 2× coins and points.',
  },
  riddles: {
    easy: 'Straightforward clues with extra time to solve.',
    normal: 'Sharper clues and a faster approaching horde.',
    nightmare: 'The hardest clues under maximum pressure. Earn 2× coins and points.',
  },
  math: {
    easy: 'Quick addition and subtraction, relaxed horde.',
    normal: 'Multiplication and bigger sums against the outbreak.',
    nightmare: 'Multi-step problems and division under max pressure. Earn 2× coins and points.',
  },
  trivia: {
    easy: 'Everyday questions with time to think.',
    normal: 'Trickier questions and a faster approaching horde.',
    nightmare: 'Tough questions under maximum pressure. Earn 2× coins and points.',
  },
};

export function MainMenu({
  stats,
  riddleStats,
  difficulty,
  character,
  username,
  riddleMode,
  puzzleStyle,
  onStart,
  onNav,
  onDifficulty,
  onRiddleMode,
  onPuzzleStyle,
}: Props) {
  const activeStyle: Style = riddleMode ? puzzleStyle : 'typing';
  const selectStyle = (s: Style) => (s === 'typing' ? onRiddleMode(false) : onPuzzleStyle(s));
  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-start gap-6 overflow-y-auto px-6 pb-10 pt-16 lg:justify-center lg:p-6">
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-tight text-neon-green drop-shadow-[0_0_24px_rgba(57,255,20,0.6)] sm:text-7xl">
          DEAD<span className="text-neon-pink"> KEYS</span>
        </h1>
        <p className="mt-2 text-sm tracking-[0.35em] text-neon-cyan">TYPE OR BE DEVOURED</p>
      </div>

      <div className="grid w-full gap-5 lg:grid-cols-[1.2fr_0.85fr_0.8fr]">
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
            <p className="mt-1.5 min-h-[2.25rem] text-xs leading-snug text-white/40">
              {DIFF_BLURB[activeStyle][difficulty]}
            </p>
          </div>

          {/* Play style: type words, or solve a puzzle for a volley */}
          <div>
            <div className="mb-1.5 text-[11px] uppercase tracking-widest text-white/40">Play style</div>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-ink-800/60 p-1">
              {STYLE_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => selectStyle(s)}
                  className={`rounded-md px-3 py-2 text-sm font-bold transition-all ${
                    activeStyle === s ? 'bg-neon-green/15 text-neon-green shadow-neon' : 'text-white/55 hover:text-white/90'
                  }`}
                >
                  {STYLE_META[s].icon} {STYLE_META[s].label} Defense
                </button>
              ))}
            </div>
            <p className="mt-1.5 min-h-[2.25rem] text-xs leading-snug text-white/40">{STYLE_META[activeStyle].blurb}</p>
          </div>

          {/* Modes + nav */}
          <div className="space-y-3">
            <button className="menu-btn text-base" onClick={() => onStart('survival')}>
              <span className="mr-3 inline-block w-6 text-center">▶</span>Zombie Survival
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

        {/* Equipped survivor */}
        <button
          onClick={() => onNav('closet')}
          className="group relative min-h-[360px] overflow-hidden rounded-2xl border border-neon-green/25 bg-ink-800/75 text-left transition hover:border-neon-green/70 hover:shadow-neon"
        >
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-neon-green/10 to-transparent" />
          <div className="absolute left-3 top-3 z-10">
            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-neon-cyan/70">Survivor</div>
            <div className="max-w-[220px] truncate text-xl font-black tracking-wide text-neon-green drop-shadow-[0_0_12px_rgba(57,255,20,0.55)]">
              {username}
            </div>
          </div>
          <CharacterAvatar
            character={character}
            armed={false}
            className="absolute inset-x-0 bottom-9 mx-auto h-[310px] w-[245px] transition group-hover:scale-[1.025]"
          />
          <div className="absolute inset-x-4 bottom-3 flex justify-end border-t border-white/10 pt-2 text-[10px] uppercase tracking-widest">
            <span className="font-bold text-neon-green">Customize →</span>
          </div>
        </button>

        {/* Records */}
        <Records stats={stats} riddleStats={riddleStats} riddleMode={riddleMode} />
      </div>

      <p className="text-xs tracking-[0.25em] text-white/25">SURVIVE THE NIGHT · OUTLAST THE DEAD</p>
      <AdBanner />
    </div>
  );
}

function Records({
  stats,
  riddleStats,
  riddleMode,
}: {
  stats: GameStats;
  riddleStats: GameStats;
  riddleMode: boolean;
}) {
  const selected = riddleMode ? riddleStats : stats;
  return (
    <div className="rounded-xl border border-neon-pink/25 bg-ink-800/70 p-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-neon-pink">
        {riddleMode ? 'Solver' : 'Typing'} Records
      </h3>
      <dl className="space-y-1.5 text-sm">
        <Row k="Best Score" v={selected.bestScore.toLocaleString()} />
        <Row k="Longest Survival" v={formatTime(selected.longestSurvivalMs)} />
        {riddleMode ? (
          <Row k="Total Runs" v={selected.gamesPlayed} />
        ) : (
          <Row k="Highest WPM" v={selected.highestWpm} />
        )}
        <Row k="Total Kills" v={selected.totalKills} />
        <Row k="Bosses Defeated" v={selected.bossesDefeated} />
        <Row k="Longest Streak" v={selected.longestStreak} />
        <Row k="Coins Earned" v={(selected.coinsEarned ?? 0).toLocaleString()} />
      </dl>
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
