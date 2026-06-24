// ---------------------------------------------------------------------------
// Canvas rendering for the game field. Reads GameState + a MapTheme, draws a
// frame: a themed post-apocalyptic environment with shambling zombie figures.
// (Words to type live in the on-screen UI panels, not above zombie heads.)
// ---------------------------------------------------------------------------
import type { GameState, Zombie } from '../types';
import { bossHealthFraction } from './boss';
import type { MapTheme } from '../data/maps';

interface ZStyle {
  skin: string;
  shade: string;
  cloth: string;
  accent: string;
  eye: string;
}

const ZSTYLES: Record<Zombie['type'], ZStyle> = {
  walker: { skin: '#6f9a4a', shade: '#4c6b32', cloth: '#3a4a2a', accent: '#39ff14', eye: '#c9ff5b' },
  runner: { skin: '#86a64f', shade: '#5c7536', cloth: '#5a3320', accent: '#ffd166', eye: '#ffe08a' },
  crawler: { skin: '#9a8240', shade: '#6e5b2a', cloth: '#4a3a22', accent: '#c98b3a', eye: '#ffcf6b' },
  tank: { skin: '#557039', shade: '#374a26', cloth: '#26331c', accent: '#9b5de5', eye: '#d6b3ff' },
  screamer: { skin: '#b08a8a', shade: '#7d5d5d', cloth: '#5a2a3a', accent: '#ff5c8a', eye: '#ff8fb3' },
  glitch: { skin: '#5fa2a8', shade: '#3a6e73', cloth: '#264247', accent: '#00f0ff', eye: '#9bffff' },
  armored: { skin: '#7d8a7a', shade: '#566051', cloth: '#3a423a', accent: '#b0b0b0', eye: '#ffffff' },
  boss: { skin: '#5a3a6b', shade: '#3a2547', cloth: '#26142f', accent: '#ff2bd6', eye: '#ff8fe6' },
};

