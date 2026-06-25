import { COIN_PACKS } from '../data/coinPacks';

interface Props {
  signedIn: boolean;
  onBuy: (packId: string) => void;
  onRequireSignIn: () => void;
  onClose: () => void;
}

export function CoinPackModal({ signedIn, onBuy, onRequireSignIn, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className="w-full max-w-4xl rounded-2xl border border-neon-amber/45 bg-ink-800/95 p-5 shadow-[0_0_34px_rgba(255,190,40,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-widest text-neon-amber">COIN SUPPLY DROP</h2>
            <p className="mt-1 text-xs text-white/45">Add coins to your shared wallet.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-white/15 px-3 py-1 text-sm text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {COIN_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => {
                onClose();
                if (signedIn) onBuy(pack.id);
                else onRequireSignIn();
              }}
              className={`relative rounded-xl border bg-black/35 p-4 text-center transition hover:-translate-y-0.5 hover:bg-neon-amber/10 ${
                pack.best ? 'border-neon-amber' : 'border-white/15 hover:border-neon-amber/60'
              }`}
            >
              {pack.best && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-neon-amber px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-black">
                  Best value
                </span>
              )}
              <span className="block text-lg font-black text-neon-amber">🪙 {pack.coins.toLocaleString()}</span>
              <span className="mt-2 block text-sm font-bold text-white">{pack.price}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
