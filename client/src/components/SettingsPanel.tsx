import { useState } from 'react';
import type { Settings } from '../types';

interface Props {
  settings: Settings;
  signedIn: boolean;
  username: string;
  onChange: (s: Settings) => void;
  onSaveUsername: (name: string) => Promise<void>;
  onBack: () => void;
}

function UsernameEditor({
  signedIn,
  username,
  onSave,
}: {
  signedIn: boolean;
  username: string;
  onSave: (name: string) => Promise<void>;
}) {
  const [value, setValue] = useState(username);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <div className="rounded-lg border border-white/10 bg-ink-800/70 px-4 py-3 text-sm text-white/50">
        <span className="font-bold text-white/80">Username</span>
        <p className="mt-1 text-xs">Sign in to choose a username.</p>
      </div>
    );
  }

  const save = async () => {
    const name = value.trim();
    setErr(null);
    setMsg(null);
    if (name.length < 2 || name.length > 20) {
      setErr('Username must be 2–20 characters.');
      return;
    }
    setBusy(true);
    try {
      await onSave(name);
      setMsg('Saved!');
    } catch (e) {
      setErr((e as Error)?.message || 'Couldn’t save — please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-ink-800/70 px-4 py-3">
      <div className="mb-2 font-bold text-white/90">Username</div>
      <div className="flex gap-2">
        <input
          value={value}
          maxLength={20}
          onChange={(e) => setValue(e.target.value)}
          placeholder="your name"
          className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-sm text-neon-green outline-none placeholder:text-white/30 focus:border-neon-green/60"
        />
        <button
          onClick={save}
          disabled={busy || value.trim() === username.trim()}
          className="rounded-md border border-neon-green bg-neon-green/10 px-4 text-sm font-bold text-neon-green hover:bg-neon-green/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? '…' : 'Save'}
        </button>
      </div>
      {msg && <div className="mt-1 text-xs text-neon-green">{msg}</div>}
      {err && <div className="mt-1 text-xs text-neon-red">{err}</div>}
      <p className="mt-1 text-[11px] text-white/40">Shown on the leaderboard and your account.</p>
    </div>
  );
}

function Toggle({
  label,
  desc,
  value,
  onToggle,
}: {
  label: string;
  desc: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-ink-800/70 px-4 py-3 text-left hover:border-neon-green/40"
    >
      <div className="min-w-0">
        <div className="font-bold text-white/90">{label}</div>
        <div className="text-xs text-white/50">{desc}</div>
      </div>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${value ? 'bg-neon-green' : 'bg-white/15'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-black transition-all ${value ? 'left-[22px]' : 'left-0.5'}`}
        />
      </span>
    </button>
  );
}

export function SettingsPanel({ settings, signedIn, username, onChange, onSaveUsername, onBack }: Props) {
  const sfxLabel = settings.familyFriendlyMode ? 'Zap Volume' : 'Gunshot Volume';

  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-2xl flex-col gap-5 overflow-y-auto p-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-md border border-white/15 bg-black/50 px-3 py-1.5 text-sm text-white/70 hover:border-neon-green hover:text-neon-green"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-black tracking-wide text-neon-green">SETTINGS</h1>
      </div>
      <p className="text-xs text-white/40">
        Difficulty is chosen on the main menu; the map or planet is chosen when you deploy.
      </p>

      <section className="space-y-2">
        <UsernameEditor signedIn={signedIn} username={username} onSave={onSaveUsername} />
      </section>

      <section className="space-y-2">
        <Toggle
          label="Family Friendly Mode"
          desc="Meteor Mania: zap meteors, protect planets, and use space-themed gear."
          value={settings.familyFriendlyMode}
          onToggle={() => onChange({ ...settings, familyFriendlyMode: !settings.familyFriendlyMode })}
        />
        <Toggle
          label="Music"
          desc={settings.familyFriendlyMode ? 'Procedural space ambience.' : 'Procedural horror ambience.'}
          value={settings.music}
          onToggle={() => onChange({ ...settings, music: !settings.music })}
        />
        <div className="rounded-lg border border-white/10 bg-ink-800/70 px-4 py-3">
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-bold text-white/90">Music Volume</span>
            <span className="text-white/50">{Math.round(settings.musicVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.musicVolume}
            onChange={(e) => onChange({ ...settings, musicVolume: Number(e.target.value) })}
            disabled={!settings.music}
            className="w-full accent-neon-green disabled:opacity-40"
          />
        </div>

        <Toggle
          label="Screen Shake"
          desc="Camera shake on big hits."
          value={settings.screenShake}
          onToggle={() => onChange({ ...settings, screenShake: !settings.screenShake })}
        />

        <Toggle
          label="Sound Effects"
          desc={settings.familyFriendlyMode ? 'Zap sound when you complete a word.' : 'Gunshot when you complete a word.'}
          value={settings.sound}
          onToggle={() => onChange({ ...settings, sound: !settings.sound })}
        />
        <div className="rounded-lg border border-white/10 bg-ink-800/70 px-4 py-3">
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-bold text-white/90">{sfxLabel}</span>
            <span className="text-white/50">{Math.round(settings.sfxVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.sfxVolume}
            onChange={(e) => onChange({ ...settings, sfxVolume: Number(e.target.value) })}
            disabled={!settings.sound}
            className="w-full accent-neon-green disabled:opacity-40"
          />
        </div>
      </section>
    </div>
  );
}
