// ---------------------------------------------------------------------------
// Riddle pools for Riddle Mode. Each riddle shows only its `prompt`; the player
// types the `answer` to fire. Tiered by solve difficulty and reused via the same
// wave/tier curve as words (so Nightmare reaches the hard tier far sooner than
// Easy — see wordTierForWave + each difficulty's wordLengthBias).
//
// NOTE: answers ship in the client (chosen for responsive, no-round-trip play).
// The server still clamps run scores, so the worst a peeker gains is easier kills
// — same trust model as the on-screen words. Move server-side if integrity ever
// matters competitively (see docs/CDN_CACHING.md → "Secret game content").
// ---------------------------------------------------------------------------
import type { WordTier } from './words';

export interface Riddle {
  prompt: string;
  /** Canonical answer the player types. */
  answer: string;
  /** Extra accepted spellings/synonyms (lowercase). Matching ignores case/spaces. */
  accept?: string[];
}

export const RIDDLES: Record<WordTier, Riddle[]> = {
  easy: [
    { prompt: 'What has to be broken before you can use it?', answer: 'egg' },
    { prompt: "I'm full of holes but still hold water. What am I?", answer: 'sponge' },
    { prompt: 'What has hands but cannot clap?', answer: 'clock' },
    { prompt: 'What gets wetter the more it dries?', answer: 'towel' },
    { prompt: 'What has keys but opens no locks?', answer: 'keyboard', accept: ['piano'] },
    { prompt: 'What goes up but never comes down?', answer: 'age' },
    { prompt: 'What has one eye but cannot see?', answer: 'needle' },
    { prompt: 'What has a neck but no head?', answer: 'bottle' },
    { prompt: 'What can you catch but not throw?', answer: 'cold' },
    { prompt: 'What has teeth but cannot bite?', answer: 'comb' },
    { prompt: 'What kind of band never plays music?', answer: 'rubberband', accept: ['rubber band'] },
  ],
  medium: [
    { prompt: 'I speak without a mouth and hear without ears. What am I?', answer: 'echo' },
    { prompt: 'The more of me you take, the more you leave behind.', answer: 'footsteps', accept: ['footprints'] },
    { prompt: "I'm tall when young and short when old. What am I?", answer: 'candle' },
    { prompt: 'What has many keys but opens no doors?', answer: 'piano' },
    { prompt: 'What can travel the world while staying in one corner?', answer: 'stamp' },
    { prompt: 'What has a thumb and four fingers but is not alive?', answer: 'glove' },
    { prompt: 'What has cities but no houses, and forests but no trees?', answer: 'map' },
    { prompt: 'What building has the most stories?', answer: 'library' },
    { prompt: 'What has a bed but never sleeps, and runs but never walks?', answer: 'river' },
    { prompt: 'What has a ring but no finger?', answer: 'phone', accept: ['telephone'] },
  ],
  hard: [
    { prompt: 'Made and sold to be used, but the buyer never uses it. What is it?', answer: 'coffin', accept: ['casket'] },
    { prompt: 'What can fill a room yet takes up no space?', answer: 'light' },
    { prompt: 'What disappears the moment you say its name?', answer: 'silence' },
    { prompt: 'The more you remove from me, the bigger I become. What am I?', answer: 'hole' },
    { prompt: 'What has a head and a tail but no body?', answer: 'coin' },
    { prompt: 'I have branches, but no fruit, trunk, or leaves. What am I?', answer: 'bank' },
    { prompt: 'What comes down but never goes up?', answer: 'rain' },
    { prompt: 'What can be cracked, made, told, and played?', answer: 'joke' },
    { prompt: 'The more there is, the less you see. What is it?', answer: 'darkness', accept: ['fog'] },
    { prompt: 'What gets sharper the more you use it?', answer: 'brain', accept: ['mind'] },
  ],
};
