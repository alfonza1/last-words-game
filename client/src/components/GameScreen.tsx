import { useEffect, useRef, useState } from 'react';
import type { CharacterLoadout, Difficulty, GameMode, GameState, PuzzleStyle, Settings, Upgrades } from '../types';
import { GameEngine } from '../game/engine';
import { drawGame } from '../game/render';
import { getMap } from '../data/maps';
import { POWERUP_DEFS } from '../data/powerups';
import { audio } from '../lib/audio';
import { useGameLoop } from '../hooks/useGameLoop';
import { HUD } from './HUD';
import { TypeBar } from './TypeBar';

export interface RunResult {
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
  riddle: boolean;
  /** Play style of this run: 'typing' | 'riddles' | 'math' | 'trivia'. */
  style: string;
}

interface Props {
  mode: GameMode;
  difficulty: Difficulty;
  upgrades: Upgrades;
  powerups: Record<string, number>;
  upgradesActive: boolean;
  settings: Settings;
  character: CharacterLoadout;
  riddleMode: boolean;
  puzzleStyle: PuzzleStyle;
  onGameOver: (result: RunResult) => void;
  onUsePowerup: (key: string) => void;
  /** Quit/restart pass the partial run so its stats still save. */
  onQuit: (result: RunResult) => void;
  onRestart: (result: RunResult) => void;
  onMusicToggle: (on: boolean) => void;
  onMusicVolume: (v: number) => void;
  onSfxVolume: (v: number) => void;
}

