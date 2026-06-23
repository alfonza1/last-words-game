import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Catches render crashes so a bug shows a recoverable screen instead of a black
 * page. Logs the error (picked up by monitoring) for diagnosis.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[dk] render crash', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-3xl font-black tracking-widest text-neon-red">SOMETHING BROKE</h1>
        <p className="max-w-sm text-sm text-white/60">
          The game hit an unexpected error. Your saved progress is safe — reload to keep playing.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg border border-neon-green bg-neon-green/10 px-5 py-2 font-bold text-neon-green hover:bg-neon-green/20"
        >
          ↻ Reload
        </button>
      </div>
    );
  }
}
