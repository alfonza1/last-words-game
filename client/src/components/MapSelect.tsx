import { useState } from 'react';
import type { Difficulty, GameMode } from '../types';
import { MAPS, isMapOwned, type MapTheme } from '../data/maps';

interface Props {
  mode: GameMode;
  difficulty: Difficulty;
  selectedMapId: string;
  ownedMaps: string[];
  onSelect: (id: string) => void;
  onBuyMap: (id: string) => void;
  onDeploy: () => void;
  onBack: () => void;
}

const MODE_LABEL: Record<GameMode, string> = {
  survival: 'Survival',
  bossrush: 'Boss Rush',
};

export function MapSelect({
  mode,
  difficulty,
  selectedMapId,
  ownedMaps,
  onSelect,
  onBuyMap,
  onDeploy,
  onBack,
}: Props) {
  const [pendingMap, setPendingMap] = useState<MapTheme | null>(null);
  // Mode/difficulty-exclusive maps only appear where they're playable.
  const playable = MAPS.filter(
    (m) => (!m.nightmareOnly || difficulty === 'nightmare') && (!m.bossRushOnly || mode === 'bossrush'),
  );
  // Surface the exclusive map(s) right after the starter, so it shows up 2nd.
  const exclusive = playable.filter((m) => m.nightmareOnly || m.bossRushOnly);
  const normal = playable.filter((m) => !m.nightmareOnly && !m.bossRushOnly);
  const maps = normal.length ? [normal[0], ...exclusive, ...normal.slice(1)] : exclusive;

  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-5xl flex-col gap-5 overflow-y-auto p-6">
      <button
        onClick={onBack}
        className="absolute left-4 top-4 z-10 rounded-md border border-white/15 bg-black/50 px-3 py-1.5 text-sm text-white/70 hover:border-neon-green hover:text-neon-green"
      >
        ← Back
      </button>

      <div className="text-center">
        <h1 className="text-3xl font-black tracking-wide text-neon-green sm:text-4xl">SELECT MAP</h1>
        <p className="mt-1 text-sm tracking-widest text-neon-cyan">{MODE_LABEL[mode]}</p>
      </div>

      <div className="grid flex-1 content-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {maps.map((m) => {
          const owned = isMapOwned(m, ownedMaps);
          const selected = selectedMapId === m.id;
          const p = m.palette;
          return (
            <div
              key={m.id}
              className={`group relative flex h-full flex-col overflow-hidden rounded-xl border text-left transition-all ${
                selected ? 'border-neon-green shadow-neon' : 'border-white/10'
              }`}
            >
              {/* Theme preview swatch */}
              <div
                className="h-20 w-full flex-none"
                style={{ background: `linear-gradient(160deg, ${p.skyTop}, ${p.skyHorizon} 55%, ${p.ground2})` }}
              >
                <div className="flex h-full items-end justify-between p-2">
                  <span className="h-4 w-4 rounded-full" style={{ background: p.moon, boxShadow: `0 0 12px ${p.moon}` }} />
                  <span className="h-2 w-12 rounded-full" style={{ background: p.accent }} />
                </div>
                {m.nightmareOnly && (
                  <span className="absolute right-2 top-2 rounded bg-neon-red/80 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                    Nightmare Exclusive
                  </span>
                )}
                {m.bossRushOnly && (
                  <span className="absolute right-2 top-2 rounded bg-neon-amber/80 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-black">
                    Boss Rush Exclusive
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white/90">{m.name}</h3>
                  {selected && <span className="text-xs font-bold text-neon-green">✓ selected</span>}
                </div>
                {/* Fixed height so 1- and 2-line descriptions keep buttons aligned. */}
                <p className="mt-0.5 min-h-[2.5rem] text-[11px] leading-snug text-white/45">{m.description}</p>

                {owned ? (
                  <button
                    onClick={() => onSelect(m.id)}
                    disabled={selected}
                    className={`mt-auto w-full rounded-md border px-3 py-1.5 text-xs font-bold ${
                      selected
                        ? 'border-neon-green/50 text-neon-green'
                        : 'border-white/15 text-white/70 hover:border-neon-green hover:text-neon-green'
                    }`}
                  >
                    {selected ? 'Selected' : 'Select'}
                  </button>
                ) : (
                  <button
                    onClick={() => setPendingMap(m)}
                    className="mt-auto w-full rounded-md border border-neon-amber/60 px-3 py-1.5 text-xs font-bold text-neon-amber hover:bg-neon-amber/10"
                  >
                    {m.cost.toLocaleString()} 🪙
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button className="menu-btn max-w-xs flex-1 text-center shadow-neon" onClick={onDeploy}>
          ▶ Deploy
        </button>
      </div>

      {pendingMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-neon-green/40 bg-ink-800 p-5 text-center shadow-neon">
            <h3 className="text-lg font-black tracking-wide text-neon-green">CONFIRM PURCHASE</h3>
            <p className="mt-2 text-sm text-white/70">
              Buy <span className="font-bold text-white">{pendingMap.name}</span> for{' '}
              <span className="font-bold text-neon-amber">{pendingMap.cost.toLocaleString()} 🪙</span>?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setPendingMap(null)}
                className="flex-1 rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/70 hover:border-white/40"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onBuyMap(pendingMap.id);
                  setPendingMap(null);
                }}
                className="flex-1 rounded-lg border border-neon-green bg-neon-green/10 px-4 py-2 text-sm font-bold text-neon-green hover:bg-neon-green/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
