import type { GameState } from '../types';
import { formatTime } from '../lib/utils';

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-black/60 ring-1 ring-white/10">
      <div
        className="h-full rounded-full transition-[width] duration-150"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}` }}
      />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="stat-chip">
      <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="text-lg font-bold" style={{ color: accent ?? '#e8ffe8' }}>
        {value}
      </div>
    </div>
  );
}

interface HUDProps {
  s: GameState;
  muted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
}

export function HUD({ s, muted, onPause, onToggleMute }: HUDProps) {
  const p = s.powerups;
  const activePowerups: Array<{ label: string; color: string }> = [];
  if (p.shotgunArmed) activePowerups.push({ label: 'SHOTGUN', color: '#ff2bd6' });
  if (p.shieldCharges > 0) activePowerups.push({ label: `SHIELD x${p.shieldCharges}`, color: '#00f0ff' });
  if (p.doubleDamageMs > 0) activePowerups.push({ label: '2x DMG', color: '#ffb300' });
  if (p.slowMotionMs > 0) activePowerups.push({ label: 'SLOW-MO', color: '#9b5de5' });
  if (p.freezeMs > 0) activePowerups.push({ label: 'FROZEN', color: '#00f0ff' });
  if (p.grenadeCharges > 0) activePowerups.push({ label: `GRENADE x${p.grenadeCharges}`, color: '#39ff14' });

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3">
      <div className="flex items-start justify-between gap-3">
        {/* Health + wave */}
        <div className="w-64 max-w-[40vw] space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neon-red">HEALTH</span>
            <span className="tabular-nums text-white/70">
              {Math.ceil(s.health)} / {s.maxHealth}
            </span>
          </div>
          <Bar value={s.health} max={s.maxHealth} color="#ff3860" />
          <div className="flex items-center gap-2 pt-1 text-xs text-white/60">
            <span className="rounded bg-neon-green/15 px-2 py-0.5 font-bold text-neon-green">
              WAVE {s.wave}
            </span>
            <span className="tabular-nums">{formatTime(s.elapsedMs)}</span>
            {s.weather !== 'clear' && (
              <span className="uppercase tracking-wider text-neon-cyan">{s.weather}</span>
            )}
          </div>
        </div>

        {/* Controls (left of the score) + core stats */}
        <div className="flex items-start gap-2">
          <div className="pointer-events-auto flex gap-1.5">
            <button
              onClick={onToggleMute}
              title="Mute all (music + gunshots)"
              className="rounded-md border border-white/15 bg-black/60 px-2.5 py-1.5 text-sm text-white/70 hover:border-neon-green hover:text-neon-green"
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={onPause}
              className="rounded-md border border-neon-green/40 bg-black/60 px-2.5 py-1.5 text-sm font-bold text-neon-green hover:bg-ink-600"
            >
              ⏸
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            <Stat label="Score" value={s.score.toLocaleString()} accent="#ffb300" />
            <Stat label="WPM" value={s.wpm} accent="#00f0ff" />
            <Stat label="Acc" value={`${s.accuracy}%`} accent="#39ff14" />
            <Stat label="Streak" value={s.streak} accent="#ff2bd6" />
            <Stat label="Coins" value={s.coins} accent="#ffd166" />
          </div>
        </div>
      </div>

      {/* Active powerups */}
      {activePowerups.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {activePowerups.map((pw) => (
            <span
              key={pw.label}
              className="rounded-full border px-3 py-1 text-xs font-bold"
              style={{ color: pw.color, borderColor: pw.color, boxShadow: `0 0 10px ${pw.color}55` }}
            >
              {pw.label}
            </span>
          ))}
        </div>
      )}

      {/* Event / companion ticker */}
      <div className="mt-2 flex flex-col items-center gap-1">
        {s.events.slice(-3).map((ev) => (
          <span
            key={ev.id}
            className={
              ev.kind === 'finisher'
                ? 'text-2xl font-black tracking-widest text-neon-pink drop-shadow-[0_0_10px_rgba(255,43,214,0.8)]'
                : ev.kind === 'companion'
                  ? 'text-sm font-bold text-neon-green'
                  : 'text-xs text-white/70'
            }
          >
            {ev.text}
          </span>
        ))}
      </div>

      {/* Boss warning overlay */}
      {s.bossWarning > 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="text-5xl font-black tracking-[0.3em] text-neon-red drop-shadow-[0_0_20px_rgba(255,56,96,0.9)]">
              BOSS
            </div>
            <div className="text-sm tracking-widest text-white/70">INCOMING</div>
          </div>
        </div>
      )}
    </div>
  );
}
