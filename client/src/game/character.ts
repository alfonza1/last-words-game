import type { CharacterLoadout, GameState } from '../types';
import { OUTFIT_PALETTES, hairColor, skinColor } from '../data/cosmetics';

/** Draw the equipped survivor prone at the defensive line, aiming into play. */
export function drawSurvivor(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  character: CharacterLoadout,
  time: number,
) {
  const mobile = s.width < 600;
  const scale = Math.max(mobile ? 0.7 : 0.62, Math.min(1.32, Math.min(s.width / 960, s.height / 600)));
  const x = mobile ? s.width * 0.18 : Math.max(72, s.width * 0.1);
  const y = mobile ? s.height - 150 : s.height - 78;
  const target = s.survivorShot ?? { x: s.width * 0.5, y: s.height * 0.28, life: 0, ttl: 1 };
  const dx = target.x - x;
  const direction = dx >= 0 ? 1 : -1;
  const aimAngle = Math.atan2(target.y - (y - 18 * scale), Math.abs(dx));
  const skin = skinColor(character.skinTone);
  const hair = hairColor(character.hairColor);
  const outfit = OUTFIT_PALETTES[character.outfit] ?? OUTFIT_PALETTES['outfit-field'];
  const breathing = Math.sin(time * 0.003) * 1.2 * scale;

  ctx.save();
  ctx.translate(x, y + breathing);
  ctx.scale(direction, 1);

  // Low profile shadow and a subtle loadout-colored pad.
  ctx.fillStyle = 'rgba(0,0,0,0.48)';
  ctx.beginPath();
  ctx.ellipse(0, 11 * scale, 52 * scale, 9 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `${outfit.trim}18`;
  ctx.beginPath();
  ctx.ellipse(2 * scale, 8 * scale, 48 * scale, 7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boots and legs stretched behind the shooter.
  limb(ctx, -45, 2, -19, -3, 11, '#080b0d', scale);
  limb(ctx, -42, 9, -15, 5, 10, '#11171a', scale);
  ctx.fillStyle = '#050708';
  roundRect(ctx, -53 * scale, -3 * scale, 17 * scale, 9 * scale, 3 * scale);
  ctx.fill();

  // Torso in the equipped outfit.
  ctx.save();
  ctx.rotate(-0.08);
  const body = ctx.createLinearGradient(-20 * scale, 0, 26 * scale, 0);
  body.addColorStop(0, outfit.secondary);
  body.addColorStop(0.55, outfit.primary);
  body.addColorStop(1, '#080b0d');
  ctx.fillStyle = body;
  roundRect(ctx, -24 * scale, -18 * scale, 50 * scale, 27 * scale, 8 * scale);
  ctx.fill();
  ctx.strokeStyle = outfit.trim;
  ctx.globalAlpha = 0.65;
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();
  ctx.globalAlpha = 1;
  drawOutfitDetails(ctx, character.outfit, outfit.trim, scale);
  ctx.restore();

  // Head tucked behind the rifle.
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(24 * scale, -23 * scale, 11 * scale, 0, Math.PI * 2);
  ctx.fill();
  drawHair(ctx, character.hair, hair, scale);
  drawAccessory(ctx, character.accessory, outfit.trim, scale);

  // Supporting arm.
  limb(ctx, 5, -12, 33, -17, 6, skin, scale);
  limb(ctx, 1, -4, 22, -8, 6, outfit.primary, scale);

  // Rifle pivots to the actual target selected by the engine.
  ctx.save();
  ctx.translate(21 * scale, -18 * scale);
  ctx.rotate(aimAngle);
  ctx.fillStyle = '#10171b';
  roundRect(ctx, -6 * scale, -3.5 * scale, 63 * scale, 7 * scale, 2 * scale);
  ctx.fill();
  ctx.strokeStyle = '#718087';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();
  ctx.fillStyle = '#05080a';
  ctx.fillRect(48 * scale, -2 * scale, 29 * scale, 4 * scale);
  ctx.fillStyle = outfit.trim;
  ctx.globalAlpha = 0.78;
  ctx.fillRect(4 * scale, -6 * scale, 17 * scale, 4 * scale);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#080b0d';
  ctx.beginPath();
  ctx.moveTo(14 * scale, 3 * scale);
  ctx.lineTo(27 * scale, 3 * scale);
  ctx.lineTo(22 * scale, 17 * scale);
  ctx.lineTo(14 * scale, 17 * scale);
  ctx.closePath();
  ctx.fill();

  if (s.survivorShot) {
    const frac = Math.max(0, s.survivorShot.life / s.survivorShot.ttl);
    const muzzleX = 79 * scale;
    ctx.fillStyle = `rgba(255,235,145,${frac})`;
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 15 * frac;
    ctx.beginPath();
    ctx.moveTo(muzzleX, 0);
    ctx.lineTo(muzzleX + 15 * scale * frac, -6 * scale);
    ctx.lineTo(muzzleX + 9 * scale * frac, 0);
    ctx.lineTo(muzzleX + 15 * scale * frac, 6 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
  ctx.restore();

  if (s.survivorShot) {
    drawTracer(ctx, x, y, s.survivorShot, scale);
  }
}

function drawTracer(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  shot: NonNullable<GameState['survivorShot']>,
  scale: number,
) {
  const frac = Math.max(0, shot.life / shot.ttl);
  const startX = originX + (shot.x >= originX ? 1 : -1) * 75 * scale;
  const startY = originY - 18 * scale;
  const gradient = ctx.createLinearGradient(startX, startY, shot.x, shot.y);
  gradient.addColorStop(0, `rgba(255,245,180,${0.9 * frac})`);
  gradient.addColorStop(0.6, `rgba(255,180,70,${0.45 * frac})`);
  gradient.addColorStop(1, 'rgba(255,80,30,0)');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1.4 * scale;
  ctx.shadowColor = '#ffd166';
  ctx.shadowBlur = 6 * frac;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(shot.x, shot.y);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawOutfitDetails(
  ctx: CanvasRenderingContext2D,
  outfit: string,
  trim: string,
  scale: number,
) {
  ctx.strokeStyle = trim;
  ctx.fillStyle = trim;
  ctx.lineWidth = 2 * scale;
  if (outfit === 'outfit-neon') {
    ctx.beginPath();
    ctx.moveTo(-12 * scale, -13 * scale);
    ctx.lineTo(2 * scale, 3 * scale);
    ctx.lineTo(17 * scale, -13 * scale);
    ctx.stroke();
  } else if (outfit === 'outfit-hazmat') {
    ctx.setLineDash([8 * scale, 3 * scale]);
    ctx.strokeRect(-17 * scale, -14 * scale, 35 * scale, 17 * scale);
    ctx.setLineDash([]);
  } else if (outfit === 'outfit-inferno') {
    ctx.beginPath();
    ctx.arc(2 * scale, -6 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.stroke();
  } else if (outfit === 'outfit-raider') {
    ctx.fillRect(-19 * scale, -15 * scale, 13 * scale, 5 * scale);
    ctx.fillRect(10 * scale, -13 * scale, 12 * scale, 5 * scale);
  } else if (outfit === 'outfit-warden') {
    ctx.beginPath();
    ctx.moveTo(-18 * scale, 4 * scale);
    ctx.lineTo(-32 * scale, 13 * scale);
    ctx.lineTo(16 * scale, 9 * scale);
    ctx.stroke();
  } else {
    ctx.fillRect(-4 * scale, -15 * scale, 3 * scale, 19 * scale);
  }
}

function drawHair(ctx: CanvasRenderingContext2D, style: string, color: string, scale: number) {
  if (style === 'bald') return;
  ctx.fillStyle = color;
  if (style === 'mohawk') {
    ctx.beginPath();
    ctx.moveTo(17 * scale, -31 * scale);
    ctx.lineTo(23 * scale, -46 * scale);
    ctx.lineTo(29 * scale, -31 * scale);
    ctx.closePath();
    ctx.fill();
  } else if (style === 'ponytail') {
    ctx.beginPath();
    ctx.arc(21 * scale, -27 * scale, 10 * scale, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10 * scale, -27 * scale, 5 * scale, 12 * scale, -0.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(23 * scale, -27 * scale, 10 * scale, Math.PI, Math.PI * 2);
    ctx.fill();
    if (style === 'undercut') ctx.fillRect(14 * scale, -28 * scale, 17 * scale, 4 * scale);
  }
}

function drawAccessory(ctx: CanvasRenderingContext2D, type: string, glow: string, scale: number) {
  if (type === 'accessory-cap') {
    ctx.fillStyle = '#1a252b';
    ctx.beginPath();
    ctx.arc(23 * scale, -30 * scale, 11 * scale, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(23 * scale, -31 * scale, 13 * scale, 3 * scale);
  } else if (type === 'accessory-headphones') {
    ctx.strokeStyle = glow;
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(23 * scale, -24 * scale, 13 * scale, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#10181c';
    ctx.fillRect(10 * scale, -27 * scale, 5 * scale, 11 * scale);
    ctx.fillRect(31 * scale, -27 * scale, 5 * scale, 11 * scale);
  } else if (type === 'accessory-goggles') {
    ctx.fillStyle = glow;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(15 * scale, -27 * scale, 7 * scale, 4 * scale);
    ctx.fillRect(25 * scale, -27 * scale, 7 * scale, 4 * scale);
    ctx.globalAlpha = 1;
  } else if (type === 'accessory-mask') {
    ctx.fillStyle = '#11191d';
    ctx.strokeStyle = '#dce6df';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(14 * scale, -23 * scale);
    ctx.lineTo(32 * scale, -23 * scale);
    ctx.lineTo(28 * scale, -14 * scale);
    ctx.lineTo(18 * scale, -14 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (type === 'accessory-crown') {
    ctx.strokeStyle = glow;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 7;
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(12 * scale, -35 * scale);
    ctx.lineTo(16 * scale, -45 * scale);
    ctx.lineTo(22 * scale, -37 * scale);
    ctx.lineTo(28 * scale, -47 * scale);
    ctx.lineTo(34 * scale, -35 * scale);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

function limb(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color: string,
  scale: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1 * scale, y1 * scale);
  ctx.lineTo(x2 * scale, y2 * scale);
  ctx.stroke();
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
