// ---------------------------------------------------------------------------
// Map themes. Each changes the environment palette + which scenery features the
// renderer draws. Maps are bought with coins (the graveyard is free).
// ---------------------------------------------------------------------------
export interface MapPalette {
  skyTop: string;
  skyHorizon: string;
  ground1: string;
  ground2: string;
  fog: string; // rgb triplet "r,g,b"
  moon: string;
  glow: string; // rgba for moon glow
  accent: string;
}

export interface MapFeatures {
  tombstones: boolean;
  deadTrees: boolean;
  skyline: boolean;
  neon: boolean; // lit windows on the skyline
  snow: boolean;
  hazard: boolean; // rotating warning light
  embers: boolean; // rising fire embers
  arena: boolean; // colosseum walls + torches
}

export interface MapTheme {
  id: string;
  name: string;
  description: string;
  cost: number; // coins to buy (0 = free)
  familyFriendly?: boolean;
  nightmareOnly?: boolean; // only selectable on Nightmare difficulty
  bossRushOnly?: boolean; // only selectable in Boss Rush mode
  palette: MapPalette;
  features: MapFeatures;
}

const NONE: MapFeatures = {
  tombstones: false, deadTrees: false, skyline: false, neon: false,
  snow: false, hazard: false, embers: false, arena: false,
};

export const MAPS: MapTheme[] = [
  {
    id: 'graveyard',
    name: 'Forsaken',
    description: 'A bare, fog-drenched wasteland under a blood moon. Where it all begins.',
    cost: 0,
    palette: {
      skyTop: '#0a0f1a', skyHorizon: '#1a2b1e', ground1: '#13201a', ground2: '#070d0a',
      fog: '120,150,130', moon: '#e8a07a', glow: 'rgba(255,120,90,0.35)', accent: '#39ff14',
    },
    // Basic starter map — no graves/crosses, just fog + moon.
    features: { ...NONE, deadTrees: true },
  },
  {
    id: 'tundra',
    name: 'Frozen Outpost',
    description: 'A polar listening station swallowed by ice, silence, and the northern lights.',
    cost: 150,
    palette: {
      skyTop: '#020814', skyHorizon: '#12344b', ground1: '#1b303e', ground2: '#050c12',
      fog: '180,225,245', moon: '#edf8ff', glow: 'rgba(120,210,255,0.38)', accent: '#84f7e5',
    },
    features: { ...NONE, snow: true },
  },
  {
    id: 'city',
    name: 'Dead City',
    description: 'Fight down the last evacuation route beneath a poisoned electric storm.',
    cost: 350,
    palette: {
      skyTop: '#03070d', skyHorizon: '#18333a', ground1: '#151b20', ground2: '#05080b',
      fog: '70,190,190', moon: '#b9e7df', glow: 'rgba(70,220,205,0.32)', accent: '#20f2c2',
    },
    // The ruined evacuation corridor is drawn bespoke in drawThemeScenery.
    features: { ...NONE },
  },
  {
    id: 'forest',
    name: 'Bleeding Forest',
    description: 'Enter the heartwood cathedral, where ancient roots drink from a river that never runs dry.',
    cost: 900,
    palette: {
      skyTop: '#050204', skyHorizon: '#3b0711', ground1: '#21080d', ground2: '#080204',
      fog: '170,22,52', moon: '#f3d1c4', glow: 'rgba(255,28,62,0.46)', accent: '#ff244f',
    },
    // Entirely bespoke: heartwood cathedral, blood river, ward arches, and root shrine.
    features: { ...NONE },
  },
  {
    id: 'lab',
    name: 'Area 67',
    description: 'A desert black site where the runway ends at something buried too deep.',
    cost: 600,
    palette: {
      skyTop: '#030711', skyHorizon: '#1d2330', ground1: '#29271f', ground2: '#090a0b',
      fog: '128,160,140', moon: '#d9dfc7', glow: 'rgba(170,205,170,0.28)', accent: '#9dff4f',
    },
    features: { ...NONE },
  },
  {
    id: 'arena',
    name: 'The Blood Arena',
    description: 'A torchlit colosseum pit. Free — Boss Rush only.',
    cost: 0,
    bossRushOnly: true,
    palette: {
      skyTop: '#140a06', skyHorizon: '#3a1c0a', ground1: '#3a2a1a', ground2: '#140d08',
      fog: '220,150,80', moon: '#ffcf8f', glow: 'rgba(255,170,70,0.45)', accent: '#ff9d2b',
    },
    features: { ...NONE, arena: true },
  },
  {
    id: 'planet-aurora',
    name: 'Aurora Prime',
    description: 'Your blue-green home world — colony domes and breathing auroras meet the first meteor storm.',
    cost: 0,
    familyFriendly: true,
    palette: {
      skyTop: '#041225', skyHorizon: '#123c46', ground1: '#12372f', ground2: '#06110f',
      fog: '76,230,210', moon: '#dffcff', glow: 'rgba(92,245,220,0.38)', accent: '#4df4d0',
    },
    features: { ...NONE },
  },
  {
    id: 'planet-crystal',
    name: 'Crystal Vale',
    description: 'A violet world of towering prisms where meteor light shatters into drifting rainbow shards.',
    cost: 250,
    familyFriendly: true,
    palette: {
      skyTop: '#09051f', skyHorizon: '#2c195c', ground1: '#1c2357', ground2: '#070713',
      fog: '156,130,255', moon: '#f1e8ff', glow: 'rgba(170,120,255,0.44)', accent: '#9cf6ff',
    },
    features: { ...NONE },
  },
  {
    id: 'planet-volcanic',
    name: 'Ember Moon',
    description: 'A molten moon where glowing containment pylons hold the lava seas back beneath a cracked giant.',
    cost: 650,
    familyFriendly: true,
    palette: {
      skyTop: '#13050b', skyHorizon: '#3a142a', ground1: '#342019', ground2: '#0b0504',
      fog: '255,116,68', moon: '#ffe0a8', glow: 'rgba(255,128,66,0.4)', accent: '#ffcf5a',
    },
    features: { ...NONE, embers: true },
  },
  {
    id: 'planet-nebula',
    name: 'Nebula Reef',
    description: 'A bioluminescent coral world under a ringed giant, built for late-game meteor madness.',
    cost: 1000,
    familyFriendly: true,
    palette: {
      skyTop: '#020718', skyHorizon: '#171a52', ground1: '#132044', ground2: '#03060f',
      fog: '89,190,255', moon: '#c7f5ff', glow: 'rgba(80,180,255,0.42)', accent: '#ff7ad9',
    },
    features: { ...NONE },
  },
  {
    id: 'inferno',
    name: 'The Inferno',
    description: 'Descend beneath the black sun, where the Ash Cathedral is still awake.',
    cost: 0,
    nightmareOnly: true,
    palette: {
      skyTop: '#090101', skyHorizon: '#3b0704', ground1: '#1b0705', ground2: '#050101',
      fog: '210,48,22', moon: '#ffb347', glow: 'rgba(255,55,15,0.48)', accent: '#ff3b12',
    },
    features: { ...NONE, embers: true },
  },
];

export function getMap(id: string): MapTheme {
  return MAPS.find((m) => m.id === id) ?? MAPS[0];
}

export function isMapOwned(map: MapTheme, owned: string[]): boolean {
  return map.cost === 0 || owned.includes(map.id);
}
