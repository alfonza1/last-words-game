import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import type { CharacterLoadout, Difficulty, GameMode, GameState, PuzzleStyle, Settings, Upgrades } from '../types';
import { GameEngine } from '../game/engine';
import { drawGame } from '../game/render';
import { getMap } from '../data/maps';
import { POWERUP_DEFS } from '../data/powerups';
import { audio } from '../lib/audio';
import { useGameLoop } from '../hooks/useGameLoop';
import { useSpeechAnswer, type SpeechAnswerState } from '../mobile/speech';
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
  riddle: boolean;
  survived: boolean;
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
  mobileSpeechExperience?: boolean;
  seed?: number;
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
  mobileSpeechExperience = false,
  seed,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const endedRef = useRef(false);
  const prevShotsFiredRef = useRef(0);
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
      mobile: mobileSpeechExperience,
      width: 960,
      height: 600,
      seed,
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
    if (!mobileSpeechExperience) inputRef.current?.focus();
  }, [mobileSpeechExperience]);

  // Typing Defense gets a safe pause. Puzzle modes only open the menu; their
  // horde keeps advancing so the player cannot pause indefinitely to solve.
  const pausedRef = useRef(false);
  const hiddenAtRef = useRef<number | null>(null);
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
    if (!mobileSpeechExperience) inputRef.current?.focus();
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

  // Auto-pause typing, but catch solver modes up after mobile browsers suspend
  // the tab so backgrounding the app is not a free thinking pause.
  useEffect(() => {
    const getEngineStatus = (): GameState['status'] => engine.state.status;
    const catchUpSolver = () => {
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt === null || freezeOnPause || getEngineStatus() !== 'playing') return;
      const hiddenSeconds = Math.max(0, (performance.now() - hiddenAt) / 1000);
      const maxCatchUpSeconds = 30;
      let remaining = Math.min(maxCatchUpSeconds, hiddenSeconds);
      while (remaining > 0 && getEngineStatus() === 'playing') {
        const step = Math.min(0.05, remaining);
        engine.update(step);
        remaining -= step;
      }
      if (hiddenSeconds > maxCatchUpSeconds && getEngineStatus() === 'playing') {
        engine.forfeit();
      }
      setTick((t) => t + 1);
      if (getEngineStatus() === 'gameover' && !endedRef.current) {
        endedRef.current = true;
        onGameOver(toResult(engine.state));
      }
    };

    const onVisibility = () => {
      if (document.hidden && engine.state.status === 'playing') {
        if (freezeOnPause) doPause();
        else hiddenAtRef.current = performance.now();
      } else if (!document.hidden) {
        catchUpSolver();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, freezeOnPause, onGameOver]);

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
    // Typing Defense self-gates in the engine while paused. Puzzle modes keep
    // updating behind the menu.
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

    // Play gunshots only when reserved shots actually reach visible targets.
    const shotsFired = engine.state.shotsFired;
    for (let i = prevShotsFiredRef.current; i < shotsFired; i++) {
      audio.gunshot(settings.weapon);
    }
    prevShotsFiredRef.current = shotsFired;

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
  const waveBreak = s.wave > 0 && s.betweenWaves > 0;
  const acceptingInput = s.status === 'playing' && !waveBreak;
  const mobileSpeechSolver = mobileSpeechExperience && s.riddleMode;

  const submitSpeechAnswer = useCallback(
    (answer: string): boolean => {
      if (!acceptingInput || paused || !engine.state.riddleMode) return false;
      const correctBefore = engine.state.correctWords;
      const mistakesBefore = engine.state.mistakes;
      engine.handleInput(`${answer} `);
      setTick((t) => t + 1);
      return engine.state.correctWords > correctBefore && engine.state.mistakes === mistakesBefore;
    },
    [acceptingInput, engine, paused],
  );

  const speech = useSpeechAnswer({
    enabled: mobileSpeechSolver && acceptingInput && !paused,
    onTranscript: submitSpeechAnswer,
  });

  useEffect(() => {
    if (acceptingInput && !paused && !mobileSpeechSolver) inputRef.current?.focus();
  }, [acceptingInput, paused, mobileSpeechSolver]);

  return (
    <div className="crt relative h-full w-full overflow-hidden">
      <div ref={wrapRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      <HUD s={s} muted={muted} onPause={doPause} onToggleMute={toggleMute} />

      {/* Words to type — pinned at the TOP; zombies spawn below this panel.
          Status events (WAVE CLEARED, etc.) sit UNDER the box so it never hides them. */}
      {acceptingInput && (
        <div
          className={`pointer-events-none absolute inset-x-0 z-30 flex flex-col items-center gap-2 px-4 ${
            s.riddleMode ? 'top-[calc(env(safe-area-inset-top)+5.75rem)] sm:top-24' : 'top-14'
          }`}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black/55 px-4 py-2.5 backdrop-blur-sm sm:px-5">
            {s.riddleMode ? (
              <RiddlePrompt prompt={s.riddlePrompt} wrong={wrong} />
            ) : (
              <TypeBar s={s} opts={engine.matchOptions} input={s.input} />
            )}
          </div>
          <EventTicker events={s.events} />
        </div>
      )}

      {waveBreak && !paused && <WaveBreakOverlay wave={s.wave} seconds={s.betweenWaves} />}

      {/* Input + powerups, at the bottom. */}
      {acceptingInput && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-1.5 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:gap-2 sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
          <PowerupBar
            consumables={s.powerups.consumables}
            pressable={mobileSpeechExperience}
            onActivate={(key) => {
              if (engine.activatePowerup(key)) setTick((t) => t + 1);
            }}
          />
          {mobileSpeechSolver ? (
            <SpeechAnswerPanel
              state={speech.state}
              transcript={speech.transcript}
              supported={speech.supported}
              disabled={!acceptingInput || paused}
              onListen={speech.startListening}
              onStopListen={speech.stopListening}
              inputRef={inputRef}
              input={s.input}
              onInput={(value) => {
                if (!acceptingInput || paused) return;
                engine.handleInput(value);
                setTick((t) => t + 1);
              }}
              onSubmit={() => {
                if (!acceptingInput || paused) return;
                engine.handleInput(`${engine.state.input} `);
                setTick((t) => t + 1);
              }}
            />
          ) : (
            <>
              <div
            className={`pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-lg border bg-black/70 px-3 py-2 transition-colors ${
              wrong ? 'border-neon-red shadow-[0_0_12px_rgba(255,56,96,0.6)]' : 'border-neon-green/40 shadow-neon'
            }`}
          >
            <span className={wrong ? 'text-neon-red' : 'text-neon-green'}>›</span>
            <input
              ref={inputRef}
              value={s.input}
              disabled={!acceptingInput || paused}
              onChange={(e) => {
                if (!acceptingInput || paused) return;
                engine.handleInput(e.target.value);
                setTick((t) => t + 1);
              }}
              onKeyDown={(e) => {
                // Puzzle modes can also fire with ENTER (Typing only fires on SPACE).
                if (riddleMode && e.key === 'Enter' && acceptingInput && !paused) {
                  e.preventDefault();
                  engine.handleInput(engine.state.input + ' ');
                  setTick((t) => t + 1);
                }
              }}
              onBlur={() => {
                if (acceptingInput && !paused) setTimeout(() => inputRef.current?.focus(), 0);
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
            <span>Esc / ⏸ = pause</span>
          </div>
            </>
          )}
        </div>
      )}

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

/** Full inter-wave lockout so the next prompt cannot be typed early. */
function WaveBreakOverlay({ wave, seconds }: { wave: number; seconds: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/30 px-4 backdrop-blur-[2px]">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neon-green/35 bg-black/80 p-6 text-center shadow-[0_0_40px_rgba(57,255,20,0.18)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-green to-transparent" />
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">Sector secured</div>
        <div className="mt-2 text-4xl font-black tracking-[0.12em] text-neon-green drop-shadow-[0_0_14px_rgba(57,255,20,0.65)]">
          WAVE {wave} CLEARED
        </div>
        <div className="mx-auto mt-4 h-px w-28 bg-neon-pink/50" />
        <p className="mt-4 text-xs uppercase tracking-[0.22em] text-white/50">
          Next breach in <span className="font-black text-neon-amber">{Math.max(1, Math.ceil(seconds))}</span>
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-wider text-neon-cyan/70">Reload. Breathe. Hold the line.</p>
      </div>
    </div>
  );
}

function SpeechAnswerPanel({
  state,
  transcript,
  supported,
  disabled,
  onListen,
  onStopListen,
  inputRef,
  input,
  onInput,
  onSubmit,
}: {
  state: SpeechAnswerState;
  transcript: string;
  supported: boolean;
  disabled: boolean;
  onListen: () => Promise<void>;
  onStopListen: () => Promise<void>;
  inputRef: RefObject<HTMLInputElement>;
  input: string;
  onInput: (value: string) => void;
  onSubmit: () => void;
}) {
  const fallback = state === 'unsupported' || state === 'permission-denied';
  const active = state === 'listening' || state === 'processing';
  const canUseVoice = !disabled && supported;
  const label =
    state === 'listening'
      ? 'LISTEN'
      : state === 'processing'
        ? 'CHECK'
        : state === 'matched'
          ? 'HIT'
          : state === 'no-match'
            ? 'MISS'
          : fallback
            ? 'TYPE'
            : 'HOLD';
  const line =
    state === 'listening'
      ? transcript || 'Keep holding and say the answer'
      : state === 'matched'
        ? 'Answer locked'
        : state === 'no-match'
          ? transcript || 'Try again'
          : fallback
            ? 'Speech unavailable'
            : transcript || 'Hold button and speak the answer';

  const startHolding = (event: ReactPointerEvent<HTMLButtonElement> | ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!canUseVoice || active) return;
    event.preventDefault();
    if ('pointerId' in event && !event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    void onListen();
  };
  const stopHolding = (event: ReactPointerEvent<HTMLButtonElement> | ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!canUseVoice) return;
    event.preventDefault();
    if ('pointerId' in event && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    void onStopListen();
  };

  return (
    <div className="pointer-events-auto w-full max-w-sm select-none rounded-xl border border-neon-cyan/35 bg-black/75 p-2 shadow-[0_0_22px_rgba(0,240,255,0.2)] backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onPointerDown={startHolding}
          onPointerUp={stopHolding}
          onPointerCancel={stopHolding}
          onPointerLeave={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) stopHolding(event);
          }}
          onKeyDown={(event) => {
            if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) startHolding(event);
          }}
          onKeyUp={(event) => {
            if (event.key === ' ' || event.key === 'Enter') stopHolding(event);
          }}
          onClick={(event) => event.preventDefault()}
          onContextMenu={(event) => event.preventDefault()}
          disabled={!canUseVoice}
          aria-label="Hold button and speak the answer"
          style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
          className={`flex h-12 w-12 shrink-0 select-none touch-none items-center justify-center rounded-full border text-[10px] font-black tracking-widest transition ${
            state === 'matched'
              ? 'border-neon-green bg-neon-green/15 text-neon-green shadow-neon'
              : state === 'no-match' || state === 'permission-denied' || state === 'unsupported'
                ? 'border-neon-red bg-neon-red/10 text-neon-red'
                : active
                  ? 'border-neon-amber bg-neon-amber/15 text-neon-amber'
                  : 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20'
          } disabled:opacity-60`}
        >
          {label}
        </button>
        <div className="min-w-0 flex-1 text-left">
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/35">Voice Answer</div>
          <div className="truncate text-xs font-bold text-white/85">{line}</div>
        </div>
      </div>

      {fallback && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-ink-800/80 px-3 py-1.5">
          <span className="text-neon-green">&gt;</span>
          <input
            ref={inputRef}
            value={input}
            disabled={disabled}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSubmit();
              }
            }}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            placeholder="type answer"
            className="w-full bg-transparent text-base text-neon-green outline-none placeholder:text-neon-green/30"
          />
        </div>
      )}
    </div>
  );
}

