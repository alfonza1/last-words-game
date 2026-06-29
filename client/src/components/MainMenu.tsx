import type { CharacterLoadout, Difficulty, GameMode, GameStats, PuzzleStyle } from '../types';
import { formatTime } from '../lib/utils';
import { DIFFICULTY_CONFIGS } from '../game/difficulty';
import type { DailyOutbreak } from '../data/dailyOutbreak';
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
  mobileSpeechExperience?: boolean;
  dailyChallenge: DailyOutbreak;
  dailyBest: number;
  onDailyStart: () => void;
}

/** A play style for the menu: plain typing, or one of the puzzle styles. */
type Style = 'typing' | PuzzleStyle;
const STYLE_ORDER: Style[] = ['typing', 'math', 'trivia', 'riddles'];

const STYLE_META: Record<Style, { label: string; icon: string; active: string; blurb: string; tagWord: string }> = {
  typing: {
    label: 'Typing',
    icon: '⌨',
    active: 'bg-neon-green/15 text-neon-green shadow-neon',
    blurb: 'Each completed word fires one shot. High WPM earns extra points and coins.',
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
    normal: 'Words and numbers against the full outbreak. Earn 1.25× coins and score.',
    nightmare: 'Exact-case words, numbers, and symbols. Earn 2× coins and score.',
  },
  riddles: {
    easy: 'Straightforward clues with extra time to solve.',
    normal: 'Sharper clues and a faster approaching horde. Earn 1.25× coins and score.',
    nightmare: 'The hardest clues under maximum pressure. Earn 2× coins and score.',
  },
  math: {
    easy: 'Quick addition and subtraction, relaxed horde.',
    normal: 'Multiplication and bigger sums against the outbreak. Earn 1.25× coins and score.',
    nightmare: 'Multi-step problems under max pressure. Earn 2× coins and score.',
  },
  trivia: {
    easy: 'Everyday questions with time to think.',
    normal: 'Trickier questions and a faster approaching horde. Earn 1.25× coins and score.',
    nightmare: 'Tough questions under maximum pressure. Earn 2× coins and score.',
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
  mobileSpeechExperience = false,
  dailyChallenge,
  dailyBest,
  onDailyStart,
}: Props) {
  const activeStyle: Style = riddleMode ? puzzleStyle : mobileSpeechExperience ? 'riddles' : 'typing';
  const styles = mobileSpeechExperience ? STYLE_ORDER.filter((s) => s !== 'typing') : STYLE_ORDER;
  const selectStyle = (s: Style) => (s === 'typing' ? onRiddleMode(false) : onPuzzleStyle(s));
  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-start gap-4 overflow-y-auto px-4 pb-10 pt-14 sm:gap-5 sm:px-6 sm:pt-16 lg:justify-center lg:p-6">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-neon-green drop-shadow-[0_0_24px_rgba(57,255,20,0.6)] sm:text-6xl lg:text-7xl">
          DEAD<span className="text-neon-pink"> KEYS</span>
        </h1>
        <p className="mt-2 text-xs tracking-[0.3em] text-neon-cyan sm:text-sm sm:tracking-[0.35em]">TYPE OR BE DEVOURED</p>
      </div>

      <div className="grid w-full gap-4 lg:grid-cols-[1.2fr_0.85fr_0.8fr] lg:gap-5">
        <div className="space-y-3 sm:space-y-4">
          {/* Difficulty */}
          <div>
            <div className="mb-1.5 text-[11px] uppercase tracking-widest text-white/40">Difficulty</div>
            <div className="flex gap-2 rounded-lg border border-white/10 bg-ink-800/60 p-1">
              {DIFFS.map((d) => (
                <button
                  key={d}
                  onClick={() => onDifficulty(d)}
                  aria-pressed={difficulty === d}
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
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-ink-800/60 p-1 sm:grid-cols-2">
              {styles.map((s) => (
                <button
                  key={s}
                  onClick={() => selectStyle(s)}
                  aria-pressed={activeStyle === s}
                  className={`min-h-11 rounded-md px-3 py-2 text-sm font-bold transition-all ${
                    activeStyle === s ? 'bg-neon-green/15 text-neon-green shadow-neon' : 'text-white/55 hover:text-white/90'
                  }`}
                >
                  {STYLE_META[s].icon} {STYLE_META[s].label} Defense
                </button>
              ))}
            </div>
            <p className="mt-1.5 min-h-[2.25rem] text-xs leading-snug text-white/40">{STYLE_META[activeStyle].blurb}</p>
          </div>

          {/* Start actions stay next to play style on phones. */}
          <div className="space-y-2">
            <div className="mb-1.5 text-[11px] uppercase tracking-widest text-white/40">Start run</div>
            <button className="menu-btn text-base" onClick={() => onStart('survival')}>
              <span className="mr-3 inline-block w-6 text-center">▶</span>Zombie Survival
            </button>
            <button className="menu-btn text-base" onClick={() => onStart('bossrush')}>
              <span className="mr-3 inline-block w-6 text-center">💀</span>Boss Rush
            </button>
          </div>

          <DailyOutbreakCard challenge={dailyChallenge} best={dailyBest} onStart={onDailyStart} />

          <div className="grid grid-cols-2 gap-3" aria-label="Menu navigation">
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

        {/* Equipped survivor */}
        <button
          onClick={() => onNav('closet')}
          aria-label="Open closet to customize survivor"
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
  const bestMode = STYLE_META[(riddleStats.bestMode as Style) || 'riddles']?.label ?? '—';
  return (
    <div className="rounded-xl border border-neon-pink/25 bg-ink-800/70 p-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-neon-pink">
        {riddleMode ? 'Solver' : 'Typing'} Records
      </h3>
      <dl className="space-y-1.5 text-sm">
        <Row k="Best Score" v={selected.bestScore.toLocaleString()} />
        <Row k="Longest Survival" v={formatTime(selected.longestSurvivalMs)} />
        {riddleMode ? (
          <Row k="Best Mode" v={riddleStats.bestMode ? bestMode : '—'} />
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

function DailyOutbreakCard({
  challenge,
  best,
  onStart,
}: {
  challenge: DailyOutbreak;
  best: number;
  onStart: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-neon-amber/35 bg-gradient-to-br from-neon-amber/10 via-ink-800/80 to-neon-pink/10 p-3 shadow-[0_0_22px_rgba(255,179,0,0.12)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-neon-amber">Daily Outbreak</div>
          <h3 className="mt-1 truncate text-sm font-black text-white/90">{challenge.title}</h3>
        </div>
        <div className="shrink-0 rounded border border-white/10 bg-black/35 px-2 py-1 text-[10px] font-bold text-white/45">
          {challenge.id.slice(5)}
        </div>
      </div>
      <p className="mt-2 min-h-[2rem] text-xs leading-snug text-white/55">{challenge.briefing}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider">
        <span className="rounded border border-neon-cyan/30 bg-black/25 px-2 py-1 text-neon-cyan">{challenge.styleLabel}</span>
        <span className="rounded border border-neon-green/30 bg-black/25 px-2 py-1 text-neon-green">
          {DIFFICULTY_CONFIGS[challenge.difficulty].label}
        </span>
        <span className="rounded border border-neon-pink/30 bg-black/25 px-2 py-1 text-neon-pink">
          {challenge.mode === 'bossrush' ? 'Boss' : 'Survival'}
        </span>
        <span className="ml-auto text-white/40">Best {best.toLocaleString()}</span>
      </div>
      <button
        className="mt-3 w-full rounded-lg border border-neon-amber/70 bg-neon-amber/10 px-4 py-2 text-sm font-black text-neon-amber transition hover:bg-neon-amber/20"
        onClick={onStart}
        aria-label={`Deploy daily outbreak: ${challenge.title}`}
      >
        Deploy Daily
      </button>
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
