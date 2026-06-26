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
  'ace', 'ant', 'ash', 'bat', 'bee', 'bin', 'bud', 'cab', 'den', 'dew', 'dig',
  'dock', 'dove', 'drum', 'eel', 'elm', 'fig', 'fog', 'gem', 'gum', 'hat', 'hen',
  'hex', 'ink', 'jet', 'leaf', 'log', 'moon', 'mud', 'net', 'orb', 'path', 'paw',
  'pit', 'ram', 'rod', 'row', 'ruby', 'sand', 'ship', 'snow', 'star', 'wax', 'yam',
  'yak',
  // medium (5-7)
  'amber', 'brisk', 'cabin', 'delta', 'ember', 'frost', 'grape', 'hatch', 'ivory',
  'jewel', 'koala', 'lemon', 'maple', 'noble', 'orbit', 'pearl', 'quartz', 'raven',
  'storm', 'topaz', 'urban', 'vivid', 'whale', 'yacht', 'zebra', 'anchor', 'breeze',
  'candle', 'dragon', 'engine', 'falcon', 'garden', 'harbor', 'island', 'jungle',
  'kernel', 'lantern', 'meadow', 'nimble', 'orchid', 'pencil', 'quiver', 'ribbon',
  'silver', 'tunnel', 'velvet', 'walnut', 'yonder', 'zephyr',
  'apple', 'arrow', 'beacon', 'bucket', 'burrow', 'castle', 'cinder', 'clover',
  'cobalt', 'crimson', 'dancer', 'desert', 'donut', 'forest', 'goblin', 'hammer',
  'hazard', 'helmet', 'magnet', 'marble', 'meteor', 'nectar', 'planet', 'plasma',
  'pocket', 'prairie', 'signal', 'spider', 'timber', 'wander', 'window', 'wizard',
  'yellow', 'bronze', 'cipher', 'comet', 'dynamo', 'fabric', 'glimmer', 'hollow',
  'icicle', 'jacket', 'ladder', 'mender', 'notion', 'pollen', 'rocket', 'shelter',
  'talon', 'voyage',
  // long (8-12)
  'absolute', 'barricade', 'champion', 'daughter', 'elephant', 'firework',
  'gateway', 'horizon', 'illusion', 'jamboree', 'keyboard', 'lavender',
  'mountain', 'navigate', 'obstacle', 'parallel', 'quantity', 'resonate',
  'sapphire', 'triangle', 'umbrella', 'vortex', 'waterfall', 'xylophone',
  'adventure', 'butterfly', 'crocodile', 'dangerous', 'expedition', 'fortunate',
  'gravity', 'helicopter', 'invincible', 'juxtapose', 'knowledge', 'lighthouse',
  'magnitude', 'nightfall', 'oscillate', 'paramount', 'quarantine', 'remarkable',
  'spectacle', 'turbulence', 'understand', 'velocity', 'wilderness',
  'aftershock', 'blackbird', 'blueprint', 'cavernous', 'crossfire', 'dreamscape',
  'evergreen', 'flashlight', 'fortress', 'graveyard', 'hazardous', 'heartbeat',
  'labyrinth', 'moonlight', 'overdrive', 'reckoning', 'scavenger', 'sentinel',
  'shipwreck', 'starfield', 'submarine', 'threshold', 'turntable', 'undercity',
  'watchtower', 'backdraft', 'bloodline', 'clockwork', 'downpour', 'firebrand',
  'ghostlight', 'ironclad', 'landslide', 'locksmith', 'nightmare', 'pathfinder',
  'rainstorm', 'safeguard', 'skylight', 'stonework', 'wildfire',
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
  'stay frosty',
  'clear the room',
  'run the clock',
  'watch your six',
  'no way back',
  'make it count',
  'sound the alarm',
  'break the chain',
  'keep moving forward',
  'lights out soon',
  'trust your aim',
  'finish the wave',
];

// NOTE: A riddle/password boss mechanic was prototyped here (RIDDLES with
// plaintext answers, plus COMMANDS/PASSWORDS). It was never wired into gameplay
// and shipping answers to the client is a leak — anyone can read them in the JS
// bundle. Removed. When the mechanic is built for real, keep the answers on the
// SERVER and validate there (only the prompt is sent to the client). See the
// "Secret game content" section of docs/CDN_CACHING.md.

export type WordTier = 'easy' | 'medium' | 'hard';
