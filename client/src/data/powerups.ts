// ---------------------------------------------------------------------------
// Consumable powerups: bought in the store, used in-game by typing their word.
// Costs must match the server's PowerupCatalog.
// ---------------------------------------------------------------------------
export interface PowerupDef {
  key: string;
  name: string;
  word: string; // type this in-game to activate
  cost: number; // coins
  icon: string;
  description: string;
}

export const POWERUP_DEFS: PowerupDef[] = [
  {
    key: 'grenade',
    name: 'Grenade',
    word: 'grenade',
    cost: 60,
    icon: '🧨',
    description: 'Type “grenade” to clear a cluster of nearby zombies.',
  },
  {
    key: 'freeze',
    name: 'Freeze',
    word: 'freeze',
    cost: 90,
    icon: '❄️',
    description: 'Type “freeze” to freeze every zombie for 3 seconds.',
  },
  {
    key: 'medkit',
    name: 'Med Kit',
    word: 'medkit',
    cost: 120,
    icon: '🩹',
    description: 'Type “medkit” to restore a chunk of health.',
  },
];
