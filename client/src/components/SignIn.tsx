import { useState } from 'react';
import { useAuth } from '../lib/auth';

/** User-facing error text (never references config/console/dev details). */
function friendlyError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup — allow popups and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts — please try again in a bit.';
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.';
    default:
      return 'Sign-in is temporarily unavailable. Please try again later.';
  }
}

interface Props {
  /** Return to the menu (continue as guest). */
  onBack: () => void;
  /** Called after a successful sign-in. */
  onSignedIn: () => void;
  /** Optional context line, e.g. why sign-in was requested. */
  reason?: string;
}

export function SignIn({ onBack, onSignedIn, reason }: Props) {
  const { configured, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      onSignedIn();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="crt relative flex h-full w-full items-center justify-center p-6">
      <button
        onClick={onBack}
        className="absolute left-4 top-4 z-10 rounded-md border border-white/15 bg-black/50 px-3 py-1.5 text-sm text-white/70 hover:border-neon-green hover:text-neon-green"
      >
        ← Back
      </button>

      <div className="w-full max-w-sm rounded-2xl border border-neon-green/30 bg-ink-800/85 p-6 shadow-neon">
        <div className="mb-5 text-center">
          <h1 className="text-4xl font-black tracking-tight text-neon-green drop-shadow-[0_0_18px_rgba(57,255,20,0.6)]">
            DEAD<span className="text-neon-pink"> KEYS</span>
          </h1>
          <p className="mt-1 text-xs tracking-[0.3em] text-neon-cyan">SIGN IN</p>
          <p className="mt-2 text-xs text-white/50">
            {reason ?? 'Sign in to save progress across devices.'}
          </p>
        </div>

        {!configured && (
          <div className="mb-4 rounded-lg border border-neon-amber/40 bg-neon-amber/10 px-3 py-2 text-xs text-neon-amber">
            Sign-in is temporarily unavailable. You can still play as a guest.
          </div>
        )}

        <button
          disabled={!configured || busy}
          onClick={signInGoogle}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/20 bg-white/95 px-4 py-3 text-sm font-bold text-ink-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="text-base font-black text-[#4285F4]">G</span>
          {busy ? 'Signing in…' : 'Continue with Google'}
        </button>

        {error && <div className="mt-3 text-center text-xs text-neon-red">{error}</div>}

        {/* Trust / security note */}
        <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-snug text-white/40">
          <span aria-hidden>🔒</span>
          <span>
            Secured by <span className="text-white/60">Google Firebase Authentication</span>. Dead Keys never sees
            or stores a password.
          </span>
        </p>
      </div>

      <button
        onClick={onBack}
        disabled={busy}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm font-bold text-white/60 underline-offset-4 hover:text-neon-green hover:underline"
      >
        Continue as guest →
      </button>
    </div>
  );
}
