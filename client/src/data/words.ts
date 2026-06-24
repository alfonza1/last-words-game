// ---------------------------------------------------------------------------
// Word pools. General, ever-changing vocabulary (not themed) plus the
// special content used by bosses.
// ---------------------------------------------------------------------------

/** A broad pool of common words of varied length, generated tokens draw from this. */
export const GENERAL_WORDS = [
  // short (3-4)
  'cat', 'dog', 'sun', 'map', 'key', 'box', 'cup', 'jam', 'owl', 'fox', 'ice',
  'oak', 'pen', 'rug', 'tea', 'van', 'web', 'zip', 'arc', 'bay', 'cog', 'dim',
  'echo', 'fern', 'glow', 'hawk', 'iris', 'jolt', 'kite', 'lamp', 'moss', 'nest',
  'opal', 'pine', 'quiz', 'reef', 'sage', 'tide', 'vibe', 'wolf', 'yarn', 'zero',
  // medium (5-7)
  'amber', 'brisk', 'cabin', 'delta', 'ember', 'frost', 'grape', 'hatch', 'ivory',
  'jewel', 'koala', 'lemon', 'maple', 'noble', 'orbit', 'pearl', 'quartz', 'raven',
  'storm', 'topaz', 'urban', 'vivid', 'whale', 'yacht', 'zebra', 'anchor', 'breeze',
  'candle', 'dragon', 'engine', 'falcon', 'garden', 'harbor', 'island', 'jungle',
  'kernel', 'lantern', 'meadow', 'nimble', 'orchid', 'pencil', 'quiver', 'ribbon',
  'silver', 'tunnel', 'velvet', 'walnut', 'yonder', 'zephyr',
  // long (8-12)
  'absolute', 'barricade', 'champion', 'daughter', 'elephant', 'firework',
  'gateway', 'horizon', 'illusion', 'jamboree', 'keyboard', 'lavender',
  'mountain', 'navigate', 'obstacle', 'parallel', 'quantity', 'resonate',
  'sapphire', 'triangle', 'umbrella', 'vortex', 'waterfall', 'xylophone',
  'adventure', 'butterfly', 'crocodile', 'dangerous', 'expedition', 'fortunate',
  'gravity', 'helicopter', 'invincible', 'juxtapose', 'knowledge', 'lighthouse',
  'magnitude', 'nightfall', 'oscillate', 'paramount', 'quarantine', 'remarkable',
  'spectacle', 'turbulence', 'understand', 'velocity', 'wilderness',
];

/** Neutral short phrases for the multi-word (tank) enemies. */
export const PHRASES = [
  'quick brown fox',
  'hold the line',
  'mind the gap',
  'over and out',
  'steady as she goes',
  'all systems go',
  'keep the pace',
  'eyes on the prize',
  'one more round',
  'left right left',
  'roll with it',
  'against the clock',
];

// NOTE: A riddle/password boss mechanic was prototyped here (RIDDLES with
// plaintext answers, plus COMMANDS/PASSWORDS). It was never wired into gameplay
// and shipping answers to the client is a leak — anyone can read them in the JS
// bundle. Removed. When the mechanic is built for real, keep the answers on the
// SERVER and validate there (only the prompt is sent to the client). See the
// "Secret game content" section of docs/CDN_CACHING.md.

export type WordTier = 'easy' | 'medium' | 'hard';
