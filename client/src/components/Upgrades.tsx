import type { GameStats, UpgradeKey, Upgrades as UpgradesType } from '../types';
import { UPGRADE_DEFS, UPGRADE_LIFESPAN, canUpgrade, upgradeCost } from '../data/upgrades';

interface Props {
  upgrades: UpgradesType;
  stats: GameStats;
  gamesLeft: number;
  /** Purchase is authoritative on the backend — just send the key. */
  onBuy: (key: UpgradeKey) => void;
  onBack: () => void;
}

export function Upgrades({ upgrades, stats, gamesLeft, onBuy, onBack }: Props) {
  const coins = stats.totalCoins;
  const anyOwned = UPGRADE_DEFS.some((d) => upgrades[d.key] > 0);
  const active = gamesLeft > 0 && anyOwned;

  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-4xl flex-col gap-4 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-wide text-neon-green">UPGRADES</h1>
        <div className="rounded-lg border border-neon-amber/40 bg-black/50 px-4 py-2 font-bold text-neon-amber">
          🪙 {coins.toLocaleString()} coins
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-white/50">
          Spend coins from runs. Upgrades are temporary — each purchase lasts {UPGRADE_LIFESPAN} games.
        </p>
        <span
          className={`rounded-md border px-3 py-1 text-xs font-bold ${
            active ? 'border-neon-green/50 text-neon-green' : 'border-white/15 text-white/40'
          }`}
        >
          {active ? `Active · ${gamesLeft} game${gamesLeft === 1 ? '' : 's'} left` : 'No active upgrades'}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {UPGRADE_DEFS.map((def) => {
          const level = upgrades[def.key];
          const maxed = !canUpgrade(def, upgrades);
          const cost = upgradeCost(def, level);
          const affordable = !maxed && coins >= cost;
          return (
            <div
              key={def.key}
              className="flex flex-col justify-between rounded-xl border border-white/10 bg-ink-800/70 p-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-neon-cyan">{def.name}</h3>
                  <span className="text-xs text-white/40">
                    Lv {level}/{def.maxLevel}
                  </span>
                </div>
                <p className="mt-1 text-sm text-white/60">{def.description}</p>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: def.maxLevel }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < level ? 'bg-neon-green' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
              </div>
              <button
                disabled={maxed || !affordable}
                onClick={() => onBuy(def.key)}
                className={`mt-3 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  maxed
                    ? 'cursor-default border border-white/10 text-white/30'
                    : affordable
                      ? 'border border-neon-green bg-neon-green/10 text-neon-green hover:bg-neon-green/20'
                      : 'cursor-not-allowed border border-white/10 text-white/30'
                }`}
              >
                {maxed ? 'MAXED' : affordable ? `Buy · ${cost} 🪙` : `Need ${cost} 🪙`}
              </button>
            </div>
          );
        })}
      </div>

      <button className="menu-btn mt-2 max-w-xs self-center text-center" onClick={onBack}>
        ← Back to Menu
      </button>
    </div>
  );
}
