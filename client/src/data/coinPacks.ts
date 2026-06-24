// ---------------------------------------------------------------------------
// Real-money coin packs (purchased via Stripe). Display data only — the price is
// charged server-side. Mirrors server CoinPackCatalog. Checkout is a placeholder
// until Stripe is configured (see docs/DEPLOYMENT.md).
// ---------------------------------------------------------------------------
export interface CoinPack {
  id: string;
  coins: number;
  price: string; // display price
  best?: boolean;
}

export const COIN_PACKS: CoinPack[] = [
  { id: 'small', coins: 1000, price: '$0.99' },
  { id: 'medium', coins: 6000, price: '$3.99' },
  { id: 'large', coins: 16000, price: '$9.99', best: true },
  { id: 'huge', coins: 40000, price: '$19.99' },
];
