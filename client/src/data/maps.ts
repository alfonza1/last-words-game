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
    id: 'forest',
    name: 'Bleeding Forest',
    description: 'Crimson mist between endless skeletal trees.',
    cost: 900,
    palette: {
      skyTop: '#1a0707', skyHorizon: '#3a0d0d', ground1: '#240e0e', ground2: '#0c0303',
      fog: '180,60,60', moon: '#ff6f5e', glow: 'rgba(255,50,50,0.45)', accent: '#ff3860',
    },
    features: { ...NONE, tombstones: true, deadTrees: true },
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
    id: 'inferno',
    name: 'The Inferno',
    description: 'A burning hellscape of ash and ember. Free — Nightmare only.',
    cost: 0,
    nightmareOnly: true,
    palette: {
      skyTop: '#1a0500', skyHorizon: '#5a1500', ground1: '#2a0a04', ground2: '#0c0301',
      fog: '255,110,30', moon: '#ffd27a', glow: 'rgba(255,90,20,0.55)', accent: '#ff6a00',
    },
    features: { ...NONE, embers: true, skyline: true, deadTrees: true },
  },
];

export function getMap(id: string): MapTheme {
  return MAPS.find((m) => m.id === id) ?? MAPS[0];
}

export function isMapOwned(map: MapTheme, owned: string[]): boolean {
  return map.cost === 0 || owned.includes(map.id);
}
