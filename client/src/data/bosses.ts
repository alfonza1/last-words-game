// ---------------------------------------------------------------------------
// Boss definitions. Bosses are big HP sponges with flavor — no special typing.
// You whittle them down with normal words (each shot hits the nearest target),
// and if a boss reaches the base it kills you instantly.
// ---------------------------------------------------------------------------

export interface BossDef {
  id: string;
  name: string;
  intro: string;
  /** Signature color — tints this boss's "mega meteor" in family-friendly mode. */
  color: string;
}

export const BOSSES: BossDef[] = [
  { id: 'gatebreaker', name: 'The Gatebreaker', intro: 'It hammers the gate — focus fire!', color: '#ff7a45' },
  { id: 'devourer', name: 'The Devourer', intro: 'A towering horror lumbers forward.', color: '#b16bff' },
  { id: 'screamlord', name: 'The Scream Lord', intro: 'Its shriek splits the night.', color: '#ff5ca8' },
  { id: 'rotcolossus', name: 'The Rot Colossus', intro: 'A wall of decaying flesh approaches.', color: '#5be08a' },
  { id: 'warden', name: 'The Warden', intro: 'The bunker alarms blare — boss inbound.', color: '#4db5ff' },
];

export function bossById(id: string): BossDef | undefined {
  return BOSSES.find((b) => b.id === id);
}
