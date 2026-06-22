// ---------------------------------------------------------------------------
// Procedural token generation. Produces ever-changing words whose makeup
// depends on difficulty:
//   easy      -> plain words only
//   normal    -> words and numbers
//   nightmare -> words, numbers AND symbols (case-sensitive in play)
// ---------------------------------------------------------------------------
import type { Difficulty } from '../types';
import { GENERAL_WORDS, PHRASES, type WordTier } from '../data/words';
import { pick } from '../lib/utils';

const TIER_LEN: Record<WordTier, [number, number]> = {
  easy: [3, 5],
  medium: [5, 7],
  hard: [7, 12],
};

const SYMBOLS = ['!', '@', '#', '$', '%', '&', '*', '?', '+', '-', '_', '='];
const LEET: Record<string, string> = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7' };

function randomWord(rng: () => number, tier: WordTier): string {
  const [min, max] = TIER_LEN[tier];
  const candidates = GENERAL_WORDS.filter((w) => w.length >= min && w.length <= max);
  const pool = candidates.length > 0 ? candidates : GENERAL_WORDS;
  return pick(rng, pool);
}

function digits(rng: () => number, n: number): string {
  let out = '';
  for (let i = 0; i < n; i++) out += Math.floor(rng() * 10);
  return out;
}

function leetify(rng: () => number, word: string): string {
  return word
    .split('')
    .map((c) => (LEET[c] && rng() < 0.4 ? LEET[c] : c))
    .join('');
}

function capitalize(rng: () => number, word: string): string {
  if (rng() < 0.5) return word.charAt(0).toUpperCase() + word.slice(1);
  // capitalize a random interior letter
  const i = Math.floor(rng() * word.length);
  return word.slice(0, i) + word.charAt(i).toUpperCase() + word.slice(i + 1);
}

/** Generate a single token to float above an enemy. */
export function generateToken(rng: () => number, difficulty: Difficulty, tier: WordTier): string {
  const word = randomWord(rng, tier);

  if (difficulty === 'easy') return word;

  if (difficulty === 'normal') {
    const roll = rng();
    if (roll < 0.65) return word;
    if (roll < 0.85) return rng() < 0.5 ? word + digits(rng, 1 + Math.floor(rng() * 2)) : digits(rng, 2) + word;
    return digits(rng, 2 + Math.floor(rng() * 3)); // pure number
  }

  // nightmare: words + numbers + symbols, with case that matters
  const roll = rng();
  if (roll < 0.3) return capitalize(rng, word);
  if (roll < 0.5) return leetify(rng, word) + digits(rng, 1 + Math.floor(rng() * 2));
  if (roll < 0.68) {
    const sym = pick(rng, SYMBOLS);
    return capitalize(rng, word) + sym + digits(rng, 1 + Math.floor(rng() * 2));
  }
  if (roll < 0.82) {
    const sym = pick(rng, SYMBOLS);
    const i = 1 + Math.floor(rng() * Math.max(1, word.length - 1));
    return word.slice(0, i) + sym + word.slice(i);
  }
  return digits(rng, 3) + pick(rng, SYMBOLS) + digits(rng, 2); // numeric+symbol code
}

/** Generate a short multi-word phrase for tank enemies. */
export function generatePhrase(rng: () => number, difficulty: Difficulty): string {
  const phrase = pick(rng, PHRASES);
  if (difficulty === 'nightmare' && rng() < 0.5) {
    return phrase
      .split(' ')
      .map((w) => (rng() < 0.4 ? capitalize(rng, w) : w))
      .join(' ');
  }
  return phrase;
}
