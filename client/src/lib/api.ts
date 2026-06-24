// ---------------------------------------------------------------------------
// Backend client. Player progress (stats, coins, upgrades, maps, powerups) lives
// in the Java backend, keyed to the signed-in account's Firebase uid. Every
// authenticated call sends the Firebase ID token; the server verifies it and
// only ever touches the caller's own profile. Guests don't hit these endpoints
// (their progress is local) — the only public read is the leaderboard.
// ---------------------------------------------------------------------------
import type { CharacterLoadout, GameStats, Upgrades } from '../types';
import { auth } from './firebase';

const BASE = (import.meta.env.VITE_API_BASE ?? '') + '/api';

export interface Profile {
  guestId: string; // = the account's Firebase uid
  name: string;
  stats: GameStats;
  upgrades: Upgrades;
  upgradeGames: number;
  powerups: Record<string, number>;
  maps: string[];
  cosmetics: string[];
  character: CharacterLoadout;
}

export interface RunPayload {
  score: number;
  wave: number;
  wpm: number;
  accuracy: number;
  survivalMs: number;
  kills: number;
  bossesDefeated: number;
  streak: number;
  coins: number;
  missedWords: Record<string, number>;
  mode: string;
  difficulty: string;
  riddle: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  wave: number;
  wpm: number;
  accuracy: number;
  mode: string;
  difficulty: string;
  riddle: boolean;
  at: number;
}

export interface Leaderboards {
  typers: LeaderboardEntry[];
  riddlers: LeaderboardEntry[];
}

/** Authorization header with a fresh Firebase ID token. Throws if signed out. */
async function authHeader(): Promise<Record<string, string>> {
  const user = auth?.currentUser;
  if (!user) throw new Error('Please sign in.');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function apost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json() as Promise<T>;
}

async function aget<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path, { headers: await authHeader() });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json() as Promise<T>;
}

/** Public GET — no auth (leaderboard is read-only public data). */
async function jget<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json() as Promise<T>;
}

/** Pull the server's friendly { error } message out of a failed response. */
async function errorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === 'string') return data.error;
  } catch {
    /* not JSON */
  }
  return `Request failed (${res.status})`;
}

/** The signed-in account's profile (created server-side on first sign-in). */
export async function getProfile(): Promise<Profile> {
  const { profile } = await aget<{ profile: Profile }>('/profile');
  return profile;
}

export async function submitRun(run: RunPayload): Promise<{ profile: Profile; isHighScore: boolean }> {
  return apost('/profile/run', run);
}

export async function buyUpgrade(key: string): Promise<Profile> {
  const { profile } = await apost<{ profile: Profile }>('/profile/buy', { key });
  return profile;
}

export async function setUsername(name: string): Promise<Profile> {
  const { profile } = await apost<{ profile: Profile }>('/profile/name', { name });
  return profile;
}

export async function buyPowerup(key: string): Promise<Profile> {
  const { profile } = await apost<{ profile: Profile }>('/profile/buy-powerup', { key });
  return profile;
}

export async function usePowerup(key: string): Promise<Profile> {
  const { profile } = await apost<{ profile: Profile }>('/profile/use-powerup', { key });
  return profile;
}

export async function buyMap(mapId: string): Promise<Profile> {
  const { profile } = await apost<{ profile: Profile }>('/profile/buy-map', { mapId });
  return profile;
}

export async function buyCosmetic(key: string): Promise<Profile> {
  const { profile } = await apost<{ profile: Profile }>('/profile/buy-cosmetic', { key });
  return profile;
}

export async function equipCharacter(character: CharacterLoadout): Promise<Profile> {
  const { profile } = await apost<{ profile: Profile }>('/profile/equip-character', character);
  return profile;
}

/** Claim the rewarded-ad bonus. Returns the updated profile + coins granted. */
export async function claimReward(): Promise<{ profile: Profile; reward: number }> {
  return apost('/profile/reward');
}

/** Start a coin-pack purchase. Returns a checkout URL once Stripe is configured. */
export async function checkoutCoinPack(packId: string): Promise<{ url: string }> {
  return apost('/billing/checkout', { packId });
}

export async function getLeaderboard(limit = 20): Promise<Leaderboards> {
  return jget<Leaderboards>(`/leaderboard?limit=${limit}`);
}
