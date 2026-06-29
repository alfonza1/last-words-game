import { useState } from 'react';
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
  mobileSpeechExperience?: boolean;
}

type Style = 'typing' | PuzzleStyle;
const STYLE_ORDER: Style[] = ['typing', 'math', 'trivia', 'riddles'];

const STYLE_META: Record<Style, { label: string; short: string; blurb: string; tagWord: string }> = {
  typing: {
    label: 'Typing',
    short: 'TYPE',
    blurb: 'Each completed word fires one shot. High WPM earns extra points and coins.',
    tagWord: 'WORD',
  },
  riddles: {
    label: 'Riddle',
    short: 'CLUE',
    blurb: 'Solve short riddles to fire a multi-kill volley.',
    tagWord: 'RIDDLE',
  },
  math: {
    label: 'Math',
    short: 'MATH',
    blurb: 'Solve math problems to fire a multi-kill volley.',
    tagWord: 'PROBLEM',
  },
  trivia: {
    label: 'Trivia',
    short: 'QUIZ',
    blurb: 'Answer trivia questions to fire a multi-kill volley.',
    tagWord: 'QUESTION',
  },
};

const DIFFS: Difficulty[] = ['easy', 'normal', 'nightmare'];
const DIFF_BLURB: Record<Style, Record<Difficulty, string>> = {
  typing: {
    easy: 'Short words with a relaxed horde.',
    normal: 'Words and numbers against the full outbreak. Earn 1.25x coins and score.',
    nightmare: 'Exact-case words, numbers, and symbols. Earn 2x coins and score.',
  },
  riddles: {
    easy: 'Straightforward clues with extra time to solve.',
    normal: 'Sharper clues and a faster approaching horde. Earn 1.25x coins and score.',
    nightmare: 'The hardest clues under maximum pressure. Earn 2x coins and score.',
  },
  math: {
    easy: 'Quick addition and subtraction, relaxed horde.',
    normal: 'Multiplication and bigger sums against the outbreak. Earn 1.25x coins and score.',
    nightmare: 'Multi-step problems under max pressure. Earn 2x coins and score.',
  },
  trivia: {
    easy: 'Everyday questions with time to think.',
    normal: 'Trickier questions and a faster approaching horde. Earn 1.25x coins and score.',
    nightmare: 'Tough questions under maximum pressure. Earn 2x coins and score.',
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
}: Props) {
  const activeStyle: Style = riddleMode ? puzzleStyle : mobileSpeechExperience ? 'riddles' : 'typing';
  const styles = mobileSpeechExperience ? STYLE_ORDER.filter((s) => s !== 'typing') : STYLE_ORDER;
  const selectStyle = (s: Style) => (s === 'typing' ? onRiddleMode(false) : onPuzzleStyle(s));
  const [mobileRecordsOpen, setMobileRecordsOpen] = useState(false);
  const recordsTitle = activeStyle !== 'typing' ? 'Solver Records' : 'Typing Records';

  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-start gap-2 overflow-y-auto px-3 pb-16 pt-2 sm:gap-5 sm:px-6 sm:pb-10 sm:pt-6 lg:justify-center lg:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight text-neon-green drop-shadow-[0_0_24px_rgba(57,255,20,0.6)] sm:text-6xl lg:text-7xl">
          DEAD<span className="text-neon-pink"> KEYS</span>
        </h1>
        <p className="mt-1 hidden text-[10px] tracking-[0.22em] text-neon-cyan sm:mt-2 sm:block sm:text-sm sm:tracking-[0.35em]">
          TYPE OR BE DEVOURED
        </p>
      </div>

      <div className="grid w-full gap-2 sm:gap-4 lg:grid-cols-[1.2fr_0.85fr_0.8fr] lg:gap-5">
        <div className="order-2 space-y-2 sm:space-y-4 lg:order-none">
          <div>
            <SectionLabel>Difficulty</SectionLabel>
            <div className="flex gap-2 rounded-lg border border-white/10 bg-ink-800/60 p-1">
              {DIFFS.map((d) => (
                <button
                  key={d}
                  onClick={() => onDifficulty(d)}
                  aria-pressed={difficulty === d}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-bold transition-all sm:px-3 sm:py-2 sm:text-sm ${
                    difficulty === d ? 'bg-neon-green/15 text-neon-green shadow-neon' : 'text-white/55 hover:text-white/90'
                  }`}
                >
                  {DIFFICULTY_CONFIGS[d].label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 hidden min-h-[2.25rem] text-xs leading-snug text-white/40 sm:block">
              {DIFF_BLURB[activeStyle][difficulty]}
            </p>
          </div>

          <div>
            <SectionLabel>Play style</SectionLabel>
            <div
              className={`grid gap-1.5 rounded-lg border border-white/10 bg-ink-800/60 p-1 sm:grid-cols-2 sm:gap-2 ${
                mobileSpeechExperience ? 'grid-cols-3' : 'grid-cols-2'
              }`}
            >
              {styles.map((s) => (
                <button
                  key={s}
                  onClick={() => selectStyle(s)}
                  aria-pressed={activeStyle === s}
                  className={`min-h-10 rounded-md px-1.5 py-1.5 text-center text-[11px] font-bold transition-all sm:min-h-11 sm:px-3 sm:py-2 sm:text-left sm:text-sm ${
                    activeStyle === s ? 'bg-neon-green/15 text-neon-green shadow-neon' : 'text-white/55 hover:text-white/90'
                  }`}
                >
                  <span className="hidden text-[8px] font-black uppercase tracking-widest text-white/35 sm:block">{STYLE_META[s].short}</span>
                  <span>{STYLE_META[s].label} Defense</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 hidden min-h-[2.25rem] text-xs leading-snug text-white/40 sm:block">{STYLE_META[activeStyle].blurb}</p>
          </div>

          <div>
            <SectionLabel>Deploy</SectionLabel>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
              <DeployButton tone="green" title="Start Survival" detail="Endless waves" onClick={() => onStart('survival')} />
              <DeployButton tone="pink" title="Start Boss Rush" detail="Boss gauntlet" onClick={() => onStart('bossrush')} />
            </div>
          </div>

          <button
            onClick={() => setMobileRecordsOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-neon-green/35 bg-ink-700/70 px-3 py-2 text-left text-xs font-black uppercase tracking-wider text-neon-green transition hover:border-neon-green hover:bg-ink-600 sm:hidden"
          >
            <span>{recordsTitle}</span>
            <span className="text-white/45">View</span>
          </button>

          <div className="grid grid-cols-2 gap-2 sm:gap-3" aria-label="Menu navigation">
            <button className="rounded-lg border border-neon-green/35 bg-ink-700/70 px-3 py-2 text-left text-xs font-semibold tracking-wide text-neon-green transition hover:border-neon-green hover:bg-ink-600 focus:outline-none focus:ring-2 focus:ring-neon-green/60 sm:px-6 sm:py-3 sm:text-base" onClick={() => onNav('upgrades')}>
              Store
            </button>
            <button className="rounded-lg border border-neon-green/35 bg-ink-700/70 px-3 py-2 text-left text-xs font-semibold tracking-wide text-neon-green transition hover:border-neon-green hover:bg-ink-600 focus:outline-none focus:ring-2 focus:ring-neon-green/60 sm:px-6 sm:py-3 sm:text-base" onClick={() => onNav('leaderboard')}>
              Leaderboard
            </button>
            <button className="rounded-lg border border-neon-green/35 bg-ink-700/70 px-3 py-2 text-left text-xs font-semibold tracking-wide text-neon-green transition hover:border-neon-green hover:bg-ink-600 focus:outline-none focus:ring-2 focus:ring-neon-green/60 sm:px-6 sm:py-3 sm:text-base" onClick={() => onNav('howto')}>
              How to Play
            </button>
            <button className="rounded-lg border border-neon-green/35 bg-ink-700/70 px-3 py-2 text-left text-xs font-semibold tracking-wide text-neon-green transition hover:border-neon-green hover:bg-ink-600 focus:outline-none focus:ring-2 focus:ring-neon-green/60 sm:px-6 sm:py-3 sm:text-base" onClick={() => onNav('settings')}>
              Settings
            </button>
          </div>
        </div>

        <button
          onClick={() => onNav('closet')}
          aria-label="Open closet to customize survivor"
          className="group relative order-1 min-h-[218px] overflow-hidden rounded-xl border border-neon-green/25 bg-ink-800/75 text-left transition hover:border-neon-green/70 hover:shadow-neon sm:min-h-[320px] sm:rounded-2xl lg:order-none lg:min-h-[360px]"
        >
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-neon-green/10 to-transparent" />
          <div className="absolute left-3 right-44 top-3 z-10 sm:right-3">
            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-neon-cyan/70">Survivor</div>
            <div className="max-w-[min(100%,14rem)] truncate text-xl font-black tracking-wide text-neon-green drop-shadow-[0_0_12px_rgba(57,255,20,0.55)] sm:max-w-[220px]">
              {username}
            </div>
          </div>
          <CharacterAvatar
            character={character}
            armed={false}
            className="absolute bottom-[-22px] right-0 h-[252px] w-[199px] transition group-hover:scale-[1.025] sm:inset-x-0 sm:bottom-9 sm:mx-auto sm:h-[270px] sm:w-[214px] lg:h-[310px] lg:w-[245px]"
          />
          <div className="absolute bottom-3 left-3 right-44 flex justify-start border-t border-white/10 pt-2 text-[10px] uppercase tracking-widest sm:inset-x-4 sm:justify-end">
            <span className="font-bold text-neon-green">Customize</span>
          </div>
        </button>

        <div className="order-3 hidden sm:block lg:order-none">
          <Records stats={stats} riddleStats={riddleStats} riddleMode={activeStyle !== 'typing'} />
        </div>
      </div>

      <p className="hidden text-xs tracking-[0.25em] text-white/25 sm:block">SURVIVE THE NIGHT | OUTLAST THE DEAD</p>
      <div className="hidden w-full sm:block">
        <AdBanner />
      </div>

      {mobileRecordsOpen && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/70 p-3 sm:hidden" onClick={() => setMobileRecordsOpen(false)}>
          <div
            className="w-full rounded-2xl border border-neon-pink/35 bg-ink-900 p-3 shadow-[0_0_28px_rgba(255,43,214,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-neon-pink">{recordsTitle}</div>
              <button
                onClick={() => setMobileRecordsOpen(false)}
                className="rounded-md border border-white/15 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/60"
              >
                Close
              </button>
            </div>
            <Records stats={stats} riddleStats={riddleStats} riddleMode={activeStyle !== 'typing'} compact />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <div className="mb-1 text-[10px] uppercase tracking-widest text-white/40 sm:mb-1.5 sm:text-[11px]">{children}</div>;
}

function DeployButton({ title, detail, tone, onClick }: { title: string; detail: string; tone: 'green' | 'pink'; onClick: () => void }) {
  const toneClass =
    tone === 'green'
      ? 'border-neon-green/50 bg-neon-green/10 hover:border-neon-green hover:bg-neon-green/15 hover:shadow-neon focus:ring-neon-green/60'
      : 'border-neon-pink/50 bg-neon-pink/10 hover:border-neon-pink hover:bg-neon-pink/15 hover:shadow-[0_0_14px_rgba(255,43,214,0.45)] focus:ring-neon-pink/60';
  const titleClass = tone === 'green' ? 'text-neon-green' : 'text-neon-pink';

  return (
    <button
      className={`rounded-lg border px-3 py-2 text-left transition focus:outline-none focus:ring-2 sm:px-6 sm:py-3 ${toneClass}`}
      onClick={onClick}
    >
      <span className={`block text-sm font-black uppercase tracking-wide sm:text-base ${titleClass}`}>{title}</span>
      <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-widest text-white/40 sm:text-xs">{detail}</span>
    </button>
  );
}

function Records({
  stats,
  riddleStats,
  riddleMode,
  compact = false,
}: {
  stats: GameStats;
  riddleStats: GameStats;
  riddleMode: boolean;
  compact?: boolean;
}) {
  const selected = riddleMode ? riddleStats : stats;
  const bestMode = STYLE_META[(riddleStats.bestMode as Style) || 'riddles']?.label ?? '-';
  return (
    <div className={`rounded-xl border border-neon-pink/25 bg-ink-800/70 ${compact ? 'p-3' : 'p-4'}`}>
      <h3 className={`${compact ? 'mb-2 text-xs' : 'mb-3 text-sm'} font-bold uppercase tracking-widest text-neon-pink`}>
        {riddleMode ? 'Solver' : 'Typing'} Records
      </h3>
      <dl className={`${compact ? 'space-y-1 text-xs' : 'space-y-1.5 text-sm'}`}>
        <Row k="Best Score" v={selected.bestScore.toLocaleString()} />
        <Row k="Longest Survival" v={formatTime(selected.longestSurvivalMs)} />
        {riddleMode ? <Row k="Best Mode" v={riddleStats.bestMode ? bestMode : '-'} /> : <Row k="Highest WPM" v={selected.highestWpm} />}
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
