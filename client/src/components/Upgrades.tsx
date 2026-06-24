import { useState } from 'react';
import type { GameStats, UpgradeKey, Upgrades as UpgradesType } from '../types';
import { UPGRADE_DEFS, UPGRADE_LIFESPAN, canUpgrade, upgradeCost } from '../data/upgrades';
import { POWERUP_DEFS } from '../data/powerups';
import { COIN_PACKS } from '../data/coinPacks';
import { AdBanner } from './AdBanner';

type Pending = { kind: 'upgrade' | 'powerup' | 'coinpack'; id: string; label: string; cost: string; real?: boolean };

interface Props {
  upgrades: UpgradesType;
  stats: GameStats;
  gamesLeft: number;
  /** Owned consumable powerup charges (key -> count). */
  powerups: Record<string, number>;
  /** Whether the player is signed in (required to purchase). */
  signedIn: boolean;
  /** Purchase is authoritative on the backend — just send the key. */
  onBuy: (key: UpgradeKey) => void;
  /** Buy one charge of a consumable powerup. */
  onBuyPowerup: (key: string) => void;
  /** Buy a real-money coin pack (Stripe). */
  onBuyCoinPack: (packId: string) => void;
  /** Called when a guest tries to buy — prompts sign-in. */
  onRequireSignIn: () => void;
  onBack: () => void;
}

export function Upgrades({
  upgrades,
  stats,
  gamesLeft,
  powerups,
  signedIn,
  onBuy,
  onBuyPowerup,
  onBuyCoinPack,
  onRequireSignIn,
  onBack,
}: Props) {
  const coins = stats.totalCoins;
  const anyOwned = UPGRADE_DEFS.some((d) => upgrades[d.key] > 0);
  const active = gamesLeft > 0 && anyOwned;

  // Purchases require an explicit confirm so nobody buys by accident / spam-clicks.
  const [pending, setPending] = useState<Pending | null>(null);
  const confirmPurchase = () => {
    if (!pending) return;
    const p = pending;
    setPending(null);
    if (p.kind === 'upgrade') onBuy(p.id as UpgradeKey);
    else if (p.kind === 'powerup') onBuyPowerup(p.id);
    else onBuyCoinPack(p.id);
  };

  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-4xl flex-col gap-4 overflow-y-auto p-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-md border border-white/15 bg-black/50 px-3 py-1.5 text-sm text-white/70 hover:border-neon-green hover:text-neon-green"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-black tracking-wide text-neon-green">STORE</h1>
        <div className="ml-auto rounded-lg border border-neon-amber/40 bg-black/50 px-4 py-2 font-bold text-neon-amber">
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

      {!signedIn && (
        <button
          onClick={onRequireSignIn}
          className="rounded-lg border border-neon-pink/50 bg-neon-pink/10 px-4 py-2 text-left text-sm text-neon-pink hover:bg-neon-pink/20"
        >
          🔒 You’re playing as a guest. <span className="font-bold underline">Sign in</span> to buy from the store.
        </button>
      )}

      {/* Coin packs (real money) — top of the store */}
      <h2 className="text-sm font-bold uppercase tracking-widest text-neon-amber">Coin Packs</h2>
      <p className="-mt-2 text-xs text-white/40">Top up instantly. Secure checkout via Stripe.</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {COIN_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`relative flex flex-col items-center gap-2 rounded-xl border bg-ink-800/70 p-4 text-center ${
              pack.best ? 'border-neon-amber/60' : 'border-white/10'
            }`}
          >
            {pack.best && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-neon-amber px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-black">
                Best value
              </span>
            )}
            <div className="text-xl font-black text-neon-amber">🪙 {pack.coins.toLocaleString()}</div>
            <button
              onClick={() =>
                signedIn
                  ? setPending({ kind: 'coinpack', id: pack.id, label: `${pack.coins.toLocaleString()} coins`, cost: pack.price, real: true })
                  : onRequireSignIn()
              }
              className="w-full rounded-lg border border-neon-amber bg-neon-amber/10 px-3 py-1.5 text-sm font-bold text-neon-amber hover:bg-neon-amber/20"
            >
              {pack.price}
            </button>
          </div>
        ))}
      </div>

      {/* Consumable powerups */}
      <h2 className="mt-1 text-sm font-bold uppercase tracking-widest text-neon-cyan">Powerups</h2>
      <p className="-mt-2 text-xs text-white/40">
        Bought charges are permanent until used. In a run, type the word to activate.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {POWERUP_DEFS.map((def) => {
          const owned = powerups[def.key] ?? 0;
          const affordable = coins >= def.cost;
          return (
            <div key={def.key} className="flex flex-col justify-between rounded-xl border border-white/10 bg-ink-800/70 p-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-neon-green">
                    {def.icon} {def.name}
                  </h3>
                  <span className="text-xs text-white/40">owned ×{owned}</span>
                </div>
                <p className="mt-1 text-sm text-white/60">{def.description}</p>
              </div>
              <button
                disabled={signedIn && !affordable}
                onClick={() =>
                  signedIn
                    ? setPending({ kind: 'powerup', id: def.key, label: def.name, cost: `${def.cost} 🪙` })
                    : onRequireSignIn()
                }
                className={`mt-3 rounded-lg border px-4 py-2 text-sm font-bold transition-all ${
                  signedIn && !affordable
                    ? 'cursor-not-allowed border-white/10 text-white/30'
                    : 'border-neon-green bg-neon-green/10 text-neon-green hover:bg-neon-green/20'
                }`}
              >
                {def.cost} 🪙
              </button>
            </div>
          );
        })}
      </div>

      {/* Permanent-ish upgrades */}
      <h2 className="mt-2 text-sm font-bold uppercase tracking-widest text-neon-cyan">Upgrades</h2>
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
                disabled={maxed || (signedIn && !affordable)}
                onClick={() =>
                  signedIn
                    ? setPending({ kind: 'upgrade', id: def.key, label: def.name, cost: `${cost} 🪙` })
                    : onRequireSignIn()
                }
                className={`mt-3 rounded-lg border px-4 py-2 text-sm font-bold transition-all ${
                  maxed || (signedIn && !affordable)
                    ? 'cursor-not-allowed border-white/10 text-white/30'
                    : 'border-neon-green bg-neon-green/10 text-neon-green hover:bg-neon-green/20'
                }`}
              >
                {maxed ? 'MAXED' : `${cost} 🪙`}
              </button>
            </div>
          );
        })}
      </div>

      <AdBanner className="mt-2" />

      {/* Confirm purchase popup — prevents accidental / spam buys */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-neon-green/40 bg-ink-800 p-5 text-center shadow-neon">
            <h3 className="text-lg font-black tracking-wide text-neon-green">CONFIRM PURCHASE</h3>
            <p className="mt-2 text-sm text-white/70">
              Buy <span className="font-bold text-white">{pending.label}</span> for{' '}
              <span className="font-bold text-neon-amber">{pending.cost}</span>?
            </p>
            {pending.real && <p className="mt-1 text-xs text-white/40">You’ll be taken to secure checkout.</p>}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setPending(null)}
                className="flex-1 rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/70 hover:border-white/40"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
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
