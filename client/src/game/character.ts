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
  const scale = Math.max(mobile ? 0.78 : 0.7, Math.min(1.38, Math.min(s.width / 900, s.height / 560)));
  const x = mobile ? s.width * 0.23 : Math.max(86, s.width * 0.11);
  const y = mobile ? s.height - 205 : s.height - 88;
  const target = s.survivorShot ?? {
    x: Math.min(s.width - 24, x + 220 * scale),
    y: y - 72 * scale,
    life: 0,
    ttl: 1,
  };
  const dx = target.x - x;
  const direction = dx >= 0 ? 1 : -1;
  const aimAngle = Math.atan2(target.y - (y - 21 * scale), Math.abs(dx));
  const skin = skinColor(character.skinTone);
  const hair = hairColor(character.hairColor);
  const outfit = OUTFIT_PALETTES[character.outfit] ?? OUTFIT_PALETTES['outfit-field'];
  const breathing = Math.sin(time * 0.0024) * 0.85 * scale;
  const shotStrength = s.survivorShot ? Math.max(0, s.survivorShot.life / s.survivorShot.ttl) : 0;
  const recoil = shotStrength * 2.8 * scale;
  const muzzleDistance = 92 * scale;
  const shoulderWorldX = x + direction * (20 * scale - recoil);
  const shoulderWorldY = y + breathing - 20 * scale;
  const muzzleWorldX = shoulderWorldX + direction * Math.cos(aimAngle) * muzzleDistance;
  const muzzleWorldY = shoulderWorldY + Math.sin(aimAngle) * muzzleDistance;

  ctx.save();
  ctx.translate(x, y + breathing);
  ctx.scale(direction, 1);

  // Ground contact and a small scavenged shooting mat.
  ctx.fillStyle = 'rgba(0,0,0,0.48)';
  ctx.beginPath();
  ctx.ellipse(-4 * scale, 10 * scale, 62 * scale, 10 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `${outfit.trim}1f`;
  ctx.beginPath();
  ctx.moveTo(-58 * scale, 7 * scale);
  ctx.lineTo(31 * scale, 4 * scale);
  ctx.lineTo(40 * scale, 13 * scale);
  ctx.lineTo(-52 * scale, 16 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `${outfit.trim}45`;
  ctx.lineWidth = scale;
  ctx.stroke();

  // Boots, trousers, and staggered legs stretched behind the shooter.
  limb(ctx, -48, 1, -14, -4, 12, '#0a0e10', scale);
  limb(ctx, -45, 10, -11, 5, 11, '#172025', scale);
  ctx.fillStyle = '#050708';
  roundRect(ctx, -60 * scale, -5 * scale, 19 * scale, 10 * scale, 3 * scale);
  ctx.fill();
  roundRect(ctx, -57 * scale, 5 * scale, 19 * scale, 10 * scale, 3 * scale);
  ctx.fill();
  ctx.strokeStyle = `${outfit.trim}55`;
  ctx.lineWidth = 1.2 * scale;
  ctx.beginPath();
  ctx.moveTo(-34 * scale, -5 * scale);
  ctx.lineTo(-31 * scale, 4 * scale);
  ctx.moveTo(-30 * scale, 3 * scale);
  ctx.lineTo(-27 * scale, 10 * scale);
  ctx.stroke();

  // Torso and shoulder armor retain the equipped outfit's silhouette.
  ctx.save();
  ctx.rotate(-0.07);
  const body = ctx.createLinearGradient(-20 * scale, 0, 26 * scale, 0);
  body.addColorStop(0, outfit.secondary);
  body.addColorStop(0.55, outfit.primary);
  body.addColorStop(1, '#080b0d');
  ctx.fillStyle = body;
  roundRect(ctx, -28 * scale, -22 * scale, 57 * scale, 31 * scale, 9 * scale);
  ctx.fill();
  ctx.strokeStyle = outfit.trim;
  ctx.globalAlpha = 0.65;
  ctx.lineWidth = 1.7 * scale;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = `${outfit.secondary}dd`;
  roundRect(ctx, -6 * scale, -21 * scale, 25 * scale, 24 * scale, 5 * scale);
  ctx.fill();
  ctx.strokeStyle = `${outfit.trim}99`;
  ctx.stroke();
  drawOutfitDetails(ctx, character.outfit, outfit.trim, scale);
  ctx.restore();

  // Head tucked low behind the optic.
  ctx.fillStyle = `${outfit.secondary}dd`;
  ctx.beginPath();
  ctx.arc(17 * scale, -20 * scale, 13 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(28 * scale, -27 * scale, 12 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(5 * scale, 0);
  drawHair(ctx, character.hair, hair, scale);
  drawAccessory(ctx, character.accessory, outfit.trim, scale);
  ctx.restore();
  drawCombatFace(ctx, character.expression, outfit.trim, scale);

  // Trigger arm and braced support arm.
  limb(ctx, 0, -12, 24, -19, 8, outfit.primary, scale);
  limb(ctx, 22, -19, 35, -19, 5.5, skin, scale);
  limb(ctx, -1, -4, 24, 2, 8, outfit.primary, scale);
  limb(ctx, 24, 2, 45, -12, 5.5, skin, scale);
  ctx.fillStyle = outfit.trim;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(23 * scale, 1 * scale, 7 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Rifle pivots to the engine-selected zombie and recoils on a completed word.
  ctx.save();
  ctx.translate(20 * scale - recoil, -20 * scale);
  ctx.rotate(aimAngle);

  // Stock seated into the shoulder.
  ctx.fillStyle = '#090d0f';
  ctx.beginPath();
  ctx.moveTo(-27 * scale, -3 * scale);
  ctx.lineTo(-4 * scale, -5 * scale);
  ctx.lineTo(3 * scale, 5 * scale);
  ctx.lineTo(-23 * scale, 10 * scale);
  ctx.closePath();
  ctx.fill();

  // Receiver and handguard.
  ctx.fillStyle = '#151e22';
  roundRect(ctx, -3 * scale, -5 * scale, 48 * scale, 10 * scale, 2 * scale);
  ctx.fill();
  ctx.strokeStyle = '#829198';
  ctx.lineWidth = 1.1 * scale;
  ctx.stroke();
  ctx.fillStyle = outfit.trim;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(17 * scale, -4 * scale, 23 * scale, 2 * scale);
  ctx.globalAlpha = 1;

  // Magazine, grip, optic, barrel, and muzzle brake.
  ctx.fillStyle = '#080b0d';
  ctx.beginPath();
  ctx.moveTo(7 * scale, 4 * scale);
  ctx.lineTo(20 * scale, 4 * scale);
  ctx.lineTo(17 * scale, 18 * scale);
  ctx.lineTo(7 * scale, 15 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(0, 4 * scale, 5 * scale, 12 * scale);
  ctx.fillStyle = '#05080a';
  ctx.fillRect(43 * scale, -2 * scale, 43 * scale, 4 * scale);
  ctx.fillRect(84 * scale, -4 * scale, 8 * scale, 8 * scale);
  ctx.fillStyle = '#1b272c';
  roundRect(ctx, 7 * scale, -11 * scale, 17 * scale, 7 * scale, 2 * scale);
  ctx.fill();
  ctx.strokeStyle = outfit.trim;
  ctx.globalAlpha = 0.85;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = outfit.trim;
  ctx.fillRect(28 * scale, 5 * scale, 3 * scale, 9 * scale);

  if (s.survivorShot) {
    const muzzleX = 94 * scale;
    ctx.fillStyle = `rgba(255,235,145,${shotStrength})`;
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 18 * shotStrength;
    ctx.beginPath();
    ctx.moveTo(muzzleX, 0);
    ctx.lineTo(muzzleX + 18 * scale * shotStrength, -7 * scale);
    ctx.lineTo(muzzleX + 10 * scale * shotStrength, 0);
    ctx.lineTo(muzzleX + 18 * scale * shotStrength, 7 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // A brief brass casing sells the shot without adding screen clutter.
    ctx.fillStyle = `rgba(255,193,74,${shotStrength})`;
    ctx.save();
    ctx.translate(8 * scale, -8 * scale);
    ctx.rotate(-0.8 + shotStrength);
    ctx.fillRect(0, 0, 5 * scale, 2 * scale);
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();

  if (s.survivorShot) {
    drawTracer(ctx, muzzleWorldX, muzzleWorldY, s.survivorShot, scale);
  }
}

function drawCombatFace(
  ctx: CanvasRenderingContext2D,
  expression: string,
  glow: string,
  scale: number,
) {
  const eyeX = 34 * scale;
  const eyeY = -29 * scale;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.9, scale);

  if (expression === 'dead-calm') {
    ctx.strokeStyle = '#111719';
    ctx.beginPath();
    ctx.moveTo(31 * scale, eyeY);
    ctx.lineTo(37 * scale, eyeY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(70,35,30,.75)';
    ctx.beginPath();
    ctx.moveTo(36 * scale, -22 * scale);
    ctx.lineTo(41 * scale, -22 * scale);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (expression === 'haunted') {
    ctx.fillStyle = '#eef4ef';
    ctx.strokeStyle = '#111719';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 2.8 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#111719';
    ctx.beginPath();
    ctx.arc(eyeX + scale * 0.6, eyeY, scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,35,30,.75)';
    ctx.beginPath();
    ctx.moveTo(36 * scale, -21 * scale);
    ctx.quadraticCurveTo(39 * scale, -25 * scale, 42 * scale, -21 * scale);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (expression === 'not-yet-dead') {
    ctx.fillStyle = glow;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 6 * scale;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 1.8 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = glow;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(37 * scale, -27 * scale);
    ctx.lineTo(41 * scale, -25 * scale);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = '#111719';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 1.6 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = expression === 'blood-rush' ? '#111719' : 'rgba(70,35,30,.75)';
  ctx.beginPath();
  if (expression === 'grave-grin' || expression === 'not-yet-dead') {
    ctx.moveTo(35 * scale, -23 * scale);
    ctx.quadraticCurveTo(39 * scale, -18 * scale, 43 * scale, -22 * scale);
  } else if (expression === 'blood-rush') {
    ctx.moveTo(32 * scale, -33 * scale);
    ctx.lineTo(38 * scale, -30 * scale);
    ctx.moveTo(34 * scale, -21 * scale);
    ctx.quadraticCurveTo(39 * scale, -25 * scale, 44 * scale, -22 * scale);
    ctx.moveTo(35 * scale, -19 * scale);
    ctx.quadraticCurveTo(40 * scale, -17 * scale, 44 * scale, -21 * scale);
  } else {
    ctx.moveTo(36 * scale, -23 * scale);
    ctx.lineTo(40 * scale, -21 * scale);
  }
  ctx.stroke();
  ctx.restore();
}

function drawTracer(
  ctx: CanvasRenderingContext2D,
  muzzleX: number,
  muzzleY: number,
  shot: NonNullable<GameState['survivorShot']>,
  scale: number,
) {
  const frac = Math.max(0, shot.life / shot.ttl);
  const gradient = ctx.createLinearGradient(muzzleX, muzzleY, shot.x, shot.y);
  gradient.addColorStop(0, `rgba(255,245,180,${0.9 * frac})`);
  gradient.addColorStop(0.6, `rgba(255,180,70,${0.45 * frac})`);
  gradient.addColorStop(1, 'rgba(255,80,30,0)');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1.4 * scale;
  ctx.shadowColor = '#ffd166';
  ctx.shadowBlur = 6 * frac;
  ctx.beginPath();
  ctx.moveTo(muzzleX, muzzleY);
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
