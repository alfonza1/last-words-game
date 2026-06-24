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
    description: 'A howling blizzard under a shimmering aurora.',
    cost: 150,
    palette: {
      skyTop: '#03101e', skyHorizon: '#0e3450', ground1: '#22323e', ground2: '#0a141c',
      fog: '210,230,250', moon: '#eaf6ff', glow: 'rgba(150,220,255,0.4)', accent: '#8fd8ff',
    },
    features: { ...NONE, snow: true, deadTrees: true },
  },
  {
    id: 'city',
    name: 'Dead City',
    description: 'Neon-drenched ruins of a fallen metropolis.',
    cost: 350,
    palette: {
      skyTop: '#070417', skyHorizon: '#2a0f44', ground1: '#181230', ground2: '#070512',
      fog: '150,90,210', moon: '#a9e0ff', glow: 'rgba(150,120,255,0.4)', accent: '#00f0ff',
    },
    // Skyline is drawn bespoke in drawThemeScenery (richer than the generic one).
    features: { ...NONE },
  },
  {
    id: 'lab',
    name: 'Area 67',
    description: 'A classified containment site gone dark.',
    cost: 600,
    palette: {
      skyTop: '#021410', skyHorizon: '#0a2e2a', ground1: '#0c2220', ground2: '#03100e',
      fog: '70,230,200', moon: '#aeffee', glow: 'rgba(0,255,200,0.3)', accent: '#00ffc8',
    },
    features: { ...NONE, hazard: true },
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
