import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Difficulty, GameMode, GameStats, Screen, Settings, UpgradeKey, Upgrades } from './types';
import { DEFAULT_STATS, DEFAULT_UPGRADES, loadSettings, saveSettings } from './lib/storage';
import {
  buyUpgrade as apiBuyUpgrade,
  devGrant as apiDevGrant,
  getGuestId,
  loadOrCreateProfile,
  submitRun,
} from './lib/api';
import { audio } from './lib/audio';
import { MainMenu } from './components/MainMenu';
import { MapSelect } from './components/MapSelect';
import { GameScreen, type RunResult } from './components/GameScreen';
import { GameOver } from './components/GameOver';
import { Upgrades as UpgradesScreen } from './components/Upgrades';
import { HowToPlay } from './components/HowToPlay';
import { SettingsPanel } from './components/SettingsPanel';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  // Progress now lives on the Java backend (../backend_java).
  const [guestId, setGuestId] = useState<string | null>(null);
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [upgrades, setUpgrades] = useState<Upgrades>(DEFAULT_UPGRADES);
  const [upgradeGames, setUpgradeGames] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [serverOk, setServerOk] = useState(true);

  const [mode, setMode] = useState<GameMode>('survival');
  const [gameKey, setGameKey] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  const [isHighScore, setIsHighScore] = useState(false);

  // Upgrades only apply while they have games left.
  const activeUpgrades = upgradeGames > 0 ? upgrades : DEFAULT_UPGRADES;

  // Load (or create) the server profile on boot.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let profile = await loadOrCreateProfile();
        // One-time testing grant (coins + map-unlock stats) per device.
        try {
          if (!localStorage.getItem('dk.devGrant')) {
            profile = await apiDevGrant(profile.guestId);
            localStorage.setItem('dk.devGrant', '1');
          }
        } catch {
          /* ignore */
        }
        if (cancelled) return;
        setGuestId(profile.guestId);
        setStats(profile.stats);
        setUpgrades(profile.upgrades);
        setUpgradeGames(profile.upgradeGames);
        setServerOk(true);
      } catch {
        if (!cancelled) setServerOk(false); // backend unreachable — play without persistence
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistSettings = useCallback((s: Settings) => {
    setSettings(s);
    saveSettings(s);
  }, []);

  const chooseMode = useCallback((m: GameMode) => {
    setMode(m);
    setScreen('mapselect');
  }, []);

  const startGame = useCallback((m: GameMode) => {
    setMode(m);
    setGameKey((k) => k + 1);
    setResult(null);
    setScreen('game');
  }, []);

  const handleGameOver = useCallback(
    (r: RunResult) => {
      setResult(r);
      setIsHighScore(r.score > stats.bestScore && r.score > 0);
      setScreen('gameover');
      const id = guestId ?? getGuestId();
      if (!id) return;
      submitRun(id, { ...r, mode, difficulty: settings.difficulty })
        .then(({ profile, isHighScore }) => {
          setStats(profile.stats);
          setUpgrades(profile.upgrades);
          setUpgradeGames(profile.upgradeGames);
          setIsHighScore(isHighScore);
        })
        .catch(() => {/* keep local optimistic result */});
    },
    [stats.bestScore, guestId, mode, settings.difficulty],
  );

  const buyUpgrade = useCallback(
    (key: UpgradeKey) => {
      const id = guestId ?? getGuestId();
      if (!id) return;
      apiBuyUpgrade(id, key)
        .then((profile) => {
          setStats(profile.stats);
          setUpgrades(profile.upgrades);
          setUpgradeGames(profile.upgradeGames);
        })
        .catch(() => {/* insufficient coins / maxed — ignore */});
    },
    [guestId],
  );

  const setDifficulty = useCallback(
    (d: Difficulty) => persistSettings({ ...settings, difficulty: d }),
    [settings, persistSettings],
  );
  const setMap = useCallback(
    (id: string) => persistSettings({ ...settings, map: id }),
    [settings, persistSettings],
  );

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
            settings={settings}
            onGameOver={handleGameOver}
            onQuit={() => setScreen('menu')}
            onRestart={() => startGame(mode)}
            onMusicToggle={(on) => persistSettings({ ...settings, music: on })}
            onMusicVolume={(v) => persistSettings({ ...settings, musicVolume: v })}
            onSfxVolume={(v) => persistSettings({ ...settings, sfxVolume: v })}
          />
        );
      case 'mapselect':
        return (
          <MapSelect
            mode={mode}
            selectedMapId={settings.map}
            stats={stats}
            onSelect={setMap}
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
            onBuy={buyUpgrade}
            onBack={() => setScreen('menu')}
          />
        );
      case 'howto':
        return <HowToPlay onBack={() => setScreen('menu')} />;
      case 'settings':
        return <SettingsPanel settings={settings} onChange={persistSettings} onBack={() => setScreen('menu')} />;
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
    result,
    isHighScore,
    stats,
    handleGameOver,
    buyUpgrade,
    persistSettings,
    startGame,
    chooseMode,
    setDifficulty,
    setMap,
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

  return (
    <div className="h-full w-full">
      {!serverOk && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-50 bg-neon-red/20 py-1 text-center text-xs text-neon-red">
          Backend offline — progress won’t be saved.
        </div>
      )}
      {content}
    </div>
  );
}
