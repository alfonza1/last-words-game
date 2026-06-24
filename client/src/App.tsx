import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Difficulty, GameMode, GameStats, Screen, Settings, UpgradeKey, Upgrades } from './types';
import {
  DEFAULT_STATS,
  DEFAULT_UPGRADES,
  loadSettings,
  loadStats,
  mergeRunIntoStats,
  saveSettings,
  saveStats,
} from './lib/storage';
import {
  buyMap as apiBuyMap,
  buyPowerup as apiBuyPowerup,
  buyUpgrade as apiBuyUpgrade,
  checkoutCoinPack as apiCheckoutCoinPack,
  claimReward as apiClaimReward,
  getProfile as apiGetProfile,
  setUsername as apiSetUsername,
  submitRun as apiSubmitRun,
  usePowerup as apiUsePowerup,
  type Profile,
  type RunPayload,
} from './lib/api';
import { getMap } from './data/maps';
import { audio } from './lib/audio';
import { useAuth } from './lib/auth';
import { useToast } from './lib/toast';
import { SignIn } from './components/SignIn';
import { MainMenu } from './components/MainMenu';
import { MapSelect } from './components/MapSelect';
import { Leaderboard } from './components/Leaderboard';
import { GameScreen, type RunResult } from './components/GameScreen';
import { GameOver } from './components/GameOver';
import { Upgrades as UpgradesScreen } from './components/Upgrades';
import { HowToPlay } from './components/HowToPlay';
import { SettingsPanel } from './components/SettingsPanel';
import { ServerDown } from './components/ServerDown';

const REWARD_COINS = 50; // bonus for an optional rewarded ad (server is authoritative)

