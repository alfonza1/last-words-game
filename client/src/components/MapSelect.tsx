import { useState } from 'react';
import type { Difficulty, GameMode } from '../types';
import type { MapTheme } from '../data/maps';
import { isMapOwnedForFamilyMode, selectableMapsForFamilyMode } from '../theme/meteorMania';

interface Props {
  mode: GameMode;
  difficulty: Difficulty;
  selectedMapId: string;
  ownedMaps: string[];
  familyFriendlyMode?: boolean;
  onSelect: (id: string) => void;
  onBuyMap: (id: string) => void;
  onDeploy: () => void;
  onBack: () => void;
}

const MODE_LABEL: Record<GameMode, string> = {
  survival: 'Survival',
  bossrush: 'Boss Rush',
};

const METEOR_MODE_LABEL: Record<GameMode, string> = {
  survival: 'Planet Shield',
  bossrush: 'Comet Storm',
};

export function MapSelect({
  mode,
  difficulty,
  selectedMapId,
  ownedMaps,
  familyFriendlyMode = false,
  onSelect,
  onBuyMap,
  onDeploy,
  onBack,
}: Props) {
  const [pendingMap, setPendingMap] = useState<MapTheme | null>(null);
  const maps = selectableMapsForFamilyMode(familyFriendlyMode, mode, difficulty);
  const modeLabel = familyFriendlyMode ? METEOR_MODE_LABEL[mode] : MODE_LABEL[mode];

  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-5xl flex-col gap-5 overflow-y-auto px-4 pb-28 pt-16 sm:p-6">
      <button
        onClick={onBack}
        className="absolute left-4 top-4 z-10 min-h-10 rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm font-bold text-white/70 backdrop-blur-sm hover:border-neon-green hover:text-neon-green"
      >
        ← Back
      </button>

      <div className="text-center">
        <h1 className="text-3xl font-black tracking-wide text-neon-green sm:text-4xl">{familyFriendlyMode ? 'SELECT PLANET' : 'SELECT MAP'}</h1>
        <p className="mt-1 text-sm tracking-widest text-neon-cyan">{modeLabel}</p>
      </div>

      <div className="grid flex-1 content-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {maps.map((m) => {
          const owned = isMapOwnedForFamilyMode(m, ownedMaps);
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
                className="h-24 w-full flex-none sm:h-20"
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
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold leading-snug text-white/90 sm:text-sm">{m.name}</h3>
                  {selected && <span className="shrink-0 text-xs font-bold text-neon-green">Selected</span>}
                </div>
                {/* Fixed height so 1- and 2-line descriptions keep buttons aligned. */}
                <p className="mt-1 min-h-[2.75rem] text-xs leading-snug text-white/50 sm:text-[11px]">{m.description}</p>

                {owned ? (
                  <button
                    onClick={() => onSelect(m.id)}
                    disabled={selected}
                    className={`mt-auto min-h-11 w-full rounded-md border px-3 py-2 text-sm font-bold sm:min-h-0 sm:py-1.5 sm:text-xs ${
                      selected
                        ? 'border-neon-green/50 text-neon-green'
                        : 'border-white/15 text-white/70 hover:border-neon-green hover:text-neon-green'
                    }`}
                  >
                    {selected ? 'Selected' : familyFriendlyMode ? 'Select Planet' : 'Select'}
                  </button>
                ) : (
                  <button
                    onClick={() => setPendingMap(m)}
                    className="mt-auto min-h-11 w-full rounded-md border border-neon-amber/60 px-3 py-2 text-sm font-bold text-neon-amber hover:bg-neon-amber/10 sm:min-h-0 sm:py-1.5 sm:text-xs"
                  >
                    {m.cost.toLocaleString()} 🪙
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-ink-900 via-ink-900/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 sm:static sm:mt-auto sm:bg-transparent sm:p-0">
        <button className="menu-btn max-w-xs flex-1 text-center shadow-neon" onClick={onDeploy}>
          {familyFriendlyMode ? 'Launch' : 'Deploy'}
        </button>
      </div>

      {pendingMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-neon-green/40 bg-ink-800 p-5 text-center shadow-neon">
            <h3 className="text-lg font-black tracking-wide text-neon-green">CONFIRM PURCHASE</h3>
            <p className="mt-2 text-sm text-white/70">
              {familyFriendlyMode ? 'Unlock' : 'Buy'} <span className="font-bold text-white">{pendingMap.name}</span> for{' '}
              <span className="font-bold text-neon-amber">{pendingMap.cost.toLocaleString()} 🪙</span>?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setPendingMap(null)}
                className="min-h-11 flex-1 rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/70 hover:border-white/40"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onBuyMap(pendingMap.id);
                  setPendingMap(null);
                }}
                className="min-h-11 flex-1 rounded-lg border border-neon-green bg-neon-green/10 px-4 py-2 text-sm font-bold text-neon-green hover:bg-neon-green/20"
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
