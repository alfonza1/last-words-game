import { useState } from 'react';
import type { CharacterLoadout, GameStats, UpgradeKey, Upgrades as UpgradesType } from '../types';
import { UPGRADE_DEFS, UPGRADE_LIFESPAN, upgradeCost } from '../data/upgrades';
import { POWERUP_DEFS } from '../data/powerups';
import { COIN_PACKS } from '../data/coinPacks';
import { COSMETICS, DEFAULT_CHARACTER, type CosmeticDef, type CosmeticSlot } from '../data/cosmetics';
import { AdBanner } from './AdBanner';
import { CharacterAvatar } from './CharacterAvatar';

type Pending = { kind: 'upgrade' | 'powerup' | 'coinpack' | 'cosmetic'; id: string; label: string; cost: string; real?: boolean };

interface Props {
  upgrades: UpgradesType;
  stats: GameStats;
  gamesLeft: number;
  /** Owned consumable powerup charges (key -> count). */
  powerups: Record<string, number>;
  ownedCosmetics: string[];
  /** The player's equipped look, so shop items can be tried on their character. */
  character: CharacterLoadout;
  /** Whether the player is signed in (required to purchase). */
  signedIn: boolean;
  /** Purchase is authoritative on the backend — just send the key. */
  onBuy: (key: UpgradeKey) => void;
  /** Buy one charge of a consumable powerup. */
  onBuyPowerup: (key: string) => void;
  onBuyCosmetic: (key: string) => void;
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
  ownedCosmetics,
  character,
  signedIn,
  onBuy,
  onBuyPowerup,
  onBuyCosmetic,
  onBuyCoinPack,
  onRequireSignIn,
  onBack,
}: Props) {
  const coins = stats.totalCoins;
  const anyOwned = UPGRADE_DEFS.some((d) => upgrades[d.key] > 0);
  const active = gamesLeft > 0 && anyOwned;
  const owned = new Set(ownedCosmetics);
  // Stable catalog order — bought items don't jump to the front of the list.
  // Exclusive Mythic gear is showcased at the top of its section, above Legendary.
  const gearFor = (slot: CosmeticSlot) =>
    COSMETICS.filter((item) => item.slot === slot && item.cost > 0).sort(
      (a, b) => Number(b.rarity === 'exclusive-mythic') - Number(a.rarity === 'exclusive-mythic'),
    );

  // Purchases require an explicit confirm so nobody buys by accident / spam-clicks.
  const [pending, setPending] = useState<Pending | null>(null);
  // Try-on is a pure local preview — it never equips, owns, or persists anything.
  const [tryOn, setTryOn] = useState<CosmeticDef | null>(null);
  const confirmPurchase = () => {
    if (!pending) return;
    const p = pending;
    setPending(null);
    if (p.kind === 'upgrade') onBuy(p.id as UpgradeKey);
    else if (p.kind === 'powerup') onBuyPowerup(p.id);
    else if (p.kind === 'cosmetic') onBuyCosmetic(p.id);
    else onBuyCoinPack(p.id);
  };
  const gearCard = (item: CosmeticDef) => {
    const isOwned = owned.has(item.key);
    const affordable = coins >= item.cost;
    const preview: CharacterLoadout = { ...DEFAULT_CHARACTER, [item.slot]: item.key };
    const exclusive = item.rarity === 'exclusive-mythic';
    // Exclusive Mythic gets a purple haze; other rarities keep their accent border.
    const rarityColor = exclusive
      ? 'border-[#a855f7]/70 shadow-[0_0_26px_rgba(168,85,247,0.45)] ring-1 ring-[#a855f7]/40'
      : item.rarity === 'legendary'
        ? 'border-neon-amber/60'
        : item.rarity === 'epic'
          ? 'border-neon-pink/50'
          : item.rarity === 'rare'
            ? 'border-neon-cyan/45'
            : 'border-white/20';
    return (
      <div key={item.key} className={`relative overflow-hidden rounded-xl border bg-ink-800/70 p-3 ${rarityColor}`}>
        {!exclusive && (
          <div className="absolute right-2 top-2 text-[9px] font-black uppercase tracking-widest text-white/45">
            {item.rarity}
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className="h-28 w-24 flex-none overflow-hidden rounded-lg border border-white/15 bg-black/35">
            <CharacterAvatar character={preview} armed={false} className="h-32 w-full -translate-y-1" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-neon-green">{item.name}</h3>
            <p className="mt-1 text-[11px] leading-snug text-white/65">{item.description}</p>
            {item.outfitReactive && (
              <span className="mt-1.5 inline-block rounded border border-neon-cyan/40 bg-neon-cyan/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-neon-cyan">
                ◈ Outfit-reactive
              </span>
            )}
            {exclusive && (
              <div className="mt-1.5 text-center text-[9px] font-black uppercase tracking-[0.18em] text-[#c084fc]">
                · Exclusive Mythic ·
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setTryOn(item)}
            className="flex-none rounded-lg border border-neon-cyan/45 bg-neon-cyan/5 px-3 py-2 text-xs font-black text-neon-cyan transition hover:bg-neon-cyan/15"
          >
            Try On
          </button>
          <button
            disabled={isOwned || !affordable}
            onClick={() => setPending({ kind: 'cosmetic', id: item.key, label: item.name, cost: `${item.cost} 🪙` })}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-black ${
              isOwned
                ? 'border-neon-green/60 bg-neon-green/10 text-neon-green'
                : !affordable
                  ? 'cursor-not-allowed border-white/15 text-white/45'
                  : 'border-neon-green/60 bg-neon-green/10 text-neon-green hover:bg-neon-green/20'
            }`}
          >
            {isOwned ? 'OWNED' : `${item.cost.toLocaleString()} 🪙`}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-4xl flex-col gap-4 overflow-y-auto p-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <button
          onClick={onBack}
          className="justify-self-start rounded-md border border-white/15 bg-black/50 px-3 py-1.5 text-sm text-white/70 hover:border-neon-green hover:text-neon-green"
        >
          ← Back
        </button>
        <h1 className="text-center text-2xl font-black tracking-wide text-neon-green sm:text-3xl">STORE</h1>
        <div className="justify-self-end rounded-lg border border-neon-amber/40 bg-black/50 px-2 py-2 text-xs font-bold text-neon-amber sm:px-4 sm:text-base">
          🪙 {coins.toLocaleString()} <span className="hidden sm:inline">coins</span>
        </div>
      </div>
      {!signedIn && (
        <button
          onClick={onRequireSignIn}
          className="rounded-lg border border-neon-pink/50 bg-neon-pink/10 px-4 py-2 text-left text-sm text-neon-pink hover:bg-neon-pink/20"
        >
          👻 You're playing as a guest — purchases save on this device only and may not stick.{' '}
          <span className="font-bold underline">Sign in</span> to save your progress across devices.
        </button>
      )}

      {/* Coin packs stay at the top so currency purchases are easy to find. */}
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

      <p className="mt-1 text-xs text-white/55">Cosmetics give no competitive advantage.</p>
      <h2 className="text-sm font-bold uppercase tracking-widest text-neon-pink">Survivor Gear</h2>

      <h3 className="text-xs font-black uppercase tracking-[0.24em] text-neon-pink">Outfits</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{gearFor('outfit').map(gearCard)}</div>

      <h3 className="text-xs font-black uppercase tracking-[0.24em] text-neon-pink">Accessories</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{gearFor('accessory').map(gearCard)}</div>

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
                disabled={!affordable}
                onClick={() => setPending({ kind: 'powerup', id: def.key, label: def.name, cost: `${def.cost} 🪙` })}
                className={`mt-3 rounded-lg border px-4 py-2 text-sm font-bold transition-all ${
                  !affordable
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

      {/* Temporary upgrades */}
      <h2 className="mt-2 text-sm font-bold uppercase tracking-widest text-neon-cyan">Upgrades</h2>
      <div className="-mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-white/50">
          Spend coins from runs. Every purchase adds {UPGRADE_LIFESPAN} games to your active upgrade timer.
        </p>
        <span
          className={`rounded-md border px-3 py-1 text-xs font-bold ${
            active ? 'border-neon-cyan/50 text-neon-cyan' : 'border-white/20 text-white/55'
          }`}
        >
          {active ? `Active · ${gamesLeft} game${gamesLeft === 1 ? '' : 's'} left` : 'No active upgrades'}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {UPGRADE_DEFS.map((def) => {
          const level = upgrades[def.key];
          const cost = upgradeCost(def, Math.min(level, def.maxLevel - 1));
          const affordable = coins >= cost;
          const enabled = level > 0 && gamesLeft > 0;
          return (
            <div
              key={def.key}
              className="flex flex-col justify-between rounded-xl border border-white/10 bg-ink-800/70 p-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-neon-cyan">{def.name}</h3>
                  {enabled && (
                    <span className="rounded border border-neon-cyan/40 bg-neon-cyan/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-neon-cyan">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-white/60">{def.description}</p>
              </div>
              <button
                disabled={!affordable}
                onClick={() =>
                  setPending({
                    kind: 'upgrade',
                    id: def.key,
                    label: def.name,
                    cost: `${cost} 🪙 · +${UPGRADE_LIFESPAN} games`,
                  })
                }
                className={`mt-3 rounded-lg border px-4 py-2 text-sm font-bold transition-all ${
                  !affordable
                    ? 'cursor-not-allowed border-white/10 text-white/30'
                    : 'border-neon-green bg-neon-green/10 text-neon-green hover:bg-neon-green/20'
                }`}
              >
                {cost.toLocaleString()} 🪙 · +{UPGRADE_LIFESPAN} GAMES
              </button>
            </div>
          );
        })}
      </div>

      <AdBanner className="mt-2" />

      {/* Try-on preview — pure local render: never equips, owns, or persists anything */}
      {tryOn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setTryOn(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-neon-cyan/40 bg-ink-800 p-5 text-center shadow-neon"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-64 w-52 overflow-hidden rounded-lg border border-white/10 bg-black/40">
              <CharacterAvatar character={{ ...character, [tryOn.slot]: tryOn.key }} className="h-full w-full" />
            </div>
            <div className="text-sm font-black text-neon-green">{tryOn.name}</div>
            <p className="mt-1 text-[11px] leading-snug text-white/60">{tryOn.description}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setTryOn(null)}
                className="flex-1 rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/70 hover:border-white/40"
              >
                Close
              </button>
              {!owned.has(tryOn.key) && (
                <button
                  onClick={() => {
                    const it = tryOn;
                    setTryOn(null);
                    setPending({ kind: 'cosmetic', id: it.key, label: it.name, cost: `${it.cost} 🪙` });
                  }}
                  className="flex-1 rounded-lg border border-neon-green bg-neon-green/10 px-4 py-2 text-sm font-bold text-neon-green hover:bg-neon-green/20"
                >
                  Buy {tryOn.cost.toLocaleString()} 🪙
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
