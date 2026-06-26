import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CharacterLoadout } from '../types';
import {
  EXPRESSIONS,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
  cosmeticsFor,
  normalizeCharacter,
} from '../data/cosmetics';
import { CharacterAvatar } from './CharacterAvatar';

interface Props {
  character: CharacterLoadout;
  ownedCosmetics: string[];
  signedIn: boolean;
  username: string;
  onEquip: (character: CharacterLoadout) => Promise<void>;
  onOpenStore: () => void;
  onBack: () => void;
}

export function Closet({
  character,
  ownedCosmetics,
  username,
  onEquip,
  onOpenStore,
  onBack,
}: Props) {
  const [draft, setDraft] = useState(() => normalizeCharacter(character));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  useEffect(() => {
    setDraft(normalizeCharacter(character));
    setSaved(false);
  }, [character]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(character);
  const hasUnsavedChanges = dirty && !saved;
  const owned = useMemo(() => new Set(ownedCosmetics), [ownedCosmetics]);
  const ownedOutfits = useMemo(() => cosmeticsFor('outfit').filter((item) => owned.has(item.key)), [owned]);
  const ownedAccessories = useMemo(() => cosmeticsFor('accessory').filter((item) => owned.has(item.key)), [owned]);

  const updateDraft = (change: Partial<CharacterLoadout>) => {
    setDraft((prev) => ({ ...prev, ...change }));
    setSaved(false);
  };

  const chooseCosmetic = (key: string, slot: 'outfit' | 'accessory') => {
    updateDraft({ [slot]: key });
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onEquip(draft);
      setSaved(true);
    } catch {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  const requestBack = () => {
    if (hasUnsavedChanges) {
      setConfirmLeave(true);
      return;
    }
    onBack();
  };

  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-6xl flex-col gap-3 overflow-y-auto p-4">
      <div className="flex flex-wrap items-start gap-3">
        <button
          onClick={requestBack}
          className="rounded-md border border-white/15 bg-black/50 px-3 py-1.5 text-sm text-white/70 hover:border-neon-green hover:text-neon-green"
        >
          ← Back
        </button>
        <div className="min-w-[210px] flex-1">
          <h1 className="text-2xl font-black tracking-widest text-neon-cyan">{username}’s Closet</h1>
          <p className="text-[8px] uppercase tracking-[0.2em] text-white/35 sm:text-[10px] sm:tracking-[0.28em]">
            Build your last known look
          </p>
        </div>
        <button
          onClick={onOpenStore}
          className="group ml-auto flex min-h-11 flex-none items-center gap-2 rounded-xl border border-neon-pink/65 bg-gradient-to-r from-neon-pink/15 via-black/40 to-neon-cyan/10 px-4 py-2 text-left shadow-[0_0_18px_rgba(255,43,214,0.18)] transition hover:border-neon-pink hover:bg-neon-pink/20 hover:shadow-[0_0_24px_rgba(255,43,214,0.28)]"
        >
          <span className="h-2 w-2 rounded-full bg-neon-pink shadow-[0_0_12px_rgba(255,43,214,0.9)] transition group-hover:bg-neon-cyan group-hover:shadow-[0_0_14px_rgba(0,240,255,0.9)]" />
          <span className="flex flex-col leading-none">
            <span className="text-[11px] font-black uppercase tracking-[0.24em] text-neon-pink">Open Shop</span>
            <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-white/35">Gear market</span>
          </span>
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[300px_1fr] lg:gap-4">
        <section className="relative flex min-h-[430px] flex-col overflow-hidden rounded-2xl border border-neon-cyan/25 bg-ink-800/85 p-3">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-neon-cyan/10 to-transparent" />

          <div className="relative flex flex-1 items-center justify-center">
          <div className="absolute bottom-6 h-16 w-52 rounded-full bg-neon-cyan/10 blur-2xl" />
          <CharacterAvatar character={draft} armed={false} className="relative h-[275px] w-[220px] max-w-full" />
        </div>

        <div className="relative overflow-hidden rounded-xl border border-neon-cyan/30 bg-black/55 p-2.5">
          <div className="absolute inset-y-0 left-0 w-1 bg-neon-cyan shadow-[0_0_14px_rgba(0,240,255,0.8)]" />
          <div className="flex items-center justify-between gap-3 pl-2">
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">Survivor Look</span>
            <span
              className={`rounded border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                hasUnsavedChanges
                  ? 'border-neon-amber/50 bg-neon-amber/10 text-neon-amber'
                  : 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan'
              }`}
            >
              {hasUnsavedChanges ? 'Unsaved' : 'Equipped'}
            </span>
          </div>
          <button
            onClick={save}
            disabled={!dirty || saved || saving}
            className={`mt-2 w-full rounded-lg border px-4 py-1.5 text-xs font-black tracking-wider ${
              hasUnsavedChanges
                ? 'border-neon-green bg-neon-green/10 text-neon-green shadow-neon'
                : 'border-neon-cyan/25 bg-neon-cyan/5 text-neon-cyan/60'
            }`}
          >
            {saving ? 'EQUIPPING…' : 'EQUIP LOOK'}
          </button>
        </div>
      </section>

        <section className="space-y-3">
        <Picker title="Skin tone">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {SKIN_TONES.map((tone) => (
              <button
                key={tone.key}
                onClick={() => updateDraft({ skinTone: tone.key })}
                className={`rounded-lg border p-1.5 text-[9px] font-bold ${
                  draft.skinTone === tone.key
                    ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                    : 'border-white/10 text-white/50'
                }`}
              >
                <span className="mx-auto mb-1 block h-5 w-5 rounded-full border border-white/20" style={{ background: tone.color }} />
                {tone.label}
              </button>
            ))}
          </div>
        </Picker>

        <div className="grid gap-3 sm:grid-cols-2">
          <Picker title="Hair">
            <div className="grid grid-cols-3 gap-2">
              {HAIR_STYLES.map((style) => (
                <button
                  key={style.key}
                  onClick={() => updateDraft({ hair: style.key })}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold ${
                    draft.hair === style.key ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' : 'border-white/10 text-white/50'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </Picker>
          <Picker title="Hair color">
            <div className="grid grid-cols-3 gap-2">
              {HAIR_COLORS.map((color) => (
                <button
                  key={color.key}
                  title={color.label}
                  onClick={() => updateDraft({ hairColor: color.key })}
                  className={`flex items-center gap-1.5 rounded-lg border p-1.5 text-[9px] ${
                    draft.hairColor === color.key ? 'border-neon-cyan text-neon-cyan' : 'border-white/10 text-white/45'
                  }`}
                >
                  <span className="h-4 w-4 rounded-full" style={{ background: color.color }} />
                  {color.label}
                </button>
              ))}
            </div>
          </Picker>
        </div>

        <Picker title="Face Expression">
          <p className="-mt-1 mb-2 text-[9px] uppercase tracking-[0.18em] text-white/35">
            Choose the look you give the dead.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {EXPRESSIONS.map((expression) => {
              const active = draft.expression === expression.key;
              return (
                <button
                  key={expression.key}
                  onClick={() => updateDraft({ expression: expression.key })}
                  title={expression.description}
                  className={`group relative flex min-h-[72px] flex-col items-center rounded-lg border p-1.5 text-center transition ${
                    active
                      ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_16px_rgba(0,240,255,0.16)]'
                      : 'border-white/10 bg-black/25 hover:border-neon-cyan/50'
                  }`}
                >
                  {active && (
                    <span className="absolute right-1 top-1 text-[8px] font-black text-neon-cyan">✓</span>
                  )}
                  <span
                    className={`flex h-7 min-w-10 items-center justify-center rounded-md border bg-black/35 px-2 font-mono text-sm ${
                      active ? 'border-neon-cyan/50 text-neon-cyan' : 'border-white/10 text-white/45'
                    }`}
                  >
                    {expression.icon}
                  </span>
                  <span className={`mt-1 text-[9px] font-black leading-tight ${active ? 'text-neon-cyan' : 'text-white/80'}`}>
                    {expression.label}
                  </span>
                  <p className="mt-0.5 h-[1.7rem] overflow-hidden text-[8px] leading-[0.85rem] text-white/40 xl:hidden">
                    {expression.description}
                  </p>
                  {expression.outfitReactive && (
                    <span className="mt-1 inline-block rounded border border-neon-cyan/40 bg-neon-cyan/10 px-1 py-0.5 text-[6px] font-black uppercase tracking-wider text-neon-cyan">
                      ◈ Outfit-reactive
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Picker>

        <CosmeticPicker
          title="Outfits"
          items={ownedOutfits}
          selected={draft.outfit}
          onChoose={(key) => chooseCosmetic(key, 'outfit')}
        />
        <CosmeticPicker
          title="Accessories"
          items={ownedAccessories}
          selected={draft.accessory}
          onChoose={(key) => chooseCosmetic(key, 'accessory')}
        />
        </section>
      </div>

      {confirmLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-xl border border-neon-amber/50 bg-ink-800 p-5 text-center shadow-[0_0_30px_rgba(255,183,0,0.15)]">
            <h2 className="text-lg font-black tracking-wide text-neon-amber">UNSAVED SURVIVOR LOOK</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Your changes have not been equipped. Leaving now will discard them.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConfirmLeave(false)}
                className="flex-1 rounded-lg border border-neon-cyan/50 bg-neon-cyan/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-neon-cyan hover:bg-neon-cyan/20"
              >
                Keep Editing
              </button>
              <button
                onClick={onBack}
                className="flex-1 rounded-lg border border-neon-amber/50 bg-neon-amber/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-neon-amber hover:bg-neon-amber/20"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Picker({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800/65 p-3">
      <h2 className="mb-2 text-sm font-black uppercase tracking-widest text-neon-green">{title}</h2>
      {children}
    </div>
  );
}

function CosmeticPicker({
  title,
  items,
  selected,
  onChoose,
}: {
  title: string;
  items: ReturnType<typeof cosmeticsFor>;
  selected: string;
  onChoose: (key: string) => void;
}) {
  return (
    <Picker title={title}>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const active = selected === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChoose(item.key)}
              className={`rounded-lg border p-2 text-left transition ${
                active
                  ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_16px_rgba(0,240,255,0.14)]'
                  : 'border-white/20 bg-black/35 hover:border-neon-cyan/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-black ${active ? 'text-neon-cyan' : 'text-white'}`}>{item.name}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-neon-cyan">
                  {active ? 'selected' : 'owned'}
                </span>
              </div>
              <p className="mt-0.5 text-[9px] leading-snug text-white/60">{item.description}</p>
              {item.outfitReactive && (
                <span className="mt-1 inline-block rounded border border-neon-cyan/40 bg-neon-cyan/10 px-1 py-0.5 text-[7px] font-black uppercase tracking-widest text-neon-cyan">
                  ◈ Outfit-reactive
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Picker>
  );
}