// Deterministic pseudo-random so scenery layout is stable across frames.
function rand(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function drawGame(ctx: CanvasRenderingContext2D, s: GameState, theme: MapTheme) {
  const { width: w, height: h } = s;
  const time = performance.now();
  ctx.clearRect(0, 0, w, h);

  const shake = s.settings.screenShake ? s.shake : 0;
  const ox = shake > 0 ? (Math.random() - 0.5) * shake : 0;
  const oy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
  ctx.save();
  ctx.translate(ox, oy);

  drawEnvironment(ctx, s, theme, time);
  drawBase(ctx, s, theme, time);

  const ordered = [...s.zombies].sort((a, b) => a.y - b.y);
  for (const z of ordered) drawZombie(ctx, z, s, time);

  drawGroundFog(ctx, s, theme, time);
  if (theme.features.snow) drawSnow(ctx, s, time);
  if (theme.features.embers) drawEmbers(ctx, s, theme, time);
  drawFloating(ctx, s);
  drawWeather(ctx, s, time);

  ctx.restore();

  if (s.flash > 0) {
    ctx.fillStyle = `rgba(255,40,60,${Math.min(0.4, s.flash * 0.4)})`;
    ctx.fillRect(0, 0, w, h);
  }
  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.85);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

// --- Environment ---------------------------------------------------------

function drawEnvironment(ctx: CanvasRenderingContext2D, s: GameState, theme: MapTheme, time: number) {
  const { width: w, height: h } = s;
  const { palette: p, features: f } = theme;
  const hy = h * 0.2;

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, hy + 40);
  sky.addColorStop(0, p.skyTop);
  sky.addColorStop(1, p.skyHorizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, hy + 40);

  // Soft nebula clouds drifting across the upper sky (themed glow).
  for (let n = 0; n < 3; n++) {
    const nx = ((time * 0.004 * (n + 1)) % (w + 300)) - 150 + rand(n + 41) * 80;
    const ny = hy * (0.18 + n * 0.22);
    const nr = 120 + rand(n + 7) * 90;
    const neb = ctx.createRadialGradient(nx, ny, 4, nx, ny, nr);
    neb.addColorStop(0, `rgba(${p.fog},${0.05 + n * 0.01})`);
    neb.addColorStop(1, `rgba(${p.fog},0)`);
    ctx.fillStyle = neb;
    ctx.beginPath();
    ctx.ellipse(nx, ny, nr, nr * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stars (two layers — distant + brighter twinkles). Dead City replaces
  // these with a low, light-polluted storm ceiling.
  if (theme.id !== 'city') {
    for (let i = 0; i < 90; i++) {
      const sx = rand(i) * w;
      const sy = rand(i + 99) * hy * 0.95;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * 0.001 + i));
      const big = rand(i + 13) > 0.92;
      ctx.fillStyle = `rgba(220,235,225,${0.12 + tw * 0.4})`;
      ctx.fillRect(sx, sy, big ? 2.4 : 1.4, big ? 2.4 : 1.4);
    }
  }

  // Occasional shooting star streaking across.
  if (theme.id !== 'city') {
    const period = 5200;
    const phase = (time % period) / period;
    if (phase < 0.16) {
      const seed = Math.floor(time / period);
      const t = phase / 0.16;
      const sx = rand(seed) * w * 0.7;
      const sy = rand(seed + 5) * hy * 0.5;
      const hx = sx + t * w * 0.4;
      const hyp = sy + t * hy * 0.5;
      const grad = ctx.createLinearGradient(hx - 60, hyp - 38, hx, hyp);
      grad.addColorStop(0, 'rgba(220,240,255,0)');
      grad.addColorStop(1, `rgba(235,245,255,${0.8 * (1 - t)})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx - 60, hyp - 38);
      ctx.lineTo(hx, hyp);
      ctx.stroke();
    }
  }

  // Accent horizon glow — adds depth to the non-graveyard maps.
  if (theme.id !== 'graveyard') {
    const glow = ctx.createLinearGradient(0, hy - h * 0.12, 0, hy + 6);
    glow.addColorStop(0, `rgba(${p.fog},0)`);
    glow.addColorStop(1, `rgba(${p.fog},0.22)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, hy - h * 0.12, w, h * 0.12 + 6);
  }

  if (theme.id === 'city') drawDeadCitySky(ctx, s, time, hy);

  // Aurora for the tundra
  if (theme.id === 'tundra') {
    for (let b = 0; b < 3; b++) {
      const grad = ctx.createLinearGradient(0, hy * 0.2, 0, hy);
      grad.addColorStop(0, 'rgba(120,255,200,0)');
      grad.addColorStop(0.5, `rgba(${120 + b * 30},255,${200 - b * 30},0.12)`);
      grad.addColorStop(1, 'rgba(120,255,200,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 30) {
        const y = hy * 0.4 + Math.sin(x * 0.01 + time * 0.0004 + b) * 18 + b * 12;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(w, hy);
      ctx.lineTo(0, hy);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Moon. Dead City has its own occluded moon inside the storm layer.
  if (theme.id !== 'city') {
    const mx = w * 0.82;
    const my = hy * 0.45;
    const mr = Math.min(60, h * 0.09);
    const glow = ctx.createRadialGradient(mx, my, mr * 0.3, mx, my, mr * 3);
    glow.addColorStop(0, p.glow);
    glow.addColorStop(1, p.glow.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.moon;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(60,40,40,0.25)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(mx + (rand(i) - 0.5) * mr, my + (rand(i + 3) - 0.5) * mr, mr * (0.1 + rand(i + 7) * 0.18), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Skyline silhouette (+ neon windows)
  if (f.skyline) {
    ctx.fillStyle = '#04070a';
    for (let i = 0; i < 16; i++) {
      const bx = (i / 16) * w;
      const bw = w / 16 + 2;
      const bh = 16 + rand(i + 20) * 56;
      ctx.fillStyle = '#04070a';
      ctx.fillRect(bx, hy - bh, bw, bh + 6);
      if (f.neon) {
        for (let wy = hy - bh + 6; wy < hy; wy += 10) {
          for (let wx = bx + 3; wx < bx + bw - 3; wx += 8) {
            if (rand(wx * 0.5 + wy) > 0.78) {
              ctx.fillStyle = rand(wx + wy) > 0.5 ? p.accent : '#ff2bd6';
              ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 0.002 + wx);
              ctx.fillRect(wx, wy, 3, 4);
              ctx.globalAlpha = 1;
            }
          }
        }
      }
    }
  }

  // Ground
  const ground = ctx.createLinearGradient(0, hy, 0, h);
  ground.addColorStop(0, p.ground1);
  ground.addColorStop(1, p.ground2);
  ctx.fillStyle = ground;
  ctx.fillRect(0, hy, w, h - hy);

  // Lab grid floor
  if (theme.id === 'lab-legacy') {
    ctx.strokeStyle = `rgba(0,255,200,0.08)`;
    ctx.lineWidth = 1;
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + i * 26, hy);
      ctx.lineTo(w / 2 + i * 150, h);
      ctx.stroke();
    }
    for (let y = hy; y < h; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  // Path toward the bunker
  ctx.fillStyle = 'rgba(40,55,40,0.25)';
  ctx.beginPath();
  ctx.moveTo(w / 2 - 30, hy);
  ctx.lineTo(w / 2 + 30, hy);
  ctx.lineTo(w * 0.78, h);
  ctx.lineTo(w * 0.22, h);
  ctx.closePath();
  ctx.fill();

  // Dead trees
  if (f.deadTrees) {
    const count = theme.id === 'forest' ? 7 : 2;
    for (let i = 0; i < count; i++) {
      const tx = count === 2 ? (i === 0 ? w * 0.08 : w * 0.93) : (rand(i + 70) * 0.9 + 0.05) * w;
      const depth = count === 2 ? 0 : rand(i + 71);
      drawDeadTree(ctx, tx, hy + 8 + depth * 60, h * (0.1 + depth * 0.08));
    }
  }

  // Tombstones / crosses
  if (f.tombstones) {
    const graves = Math.floor(w / 95);
    for (let i = 0; i < graves; i++) {
      const depth = rand(i + 5);
      const gy = hy + 24 + depth * (h - hy - 110);
      const gx = (rand(i + 40) * 0.9 + 0.05) * w;
      const sc = 0.5 + depth * 1.0;
      drawGrave(ctx, gx, gy, sc, i % 4 === 0);
    }
  }

  // Hazard warning light
  if (f.hazard) {
    const sweep = (time * 0.0015) % (Math.PI * 2);
    const grad = ctx.createRadialGradient(w / 2, h, 20, w / 2, h, h * 0.7);
    const intensity = 0.1 + 0.1 * Math.abs(Math.sin(time * 0.0015));
    grad.addColorStop(0, `rgba(0,255,200,${intensity})`);
    grad.addColorStop(1, 'rgba(0,255,200,0)');
    ctx.save();
    ctx.translate(w / 2, h - 30);
    ctx.rotate(Math.sin(sweep) * 0.5);
    ctx.fillStyle = grad;
    ctx.fillRect(-w, -h, w * 2, h);
    ctx.restore();
  }

  // Signature scenery that makes each map its own place.
  drawThemeScenery(ctx, s, theme, time, hy);
}

function drawDeadCitySky(ctx: CanvasRenderingContext2D, s: GameState, time: number, horizon: number) {
  const { width: w, height: h } = s;

  // A sickly moon is almost swallowed by the storm front.
  const mx = w * 0.7;
  const my = horizon * 0.48;
  const mr = Math.min(68, h * 0.105);
  const moonGlow = ctx.createRadialGradient(mx, my, mr * 0.1, mx, my, mr * 3.2);
  moonGlow.addColorStop(0, 'rgba(180,255,235,0.34)');
  moonGlow.addColorStop(0.45, 'rgba(40,220,190,0.1)');
  moonGlow.addColorStop(1, 'rgba(20,120,130,0)');
  ctx.fillStyle = moonGlow;
  ctx.fillRect(mx - mr * 3.2, my - mr * 3.2, mr * 6.4, mr * 6.4);
  ctx.fillStyle = '#b7d8cf';
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(20,45,48,0.3)';
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(
      mx + (rand(i + 410) - 0.5) * mr * 1.25,
      my + (rand(i + 420) - 0.5) * mr,
      mr * (0.07 + rand(i + 430) * 0.17),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Heavy cloud shelves move at different rates and repeatedly veil the moon.
  for (let layer = 0; layer < 4; layer++) {
    const speed = 0.006 + layer * 0.002;
    const drift = (time * speed + layer * 170) % (w + 360);
    const cy = horizon * (0.12 + layer * 0.2);
    ctx.fillStyle = `rgba(${4 + layer * 5},${13 + layer * 8},${18 + layer * 10},${0.72 - layer * 0.08})`;
    ctx.beginPath();
    ctx.moveTo(-220, cy + 20);
    for (let x = -220; x <= w + 220; x += 48) {
      const wave = Math.sin((x + drift) * 0.016 + layer) * (10 + layer * 3);
      const noise = (rand(Math.floor((x + drift) / 48) + layer * 19) - 0.5) * 18;
      ctx.lineTo(x, cy + wave + noise);
    }
    ctx.lineTo(w + 220, cy + 54);
    ctx.lineTo(-220, cy + 54);
    ctx.closePath();
    ctx.fill();
  }

  // The rim stays barely visible through the cloud cover.
  ctx.strokeStyle = 'rgba(185,246,230,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mx, my, mr, -1.25, 1.1);
  ctx.stroke();

  // A rare, brief lightning fork silhouettes the ruined skyline.
  const lightningPhase = (time % 7300) / 7300;
  if (lightningPhase > 0.965) {
    const alpha = Math.sin(((lightningPhase - 0.965) / 0.035) * Math.PI);
    ctx.fillStyle = `rgba(140,255,235,${alpha * 0.1})`;
    ctx.fillRect(0, 0, w, horizon + 12);
    ctx.strokeStyle = `rgba(205,255,248,${alpha * 0.88})`;
    ctx.shadowColor = '#70ffe1';
    ctx.shadowBlur = 16;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(w * 0.22, 0);
    ctx.lineTo(w * 0.25, horizon * 0.23);
    ctx.lineTo(w * 0.21, horizon * 0.42);
    ctx.lineTo(w * 0.27, horizon * 0.66);
    ctx.lineTo(w * 0.24, horizon * 0.92);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

function drawArea67Scenery(ctx: CanvasRenderingContext2D, s: GameState, time: number, horizon: number) {
  const { width: w, height: h } = s;
  const scale = Math.max(0.78, Math.min(1.5, w / 960));

  // Nevada-like mountain basin surrounding the installation.
  ctx.fillStyle = '#11151a';
  ctx.beginPath();
  ctx.moveTo(0, horizon + 8);
  for (let x = 0; x <= w; x += Math.max(38, w / 20)) {
    const ridge = horizon - h * (0.035 + rand(x + 810) * 0.11);
    ctx.lineTo(x, ridge);
  }
  ctx.lineTo(w, horizon + 16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#181b1c';
  ctx.beginPath();
  ctx.moveTo(0, horizon + 10);
  for (let x = 0; x <= w; x += Math.max(52, w / 14)) {
    const ridge = horizon - h * (0.01 + rand(x + 840) * 0.065);
    ctx.lineTo(x, ridge);
  }
  ctx.lineTo(w, horizon + 18);
  ctx.closePath();
  ctx.fill();

  // Hard-packed desert apron.
  const desert = ctx.createLinearGradient(0, horizon, 0, h);
  desert.addColorStop(0, '#302e25');
  desert.addColorStop(0.46, '#1b1b17');
  desert.addColorStop(1, '#080a0a');
  ctx.fillStyle = desert;
  ctx.fillRect(0, horizon, w, h - horizon);

  // Half-buried command bunker centered beneath the mountain.
  const vaultX = w / 2;
  const vaultW = Math.min(w * 0.3, 310);
  const vaultTop = horizon - h * 0.045;
  ctx.fillStyle = '#151b1c';
  ctx.beginPath();
  ctx.moveTo(vaultX - vaultW * 0.62, horizon + 14);
  ctx.lineTo(vaultX - vaultW * 0.46, vaultTop);
  ctx.lineTo(vaultX + vaultW * 0.46, vaultTop);
  ctx.lineTo(vaultX + vaultW * 0.62, horizon + 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#394342';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#080d0e';
  ctx.fillRect(vaultX - vaultW * 0.28, vaultTop + 9, vaultW * 0.56, h * 0.095);
  ctx.strokeStyle = 'rgba(157,255,79,0.42)';
  ctx.strokeRect(vaultX - vaultW * 0.28, vaultTop + 9, vaultW * 0.56, h * 0.095);
  ctx.fillStyle = '#222c2b';
  for (let y = vaultTop + 15; y < vaultTop + h * 0.095; y += 8) {
    ctx.fillRect(vaultX - vaultW * 0.25, y, vaultW * 0.5, 3);
  }
  ctx.fillStyle = 'rgba(157,255,79,0.65)';
  ctx.font = `700 ${8 * scale}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('SUBLEVEL 7', vaultX, vaultTop + 6);

  // Hangars flank the runway. The right bay is cracked open around a recovered craft.
  const drawHangar = (x: number, width: number, open: boolean) => {
    const y = horizon - h * 0.005;
    const hh = h * 0.11;
    ctx.fillStyle = '#202526';
    ctx.beginPath();
    ctx.moveTo(x, y + hh);
    ctx.lineTo(x + width * 0.08, y + 10);
    ctx.quadraticCurveTo(x + width / 2, y - 10, x + width * 0.92, y + 10);
    ctx.lineTo(x + width, y + hh);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#47504e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = open ? '#030707' : '#141a1b';
    ctx.fillRect(x + width * 0.09, y + 18, width * 0.82, hh - 18);
    if (!open) {
      ctx.strokeStyle = 'rgba(95,110,105,0.55)';
      for (let sx = x + width * 0.18; sx < x + width * 0.9; sx += width * 0.14) {
        ctx.beginPath();
        ctx.moveTo(sx, y + 20);
        ctx.lineTo(sx, y + hh);
        ctx.stroke();
      }
    } else {
      const craftX = x + width * 0.52;
      const craftY = y + hh * 0.64;
      const glow = ctx.createRadialGradient(craftX, craftY, 2, craftX, craftY, width * 0.35);
      glow.addColorStop(0, 'rgba(157,255,79,0.2)');
      glow.addColorStop(1, 'rgba(157,255,79,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x, y, width, hh);
      ctx.fillStyle = '#7f9188';
      ctx.beginPath();
      ctx.ellipse(craftX, craftY, width * 0.24, 7 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b7c9bd';
      ctx.beginPath();
      ctx.ellipse(craftX, craftY - 5 * scale, width * 0.09, 7 * scale, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(157,255,79,0.75)';
      for (const lx of [-0.12, 0, 0.12]) {
        ctx.beginPath();
        ctx.arc(craftX + width * lx, craftY + 1, 1.7 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(255,190,70,0.65)';
    ctx.fillRect(x + 5, y + hh - 4, 4, 4);
    ctx.fillRect(x + width - 9, y + hh - 4, 4, 4);
  };
  drawHangar(w * 0.035, w * 0.25, false);
  drawHangar(w * 0.715, w * 0.25, true);

  // Runway drives the eye toward the underground vault.
  const runway = ctx.createLinearGradient(0, horizon, 0, h);
  runway.addColorStop(0, '#181d1c');
  runway.addColorStop(1, '#050707');
  ctx.fillStyle = runway;
  ctx.beginPath();
  ctx.moveTo(w * 0.445, horizon);
  ctx.lineTo(w * 0.555, horizon);
  ctx.lineTo(w * 0.88, h);
  ctx.lineTo(w * 0.12, h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(190,205,180,0.36)';
  ctx.lineWidth = 2;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + side * w * 0.055, horizon);
    ctx.lineTo(w / 2 + side * w * 0.38, h);
    ctx.stroke();
  }

  // Runway threshold bars.
  ctx.fillStyle = 'rgba(218,224,202,0.35)';
  for (const side of [-1, 1] as const) {
    for (let stripe = 0; stripe < 4; stripe++) {
      const x = w / 2 + side * (w * 0.09 + stripe * 13 * scale);
      ctx.fillRect(x - 4 * scale, h - 120, 8 * scale, 52);
    }
  }
  // Fixed runway lights: deliberately sparse and non-flashing.
  for (let row = 0; row < 7; row++) {
    const v = (row + 0.8) / 7.8;
    const y = horizon + v * (h - horizon);
    const half = w * (0.055 + v * 0.325);
    const r = 1.2 + v * 2.1;
    for (const side of [-1, 1] as const) {
      const x = w / 2 + side * half;
      const on = (row + (side > 0 ? 1 : 0)) % 4 !== 2;
      ctx.fillStyle = on ? 'rgba(180,255,130,0.78)' : 'rgba(55,70,58,0.5)';
      if (on) {
        ctx.shadowColor = '#9dff4f';
        ctx.shadowBlur = 7;
      }
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Radar dishes watch the sky from both sides.
  const drawRadar = (x: number, y: number, size: number, phase: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#56615d';
    ctx.lineWidth = 2 * size;
    ctx.beginPath();
    ctx.moveTo(-8 * size, 18 * size);
    ctx.lineTo(0, 0);
    ctx.lineTo(8 * size, 18 * size);
    ctx.stroke();
    ctx.rotate(Math.sin(time * 0.00035 + phase) * 0.45);
    ctx.strokeStyle = '#87938c';
    ctx.lineWidth = 2 * size;
    ctx.beginPath();
    ctx.arc(0, 0, 17 * size, -0.1, Math.PI + 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12 * size, -12 * size);
    ctx.stroke();
    ctx.fillStyle = '#9dff4f';
    ctx.beginPath();
    ctx.arc(12 * size, -12 * size, 2 * size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawRadar(w * 0.31, horizon + 32, 0.72 * scale, 0);
  drawRadar(w * 0.67, horizon + 25, 0.62 * scale, 2);

  // Perimeter fencing stays at the sides so zombies remain readable.
  for (const side of [-1, 1] as const) {
    const innerTop = w / 2 + side * w * 0.31;
    const innerBottom = w / 2 + side * w * 0.49;
    ctx.strokeStyle = 'rgba(105,125,116,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(innerTop, horizon + 26);
    ctx.lineTo(innerBottom, h - 64);
    ctx.stroke();
    for (let post = 0; post < 6; post++) {
      const v = post / 5;
      const px = innerTop + (innerBottom - innerTop) * v;
      const py = horizon + 26 + (h - 64 - (horizon + 26)) * v;
      const ph = 18 + v * 35;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py - ph);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px, py - ph);
      ctx.lineTo(px - side * 8, py - ph - 5);
      ctx.stroke();
    }
  }

  // Two guard towers cast slow, opposing searchlights.
  for (const tower of [{ x: w * 0.1, phase: 0 }, { x: w * 0.9, phase: Math.PI }]) {
    const ty = horizon + h * 0.24;
    const sweepX = tower.x + Math.sin(time * 0.00045 + tower.phase) * w * 0.16;
    const beam = ctx.createLinearGradient(tower.x, ty - 58, sweepX, h - 70);
    beam.addColorStop(0, 'rgba(225,235,190,0.13)');
    beam.addColorStop(1, 'rgba(225,235,190,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(tower.x - 3, ty - 55);
    ctx.lineTo(tower.x + 3, ty - 55);
    ctx.lineTo(sweepX + 55, h - 70);
    ctx.lineTo(sweepX - 55, h - 70);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#313a38';
    ctx.lineWidth = 3;
    ctx.strokeRect(tower.x - 16, ty - 70, 32, 18);
    ctx.beginPath();
    ctx.moveTo(tower.x - 12, ty - 52);
    ctx.lineTo(tower.x - 19, ty);
    ctx.moveTo(tower.x + 12, ty - 52);
    ctx.lineTo(tower.x + 19, ty);
    ctx.stroke();
  }

  // Derelict military utility truck near the fence.
  ctx.save();
  ctx.translate(w * 0.79, h - 125);
  ctx.rotate(-0.07);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#30372c';
  ctx.fillRect(-30, -9, 60, 20);
  ctx.fillStyle = '#3f4939';
  ctx.fillRect(-27, -21, 26, 13);
  ctx.fillStyle = 'rgba(80,105,95,0.35)';
  ctx.fillRect(-23, -18, 17, 7);
  ctx.fillStyle = '#090b09';
  ctx.beginPath();
  ctx.arc(-20, 12, 7, 0, Math.PI * 2);
  ctx.arc(21, 12, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(220,205,120,0.45)';
  ctx.font = '700 6px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('USAF', 13, 3);
  ctx.restore();

  // Sparse scrub, rocks, and luminous tracks around the runway margins.
  for (let i = 0; i < 16; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = w / 2 + side * w * (0.29 + rand(i + 900) * 0.19);
    const y = horizon + 65 + rand(i + 910) * (h - horizon - 145);
    const size = 2 + rand(i + 920) * 7;
    ctx.fillStyle = '#27281f';
    ctx.beginPath();
    ctx.ellipse(x, y, size * 1.8, size, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(157,255,79,0.2)';
  ctx.lineWidth = 1.5;
  for (let step = 0; step < 5; step++) {
    const fx = w * 0.23 + step * 12 * scale;
    const fy = h * 0.58 + step * 18;
    ctx.beginPath();
    ctx.ellipse(fx, fy, 3 * scale, 7 * scale, -0.25, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Windblown dust catches moonlight near the ground.
  for (let i = 0; i < 36; i++) {
    const x = (rand(i + 950) * (w + 100) + time * 0.012) % (w + 100) - 50;
    const y = horizon + rand(i + 960) * (h - horizon - 65);
    ctx.fillStyle = `rgba(180,175,135,${0.05 + rand(i + 970) * 0.08})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
}

function drawFrozenOutpostScenery(ctx: CanvasRenderingContext2D, s: GameState, time: number, horizon: number) {
  const { width: w, height: h } = s;
  const scale = Math.max(0.78, Math.min(1.5, w / 960));

  // A wall of glaciated mountains closes the station off from the world.
  const rearPeaks: Array<[number, number]> = [];
  ctx.fillStyle = '#102332';
  ctx.beginPath();
  ctx.moveTo(0, horizon + 12);
  for (let x = 0; x <= w; x += Math.max(45, w / 18)) {
    const y = horizon - h * (0.08 + rand(x + 1100) * 0.16);
    rearPeaks.push([x, y]);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, horizon + 14);
  ctx.closePath();
  ctx.fill();

  // Wind-facing ridges catch moonlight while their lee sides stay blue-black.
  ctx.fillStyle = 'rgba(195,225,240,0.38)';
  for (const [px, py] of rearPeaks) {
    const cap = 13 + rand(px + 1110) * 16;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - cap, py + cap * 0.8);
    ctx.lineTo(px - cap * 0.28, py + cap * 0.55);
    ctx.lineTo(px + cap * 0.18, py + cap);
    ctx.closePath();
    ctx.fill();
  }

  // The ice shelf itself is layered and cracked rather than a flat snow field.
  const shelf = ctx.createLinearGradient(0, horizon, 0, h);
  shelf.addColorStop(0, '#264354');
  shelf.addColorStop(0.46, '#152b38');
  shelf.addColorStop(1, '#07131b');
  ctx.fillStyle = shelf;
  ctx.fillRect(0, horizon, w, h - horizon);

  for (let band = 0; band < 4; band++) {
    const y = horizon + h * (0.08 + band * 0.15);
    ctx.fillStyle = `rgba(205,235,245,${0.04 + band * 0.015})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 50) {
      ctx.lineTo(x, y + Math.sin(x * 0.015 + band) * 8 + (rand(x + band * 30) - 0.5) * 5);
    }
    ctx.lineTo(w, y + 22);
    ctx.lineTo(0, y + 20);
    ctx.closePath();
    ctx.fill();
  }

  // The station is carved into a glacier face, with only its reinforced front exposed.
  const stationX = w / 2;
  const stationW = Math.min(w * 0.38, 370);
  const stationTop = horizon - h * 0.055;
  ctx.fillStyle = '#b9d7e3';
  ctx.beginPath();
  ctx.moveTo(stationX - stationW * 0.68, horizon + 18);
  ctx.quadraticCurveTo(stationX - stationW * 0.54, stationTop - 18, stationX - stationW * 0.36, stationTop - 5);
  ctx.lineTo(stationX + stationW * 0.38, stationTop - 5);
  ctx.quadraticCurveTo(stationX + stationW * 0.57, stationTop - 15, stationX + stationW * 0.68, horizon + 18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#172831';
  ctx.fillRect(stationX - stationW * 0.43, stationTop + 6, stationW * 0.86, h * 0.105);
  ctx.strokeStyle = '#638391';
  ctx.lineWidth = 2;
  ctx.strokeRect(stationX - stationW * 0.43, stationTop + 6, stationW * 0.86, h * 0.105);

  // Frosted observation windows and a sealed central airlock.
  const windowY = stationTop + 16;
  for (const side of [-1, 1] as const) {
    const wx = stationX + side * stationW * 0.26;
    const windowGlow = ctx.createRadialGradient(wx, windowY + 10, 1, wx, windowY + 10, 35 * scale);
    windowGlow.addColorStop(0, 'rgba(255,190,105,0.18)');
    windowGlow.addColorStop(1, 'rgba(255,190,105,0)');
    ctx.fillStyle = windowGlow;
    ctx.fillRect(wx - 38 * scale, windowY - 20, 76 * scale, 60);
    ctx.fillStyle = 'rgba(255,190,105,0.5)';
    ctx.fillRect(wx - 17 * scale, windowY, 34 * scale, 15 * scale);
    ctx.strokeStyle = 'rgba(210,240,250,0.48)';
    ctx.strokeRect(wx - 17 * scale, windowY, 34 * scale, 15 * scale);
  }

  const doorW = 48 * scale;
  const doorH = 48 * scale;
  ctx.fillStyle = '#081319';
  ctx.fillRect(stationX - doorW / 2, stationTop + 12, doorW, doorH);
  ctx.strokeStyle = '#84f7e5';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(stationX - doorW / 2, stationTop + 12, doorW, doorH);
  ctx.fillStyle = 'rgba(132,247,229,0.7)';
  ctx.fillRect(stationX - 14 * scale, stationTop + 19, 28 * scale, 3);
  ctx.font = `700 ${7 * scale}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('POLAR-12', stationX, stationTop + 34 * scale);

  // A plowed service trench cuts through the drift toward the airlock.
  const trench = ctx.createLinearGradient(0, horizon, 0, h);
  trench.addColorStop(0, '#15242c');
  trench.addColorStop(1, '#050c11');
  ctx.fillStyle = trench;
  ctx.beginPath();
  ctx.moveTo(w * 0.445, horizon);
  ctx.lineTo(w * 0.555, horizon);
  ctx.lineTo(w * 0.82, h);
  ctx.lineTo(w * 0.18, h);
  ctx.closePath();
  ctx.fill();

  // High snowbanks frame the lane and keep the center readable.
  for (const side of [-1, 1] as const) {
    const bank = ctx.createLinearGradient(0, horizon, 0, h);
    bank.addColorStop(0, 'rgba(220,240,248,0.58)');
    bank.addColorStop(1, 'rgba(105,155,180,0.36)');
    ctx.fillStyle = bank;
    ctx.beginPath();
    ctx.moveTo(w / 2 + side * w * 0.055, horizon);
    ctx.lineTo(w / 2 + side * w * 0.32, h);
    ctx.lineTo(w / 2 + side * w * 0.48, h);
    ctx.lineTo(w / 2 + side * w * 0.13, horizon);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(225,246,252,0.38)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 + side * w * 0.055, horizon);
    ctx.lineTo(w / 2 + side * w * 0.32, h);
    ctx.stroke();
  }

  // Red guide poles reveal the depth of the buried road.
  for (let row = 0; row < 5; row++) {
    const v = (row + 0.7) / 5.7;
    const y = horizon + v * (h - horizon);
    const half = w * (0.07 + v * 0.3);
    const poleH = 13 + v * 28;
    for (const side of [-1, 1] as const) {
      const x = w / 2 + side * half;
      ctx.strokeStyle = '#d84848';
      ctx.lineWidth = 2 + v;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - poleH);
      ctx.stroke();
      ctx.fillStyle = 'rgba(235,245,250,0.8)';
      ctx.fillRect(x - 2, y - poleH + 5, 4, 5);
    }
  }

  // Collapsed geodesic radome on the left.
  const domeX = w * 0.13;
  const domeY = horizon + h * 0.18;
  const domeR = 48 * scale;
  ctx.save();
  ctx.translate(domeX, domeY);
  ctx.rotate(-0.13);
  ctx.strokeStyle = 'rgba(170,220,235,0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, domeR, Math.PI, Math.PI * 2);
  ctx.stroke();
  for (let spoke = -2; spoke <= 2; spoke++) {
    ctx.beginPath();
    ctx.moveTo(spoke * domeR * 0.2, 0);
    ctx.lineTo(spoke * domeR * 0.34, -domeR * (0.65 + Math.abs(spoke) * 0.08));
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-domeR, 0);
  ctx.lineTo(domeR, 0);
  ctx.stroke();
  ctx.fillStyle = 'rgba(190,230,242,0.12)';
  ctx.beginPath();
  ctx.arc(0, 0, domeR, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Surviving communications mast and slowly tracking dish on the right.
  const mastX = w * 0.86;
  const mastBase = horizon + h * 0.28;
  ctx.strokeStyle = '#668491';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mastX - 22 * scale, mastBase);
  ctx.lineTo(mastX, horizon - h * 0.02);
  ctx.lineTo(mastX + 22 * scale, mastBase);
  for (let y = horizon + 12; y < mastBase; y += 24 * scale) {
    const v = (y - horizon) / (mastBase - horizon);
    const half = 5 + v * 14 * scale;
    ctx.moveTo(mastX - half, y);
    ctx.lineTo(mastX + half, y);
  }
  ctx.stroke();
  ctx.save();
  ctx.translate(mastX, horizon + 3);
  ctx.rotate(Math.sin(time * 0.00025) * 0.28);
  ctx.strokeStyle = '#b2d4df';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 20 * scale, -0.15, Math.PI + 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(13 * scale, -13 * scale);
  ctx.stroke();
  ctx.restore();

  // A cable tram hangs abandoned between the mast and glacier station.
  const cableY = horizon + 8;
  ctx.strokeStyle = 'rgba(115,150,165,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.58, cableY);
  ctx.quadraticCurveTo(w * 0.72, cableY + 30, mastX, horizon + 1);
  ctx.stroke();
  const tramX = w * 0.7;
  const tramY = cableY + 18;
  ctx.fillStyle = '#17272f';
  ctx.fillRect(tramX - 18 * scale, tramY, 36 * scale, 17 * scale);
  ctx.strokeStyle = '#7899a6';
  ctx.strokeRect(tramX - 18 * scale, tramY, 36 * scale, 17 * scale);
  ctx.fillStyle = 'rgba(120,190,210,0.28)';
  ctx.fillRect(tramX - 13 * scale, tramY + 4, 9 * scale, 6 * scale);
  ctx.fillRect(tramX + 4 * scale, tramY + 4, 9 * scale, 6 * scale);

  // A snowcat sits half-buried where its crew abandoned it.
  ctx.save();
  ctx.translate(w * 0.77, h - 130);
  ctx.rotate(0.08);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#d78332';
  ctx.fillRect(-27, -12, 54, 22);
  ctx.fillStyle = '#263740';
  ctx.fillRect(-21, -25, 31, 14);
  ctx.fillStyle = 'rgba(135,200,220,0.35)';
  ctx.fillRect(-17, -22, 21, 8);
  ctx.fillStyle = '#10171a';
  ctx.fillRect(-34, 7, 68, 8);
  for (let x = -28; x <= 28; x += 8) {
    ctx.strokeStyle = '#46545a';
    ctx.beginPath();
    ctx.moveTo(x, 8);
    ctx.lineTo(x + 5, 14);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(225,242,248,0.62)';
  ctx.beginPath();
  ctx.ellipse(8, -26, 22, 5, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Blue light leaks from deep crevasses at the edges of the shelf.
  for (const crevasse of [
    { x: w * 0.08, y: h * 0.5, len: h * 0.24, bend: 1 },
    { x: w * 0.92, y: h * 0.58, len: h * 0.22, bend: -1 },
    { x: w * 0.2, y: h * 0.73, len: h * 0.13, bend: -1 },
  ]) {
    ctx.strokeStyle = 'rgba(90,220,255,0.18)';
    ctx.shadowColor = '#55cfff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(crevasse.x, crevasse.y);
    ctx.lineTo(crevasse.x + crevasse.bend * 14, crevasse.y + crevasse.len * 0.32);
    ctx.lineTo(crevasse.x - crevasse.bend * 9, crevasse.y + crevasse.len * 0.65);
    ctx.lineTo(crevasse.x + crevasse.bend * 18, crevasse.y + crevasse.len);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Wind-sculpted drifts and exposed ice crystals add local detail.
  for (let i = 0; i < 12; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = w / 2 + side * w * (0.27 + rand(i + 1200) * 0.2);
    const y = horizon + 60 + rand(i + 1210) * (h - horizon - 130);
    const width = 18 + rand(i + 1220) * 46;
    ctx.fillStyle = 'rgba(220,240,248,0.16)';
    ctx.beginPath();
    ctx.ellipse(x, y, width, 5 + width * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    if (i % 3 === 0) {
      ctx.fillStyle = 'rgba(145,220,245,0.38)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 6 * scale, y);
      ctx.lineTo(x + 1, y - (18 + rand(i) * 24) * scale);
      ctx.lineTo(x + 7 * scale, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Low blowing snow travels horizontally while the global snow falls vertically.
  ctx.strokeStyle = 'rgba(225,245,252,0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 36; i++) {
    const x = (rand(i + 1250) * (w + 180) + time * 0.055) % (w + 180) - 90;
    const y = horizon + rand(i + 1260) * (h - horizon - 65);
    const len = 12 + rand(i + 1270) * 26;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y - 3);
    ctx.stroke();
  }
}

/** Distinctive, recognizable set-dressing per map theme. */
function drawThemeScenery(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  theme: MapTheme,
  time: number,
  hy: number,
) {
  const { width: w, height: h } = s;

  if (theme.id === 'city') {
    const hzn = hy;
    const sceneScale = Math.max(0.78, Math.min(1.5, w / 960));

    // Toxic light pollution burns through the lowest cloud deck.
    const glow = ctx.createLinearGradient(0, hzn - h * 0.28, 0, hzn + 8);
    glow.addColorStop(0, 'rgba(20,120,125,0)');
    glow.addColorStop(0.6, 'rgba(30,180,170,0.12)');
    glow.addColorStop(1, 'rgba(80,255,205,0.24)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, hzn - h * 0.28, w, h * 0.28 + 8);

    // Dense, powerless blocks disappear into the haze behind the main avenue.
    for (let i = 0; i < 30; i++) {
      const bx = (i / 30) * w + (rand(i + 200) - 0.5) * 10;
      const bw = w / 29 + 3;
      const bh = h * (0.04 + rand(i + 201) * 0.14);
      ctx.fillStyle = i % 3 === 0 ? '#071116' : '#09151a';
      ctx.fillRect(bx, hzn - bh, bw, bh + 8);
      if (rand(i + 220) > 0.78) {
        ctx.fillStyle = 'rgba(255,92,55,0.45)';
        ctx.fillRect(bx + bw * 0.3, hzn - bh + 7, 2, 2);
      }
    }

    // Ruined towers frame the lane. Every foundation sits on the same street
    // grade; the broken rooflines provide the irregular silhouette.
    const towers = 10;
    for (let i = 0; i < towers; i++) {
      const seg = w / towers;
      const bx = i * seg - 4;
      const bw = seg + 8;
      const edgeHeight = Math.abs((i + 0.5) / towers - 0.5) * 2;
      const bh = hzn * (0.38 + rand(i + 9) * 0.42 + edgeHeight * 0.38);
      const emergency = rand(i + 4) > 0.55 ? '32,242,194' : '255,72,55';

      ctx.save();
      ctx.translate(bx + bw / 2, hzn);
      const left = -bw / 2;
      const buildingTop = -bh;
      const bg = ctx.createLinearGradient(left, 0, left + bw, 0);
      bg.addColorStop(0, '#111c22');
      bg.addColorStop(0.48, '#0a1319');
      bg.addColorStop(1, '#03090d');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(left, 6);
      ctx.lineTo(left, buildingTop + 12);
      ctx.lineTo(left + bw * 0.18, buildingTop + 2);
      ctx.lineTo(left + bw * 0.34, buildingTop + 15 + rand(i + 70) * 16);
      ctx.lineTo(left + bw * 0.56, buildingTop + rand(i + 71) * 8);
      ctx.lineTo(left + bw * 0.74, buildingTop + 18 + rand(i + 72) * 15);
      ctx.lineTo(left + bw, buildingTop + 8);
      ctx.lineTo(left + bw, 6);
      ctx.closePath();
      ctx.fill();

      // Mostly dead windows; only a tiny number of failing circuits flicker,
      // and they do it slowly enough to feel atmospheric rather than strobing.
      const colW = Math.max(8, bw / 8);
      for (let wy = buildingTop + 27; wy < -5; wy += 12) {
        for (let wx = left + 6; wx < left + bw - 6; wx += colW) {
          const power = rand((i + 1) * 900 + wx * 0.7 + wy);
          if (power > 0.83) {
            const flicker = power > 0.975 ? Math.sin(time * 0.0018 + wx * 0.2) > -0.65 : true;
            ctx.fillStyle = flicker ? `rgba(${emergency},0.72)` : 'rgba(15,35,38,0.55)';
          } else {
            ctx.fillStyle = 'rgba(17,34,39,0.72)';
          }
          ctx.fillRect(wx, wy, Math.max(3, colW - 4), 5);
        }
      }

      // Exposed floor slabs and a dangling cable sell the structural collapse.
      if (i % 3 === 1) {
        ctx.strokeStyle = 'rgba(70,92,96,0.6)';
        ctx.lineWidth = 1;
        for (let slab = 0; slab < 3; slab++) {
          const sy = buildingTop + 15 + slab * 7;
          ctx.beginPath();
          ctx.moveTo(left + bw * 0.58, sy);
          ctx.lineTo(left + bw + 6, sy + 3);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(30,45,48,0.9)';
        ctx.beginPath();
        ctx.moveTo(left + bw * 0.78, buildingTop + 10);
        ctx.quadraticCurveTo(left + bw * 0.95, buildingTop + 42, left + bw * 0.7, buildingTop + 75);
        ctx.stroke();
      }

      if (bh > h * 0.34) {
        ctx.strokeStyle = '#17252a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, buildingTop + 5);
        ctx.lineTo(0, buildingTop - 17);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,65,45,${Math.sin(time * 0.006 + i) > 0.2 ? 0.95 : 0.12})`;
        ctx.beginPath();
        ctx.arc(0, buildingTop - 17, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Continuous storefront plinth makes the skyline meet the road on one
    // clean, level baseline instead of appearing to float at mixed heights.
    ctx.fillStyle = '#071014';
    ctx.fillRect(0, hzn - 2, w, 10);
    ctx.strokeStyle = 'rgba(65,92,94,0.42)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, hzn + 7);
    ctx.lineTo(w, hzn + 7);
    ctx.stroke();

    // Wet evacuation boulevard in deep perspective.
    const road = ctx.createLinearGradient(0, hzn, 0, h);
    road.addColorStop(0, 'rgba(20,30,33,0.96)');
    road.addColorStop(1, 'rgba(4,8,10,0.98)');
    ctx.fillStyle = road;
    ctx.beginPath();
    ctx.moveTo(w * 0.43, hzn);
    ctx.lineTo(w * 0.57, hzn);
    ctx.lineTo(w * 0.93, h);
    ctx.lineTo(w * 0.07, h);
    ctx.closePath();
    ctx.fill();

    // Reflected quarantine light lifts the combat lane out of the darkness.
    const laneGlow = ctx.createRadialGradient(w / 2, hzn + h * 0.14, 8, w / 2, hzn + h * 0.3, h * 0.62);
    laneGlow.addColorStop(0, 'rgba(42,185,170,0.13)');
    laneGlow.addColorStop(0.52, 'rgba(25,95,96,0.055)');
    laneGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = laneGlow;
    ctx.fillRect(0, hzn, w, h - hzn);

    // Concrete curbs and dead lane markers widen toward the camera.
    for (const side of [-1, 1] as const) {
      ctx.strokeStyle = 'rgba(85,102,105,0.52)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w / 2 + side * w * 0.07, hzn);
      ctx.lineTo(w / 2 + side * w * 0.43, h);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,188,64,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([14, 18]);
      ctx.beginPath();
      ctx.moveTo(w / 2 + side * w * 0.022, hzn + 8);
      ctx.lineTo(w / 2 + side * w * 0.12, h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Broken elevated rail at the horizon, including one half-dropped carriage.
    const railY = hzn + h * 0.035;
    ctx.fillStyle = '#10191d';
    ctx.fillRect(0, railY, w, 8);
    ctx.fillStyle = '#071014';
    for (let x = w * 0.03; x < w; x += w * 0.16) ctx.fillRect(x, railY + 8, 8, h * 0.12);
    ctx.save();
    ctx.translate(w * 0.66, railY + 2);
    ctx.rotate(0.1);
    ctx.fillStyle = '#172329';
    ctx.fillRect(-42, -13, 84, 18);
    ctx.fillStyle = 'rgba(255,72,45,0.28)';
    for (let x = -34; x < 36; x += 14) ctx.fillRect(x, -9, 8, 6);
    ctx.restore();

    const busX = w * 0.38;
    const busY = hzn + h * 0.17;

    // Most street lamps are dead. The survivors stay steadily lit rather than
    // flashing, so the road has a fixed readable lighting pattern.
    for (let r = 0; r < 3; r++) {
      const v = 0.26 + r * 0.23;
      const ly = hzn + v * (h - hzn);
      const edgeHalf = 0.07 + 0.36 * v;
      const scale = 0.48 + v * 0.75;
      const side = r % 2 === 0 ? -1 : 1;
      const lx = w / 2 + side * w * (edgeHalf + 0.02);
      const poleTop = ly - 58 * scale;
      const headX = lx - side * 17 * scale;
      ctx.strokeStyle = '#151f22';
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx, poleTop);
      ctx.lineTo(headX, poleTop + (r === 2 ? 7 : 0));
      ctx.stroke();
      const alive = r !== 1;
      if (alive) {
        const lamp = ctx.createRadialGradient(headX, poleTop, 1, headX, poleTop, 44 * scale);
        lamp.addColorStop(0, 'rgba(255,181,76,0.48)');
        lamp.addColorStop(1, 'rgba(255,130,40,0)');
        ctx.fillStyle = lamp;
        ctx.beginPath();
        ctx.arc(headX, poleTop, 44 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Abandoned evacuation bus blocks one lane near the horizon.
    ctx.save();
    ctx.translate(busX, busY);
    ctx.rotate(-0.045);
    ctx.scale(sceneScale, sceneScale);
    ctx.fillStyle = '#172126';
    ctx.fillRect(-34, -13, 68, 25);
    ctx.fillStyle = '#26343a';
    ctx.fillRect(-29, -9, 54, 9);
    ctx.fillStyle = 'rgba(70,170,165,0.18)';
    for (let x = -26; x < 22; x += 12) ctx.fillRect(x, -7, 8, 5);
    ctx.fillStyle = '#080c0e';
    ctx.beginPath();
    ctx.arc(-22, 13, 6, 0, Math.PI * 2);
    ctx.arc(23, 13, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,60,40,0.65)';
    ctx.fillRect(29, 0, 3, 5);
    ctx.restore();

    // Abandoned civilian sedan, left crooked across a lane.
    ctx.save();
    ctx.translate(w * 0.27, h - 158);
    ctx.rotate(-0.12);
    ctx.scale(sceneScale, sceneScale);
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2d302b';
    ctx.fillRect(-31, -8, 62, 17);
    ctx.fillStyle = '#3d423b';
    ctx.beginPath();
    ctx.moveTo(-18, -8);
    ctx.lineTo(-10, -20);
    ctx.lineTo(14, -20);
    ctx.lineTo(22, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(80,115,112,0.3)';
    ctx.fillRect(-9, -17, 20, 7);
    ctx.strokeStyle = '#191d1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-28, -2);
    ctx.lineTo(-16, 3);
    ctx.stroke();
    ctx.fillStyle = '#050708';
    ctx.beginPath();
    ctx.arc(-20, 10, 6, 0, Math.PI * 2);
    ctx.arc(21, 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,25,18,0.58)';
    ctx.fillRect(-31, -4, 3, 5);
    ctx.restore();

    // Abandoned police cruiser, right side, doors open and light bar dead.
    ctx.save();
    ctx.translate(w * 0.74, h - 125);
    ctx.rotate(0.09);
    ctx.scale(sceneScale, sceneScale);
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 36, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d1d7d3';
    ctx.fillRect(-32, -8, 64, 17);
    ctx.fillStyle = '#12191d';
    ctx.fillRect(-5, -8, 37, 17);
    ctx.beginPath();
    ctx.moveTo(-18, -8);
    ctx.lineTo(-10, -21);
    ctx.lineTo(14, -21);
    ctx.lineTo(23, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(80,120,125,0.35)';
    ctx.fillRect(-8, -18, 19, 7);
    ctx.fillStyle = '#421718';
    ctx.fillRect(-8, -24, 7, 3);
    ctx.fillStyle = '#14283a';
    ctx.fillRect(1, -24, 7, 3);
    ctx.fillStyle = '#050708';
    ctx.beginPath();
    ctx.arc(-21, 10, 6, 0, Math.PI * 2);
    ctx.arc(22, 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(27, -5);
    ctx.rotate(-0.65);
    ctx.fillStyle = '#11191d';
    ctx.fillRect(0, -7, 18, 14);
    ctx.restore();
    ctx.fillStyle = 'rgba(15,20,22,0.85)';
    ctx.font = '700 6px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('POLICE', -19, 3);
    ctx.restore();

    for (const side of [-1, 1] as const) {
      const bx = w / 2 + side * w * 0.31;
      const by = h - 73;
      ctx.fillStyle = '#343d3e';
      ctx.beginPath();
      ctx.moveTo(bx - 34, by);
      ctx.lineTo(bx - 27, by - 18);
      ctx.lineTo(bx + 27, by - 18);
      ctx.lineTo(bx + 34, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffb340';
      for (let stripe = -20; stripe <= 20; stripe += 16) {
        ctx.save();
        ctx.translate(bx + stripe, by - 9);
        ctx.rotate(-0.7);
        ctx.fillRect(-2, -8, 4, 16);
        ctx.restore();
      }
    }

    // Cracked asphalt and smeared reflections make the road feel wet and used.
    ctx.strokeStyle = 'rgba(84,109,109,0.32)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) {
      let cx = w * (0.18 + rand(i + 610) * 0.64);
      let cy = hzn + h * (0.16 + rand(i + 620) * 0.56);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let branch = 0; branch < 3; branch++) {
        cx += (rand(i * 7 + branch + 630) - 0.5) * 34;
        cy += 9 + rand(i * 9 + branch + 640) * 17;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const rx = (rand(i + 80) * 0.72 + 0.14) * w;
      const ry = hzn + 42 + rand(i + 81) * (h - hzn - 125);
      const col = i % 3 === 0 ? '255,73,56' : '32,242,194';
      ctx.fillStyle = `rgba(${col},${0.06 + 0.05 * Math.abs(Math.sin(time * 0.003 + i))})`;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 12 + rand(i) * 23, 2.5 + rand(i + 7) * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Small fires burn at the edges; smoke stays out of the combat lane.
    for (const fire of [{ x: w * 0.09, y: h * 0.61 }, { x: w * 0.91, y: h * 0.46 }]) {
      const pulse = 0.7 + Math.sin(time * 0.015 + fire.x) * 0.18;
      const fireGlow = ctx.createRadialGradient(fire.x, fire.y, 2, fire.x, fire.y, 48);
      fireGlow.addColorStop(0, `rgba(255,165,55,${0.45 * pulse})`);
      fireGlow.addColorStop(1, 'rgba(255,70,20,0)');
      ctx.fillStyle = fireGlow;
      ctx.fillRect(fire.x - 48, fire.y - 48, 96, 96);
      ctx.fillStyle = '#ff7a32';
      ctx.beginPath();
      ctx.moveTo(fire.x - 7, fire.y + 7);
      ctx.quadraticCurveTo(fire.x - 3, fire.y - 18 * pulse, fire.x, fire.y - 7);
      ctx.quadraticCurveTo(fire.x + 8, fire.y - 24 * pulse, fire.x + 9, fire.y + 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(22,31,32,0.2)';
      for (let smoke = 0; smoke < 3; smoke++) {
        const sy = fire.y - 24 - smoke * 17 - ((time * 0.01 + smoke * 9) % 14);
        ctx.beginPath();
        ctx.arc(fire.x + Math.sin(time * 0.001 + smoke) * 7, sy, 11 + smoke * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Fine slanted rain catches the city lights without obscuring targets.
    ctx.strokeStyle = 'rgba(135,225,220,0.16)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 42; i++) {
      const x = (rand(i + 700) * (w + 80) + time * 0.065) % (w + 80) - 40;
      const y = (rand(i + 720) * h + time * 0.16 * (0.7 + rand(i + 730))) % h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 7, y + 18);
      ctx.stroke();
    }
    return;
  }

  if (theme.id === 'forest') {
    // Dense pine treeline along the horizon.
    ctx.fillStyle = '#0a0303';
    for (let i = 0; i < 26; i++) {
      const tx = (i / 26) * w + (rand(i) - 0.5) * 18;
      const th = 26 + rand(i + 5) * 40;
      ctx.beginPath();
      ctx.moveTo(tx, hy + 4);
      ctx.lineTo(tx - 10, hy + 4);
      ctx.lineTo(tx, hy - th);
      ctx.lineTo(tx + 10, hy + 4);
      ctx.closePath();
      ctx.fill();
    }
    // Glowing eyes peering from the dark edges.
    for (let i = 0; i < 6; i++) {
      const side = i % 2 === 0 ? 0.06 : 0.94;
      const ex = side * w + (rand(i) - 0.5) * 30;
      const ey = hy + 40 + rand(i + 3) * (h - hy - 120);
      const blink = Math.sin(time * 0.002 + i * 2) > -0.3 ? 1 : 0.1;
      ctx.fillStyle = `rgba(255,40,40,${0.8 * blink})`;
      ctx.beginPath();
      ctx.arc(ex - 4, ey, 2.2, 0, Math.PI * 2);
      ctx.arc(ex + 4, ey, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (theme.id === 'lab') {
    drawArea67Scenery(ctx, s, time, hy);
    return;
  }

  if (theme.id === 'lab-legacy') {
    // Back wall + a row of blinking monitor/server lights.
    ctx.fillStyle = 'rgba(0,40,36,0.45)';
    ctx.fillRect(0, hy, w, 24);
    for (let i = 0; i < 14; i++) {
      const mx = 24 + i * ((w - 48) / 14);
      const on = Math.sin(time * 0.005 + i * 1.3) > 0;
      ctx.fillStyle = on ? 'rgba(0,255,200,0.85)' : 'rgba(0,255,200,0.18)';
      ctx.fillRect(mx, hy + 7, 6, 4);
      ctx.fillStyle = 'rgba(255,209,102,0.5)';
      if ((i + (on ? 1 : 0)) % 3 === 0) ctx.fillRect(mx + 8, hy + 7, 2, 4);
    }
    // Three containment pods with a floating specimen + rising bubbles.
    for (const tx of [w * 0.13, w * 0.5, w * 0.87]) {
      const ty = hy + 14;
      const tubeH = h * 0.34;
      const grad = ctx.createLinearGradient(tx, ty, tx, ty + tubeH);
      grad.addColorStop(0, 'rgba(0,255,200,0.24)');
      grad.addColorStop(1, 'rgba(0,255,200,0.05)');
      ctx.fillStyle = grad;
      ctx.fillRect(tx - 15, ty, 30, tubeH);
      ctx.strokeStyle = 'rgba(0,255,200,0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx - 15, ty, 30, tubeH);
      ctx.fillStyle = '#0a3a34'; // metal caps
      ctx.fillRect(tx - 18, ty - 5, 36, 6);
      ctx.fillRect(tx - 18, ty + tubeH - 1, 36, 6);
      ctx.fillStyle = 'rgba(10,40,36,0.85)'; // specimen
      ctx.beginPath();
      ctx.ellipse(tx, ty + tubeH * 0.5 + Math.sin(time * 0.002 + tx) * 6, 8, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let b = 0; b < 4; b++) {
        const by = ty + tubeH - ((time * 0.05 + b * 40 + tx) % tubeH);
        ctx.fillStyle = 'rgba(180,255,240,0.5)';
        ctx.beginPath();
        ctx.arc(tx + (rand(b + tx) - 0.5) * 16, by, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Overhead light cones.
    for (const lx of [w * 0.3, w * 0.7]) {
      const g = ctx.createLinearGradient(lx, hy, lx, h * 0.62);
      g.addColorStop(0, 'rgba(0,255,200,0.12)');
      g.addColorStop(1, 'rgba(0,255,200,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(lx - 6, hy);
      ctx.lineTo(lx + 6, hy);
      ctx.lineTo(lx + 42, h * 0.62);
      ctx.lineTo(lx - 42, h * 0.62);
      ctx.closePath();
      ctx.fill();
    }
    // Police cars locking down the entrance up top, lights flashing red/blue.
    {
      const drawCopCar = (cx: number, cy: number, scale: number, phase: number) => {
        const blue = Math.sin(time * 0.012 + phase) > 0;
        const hot = blue ? '40,120,255' : '255,40,40';
        // glow halo over the light bar
        const halo = ctx.createRadialGradient(cx, cy - 10 * scale, 1, cx, cy - 10 * scale, 28 * scale);
        halo.addColorStop(0, `rgba(${hot},0.5)`);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy - 10 * scale, 28 * scale, 0, Math.PI * 2);
        ctx.fill();
        // body + cabin
        ctx.fillStyle = '#0e1418';
        ctx.fillRect(cx - 22 * scale, cy - 8 * scale, 44 * scale, 12 * scale);
        ctx.beginPath();
        ctx.moveTo(cx - 12 * scale, cy - 8 * scale);
        ctx.lineTo(cx - 7 * scale, cy - 16 * scale);
        ctx.lineTo(cx + 9 * scale, cy - 16 * scale);
        ctx.lineTo(cx + 14 * scale, cy - 8 * scale);
        ctx.closePath();
        ctx.fill();
        // tinted windows
        ctx.fillStyle = 'rgba(120,200,210,0.3)';
        ctx.fillRect(cx - 7 * scale, cy - 15 * scale, 15 * scale, 6 * scale);
        // roof light bar (two cells, alternating)
        ctx.fillStyle = blue ? '#3a7bff' : '#ff3030';
        ctx.fillRect(cx - 6 * scale, cy - 19 * scale, 5 * scale, 3 * scale);
        ctx.fillStyle = blue ? '#ff3030' : '#3a7bff';
        ctx.fillRect(cx + 1 * scale, cy - 19 * scale, 5 * scale, 3 * scale);
        // wheels
        ctx.fillStyle = '#05080a';
        ctx.beginPath();
        ctx.arc(cx - 13 * scale, cy + 4 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 13 * scale, cy + 4 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
        // headlight beam pointing the way it's driving (right)
        const beam = ctx.createLinearGradient(cx + 20 * scale, cy, cx + 64 * scale, cy);
        beam.addColorStop(0, 'rgba(255,245,200,0.28)');
        beam.addColorStop(1, 'rgba(255,245,200,0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(cx + 20 * scale, cy - 5 * scale);
        ctx.lineTo(cx + 64 * scale, cy - 12 * scale);
        ctx.lineTo(cx + 64 * scale, cy + 6 * scale);
        ctx.lineTo(cx + 20 * scale, cy + 3 * scale);
        ctx.closePath();
        ctx.fill();
        // light spilling on the floor
        const fl = ctx.createRadialGradient(cx, cy + 11 * scale, 1, cx, cy + 11 * scale, 32 * scale);
        fl.addColorStop(0, `rgba(${hot},0.18)`);
        fl.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fl;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 11 * scale, 32 * scale, 8 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      // Drive left → right across the top, looping off-screen.
      const cycle = w + 120;
      const car1X = ((time * 0.05) % cycle) - 60;
      const car2X = ((time * 0.05 + cycle * 0.5) % cycle) - 60;
      drawCopCar(car1X, hy + 40, 0.82, 0);
      drawCopCar(car2X, hy + 40, 0.82, Math.PI); // out of sync for extra urgency
    }
    // Red lockdown laser grid strung across the chamber (the top beam is replaced
    // by the cop cars above). A laser flashes hard whenever a zombie breaks it.
    for (let i = 1; i < 4; i++) {
      const ly = hy + 34 + i * ((h - hy - 104) / 4) + Math.sin(time * 0.001 + i) * 5;
      const tilt = i % 2 ? -10 : 10;
      // tripped if any zombie is crossing this beam's height
      const tripped = s.zombies.some((z) => Math.abs(z.y - ly) < 16);
      const alpha = tripped
        ? Math.sin(time * 0.03) > 0 ? 1 : 0.25 // fast alarm blink
        : 0.25 + 0.35 * Math.abs(Math.sin(time * 0.004 + i)); // idle pulse
      ctx.strokeStyle = `rgba(255,40,40,${alpha})`;
      ctx.lineWidth = tripped ? 2.5 : 1.5;
      if (tripped) {
        ctx.shadowColor = 'rgba(255,40,40,0.9)';
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(w, ly + tilt);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // wall emitter nodes
      ctx.fillStyle = `rgba(255,90,90,${tripped ? alpha : 0.6 + 0.4 * Math.sin(time * 0.006 + i)})`;
      ctx.beginPath();
      ctx.arc(4, ly, tripped ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w - 4, ly + tilt, tripped ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Search helicopter patrolling overhead with a sweeping searchlight.
    {
      const hxp = ((time * 0.03) % (w + 200)) - 100;
      const hyp = hy * 0.5;
      const beamX = hxp + Math.sin(time * 0.001) * 70;
      const cone = ctx.createLinearGradient(hxp, hyp, beamX, h - 64);
      cone.addColorStop(0, 'rgba(190,255,245,0.16)');
      cone.addColorStop(1, 'rgba(190,255,245,0)');
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(hxp - 6, hyp);
      ctx.lineTo(hxp + 6, hyp);
      ctx.lineTo(beamX + 70, h - 64);
      ctx.lineTo(beamX - 70, h - 64);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0c1a18'; // body + tail
      ctx.fillRect(hxp - 12, hyp - 4, 24, 7);
      ctx.fillRect(hxp + 10, hyp - 2, 12, 3);
      ctx.strokeStyle = 'rgba(160,220,210,0.6)'; // rotor
      ctx.lineWidth = 1.5;
      const rot = 6 + Math.abs(Math.sin(time * 0.05)) * 14;
      ctx.beginPath();
      ctx.moveTo(hxp - rot, hyp - 6);
      ctx.lineTo(hxp + rot, hyp - 6);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,60,60,${Math.sin(time * 0.02) > 0 ? 0.95 : 0.2})`; // nav blinker
      ctx.beginPath();
      ctx.arc(hxp - 12, hyp + 3, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Floating dust motes drifting up through the light.
    for (let i = 0; i < 26; i++) {
      const dx = rand(i + 90) * w;
      const dy = hy + ((rand(i + 91) * 1000 + time * 0.012 * (0.4 + rand(i))) % (h - hy - 64));
      ctx.fillStyle = `rgba(180,255,240,${0.12 + 0.16 * Math.abs(Math.sin(time * 0.003 + i))})`;
      ctx.fillRect(dx, dy, 1.5, 1.5);
    }
    // Holographic status readout flickering between the pods.
    {
      const hxp = w * 0.69;
      const hyp = h * 0.46;
      const flick = Math.sin(time * 0.02) > -0.7 ? 1 : 0.3;
      ctx.save();
      ctx.globalAlpha = 0.4 * flick;
      ctx.strokeStyle = 'rgba(0,255,200,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(hxp - 24, hyp - 18, 48, 36);
      ctx.fillStyle = 'rgba(0,255,200,0.75)';
      for (let b = 0; b < 4; b++) {
        const barW = 6 + Math.abs(Math.sin(time * 0.004 + b)) * 30;
        ctx.fillRect(hxp - 20, hyp - 13 + b * 8, barW, 3);
      }
      ctx.restore();
    }
    // Wall pipes running down each side.
    for (const px of [w * 0.04, w * 0.96]) {
      ctx.strokeStyle = 'rgba(120,200,190,0.35)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(px, hy);
      ctx.lineTo(px, h - 64);
      ctx.stroke();
      ctx.fillStyle = 'rgba(120,200,190,0.5)'; // joints
      for (let yy = hy + 20; yy < h - 64; yy += 50) ctx.fillRect(px - 5, yy, 10, 4);
    }
    // Pulsing red alarm beacon at the top centre.
    const alarm = 0.3 + 0.5 * Math.abs(Math.sin(time * 0.006));
    const ag = ctx.createRadialGradient(w / 2, hy + 6, 1, w / 2, hy + 6, 30);
    ag.addColorStop(0, `rgba(255,60,60,${alarm})`);
    ag.addColorStop(1, 'rgba(255,60,60,0)');
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(w / 2, hy + 6, 30, 0, Math.PI * 2);
    ctx.fill();
    // Drifting steam vents from the floor.
    for (let i = 0; i < 4; i++) {
      const vx = (rand(i + 40) * 0.8 + 0.1) * w;
      const vy = h - 80 - ((time * 0.03 + i * 60) % 90);
      ctx.fillStyle = `rgba(180,255,240,${0.12 * (1 - ((h - 80 - vy) / 90))})`;
      ctx.beginPath();
      ctx.arc(vx + Math.sin(time * 0.002 + i) * 8, vy, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    // Hazard chevrons just above the base.
    const cy = h - 74;
    for (let x = 0; x < w; x += 28) {
      ctx.fillStyle = (x / 28) % 2 === 0 ? 'rgba(255,209,102,0.5)' : 'rgba(10,12,10,0.6)';
      ctx.beginPath();
      ctx.moveTo(x, cy);
      ctx.lineTo(x + 14, cy);
      ctx.lineTo(x + 7, cy + 8);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  if (theme.id === 'tundra') {
    drawFrozenOutpostScenery(ctx, s, time, hy);
    return;
  }

  if (theme.id === 'arena') {
    // Tiered colosseum wall with arches along the horizon.
    ctx.fillStyle = '#2a1c12';
    ctx.fillRect(0, hy - h * 0.16, w, h * 0.16 + 6);
    const arches = 9;
    ctx.fillStyle = '#120b07';
    for (let i = 0; i < arches; i++) {
      const ax = (i + 0.5) * (w / arches);
      const aw = (w / arches) * 0.52;
      ctx.beginPath();
      ctx.moveTo(ax - aw / 2, hy);
      ctx.lineTo(ax - aw / 2, hy - h * 0.08);
      ctx.arc(ax, hy - h * 0.08, aw / 2, Math.PI, 0);
      ctx.lineTo(ax + aw / 2, hy);
      ctx.closePath();
      ctx.fill();
    }
    // Torches flickering on the pillars between arches.
    for (let i = 0; i <= arches; i++) {
      const txp = i * (w / arches);
      const ty = hy - h * 0.14;
      const flick = 0.6 + 0.4 * Math.abs(Math.sin(time * 0.01 + i));
      const g = ctx.createRadialGradient(txp, ty, 1, txp, ty, 22 * flick);
      g.addColorStop(0, 'rgba(255,170,60,0.9)');
      g.addColorStop(1, 'rgba(255,80,10,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(txp, ty, 22 * flick, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd27a';
      ctx.beginPath();
      ctx.arc(txp, ty, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Warm spotlight on the pit.
    const sg = ctx.createRadialGradient(w / 2, h, 40, w / 2, h, h * 0.7);
    sg.addColorStop(0, 'rgba(255,180,90,0.12)');
    sg.addColorStop(1, 'rgba(255,180,90,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, w, h);
    // Old blood stains on the sand.
    for (let i = 0; i < 6; i++) {
      const bx = (rand(i + 5) * 0.8 + 0.1) * w;
      const by = hy + 60 + rand(i + 2) * (h - hy - 130);
      ctx.fillStyle = 'rgba(120,20,15,0.4)';
      ctx.beginPath();
      ctx.ellipse(bx, by, 14 + rand(i) * 16, 6 + rand(i) * 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (theme.id === 'inferno') {
    // Lava pools.
    for (let i = 0; i < 3; i++) {
      const px = (rand(i + 4) * 0.7 + 0.15) * w;
      const py = hy + 60 + rand(i + 8) * (h - hy - 140);
      const pw = 40 + rand(i) * 50;
      const pulse = 0.35 + 0.25 * Math.abs(Math.sin(time * 0.003 + i));
      const pool = ctx.createRadialGradient(px, py, 2, px, py, pw);
      pool.addColorStop(0, `rgba(255,150,40,${pulse})`);
      pool.addColorStop(1, 'rgba(120,20,0,0)');
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.ellipse(px, py, pw, pw * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Branching lava cracks across the ground.
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const glow = 0.4 + 0.4 * Math.abs(Math.sin(time * 0.004 + i));
      ctx.strokeStyle = `rgba(255,${90 + Math.floor(rand(i) * 80)},20,${glow})`;
      const sx = rand(i + 30) * w;
      let cx = sx;
      let cy = hy + 30;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      while (cy < h - 60) {
        cx += (rand(cx + cy) - 0.5) * 40;
        cy += 24;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
    // Volcanic rocks with an ember rim.
    for (let i = 0; i < 5; i++) {
      const rx = (rand(i + 60) * 0.9 + 0.05) * w;
      const ry = hy + 60 + rand(i + 9) * (h - hy - 120);
      const rr = 8 + rand(i) * 14;
      ctx.fillStyle = '#160805';
      ctx.beginPath();
      ctx.ellipse(rx, ry, rr, rr * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,120,30,${0.5 + 0.3 * Math.sin(time * 0.005 + i)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(rx, ry + 1, rr, rr * 0.7, 0, 0, Math.PI);
      ctx.stroke();
    }
    return;
  }
}

function drawDeadTree(ctx: CanvasRenderingContext2D, x: number, baseY: number, hgt: number) {
  ctx.strokeStyle = '#0a120c';
  ctx.lineWidth = Math.max(2, hgt * 0.04);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, baseY - hgt);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, hgt * 0.02);
  const branch = (bx: number, by: number, len: number, ang: number) => {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(ang) * len, by - Math.sin(ang) * len * 0.8);
    ctx.stroke();
  };
  branch(x, baseY - hgt * 0.6, hgt * 0.3, 0.6);
  branch(x, baseY - hgt * 0.7, hgt * 0.32, Math.PI - 0.6);
  branch(x, baseY - hgt * 0.85, hgt * 0.25, 1.0);
  branch(x, baseY - hgt * 0.9, hgt * 0.22, Math.PI - 1.1);
}

function drawGrave(ctx: CanvasRenderingContext2D, x: number, y: number, sc: number, cross: boolean) {
  ctx.fillStyle = '#1c241d';
  ctx.strokeStyle = '#0a100b';
  ctx.lineWidth = 1;
  if (cross) {
    const t = 4 * sc;
    const hgt = 30 * sc;
    ctx.fillRect(x - t / 2, y - hgt, t, hgt);
    ctx.fillRect(x - 9 * sc, y - hgt * 0.72, 18 * sc, t);
  } else {
    const wd = 22 * sc;
    const hgt = 26 * sc;
    ctx.beginPath();
    ctx.moveTo(x - wd / 2, y);
    ctx.lineTo(x - wd / 2, y - hgt * 0.6);
    ctx.arc(x, y - hgt * 0.6, wd / 2, Math.PI, 0);
    ctx.lineTo(x + wd / 2, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(20,30,20,0.5)';
  ctx.beginPath();
  ctx.ellipse(x, y, 16 * sc, 5 * sc, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBase(ctx: CanvasRenderingContext2D, s: GameState, theme: MapTheme, time: number) {
  const { width: w, height: h } = s;
  const baseY = h - 60;

  if (theme.id === 'city') {
    // The final checkpoint: concrete blast wall, shutter, hazard paint, and
    // emergency beacons. It replaces the generic green bunker on this map.
    const asphalt = ctx.createLinearGradient(0, baseY, 0, h);
    asphalt.addColorStop(0, '#10171a');
    asphalt.addColorStop(1, '#030608');
    ctx.fillStyle = asphalt;
    ctx.fillRect(0, baseY, w, 60);

    ctx.fillStyle = '#303a3b';
    for (let x = -10; x < w + 70; x += 72) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 9, baseY + 8);
      ctx.lineTo(x + 61, baseY + 8);
      ctx.lineTo(x + 72, h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(8,14,16,0.65)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Worn quarantine stripe along the collision line.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, baseY, w, 9);
    ctx.clip();
    ctx.fillStyle = '#d38b2f';
    for (let x = -24; x < w + 24; x += 32) {
      ctx.save();
      ctx.translate(x, baseY + 4);
      ctx.rotate(-0.72);
      ctx.fillRect(-4, -18, 8, 36);
      ctx.restore();
    }
    ctx.restore();

    const cx = w / 2;
    ctx.fillStyle = '#091115';
    ctx.fillRect(cx - 43, baseY - 5, 86, 40);
    ctx.strokeStyle = '#53666a';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 43, baseY - 5, 86, 40);
    ctx.fillStyle = '#182326';
    for (let y = baseY; y < baseY + 31; y += 7) ctx.fillRect(cx - 36, y, 72, 3);

    ctx.fillStyle = '#20f2c2';
    ctx.shadowColor = '#20f2c2';
    ctx.shadowBlur = 14;
    ctx.fillRect(cx - 3, baseY - 32, 6, 27);
    ctx.beginPath();
    ctx.arc(cx, baseY - 33, 7, Math.PI, 0);
    ctx.fill();
    ctx.shadowBlur = 0;

    const beaconOn = Math.sin(time * 0.012) > 0;
    for (const side of [-1, 1] as const) {
      const bx = cx + side * 57;
      const color = side < 0 ? '#ff4938' : '#20f2c2';
      ctx.fillStyle = color;
      ctx.globalAlpha = beaconOn === (side < 0) ? 1 : 0.22;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(bx, baseY - 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
    return;
  }

  if (theme.id === 'lab') {
    // Mobile blast barricade protecting the runway control point.
    const concrete = ctx.createLinearGradient(0, baseY, 0, h);
    concrete.addColorStop(0, '#363a34');
    concrete.addColorStop(1, '#121513');
    ctx.fillStyle = concrete;
    ctx.fillRect(0, baseY, w, 60);

    ctx.strokeStyle = 'rgba(157,255,79,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(w, baseY);
    ctx.stroke();

    // Modular concrete Jersey barriers.
    ctx.fillStyle = '#4a4c43';
    for (let x = -12; x < w + 70; x += 76) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 10, baseY + 10);
      ctx.lineTo(x + 58, baseY + 10);
      ctx.lineTo(x + 70, h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#20231f';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const cx = w / 2;
    ctx.fillStyle = '#0b1010';
    ctx.fillRect(cx - 42, baseY - 8, 84, 37);
    ctx.strokeStyle = '#6c766d';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 42, baseY - 8, 84, 37);
    ctx.fillStyle = '#16201b';
    ctx.fillRect(cx - 34, baseY - 2, 68, 19);
    ctx.fillStyle = '#9dff4f';
    ctx.shadowColor = '#9dff4f';
    ctx.shadowBlur = 12;
    ctx.fillRect(cx - 24, baseY + 4, 29, 3);
    ctx.fillRect(cx - 24, baseY + 10, 18, 3);
    ctx.beginPath();
    ctx.arc(cx + 23, baseY + 8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#56615b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - 8);
    ctx.lineTo(cx, baseY - 31);
    ctx.stroke();
    ctx.fillStyle = '#9dff4f';
    ctx.beginPath();
    ctx.arc(cx, baseY - 33, 5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (theme.id === 'tundra') {
    // Ice-block defensive wall with a heated emergency airlock.
    const ice = ctx.createLinearGradient(0, baseY, 0, h);
    ice.addColorStop(0, '#789dad');
    ice.addColorStop(1, '#203945');
    ctx.fillStyle = ice;
    ctx.fillRect(0, baseY, w, 60);

    for (let row = 0; row < 3; row++) {
      const blockW = 54;
      const blockH = 20;
      for (let x = -blockW + (row % 2) * (blockW / 2); x < w + blockW; x += blockW) {
        ctx.fillStyle = row % 2 === 0 ? 'rgba(185,225,238,0.34)' : 'rgba(130,185,205,0.3)';
        ctx.fillRect(x + 1, baseY + row * blockH + 1, blockW - 2, blockH - 2);
        ctx.strokeStyle = 'rgba(220,245,252,0.25)';
        ctx.strokeRect(x + 1, baseY + row * blockH + 1, blockW - 2, blockH - 2);
      }
    }

    ctx.strokeStyle = 'rgba(132,247,229,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(w, baseY);
    ctx.stroke();

    const cx = w / 2;
    const warm = ctx.createRadialGradient(cx, baseY - 3, 2, cx, baseY - 3, 62);
    warm.addColorStop(0, 'rgba(255,184,95,0.24)');
    warm.addColorStop(1, 'rgba(255,184,95,0)');
    ctx.fillStyle = warm;
    ctx.fillRect(cx - 65, baseY - 66, 130, 80);

    ctx.fillStyle = '#13242c';
    ctx.fillRect(cx - 39, baseY - 8, 78, 43);
    ctx.strokeStyle = '#9dc4d2';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 39, baseY - 8, 78, 43);
    ctx.fillStyle = '#071218';
    ctx.fillRect(cx - 28, baseY - 2, 56, 29);
    ctx.strokeStyle = '#84f7e5';
    ctx.strokeRect(cx - 28, baseY - 2, 56, 29);
    ctx.fillStyle = 'rgba(255,184,95,0.72)';
    ctx.fillRect(cx - 4, baseY + 4, 8, 17);

    // Static locator lamp and a crust of windblown snow.
    ctx.fillStyle = '#84f7e5';
    ctx.shadowColor = '#84f7e5';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, baseY - 18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(235,248,252,0.65)';
    ctx.beginPath();
    for (let x = 0; x <= w; x += 32) {
      const y = baseY + Math.sin(x * 0.03) * 4;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(w, baseY + 8);
    ctx.lineTo(0, baseY + 8);
    ctx.closePath();
    ctx.fill();
    return;
  }

  ctx.fillStyle = '#1a2417';
  ctx.fillRect(0, baseY, w, 60);
  ctx.fillStyle = '#26331f';
  for (let x = 0; x < w; x += 38) {
    ctx.beginPath();
    ctx.ellipse(x + 19, baseY + 14, 20, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, baseY + 34, 20, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = `${theme.palette.accent}99`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  ctx.lineTo(w, baseY);
  ctx.stroke();

  const cx = w / 2;
  ctx.save();
  ctx.translate(cx, baseY + 2);
  ctx.fillStyle = '#0e1a10';
  ctx.fillRect(-18, -6, 36, 24);
  ctx.fillStyle = theme.palette.accent;
  ctx.shadowColor = theme.palette.accent;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(0, -6, 9, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-3, -26, 6, 20);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// --- Zombies -------------------------------------------------------------

function drawZombie(ctx: CanvasRenderingContext2D, z: Zombie, s: GameState, time: number) {
  const st = ZSTYLES[z.type];
  const sc = z.size / 30;
  const phaseBase = (parseInt(z.id.replace(/\D/g, '') || '0', 10) % 100) * 0.7;
  const walkSpeed = z.frozen ? 0 : 0.004 * (z.speed * 0.04 + 1);
  const phase = time * walkSpeed + phaseBase;
  const bob = Math.sin(phase * 2) * 1.6 * sc;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(z.x, z.y + 22 * sc, 14 * sc, 5 * sc, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(z.x, z.y + bob);
  if (z.frozen) ctx.globalAlpha = 0.85;

  if (z.type === 'screamer' || z.isBoss) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.006);
    const auraR = (z.isBoss ? 60 : 30) * sc;
    const aura = ctx.createRadialGradient(0, 0, auraR * 0.2, 0, 0, auraR);
    aura.addColorStop(0, `${st.accent}${z.isBoss ? '55' : '40'}`);
    aura.addColorStop(1, `${st.accent}00`);
    ctx.globalAlpha = 0.4 + pulse * 0.4;
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = z.frozen ? 0.85 : 1;
  }

  if (z.type === 'crawler') drawCrawler(ctx, st, sc, phase);
  else if (z.isBoss) drawBossFigure(ctx, st, sc, phase, time);
  else drawHumanoid(ctx, z, st, sc, phase);

  if (z.hitFlash > 0) {
    ctx.globalAlpha = z.hitFlash * 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, z.size * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (z.frozen) {
    ctx.strokeStyle = 'rgba(150,230,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, z.size * 0.85, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();

  if (z.isBoss) drawBossHealth(ctx, z, s.width);
  else drawHealthBar(ctx, z);
}

function drawHealthBar(ctx: CanvasRenderingContext2D, z: Zombie) {
  const frac = Math.max(0, Math.min(1, z.hp / z.maxHp));
  const bw = Math.max(26, z.size * 1.3);
  const bx = z.x - bw / 2;
  const by = z.y - z.size * 1.15 - 8;
  // Track
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  roundRect(ctx, bx - 1, by - 1, bw + 2, 6, 2);
  ctx.fill();
  // Fill — green → amber → red as it drops.
  const color = frac > 0.6 ? '#39ff14' : frac > 0.3 ? '#ffb300' : '#ff3860';
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 5;
  roundRect(ctx, bx, by, bw * frac, 4, 1.5);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Pip dividers so you can read hit count.
  if (z.maxHp > 1 && z.maxHp <= 8) {
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    for (let i = 1; i < z.maxHp; i++) {
      const px = bx + (bw * i) / z.maxHp;
      ctx.beginPath();
      ctx.moveTo(px, by);
      ctx.lineTo(px, by + 4);
      ctx.stroke();
    }
  }
}

function drawBossHealth(ctx: CanvasRenderingContext2D, z: Zombie, width: number) {
  const frac = bossHealthFraction(z);
  const bw = Math.min(width * 0.5, 300);
  const bx = z.x - bw / 2;
  const by = z.y - z.size * 1.15 - 6;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  roundRect(ctx, bx - 2, by - 2, bw + 4, 12, 3);
  ctx.fill();
  ctx.fillStyle = '#ff2bd6';
  ctx.shadowColor = '#ff2bd6';
  ctx.shadowBlur = 8;
  roundRect(ctx, bx, by, bw * frac, 8, 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  roundRect(ctx, bx, by, bw, 8, 2);
  ctx.stroke();
}

function limb(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number, width: number, color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawHumanoid(ctx: CanvasRenderingContext2D, z: Zombie, st: ZStyle, sc: number, phase: number) {
  const lean = z.type === 'runner' ? 0.32 : 0.12;
  const swing = Math.sin(phase * 2) * (z.type === 'runner' ? 7 : 4) * sc;
  const armSwing = Math.sin(phase * 2 + Math.PI) * 3 * sc;

  ctx.save();
  ctx.rotate(lean * 0.25);

  const torsoTop = -6 * sc;
  const torsoBot = 12 * sc;
  const hipY = torsoBot;
  const headY = torsoTop - 9 * sc;

  limb(ctx, -3 * sc, hipY, -4 * sc + swing, hipY + 16 * sc, 5 * sc, st.shade);
  limb(ctx, 3 * sc, hipY, 4 * sc - swing, hipY + 16 * sc, 5 * sc, st.shade);

  ctx.fillStyle = st.cloth;
  roundRect(ctx, -8 * sc, torsoTop, 16 * sc, torsoBot - torsoTop, 4 * sc);
  ctx.fill();
  ctx.fillStyle = st.skin;
  ctx.beginPath();
  ctx.arc(2 * sc, 2 * sc, 2.4 * sc, 0, Math.PI * 2);
  ctx.fill();

  const reach = (z.type === 'runner' ? 18 : 14) * sc;
  limb(ctx, -7 * sc, torsoTop + 3 * sc, -11 * sc, torsoTop + reach + armSwing, 4.5 * sc, st.skin);
  limb(ctx, 7 * sc, torsoTop + 3 * sc, 11 * sc, torsoTop + reach - armSwing, 4.5 * sc, st.skin);

  ctx.fillStyle = st.skin;
  ctx.beginPath();
  ctx.arc(0, headY, 8 * sc, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = st.shade;
  ctx.beginPath();
  ctx.arc(3 * sc, headY + 1 * sc, 3 * sc, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = st.eye;
  ctx.shadowColor = st.eye;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(-3 * sc, headY - 1 * sc, 1.6 * sc, 0, Math.PI * 2);
  ctx.arc(3 * sc, headY - 1 * sc, 1.6 * sc, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#1a0a0a';
  if (z.type === 'screamer') {
    ctx.beginPath();
    ctx.ellipse(0, headY + 4 * sc, 2.6 * sc, 3.4 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(-3 * sc, headY + 3.5 * sc, 6 * sc, 1.6 * sc);
  }
  ctx.fillStyle = 'rgba(150,20,20,0.8)';
  ctx.fillRect(-1 * sc, headY + 5 * sc, 1.4 * sc, 4 * sc);

  if (z.type === 'glitch') {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = st.accent;
    ctx.fillRect(-10 * sc, headY + (Math.random() - 0.5) * 14 * sc, 20 * sc, 1.5 * sc);
    ctx.fillRect(-10 * sc, (Math.random() - 0.5) * 14 * sc, 20 * sc, 1.5 * sc);
    ctx.globalAlpha = 1;
  }

  if (z.type === 'armored' && z.hp === z.maxHp) {
    ctx.strokeStyle = st.accent;
    ctx.lineWidth = 2 * sc;
    ctx.strokeRect(-9 * sc, torsoTop - 1 * sc, 18 * sc, torsoBot - torsoTop + 2 * sc);
    ctx.fillStyle = 'rgba(180,180,180,0.25)';
    ctx.fillRect(-9 * sc, torsoTop - 1 * sc, 18 * sc, torsoBot - torsoTop + 2 * sc);
  }

  ctx.restore();
}

function drawCrawler(ctx: CanvasRenderingContext2D, st: ZStyle, sc: number, phase: number) {
  const drag = Math.sin(phase * 3) * 3 * sc;
  ctx.fillStyle = st.cloth;
  roundRect(ctx, -12 * sc, -2 * sc, 20 * sc, 8 * sc, 3 * sc);
  ctx.fill();
  limb(ctx, -10 * sc, 2 * sc, -18 * sc, 4 * sc + drag, 3.5 * sc, st.shade);
  limb(ctx, -10 * sc, 4 * sc, -17 * sc, 7 * sc - drag, 3.5 * sc, st.shade);
  limb(ctx, 6 * sc, 0, 14 * sc + drag, 3 * sc, 3.5 * sc, st.skin);
  limb(ctx, 6 * sc, 3 * sc, 13 * sc - drag, 6 * sc, 3.5 * sc, st.skin);
  ctx.fillStyle = st.skin;
  ctx.beginPath();
  ctx.arc(8 * sc, 0, 6 * sc, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = st.eye;
  ctx.shadowColor = st.eye;
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(10 * sc, -1 * sc, 1.3 * sc, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawBossFigure(ctx: CanvasRenderingContext2D, st: ZStyle, sc: number, phase: number, time: number) {
  const swing = Math.sin(phase * 1.5) * 5 * sc;
  const bsc = sc * 1.15;
  limb(ctx, -6 * bsc, 18 * bsc, -7 * bsc + swing, 38 * bsc, 9 * bsc, st.shade);
  limb(ctx, 6 * bsc, 18 * bsc, 7 * bsc - swing, 38 * bsc, 9 * bsc, st.shade);
  ctx.fillStyle = st.cloth;
  roundRect(ctx, -16 * bsc, -10 * bsc, 32 * bsc, 30 * bsc, 6 * bsc);
  ctx.fill();
  ctx.fillStyle = st.skin;
  roundRect(ctx, -12 * bsc, -6 * bsc, 24 * bsc, 12 * bsc, 4 * bsc);
  ctx.fill();
  limb(ctx, -15 * bsc, -6 * bsc, -24 * bsc, 18 * bsc + swing, 8 * bsc, st.skin);
  limb(ctx, 15 * bsc, -6 * bsc, 24 * bsc, 18 * bsc - swing, 8 * bsc, st.skin);
  ctx.fillStyle = st.skin;
  ctx.beginPath();
  ctx.arc(0, -20 * bsc, 12 * bsc, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = st.shade;
  ctx.beginPath();
  ctx.moveTo(-9 * bsc, -28 * bsc);
  ctx.lineTo(-16 * bsc, -40 * bsc);
  ctx.lineTo(-5 * bsc, -30 * bsc);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(9 * bsc, -28 * bsc);
  ctx.lineTo(16 * bsc, -40 * bsc);
  ctx.lineTo(5 * bsc, -30 * bsc);
  ctx.closePath();
  ctx.fill();
  const glow = 0.6 + 0.4 * Math.sin(time * 0.01);
  ctx.fillStyle = st.eye;
  ctx.shadowColor = st.accent;
  ctx.shadowBlur = 14 * glow;
  ctx.beginPath();
  ctx.arc(-5 * bsc, -21 * bsc, 2.6 * bsc, 0, Math.PI * 2);
  ctx.arc(5 * bsc, -21 * bsc, 2.6 * bsc, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#1a0a12';
  ctx.beginPath();
  ctx.ellipse(0, -14 * bsc, 6 * bsc, 4 * bsc, 0, 0, Math.PI * 2);
  ctx.fill();
}

// --- Effects -------------------------------------------------------------

function drawGroundFog(ctx: CanvasRenderingContext2D, s: GameState, theme: MapTheme, time: number) {
  const { width: w, height: h } = s;
  const rgb = theme.palette.fog;
  ctx.save();
  for (let layer = 0; layer < 2; layer++) {
    const y = h - 90 - layer * 40;
    const drift = (time * 0.01 * (layer + 1)) % (w + 200);
    const fog = ctx.createLinearGradient(0, y - 30, 0, y + 50);
    fog.addColorStop(0, `rgba(${rgb},0)`);
    fog.addColorStop(1, `rgba(${rgb},${0.06 + layer * 0.04})`);
    ctx.fillStyle = fog;
    ctx.beginPath();
    for (let x = -200; x <= w + 200; x += 40) {
      const yy = y + Math.sin((x + drift) * 0.02) * 10;
      if (x === -200) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.lineTo(w + 200, h);
    ctx.lineTo(-200, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawSnow(ctx: CanvasRenderingContext2D, s: GameState, time: number) {
  const { width: w, height: h } = s;
  ctx.fillStyle = 'rgba(230,245,255,0.8)';
  for (let i = 0; i < 90; i++) {
    const x = (rand(i) * w + Math.sin(time * 0.0005 + i) * 20 + i) % w;
    const y = (rand(i + 50) * h + time * 0.04 * (0.5 + rand(i))) % h;
    ctx.globalAlpha = 0.4 + rand(i + 9) * 0.5;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
}

function drawEmbers(ctx: CanvasRenderingContext2D, s: GameState, theme: MapTheme, time: number) {
  const { width: w, height: h } = s;
  // Hot glow rising from the ground.
  const glow = ctx.createLinearGradient(0, h, 0, h * 0.55);
  glow.addColorStop(0, `rgba(${theme.palette.fog},0.3)`);
  glow.addColorStop(1, `rgba(${theme.palette.fog},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);
  // Rising embers.
  for (let i = 0; i < 70; i++) {
    const x = (rand(i) * w + Math.sin(time * 0.001 + i) * 30) % w;
    const y = h - ((rand(i + 30) * h + time * 0.05 * (0.5 + rand(i))) % h);
    const flick = 0.4 + 0.6 * Math.abs(Math.sin(time * 0.006 + i));
    ctx.fillStyle = `rgba(255,${120 + Math.floor(rand(i) * 80)},20,${flick})`;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
}

function drawFloating(ctx: CanvasRenderingContext2D, s: GameState) {
  for (const ft of s.floatingTexts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, ft.life / ft.ttl));
    ctx.font = `700 ${ft.size}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 8;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}

function drawWeather(ctx: CanvasRenderingContext2D, s: GameState, time: number) {
  const { width: w, height: h } = s;
  if (s.weather === 'fog') {
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, h * 0.9);
    g.addColorStop(0, 'rgba(180,200,190,0)');
    g.addColorStop(1, 'rgba(120,140,130,0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (s.weather === 'rain') {
    ctx.strokeStyle = 'rgba(120,180,255,0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 70; i++) {
      const x = (i * 53 + time * 0.4) % w;
      const y = (i * 137 + time * 0.9) % h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 14);
      ctx.stroke();
    }
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
