// ---------------------------------------------------------------------------
// Backend client. Player progress (stats, coins, upgrades) + the global
// leaderboard now live in the Java backend (../backend_java). The guest id is
// the only thing kept in localStorage so a device maps to one server profile.
// (Settings remain device-local — they're UI preferences, not progress.)
// ---------------------------------------------------------------------------
import type { GameStats, Upgrades } from '../types';

const BASE = (import.meta.env.VITE_API_BASE ?? '') + '/api';
const GUEST_KEY = 'dk.guestId';

export interface Profile {
  guestId: string;
  name: string;
  stats: GameStats;
  upgrades: Upgrades;
  upgradeGames: number;
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
  at: number;
}

async function jpost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

async function jget<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export function getGuestId(): string | null {
  try {
    return localStorage.getItem(GUEST_KEY);
  } catch {
    return null;
  }
}

function setGuestId(id: string) {
  try {
    localStorage.setItem(GUEST_KEY, id);
  } catch {
    /* ignore */
  }
}

/** Ensure we have a server profile, creating a guest on first run. */
export async function loadOrCreateProfile(): Promise<Profile> {
  const existing = getGuestId();
  if (existing) {
    try {
      const { profile } = await jget<{ profile: Profile }>(`/profile/${existing}`);
      return profile;
    } catch {
      // stale/unknown id — fall through and make a new guest.
    }
  }
  const { guest, profile } = await jpost<{ guest: { id: string }; profile: Profile }>('/guest', {});
  setGuestId(guest.id);
  return profile;
}

export async function submitRun(guestId: string, run: RunPayload): Promise<{ profile: Profile; isHighScore: boolean }> {
  return jpost(`/profile/${guestId}/run`, run);
}

export async function buyUpgrade(guestId: string, key: string): Promise<Profile> {
  const { profile } = await jpost<{ profile: Profile }>(`/profile/${guestId}/buy`, { key });
  return profile;
}

export async function devGrant(guestId: string): Promise<Profile> {
  const { profile } = await jpost<{ profile: Profile }>(`/profile/${guestId}/devgrant`);
  return profile;
}

export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const { leaderboard } = await jget<{ leaderboard: LeaderboardEntry[] }>(`/leaderboard?limit=${limit}`);
  return leaderboard;
}
