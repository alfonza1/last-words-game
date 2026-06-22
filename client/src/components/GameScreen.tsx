import { useEffect, useRef, useState } from 'react';
import type { Difficulty, GameMode, GameState, Settings, Upgrades } from '../types';
import { GameEngine } from '../game/engine';
import { drawGame } from '../game/render';
import { getMap } from '../data/maps';
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
}

interface Props {
  mode: GameMode;
  difficulty: Difficulty;
  upgrades: Upgrades;
  settings: Settings;
  onGameOver: (result: RunResult) => void;
  onQuit: () => void;
  onRestart: () => void;
  onMusicToggle: (on: boolean) => void;
  onMusicVolume: (v: number) => void;
  onSfxVolume: (v: number) => void;
}

export function GameScreen({
  mode,
  difficulty,
  upgrades,
  settings,
  onGameOver,
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
  const [, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
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
      settings,
      width: 960,
      height: 600,
    });
  }
  const engine = engineRef.current;

  // Audio lifecycle: start on mount, fully stop on unmount. The context is
  // created even if music is off so gunshot SFX still play.
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

  // Canvas sizing with devicePixelRatio.
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

  const doPause = () => {
    engine.pause();
    setPaused(true);
    audio.pause();
  };
  const doResume = () => {
    engine.resume();
    setPaused(false);
    audio.resume();
    inputRef.current?.focus();
  };

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') e.preventDefault();
      if (e.key === 'Escape') {
        if (engine.state.status === 'playing') doPause();
        else if (engine.state.status === 'paused') doResume();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

  useGameLoop((dt) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    if (!paused) engine.update(dt);
    drawGame(ctx, engine.state, theme);
    setTick((t) => (t + 1) % 1_000_000);

    // Fire a gunshot whenever a word is completed.
    const words = engine.state.correctWords;
    if (words > prevWordsRef.current) audio.gunshot(settings.weapon);
    prevWordsRef.current = words;

    if (engine.state.status === 'gameover' && !endedRef.current) {
      endedRef.current = true;
      onGameOver(toResult(engine.state));
    }
  }, true);

  const s = engine.state;
  const wrong = engine.inputWrong;

  return (
    <div className="crt relative h-full w-full overflow-hidden">
      <div ref={wrapRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      <HUD s={s} muted={muted} onPause={doPause} onToggleMute={toggleMute} />

      {/* Words to type + input, all at the bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 p-4">
        {s.status === 'playing' && <TypeBar s={s} opts={engine.matchOptions} input={s.input} />}
        <div
          className={`pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-lg border bg-black/70 px-3 py-2 transition-colors ${
            wrong ? 'border-neon-red shadow-[0_0_12px_rgba(255,56,96,0.6)]' : 'border-neon-green/40 shadow-neon'
          }`}
        >
          <span className={wrong ? 'text-neon-red' : 'text-neon-green'}>›</span>
          <input
            ref={inputRef}
            value={s.input}
            onChange={(e) => {
              engine.handleInput(e.target.value);
              setTick((t) => t + 1);
            }}
            onBlur={() => setTimeout(() => inputRef.current?.focus(), 0)}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            placeholder="type a word, then SPACE to fire…"
            className={`w-full bg-transparent text-lg outline-none placeholder:text-neon-green/30 ${
              wrong ? 'text-neon-red' : 'text-neon-green'
            }`}
          />
        </div>
        <div className="flex gap-3 text-[11px] text-white/40">
          <span>SPACE = fire (kills nearest)</span>
          <span>Esc / ⏸ = pause</span>
          <span>“grenade” · “freeze” · “survive” = powerups</span>
        </div>
      </div>

      {/* Pause overlay */}
      {paused && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/85">
          <h2 className="text-4xl font-black tracking-widest text-neon-green">PAUSED</h2>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <button className="menu-btn text-center" onClick={doResume}>
              ▶ Resume
            </button>
            <button className="menu-btn text-center" onClick={onRestart}>
              ↻ Restart Run
            </button>
            <button className="menu-btn text-center" onClick={onQuit}>
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
        </div>
      )}
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
  };
}
