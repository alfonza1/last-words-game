import { useState, type ReactNode } from 'react';

interface Props {
  onBack: () => void;
  /** Mobile speech experience has no typing — controls/consumables use taps & voice. */
  mobileSpeechExperience?: boolean;
}

type GuideSection = 'defense' | 'rules' | 'zombies' | 'powerups';

const DEFENSE: [string, string][] = [
  ['Typing Defense', 'Type the highlighted word, then press SPACE. Each completed word fires at the nearest zombie; an empty field pulls the next threat in immediately.'],
  ['Riddle Defense', 'Solve the riddle, then press SPACE. A solve fires a volley: 5 / 8 / 12 shots on Easy / Normal / Nightmare.'],
  ['Math Defense', 'Solve the arithmetic, then press SPACE. Harder math each difficulty; a solve fires 3 / 4 / 6 shots.'],
  ['Trivia Defense', 'Answer the question, then press SPACE. Tougher questions each difficulty; a solve fires 3 / 5 / 8 shots.'],
  ['Even by Design', 'Volley sizes are tuned so every style clears about the same zombies per minute as typing — pick what you enjoy.'],
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

const AUTO_POWERUPS: [string, string][] = [
  ['Shotgun', 'Every 10-word streak arms the next kill to blast nearby zombies.'],
  ['Shield', 'Every 15 mistake-free words grants one shield charge. Bosses ignore shields.'],
  ['Double Damage', 'Maintaining at least 55 WPM can trigger 5 seconds of double shot damage.'],
  ['Slow Motion', 'At 95% accuracy after 12 words, slow motion can trigger for 5 seconds.'],
  ['Headshot', 'Clear a target quickly for bonus points.'],
];

const CONSUMABLES: [string, string][] = [
  ['grenade', 'Clears a nearby cluster of zombies.'],
  ['freeze', 'Stops every zombie for 3 seconds.'],
  ['medkit', 'Restores 35 base health.'],
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
    <section className={`h-full min-h-0 overflow-y-auto rounded-xl border border-white/10 bg-ink-800/65 p-4 ${className}`}>
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

export function HowToPlay({ onBack, mobileSpeechExperience = false }: Props) {
  const [mobileSection, setMobileSection] = useState<GuideSection>('defense');
  const visible = (section: GuideSection) => (mobileSection === section ? 'block' : 'hidden');
  // On the mobile speech experience there's no typing mode, so drop it from the
  // list of defenses you can pick.
  const defense = mobileSpeechExperience ? DEFENSE.filter(([title]) => title !== 'Typing Defense') : DEFENSE;

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
          ['rules', 'Controls'],
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
          <InfoList items={defense} accent="#39ff14" />
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
          title="Controls"
          color="#00f0ff"
          className={`${visible('rules')} xl:block`}
        >
          {mobileSpeechExperience ? (
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-neon-cyan">Voice & Touch</h3>
                <ul className="space-y-2 text-[13px] leading-snug sm:text-sm">
                  <li><span className="font-bold text-neon-cyan">Hold</span><span className="text-white/60"> the answer button and say your answer; release to fire a volley.</span></li>
                  <li><span className="font-bold text-neon-cyan">Tap</span><span className="text-white/60"> a powerup to spend a charge.</span></li>
                  <li><span className="text-neon-green">⏸</span><span className="text-white/60"> — opens the menu, but the horde keeps advancing.</span></li>
                </ul>
              </div>
              <p className="text-[11px] leading-snug text-white/45">
                No microphone? A text box appears so you can tap in your answer instead.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-neon-green">Typing Defense</h3>
                <ul className="space-y-2 text-[13px] leading-snug sm:text-sm">
                  <li><kbd className="rounded bg-black/60 px-1.5 py-0.5 text-neon-green">SPACE</kbd><span className="text-white/60"> — fire at the nearest zombie.</span></li>
                  <li><kbd className="rounded bg-black/60 px-1.5 py-0.5 text-neon-green">Esc</kbd><span className="text-white/60"> / </span><span className="text-neon-green">⏸</span><span className="text-white/60"> — pause (the horde freezes).</span></li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-neon-pink">Riddle · Math · Trivia</h3>
                <ul className="space-y-2 text-[13px] leading-snug sm:text-sm">
                  <li><kbd className="rounded bg-black/60 px-1.5 py-0.5 text-neon-green">SPACE</kbd><span className="text-white/60"> or </span><kbd className="rounded bg-black/60 px-1.5 py-0.5 text-neon-green">ENTER</kbd><span className="text-white/60"> — submit your answer (fires a volley).</span></li>
                  <li><kbd className="rounded bg-black/60 px-1.5 py-0.5 text-neon-green">Esc</kbd><span className="text-white/60"> / </span><span className="text-neon-green">⏸</span><span className="text-white/60"> — opens the menu, but the horde keeps advancing.</span></li>
                </ul>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Powerups & Consumables"
          color="#ffb300"
          className={`${visible('powerups')} xl:block`}
        >
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-neon-green">Earned in play</h3>
              <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
                {AUTO_POWERUPS.map(([name, description]) => (
                  <div key={name} className="text-[13px] leading-snug sm:text-sm">
                    <span className="font-bold text-neon-green">{name}</span>
                    <span className="text-white/30"> — </span>
                    <span className="text-white/60">{description}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-black uppercase tracking-widest text-neon-amber">Consumables</h3>
              <p className="mb-2 text-[11px] leading-snug text-white/45">
                {mobileSpeechExperience
                  ? 'Bought in the Store. Tap a powerup during a run to spend one charge.'
                  : 'Bought in the Store. In any mode, type the command to spend one charge.'}
              </p>
              <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
                {CONSUMABLES.map(([cmd, description]) => (
                  <div key={cmd} className="text-[13px] leading-snug sm:text-sm">
                    <span className="font-bold text-neon-green">
                      {mobileSpeechExperience ? cmd.charAt(0).toUpperCase() + cmd.slice(1) : `type “${cmd}”`}
                    </span>
                    <span className="text-white/30"> — </span>
                    <span className="text-white/60">{description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
