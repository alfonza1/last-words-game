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

  // Stars (two layers — distant + brighter twinkles)
  for (let i = 0; i < 90; i++) {
    const sx = rand(i) * w;
    const sy = rand(i + 99) * hy * 0.95;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * 0.001 + i));
    const big = rand(i + 13) > 0.92;
    ctx.fillStyle = `rgba(220,235,225,${0.12 + tw * 0.4})`;
    ctx.fillRect(sx, sy, big ? 2.4 : 1.4, big ? 2.4 : 1.4);
  }

  // Occasional shooting star streaking across.
  {
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

  // Signature scenery that makes each map its own place.
  drawThemeScenery(ctx, s, theme, time, hy);
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

    // 1. Atmospheric glow behind the skyline (magenta fading to cyan).
    const glow = ctx.createLinearGradient(0, hzn - h * 0.28, 0, hzn + 8);
    glow.addColorStop(0, 'rgba(120,60,200,0)');
    glow.addColorStop(0.65, 'rgba(150,70,210,0.16)');
    glow.addColorStop(1, 'rgba(50,200,255,0.2)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, hzn - h * 0.28, w, h * 0.28 + 8);

    // 2. Far skyline — dim, dense, for depth.
    for (let i = 0; i < 24; i++) {
      const bx = (i / 24) * w + (rand(i + 200) - 0.5) * 6;
      const bw = w / 24 + 2;
      const bh = h * (0.05 + rand(i + 201) * 0.12);
      ctx.fillStyle = '#0c0a24';
      ctx.fillRect(bx, hzn - bh, bw, bh + 6);
      for (let wy = hzn - bh + 4; wy < hzn - 2; wy += 7) {
        if (rand(bx * 0.3 + wy) > 0.86) {
          ctx.fillStyle = 'rgba(130,110,200,0.5)';
          ctx.fillRect(bx + 2, wy, 1.5, 2);
        }
      }
    }

    // 3. Foreground towers — depth-shaded bodies with lit office-window grids.
    const towers = 9;
    for (let i = 0; i < towers; i++) {
      const seg = w / towers;
      const bx = i * seg + 3;
      const bw = seg - 6;
      const bh = h * (0.18 + rand(i + 9) * 0.27);
      const top = hzn - bh;
      const edge = rand(i) > 0.5 ? '0,240,255' : '255,43,214';

      // body with left-to-right shading so it reads as a solid 3D block
      const bg = ctx.createLinearGradient(bx, top, bx + bw, top);
      bg.addColorStop(0, '#1a1444');
      bg.addColorStop(0.5, '#120d33');
      bg.addColorStop(1, '#08061c');
      ctx.fillStyle = bg;
      ctx.fillRect(bx, top, bw, bh + 6);
      // rooftop ledge
      ctx.fillStyle = '#0c0826';
      ctx.fillRect(bx - 1, top - 3, bw + 2, 4);
      // rooftop water tank / housing on some towers
      if (rand(i + 3) > 0.45) {
        const tkw = bw * (0.2 + rand(i) * 0.2);
        const tkx = bx + bw * (0.18 + rand(i + 1) * 0.4);
        ctx.fillStyle = '#0c0826';
        ctx.fillRect(tkx, top - 12, tkw, 9);
        ctx.fillRect(tkx + tkw * 0.3, top - 16, tkw * 0.12, 4); // little pipe
      }
      // glowing neon edge strip
      ctx.fillStyle = `rgba(${edge},0.55)`;
      ctx.fillRect(bx, top, 2, bh + 6);
      // window grid — rows of lit/dark office windows
      const colW = 9;
      const rowH = 11;
      for (let wy = top + 8; wy < hzn - 5; wy += rowH) {
        for (let wx = bx + 5; wx < bx + bw - 5; wx += colW) {
          const r = rand(wx * 0.7 + wy * 1.3);
          const lit = r > 0.62;
          if (lit) {
            ctx.fillStyle = rand(wx + wy) > 0.6 ? 'rgba(255,210,140,0.95)' : `rgba(${edge},0.9)`;
            ctx.globalAlpha = 0.55 + 0.4 * Math.abs(Math.sin(time * 0.0016 + wx + wy));
          } else {
            ctx.fillStyle = 'rgba(42,38,72,0.6)';
            ctx.globalAlpha = 1;
          }
          ctx.fillRect(wx, wy, colW - 3, rowH - 4);
          ctx.globalAlpha = 1;
        }
      }
      // antenna + red blinker on tall towers
      if (bh > h * 0.34) {
        ctx.strokeStyle = '#0c0826';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + bw / 2, top - 3);
        ctx.lineTo(bx + bw / 2, top - 18);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,60,60,${Math.sin(time * 0.005 + i) > 0 ? 0.95 : 0.2})`;
        ctx.beginPath();
        ctx.arc(bx + bw / 2, top - 18, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Glowing neon billboards.
    for (const sign of [{ x: w * 0.2, c: '#00f0ff' }, { x: w * 0.78, c: '#ff2bd6' }]) {
      const sy = hzn - h * 0.23;
      ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(time * 0.004 + sign.x));
      ctx.strokeStyle = sign.c;
      ctx.lineWidth = 2;
      ctx.shadowColor = sign.c;
      ctx.shadowBlur = 14;
      ctx.strokeRect(sign.x - 26, sy, 52, 20);
      for (let b = 0; b < 3; b++) {
        ctx.fillStyle = sign.c;
        ctx.fillRect(sign.x - 18 + b * 14, sy + 7, 8, 6);
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // 5. Asphalt road in perspective + glowing centre line.
    ctx.fillStyle = 'rgba(8,8,18,0.88)';
    ctx.beginPath();
    ctx.moveTo(w * 0.42, hzn);
    ctx.lineTo(w * 0.58, hzn);
    ctx.lineTo(w * 0.96, h);
    ctx.lineTo(w * 0.04, h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,240,255,0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 18]);
    ctx.beginPath();
    ctx.moveTo(w / 2, hzn);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. Street lamps lining the road edges (poles sit right at the asphalt,
    //    arms reach over it). Matches the road polygon (edges 0.42→0.04 / 0.58→0.96).
    const lampRows = 4;
    for (let r = 0; r < lampRows; r++) {
      const v = (r + 0.6) / lampRows; // 0 near horizon → 1 near camera
      const ly = hzn + v * (h - hzn);
      const edgeHalf = 0.08 + 0.38 * v; // road half-width at this depth
      const scale = 0.4 + v * 0.95;
      for (const side of [-1, 1] as const) {
        const lx = w / 2 + side * w * (edgeHalf + 0.015); // pole just outside the road
        const poleTop = ly - 52 * scale;
        const headX = lx - side * 16 * scale; // arm + lamp head over the road
        ctx.strokeStyle = '#10131f';
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx, poleTop);
        ctx.lineTo(headX, poleTop);
        ctx.stroke();
        const lamp = ctx.createRadialGradient(headX, poleTop + 2, 1, headX, poleTop + 2, 40 * scale);
        lamp.addColorStop(0, 'rgba(255,210,120,0.5)');
        lamp.addColorStop(1, 'rgba(255,210,120,0)');
        ctx.fillStyle = lamp;
        ctx.beginPath();
        ctx.arc(headX, poleTop + 2, 40 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffe8a8';
        ctx.beginPath();
        ctx.arc(headX, poleTop + 2, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        // light pool on the road beneath the lamp head
        const pool = ctx.createRadialGradient(headX, ly + 3, 2, headX, ly + 3, 52 * scale);
        pool.addColorStop(0, 'rgba(255,210,120,0.12)');
        pool.addColorStop(1, 'rgba(255,210,120,0)');
        ctx.fillStyle = pool;
        ctx.beginPath();
        ctx.ellipse(headX, ly + 3, 52 * scale, 14 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 7. A wrecked car on the road.
    const wcx = w * 0.36;
    const wcy = h - 86;
    ctx.fillStyle = '#0e0c1a';
    ctx.beginPath();
    ctx.ellipse(wcx, wcy + 9, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#15121f';
    ctx.fillRect(wcx - 22, wcy - 6, 44, 14);
    ctx.fillRect(wcx - 12, wcy - 16, 24, 12);
    ctx.fillStyle = 'rgba(255,80,40,0.7)';
    ctx.fillRect(wcx + 20, wcy - 2, 3, 4);

    // 8. Neon puddle reflections shimmering on the wet street.
    for (let i = 0; i < 6; i++) {
      const rx = (rand(i + 80) * 0.9 + 0.05) * w;
      const ry = hzn + 50 + rand(i + 81) * (h - hzn - 110);
      const col = rand(i) > 0.5 ? '0,240,255' : '255,43,214';
      ctx.fillStyle = `rgba(${col},${0.08 + 0.07 * Math.abs(Math.sin(time * 0.003 + i))})`;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 10 + rand(i) * 14, 3, 0, 0, Math.PI * 2);
      ctx.fill();
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
    // Distant mountain range silhouette with snow caps.
    ctx.fillStyle = 'rgba(40,70,95,0.6)';
    ctx.beginPath();
    ctx.moveTo(0, hy);
    const peaks: Array<[number, number]> = [];
    for (let x = 0; x <= w; x += 50) {
      const y = hy - (28 + Math.abs(Math.sin(x * 0.011 + 2)) * 60 + rand(x) * 18);
      peaks.push([x, y]);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, hy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(230,242,255,0.7)';
    for (const [px, py] of peaks) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 9, py + 12);
      ctx.lineTo(px + 9, py + 12);
      ctx.closePath();
      ctx.fill();
    }
    // Outpost hut with a warm window, on the right.
    const hx = w * 0.8;
    const hb = h - 70;
    ctx.fillStyle = '#1a2a34';
    ctx.fillRect(hx - 28, hb - 32, 56, 32);
    ctx.fillStyle = '#0e1a22';
    ctx.beginPath();
    ctx.moveTo(hx - 34, hb - 32);
    ctx.lineTo(hx, hb - 52);
    ctx.lineTo(hx + 34, hb - 32);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(235,245,255,0.85)'; // snow on roof
    ctx.fillRect(hx - 28, hb - 34, 56, 3);
    ctx.fillStyle = 'rgba(255,200,120,0.8)'; // window glow
    ctx.fillRect(hx - 8, hb - 22, 12, 12);
    // Frozen lattice tower on the left.
    const tx = w * 0.16;
    ctx.strokeStyle = 'rgba(180,220,245,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx - 16, h - 64);
    ctx.lineTo(tx, hy + 6);
    ctx.lineTo(tx + 16, h - 64);
    for (let yy = hy + 30; yy < h - 64; yy += 26) {
      const t = (yy - (hy + 6)) / (h - 64 - (hy + 6));
      const half = 4 + t * 14;
      ctx.moveTo(tx - half, yy);
      ctx.lineTo(tx + half, yy);
    }
    ctx.stroke();
    // Snow drifts.
    for (let i = 0; i < 7; i++) {
      const dx = (rand(i + 11) * 0.92 + 0.04) * w;
      const dy = hy + 60 + rand(i + 2) * (h - hy - 110);
      const dw = 30 + rand(i) * 60;
      ctx.fillStyle = 'rgba(225,240,255,0.18)';
      ctx.beginPath();
      ctx.ellipse(dx, dy, dw, dw * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ice shards.
    for (let i = 0; i < 9; i++) {
      const ix = (rand(i + 21) * 0.9 + 0.05) * w;
      const iy = hy + 70 + rand(i + 7) * (h - hy - 130);
      const ih = 14 + rand(i) * 26;
      ctx.fillStyle = 'rgba(160,215,255,0.45)';
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(ix - 5, iy);
      ctx.lineTo(ix, iy - ih);
      ctx.lineTo(ix + 5, iy);
      ctx.closePath();
      ctx.fill();
    }
    // Snow sheen building up near the base.
    const snowGrad = ctx.createLinearGradient(0, h - 90, 0, h);
    snowGrad.addColorStop(0, 'rgba(220,235,255,0)');
    snowGrad.addColorStop(1, 'rgba(220,235,255,0.25)');
    ctx.fillStyle = snowGrad;
    ctx.fillRect(0, h - 90, w, 90);
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
