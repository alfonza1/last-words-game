import type { ReactNode } from 'react';

interface Props {
  onBack: () => void;
}

const STEPS: [string, string][] = [
  ['Read the queue', 'Always type the first highlighted word.'],
  ['Type, then SPACE', 'Submit the word to fire at the nearest zombie.'],
  ['Stay in order', 'Each hit advances the queue and adds a new word.'],
  ['Fix mistakes', 'Backspace and correct typos before submitting again.'],
  ['Hold the line', 'Stop every zombie before your health reaches zero.'],
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
  ['Shotgun', '10-streak: next kill blasts nearby zombies.'],
  ['Shield', '15 clean words: blocks one hit.'],
  ['Double Damage', 'High WPM makes shots hit twice.'],
  ['Slow Motion', 'High accuracy briefly slows time.'],
  ['Headshot', 'Fast clears earn bonus points.'],
  ['Grenade', 'Type “grenade” to clear a cluster.'],
  ['Freeze', 'Type “freeze” to stop the horde for 3s.'],
  ['Med Kit', 'Type “medkit” to restore health.'],
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
    <section className={`rounded-xl border border-white/10 bg-ink-800/60 p-3 ${className}`}>
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function HowToPlay({ onBack }: Props) {
  return (
    <div className="crt relative mx-auto flex h-full w-full max-w-6xl flex-col gap-3 overflow-y-auto p-4 lg:overflow-hidden">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-md border border-white/15 bg-black/50 px-3 py-1.5 text-sm text-white/70 hover:border-neon-green hover:text-neon-green"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-wide text-neon-green sm:text-3xl">HOW TO PLAY</h1>
          <p className="text-xs text-white/50">Type the words. Drop the dead. Don’t let them in.</p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1.15fr_0.85fr_1fr]">
        <div className="space-y-3">
          <Card title="The Basics" color="#39ff14">
            <ol className="space-y-2">
              {STEPS.map(([title, desc], i) => (
                <li key={title} className="flex gap-2">
                  <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border border-neon-green/50 text-[10px] font-bold text-neon-green">
                    {i + 1}
                  </span>
                  <p className="text-xs leading-snug text-white/75">
                    <span className="font-bold text-white/95">{title}.</span>{' '}
                    <span className="text-white/60">{desc}</span>
                  </p>
                </li>
              ))}
            </ol>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Card title="Difficulty" color="#00f0ff">
              <ul className="space-y-1 text-xs leading-snug text-white/70">
                <li><span className="font-bold text-neon-cyan">Easy</span> — words only.</li>
                <li><span className="font-bold text-neon-cyan">Normal</span> — words + numbers.</li>
                <li><span className="font-bold text-neon-cyan">Nightmare</span> — exact-case symbols and 2× coins.</li>
              </ul>
            </Card>

            <Card title="Controls" color="#ffb300">
              <ul className="space-y-1 text-xs leading-snug text-white/70">
                <li><kbd className="rounded bg-black/60 px-1 py-0.5 text-neon-green">SPACE</kbd> — submit and fire.</li>
                <li><kbd className="rounded bg-black/60 px-1 py-0.5 text-neon-green">Esc</kbd> / <span className="text-neon-green">⏸</span> — pause.</li>
                <li>Type a powerup name to spend one charge.</li>
              </ul>
            </Card>
          </div>
        </div>

        <Card title="Zombie Types" color="#ff2bd6" className="self-start">
          <ul className="space-y-2">
            {ZOMBIE_INFO.map(([name, desc]) => (
              <li key={name} className="text-xs leading-snug">
                <span className="font-bold text-neon-cyan">{name}</span>
                <span className="text-white/30"> — </span>
                <span className="text-white/60">{desc}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Powerups" color="#39ff14" className="self-start">
          <ul className="space-y-2">
            {POWERUPS.map(([name, desc]) => (
              <li key={name} className="text-xs leading-snug">
                <span className="font-bold text-neon-green">{name}</span>
                <span className="text-white/30"> — </span>
                <span className="text-white/60">{desc}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
