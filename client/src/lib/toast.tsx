// ---------------------------------------------------------------------------
// Lightweight toast system. Any failure point can surface a dismissible banner
// instead of failing silently — `const toast = useToast(); toast.error('...')`.
// ---------------------------------------------------------------------------
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ToastKind = 'error' | 'info' | 'success';
interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastApi {
  show: (message: string, kind?: ToastKind) => void;
  error: (message: string) => void;
  success: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

const STYLES: Record<ToastKind, string> = {
  error: 'border-neon-red/60 bg-neon-red/15 text-neon-red',
  info: 'border-white/20 bg-black/70 text-white/80',
  success: 'border-neon-green/60 bg-neon-green/15 text-neon-green',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const show = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = nextId.current++;
      setToasts((t) => [...t, { id, message, kind }]);
      window.setTimeout(() => remove(id), 5000);
    },
    [remove],
  );

  const api: ToastApi = {
    show,
    error: useCallback((m: string) => show(m, 'error'), [show]),
    success: useCallback((m: string) => show(m, 'success'), [show]),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-2 z-[100] flex flex-col items-center gap-1.5 px-2">
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => remove(t.id)}
            className={`pointer-events-auto max-w-sm rounded-md border px-3 py-1.5 text-xs font-semibold leading-snug shadow-lg backdrop-blur-sm ${STYLES[t.kind]}`}
          >
            {t.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
