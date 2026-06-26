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
    { prompt: 'What has words but never speaks?', answer: 'book' },
    { prompt: 'What is always in front of you but cannot be seen?', answer: 'future' },
    { prompt: 'What has bark but no bite?', answer: 'tree' },
    { prompt: 'What is black and white and read all over?', answer: 'newspaper' },
    { prompt: 'What has a head, a foot, and four legs?', answer: 'bed' },
    { prompt: 'What has many teeth but cannot chew?', answer: 'saw' },
    { prompt: 'What flies without wings?', answer: 'time' },
    { prompt: 'What starts with T, ends with T, and has T inside?', answer: 'teapot' },
    { prompt: 'What belongs to you, but other people use it more?', answer: 'name' },
    { prompt: 'What can you hold without touching it?', answer: 'breath' },
    { prompt: 'What follows you all day but disappears in the dark?', answer: 'shadow' },
    { prompt: 'What gets bigger the more you feed it?', answer: 'fire' },
    { prompt: 'What can you break without touching it?', answer: 'promise' },
    { prompt: 'What shows your face but is not alive?', answer: 'mirror' },
    { prompt: 'What goes up and down but never moves?', answer: 'stairs' },
    { prompt: 'What is kept by saying nothing?', answer: 'secret' },
    { prompt: 'What has lead but is not a leader?', answer: 'pencil' },
    { prompt: 'What floats in the sky and carries rain?', answer: 'cloud' },
    { prompt: 'What has a tongue but cannot taste?', answer: 'shoe' },
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
    { prompt: 'What word becomes shorter when you add two letters?', answer: 'short' },
    { prompt: 'Forward I am heavy, backward I am not. What am I?', answer: 'ton' },
    { prompt: 'What has thirteen hearts but no organs?', answer: 'deckofcards', accept: ['deck of cards', 'cards'] },
    { prompt: 'What tastes better than it smells?', answer: 'tongue' },
    { prompt: 'What has roots that nobody sees and is taller than trees?', answer: 'mountain' },
    { prompt: 'What can you keep after giving it to someone?', answer: 'word' },
    { prompt: 'What invention lets you look through walls?', answer: 'window' },
    { prompt: 'What has four eyes but cannot see?', answer: 'mississippi' },
    { prompt: 'What has no life but can still die?', answer: 'battery' },
    { prompt: 'What comes once in a minute, twice in a moment, and never in a thousand years?', answer: 'm' },
    { prompt: 'What is bought by the yard and worn by the foot?', answer: 'carpet' },
    { prompt: 'What kind of coat is always wet when you put it on?', answer: 'paint' },
    { prompt: 'What has a thousand needles but cannot sew?', answer: 'porcupine' },
    { prompt: 'What has a bottom at the top?', answer: 'leg' },
    { prompt: 'What runs around a yard but never moves?', answer: 'fence' },
    { prompt: 'What is orange and sounds like a parrot?', answer: 'carrot' },
    { prompt: 'What gets broken if you name it?', answer: 'silence' },
    { prompt: 'What kind of room has no doors or windows?', answer: 'mushroom' },
    { prompt: 'What has one wheel and flies?', answer: 'wheelbarrow' },
    { prompt: 'What has a horn but does not honk?', answer: 'rhinoceros', accept: ['rhino'] },
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
    { prompt: 'What English word has three consecutive double letters?', answer: 'bookkeeper' },
    { prompt: 'What word sounds the same after removing four of its five letters?', answer: 'queue' },
    { prompt: 'What is at the end of everything?', answer: 'g' },
    { prompt: 'What is always coming but never arrives?', answer: 'tomorrow' },
    { prompt: 'What do you throw out when you need it and pull in when done?', answer: 'anchor' },
    { prompt: 'What starts and ends with E but contains one letter?', answer: 'envelope' },
    { prompt: 'What has many rings but no fingers?', answer: 'tree' },
    { prompt: 'What is cut on a table but never eaten?', answer: 'deckofcards', accept: ['deck of cards', 'cards'] },
    { prompt: 'What word is right when pronounced wrong?', answer: 'wrong' },
    { prompt: 'What is the beginning of the end and the end of time?', answer: 'e' },
    { prompt: 'What has no voice but can answer you?', answer: 'echo' },
    { prompt: 'What travels faster when you chase it?', answer: 'fear' },
    { prompt: 'What can be stolen, mistaken, or changed, but never touched?', answer: 'identity' },
    { prompt: 'What has a lock but no door?', answer: 'hair' },
    { prompt: 'What has a face, two hands, and no arms?', answer: 'clock' },
    { prompt: 'What has a bridge but no water beneath it?', answer: 'nose' },
    { prompt: 'What can be swallowed but can also swallow you?', answer: 'pride' },
    { prompt: 'What can be opened, closed, and read, but has no pages?', answer: 'mind' },
    { prompt: 'What is lighter than air but impossible to hold forever?', answer: 'breath' },
    { prompt: 'What disappears when you stand up?', answer: 'lap' },
  ],
};