/** Puzzle prompt panel - shows the prompt, not the answer. */
function RiddlePrompt({ prompt, wrong }: { prompt: string | null; wrong: boolean }) {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-1 text-center">
      <span className="text-[9px] uppercase tracking-[0.24em] text-neon-pink sm:text-[10px] sm:tracking-[0.35em]">
        Solve to fire
      </span>
      <p className={`max-w-full text-sm font-bold leading-snug sm:text-lg ${wrong ? 'text-neon-red' : 'text-white/90'}`}>
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

/**
 * Bottom strip showing owned consumable powerups. On desktop typing players see
 * the command word to type; on mobile (no typing) each powerup is a tappable
 * button that spends a charge directly.
 */
function PowerupBar({
  consumables,
  pressable = false,
  onActivate,
}: {
  consumables: { grenade: number; freeze: number; medkit: number };
  pressable?: boolean;
  onActivate?: (key: string) => void;
}) {
  if (pressable) {
    return (
      <div className="pointer-events-auto flex max-w-full items-center justify-center gap-1.5">
        {POWERUP_DEFS.map((def) => {
          const count = (consumables as unknown as Record<string, number>)[def.key] ?? 0;
          const owned = count > 0;
          return (
            <button
              key={def.key}
              type="button"
              disabled={!owned}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => owned && onActivate?.(def.key)}
              title={def.description}
              aria-label={`Use ${def.name}, ${count} left`}
              className={`flex select-none items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                owned
                  ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.35)] hover:bg-neon-cyan/20'
                  : 'border-white/10 bg-black/40 text-white/30'
              }`}
            >
              <span className="text-sm">{def.icon}</span>
              <span>{def.name}</span>
              <span className={owned ? 'text-white/70' : 'text-white/25'}>×{count}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-2 text-xs">
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
      <span className="hidden text-white/30 sm:inline">— buy more in the Store</span>
    </div>
  );
}

function toResult(s: GameState): RunResult {
  return {
    score: s.score,
    wave: s.wave,
    wpm: s.riddleMode ? 0 : s.maxWpm,
    accuracy: s.accuracy,
    survivalMs: s.elapsedMs,
    kills: s.kills,
    bossesDefeated: s.bossesDefeated,
    streak: s.bestStreak,
    coins: s.coins,
    riddle: s.riddleMode,
    survived: s.survived,
    style: s.riddleMode ? s.puzzleStyle : 'typing',
  };
}
