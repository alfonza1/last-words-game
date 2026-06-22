import type { GameMode, GameStats } from '../types';
import { MAPS, isMapUnlocked } from '../data/maps';

interface Props {
  mode: GameMode;
  selectedMapId: string;
  stats: GameStats;
  onSelect: (id: string) => void;
  onDeploy: () => void;
  onBack: () => void;
}

const MODE_LABEL: Record<GameMode, string> = {
  survival: 'Survival',
  bossrush: 'Boss Rush',
};

export function MapSelect({ mode, selectedMapId, stats, onSelect, onDeploy, onBack }: Props) {
  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-5xl flex-col gap-5 overflow-y-auto p-6">
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-wide text-neon-green sm:text-4xl">SELECT MAP</h1>
        <p className="mt-1 text-sm tracking-widest text-neon-cyan">{MODE_LABEL[mode]}</p>
      </div>

      <div className="grid flex-1 content-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MAPS.map((m) => {
          const unlocked = isMapUnlocked(m, stats);
          const selected = selectedMapId === m.id;
          const p = m.palette;
          return (
            <button
              key={m.id}
              disabled={!unlocked}
              onClick={() => onSelect(m.id)}
              className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                selected
                  ? 'border-neon-green shadow-neon'
                  : unlocked
                    ? 'border-white/10 hover:border-neon-green/50'
                    : 'cursor-not-allowed border-white/5'
              }`}
            >
              {/* Theme preview swatch */}
              <div
                className="h-20 w-full"
                style={{
                  background: `linear-gradient(160deg, ${p.skyTop}, ${p.skyHorizon} 55%, ${p.ground2})`,
                }}
              >
                <div className="flex h-full items-end justify-between p-2">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ background: p.moon, boxShadow: `0 0 12px ${p.moon}` }}
                  />
                  <span className="h-2 w-12 rounded-full" style={{ background: p.accent }} />
                </div>
              </div>

              <div className={`bg-ink-800/85 p-3 ${unlocked ? '' : 'opacity-70'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold ${unlocked ? 'text-white/90' : 'text-white/40'}`}>
                    {unlocked ? m.name : `🔒 ${m.name}`}
                  </h3>
                  {selected && <span className="text-xs font-bold text-neon-green">✓ selected</span>}
                </div>
                <p className="mt-0.5 text-[11px] text-white/45">
                  {unlocked ? m.description : `Locked — ${m.unlockLabel}`}
                </p>
              </div>

              {!unlocked && <div className="absolute inset-0 bg-black/40" />}
            </button>
          );
        })}
      </div>

      <div className="flex justify-center gap-3">
        <button className="menu-btn max-w-[10rem] text-center" onClick={onBack}>
          ← Back
        </button>
        <button className="menu-btn max-w-xs flex-1 text-center shadow-neon" onClick={onDeploy}>
          ▶ Deploy
        </button>
      </div>
    </div>
  );
}
