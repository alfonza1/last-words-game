import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CharacterLoadout, GameStats } from '../types';
import {
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
  cosmeticByKey,
  cosmeticsFor,
  normalizeCharacter,
} from '../data/cosmetics';
import { CharacterAvatar } from './CharacterAvatar';

interface Props {
  character: CharacterLoadout;
  ownedCosmetics: string[];
  stats: GameStats;
  signedIn: boolean;
  onEquip: (character: CharacterLoadout) => void;
  onOpenStore: () => void;
  onRequireSignIn: () => void;
  onBack: () => void;
}

export function Closet({
  character,
  ownedCosmetics,
  stats,
  signedIn,
  onEquip,
  onOpenStore,
  onRequireSignIn,
  onBack,
}: Props) {
  const [draft, setDraft] = useState(() => normalizeCharacter(character));
  const [saved, setSaved] = useState(false);
  useEffect(() => setDraft(normalizeCharacter(character)), [character]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(character);
  const equippedOutfit = cosmeticByKey(draft.outfit);
  const equippedAccessory = cosmeticByKey(draft.accessory);
  const owned = useMemo(() => new Set(ownedCosmetics), [ownedCosmetics]);

  const chooseCosmetic = (key: string, slot: 'outfit' | 'accessory') => {
    if (!owned.has(key)) return;
    setDraft((prev) => ({ ...prev, [slot]: key }));
    setSaved(false);
  };

  const save = () => {
    if (!signedIn) {
      onEquip(draft);
      setSaved(true);
      return;
    }
    onEquip(draft);
    setSaved(true);
  };

  return (
    <div className="crt relative mx-auto grid h-full w-full max-w-6xl overflow-y-auto p-5 lg:grid-cols-[340px_1fr] lg:gap-5">
      <section className="relative flex min-h-[470px] flex-col overflow-hidden rounded-2xl border border-neon-cyan/25 bg-ink-800/85 p-4">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-neon-cyan/10 to-transparent" />
        <div className="relative flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-md border border-white/15 bg-black/50 px-3 py-1.5 text-sm text-white/70 hover:border-neon-green hover:text-neon-green"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-widest text-neon-cyan">SURVIVOR CLOSET</h1>
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Build your last known look</p>
          </div>
        </div>

        <div className="relative mt-2 flex flex-1 items-center justify-center">
          <div className="absolute bottom-8 h-20 w-64 rounded-full bg-neon-cyan/10 blur-2xl" />
          <CharacterAvatar character={draft} className="relative h-[330px] w-[260px] max-w-full" />
        </div>

        <div className="relative rounded-xl border border-white/10 bg-black/45 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-white">{equippedOutfit?.name}</div>
              <div className="text-xs text-white/40">{equippedAccessory?.name}</div>
            </div>
            <div className="text-right text-xs text-neon-amber">🪙 {stats.totalCoins.toLocaleString()}</div>
          </div>
          {!signedIn && (
            <p className="mt-2 text-[11px] text-neon-pink">
              Guest changes last for this visit. Sign in to save purchases and outfits.
            </p>
          )}
          <button
            onClick={save}
            disabled={!dirty}
            className={`mt-3 w-full rounded-lg border px-4 py-2 text-sm font-black tracking-wider ${
              dirty
                ? 'border-neon-green bg-neon-green/10 text-neon-green shadow-neon'
                : 'border-white/10 text-white/30'
            }`}
          >
            {saved && !dirty ? 'LOADOUT SAVED' : dirty ? 'EQUIP LOADOUT' : 'EQUIPPED'}
          </button>
        </div>
      </section>

      <section className="mt-4 space-y-5 pb-8 lg:mt-0">
        <Picker title="Skin tone" subtitle="Free identity customization">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {SKIN_TONES.map((tone) => (
              <button
                key={tone.key}
                onClick={() => setDraft((prev) => ({ ...prev, skinTone: tone.key }))}
                className={`rounded-lg border p-2 text-[10px] font-bold ${
                  draft.skinTone === tone.key ? 'border-neon-green text-neon-green' : 'border-white/10 text-white/50'
                }`}
              >
                <span className="mx-auto mb-1 block h-7 w-7 rounded-full border border-white/20" style={{ background: tone.color }} />
                {tone.label}
              </button>
            ))}
          </div>
        </Picker>

        <div className="grid gap-4 sm:grid-cols-2">
          <Picker title="Hair" subtitle="Free styles">
            <div className="grid grid-cols-2 gap-2">
              {HAIR_STYLES.map((style) => (
                <button
                  key={style.key}
                  onClick={() => setDraft((prev) => ({ ...prev, hair: style.key }))}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                    draft.hair === style.key ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' : 'border-white/10 text-white/50'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </Picker>
          <Picker title="Hair color" subtitle="Free color channels">
            <div className="grid grid-cols-3 gap-2">
              {HAIR_COLORS.map((color) => (
                <button
                  key={color.key}
                  title={color.label}
                  onClick={() => setDraft((prev) => ({ ...prev, hairColor: color.key }))}
                  className={`flex items-center gap-2 rounded-lg border p-2 text-[10px] ${
                    draft.hairColor === color.key ? 'border-neon-cyan text-neon-cyan' : 'border-white/10 text-white/45'
                  }`}
                >
                  <span className="h-5 w-5 rounded-full" style={{ background: color.color }} />
                  {color.label}
                </button>
              ))}
            </div>
          </Picker>
        </div>

        <CosmeticPicker
          title="Outfits"
          items={cosmeticsFor('outfit')}
          selected={draft.outfit}
          owned={owned}
          onChoose={(key) => chooseCosmetic(key, 'outfit')}
          onOpenStore={signedIn ? onOpenStore : onRequireSignIn}
        />
        <CosmeticPicker
          title="Accessories"
          items={cosmeticsFor('accessory')}
          selected={draft.accessory}
          owned={owned}
          onChoose={(key) => chooseCosmetic(key, 'accessory')}
          onOpenStore={signedIn ? onOpenStore : onRequireSignIn}
        />
      </section>
    </div>
  );
}

function Picker({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800/65 p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-black uppercase tracking-widest text-neon-green">{title}</h2>
        <span className="text-[10px] text-white/30">{subtitle}</span>
      </div>
      {children}
    </div>
  );
}

function CosmeticPicker({
  title,
  items,
  selected,
  owned,
  onChoose,
  onOpenStore,
}: {
  title: string;
  items: ReturnType<typeof cosmeticsFor>;
  selected: string;
  owned: Set<string>;
  onChoose: (key: string) => void;
  onOpenStore: () => void;
}) {
  return (
    <Picker title={title} subtitle="Permanent unlocks">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const isOwned = owned.has(item.key);
          const active = selected === item.key;
          return (
            <button
              key={item.key}
              onClick={() => (isOwned ? onChoose(item.key) : onOpenStore())}
              className={`rounded-lg border p-3 text-left transition ${
                active
                  ? 'border-neon-green bg-neon-green/10 shadow-neon'
                  : isOwned
                    ? 'border-white/15 bg-black/30 hover:border-neon-cyan/60'
                    : 'border-white/10 bg-black/20 opacity-65 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-bold ${active ? 'text-neon-green' : 'text-white/75'}`}>{item.name}</span>
                <span className="text-[9px] uppercase tracking-widest text-white/30">
                  {isOwned ? (active ? 'equipped' : 'owned') : `${item.cost} 🪙`}
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-snug text-white/35">{item.description}</p>
            </button>
          );
        })}
      </div>
    </Picker>
  );
}