export default function App() {
  const { signedIn, user, loading: authLoading, signOut, updateDisplayName } = useAuth();
  const toast = useToast();
  const fail = useCallback(
    (e: unknown) => toast.error((e as Error)?.message || 'Something went wrong. Please try again.'),
    [toast],
  );
  const [screen, setScreen] = useState<Screen>('menu');
  const [username, setUsername] = useState<string>('');
  const [signInReason, setSignInReason] = useState<string | undefined>(undefined);
  const [signInReturn, setSignInReturn] = useState<Screen>('menu');
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  // Always-current screen, so requireSignIn can return you where you came from.
  const screenRef = useRef(screen);
  screenRef.current = screen;

  // Signed-in progress lives on the server (keyed to the Firebase uid).
  // Guests are fully local — no server calls — and only keep lifetime stats.
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [upgrades, setUpgrades] = useState<Upgrades>(DEFAULT_UPGRADES);
  const [upgradeGames, setUpgradeGames] = useState<number>(0);
  const [powerups, setPowerups] = useState<Record<string, number>>({});
  const [maps, setMaps] = useState<string[]>(['graveyard']);
  const [loading, setLoading] = useState(true);
  const [serverOk, setServerOk] = useState(true);

  const [mode, setMode] = useState<GameMode>('survival');
  const [gameKey, setGameKey] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  const [isHighScore, setIsHighScore] = useState(false);

  // Upgrades only apply while they have games left (signed-in only).
  const activeUpgrades = upgradeGames > 0 ? upgrades : DEFAULT_UPGRADES;

  const applyProfile = useCallback((p: Profile) => {
    setStats(p.stats);
    setUpgrades(p.upgrades);
    setUpgradeGames(p.upgradeGames);
    setPowerups(p.powerups ?? {});
    setMaps(p.maps ?? ['graveyard']);
  }, []);

  const applyGuest = useCallback(() => {
    setStats(loadStats());
    setUpgrades(DEFAULT_UPGRADES);
    setUpgradeGames(0);
    setPowerups({});
    setMaps(['graveyard']);
  }, []);

  // Load the right progress for the current identity. Re-runs on sign in / out.
  useEffect(() => {
    if (authLoading) return; // wait until Firebase resolves
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        if (user) {
          const profile = await apiGetProfile();
          if (!cancelled) {
            applyProfile(profile);
            setServerOk(true);
          }
        } else if (!cancelled) {
          applyGuest();
          setServerOk(true);
        }
      } catch {
        if (!cancelled) setServerOk(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, applyProfile, applyGuest]);

  // Keep the displayed username in sync with the signed-in account.
  useEffect(() => {
    if (user) setUsername(user.displayName ?? '');
  }, [user]);

  const requireSignIn = useCallback((reason?: string) => {
    setSignInReason(reason);
    setSignInReturn(screenRef.current === 'signin' ? 'menu' : screenRef.current);
    setScreen('signin');
  }, []);

  const persistSettings = useCallback((s: Settings) => {
    setSettings(s);
    saveSettings(s);
  }, []);

  const chooseMode = useCallback(
    (m: GameMode) => {
      // Drop a mode/difficulty-exclusive map that isn't valid for this mode.
      const sel = getMap(settings.map);
      const invalid =
        (sel.nightmareOnly && settings.difficulty !== 'nightmare') || (sel.bossRushOnly && m !== 'bossrush');
      if (invalid) persistSettings({ ...settings, map: 'graveyard' });
      setMode(m);
      setScreen('mapselect');
    },
    [settings, persistSettings],
  );

  const startGame = useCallback((m: GameMode) => {
    setMode(m);
    setGameKey((k) => k + 1);
    setResult(null);
    setScreen('game');
  }, []);

  // Save a finished run: server for accounts, localStorage for guests.
  const saveRun = useCallback(
    (r: RunResult, onResult?: (high: boolean) => void) => {
      const high = r.score > stats.bestScore && r.score > 0;
      if (user) {
        const payload: RunPayload = { ...r, mode, difficulty: settings.difficulty };
        apiSubmitRun(payload)
          .then(({ profile, isHighScore }) => {
            applyProfile(profile);
            onResult?.(isHighScore);
          })
          .catch((e) => {
            toast.error('Couldn’t save your run — your progress may not be recorded.');
            void e;
            onResult?.(high);
          });
      } else {
        const merged = mergeRunIntoStats(stats, r);
        setStats(merged);
        saveStats(merged);
        onResult?.(high);
      }
    },
    [user, stats, mode, settings.difficulty, applyProfile, toast],
  );

  const handleGameOver = useCallback(
    (r: RunResult) => {
      setResult(r);
      setIsHighScore(r.score > stats.bestScore && r.score > 0);
      setScreen('gameover');
      saveRun(r, setIsHighScore);
    },
    [stats.bestScore, saveRun],
  );

  // Quitting/restarting mid-run still saves the stats earned this game and uses
  // up one upgrade game (the pause menu warns first when upgrades are active).
  const endRun = useCallback(
    (r: RunResult, after: () => void) => {
      saveRun(r);
      after();
    },
    [saveRun],
  );

  const buyUpgrade = useCallback(
    (key: UpgradeKey) => {
      if (!user) return;
      apiBuyUpgrade(key)
        .then((p) => {
          applyProfile(p);
          toast.success('Purchase successful!');
        })
        .catch(fail);
    },
    [user, applyProfile, toast, fail],
  );

  const buyPowerup = useCallback(
    (key: string) => {
      if (!user) return;
      apiBuyPowerup(key)
        .then((p) => {
          applyProfile(p);
          toast.success('Purchase successful!');
        })
        .catch(fail);
    },
    [user, applyProfile, toast, fail],
  );

  const onUsePowerup = useCallback(
    (key: string) => {
      if (!user) return;
      apiUsePowerup(key).then(applyProfile).catch(fail);
    },
    [user, applyProfile, fail],
  );

  const buyMap = useCallback(
    (mapId: string) => {
      if (!user) return;
      apiBuyMap(mapId)
        .then((p) => {
          applyProfile(p);
          persistSettings({ ...settings, map: mapId }); // auto-select what you just bought
          toast.success('Map unlocked!');
        })
        .catch(fail);
    },
    [user, applyProfile, persistSettings, settings, toast, fail],
  );

  // Optional rewarded ad → bonus coins. Server-authoritative for accounts;
  // local for guests. Throws on cooldown/error so the UI can show it.
  const claimReward = useCallback(async (): Promise<number> => {
    if (user) {
      const { profile, reward } = await apiClaimReward();
      applyProfile(profile);
      return reward;
    }
    const merged = { ...stats, totalCoins: stats.totalCoins + REWARD_COINS };
    setStats(merged);
    saveStats(merged);
    return REWARD_COINS;
  }, [user, stats, applyProfile]);

  const buyCoinPack = useCallback(
    (packId: string) => {
      if (!user) return;
      apiCheckoutCoinPack(packId)
        .then(({ url }) => {
          window.location.href = url; // redirect to Stripe Checkout
        })
        .catch(fail); // until Stripe is configured this shows "coming soon"
    },
    [user, fail],
  );

  const saveUsername = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      // Backend first — it enforces the once-per-week limit and surfaces the reason.
      const profile = await apiSetUsername(trimmed);
      applyProfile(profile);
      await updateDisplayName(trimmed);
      setUsername(trimmed);
    },
    [applyProfile, updateDisplayName],
  );

  const setDifficulty = useCallback(
    (d: Difficulty) => {
      // A nightmare-only map can't be used off Nightmare — fall back to graveyard.
      const map = d !== 'nightmare' && getMap(settings.map).nightmareOnly ? 'graveyard' : settings.map;
      persistSettings({ ...settings, difficulty: d, map });
    },
    [settings, persistSettings],
  );
  const setMap = useCallback((id: string) => persistSettings({ ...settings, map: id }), [settings, persistSettings]);

  // Enter to restart from the game-over screen.
  useEffect(() => {
    if (screen !== 'gameover') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') startGame(mode);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, mode, startGame]);

  const content = useMemo(() => {
    switch (screen) {
      case 'game':
        return (
          <GameScreen
            key={gameKey}
            mode={mode}
            difficulty={settings.difficulty}
            upgrades={activeUpgrades}
            powerups={powerups}
            upgradesActive={upgradeGames > 0}
            settings={settings}
            onGameOver={handleGameOver}
            onUsePowerup={onUsePowerup}
            onQuit={(r) => endRun(r, () => setScreen('menu'))}
            onRestart={(r) => endRun(r, () => startGame(mode))}
            onMusicToggle={(on) => persistSettings({ ...settings, music: on })}
            onMusicVolume={(v) => persistSettings({ ...settings, musicVolume: v })}
            onSfxVolume={(v) => persistSettings({ ...settings, sfxVolume: v })}
          />
        );
      case 'mapselect':
        return (
          <MapSelect
            mode={mode}
            difficulty={settings.difficulty}
            selectedMapId={settings.map}
            ownedMaps={maps}
            signedIn={signedIn}
            onSelect={setMap}
            onBuyMap={buyMap}
            onRequireSignIn={() => requireSignIn('Sign in to buy maps and save them to your account.')}
            onDeploy={() => startGame(mode)}
            onBack={() => setScreen('menu')}
          />
        );
      case 'gameover':
        return result ? (
          <GameOver
            result={result}
            mode={mode}
            isHighScore={isHighScore}
            rewardCoins={REWARD_COINS}
            onWatchAd={claimReward}
            onRestart={() => startGame(mode)}
            onMenu={() => setScreen('menu')}
          />
        ) : null;
      case 'upgrades':
        return (
          <UpgradesScreen
            upgrades={upgrades}
            stats={stats}
            gamesLeft={upgradeGames}
            powerups={powerups}
            signedIn={signedIn}
            onBuy={buyUpgrade}
            onBuyPowerup={buyPowerup}
            onBuyCoinPack={buyCoinPack}
            onRequireSignIn={() => requireSignIn('Sign in to securely buy from our store — safe checkout with Stripe.')}
            onBack={() => setScreen('menu')}
          />
        );
      case 'howto':
        return <HowToPlay onBack={() => setScreen('menu')} />;
      case 'settings':
        return (
          <SettingsPanel
            settings={settings}
            signedIn={signedIn}
            username={username}
            onChange={persistSettings}
            onSaveUsername={saveUsername}
            onBack={() => setScreen('menu')}
          />
        );
      case 'signin':
        return (
          <SignIn
            reason={signInReason}
            onBack={() => setScreen(signInReturn)}
            onSignedIn={() => setScreen(signInReturn)}
          />
        );
      case 'leaderboard':
        return <Leaderboard onBack={() => setScreen('menu')} />;
      case 'menu':
      default:
        return (
          <MainMenu
            stats={stats}
            difficulty={settings.difficulty}
            onStart={chooseMode}
            onNav={(scr) => setScreen(scr)}
            onDifficulty={setDifficulty}
          />
        );
    }
  }, [
    screen,
    gameKey,
    mode,
    settings,
    upgrades,
    activeUpgrades,
    upgradeGames,
    powerups,
    maps,
    result,
    isHighScore,
    stats,
    signedIn,
    username,
    signInReason,
    signInReturn,
    handleGameOver,
    onUsePowerup,
    endRun,
    buyUpgrade,
    buyPowerup,
    buyMap,
    buyCoinPack,
    claimReward,
    saveUsername,
    persistSettings,
    startGame,
    chooseMode,
    setDifficulty,
    setMap,
    requireSignIn,
  ]);

  // Silence ambience whenever we are not in a game.
  useEffect(() => {
    if (screen !== 'game') audio.stop();
  }, [screen]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-pulse text-lg font-bold tracking-widest text-neon-green">CONNECTING…</div>
      </div>
    );
  }

  // A signed-in player's progress lives on our servers. If we couldn't load it,
  // don't show a half-empty menu or let them play/spend into nothing — gate on a
  // clear "we're offline" screen they can retry from (guests never hit this).
  if (!serverOk) {
    return <ServerDown onPlayOffline={() => void signOut()} />;
  }

  const accountLabel = signedIn ? username || user?.email || 'Player' : 'Guest';
  const showChip = screen !== 'game' && screen !== 'signin';

  return (
    <div className="h-full w-full">
      {showChip && (
        <div className="absolute right-3 top-3 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs">
          <span className="max-w-[140px] truncate text-white/60">{accountLabel}</span>
          {signedIn ? (
            <button onClick={() => setConfirmSignOut(true)} className="font-bold text-neon-green hover:text-neon-pink">
              Sign out
            </button>
          ) : (
            <button onClick={() => requireSignIn()} className="font-bold text-neon-green hover:text-neon-pink">
              Sign in
            </button>
          )}
        </div>
      )}

      {content}

      {confirmSignOut && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-neon-green/40 bg-ink-800 p-5 text-center shadow-neon">
            <h3 className="text-lg font-black tracking-wide text-neon-green">SIGN OUT?</h3>
            <p className="mt-2 text-sm text-white/70">You’ll go back to playing as a guest.</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmSignOut(false)}
                className="flex-1 rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/70 hover:border-white/40"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmSignOut(false);
                  void signOut();
                }}
                className="flex-1 rounded-lg border border-neon-red bg-neon-red/10 px-4 py-2 text-sm font-bold text-neon-red hover:bg-neon-red/20"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
