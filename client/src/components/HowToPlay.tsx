import { useState, type ReactNode } from 'react';

interface Props {
  onBack: () => void;
}

type GuideSection = 'defense' | 'rules' | 'zombies' | 'powerups';

const DEFENSE: [string, string][] = [
  ['Typing Defense', 'Type the first highlighted target, then press SPACE. Each completed target fires one shot at the nearest visible zombie.'],
  ['Riddle Defense', 'Type the answer, then press SPACE. Answers ignore case, spaces, and leading articles; accepted synonyms also work.'],
  ['Riddle Volleys', 'A solved riddle fires 5 shots on Easy, 8 on Normal, or 12 on Nightmare.'],
  ['Keep the Queue Moving', 'A successful target leaves the queue and a fresh one appears at the end.'],
  ['Recover from Mistakes', 'Incorrect text stays in the input so you can backspace and fix it. Nightmare mistakes fully reset your streak.'],
  ['Hold the Line', 'Zombies damage the base when they arrive. A boss reaching it ends the run instantly.'],
];

const ZOMBIES: [string, string][] = [
  ['Walker', 'Steady pace · 1 shot'],
  ['Runner', 'Fast and fragile · 1 shot'],
  ['Crawler', 'Small, low target · 1 shot'],
  ['Glitch', 'Flickering threat · 2 shots'],
  ['Armored', 'Heavy plating · 2 shots'],
  ['Screamer', 'Spawns two runners if left alive · 2 shots'],
  ['Tank', 'Slow, durable, heavy base damage · 3 shots'],
  ['Boss', 'Large health bar · reaching the base is instant defeat'],
];

const POWERUPS: [string, string][] = [
  ['Shotgun', 'Every 10-word streak arms the next kill to blast nearby zombies.'],
  ['Shield', 'Every 15 mistake-free words grants one shield charge. Bosses ignore shields.'],
  ['Double Damage', 'Maintaining at least 55 WPM can trigger 5 seconds of double shot damage.'],
  ['Slow Motion', 'At 95% accuracy after 12 words, slow motion can trigger for 5 seconds.'],
  ['Headshot', 'Clear a target quickly for bonus points.'],
  ['Grenade', 'Store consumable · type “grenade” to clear a nearby cluster.'],
  ['Freeze', 'Store consumable · type “freeze” to stop every zombie for 3 seconds.'],
  ['Med Kit', 'Store consumable · type “medkit” to restore 35 base health.'],
];

function Card({
  title,
  color,
  className = '',
  children,
}: {
  title: string;
  color: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`h-full rounded-xl border border-white/10 bg-ink-800/65 p-4 ${className}`}>
      <h2 className="mb-3 text-sm font-black uppercase tracking-[0.22em]" style={{ color }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoList({ items, accent }: { items: [string, string][]; accent: string }) {
  return (
    <ul className="space-y-2.5">
      {items.map(([name, description]) => (
        <li key={name} className="text-[13px] leading-snug sm:text-sm">
          <span className="font-bold" style={{ color: accent }}>
            {name}
          </span>
          <span className="text-white/30"> — </span>
          <span className="text-white/65">{description}</span>
        </li>
      ))}
    </ul>
  );
}

export function HowToPlay({ onBack }: Props) {
  const [mobileSection, setMobileSection] = useState<GuideSection>('defense');
  const visible = (section: GuideSection) => (mobileSection === section ? 'block' : 'hidden');

  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-6xl flex-col gap-3 overflow-hidden p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-md border border-white/15 bg-black/50 px-3 py-1.5 text-sm text-white/70 hover:border-neon-green hover:text-neon-green"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-wide text-neon-green sm:text-4xl">HOW TO PLAY</h1>
          <p className="text-sm text-white/50">Choose your defense. Drop the dead. Keep the bunker standing.</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 xl:hidden">
        {[
          ['defense', 'Defense'],
          ['rules', 'Rules'],
          ['zombies', 'Zombies'],
          ['powerups', 'Powerups'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMobileSection(key as GuideSection)}
            className={`rounded-md border px-1 py-2 text-[9px] font-black uppercase tracking-wide ${
              mobileSection === key
                ? 'border-neon-green bg-neon-green/10 text-neon-green'
                : 'border-white/15 text-white/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-2 xl:grid-rows-2">
        <Card
          title="Defense Protocol"
          color="#39ff14"
          className={`${visible('defense')} xl:block`}
        >
          <InfoList items={DEFENSE} accent="#39ff14" />
        </Card>

        <Card
          title="Zombie Threats"
          color="#ff2bd6"
          className={`${visible('zombies')} xl:block`}
        >
          <div className="grid gap-x-5 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-2">
            {ZOMBIES.map(([name, description]) => (
              <div key={name} className="text-[13px] leading-snug sm:text-sm">
                <div className="font-bold text-neon-cyan">{name}</div>
                <div className="text-white/60">{description}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Modes, Difficulty & Controls"
          color="#00f0ff"
          className={`${visible('rules')} xl:block`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-neon-cyan">Difficulty</h3>
              <ul className="space-y-2 text-[13px] leading-snug sm:text-sm">
                <li><span className="font-bold text-white">Easy</span><span className="text-white/60"> — words only, 120 health.</span></li>
                <li><span className="font-bold text-white">Normal</span><span className="text-white/60"> — words and numbers, 100 health.</span></li>
                <li>
                  <span className="font-bold text-neon-pink">Nightmare</span>
                  <span className="text-white/60"> — exact-case words, numbers, and symbols, 80 health, and 2× coins and points.</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-neon-amber">Controls</h3>
              <ul className="space-y-2 text-[13px] leading-snug sm:text-sm">
                <li><kbd className="rounded bg-black/60 px-1.5 py-0.5 text-neon-green">SPACE</kbd><span className="text-white/60"> — submit a word or riddle answer.</span></li>
                <li><kbd className="rounded bg-black/60 px-1.5 py-0.5 text-neon-green">Esc</kbd><span className="text-white/60"> / </span><span className="text-neon-green">⏸</span><span className="text-white/60"> — pause, resume, restart, or quit.</span></li>
                <li><span className="text-white/60">Owned consumables appear in-game. Type their command to spend one charge.</span></li>
              </ul>
            </div>
          </div>
        </Card>

        <Card
          title="Powerups & Consumables"
          color="#ffb300"
          className={`${visible('powerups')} xl:block`}
        >
          <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
            {POWERUPS.map(([name, description]) => (
              <div key={name} className="text-[13px] leading-snug sm:text-sm">
                <span className="font-bold text-neon-green">{name}</span>
                <span className="text-white/30"> — </span>
                <span className="text-white/60">{description}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