export function GameScreen({
  mode,
  difficulty,
  upgrades,
  powerups,
  upgradesActive,
  settings,
  character,
  riddleMode,
  puzzleStyle,
  onGameOver,
  onUsePowerup,
  onQuit,
  onRestart,
  onMusicToggle,
  onMusicVolume,
  onSfxVolume,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const endedRef = useRef(false);
  const prevWordsRef = useRef(0);
  const prevConsumablesRef = useRef<Record<string, number>>({ grenade: 0, freeze: 0 });
  const [, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [confirmExit, setConfirmExit] = useState<null | 'quit' | 'restart'>(null);
  const [musicOn, setMusicOn] = useState(settings.music);
  const [musicVol, setMusicVol] = useState(settings.musicVolume);
  const [sfxVol, setSfxVol] = useState(settings.sfxVolume);
  const [muted, setMuted] = useState(false);
  const theme = getMap(settings.map);

  if (!engineRef.current) {
    engineRef.current = new GameEngine({
      mode,
      difficulty,
      upgrades,
      powerups,
      settings,
      riddleMode,
      puzzleStyle,
      width: 960,
      height: 600,
    });
    prevConsumablesRef.current = { ...engineRef.current.state.powerups.consumables };
  }
  const engine = engineRef.current;

  useEffect(() => {
    audio.start({
      music: settings.music,
      musicVolume: settings.musicVolume,
      sfx: settings.sound,
      sfxVolume: settings.sfxVolume,
    });
    return () => audio.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.resize(rect.width, rect.height);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [engine]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // In puzzle modes the horde keeps advancing while the menu is open (anti-cheat —
  // you can't pause to think); only Typing Defense actually freezes the sim.
  const pausedRef = useRef(false);
  const freezeOnPause = !riddleMode;
  const doPause = () => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    setPaused(true);
    if (freezeOnPause) {
      engine.pause();
      audio.pause();
    }
  };
  const doResume = () => {
    pausedRef.current = false;
    setPaused(false);
    setConfirmExit(null);
    if (freezeOnPause) {
      engine.resume();
      audio.resume();
    }
    inputRef.current?.focus();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') e.preventDefault();
      if (e.key === 'Escape') {
        if (pausedRef.current) doResume();
        else doPause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  // A full page reload can't resume a live action run (that's non-standard and
  // would invite save-scumming), so instead: warn before a refresh/close throws
  // the run away, and auto-pause when the tab is hidden so the player isn't
  // overrun while away. GameScreen is only mounted during a run.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (engine.state.status === 'gameover') return;
      e.preventDefault();
      e.returnValue = ''; // shows the browser's "leave site?" confirmation
    };
    const onVisibility = () => {
      if (document.hidden && engine.state.status === 'playing') doPause();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    audio.setEnabled(next);
    onMusicToggle(next);
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audio.setMuted(next);
  };
  const changeSfxVolume = (v: number) => {
    setSfxVol(v);
    audio.setSfxVolume(v);
    onSfxVolume(v);
  };
  const changeVolume = (v: number) => {
    setMusicVol(v);
    audio.setVolume(v);
    onMusicVolume(v);
  };

  // Quit / restart confirm — only warn when upgrades would be wasted.
  const currentResult = () => toResult(engine.state);
  const requestQuit = () => (upgradesActive ? setConfirmExit('quit') : onQuit(currentResult()));
  const requestRestart = () => (upgradesActive ? setConfirmExit('restart') : onRestart(currentResult()));

  useGameLoop((dt) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    // engine.update self-gates on status: Typing pause sets status='paused' (frozen);
    // puzzle pause leaves it 'playing' so the horde keeps advancing under the menu.
    engine.update(dt);

    // Hand off to the Game Over screen FIRST, so even a draw hiccup can't trap
    // the player on a frozen/black canvas.
    if (engine.state.status === 'gameover' && !endedRef.current) {
      endedRef.current = true;
      onGameOver(toResult(engine.state));
      return;
    }

    // Draw is best-effort — never let a render error break the loop.
    try {
      drawGame(ctx, engine.state, theme, character);
    } catch (err) {
      console.error('[dk] draw error', err);
    }
    setTick((t) => (t + 1) % 1_000_000);

    // Gunshot whenever a word is completed.
    const words = engine.state.correctWords;
    if (words > prevWordsRef.current) audio.gunshot(settings.weapon);
    prevWordsRef.current = words;

    // Sync any consumed powerups to the backend (so the charge is spent).
    const cons = engine.state.powerups.consumables as unknown as Record<string, number>;
    for (const key of Object.keys(prevConsumablesRef.current)) {
      const used = (prevConsumablesRef.current[key] ?? 0) - (cons[key] ?? 0);
      for (let i = 0; i < used; i++) onUsePowerup(key);
    }
    prevConsumablesRef.current = { ...cons };
  }, true);

  const s = engine.state;
  const wrong = engine.inputWrong;

  return (
    <div className="crt relative h-full w-full overflow-hidden">
      <div ref={wrapRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      <HUD s={s} muted={muted} onPause={doPause} onToggleMute={toggleMute} />

      {/* Words to type — pinned at the TOP; zombies spawn below this panel.
          Status events (WAVE CLEARED, etc.) sit UNDER the box so it never hides them. */}
      {s.status === 'playing' && (
        <div className="pointer-events-none absolute inset-x-0 top-14 z-30 flex flex-col items-center gap-2 px-4">
          <div className="rounded-2xl border border-white/10 bg-black/55 px-5 py-2.5 backdrop-blur-sm">
            {s.riddleMode ? (
              <RiddlePrompt prompt={s.riddlePrompt} wrong={wrong} />
            ) : (
              <TypeBar s={s} opts={engine.matchOptions} input={s.input} />
            )}
          </div>
          <EventTicker events={s.events} />
        </div>
      )}

      {/* Input + powerups, at the bottom. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 p-4">
        <PowerupBar consumables={s.powerups.consumables} />
        <div
          className={`pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-lg border bg-black/70 px-3 py-2 transition-colors ${
            wrong ? 'border-neon-red shadow-[0_0_12px_rgba(255,56,96,0.6)]' : 'border-neon-green/40 shadow-neon'
          }`}
        >
          <span className={wrong ? 'text-neon-red' : 'text-neon-green'}>›</span>
          <input
            ref={inputRef}
            value={s.input}
            disabled={paused}
            onChange={(e) => {
              if (paused) return; // ignore stray keystrokes while the pause overlay is up
              engine.handleInput(e.target.value);
              setTick((t) => t + 1);
            }}
            onKeyDown={(e) => {
              // Puzzle modes can also fire with ENTER (Typing only fires on SPACE).
              if (riddleMode && e.key === 'Enter' && !paused) {
                e.preventDefault();
                engine.handleInput(engine.state.input + ' ');
                setTick((t) => t + 1);
              }
            }}
            // Keep focus during play, but don't fight the pause overlay for it.
            onBlur={() => {
              if (!paused) setTimeout(() => inputRef.current?.focus(), 0);
            }}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            placeholder={riddleMode ? 'type the answer, then SPACE or ENTER…' : 'type a word, then SPACE to fire…'}
            className={`w-full bg-transparent text-lg outline-none placeholder:text-neon-green/30 ${
              wrong ? 'text-neon-red' : 'text-neon-green'
            }`}
          />
        </div>
        <div className="flex gap-3 text-[11px] text-white/40">
          <span>{riddleMode ? 'SPACE / ENTER = submit answer (volley fire)' : 'SPACE = fire (kills nearest)'}</span>
          <span>{riddleMode ? 'Esc / ⏸ = menu (horde keeps coming)' : 'Esc / ⏸ = pause'}</span>
        </div>
      </div>

      {/* Pause overlay */}
      {paused && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/85">
          {confirmExit ? (
            <div className="w-full max-w-sm rounded-xl border border-neon-red/40 bg-ink-800/90 p-5 text-center">
              <h3 className="text-xl font-black tracking-wide text-neon-red">HOLD ON</h3>
              <p className="mt-2 text-sm text-white/70">
                Leaving now uses up <span className="font-bold text-neon-amber">one of your upgrade games</span> —
                your purchased upgrades stay active for one fewer run, and you won’t get it back.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  className="menu-btn text-center"
                  onClick={() => (confirmExit === 'quit' ? onQuit(currentResult()) : onRestart(currentResult()))}
                >
                  {confirmExit === 'quit' ? '⏏ Quit anyway' : '↻ Restart anyway'}
                </button>
                <button className="menu-btn text-center text-sm" onClick={() => setConfirmExit(null)}>
                  ← Keep playing
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-4xl font-black tracking-widest text-neon-green">{freezeOnPause ? 'PAUSED' : 'MENU'}</h2>
              {!freezeOnPause && (
                <p className="-mt-2 max-w-xs text-center text-xs font-bold text-neon-amber">
                  ⚠ The horde keeps advancing — this isn’t a safe pause.
                </p>
              )}
              <div className="flex w-full max-w-xs flex-col gap-3">
                <button className="menu-btn text-center" onClick={doResume}>
                  ▶ Resume
                </button>
                <button className="menu-btn text-center" onClick={requestRestart}>
                  ↻ Restart Run
                </button>
                <button className="menu-btn text-center" onClick={requestQuit}>
                  ⏏ Quit to Menu
                </button>
                <button className="menu-btn text-center text-sm" onClick={toggleMusic}>
                  {musicOn ? '🔊 Music: On' : '🔇 Music: Off'}
                </button>
                <div className="rounded-lg border border-white/10 bg-ink-800/70 px-4 py-3">
                  <div className="mb-1 flex justify-between text-xs text-white/60">
                    <span>Music Volume</span>
                    <span>{Math.round(musicVol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={musicVol}
                    onChange={(e) => changeVolume(Number(e.target.value))}
                    disabled={!musicOn}
                    className="w-full accent-neon-green disabled:opacity-40"
                  />
                  <div className="mb-1 mt-3 flex justify-between text-xs text-white/60">
                    <span>Gunshot Volume</span>
                    <span>{Math.round(sfxVol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={sfxVol}
                    onChange={(e) => changeSfxVolume(Number(e.target.value))}
                    className="w-full accent-neon-green"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Puzzle prompt panel — shows the prompt (not the answer). */
function RiddlePrompt({ prompt, wrong }: { prompt: string | null; wrong: boolean }) {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-1 text-center">
      <span className="text-[10px] uppercase tracking-[0.35em] text-neon-pink">Solve to fire</span>
      <p className={`max-w-xl text-lg font-bold leading-snug ${wrong ? 'text-neon-red' : 'text-white/90'}`}>
        {prompt ?? '—'}
      </p>
    </div>
  );
}

/** Status events (WAVE CLEARED, powerup grants, finishers), shown under the word box. */
function EventTicker({ events }: { events: GameState['events'] }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {events.slice(-3).map((ev) => (
        <span
          key={ev.id}
          className={
            ev.kind === 'finisher'
              ? 'text-2xl font-black tracking-widest text-neon-pink drop-shadow-[0_0_10px_rgba(255,43,214,0.8)]'
              : ev.kind === 'companion'
                ? 'rounded bg-black/40 px-2 text-sm font-bold text-neon-green'
                : 'rounded bg-black/40 px-2 text-xs text-white/70'
          }
        >
          {ev.text}
        </span>
      ))}
    </div>
  );
}

/** Bottom strip showing owned consumable powerups + the word to type. */
function PowerupBar({ consumables }: { consumables: { grenade: number; freeze: number; medkit: number } }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="uppercase tracking-widest text-white/35">Powerups</span>
      {POWERUP_DEFS.map((def) => {
        const count = (consumables as unknown as Record<string, number>)[def.key] ?? 0;
        const owned = count > 0;
        return (
          <span
            key={def.key}
            title={def.description}
            className={`rounded-full border px-2.5 py-1 font-mono ${
              owned
                ? 'border-neon-cyan text-neon-cyan shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                : 'border-white/10 text-white/30'
            }`}
          >
            {def.icon} type “{def.word}” ×{count}
          </span>
        );
      })}
      <span className="text-white/30">— buy more in the Store</span>
    </div>
  );
}

function toResult(s: GameState): RunResult {
  return {
    score: s.score,
    wave: s.wave,
    wpm: s.maxWpm,
    accuracy: s.accuracy,
    survivalMs: s.elapsedMs,
    kills: s.kills,
    bossesDefeated: s.bossesDefeated,
    streak: s.bestStreak,
    coins: s.coins,
    missedWords: s.missedWords,
    riddle: s.riddleMode,
    style: s.riddleMode ? s.puzzleStyle : 'typing',
  };
}
