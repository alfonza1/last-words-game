// ---------------------------------------------------------------------------
// Trivia pools for Trivia Defense. Shows only the question; the player types the
// answer to fire a volley. Tiered like riddles via the wave/tier curve, so harder
// difficulties reach the hard tier far sooner. Answers ship client-side (same
// trust model as riddles — see data/riddles.ts).
// ---------------------------------------------------------------------------
import type { WordTier } from './words';
import type { Riddle as Trivia } from './riddles'; // same { prompt, answer, accept? } shape

export const TRIVIA: Record<WordTier, Trivia[]> = {
  easy: [
    { prompt: 'What planet do we live on?', answer: 'earth' },
    { prompt: 'How many days are in a week?', answer: '7', accept: ['seven'] },
    { prompt: 'What color is the sky on a clear day?', answer: 'blue' },
    { prompt: 'What animal says "moo"?', answer: 'cow' },
    { prompt: 'What is frozen water called?', answer: 'ice' },
    { prompt: 'What is the opposite of hot?', answer: 'cold' },
    { prompt: 'How many legs does a spider have?', answer: '8', accept: ['eight'] },
    { prompt: 'What do bees make?', answer: 'honey' },
    { prompt: 'What star is at the center of our solar system?', answer: 'sun' },
    { prompt: 'What gas do humans need to breathe to live?', answer: 'oxygen' },
  ],
  medium: [
    { prompt: 'What is the largest planet in our solar system?', answer: 'jupiter' },
    { prompt: 'How many continents are there?', answer: '7', accept: ['seven'] },
    { prompt: 'What is the tallest land animal?', answer: 'giraffe' },
    { prompt: 'Which ocean is the largest?', answer: 'pacific' },
    { prompt: 'How many sides does a hexagon have?', answer: '6', accept: ['six'] },
    { prompt: 'What metal is liquid at room temperature?', answer: 'mercury' },
    { prompt: 'What is the hardest natural substance?', answer: 'diamond' },
    { prompt: 'What planet is known as the Red Planet?', answer: 'mars' },
    { prompt: 'What is the chemical symbol for gold?', answer: 'au', accept: ['gold'] },
    { prompt: 'What is the freezing point of water in Celsius?', answer: '0', accept: ['zero'] },
  ],
  hard: [
    { prompt: 'What is the smallest prime number?', answer: '2', accept: ['two'] },
    { prompt: 'What is the powerhouse of the cell?', answer: 'mitochondria' },
    { prompt: 'In what year did World War II end?', answer: '1945' },
    { prompt: 'What is the chemical symbol for sodium?', answer: 'na', accept: ['sodium'] },
    { prompt: 'What is the square root of 144?', answer: '12', accept: ['twelve'] },
    { prompt: 'What is the largest desert in the world?', answer: 'antarctica' },
    { prompt: 'Who painted the Mona Lisa?', answer: 'davinci', accept: ['leonardo', 'leonardodavinci'] },
    { prompt: 'What is the capital of Australia?', answer: 'canberra' },
    { prompt: 'How many bones are in the adult human body?', answer: '206' },
    { prompt: 'Which planet has the most moons?', answer: 'saturn' },
  ],
};
