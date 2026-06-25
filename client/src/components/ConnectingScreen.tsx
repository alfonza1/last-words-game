import { useEffect, useState } from 'react';

export const CONNECTION_FACT_DELAY_MS = 3_000;
const FACT_ROTATION_MS = 5_500;

export const SCARY_FACTS = [
  {
    label: 'INFECTION FILE',
    title: 'REAL-LIFE MIND CONTROL',
    text: 'Cordyceps fungi can hijack an insect’s behavior before growing from its body to spread spores.',
  },
  {
    label: 'MORGUE NOTE',
    title: 'THE BODY MAKES WAX',
    text: 'In damp, oxygen-poor conditions, body fat can become adipocere: a soap-like “grave wax” that slows decay.',
  },
  {
    label: 'AUTOPSY LOG',
    title: 'THE LAST FEAST',
    text: 'After death, bacteria already living inside the body help break it down from within.',
  },
  {
    label: 'SURVIVOR INTEL',
    title: 'CROWS REMEMBER YOU',
    text: 'Crows can recognize human faces, remember threats for years, and teach other crows who to avoid.',
  },
  {
    label: 'NIGHT WATCH',
    title: 'KNOCKING IN THE WALLS',
    text: 'Deathwatch beetles tap inside old wood to attract mates—a sound once feared as an omen of death.',
  },
  {
    label: 'ARCHIVE 1732',
    title: 'VAMPIRE PANIC WAS REAL',
    text: 'European vampire scares led communities to exhume bodies and use stakes, stones, or burning to stop the “undead.”',
  },
  {
    label: 'WILDLIFE ALERT',
    title: 'PLAYING DEAD WORKS',
    text: 'Some animals use thanatosis—an eerily convincing death pose—to make predators lose interest.',
  },
  {
    label: 'DEEP TIME',
    title: 'SHARKS PRE-DATE TREES',
    text: 'Shark ancestors were already swimming through ancient seas millions of years before the first trees appeared.',
  },
] as const;

export function nextScaryFactIndex(current: number, randomValue: number, length = SCARY_FACTS.length): number {
  if (length <= 1) return 0;
  const offset = 1 + Math.floor(Math.max(0, Math.min(0.999999, randomValue)) * (length - 1));
  return (current + offset) % length;
}

export function ConnectingScreen() {
  const [showFact, setShowFact] = useState(false);
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * SCARY_FACTS.length));

  useEffect(() => {
    let rotationId: ReturnType<typeof setInterval> | undefined;
    const factId = setTimeout(() => {
      setShowFact(true);
      rotationId = setInterval(
        () => setFactIndex((current) => nextScaryFactIndex(current, Math.random())),
        FACT_ROTATION_MS,
      );
    }, CONNECTION_FACT_DELAY_MS);

    return () => {
      clearTimeout(factId);
      if (rotationId !== undefined) clearInterval(rotationId);
    };
  }, []);

  const fact = SCARY_FACTS[factIndex];

  return (
    <div className="crt relative flex h-full w-full items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="absolute inset-0 opacity-25">
        <div className="absolute left-[8%] top-[18%] h-px w-[34%] bg-neon-green/50" />
        <div className="absolute right-[10%] top-[32%] h-px w-[28%] bg-neon-pink/40" />
        <div className="absolute bottom-[20%] left-[18%] h-px w-[50%] bg-neon-cyan/30" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        <h1 className="text-4xl font-black tracking-tight text-neon-green drop-shadow-[0_0_18px_rgba(57,255,20,0.6)]">
          DEAD<span className="text-neon-pink"> KEYS</span>
        </h1>

        <div className="mt-4 animate-pulse text-sm font-black tracking-[0.28em] text-neon-green">CONNECTING…</div>

        <div className="mx-auto mt-5 flex w-40 items-center gap-2">
          {[0, 1, 2, 3, 4].map((bar) => (
            <span
              key={bar}
              className="h-1.5 flex-1 animate-pulse rounded-full bg-neon-green/50"
              style={{ animationDelay: `${bar * 120}ms` }}
            />
          ))}
        </div>

        {showFact && (
          <div className="relative mt-5 overflow-hidden rounded-2xl border border-neon-pink/35 bg-black/70 text-left shadow-[0_0_32px_rgba(255,43,214,0.13)] backdrop-blur-sm">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-neon-pink/10 blur-2xl" />
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[10px] font-black tracking-[0.2em]">
              <span className="text-neon-pink">DEAD AIR // INTERCEPTED</span>
              <span className="animate-pulse text-neon-green">SIGNAL LIVE</span>
            </div>

            <div key={fact.title} className="relative animate-fadeIn p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neon-red/40 bg-neon-red/10 text-2xl shadow-[0_0_18px_rgba(255,56,96,0.2)]">
                  ☠
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.28em] text-neon-cyan">{fact.label}</div>
                  <h2 className="mt-1 text-lg font-black tracking-wide text-neon-amber">{fact.title}</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/70">{fact.text}</p>
              <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-3">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Know the horror</span>
                <div className="h-px flex-1 bg-gradient-to-r from-neon-pink/50 to-transparent" />
                <span className="text-[9px] uppercase tracking-wider text-white/30">uplink still waking…</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
