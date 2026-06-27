import { useEffect, useState } from 'react';

export const CONNECTION_FACT_DELAY_MS = 1_000;
const FACT_ROTATION_MS = 6_500;

export const SCARY_FACTS = [
  {
    title: 'REAL-LIFE MIND CONTROL',
    text: "Cordyceps fungi can hijack an insect's behavior before growing from its body to spread spores.",
  },
  {
    title: 'THE BODY MAKES WAX',
    text: 'In damp, oxygen-poor conditions, body fat can become adipocere: a soap-like grave wax that slows decay.',
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
    text: 'Deathwatch beetles tap inside old wood to attract mates, a sound once feared as an omen of death.',
  },
  {
    title: 'VAMPIRE PANIC WAS REAL',
    text: 'European vampire scares led communities to exhume bodies and use stakes, stones, or burning to stop the undead.',
  },
  {
    title: 'PLAYING DEAD WORKS',
    text: 'Some animals use thanatosis, an eerily convincing death pose, to make predators lose interest.',
  },
  {
    title: 'SHARKS PRE-DATE TREES',
    text: 'Shark ancestors were already swimming through ancient seas millions of years before the first trees appeared.',
  },
  {
    title: 'YOUR BONES ARE ALIVE',
    text: 'Bone constantly repairs and remodels itself, which is why a skeleton is more active than it looks.',
  },
  {
    title: 'THE MOON HAS QUAKES',
    text: 'The moon can shake from tidal stress, temperature swings, and old impacts.',
  },
  {
    title: 'RAIN HAS A NAME',
    text: 'The earthy smell after rain is called petrichor, and part of it comes from compounds made by soil microbes.',
  },
  {
    title: 'HONEY DOES NOT GIVE UP',
    text: 'Honey resists spoiling because it is acidic, low in water, and packed with sugar.',
  },
  {
    title: 'BONES CAN GLOW',
    text: 'Under ultraviolet light, some bones and teeth fluoresce because of minerals and preserved organic material.',
  },
  {
    title: 'THE DEEP SEA HAS SNOW',
    text: 'Marine snow is a slow fall of tiny organic particles that feeds life in the dark ocean.',
  },
  {
    title: 'A DAY WAS SHORTER',
    text: 'Earth used to spin faster long ago, so ancient days were shorter than the 24-hour days we know now.',
  },
  {
    title: 'FIRE CAN MAKE WEATHER',
    text: 'Large wildfires can build their own storm clouds when heat drives smoke and moisture high into the air.',
  },
  {
    title: 'THE SUN IS LOUD',
    text: 'The sun constantly rings with pressure waves, but space has no air to carry that sound to us.',
  },
  {
    title: 'ICE CAN BURN',
    text: 'Methane hydrate looks like ice, but it can burn because methane is trapped inside its crystal structure.',
  },
  {
    title: 'THE FIRST ALARM CLOCK',
    text: 'Before modern alarms, some people paid knockers-up to tap on windows and wake them for work.',
  },
  {
    title: 'MUSHROOMS TALK CHEMISTRY',
    text: 'Fungal networks can move chemical signals through threadlike mycelium when conditions change.',
  },
  {
    title: 'YOUR SKIN IS ARMOR',
    text: 'The outer layer of skin is mostly dead cells that form a tough barrier against the outside world.',
  },
  {
    title: 'METEORS FALL DAILY',
    text: 'Tiny bits of space dust enter Earth every day, usually burning up before anyone notices.',
  },
  {
    title: 'ANCIENT INK SURVIVES',
    text: 'Carbon-based ink can stay readable for centuries because its dark pigment is chemically stubborn.',
  },
  {
    title: 'LIGHTNING MAKES GLASS',
    text: 'When lightning hits sand, it can fuse grains into branching glass tubes called fulgurites.',
  },
  {
    title: 'THE BRAIN RUNS HOT',
    text: 'The brain uses a surprising share of the body energy supply, even when you are sitting still.',
  },
  {
    title: 'SALT PRESERVES',
    text: 'Salt can slow decay by pulling water away from microbes that need moisture to grow.',
  },
  {
    title: 'MAPS CAN LIE',
    text: 'Old mapmakers sometimes added fake streets or places to catch anyone copying their work.',
  },
  {
    title: 'THE DARK HAS COLORS',
    text: 'The faint gray you see in total darkness has a name: eigengrau, or intrinsic gray.',
  },
  {
    title: 'FROGS CAN FREEZE',
    text: 'Some frogs survive winter by letting parts of their bodies freeze while sugar-like compounds protect their cells.',
  },
  {
    title: 'A CLOUD CAN WEIGH TONS',
    text: 'A large cloud can hold enormous mass in tiny droplets while still floating because the droplets are spread out.',
  },
  {
    title: 'OLD BOOKS HAVE A SMELL',
    text: 'Aging paper releases aromatic compounds that can smell sweet, dusty, or slightly vanilla-like.',
  },
  {
    title: 'EELS WERE A MYSTERY',
    text: 'For centuries, scientists could not figure out where European eels reproduced.',
  },
  {
    title: 'LAVA CAN BE BLACK',
    text: 'Fresh lava can cool into dark volcanic glass when it loses heat too quickly for crystals to grow.',
  },
  {
    title: 'MOSS WAKES UP FAST',
    text: 'Some dried mosses can restart photosynthesis soon after water returns.',
  },
  {
    title: 'SOUND CAN SHAPE MATTER',
    text: 'Strong vibrations can arrange sand, powder, or liquid into visible patterns.',
  },
  {
    title: 'THE OCEAN HIDES RIVERS',
    text: 'Dense salty water can flow along the seafloor like an underwater river.',
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

        <div className="mt-4 animate-pulse text-sm font-black tracking-[0.28em] text-neon-green">CONNECTING...</div>

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
