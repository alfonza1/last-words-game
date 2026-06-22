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
  drawBase(ctx, s, theme);

  const ordered = [...s.zombies].sort((a, b) => a.y - b.y);
  for (const z of ordered) drawZombie(ctx, z, s, time);

  drawGroundFog(ctx, s, theme, time);
  if (theme.features.snow) drawSnow(ctx, s, time);
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

  // Stars
  for (let i = 0; i < 70; i++) {
    const sx = rand(i) * w;
    const sy = rand(i + 99) * hy * 0.9;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * 0.001 + i));
    ctx.fillStyle = `rgba(220,235,225,${0.12 + tw * 0.35})`;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

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

  // Moon
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
  if (theme.id === 'lab') {
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

function drawBase(ctx: CanvasRenderingContext2D, s: GameState, theme: MapTheme) {
  const { width: w, height: h } = s;
  const baseY = h - 60;

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
