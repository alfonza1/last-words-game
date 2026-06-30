interface Props {
  /** Drop into a local, offline guest session instead of waiting. */
  onPlayOffline: () => void;
}

/**
 * Full-screen gate shown when a signed-in player's account can't be loaded
 * because our servers are unreachable. A signed-in player's coins, upgrades,
 * maps and scores live on our servers, so we don't show a half-empty menu or
 * let them play/spend into nothing — we reassure them their stuff is safe and
 * give them a retry (and an offline escape hatch).
 */
export function ServerDown({ onPlayOffline }: Props) {
  return (
    <div className="crt relative flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-neon-amber/40 bg-ink-800/85 p-6 text-center shadow-neon">
        <h1 className="text-4xl font-black tracking-tight text-neon-green drop-shadow-[0_0_18px_rgba(57,255,20,0.6)]">
          LAST<span className="text-neon-pink"> WORDS</span>
        </h1>

        <p className="mt-3 text-xs tracking-[0.3em] text-neon-amber">CONNECTION LOST</p>

        <p className="mt-4 text-sm leading-relaxed text-white/80">
          We can’t reach Last Words right now. This is a problem on our end, not yours.
        </p>

        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Your account is safe — your coins, upgrades, maps and high scores are all still
          there. We just can’t load them at the moment.
        </p>

        <button
          onClick={onPlayOffline}
          className="mt-6 w-full rounded-lg border border-neon-green/60 bg-neon-green/10 px-4 py-3 text-sm font-black tracking-wide text-neon-green transition hover:bg-neon-green/20"
        >
          Play offline as a guest
        </button>

        <p className="mt-3 text-[11px] leading-snug text-white/40">
          Offline games are saved on this device only. Sign back in once we’re online to
          pick up your account right where you left off.
        </p>
      </div>
    </div>
  );
}
