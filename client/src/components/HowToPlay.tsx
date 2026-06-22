import type { ReactNode } from 'react';

interface Props {
  onBack: () => void;
}

const STEPS: [string, string][] = [
  ['Read the queue', 'Five words sit at the bottom. You always type the FIRST (highlighted) one.'],
  ['Type it, then SPACE', 'Finish the word and press SPACE to fire. Each shot kills the nearest zombie.'],
  ['Keep the order', 'On a hit the list shifts left and a new word appears at the end — never out of order.'],
  ['Fix mistakes', 'A wrong word turns the box red and dents accuracy, but keeps your text so you can correct it.'],
  ['Survive', 'Stop zombies before they reach the base. Lose all health and it’s game over.'],
];

const ZOMBIE_INFO: [string, string][] = [
  ['Walker', 'Slow. 1 hit.'],
  ['Runner', 'Fast — react quickly. 1 hit.'],
  ['Crawler', 'Tiny, low to the ground. 1 hit.'],
  ['Glitch', 'Flickering cyan horror. 1 hit.'],
  ['Armored', 'Plated — 2 hits.'],
  ['Screamer', 'Spawns more if not killed fast. 2 hits.'],
  ['Tank', 'Big & slow. 3 hits.'],
  ['Boss', 'Huge HP bar. Reaches you = instant game over.'],
];

const POWERUPS: [string, string][] = [
  ['Shotgun', '10-streak → next kill blasts nearby zombies.'],
  ['Shield', '15 mistake-free words → blocks one hit.'],
  ['Double Damage', 'High WPM → hits count double.'],
  ['Slow Motion', 'High accuracy → time slows briefly.'],
  ['Grenade', '20-combo → type “grenade” to clear a cluster.'],
  ['Freeze', 'When offered → type “freeze” to stop all zombies.'],
  ['Survive', 'Low health → type “survive” to push zombies back.'],
  ['Headshot', 'Clear a word lightning-fast for bonus points.'],
];

function Card({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-ink-800/60 p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function HowToPlay({ onBack }: Props) {
  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-4xl flex-col gap-5 overflow-y-auto p-6">
      <div>
        <h1 className="text-3xl font-black tracking-wide text-neon-green">HOW TO PLAY</h1>
        <p className="mt-1 text-sm text-white/50">Type the words. Shoot the dead. Don’t let them in.</p>
      </div>

      {/* Basics — numbered steps */}
      <Card title="The Basics" color="#39ff14">
        <ol className="space-y-2.5">
          {STEPS.map(([title, desc], i) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-neon-green/50 text-xs font-bold text-neon-green">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-white/75">
                <span className="font-bold text-white/95">{title}.</span>{' '}
                <span className="text-white/60">{desc}</span>
              </p>
            </li>
          ))}
        </ol>
      </Card>

      {/* Difficulty + controls */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Difficulty" color="#00f0ff">
          <ul className="space-y-1.5 text-sm text-white/70">
            <li><span className="font-bold text-neon-cyan">Easy</span> — words only.</li>
            <li><span className="font-bold text-neon-cyan">Normal</span> — words + numbers.</li>
            <li><span className="font-bold text-neon-cyan">Nightmare</span> — words, numbers &amp; symbols, exact case.</li>
            <li className="pt-1 text-xs text-white/40">Set difficulty on the menu; pick your map when you deploy.</li>
          </ul>
        </Card>

        <Card title="Controls" color="#ffb300">
          <ul className="space-y-1.5 text-sm text-white/70">
            <li><kbd className="rounded bg-black/60 px-1.5 py-0.5 text-neon-green">SPACE</kbd> — fire the current word.</li>
            <li><kbd className="rounded bg-black/60 px-1.5 py-0.5 text-neon-green">Esc</kbd> / <span className="text-neon-green">⏸</span> — pause (resume / restart / quit).</li>
            <li>Type <span className="text-neon-green">grenade / freeze / survive</span> to use those powerups.</li>
            <li>Mute &amp; volumes live in the HUD and Settings.</li>
          </ul>
        </Card>
      </div>

      {/* Zombies + powerups */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Zombie Types" color="#ff2bd6">
          <ul className="space-y-1.5">
            {ZOMBIE_INFO.map(([name, desc]) => (
              <li key={name} className="flex gap-2 text-sm">
                <span className="w-20 flex-none font-bold text-neon-cyan">{name}</span>
                <span className="text-white/60">{desc}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Powerups" color="#39ff14">
          <ul className="space-y-1.5">
            {POWERUPS.map(([name, desc]) => (
              <li key={name} className="flex gap-2 text-sm">
                <span className="w-28 flex-none font-bold text-neon-green">{name}</span>
                <span className="text-white/60">{desc}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <button className="menu-btn mt-1 max-w-xs self-center text-center" onClick={onBack}>
        ← Back to Menu
      </button>
    </div>
  );
}
