import type { Difficulty, GameMode, PuzzleStyle } from '../types';
import { hashSeed, mulberry32, pick, todayKey } from '../lib/utils';

export interface DailyOutbreak {
  id: string;
  title: string;
  briefing: string;
  style: PuzzleStyle;
  styleLabel: string;
  difficulty: Difficulty;
  mode: GameMode;
  mapId: string;
  seed: number;
}

const STYLE_LABEL: Record<PuzzleStyle, string> = {
  riddles: 'Riddle',
  math: 'Math',
  trivia: 'Trivia',
};

const TITLES = [
  'Dead Air Protocol',
  'Midnight Breach',
  'Blackout Run',
  'Red Moon Sweep',
  'Last Signal',
  'Bunker Echo',
  'Grave Code',
  'Static Harvest',
] as const;

const BRIEFINGS = [
  'One clean run. One seeded outbreak. No excuses.',
  'The horde pattern is locked for today.',
  'Command found a repeatable breach. Clear it before midnight.',
  'Same outbreak for everyone. Best score survives the record.',
  'A fresh signal just opened. Deploy before it goes dark.',
] as const;

const STYLES: PuzzleStyle[] = ['riddles', 'math', 'trivia'];
const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'nightmare'];

export function getDailyOutbreak(date = new Date()): DailyOutbreak {
  const id = todayKey(date);
  const seed = hashSeed(`daily-outbreak:${id}`);
  const rng = mulberry32(seed);
  const bossRushDay = date.getDate() % 7 === 0;
  const mode: GameMode = bossRushDay ? 'bossrush' : 'survival';
  const difficulty = bossRushDay ? 'normal' : pick(rng, DIFFICULTIES);
  const style = pick(rng, STYLES);
  const mapId = mode === 'bossrush' ? 'arena' : difficulty === 'nightmare' ? 'inferno' : 'graveyard';
  const title = `${pick(rng, TITLES)}: ${STYLE_LABEL[style]}`;

  return {
    id,
    title,
    briefing: pick(rng, BRIEFINGS),
    style,
    styleLabel: STYLE_LABEL[style],
    difficulty,
    mode,
    mapId,
    seed,
  };
}

