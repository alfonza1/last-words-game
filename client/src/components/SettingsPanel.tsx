import type { Settings } from '../types';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  onBack: () => void;
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
      className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-ink-800/70 px-4 py-3 text-left hover:border-neon-green/40"
    >
      <div>
        <div className="font-bold text-white/90">{label}</div>
        <div className="text-xs text-white/50">{desc}</div>
      </div>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-neon-green' : 'bg-white/15'}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-black transition-all ${value ? 'left-[22px]' : 'left-0.5'}`}
        />
      </span>
    </button>
  );
}

export function SettingsPanel({ settings, onChange, onBack }: Props) {
  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-2xl flex-col gap-5 overflow-y-auto p-6">
      <h1 className="text-3xl font-black tracking-wide text-neon-green">SETTINGS</h1>
      <p className="text-xs text-white/40">
        Difficulty is chosen on the main menu; the map is chosen when you deploy.
      </p>

      <section className="space-y-2">
        <Toggle
          label="Music"
          desc="Procedural horror ambience."
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
          desc="Gunshot when you complete a word."
          value={settings.sound}
          onToggle={() => onChange({ ...settings, sound: !settings.sound })}
        />
        <div className="rounded-lg border border-white/10 bg-ink-800/70 px-4 py-3">
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-bold text-white/90">Gunshot Volume</span>
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

      <button className="menu-btn mt-2 max-w-xs self-center text-center" onClick={onBack}>
        ← Back to Menu
      </button>
    </div>
  );
}
