import { useEffect, useState } from 'react';

export const CONNECTION_FACT_DELAY_MS = 1_000;
const FACT_ROTATION_MS = 6_500;

export const SCARY_FACTS = [
  {
    title: 'REAL-LIFE MIND CONTROL',
    text: 'Cordyceps fungi can hijack an insect’s behavior before growing from its body to spread spores.',
  },
  {
    title: 'THE BODY MAKES WAX',
    text: 'In damp, oxygen-poor conditions, body fat can become adipocere: a soap-like “grave wax” that slows decay.',
  },
  {
    title: 'THE LAST FEAST',
    text: 'After death, bacteria already living inside the body help break it down from within.',
  },
  {
    title: 'CROWS REMEMBER YOU',
    text: 'Crows can recognize human faces, remember threats for years, and teach other crows who to avoid.',
  },
  {
    title: 'KNOCKING IN THE WALLS',
    text: 'Deathwatch beetles tap inside old wood to attract mates—a sound once feared as an omen of death.',
  },
  {
    title: 'VAMPIRE PANIC WAS REAL',
    text: 'European vampire scares led communities to exhume bodies and use stakes, stones, or burning to stop the “undead.”',
  },
  {
    title: 'PLAYING DEAD WORKS',
    text: 'Some animals use thanatosis—an eerily convincing death pose—to make predators lose interest.',
  },
  {
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
      <div className="absolute inset-0 opacity-20">
        <div className="absolute left-[16%] top-[31%] h-px w-[30%] bg-neon-green/40" />
        <div className="absolute bottom-[29%] right-[14%] h-px w-[34%] bg-neon-cyan/25" />
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
          <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-xl border border-white/10 bg-black/55 text-left shadow-[0_0_20px_rgba(0,240,255,0.08)] backdrop-blur-sm">
            <div key={fact.title} className="animate-fadeIn px-4 py-3.5">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.24em] text-neon-cyan/80">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-green shadow-[0_0_10px_rgba(57,255,20,0.75)]" />
                Fun facts while you wait
              </div>
              <h2 className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-white/85">{fact.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-white/55">{fact.text}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
