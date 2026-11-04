// Drawings for the paper world, made on canvases in the browser and used as textures. Everything is
// drawn by code, so that the repository holds no images.

import type { SkyLook } from '@/game/sky';

export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const drawing = canvas.getContext('2d');
  if (!drawing) {
    throw new Error('The browser gave no 2D canvas');
  }
  return drawing;
}

// Paper fibres: a light noise on every drawn pixel.
export function addGrain(canvas: HTMLCanvasElement, strength: number, seed: number) {
  const drawing = context(canvas);
  const random = seededRandom(seed);
  const image = drawing.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] === 0) {
      continue;
    }
    const noise = (random() - 0.5) * strength;
    pixels[index] += noise;
    pixels[index + 1] += noise;
    pixels[index + 2] += noise;
  }
  drawing.putImageData(image, 0, 0);
}

function ellipse(drawing: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  drawing.beginPath();
  drawing.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  drawing.fill();
}

function roundedRect(
  drawing: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  drawing.beginPath();
  drawing.roundRect(x, y, width, height, radius);
}

// Draws something on its own canvas, with paper grain but no margin round it.
export function paint(
  width: number,
  height: number,
  draw: (drawing: CanvasRenderingContext2D, width: number, height: number) => void,
  seed = 1,
): HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  draw(context(canvas), width, height);
  addGrain(canvas, 14, seed);
  return canvas;
}

// Draws something, then puts a white paper margin all round its outline, as if cut out with
// scissors.
export function cutOut(
  width: number,
  height: number,
  draw: (drawing: CanvasRenderingContext2D, width: number, height: number) => void,
  border = 10,
  seed = 1,
): HTMLCanvasElement {
  const padding = border + 4;
  const art = createCanvas(width + padding * 2, height + padding * 2);
  const artDrawing = context(art);
  artDrawing.translate(padding, padding);
  draw(artDrawing, width, height);

  const silhouette = createCanvas(art.width, art.height);
  const silhouetteDrawing = context(silhouette);
  silhouetteDrawing.drawImage(art, 0, 0);
  silhouetteDrawing.globalCompositeOperation = 'source-in';
  silhouetteDrawing.fillStyle = '#fffdf6';
  silhouetteDrawing.fillRect(0, 0, silhouette.width, silhouette.height);

  const result = createCanvas(art.width, art.height);
  const resultDrawing = context(result);
  const steps = 28;
  for (let step = 0; step < steps; step++) {
    const angle = (step / steps) * Math.PI * 2;
    resultDrawing.drawImage(silhouette, Math.cos(angle) * border, Math.sin(angle) * border);
  }
  resultDrawing.drawImage(art, 0, 0);
  addGrain(result, 14, seed);
  return result;
}

// Characters with eyes that can be seen blink now and then: each is drawn twice, eyes open and
// shut, and the scene swaps the two.
export type Eyes = 'open' | 'shut';

// A round black eye with a glint, or, shut, a curved lid.
function drawEye(
  x: CanvasRenderingContext2D,
  eyeX: number,
  eyeY: number,
  eyes: Eyes,
  { color = '#2c2a35', width = 10 }: { color?: string; width?: number } = {},
) {
  if (eyes === 'shut') {
    x.strokeStyle = color;
    x.lineWidth = 5;
    x.lineCap = 'round';
    x.beginPath();
    x.arc(eyeX, eyeY - 4, 10, 0.2 * Math.PI, 0.8 * Math.PI);
    x.stroke();
    return;
  }
  x.fillStyle = color;
  ellipse(x, eyeX, eyeY, width, 14);
  x.fillStyle = '#ffffff';
  ellipse(x, eyeX + 3, eyeY - 5, 3.4, 4.4);
}

// Pip, the player's fox, facing right with a scarf and a satchel of cards.
export function drawPip(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2 - 6;
  const by = height - 10;
  x.lineCap = 'round';
  x.lineJoin = 'round';

  // The scarf's end, flying behind.
  x.fillStyle = '#2f74ae';
  x.beginPath();
  x.moveTo(cx - 70, by - 104);
  x.quadraticCurveTo(cx - 100, by - 112, cx - 116, by - 86);
  x.lineTo(cx - 104, by - 74);
  x.quadraticCurveTo(cx - 92, by - 92, cx - 66, by - 86);
  x.fill();
  x.strokeStyle = '#2f74ae';
  x.lineWidth = 3;
  for (let fringe = 0; fringe < 3; fringe++) {
    x.beginPath();
    x.moveTo(cx - 114 + fringe * 5, by - 84 + fringe * 4);
    x.lineTo(cx - 122 + fringe * 5, by - 78 + fringe * 4);
    x.stroke();
  }

  // Feet.
  x.fillStyle = '#c0703a';
  ellipse(x, cx - 34, by - 8, 26, 11);
  ellipse(x, cx + 40, by - 8, 26, 11);

  // Ears. They are drawn mirrored around the body's middle, so that the taller, lighter ear stands
  // on the left and the darker one on the right.
  x.save();
  x.translate(2 * (cx + 4), 0);
  x.scale(-1, 1);
  x.fillStyle = '#e2914c';
  x.beginPath();
  x.moveTo(cx - 60, by - 168);
  x.quadraticCurveTo(cx - 56, by - 230, cx - 36, by - 262);
  x.quadraticCurveTo(cx - 16, by - 232, cx - 6, by - 196);
  x.lineTo(cx - 30, by - 160);
  x.closePath();
  x.fill();
  x.fillStyle = '#f2a95b';
  x.beginPath();
  x.moveTo(cx + 22, by - 192);
  x.quadraticCurveTo(cx + 40, by - 236, cx + 66, by - 264);
  x.quadraticCurveTo(cx + 80, by - 224, cx + 70, by - 168);
  x.lineTo(cx + 46, by - 160);
  x.closePath();
  x.fill();
  // Only the near ear shows its pale inside: the far one is seen from behind.
  x.fillStyle = '#f6c6a0';
  x.beginPath();
  x.moveTo(cx + 36, by - 196);
  x.quadraticCurveTo(cx + 48, by - 226, cx + 64, by - 246);
  x.quadraticCurveTo(cx + 70, by - 216, cx + 64, by - 182);
  x.closePath();
  x.fill();
  x.restore();

  // Body and pale muzzle.
  x.fillStyle = '#f2a95b';
  ellipse(x, cx + 4, by - 104, 90, 102);
  x.save();
  x.beginPath();
  x.ellipse(cx + 4, by - 104, 90, 102, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#fce7c4';
  ellipse(x, cx + 39, by - 49, 66, 78);
  x.restore();

  // Face.
  drawEye(x, cx + 16, by - 138, eyes, { width: 9.5 });
  drawEye(x, cx + 60, by - 138, eyes, { width: 9.5 });
  x.fillStyle = 'rgb(240 110 100 / 55%)';
  ellipse(x, cx - 2, by - 114, 11, 7);
  ellipse(x, cx + 78, by - 114, 9, 6);
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 4;
  x.beginPath();
  x.arc(cx + 40, by - 120, 9, 0.15 * Math.PI, 0.85 * Math.PI);
  x.stroke();

  // The satchel's strap.
  x.strokeStyle = '#8c4b2e';
  x.lineWidth = 7;
  x.beginPath();
  x.moveTo(cx + 62, by - 74);
  x.quadraticCurveTo(cx, by - 60, cx - 58, by - 52);
  x.stroke();

  // The scarf round the neck, striped.
  x.beginPath();
  x.moveTo(cx - 88, by - 110);
  x.quadraticCurveTo(cx + 4, by - 84, cx + 94, by - 110);
  x.lineTo(cx + 92, by - 86);
  x.quadraticCurveTo(cx + 4, by - 58, cx - 86, by - 86);
  x.closePath();
  x.fillStyle = '#3d8fd1';
  x.fill();
  x.save();
  x.clip();
  x.fillStyle = '#2f74ae';
  for (let stripe = 0; stripe < 7; stripe++) {
    x.beginPath();
    x.moveTo(cx - 76 + stripe * 28, by - 120);
    x.lineTo(cx - 68 + stripe * 28, by - 120);
    x.lineTo(cx - 64 + stripe * 28, by - 50);
    x.lineTo(cx - 72 + stripe * 28, by - 50);
    x.fill();
  }
  x.fillStyle = 'rgb(255 255 255 / 22%)';
  x.beginPath();
  x.moveTo(cx - 80, by - 104);
  x.quadraticCurveTo(cx + 4, by - 80, cx + 88, by - 104);
  x.lineTo(cx + 88, by - 98);
  x.quadraticCurveTo(cx + 4, by - 74, cx - 80, by - 98);
  x.fill();
  x.restore();

  // The scarf's knot, hanging in front.
  for (const [offsetX, angle, tailWidth, tailHeight] of [
    [70, 0.12, 18, 40],
    [80, -0.3, 16, 32],
  ]) {
    x.save();
    x.translate(cx + offsetX, by - 80);
    x.rotate(angle);
    x.fillStyle = '#3d8fd1';
    roundedRect(x, -tailWidth / 2, 0, tailWidth, tailHeight, 6);
    x.fill();
    x.fillStyle = '#2f74ae';
    x.fillRect(-tailWidth / 2, tailHeight - 10, tailWidth, 6);
    x.restore();
  }
  x.fillStyle = '#2f74ae';
  ellipse(x, cx + 74, by - 82, 13, 11);
  x.fillStyle = '#3d8fd1';
  ellipse(x, cx + 73, by - 84, 9, 7);

  // The satchel, with three cards sticking out.
  x.fillStyle = '#b4552f';
  roundedRect(x, cx - 96, by - 80, 62, 52, 10);
  x.fill();
  x.fillStyle = '#6e2e17';
  roundedRect(x, cx - 92, by - 78, 54, 16, 7);
  x.fill();
  for (const [index, [color, degrees]] of (
    [
      ['#e2603a', -8],
      ['#3a86c8', 4],
      ['#5b9c4e', 14],
    ] as const
  ).entries()) {
    x.save();
    x.translate(cx - 80 + index * 15, by - 56);
    x.rotate((degrees * Math.PI) / 180);
    x.fillStyle = '#fbf6ea';
    x.fillRect(-12, -30, 24, 40);
    x.fillStyle = color;
    x.fillRect(-9, -27, 18, 24);
    x.restore();
  }
  x.fillStyle = '#b4552f';
  roundedRect(x, cx - 96, by - 68, 62, 40, 10);
  x.fill();
  x.fillStyle = '#9a4326';
  x.fillRect(cx - 96, by - 68, 62, 5);
  x.fillStyle = '#f3c14b';
  ellipse(x, cx - 65, by - 50, 5, 5);
}

// The stage's front edge, in corrugated cardboard.
export function drawCorrugatedEdge(width = 1024): HTMLCanvasElement {
  const height = 32;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#b88b55';
  x.fillRect(0, 0, width, height);
  for (let ridge = 0; ridge < width; ridge += 8) {
    const gradient = x.createLinearGradient(ridge, 0, ridge + 8, 0);
    gradient.addColorStop(0, 'rgb(80 50 20 / 35%)');
    gradient.addColorStop(0.5, 'rgb(255 235 200 / 25%)');
    gradient.addColorStop(1, 'rgb(80 50 20 / 35%)');
    x.fillStyle = gradient;
    x.fillRect(ridge, 6, 8, height - 12);
  }
  x.fillStyle = '#a87c48';
  x.fillRect(0, 0, width, 6);
  x.fillRect(0, height - 6, width, 6);
  addGrain(canvas, 12, 13);
  return canvas;
}

// A soft round shadow on the ground.
export function drawShadowBlob(): HTMLCanvasElement {
  const canvas = createCanvas(128, 128);
  const x = context(canvas);
  const gradient = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgb(60 40 20 / 45%)');
  gradient.addColorStop(1, 'rgb(60 40 20 / 0%)');
  x.fillStyle = gradient;
  x.fillRect(0, 0, 128, 128);
  return canvas;
}

const WOOD = '#a8743f';
const WOOD_DARK = '#7f5530';
const WOOD_LIGHT = '#c4935c';

// The bed, seen from its side: the headboard on the left, a pillow, a quilted blanket.
export function drawBed(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const mattressTop = height * 0.42;
  // Legs.
  x.fillStyle = WOOD_DARK;
  x.fillRect(20, height - 22, 14, 22);
  x.fillRect(width - 34, height - 22, 14, 22);
  // Frame under the mattress.
  x.fillStyle = WOOD;
  roundedRect(x, 10, height * 0.72, width - 20, height * 0.14, 6);
  x.fill();
  // Mattress and sheet.
  x.fillStyle = '#fbf6ea';
  roundedRect(x, 22, mattressTop, width - 44, height * 0.32, 14);
  x.fill();
  // Pillow, against the headboard.
  x.fillStyle = '#ffffff';
  ellipse(x, 78, mattressTop - 2, 46, 20);
  x.fillStyle = 'rgb(44 42 53 / 8%)';
  ellipse(x, 84, mattressTop + 6, 38, 8);
  // Blanket, quilted, falling over the side.
  x.fillStyle = '#d9655a';
  roundedRect(x, 112, mattressTop - 6, width - 140, height * 0.42, 16);
  x.fill();
  x.save();
  roundedRect(x, 112, mattressTop - 6, width - 140, height * 0.42, 16);
  x.clip();
  x.strokeStyle = 'rgb(255 255 255 / 35%)';
  x.lineWidth = 3;
  x.setLineDash([8, 7]);
  for (let line = 150; line < width; line += 44) {
    x.beginPath();
    x.moveTo(line, mattressTop - 6);
    x.lineTo(line, height);
    x.stroke();
  }
  x.beginPath();
  x.moveTo(112, mattressTop + 26);
  x.lineTo(width, mattressTop + 26);
  x.stroke();
  x.setLineDash([]);
  x.fillStyle = '#f3c14b';
  x.fillRect(112, mattressTop - 6, width - 140, 12);
  x.restore();
  // Headboard and footboard.
  x.fillStyle = WOOD;
  roundedRect(x, 0, 0, 30, height - 16, 14);
  x.fill();
  x.fillStyle = WOOD_LIGHT;
  roundedRect(x, 6, 8, 10, height - 40, 5);
  x.fill();
  x.fillStyle = WOOD;
  roundedRect(x, width - 26, height * 0.32, 26, height * 0.68 - 16, 12);
  x.fill();
}

// A bookcase with three shelves of binders.
export function drawBookcase(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const top = 0;
  const random = seededRandom(5);
  // Frame and back.
  x.fillStyle = WOOD;
  roundedRect(x, 0, top, width, height - top, 8);
  x.fill();
  x.fillStyle = WOOD_DARK;
  x.fillRect(12, top + 12, width - 24, height - top - 30);
  const shelves = 3;
  const shelfHeight = (height - top - 30) / shelves;
  const colors = ['#e2603a', '#3a86c8', '#5b9c4e', '#f3c14b', '#7e63be', '#2f74ae', '#d9655a'];
  for (let shelf = 0; shelf < shelves; shelf++) {
    const floor = top + 12 + shelfHeight * (shelf + 1);
    // The binders standing on this shelf, some leaning.
    let spine = 18;
    while (spine < width - 34) {
      const spineWidth = 13 + random() * 7;
      const spineHeight = shelfHeight * (0.62 + random() * 0.25);
      x.save();
      x.translate(spine, floor);
      x.rotate(random() < 0.15 ? -0.12 : 0);
      x.fillStyle = colors[Math.floor(random() * colors.length)];
      roundedRect(x, 0, -spineHeight, spineWidth, spineHeight, 2);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 70%)';
      x.fillRect(3, -spineHeight * 0.7, spineWidth - 6, 6);
      x.restore();
      spine += spineWidth + 2;
    }
    // The shelf itself.
    x.fillStyle = WOOD_LIGHT;
    x.fillRect(8, floor, width - 16, 9);
  }
  // Feet.
  x.fillStyle = WOOD_DARK;
  x.fillRect(10, height - 14, 18, 14);
  x.fillRect(width - 28, height - 14, 18, 14);
}

// A tall house plant with broad leaves, in a terracotta pot.
export function drawBigPlant(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const potTop = height - 62;
  const center = width / 2;
  // Stems, then leaves fanning out from the pot.
  x.strokeStyle = '#3f7d48';
  x.lineWidth = 5;
  const leaves: [number, number, number, string][] = [
    [-0.8, 0.95, 70, '#4f8f4e'],
    [0.78, 0.9, 72, '#4f8f4e'],
    [-0.45, 1.2, 82, '#5fa052'],
    [0.4, 1.25, 84, '#5fa052'],
    [-0.12, 1.45, 88, '#6fae5e'],
    [0.15, 1.05, 70, '#76b260'],
  ];
  for (const [angle, reach, length] of leaves) {
    x.beginPath();
    x.moveTo(center, potTop);
    x.quadraticCurveTo(
      center + Math.sin(angle) * reach * 30,
      potTop - reach * 60,
      center + Math.sin(angle) * reach * 55,
      potTop - Math.cos(angle) * reach * 95 - length * 0.2,
    );
    x.stroke();
  }
  for (const [angle, reach, length, color] of leaves) {
    const tipX = center + Math.sin(angle) * reach * 55;
    const tipY = potTop - Math.cos(angle) * reach * 95 - length * 0.2;
    x.save();
    x.translate(tipX, tipY);
    x.rotate(angle - Math.PI / 2);
    x.fillStyle = color;
    x.beginPath();
    x.moveTo(0, 0);
    x.quadraticCurveTo(length * 0.5, -length * 0.36, length, 0);
    x.quadraticCurveTo(length * 0.5, length * 0.36, 0, 0);
    x.fill();
    x.strokeStyle = 'rgb(0 0 0 / 15%)';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(4, 0);
    x.lineTo(length * 0.85, 0);
    x.stroke();
    x.restore();
  }
  // The pot, with its rim.
  x.fillStyle = '#c8653a';
  x.beginPath();
  x.moveTo(center - 34, potTop + 12);
  x.lineTo(center + 34, potTop + 12);
  x.lineTo(center + 26, height);
  x.lineTo(center - 26, height);
  x.closePath();
  x.fill();
  x.fillStyle = '#b4552f';
  roundedRect(x, center - 40, potTop, 80, 16, 4);
  x.fill();
}

// A wooden door with two panels and a brass knob.
export function drawDoor(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const frame = 12;
  x.fillStyle = WOOD_DARK;
  x.fillRect(0, 0, width, height);
  x.fillStyle = WOOD;
  x.fillRect(frame, frame, width - frame * 2, height - frame);
  x.fillStyle = WOOD_LIGHT;
  const panelWidth = width - frame * 2 - 32;
  roundedRect(x, frame + 16, frame + 18, panelWidth, height * 0.36, 6);
  x.fill();
  roundedRect(x, frame + 16, height * 0.5, panelWidth, height * 0.42, 6);
  x.fill();
  x.fillStyle = WOOD_DARK;
  x.fillRect(frame, height - 10, width - frame * 2, 10);
  x.fillStyle = '#f3c14b';
  ellipse(x, width - frame - 16, height * 0.52, 8, 8);
  x.fillStyle = '#b8861f';
  ellipse(x, width - frame - 16, height * 0.52, 4, 4);
}

// The desk, with a drawer on its right and a lamp on its top.
export function drawDesk(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const top = 46;
  // Lamp.
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 5;
  x.beginPath();
  x.moveTo(44, top);
  x.lineTo(56, top - 26);
  x.lineTo(40, top - 40);
  x.stroke();
  x.fillStyle = '#3d8fd1';
  x.beginPath();
  x.moveTo(22, top - 30);
  x.lineTo(50, top - 48);
  x.lineTo(58, top - 32);
  x.closePath();
  x.fill();
  x.fillStyle = '#2c2a35';
  ellipse(x, 44, top - 2, 16, 4);
  // Top and legs.
  x.fillStyle = WOOD;
  roundedRect(x, 0, top, width, 16, 4);
  x.fill();
  x.fillStyle = WOOD_DARK;
  x.fillRect(14, top + 16, 14, height - top - 16);
  // Drawer block.
  x.fillStyle = WOOD;
  x.fillRect(width - 90, top + 16, 76, height - top - 16);
  x.fillStyle = WOOD_LIGHT;
  roundedRect(x, width - 82, top + 26, 60, 30, 4);
  x.fill();
  roundedRect(x, width - 82, top + 64, 60, 30, 4);
  x.fill();
  x.fillStyle = '#f3c14b';
  ellipse(x, width - 52, top + 41, 5, 5);
  ellipse(x, width - 52, top + 79, 5, 5);
}

// The desk chair, seen from its side, with its back on the left.
export function drawChair(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const seat = height * 0.52;
  x.fillStyle = '#3d8fd1';
  roundedRect(x, 4, 0, 22, seat + 6, 10);
  x.fill();
  roundedRect(x, 4, seat - 8, width - 8, 20, 8);
  x.fill();
  x.fillStyle = '#2c2a35';
  x.fillRect(width / 2 - 5, seat + 12, 10, height - seat - 30);
  roundedRect(x, 8, height - 18, width - 16, 8, 4);
  x.fill();
  ellipse(x, 14, height - 6, 7, 6);
  ellipse(x, width - 14, height - 6, 7, 6);
}

// A room's back wall: striped paper over a skirting board.
export function drawWallpaper(
  base = '#ecdfc8',
  stripeColor = 'rgb(200 165 116 / 22%)',
): HTMLCanvasElement {
  const width = 1300;
  const height = 440;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = base;
  x.fillRect(0, 0, width, height);
  for (let stripe = 0; stripe < width; stripe += 52) {
    x.fillStyle = stripeColor;
    x.fillRect(stripe, 0, 18, height);
    x.fillStyle = 'rgb(255 255 255 / 30%)';
    for (let dot = 20; dot < height - 40; dot += 46) {
      ellipse(x, stripe + 35, dot + ((stripe / 52) % 2) * 23, 3, 3);
    }
  }
  x.fillStyle = '#b88b55';
  x.fillRect(0, height - 28, width, 28);
  x.fillStyle = '#a07445';
  x.fillRect(0, height - 28, width, 5);
  addGrain(canvas, 12, 31);
  return canvas;
}

// The bedroom's floor, in wide wooden planks running along the room.
export function drawPlanks(): HTMLCanvasElement {
  const width = 1300;
  const height = 420;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const random = seededRandom(17);
  x.fillStyle = '#c49a6c';
  x.fillRect(0, 0, width, height);
  const plank = 60;
  for (let row = 0; row * plank < height; row++) {
    x.fillStyle = row % 2 === 0 ? 'rgb(255 240 210 / 10%)' : 'rgb(120 85 45 / 10%)';
    x.fillRect(0, row * plank, width, plank);
    x.strokeStyle = 'rgb(110 75 40 / 45%)';
    x.lineWidth = 3;
    x.beginPath();
    x.moveTo(0, row * plank);
    x.lineTo(width, row * plank);
    x.stroke();
    // The plank ends, staggered from one row to the next.
    for (
      let joint = (row % 3) * 140 + random() * 60;
      joint < width;
      joint += 380 + random() * 120
    ) {
      x.beginPath();
      x.moveTo(joint, row * plank);
      x.lineTo(joint, (row + 1) * plank);
      x.stroke();
    }
  }
  addGrain(canvas, 14, 19);
  return canvas;
}

// The same cardboard edge, standing upright for the cut edge of a wall.
export function drawUprightCorrugatedEdge(length: number): HTMLCanvasElement {
  const lying = drawCorrugatedEdge(length);
  const canvas = createCanvas(lying.height, lying.width);
  const x = context(canvas);
  x.translate(canvas.width, 0);
  x.rotate(Math.PI / 2);
  x.drawImage(lying, 0, 0);
  return canvas;
}

// A sky with soft clouds, made to repeat from side to side so that the clouds can drift.
export function drawSky(look: SkyLook): HTMLCanvasElement {
  const width = 1024;
  const height = 256;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const gradient = x.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, look.top);
  gradient.addColorStop(1, look.horizon);
  x.fillStyle = gradient;
  x.fillRect(0, 0, width, height);
  const random = seededRandom(23);
  for (let cloud = 0; cloud < look.cloudCount; cloud++) {
    const centerX = ((cloud + random() * 0.6) / look.cloudCount) * width;
    const centerY = height * (0.25 + random() * 0.4);
    const size = 30 + random() * 26;
    // Drawn a second time one sky further, so that a cloud crossing the edge stays whole.
    for (const shift of [0, -width, width]) {
      x.fillStyle = look.cloud;
      for (const [offsetX, offsetY, scale] of [
        [-1.1, 0.25, 0.7],
        [0, 0, 1],
        [1.1, 0.2, 0.75],
        [0.4, 0.45, 0.8],
        [-0.5, 0.45, 0.75],
      ]) {
        ellipse(
          x,
          centerX + shift + offsetX * size,
          centerY + offsetY * size,
          size * scale * 1.2,
          size * scale * 0.75,
        );
      }
    }
  }
  addGrain(canvas, 8, 29);
  return canvas;
}

// A double window: two panes side by side in a white frame, on a wooden sill. The panes are left
// empty, for the sky to show through.
export function drawWindowFrame(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const frame = 14;
  const sill = 16;
  const paneBottom = height - sill;
  x.fillStyle = '#fbf6ea';
  x.fillRect(0, 0, width, frame);
  x.fillRect(0, 0, frame, paneBottom);
  x.fillRect(width - frame, 0, frame, paneBottom);
  x.fillRect(0, paneBottom - frame, width, frame);
  // The two casements meet in the middle.
  x.fillRect(width / 2 - 6, 0, 12, paneBottom);
  // Their handles.
  x.fillStyle = '#b8861f';
  x.fillRect(width / 2 - 14, paneBottom / 2 - 10, 5, 20);
  x.fillRect(width / 2 + 9, paneBottom / 2 - 10, 5, 20);
  // The sill.
  x.fillStyle = '#a8743f';
  roundedRect(x, -6, paneBottom, width + 12, sill, 4);
  x.fill();
}

// The street's ground: packed earth with a paved path along its front.
export function drawStreet(): HTMLCanvasElement {
  const width = 2048;
  const height = 466;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const random = seededRandom(11);
  x.fillStyle = '#c9a270';
  x.fillRect(0, 0, width, height);
  for (let fibre = 0; fibre < 900; fibre++) {
    x.strokeStyle = random() < 0.5 ? 'rgb(120 85 45 / 18%)' : 'rgb(255 240 210 / 18%)';
    x.lineWidth = 1 + random() * 1.5;
    const startX = random() * width;
    const startY = random() * height;
    const length = 10 + random() * 40;
    const angle = (random() - 0.5) * 0.6;
    x.beginPath();
    x.moveTo(startX, startY);
    x.lineTo(startX + Math.cos(angle) * length, startY + Math.sin(angle) * length);
    x.stroke();
  }
  const pathY = Math.round(height * 0.72);
  x.fillStyle = 'rgb(251 246 234 / 50%)';
  for (let stone = 0; stone < width; stone += 96) {
    roundedRect(x, stone + 14, pathY - 22, 68, 44, 10);
    x.fill();
  }
  x.setLineDash([14, 10]);
  x.strokeStyle = 'rgb(120 85 45 / 55%)';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(0, pathY - 30);
  x.lineTo(width, pathY - 30);
  x.moveTo(0, pathY + 30);
  x.lineTo(width, pathY + 30);
  x.stroke();
  addGrain(canvas, 14, 12);
  return canvas;
}

// A row of rolling hills, hatched like coloured pencil, for the background.
export function drawHills(color: string, hatch: string, bumps: number, seed: number) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(seed);
    x.beginPath();
    x.rect(0, height * 0.75, width, height * 0.25);
    for (let bump = 0; bump < bumps; bump++) {
      const centerX = ((bump + 0.5) / bumps) * width + (random() - 0.5) * (width / bumps) * 0.4;
      const radiusX = (width / bumps) * (0.72 + random() * 0.45);
      const radiusY = height * (0.45 + random() * 0.5);
      x.moveTo(centerX + radiusX, height);
      x.ellipse(centerX, height, radiusX, radiusY, 0, 0, Math.PI * 2);
    }
    x.fillStyle = color;
    x.fill('nonzero');
    x.save();
    x.clip('nonzero');
    x.strokeStyle = hatch;
    x.globalAlpha = 0.3;
    x.lineWidth = 3;
    for (let line = -height; line < width; line += 16) {
      x.beginPath();
      x.moveTo(line, height);
      x.lineTo(line + height, 0);
      x.stroke();
    }
    x.restore();
  };
}

function drawWindowPane(x: CanvasRenderingContext2D, left: number, top: number, size: number) {
  x.fillStyle = '#fbf6ea';
  roundedRect(x, left - 8, top - 8, size + 16, size + 16, 6);
  x.fill();
  x.fillStyle = '#8cc3e6';
  x.fillRect(left, top, size, size);
  x.fillStyle = 'rgb(255 255 255 / 45%)';
  x.beginPath();
  x.moveTo(left + size * 0.15, top + size);
  x.lineTo(left + size * 0.55, top);
  x.lineTo(left + size * 0.7, top);
  x.lineTo(left + size * 0.3, top + size);
  x.fill();
  x.fillStyle = '#fbf6ea';
  x.fillRect(left + size / 2 - 3, top, 6, size);
  x.fillRect(left, top + size / 2 - 3, size, 6);
}

// Our house: a small home with a red tiled roof, a chimney, two windows and its front door in the
// middle.
export function drawHouse(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const roofBottom = height * 0.36;
  const wallLeft = 24;
  const wallRight = width - 24;
  // Chimney, behind the roof.
  x.fillStyle = '#a0573d';
  x.fillRect(wallRight - 92, 20, 34, roofBottom - 20);
  x.fillStyle = '#7f4430';
  x.fillRect(wallRight - 98, 14, 46, 14);
  // Walls.
  x.fillStyle = '#f4dcc0';
  x.fillRect(wallLeft, roofBottom - 4, wallRight - wallLeft, height - roofBottom + 4);
  x.fillStyle = 'rgb(200 150 100 / 18%)';
  for (let course = roofBottom + 22; course < height - 30; course += 26) {
    x.fillRect(wallLeft, course, wallRight - wallLeft, 3);
  }
  // Roof, overhanging the walls.
  x.fillStyle = '#c8453a';
  x.beginPath();
  x.moveTo(0, roofBottom + 8);
  x.lineTo(width / 2, 6);
  x.lineTo(width, roofBottom + 8);
  x.closePath();
  x.fill();
  x.strokeStyle = 'rgb(120 30 20 / 35%)';
  x.lineWidth = 3;
  for (let row = 1; row < 5; row++) {
    const y = 6 + ((roofBottom + 2) * row) / 5;
    const half = (width / 2) * (y / (roofBottom + 8));
    x.beginPath();
    x.moveTo(width / 2 - half, y);
    x.lineTo(width / 2 + half, y);
    x.stroke();
  }
  // Windows on both sides of the door.
  const pane = 64;
  const windowTop = roofBottom + 46;
  drawWindowPane(x, wallLeft + 34, windowTop, pane);
  drawWindowPane(x, wallRight - 34 - pane, windowTop, pane);
  // Flower boxes under them.
  for (const left of [wallLeft + 26, wallRight - 42 - pane]) {
    x.fillStyle = '#8c5a35';
    x.fillRect(left, windowTop + pane + 10, pane + 16, 14);
    for (let flower = 0; flower < 4; flower++) {
      x.fillStyle = ['#e8645a', '#f3c14b', '#fbf6ea', '#9a7bd6'][flower];
      ellipse(x, left + 12 + flower * 18, windowTop + pane + 6, 7, 7);
    }
  }
  // The front door.
  const doorWidth = 74;
  const doorHeight = height * 0.42;
  const doorLeft = width / 2 - doorWidth / 2;
  const doorTop = height - doorHeight - 10;
  x.fillStyle = '#fbf6ea';
  roundedRect(x, doorLeft - 8, doorTop - 8, doorWidth + 16, doorHeight + 8, 8);
  x.fill();
  x.fillStyle = '#3d8fd1';
  roundedRect(x, doorLeft, doorTop, doorWidth, doorHeight, 6);
  x.fill();
  x.fillStyle = 'rgb(255 255 255 / 25%)';
  roundedRect(x, doorLeft + 12, doorTop + 14, doorWidth - 24, doorHeight * 0.32, 4);
  x.fill();
  x.fillStyle = '#f3c14b';
  ellipse(x, doorLeft + doorWidth - 14, doorTop + doorHeight * 0.55, 5, 5);
  // Doorstep.
  x.fillStyle = '#b9ab98';
  x.fillRect(doorLeft - 16, height - 10, doorWidth + 32, 10);
}

// The shop: a striped awning, a window full of boosters, and its name on a board, in the player's
// language.
export function drawShop(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const top = 70;
    const wallLeft = 18;
    const wallRight = width - 18;
    // Walls.
    x.fillStyle = '#bfe0d0';
    x.fillRect(wallLeft, top, wallRight - wallLeft, height - top);
    x.fillStyle = '#9ccbb6';
    x.fillRect(wallLeft, height - 34, wallRight - wallLeft, 34);
    // Name board on top.
    x.fillStyle = '#fbf6ea';
    roundedRect(x, width / 2 - 150, 0, 300, 64, 12);
    x.fill();
    x.fillStyle = '#c8453a';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 42;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > 270 && size > 16);
    x.fillText(name, width / 2, 34);
    // Striped awning, with a scalloped edge.
    const stripes = 9;
    const stripeWidth = (wallRight - wallLeft + 20) / stripes;
    for (let stripe = 0; stripe < stripes; stripe++) {
      x.fillStyle = stripe % 2 === 0 ? '#c8453a' : '#fbf6ea';
      const left = wallLeft - 10 + stripe * stripeWidth;
      x.fillRect(left, top, stripeWidth, 46);
      x.beginPath();
      x.arc(left + stripeWidth / 2, top + 46, stripeWidth / 2, 0, Math.PI);
      x.fill();
    }
    // The display window, with boosters standing in it.
    const windowLeft = wallLeft + 26;
    const windowTop = top + 92;
    const windowWidth = 210;
    const windowHeight = 140;
    x.fillStyle = '#fbf6ea';
    roundedRect(x, windowLeft - 8, windowTop - 8, windowWidth + 16, windowHeight + 16, 8);
    x.fill();
    x.fillStyle = '#8cc3e6';
    x.fillRect(windowLeft, windowTop, windowWidth, windowHeight);
    x.fillStyle = '#8e5e36';
    x.fillRect(windowLeft, windowTop + windowHeight - 26, windowWidth, 10);
    for (const [index, color] of [
      '#5e4ba8',
      '#3c8fb4',
      '#7e63be',
      '#e2603a',
      '#5b9c4e',
    ].entries()) {
      x.fillStyle = color;
      roundedRect(x, windowLeft + 18 + index * 38, windowTop + windowHeight - 82, 28, 56, 3);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 40%)';
      x.fillRect(windowLeft + 23 + index * 38, windowTop + windowHeight - 70, 18, 8);
    }
    x.fillStyle = 'rgb(255 255 255 / 35%)';
    x.beginPath();
    x.moveTo(windowLeft + 30, windowTop + windowHeight);
    x.lineTo(windowLeft + 90, windowTop);
    x.lineTo(windowLeft + 110, windowTop);
    x.lineTo(windowLeft + 50, windowTop + windowHeight);
    x.fill();
    // The door, on the right.
    const doorWidth = 96;
    const doorLeft = wallRight - doorWidth - 34;
    const doorTop = top + 82;
    x.fillStyle = '#fbf6ea';
    roundedRect(x, doorLeft - 8, doorTop - 8, doorWidth + 16, height - doorTop + 8, 8);
    x.fill();
    x.fillStyle = '#7f5530';
    x.fillRect(doorLeft, doorTop, doorWidth, height - doorTop);
    x.fillStyle = '#8cc3e6';
    x.fillRect(doorLeft + 14, doorTop + 14, doorWidth - 28, 90);
    x.fillStyle = '#f3c14b';
    ellipse(x, doorLeft + doorWidth - 14, doorTop + 140, 5, 5);
  };
}

// The sky's colours alone, for a backdrop with its clouds hung in front as cut-outs.
export function drawSkyGradient(look: SkyLook): HTMLCanvasElement {
  const canvas = createCanvas(16, 256);
  const x = context(canvas);
  const gradient = x.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, look.top);
  gradient.addColorStop(1, look.horizon);
  x.fillStyle = gradient;
  x.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

// A fluffy cloud with a soft grey belly.
export function drawCloud(color: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    x.fillStyle = color;
    for (const [left, top, radius] of [
      [0.3, 0.62, 0.22],
      [0.5, 0.45, 0.3],
      [0.72, 0.6, 0.22],
      [0.5, 0.7, 0.25],
    ]) {
      ellipse(x, width * left, height * top, width * radius, height * radius * 1.6);
    }
    x.fillStyle = 'rgb(140 180 200 / 25%)';
    ellipse(x, width * 0.5, height * 0.86, width * 0.36, height * 0.1);
  };
}

export type SellerLook = { accessory: 'crown' | 'glasses' | 'beret' };

// What each raccoon triplet wears on her head, and her colour, painted on her counter and her sign.
export const SELLERS: Record<'latest' | 'thisYear' | 'older', { look: SellerLook; color: string }> =
  {
    latest: { look: { accessory: 'crown' }, color: '#e0a51f' },
    thisYear: { look: { accessory: 'glasses' }, color: '#3a86c8' },
    older: { look: { accessory: 'beret' }, color: '#c8453a' },
  };

// Where a raccoon's face sits in her drawing, to frame it in a portrait.
export const RACCOON_SIZE = { width: 360, height: 314 };
export const RACCOON_FACE = { x: 140, y: 168, size: 210 };

// One of the raccoon triplets behind her counter: grey fur, a black mask round the eyes, round
// ears and a ringed tail. They look alike, so each wears something of her own on her head.
export function drawRaccoon({ accessory }: SellerLook) {
  return (
    drawing: CanvasRenderingContext2D,
    width: number,
    height: number,
    eyes: Eyes = 'open',
  ) => {
    const x = drawing;
    // Off centre, to leave room on the right for the whole tail.
    const cx = width / 2 - 40;
    const bottom = height - 4;
    const bodyY = bottom - 104;
    const headTop = bodyY - 100;
    // The ringed tail, sweeping out behind on the right.
    x.save();
    x.translate(cx + 70, bottom - 60);
    x.rotate(-0.6);
    for (let ring = 0; ring < 5; ring++) {
      x.fillStyle = ring % 2 === 0 ? '#9c9aa6' : '#3c3a44';
      ellipse(x, ring * 26, 0, 16, 22);
    }
    x.restore();
    // Ears, with their dark inside.
    for (const side of [-1, 1]) {
      x.fillStyle = '#7e7b88';
      ellipse(x, cx + side * 58, headTop + 18, 24, 26);
      x.fillStyle = '#3c3a44';
      ellipse(x, cx + side * 58, headTop + 18, 13, 15);
    }
    // Feet and body, with its pale belly.
    x.fillStyle = '#3c3a44';
    ellipse(x, cx - 38, bottom - 8, 26, 11);
    ellipse(x, cx + 38, bottom - 8, 26, 11);
    x.fillStyle = '#9c9aa6';
    ellipse(x, cx, bodyY, 90, 100);
    x.save();
    x.beginPath();
    x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
    x.clip();
    x.fillStyle = '#e8e6ec';
    ellipse(x, cx, bottom - 44, 60, 70);
    x.restore();
    // The mask round the eyes, and the pale snout.
    const eyesY = bodyY - 36;
    x.fillStyle = '#3c3a44';
    x.beginPath();
    x.ellipse(cx - 28, eyesY, 30, 20, -0.2, 0, Math.PI * 2);
    x.fill();
    x.beginPath();
    x.ellipse(cx + 28, eyesY, 30, 20, 0.2, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#e8e6ec';
    ellipse(x, cx, eyesY + 22, 22, 16);
    // Eyes, nose and smile.
    // Shut, the lids are pale, or they would vanish into the mask.
    const eyeColor = eyes === 'shut' ? '#c9c7d0' : '#111111';
    drawEye(x, cx - 26, eyesY, eyes, { color: eyeColor });
    drawEye(x, cx + 26, eyesY, eyes, { color: eyeColor });
    x.fillStyle = 'rgb(240 110 100 / 50%)';
    ellipse(x, cx - 50, eyesY + 22, 11, 7);
    ellipse(x, cx + 50, eyesY + 22, 11, 7);
    x.fillStyle = '#2c2a35';
    ellipse(x, cx, eyesY + 12, 7, 5);
    x.strokeStyle = '#2c2a35';
    x.lineWidth = 4;
    x.lineCap = 'round';
    x.beginPath();
    x.arc(cx, eyesY + 18, 9, 0.15 * Math.PI, 0.85 * Math.PI);
    x.stroke();
    // What each one wears on her head.
    if (accessory === 'crown') {
      const base = headTop + 14;
      x.fillStyle = '#f3c14b';
      x.beginPath();
      x.moveTo(cx - 34, base);
      x.lineTo(cx - 34, base - 36);
      x.lineTo(cx - 17, base - 18);
      x.lineTo(cx, base - 42);
      x.lineTo(cx + 17, base - 18);
      x.lineTo(cx + 34, base - 36);
      x.lineTo(cx + 34, base);
      x.closePath();
      x.fill();
      x.fillStyle = '#c8453a';
      ellipse(x, cx, base - 14, 5, 5);
    } else if (accessory === 'glasses') {
      x.strokeStyle = '#3a6fb0';
      x.lineWidth = 5;
      for (const side of [-1, 1]) {
        x.beginPath();
        x.arc(cx + side * 26, eyesY, 20, 0, Math.PI * 2);
        x.stroke();
      }
      x.beginPath();
      x.moveTo(cx - 6, eyesY);
      x.lineTo(cx + 6, eyesY);
      x.stroke();
    } else {
      // The beret sits snug on the top of the head, between the ears, tipped to one side.
      x.save();
      x.translate(cx + 6, headTop + 14);
      x.rotate(-0.18);
      x.fillStyle = '#c8453a';
      ellipse(x, 0, 0, 52, 20);
      x.fillStyle = '#a8372e';
      x.fillRect(-50, 6, 100, 9);
      x.fillStyle = '#c8453a';
      ellipse(x, 4, -20, 6, 7);
      x.restore();
    }
  };
}

// A shop counter, its front in its seller's colour, with a few packs on top.
export function drawCounter(color: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const top = 34;
    for (const [index, pack] of ['#5e4ba8', '#3c8fb4', '#7e63be'].entries()) {
      x.save();
      x.translate(30 + index * 34, top);
      x.rotate((index - 1) * 0.08);
      x.fillStyle = pack;
      roundedRect(x, 0, -34, 26, 38, 3);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 40%)';
      x.fillRect(5, -26, 16, 6);
      x.restore();
    }
    x.fillStyle = WOOD_DARK;
    roundedRect(x, 0, top, width, 18, 5);
    x.fill();
    x.fillStyle = WOOD;
    x.fillRect(10, top + 18, width - 20, height - top - 18);
    x.fillStyle = color;
    x.fillRect(10, top + 34, width - 20, 26);
    x.fillStyle = 'rgb(255 255 255 / 30%)';
    x.fillRect(10, top + 38, width - 20, 4);
    x.fillStyle = WOOD_LIGHT;
    for (let panel = 0; panel < 3; panel++) {
      const panelWidth = (width - 60) / 3;
      roundedRect(x, 20 + panel * (panelWidth + 10), top + 72, panelWidth, height - top - 86, 4);
      x.fill();
    }
  };
}

// Shelves full of sealed boosters, for the wall behind the counters.
export function drawBoosterShelves(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  const random = seededRandom(9);
  const colors = ['#5e4ba8', '#3c8fb4', '#7e63be', '#e2603a', '#5b9c4e', '#f3c14b', '#c8453a'];
  x.fillStyle = WOOD;
  x.fillRect(0, 0, width, height);
  x.fillStyle = WOOD_DARK;
  x.fillRect(10, 10, width - 20, height - 20);
  const shelves = 3;
  const shelfHeight = (height - 20) / shelves;
  for (let shelf = 0; shelf < shelves; shelf++) {
    const floor = 10 + shelfHeight * (shelf + 1);
    for (let pack = 20; pack < width - 40; pack += 30) {
      x.fillStyle = colors[Math.floor(random() * colors.length)];
      roundedRect(x, pack, floor - shelfHeight * 0.72, 24, shelfHeight * 0.66, 3);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 35%)';
      x.fillRect(pack + 4, floor - shelfHeight * 0.62, 16, 6);
    }
    x.fillStyle = WOOD_LIGHT;
    x.fillRect(6, floor - 4, width - 12, 9);
  }
}

// A painted board with a word on it, in the game's title font.
export function drawSign(text: string, color: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    x.fillStyle = color;
    roundedRect(x, 0, 0, width, height, 14);
    x.fill();
    x.fillStyle = '#fbf6ea';
    roundedRect(x, 8, 8, width - 16, height - 16, 10);
    x.fill();
    x.fillStyle = '#2c2a35';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 40;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(text).width > width - 40 && size > 14);
    x.fillText(text, width / 2, height / 2 + 2);
  };
}

// How far down a drawing its first solid row is, as a share of its height: where the top of a
// character's head, or of what it wears, is.
export function solidTop(canvas: HTMLCanvasElement): number {
  const pixels = context(canvas).getImageData(0, 0, canvas.width, canvas.height).data;
  for (let row = 0; row < canvas.height; row++) {
    for (let column = 0; column < canvas.width; column++) {
      if (pixels[(row * canvas.width + column) * 4 + 3] > 128) {
        return row / canvas.height;
      }
    }
  }
  return 1;
}

const BOOK_COLORS = [
  '#c8453a',
  '#3a86c8',
  '#5b9c4e',
  '#e0a51f',
  '#7e63be',
  '#2f74ae',
  '#d9655a',
  '#5e8c6a',
];
const BOOKSHOP_GREEN = '#3f6b52';

// The bookshop from the street: a wooden shopfront under a green board with its name, a bay window
// stacked with books, and a door with a little bell.
export function drawBookshop(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(13);
    const top = 64;
    const wallLeft = 18;
    const wallRight = width - 18;
    // Walls, and the wooden panel along the bottom.
    x.fillStyle = '#efe0c2';
    x.fillRect(wallLeft, top, wallRight - wallLeft, height - top);
    x.fillStyle = WOOD;
    x.fillRect(wallLeft, height - 40, wallRight - wallLeft, 40);
    x.fillStyle = WOOD_DARK;
    x.fillRect(wallLeft, height - 40, wallRight - wallLeft, 6);
    // A roof edge of tiles.
    x.fillStyle = '#9a5a3a';
    for (let tile = wallLeft - 12; tile < wallRight + 12; tile += 24) {
      x.beginPath();
      x.arc(tile + 12, top, 13, 0, Math.PI);
      x.fill();
    }
    x.fillRect(wallLeft - 12, top - 10, wallRight - wallLeft + 24, 12);
    // The green board with the shop's name.
    x.fillStyle = BOOKSHOP_GREEN;
    roundedRect(x, wallLeft + 6, top + 22, wallRight - wallLeft - 12, 58, 6);
    x.fill();
    x.strokeStyle = '#e0a51f';
    x.lineWidth = 3;
    roundedRect(x, wallLeft + 12, top + 28, wallRight - wallLeft - 24, 46, 4);
    x.stroke();
    x.fillStyle = '#fbf6ea';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 36;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > wallRight - wallLeft - 60 && size > 14);
    x.fillText(name, width / 2, top + 53);
    // The bay window, with piles of books and one standing open.
    const windowLeft = wallLeft + 22;
    const windowTop = top + 104;
    const windowWidth = 220;
    const windowHeight = 150;
    x.fillStyle = BOOKSHOP_GREEN;
    roundedRect(x, windowLeft - 9, windowTop - 9, windowWidth + 18, windowHeight + 18, 6);
    x.fill();
    x.fillStyle = '#f6e7c4';
    x.fillRect(windowLeft, windowTop, windowWidth, windowHeight);
    x.fillStyle = WOOD_DARK;
    x.fillRect(windowLeft, windowTop + windowHeight - 14, windowWidth, 14);
    for (const pileX of [16, 150]) {
      let floor = windowTop + windowHeight - 14;
      for (let book = 0; book < 4; book++) {
        const bookHeight = 12 + random() * 6;
        const bookWidth = 52 - book * 3 + random() * 6;
        x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
        roundedRect(
          x,
          windowLeft + pileX + (random() - 0.5) * 6,
          floor - bookHeight,
          bookWidth,
          bookHeight,
          2,
        );
        x.fill();
        floor -= bookHeight;
      }
    }
    // An open book on a stand, in the middle.
    const standX = windowLeft + windowWidth / 2 + 2;
    const standY = windowTop + windowHeight - 40;
    x.fillStyle = WOOD;
    x.fillRect(standX - 4, standY, 8, 26);
    x.fillStyle = '#fbf6ea';
    x.beginPath();
    x.moveTo(standX, standY + 4);
    x.quadraticCurveTo(standX - 24, standY - 8, standX - 46, standY - 2);
    x.lineTo(standX - 46, standY - 50);
    x.quadraticCurveTo(standX - 24, standY - 56, standX, standY - 44);
    x.quadraticCurveTo(standX + 24, standY - 56, standX + 46, standY - 50);
    x.lineTo(standX + 46, standY - 2);
    x.quadraticCurveTo(standX + 24, standY - 8, standX, standY + 4);
    x.fill();
    x.strokeStyle = 'rgb(44 42 53 / 25%)';
    x.lineWidth = 2;
    for (let line = 0; line < 4; line++) {
      for (const side of [-1, 1]) {
        x.beginPath();
        x.moveTo(standX + side * 8, standY - 36 + line * 9);
        x.lineTo(standX + side * 38, standY - 38 + line * 9);
        x.stroke();
      }
    }
    // Light on the glass, and the window's crossbars.
    x.fillStyle = 'rgb(255 255 255 / 35%)';
    x.beginPath();
    x.moveTo(windowLeft + 20, windowTop + windowHeight);
    x.lineTo(windowLeft + 80, windowTop);
    x.lineTo(windowLeft + 100, windowTop);
    x.lineTo(windowLeft + 40, windowTop + windowHeight);
    x.fill();
    x.fillStyle = BOOKSHOP_GREEN;
    x.fillRect(windowLeft, windowTop + 46, windowWidth, 6);
    x.fillRect(windowLeft + windowWidth / 2 - 3, windowTop, 6, 52);
    // The door, on the right, with its little bell.
    const doorWidth = 96;
    const doorLeft = wallRight - doorWidth - 30;
    const doorTop = top + 108;
    x.fillStyle = BOOKSHOP_GREEN;
    roundedRect(x, doorLeft - 8, doorTop - 8, doorWidth + 16, height - doorTop + 8, 8);
    x.fill();
    x.fillStyle = '#7f5530';
    x.fillRect(doorLeft, doorTop, doorWidth, height - doorTop);
    x.fillStyle = '#f6e7c4';
    roundedRect(x, doorLeft + 14, doorTop + 14, doorWidth - 28, 84, 30);
    x.fill();
    x.fillStyle = '#f3c14b';
    ellipse(x, doorLeft + doorWidth - 14, doorTop + 130, 5, 5);
    x.beginPath();
    x.arc(doorLeft + doorWidth / 2, doorTop - 2, 9, Math.PI, 0);
    x.fill();
    ellipse(x, doorLeft + doorWidth / 2, doorTop + 1, 3, 3);
  };
}

// Where Mamie Noisette's face sits in her drawing, to frame it in a portrait.
export const HEDGEHOG_SIZE = { width: 300, height: 330 };
export const HEDGEHOG_FACE = { x: 164, y: 196, size: 210 };

// Mamie Noisette, the hedgehog who has kept the bookshop for decades: a ring of spines with a
// flower tucked in, a knitted shawl and half-moon glasses on a chain.
export function drawHedgehog(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  // Two rings of spines behind her.
  for (const [color, outer, inner, turn] of [
    ['#6e5038', 132, 104, 0],
    ['#8c6a4c', 116, 96, 0.5],
  ] as const) {
    x.fillStyle = color;
    x.beginPath();
    for (let spike = 0; spike < 48; spike++) {
      const angle = ((spike + turn) / 48) * Math.PI * 2;
      const radius = spike % 2 === 1 ? outer : inner;
      x.lineTo(cx + Math.cos(angle) * radius * 0.95, bodyY - 8 + Math.sin(angle) * radius);
    }
    x.closePath();
    x.fill();
  }
  // Feet, body and pale belly.
  x.fillStyle = '#8c6a4c';
  ellipse(x, cx - 38, bottom - 8, 26, 11);
  ellipse(x, cx + 38, bottom - 8, 26, 11);
  x.fillStyle = '#ebcfa8';
  ellipse(x, cx, bodyY, 90, 100);
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#f7e6cc';
  ellipse(x, cx, bottom - 44, 60, 70);
  x.restore();
  // Small round ears, and a flower tucked in the spines.
  x.fillStyle = '#c99a72';
  ellipse(x, cx - 62, bodyY - 74, 14, 12);
  ellipse(x, cx + 62, bodyY - 74, 14, 12);
  x.fillStyle = '#e8645a';
  for (let petal = 0; petal < 5; petal++) {
    const angle = (petal / 5) * Math.PI * 2;
    ellipse(x, cx + 76 + Math.cos(angle) * 9, bodyY - 92 + Math.sin(angle) * 9, 7, 7);
  }
  x.fillStyle = '#f7d36a';
  ellipse(x, cx + 76, bodyY - 92, 5, 5);
  // The knitted shawl over her shoulders, pinned with a brooch.
  const shawlTop = bottom - 100;
  x.fillStyle = '#c8453a';
  x.beginPath();
  x.moveTo(cx - 90, shawlTop - 6);
  x.quadraticCurveTo(cx, shawlTop + 14, cx + 90, shawlTop - 6);
  x.lineTo(cx + 66, shawlTop + 28);
  x.quadraticCurveTo(cx + 20, shawlTop + 50, cx, shawlTop + 82);
  x.quadraticCurveTo(cx - 20, shawlTop + 50, cx - 66, shawlTop + 28);
  x.closePath();
  x.fill();
  x.strokeStyle = 'rgb(142 47 39 / 55%)';
  x.lineWidth = 3;
  for (let row = 0; row < 4; row++) {
    const y = shawlTop + 14 + row * 15;
    const halfWidth = 70 - row * 17;
    for (let stitch = -halfWidth; stitch <= halfWidth; stitch += 12) {
      x.beginPath();
      x.moveTo(cx + stitch - 4, y - 4);
      x.lineTo(cx + stitch, y + 3);
      x.lineTo(cx + stitch + 4, y - 4);
      x.stroke();
    }
  }
  x.fillStyle = '#8e2f27';
  for (let tassel = -2; tassel <= 2; tassel++) {
    x.fillRect(cx - 2 + tassel * 6, shawlTop + 76 - Math.abs(tassel) * 6, 3, 14);
  }
  x.fillStyle = '#f3c14b';
  ellipse(x, cx, shawlTop + 10, 9, 9);
  x.fillStyle = '#b8861f';
  ellipse(x, cx, shawlTop + 10, 4, 4);
  // Smiling eyes, rosy cheeks, nose and mouth.
  const eyesY = bodyY - 36;
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 4;
  x.lineCap = 'round';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.arc(cx + side * 26, eyesY + 2, 9, 1.15 * Math.PI, 1.85 * Math.PI);
    x.stroke();
  }
  x.fillStyle = 'rgb(240 110 100 / 50%)';
  ellipse(x, cx - 50, eyesY + 24, 13, 7);
  ellipse(x, cx + 50, eyesY + 24, 13, 7);
  x.beginPath();
  x.arc(cx, eyesY + 20, 9, 0.15 * Math.PI, 0.85 * Math.PI);
  x.stroke();
  x.fillStyle = '#2c2a35';
  ellipse(x, cx, eyesY + 10, 8, 6);
  // Half-moon glasses, and their chain hanging down to her shoulders.
  x.strokeStyle = '#b8861f';
  x.lineWidth = 4;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 26 - 19, eyesY + 2);
    x.lineTo(cx + side * 26 + 19, eyesY + 2);
    x.arc(cx + side * 26, eyesY + 2, 19, 0, Math.PI);
    x.stroke();
  }
  x.beginPath();
  x.moveTo(cx - 7, eyesY + 4);
  x.quadraticCurveTo(cx, eyesY - 2, cx + 7, eyesY + 4);
  x.stroke();
  x.lineWidth = 2;
  x.setLineDash([3, 3]);
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 45, eyesY + 3);
    x.quadraticCurveTo(cx + side * 70, eyesY + 70, cx + side * 30, eyesY + 92);
    x.stroke();
  }
  x.setLineDash([]);
}

// The pile of books Mamie Noisette uses as a counter, her old till on top.
export function drawBookPile(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const random = seededRandom(17);
  // The books, lying flat, each a little off from the one below.
  let floor = height;
  const pileTop = 82;
  while (floor > pileTop + 8) {
    const bookHeight = Math.min(22 + random() * 12, floor - pileTop);
    const bookWidth = width * (0.82 + random() * 0.14);
    const left = (width - bookWidth) / 2 + (random() - 0.5) * 16;
    x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
    roundedRect(x, left, floor - bookHeight, bookWidth, bookHeight, 4);
    x.fill();
    // The edge of the pages on one end, and a band on the spine.
    const pagesOnRight = random() < 0.5;
    x.fillStyle = '#fbf6ea';
    x.fillRect(
      pagesOnRight ? left + bookWidth - 16 : left + 4,
      floor - bookHeight + 4,
      12,
      bookHeight - 8,
    );
    x.fillStyle = 'rgb(255 255 255 / 45%)';
    x.fillRect(left + bookWidth * 0.3, floor - bookHeight + 3, 6, bookHeight - 6);
    x.fillRect(left + bookWidth * 0.62, floor - bookHeight + 3, 6, bookHeight - 6);
    floor -= bookHeight;
  }
  // The till, an old brass one, on the top book.
  // Off to the right, where it doesn't hide her face.
  const tillLeft = width - 128;
  const tillWidth = 116;
  const tillBottom = floor;
  x.fillStyle = '#b8861f';
  roundedRect(x, tillLeft, tillBottom - 18, tillWidth, 18, 3);
  x.fill();
  x.fillStyle = '#e0a51f';
  x.beginPath();
  x.moveTo(tillLeft + 6, tillBottom - 18);
  x.lineTo(tillLeft + 22, tillBottom - 58);
  x.lineTo(tillLeft + tillWidth - 10, tillBottom - 58);
  x.lineTo(tillLeft + tillWidth - 6, tillBottom - 18);
  x.closePath();
  x.fill();
  x.fillStyle = '#fbf6ea';
  for (let row = 0; row < 2; row++) {
    for (let key = 0; key < 4; key++) {
      ellipse(x, tillLeft + 32 + key * 18 + row * 4, tillBottom - 44 + row * 14, 5, 4);
    }
  }
  // Its little screen, raised on top.
  x.fillStyle = '#b8861f';
  x.fillRect(tillLeft + 70, tillBottom - 74, 8, 18);
  x.fillStyle = '#2c2a35';
  roundedRect(x, tillLeft + 50, tillBottom - 78, 50, 22, 4);
  x.fill();
  x.fillStyle = '#9ed6a0';
  x.fillRect(tillLeft + 56, tillBottom - 72, 38, 10);
}

// The bookshop's back wall: shelves to the ceiling, full of books standing and lying, with the
// binders for sale on the shelves in the middle, behind the till.
export function drawBookWall(binders: { from: number; to: number }) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(19);
    x.fillStyle = WOOD;
    x.fillRect(0, 0, width, height);
    x.fillStyle = WOOD_DARK;
    x.fillRect(10, 10, width - 20, height - 20);
    const shelves = 4;
    const shelfHeight = (height - 20) / shelves;
    for (let shelf = 0; shelf < shelves; shelf++) {
      const floor = 10 + shelfHeight * (shelf + 1);
      let spine = 18;
      while (spine < width - 30) {
        const isBinder = spine > binders.from && spine < binders.to;
        if (isBinder) {
          // Binders: all the same height, each with a white label.
          const binderWidth = 24;
          const binderHeight = shelfHeight * 0.8;
          x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
          roundedRect(x, spine, floor - binderHeight - 4, binderWidth, binderHeight, 3);
          x.fill();
          x.fillStyle = '#fbf6ea';
          x.fillRect(spine + 5, floor - binderHeight * 0.75, binderWidth - 10, 18);
          x.fillStyle = 'rgb(0 0 0 / 25%)';
          ellipse(x, spine + binderWidth / 2, floor - binderHeight * 0.3, 4, 4);
          spine += binderWidth + 3;
          continue;
        }
        if (random() < 0.08) {
          // A short pile of books lying flat.
          let pileFloor = floor - 4;
          const pileWidth = 50 + random() * 14;
          for (let book = 0; book < 3; book++) {
            const bookHeight = 10 + random() * 5;
            x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
            roundedRect(
              x,
              spine + (random() - 0.5) * 6,
              pileFloor - bookHeight,
              pileWidth,
              bookHeight,
              2,
            );
            x.fill();
            pileFloor -= bookHeight;
          }
          spine += pileWidth + 6;
          continue;
        }
        const spineWidth = 10 + random() * 9;
        const spineHeight = shelfHeight * (0.5 + random() * 0.3);
        x.save();
        x.translate(spine, floor - 4);
        x.rotate(random() < 0.08 ? -0.14 : 0);
        x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
        roundedRect(x, 0, -spineHeight, spineWidth, spineHeight, 2);
        x.fill();
        x.fillStyle = 'rgb(255 255 255 / 40%)';
        x.fillRect(2, -spineHeight * 0.82, spineWidth - 4, 3);
        x.fillRect(2, -spineHeight * 0.22, spineWidth - 4, 3);
        x.restore();
        spine += spineWidth + 1;
      }
      x.fillStyle = WOOD_LIGHT;
      x.fillRect(6, floor - 4, width - 12, 9);
    }
  };
}

// A wooden rack of magazines, their covers facing out on slanted tiers.
export function drawMagazineRack(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const random = seededRandom(23);
  const tiers = 3;
  const tierHeight = (height - 30) / tiers;
  // The two side boards.
  x.fillStyle = WOOD_DARK;
  x.fillRect(4, 0, 12, height);
  x.fillRect(width - 16, 0, 12, height);
  for (let tier = 0; tier < tiers; tier++) {
    const floor = 10 + tierHeight * (tier + 1);
    for (let cover = 0; cover < 3; cover++) {
      const left = 22 + cover * ((width - 44) / 3);
      const coverWidth = (width - 44) / 3 - 6;
      const coverHeight = tierHeight * 0.86;
      x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
      roundedRect(x, left, floor - coverHeight, coverWidth, coverHeight, 2);
      x.fill();
      // A title band, and a round picture.
      x.fillStyle = '#fbf6ea';
      x.fillRect(left + 4, floor - coverHeight + 5, coverWidth - 8, 9);
      x.fillStyle = 'rgb(255 255 255 / 55%)';
      ellipse(
        x,
        left + coverWidth / 2,
        floor - coverHeight * 0.4,
        coverWidth * 0.28,
        coverWidth * 0.28,
      );
    }
    x.fillStyle = WOOD;
    x.fillRect(4, floor, width - 8, 10);
  }
  x.fillStyle = WOOD;
  x.fillRect(4, height - 20, width - 8, 20);
}

// A table of stationery: piles of notebooks and pots full of pens and pencils.
export function drawStationeryTable(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  const random = seededRandom(29);
  const top = height - 92;
  // Legs and top.
  x.fillStyle = WOOD_DARK;
  x.fillRect(16, top + 12, 14, height - top - 12);
  x.fillRect(width - 30, top + 12, 14, height - top - 12);
  x.fillStyle = WOOD;
  roundedRect(x, 0, top, width, 18, 5);
  x.fill();
  // Piles of notebooks, with their spiral.
  for (const pileX of [14, 108]) {
    let floor = top;
    for (let notebook = 0; notebook < 4; notebook++) {
      const notebookHeight = 11;
      const notebookWidth = 76 - notebook * 2;
      const left = pileX + (random() - 0.5) * 8;
      x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
      roundedRect(x, left, floor - notebookHeight, notebookWidth, notebookHeight, 2);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 70%)';
      for (let ring = 4; ring < notebookWidth - 4; ring += 7) {
        x.fillRect(left + ring, floor - notebookHeight + 2, 3, 3);
      }
      floor -= notebookHeight + 1;
    }
  }
  // Pots of pens and pencils.
  for (const [potX, potColor] of [
    [width - 70, '#3a86c8'],
    [width - 38, '#e0a51f'],
  ] as const) {
    for (let pen = 0; pen < 4; pen++) {
      x.save();
      x.translate(potX + 6 + pen * 4, top - 30);
      x.rotate((pen - 1.5) * 0.16);
      x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
      x.fillRect(-2, -34, 5, 40);
      x.fillStyle = '#2c2a35';
      x.fillRect(-2, -38, 5, 5);
      x.restore();
    }
    x.fillStyle = potColor;
    roundedRect(x, potX - 4, top - 34, 30, 34, 4);
    x.fill();
    x.fillStyle = 'rgb(255 255 255 / 30%)';
    x.fillRect(potX, top - 28, 4, 24);
  }
}

// Where Léa's face sits in her drawing, to frame it in a portrait.
export const LEA_SIZE = { width: 340, height: 360 };
export const LEA_FACE = { x: 170, y: 160, size: 190 };

// Léa, the young rabbit next door, too busy with work to dust: her ears droop with tiredness, a
// pencil holds her bun, and square glasses hide her eyes behind the glare of her screen. She sits
// at her desk, behind her laptop, with a coffee and sticky notes.
export function drawLea(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 36;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 36;
  const headTop = bodyY - 100;
  // Drooping ears.
  for (const side of [-1, 1]) {
    x.save();
    x.translate(cx + side * 50, bodyY - 72);
    x.rotate(side * 0.9);
    x.fillStyle = '#d8cfc4';
    ellipse(x, 0, -36, 18, 50);
    x.fillStyle = '#f2b8c6';
    ellipse(x, 0, -34, 9, 36);
    x.restore();
  }
  // Body and pale belly.
  x.fillStyle = '#e6ded4';
  ellipse(x, cx, bodyY, 90, 100);
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#fbf6ea';
  ellipse(x, cx, bottom - 44, 60, 70);
  x.restore();
  // The bun, held by a pencil.
  x.fillStyle = '#c9c0b4';
  ellipse(x, cx + 8, headTop + 4, 26, 22);
  x.save();
  x.translate(cx + 8, headTop + 2);
  x.rotate(-0.6);
  x.fillStyle = '#f3c14b';
  x.fillRect(-36, -3, 62, 7);
  x.fillStyle = '#e8a0a0';
  x.fillRect(26, -3, 8, 7);
  x.fillStyle = '#2c2a35';
  x.beginPath();
  x.moveTo(-36, -3);
  x.lineTo(-46, 0.5);
  x.lineTo(-36, 4);
  x.fill();
  x.restore();
  // Cheeks and nose.
  x.fillStyle = 'rgb(240 110 100 / 45%)';
  ellipse(x, cx - 50, eyesY + 24, 12, 7);
  ellipse(x, cx + 50, eyesY + 24, 12, 7);
  x.fillStyle = '#e07c8c';
  ellipse(x, cx, eyesY + 14, 7, 5);
  // Square glasses that can't be seen through, white with the screen's glare.
  for (const side of [-1, 1]) {
    const left = cx + side * 27 - 20;
    x.fillStyle = '#2c2a35';
    roundedRect(x, left, eyesY - 15, 40, 30, 5);
    x.fill();
    x.fillStyle = '#b9d6e8';
    roundedRect(x, left + 4, eyesY - 11, 32, 22, 3);
    x.fill();
    x.fillStyle = 'rgb(255 255 255 / 85%)';
    x.beginPath();
    x.moveTo(left + 8, eyesY + 9);
    x.lineTo(left + 22, eyesY - 9);
    x.lineTo(left + 29, eyesY - 9);
    x.lineTo(left + 15, eyesY + 9);
    x.fill();
  }
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(cx - 7, eyesY - 4);
  x.lineTo(cx + 7, eyesY - 4);
  x.stroke();
  // The desk.
  const top = height - 70;
  x.fillStyle = WOOD;
  roundedRect(x, cx - 150, top, 300, 16, 5);
  x.fill();
  x.fillStyle = WOOD_DARK;
  x.fillRect(cx - 138, top + 16, 16, height - top - 16);
  x.fillRect(cx + 122, top + 16, 16, height - top - 16);
  // The laptop, its lid towards us, with a sticker.
  x.fillStyle = '#9aa3ae';
  roundedRect(x, cx - 70, top - 92, 140, 94, 8);
  x.fill();
  x.fillStyle = '#b8c0c9';
  roundedRect(x, cx - 62, top - 84, 124, 78, 5);
  x.fill();
  x.fillStyle = '#e07c8c';
  ellipse(x, cx, top - 46, 13, 13);
  x.fillStyle = '#fbf6ea';
  ellipse(x, cx, top - 46, 6, 6);
  x.fillStyle = '#7c8590';
  x.fillRect(cx - 78, top - 4, 156, 6);
  // A mug of steaming coffee.
  x.fillStyle = '#fbf6ea';
  roundedRect(x, cx + 88, top - 34, 30, 34, 4);
  x.fill();
  x.strokeStyle = '#fbf6ea';
  x.lineWidth = 5;
  x.beginPath();
  x.arc(cx + 122, top - 18, 8, -1.2, 1.2);
  x.stroke();
  x.fillStyle = '#e07c8c';
  x.fillRect(cx + 88, top - 22, 30, 6);
  x.strokeStyle = 'rgb(160 160 170 / 70%)';
  x.lineWidth = 3;
  for (const shift of [0, 10]) {
    x.beginPath();
    x.moveTo(cx + 97 + shift, top - 40);
    x.quadraticCurveTo(cx + 91 + shift, top - 52, cx + 99 + shift, top - 62);
    x.stroke();
  }
  // Sticky notes.
  for (const [dx, dy, color, turn] of [
    [-130, -30, '#f3c14b', -0.1],
    [-112, -44, '#9ed6a0', 0.12],
    [-128, -58, '#f2b8c6', -0.05],
  ] as const) {
    x.save();
    x.translate(cx + dx, top + dy);
    x.rotate(turn);
    x.fillStyle = color;
    x.fillRect(0, 0, 26, 26);
    x.restore();
  }
}

// Léa's block of flats: three storeys of pastel brick, window boxes of flowers, and a door at the
// bottom right.
// A drop of sweat, for someone overworked.
export function drawSweatDrop(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  const radius = width / 2;
  x.fillStyle = '#8cc8ee';
  x.beginPath();
  x.moveTo(cx, 0);
  x.quadraticCurveTo(cx + radius * 0.9, height * 0.45, cx + radius, height - radius);
  x.arc(cx, height - radius, radius, 0, Math.PI);
  x.quadraticCurveTo(cx - radius * 0.9, height * 0.45, cx, 0);
  x.fill();
  x.fillStyle = 'rgb(255 255 255 / 75%)';
  ellipse(x, cx - radius * 0.35, height - radius * 1.1, radius * 0.22, radius * 0.38);
}

export function drawFlats(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const random = seededRandom(31);
  const left = 14;
  const right = width - 14;
  const top = 26;
  x.fillStyle = '#e9b8a4';
  x.fillRect(left, top, right - left, height - top);
  // Bricks, a few lighter than the others.
  for (let row = top + 8; row < height - 30; row += 18) {
    for (let column = left + ((row / 18) % 2) * 20; column < right - 30; column += 40) {
      if (random() < 0.3) {
        x.fillStyle = 'rgb(255 255 255 / 18%)';
        x.fillRect(column, row, 34, 12);
      }
    }
  }
  // The roof's edge.
  x.fillStyle = '#7f5530';
  x.fillRect(left - 10, top - 14, right - left + 20, 18);
  // Windows on three floors, with flower boxes.
  const windowWidth = 70;
  const windowHeight = 78;
  for (let floor = 0; floor < 3; floor++) {
    for (let column = 0; column < 3; column++) {
      if (floor === 2 && column === 2) {
        continue;
      }
      const windowLeft = left + 34 + column * 132;
      const windowTop = top + 26 + floor * 112;
      x.fillStyle = '#fbf6ea';
      roundedRect(x, windowLeft - 7, windowTop - 7, windowWidth + 14, windowHeight + 14, 6);
      x.fill();
      x.fillStyle = '#8cc3e6';
      x.fillRect(windowLeft, windowTop, windowWidth, windowHeight);
      x.fillStyle = '#fbf6ea';
      x.fillRect(windowLeft + windowWidth / 2 - 3, windowTop, 6, windowHeight);
      x.fillStyle = 'rgb(255 255 255 / 35%)';
      x.fillRect(windowLeft + 8, windowTop + 6, 8, windowHeight - 12);
      x.fillStyle = WOOD;
      x.fillRect(windowLeft - 6, windowTop + windowHeight + 6, windowWidth + 12, 12);
      for (let flower = 0; flower < 5; flower++) {
        x.fillStyle = ['#e8645a', '#f3c14b', '#9a7bd6'][flower % 3];
        ellipse(x, windowLeft + 4 + flower * 15, windowTop + windowHeight + 4, 6, 6);
      }
    }
  }
  // The front door, under a little awning.
  const doorWidth = 96;
  const doorLeft = right - doorWidth - 30;
  const doorTop = height - 150;
  x.fillStyle = '#5e8c6a';
  x.fillRect(doorLeft - 16, doorTop - 22, doorWidth + 32, 16);
  x.fillStyle = '#fbf6ea';
  roundedRect(x, doorLeft - 8, doorTop - 6, doorWidth + 16, height - doorTop + 6, 6);
  x.fill();
  x.fillStyle = '#3f6b52';
  x.fillRect(doorLeft, doorTop, doorWidth, height - doorTop);
  x.fillStyle = '#8cc3e6';
  x.fillRect(doorLeft + 14, doorTop + 14, doorWidth - 28, 54);
  x.fillStyle = '#f3c14b';
  ellipse(x, doorLeft + doorWidth - 14, doorTop + 90, 5, 5);
}

// A soft sofa with two cushions.
export function drawSofa(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const seat = height * 0.55;
  x.fillStyle = WOOD_DARK;
  x.fillRect(24, height - 18, 14, 18);
  x.fillRect(width - 38, height - 18, 14, 18);
  x.fillStyle = '#6a8fb8';
  roundedRect(x, 10, 10, width - 20, seat, 20);
  x.fill();
  x.fillStyle = '#7ea3cc';
  roundedRect(x, 0, seat - 20, width, height - seat, 16);
  x.fill();
  x.fillStyle = '#5a7fa8';
  roundedRect(x, 0, seat - 40, 40, height - seat + 20, 14);
  x.fill();
  roundedRect(x, width - 40, seat - 40, 40, height - seat + 20, 14);
  x.fill();
  for (const [cushionX, color] of [
    [70, '#f3c14b'],
    [width - 130, '#e8645a'],
  ] as const) {
    x.fillStyle = color;
    roundedRect(x, cushionX, seat - 64, 60, 52, 12);
    x.fill();
  }
}

// A patch of dust on the wall: a grey cloud with a few darker specks.
export function drawDust(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const random = seededRandom(37);
  x.fillStyle = 'rgb(120 112 104 / 55%)';
  for (let puff = 0; puff < 9; puff++) {
    ellipse(
      x,
      width * (0.25 + random() * 0.5),
      height * (0.3 + random() * 0.4),
      width * (0.12 + random() * 0.12),
      height * (0.12 + random() * 0.12),
    );
  }
  x.fillStyle = 'rgb(80 72 66 / 60%)';
  for (let speck = 0; speck < 14; speck++) {
    ellipse(x, width * (0.15 + random() * 0.7), height * (0.15 + random() * 0.7), 2.5, 2.5);
  }
}

// A picture in a wooden frame: a little landscape of hills under the sun.
export function drawFrame(color: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    x.fillStyle = WOOD;
    roundedRect(x, 0, 0, width, height, 6);
    x.fill();
    x.fillStyle = '#d7ecf4';
    x.fillRect(10, 10, width - 20, height - 20);
    x.fillStyle = color;
    ellipse(x, width * 0.35, height - 10, width * 0.4, height * 0.3);
    ellipse(x, width * 0.75, height - 10, width * 0.35, height * 0.22);
    x.fillStyle = '#f7cb52';
    ellipse(x, width * 0.7, height * 0.35, 9, 9);
  };
}

const NEON_PINK = '#ff4fa3';
const NEON_BLUE = '#4fd8ff';
const ARCADE_DARK = '#2e2a4a';

// Draws a word in neon light: a soft glow in its colour, then a pale core.
function neonText(
  x: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  color: string,
) {
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  let size = 46;
  do {
    x.font = `${size}px "Bagel Fat One", sans-serif`;
    size -= 2;
  } while (x.measureText(text).width > maxWidth && size > 14);
  x.save();
  x.shadowColor = color;
  x.shadowBlur = 16;
  x.fillStyle = color;
  x.fillText(text, centerX, centerY);
  x.restore();
  x.fillStyle = '#fff3fa';
  x.fillText(text, centerX, centerY - 1);
}

// The arcade from the street: a dark front under a neon sign, posters of games, and glass doors
// glowing with the machines' light.
export function drawArcade(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const left = 16;
    const right = width - 16;
    const top = 92;
    x.fillStyle = ARCADE_DARK;
    x.fillRect(left, top, right - left, height - top);
    x.fillStyle = '#231f3a';
    x.fillRect(left, height - 30, right - left, 30);
    // The sign board on the roof, with the name in neon.
    x.fillStyle = '#1d1a30';
    roundedRect(x, left + 20, 4, right - left - 40, 80, 14);
    x.fill();
    x.strokeStyle = NEON_BLUE;
    x.lineWidth = 4;
    x.save();
    x.shadowColor = NEON_BLUE;
    x.shadowBlur = 10;
    roundedRect(x, left + 28, 12, right - left - 56, 64, 10);
    x.stroke();
    x.restore();
    neonText(x, name, width / 2, 45, right - left - 90, NEON_PINK);
    // A strip of lights along the top of the front.
    for (let bulb = left + 14; bulb < right; bulb += 24) {
      x.fillStyle = bulb % 48 < 24 ? '#ffd84f' : NEON_PINK;
      ellipse(x, bulb, top + 10, 5, 5);
    }
    // Posters: a little ghost-like pixel creature and a star, our own drawings.
    for (const [posterX, color] of [
      [left + 26, '#6a5acd'],
      [left + 140, '#d9655a'],
    ] as const) {
      x.fillStyle = '#fbf6ea';
      roundedRect(x, posterX - 6, top + 40, 104, 140, 4);
      x.fill();
      x.fillStyle = color;
      x.fillRect(posterX, top + 46, 92, 128);
      x.fillStyle = '#fbf6ea';
      for (const [px, py] of [
        [2, 0],
        [3, 0],
        [1, 1],
        [2, 1],
        [3, 1],
        [4, 1],
        [0, 2],
        [1, 2],
        [4, 2],
        [5, 2],
        [0, 3],
        [1, 3],
        [2, 3],
        [3, 3],
        [4, 3],
        [5, 3],
        [0, 4],
        [2, 4],
        [3, 4],
        [5, 4],
      ]) {
        x.fillRect(posterX + 22 + px * 8, top + 70 + py * 8, 8, 8);
      }
      x.fillStyle = '#ffd84f';
      x.fillRect(posterX + 14, top + 136, 64, 10);
      x.fillRect(posterX + 24, top + 152, 44, 8);
    }
    // The glass doors, lit from inside.
    const doorWidth = 112;
    const doorLeft = right - doorWidth - 26;
    const doorTop = top + 50;
    x.fillStyle = '#1d1a30';
    roundedRect(x, doorLeft - 8, doorTop - 8, doorWidth + 16, height - doorTop + 8, 6);
    x.fill();
    const glow = x.createLinearGradient(0, doorTop, 0, height);
    glow.addColorStop(0, '#b38cff');
    glow.addColorStop(1, '#ff8fcf');
    x.fillStyle = glow;
    x.fillRect(doorLeft, doorTop, doorWidth, height - doorTop);
    x.fillStyle = '#1d1a30';
    x.fillRect(doorLeft + doorWidth / 2 - 3, doorTop, 6, height - doorTop);
    x.fillStyle = 'rgb(255 255 255 / 30%)';
    x.fillRect(doorLeft + 10, doorTop + 10, 10, height - doorTop - 30);
    x.fillRect(doorLeft + doorWidth / 2 + 12, doorTop + 10, 10, height - doorTop - 30);
  };
}

// The arcade's carpet: dark blue, scattered with bright shapes, like the carpets of real arcades.
export function drawArcadeCarpet(): HTMLCanvasElement {
  const width = 1300;
  const height = 420;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const random = seededRandom(41);
  x.fillStyle = '#25214a';
  x.fillRect(0, 0, width, height);
  const colors = [NEON_PINK, NEON_BLUE, '#ffd84f', '#7cff9a'];
  for (let shape = 0; shape < 260; shape++) {
    x.fillStyle = colors[shape % colors.length];
    x.globalAlpha = 0.55;
    const px = random() * width;
    const py = random() * height;
    if (shape % 3 === 0) {
      ellipse(x, px, py, 6, 4);
    } else if (shape % 3 === 1) {
      x.save();
      x.translate(px, py);
      x.rotate(random() * Math.PI);
      x.fillRect(-10, -2, 20, 4);
      x.restore();
    } else {
      x.beginPath();
      x.moveTo(px, py - 6);
      x.lineTo(px + 6, py + 5);
      x.lineTo(px - 6, py + 5);
      x.fill();
    }
  }
  x.globalAlpha = 1;
  addGrain(canvas, 12, 42);
  return canvas;
}

// An arcade cabinet: a lit marquee, a screen with a little pixel creature of our own, and a
// joystick with buttons.
export function drawArcadeCabinet(color: string, screen: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    // Body, narrower at the control panel.
    x.fillStyle = color;
    x.beginPath();
    x.moveTo(8, 0);
    x.lineTo(width - 8, 0);
    x.lineTo(width - 8, height * 0.48);
    x.lineTo(width, height * 0.6);
    x.lineTo(width - 6, height);
    x.lineTo(6, height);
    x.lineTo(0, height * 0.6);
    x.lineTo(8, height * 0.48);
    x.closePath();
    x.fill();
    x.fillStyle = 'rgb(0 0 0 / 25%)';
    x.fillRect(8, height * 0.62, width - 16, height * 0.38);
    // Marquee.
    x.fillStyle = '#fff3c4';
    roundedRect(x, 14, 10, width - 28, height * 0.1, 4);
    x.fill();
    x.fillStyle = color;
    x.fillRect(24, 10 + height * 0.035, width - 48, height * 0.03);
    // Screen with its creature.
    x.fillStyle = '#14122a';
    roundedRect(x, 14, height * 0.15, width - 28, height * 0.3, 6);
    x.fill();
    x.fillStyle = screen;
    const pixel = (width - 28) / 14;
    const left = 14 + pixel * 4;
    const top = height * 0.2;
    for (const [px, py] of [
      [1, 0],
      [4, 0],
      [2, 1],
      [3, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [5, 2],
      [0, 3],
      [2, 3],
      [3, 3],
      [5, 3],
      [0, 4],
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 4],
      [5, 4],
      [1, 5],
      [4, 5],
    ]) {
      x.fillRect(left + px * pixel, top + py * pixel, pixel, pixel);
    }
    // Control panel.
    x.fillStyle = '#2c2a35';
    x.fillRect(width * 0.3 - 2, height * 0.5, 4, 14);
    ellipse(x, width * 0.3, height * 0.5, 7, 7);
    for (const [index, button] of ['#ff4fa3', '#ffd84f', '#4fd8ff'].entries()) {
      x.fillStyle = button;
      ellipse(x, width * 0.55 + index * 12, height * 0.55, 5, 4);
    }
    // Coin slot.
    x.fillStyle = '#ffd84f';
    x.fillRect(width / 2 - 8, height * 0.75, 16, 4);
  };
}

// A claw machine: a glass box full of round plush toys, the claw hanging above them.
export function drawClawMachine(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const random = seededRandom(43);
  const glassTop = 30;
  const glassBottom = height * 0.62;
  x.fillStyle = NEON_PINK;
  roundedRect(x, 0, 0, width, 34, 8);
  x.fill();
  x.fillStyle = '#c93a82';
  x.fillRect(0, glassBottom, width, height - glassBottom);
  x.fillStyle = '#ffd84f';
  x.fillRect(width / 2 - 20, height * 0.75, 40, 22);
  x.fillStyle = '#d8f2ff';
  x.fillRect(8, glassTop, width - 16, glassBottom - glassTop);
  // Plush toys, round with little ears.
  const plushColors = ['#f2a95b', '#9a7bd6', '#78ae6c', '#f2b8c6', '#4fd8ff', '#ffd84f'];
  for (let plush = 0; plush < 9; plush++) {
    const px = 30 + (plush % 5) * ((width - 60) / 4) + (random() - 0.5) * 10;
    const py = glassBottom - 22 - Math.floor(plush / 5) * 26;
    x.fillStyle = plushColors[plush % plushColors.length];
    ellipse(x, px - 9, py - 14, 6, 6);
    ellipse(x, px + 9, py - 14, 6, 6);
    ellipse(x, px, py, 16, 15);
    x.fillStyle = '#2c2a35';
    ellipse(x, px - 5, py - 2, 2, 2);
    ellipse(x, px + 5, py - 2, 2, 2);
  }
  // The claw on its cable.
  x.strokeStyle = '#7c8590';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(width * 0.6, glassTop);
  x.lineTo(width * 0.6, glassTop + 46);
  x.stroke();
  x.lineWidth = 4;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(width * 0.6, glassTop + 46);
    x.quadraticCurveTo(
      width * 0.6 + side * 18,
      glassTop + 52,
      width * 0.6 + side * 10,
      glassTop + 70,
    );
    x.stroke();
  }
  x.fillStyle = 'rgb(255 255 255 / 40%)';
  x.fillRect(16, glassTop + 8, 10, glassBottom - glassTop - 16);
}

// The basketball machine: a backboard with its hoop and net, a red score panel, and a ramp full
// of balls.
export function drawBasketballMachine(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  const cx = width / 2;
  // Side frames and the cage over the ramp.
  x.fillStyle = '#3a6fb0';
  x.fillRect(10, 40, 18, height - 40);
  x.fillRect(width - 28, 40, 18, height - 40);
  x.strokeStyle = 'rgb(255 255 255 / 45%)';
  x.lineWidth = 2;
  for (let line = 40; line < width - 30; line += 18) {
    x.beginPath();
    x.moveTo(line, 120);
    x.lineTo(line, height * 0.7);
    x.stroke();
  }
  // Score panel at the top.
  x.fillStyle = '#c8453a';
  roundedRect(x, 0, 0, width, 52, 10);
  x.fill();
  x.fillStyle = '#14122a';
  roundedRect(x, cx - 50, 10, 100, 32, 5);
  x.fill();
  x.fillStyle = '#ffc83d';
  x.font = 'bold 24px "Courier New", monospace';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText('88', cx, 27);
  // Backboard, hoop and net.
  x.fillStyle = '#fbf6ea';
  roundedRect(x, cx - 60, 62, 120, 76, 6);
  x.fill();
  x.strokeStyle = '#c8453a';
  x.lineWidth = 4;
  x.strokeRect(cx - 24, 92, 48, 34);
  x.strokeStyle = '#e8792b';
  x.lineWidth = 6;
  x.beginPath();
  x.ellipse(cx, 140, 30, 7, 0, 0, Math.PI * 2);
  x.stroke();
  x.strokeStyle = '#fbf6ea';
  x.lineWidth = 2;
  for (let strand = -3; strand <= 3; strand++) {
    x.beginPath();
    x.moveTo(cx + strand * 9, 144);
    x.lineTo(cx + strand * 6, 172);
    x.stroke();
  }
  // The ramp and the balls waiting on it.
  x.fillStyle = '#2e5d96';
  x.beginPath();
  x.moveTo(10, height * 0.7);
  x.lineTo(width - 10, height * 0.62);
  x.lineTo(width - 10, height);
  x.lineTo(10, height);
  x.closePath();
  x.fill();
  for (let ball = 0; ball < 5; ball++) {
    const bx = 40 + ball * ((width - 80) / 4);
    const by = height * 0.7 - 14 - ball * ((height * 0.08) / 4);
    x.fillStyle = '#e8792b';
    ellipse(x, bx, by, 14, 14);
    x.strokeStyle = '#8a3f12';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(bx - 14, by);
    x.lineTo(bx + 14, by);
    x.moveTo(bx, by - 14);
    x.lineTo(bx, by + 14);
    x.stroke();
  }
  x.fillStyle = '#ffd84f';
  x.fillRect(cx - 18, height - 40, 36, 8);
}

// The arcade's door inside: dark metal in a neon frame, with a pixel creature and heart of our own,
// a row of arcade buttons, and a joystick for a handle.
export function drawArcadeDoor(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.fillStyle = '#1d1a30';
  x.fillRect(0, 0, width, height);
  // The neon frame.
  x.save();
  x.shadowColor = NEON_PINK;
  x.shadowBlur = 14;
  x.strokeStyle = NEON_PINK;
  x.lineWidth = 7;
  roundedRect(x, 10, 10, width - 20, height - 14, 10);
  x.stroke();
  x.restore();
  // The door, with its panel of darker metal and rivets.
  x.fillStyle = '#34305a';
  roundedRect(x, 22, 22, width - 44, height - 26, 6);
  x.fill();
  x.fillStyle = '#2a2648';
  roundedRect(x, 36, 40, width - 72, height * 0.42, 6);
  x.fill();
  x.fillStyle = '#5a5585';
  for (const [rivetX, rivetY] of [
    [32, 32],
    [width - 32, 32],
    [32, height - 14],
    [width - 32, height - 14],
  ]) {
    ellipse(x, rivetX, rivetY, 4, 4);
  }
  // A pixel creature on the panel, and a heart beside it.
  const pixel = 9;
  const creatureLeft = width / 2 - pixel * 3 - 18;
  const creatureTop = 70;
  x.save();
  x.shadowColor = NEON_BLUE;
  x.shadowBlur = 8;
  x.fillStyle = NEON_BLUE;
  for (const [px, py] of [
    [1, 0],
    [4, 0],
    [2, 1],
    [3, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
    [5, 2],
    [0, 3],
    [2, 3],
    [3, 3],
    [5, 3],
    [0, 4],
    [1, 4],
    [2, 4],
    [3, 4],
    [4, 4],
    [5, 4],
    [1, 5],
    [4, 5],
  ]) {
    x.fillRect(creatureLeft + px * pixel, creatureTop + py * pixel, pixel, pixel);
  }
  x.fillStyle = NEON_PINK;
  x.shadowColor = NEON_PINK;
  for (const [px, py] of [
    [1, 0],
    [2, 0],
    [4, 0],
    [5, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 1],
    [6, 1],
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
    [5, 2],
    [2, 3],
    [3, 3],
    [4, 3],
    [3, 4],
  ]) {
    x.fillRect(creatureLeft + 66 + px * 6, creatureTop + 12 + py * 6, 6, 6);
  }
  x.restore();
  // Yellow and black stripes across the bottom, like a machine's.
  x.save();
  x.beginPath();
  x.rect(22, height - 46, width - 44, 26);
  x.clip();
  for (let stripe = -40; stripe < width; stripe += 28) {
    x.fillStyle = '#ffd84f';
    x.beginPath();
    x.moveTo(stripe, height - 20);
    x.lineTo(stripe + 14, height - 20);
    x.lineTo(stripe + 40, height - 46);
    x.lineTo(stripe + 26, height - 46);
    x.fill();
  }
  x.restore();
  // Arcade buttons, and a joystick for a handle.
  for (const [index, color] of ['#ff4fa3', '#ffd84f', '#4fd8ff'].entries()) {
    const buttonX = 50 + index * 26;
    const buttonY = height * 0.64;
    x.fillStyle = 'rgb(0 0 0 / 35%)';
    ellipse(x, buttonX, buttonY + 3, 10, 8);
    x.fillStyle = color;
    ellipse(x, buttonX, buttonY, 10, 8);
    x.fillStyle = 'rgb(255 255 255 / 45%)';
    ellipse(x, buttonX - 3, buttonY - 3, 3, 2);
  }
  const stickX = width - 46;
  const stickY = height * 0.62;
  x.fillStyle = '#14122a';
  ellipse(x, stickX, stickY + 18, 16, 6);
  x.fillStyle = '#8a8fa0';
  x.fillRect(stickX - 3, stickY - 6, 6, 24);
  x.fillStyle = '#e8453a';
  ellipse(x, stickX, stickY - 10, 12, 12);
  x.fillStyle = 'rgb(255 255 255 / 50%)';
  ellipse(x, stickX - 4, stickY - 14, 4, 3);
}

const BUS_YELLOW = '#f3c14b';
const BUS_GREEN = '#3f8a6a';

// A little bus seen from the side, as a pictogram on signs.
function busPictogram(x: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) {
  x.fillStyle = '#fbf6ea';
  roundedRect(x, centerX - size, centerY - size * 0.6, size * 2, size * 1.1, size * 0.25);
  x.fill();
  x.fillStyle = BUS_GREEN;
  for (let pane = 0; pane < 3; pane++) {
    x.fillRect(
      centerX - size * 0.85 + pane * size * 0.6,
      centerY - size * 0.45,
      size * 0.48,
      size * 0.4,
    );
  }
  x.fillStyle = '#2c2a35';
  ellipse(x, centerX - size * 0.55, centerY + size * 0.55, size * 0.22, size * 0.22);
  ellipse(x, centerX + size * 0.55, centerY + size * 0.55, size * 0.22, size * 0.22);
}

// The bus shelter: a roof over a glass back and a bench, and by the kerb the stop's sign, with its
// name on a board.
export function drawBusShelter(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    // The sign's pole and round sign, on the left.
    const poleX = 30;
    x.fillStyle = '#7c8590';
    x.fillRect(poleX - 4, 40, 8, height - 40);
    x.fillStyle = BUS_GREEN;
    ellipse(x, poleX, 42, 30, 30);
    x.fillStyle = '#fbf6ea';
    ellipse(x, poleX, 42, 24, 24);
    x.fillStyle = BUS_GREEN;
    ellipse(x, poleX, 42, 20, 20);
    busPictogram(x, poleX, 42, 11);
    // The name board under it.
    x.fillStyle = '#fbf6ea';
    roundedRect(x, poleX - 26, 80, 120, 30, 5);
    x.fill();
    x.fillStyle = BUS_GREEN;
    x.fillRect(poleX - 26, 80, 6, 30);
    x.fillStyle = '#2c2a35';
    x.textAlign = 'left';
    x.textBaseline = 'middle';
    let size = 20;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 1;
    } while (x.measureText(name).width > 104 && size > 9);
    x.fillText(name, poleX - 14, 96);
    // The shelter: posts, a glass back, a roof and a bench.
    const left = 150;
    const right = width - 6;
    const roofY = 60;
    x.fillStyle = 'rgb(180 220 240 / 55%)';
    x.fillRect(left + 8, roofY + 18, right - left - 16, height - roofY - 60);
    x.fillStyle = 'rgb(255 255 255 / 45%)';
    x.fillRect(left + 22, roofY + 30, 10, height - roofY - 90);
    x.fillStyle = BUS_GREEN;
    x.fillRect(left, roofY + 10, 10, height - roofY - 10);
    x.fillRect(right - 10, roofY + 10, 10, height - roofY - 10);
    roundedRect(x, left - 12, roofY, right - left + 18, 22, 6);
    x.fill();
    x.fillStyle = BUS_YELLOW;
    x.fillRect(left - 12, roofY + 16, right - left + 18, 6);
    // A timetable on the glass.
    x.fillStyle = '#fbf6ea';
    x.fillRect(right - 62, roofY + 44, 40, 54);
    x.fillStyle = 'rgb(44 42 53 / 35%)';
    for (let line = 0; line < 5; line++) {
      x.fillRect(right - 56, roofY + 52 + line * 9, 28, 3);
    }
    // The bench.
    x.fillStyle = WOOD;
    roundedRect(x, left + 20, height - 66, right - left - 40, 12, 4);
    x.fill();
    x.fillStyle = WOOD_DARK;
    x.fillRect(left + 34, height - 54, 8, 54);
    x.fillRect(right - 42, height - 54, 8, 54);
  };
}

// The bus, waiting with its doors open: yellow with a green stripe, a row of windows, the line's
// name lit up over the windscreen, and big round wheels.
export function drawBus(line: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const bottom = height - 34;
    // Body, with a rounded nose on the left, where it faces.
    x.fillStyle = BUS_YELLOW;
    roundedRect(x, 0, 20, width, bottom - 20, 26);
    x.fill();
    x.fillStyle = BUS_GREEN;
    x.fillRect(0, bottom - 60, width, 22);
    x.fillStyle = '#d99a22';
    x.fillRect(0, bottom - 16, width, 16);
    // The line's display, over the windscreen.
    x.fillStyle = '#14122a';
    roundedRect(x, 22, 30, 150, 30, 5);
    x.fill();
    x.fillStyle = '#ffc83d';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 20;
    do {
      x.font = `bold ${size}px "Courier New", monospace`;
      size -= 1;
    } while (x.measureText(line).width > 136 && size > 9);
    x.fillText(line, 97, 46);
    // Windscreen and side windows.
    x.fillStyle = '#8cc3e6';
    roundedRect(x, 10, 70, 70, 100, 14);
    x.fill();
    for (let pane = 0; pane < 5; pane++) {
      x.fillRect(178 + pane * 92, 70, 78, 80);
    }
    x.fillStyle = 'rgb(255 255 255 / 40%)';
    for (let pane = 0; pane < 5; pane++) {
      x.fillRect(186 + pane * 92, 76, 10, 66);
    }
    // The open door, between the windscreen and the windows.
    x.fillStyle = '#5d6b7a';
    x.fillRect(94, 70, 72, bottom - 74);
    x.fillStyle = '#8cc3e6';
    x.fillRect(102, 78, 24, 80);
    x.fillRect(134, 78, 24, 80);
    // Headlight and a mirror.
    x.fillStyle = '#fff3c4';
    ellipse(x, 18, bottom - 30, 9, 9);
    x.fillStyle = '#2c2a35';
    x.fillRect(-2, 64, 8, 30);
    // Wheels.
    for (const wheelX of [110, width - 120]) {
      x.fillStyle = '#2c2a35';
      ellipse(x, wheelX, bottom + 6, 32, 32);
      x.fillStyle = '#9aa3ae';
      ellipse(x, wheelX, bottom + 6, 14, 14);
    }
  };
}

// Shared by the park's characters: a round body seen from the front, with a pale belly.
function roundBody(
  x: CanvasRenderingContext2D,
  cx: number,
  bottom: number,
  colors: { body: string; belly: string; feet: string },
) {
  x.fillStyle = colors.feet;
  ellipse(x, cx - 38, bottom - 8, 26, 11);
  ellipse(x, cx + 38, bottom - 8, 26, 11);
  x.fillStyle = colors.body;
  ellipse(x, cx, bottom - 104, 90, 100);
  x.save();
  x.beginPath();
  x.ellipse(cx, bottom - 104, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = colors.belly;
  ellipse(x, cx, bottom - 44, 60, 70);
  x.restore();
}

function smilingEyes(x: CanvasRenderingContext2D, cx: number, eyesY: number) {
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 4;
  x.lineCap = 'round';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.arc(cx + side * 26, eyesY + 2, 9, 1.15 * Math.PI, 1.85 * Math.PI);
    x.stroke();
  }
  x.fillStyle = 'rgb(240 110 100 / 45%)';
  ellipse(x, cx - 50, eyesY + 24, 12, 7);
  ellipse(x, cx + 50, eyesY + 24, 12, 7);
}

// Where Papy Caillou's face sits in his drawing, to frame it in a portrait.
export const PAPY_SIZE = { width: 340, height: 330 };
export const PAPY_FACE = { x: 150, y: 196, size: 200 };

// Papy Caillou, the old tortoise of the park: mischievous and kind, a flat cap, a white moustache,
// a buttoned cardigan over his shell, and a cane.
export function drawPapy(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2 - 20;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 36;
  const headTop = bodyY - 100;
  // The shell behind him, with its plates.
  x.fillStyle = '#8a5a35';
  ellipse(x, cx, bottom - 96, 112, 104);
  x.fillStyle = '#b07a45';
  ellipse(x, cx, bottom - 96, 102, 94);
  roundBody(x, cx, bottom, { body: '#8dba7a', belly: '#e6e0b8', feet: '#6e9a5e' });
  // The cardigan, buttoned over his belly.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#5b7fa8';
  x.fillRect(cx - 100, bodyY - 6, 200, 120);
  x.fillStyle = '#e6e0b8';
  x.beginPath();
  x.moveTo(cx - 22, bodyY - 6);
  x.lineTo(cx, bodyY + 44);
  x.lineTo(cx + 22, bodyY - 6);
  x.fill();
  x.fillStyle = '#f3c14b';
  for (let button = 0; button < 3; button++) {
    ellipse(x, cx + 8, bodyY + 48 + button * 18, 4, 4);
  }
  x.restore();
  // Face: smiling eyes, a little nose, and a big white moustache.
  smilingEyes(x, cx, eyesY);
  x.fillStyle = '#4f7a44';
  ellipse(x, cx - 5, eyesY + 10, 2.5, 2.5);
  ellipse(x, cx + 5, eyesY + 10, 2.5, 2.5);
  x.fillStyle = '#f4f1ec';
  x.beginPath();
  x.ellipse(cx - 16, eyesY + 22, 20, 9, -0.3, 0, Math.PI * 2);
  x.fill();
  x.beginPath();
  x.ellipse(cx + 16, eyesY + 22, 20, 9, 0.3, 0, Math.PI * 2);
  x.fill();
  // The flat cap, with its peak.
  x.fillStyle = '#c9b48a';
  x.beginPath();
  x.ellipse(cx - 4, headTop + 22, 66, 30, 0, Math.PI, 0);
  x.fill();
  x.fillStyle = '#a8946a';
  ellipse(x, cx + 40, headTop + 24, 38, 9);
  x.strokeStyle = 'rgb(255 255 255 / 25%)';
  x.lineWidth = 2;
  for (let stripe = -3; stripe <= 3; stripe++) {
    x.beginPath();
    x.moveTo(cx - 4 + stripe * 14, headTop - 4);
    x.lineTo(cx - 4 + stripe * 16, headTop + 20);
    x.stroke();
  }
  // The cane.
  x.strokeStyle = '#7f5530';
  x.lineWidth = 8;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(cx + 96, bottom - 4);
  x.lineTo(cx + 96, bottom - 110);
  x.arc(cx + 82, bottom - 110, 14, 0, Math.PI, true);
  x.stroke();
}

// Where Lucas's face sits in his drawing, to frame it in a portrait.
export const LUCAS_SIZE = { width: 300, height: 330 };
export const LUCAS_FACE = { x: 108, y: 200, size: 160 };

// Lucas, the little otter who keeps dropping his things in the lake: a cap on backwards, and his
// fishing rod held out over the water.
export function drawLucas(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = 110;
  const bottom = height - 6;
  const scale = 0.78;
  x.save();
  x.translate(cx, bottom);
  x.scale(scale, scale);
  x.translate(-cx, -bottom);
  const bodyY = bottom - 104;
  const eyesY = bodyY - 36;
  const headTop = bodyY - 100;
  // Small round ears.
  x.fillStyle = '#7a5236';
  ellipse(x, cx - 56, headTop + 20, 16, 16);
  ellipse(x, cx + 56, headTop + 20, 16, 16);
  roundBody(x, cx, bottom, { body: '#8e6040', belly: '#e9d3b4', feet: '#6e4a30' });
  // A pale muzzle, eyes, nose and whiskers.
  x.fillStyle = '#e9d3b4';
  ellipse(x, cx, eyesY + 20, 40, 26);
  drawEye(x, cx - 26, eyesY, eyes);
  drawEye(x, cx + 26, eyesY, eyes);
  x.fillStyle = '#3a2a20';
  ellipse(x, cx, eyesY + 8, 9, 6);
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 4;
  x.lineCap = 'round';
  x.beginPath();
  x.arc(cx, eyesY + 18, 9, 0.15 * Math.PI, 0.85 * Math.PI);
  x.stroke();
  x.strokeStyle = '#5a3e2a';
  x.lineWidth = 2;
  for (const side of [-1, 1]) {
    for (const tilt of [-1, 1]) {
      x.beginPath();
      x.moveTo(cx + side * 30, eyesY + 20 + tilt * 4);
      x.lineTo(cx + side * 64, eyesY + 16 + tilt * 10);
      x.stroke();
    }
  }
  x.fillStyle = 'rgb(240 110 100 / 45%)';
  ellipse(x, cx - 50, eyesY + 22, 11, 7);
  ellipse(x, cx + 50, eyesY + 22, 11, 7);
  // The cap, on backwards.
  x.fillStyle = '#f3c14b';
  x.beginPath();
  x.ellipse(cx, headTop + 24, 58, 30, 0, Math.PI, 0);
  x.fill();
  ellipse(x, cx - 56, headTop + 24, 30, 8);
  x.fillStyle = '#fbf6ea';
  ellipse(x, cx, headTop - 4, 6, 6);
  x.restore();
  // The rod, held out to the right, with its line and red float.
  x.strokeStyle = '#8a5a35';
  x.lineWidth = 6;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(cx + 40, bottom - 60);
  x.lineTo(width - 20, bottom - 250);
  x.stroke();
  x.strokeStyle = 'rgb(44 42 53 / 60%)';
  x.lineWidth = 1.5;
  x.beginPath();
  x.moveTo(width - 20, bottom - 250);
  x.quadraticCurveTo(width - 4, bottom - 150, width - 14, bottom - 40);
  x.stroke();
  x.fillStyle = '#e8453a';
  ellipse(x, width - 14, bottom - 40, 7, 7);
  x.fillStyle = '#fbf6ea';
  ellipse(x, width - 14, bottom - 45, 7, 3);
  x.fillStyle = '#3a3845';
  ellipse(x, cx + 44, bottom - 66, 8, 6);
}

// A round tree: a trunk and a cloud of leaves in two greens.
export function drawTree(seed: number) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(seed);
    x.fillStyle = '#8a5a35';
    x.fillRect(width / 2 - 14, height * 0.55, 28, height * 0.45);
    for (const [left, top, size] of [
      [0.5, 0.28, 0.32],
      [0.3, 0.42, 0.24],
      [0.7, 0.42, 0.24],
      [0.5, 0.5, 0.28],
    ]) {
      x.fillStyle = random() < 0.5 ? '#579552' : '#6fae5e';
      ellipse(x, width * left, height * top, width * size, width * size);
    }
    x.fillStyle = 'rgb(255 255 255 / 18%)';
    ellipse(x, width * 0.4, height * 0.2, width * 0.09, width * 0.06);
  };
}

// The park's bench, with Papy Caillou's memory cards laid out on it, face down.
export function drawBench(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const seat = height * 0.5;
  x.fillStyle = '#5e8c6a';
  x.fillRect(16, height * 0.12, width - 32, 16);
  x.fillRect(16, height * 0.3, width - 32, 16);
  x.fillStyle = WOOD;
  roundedRect(x, 0, seat, width, 18, 5);
  x.fill();
  x.fillStyle = '#3f6b52';
  for (const legX of [20, width - 36]) {
    x.fillRect(legX, seat + 18, 16, height - seat - 18);
    x.fillRect(legX, height * 0.12, 10, seat - height * 0.12);
  }
  for (let card = 0; card < 4; card++) {
    x.save();
    x.translate(width * 0.22 + card * 34, seat - 2);
    x.rotate((card - 1.5) * 0.08);
    x.fillStyle = '#fbf6ea';
    roundedRect(x, -12, -6, 26, 8, 2);
    x.fill();
    x.fillStyle = '#c8453a';
    x.fillRect(-9, -5, 20, 5);
    x.restore();
  }
}

// Reeds at the edge of the lake.
export function drawReeds(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const random = seededRandom(47);
  for (let reed = 0; reed < 9; reed++) {
    const reedX = 10 + reed * ((width - 20) / 8);
    const reedHeight = height * (0.5 + random() * 0.45);
    x.strokeStyle = reed % 2 === 0 ? '#5b9c4e' : '#78ae6c';
    x.lineWidth = 5;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(reedX, height);
    x.quadraticCurveTo(
      reedX + (random() - 0.5) * 20,
      height - reedHeight / 2,
      reedX + (random() - 0.5) * 14,
      height - reedHeight,
    );
    x.stroke();
    if (reed % 3 === 0) {
      x.fillStyle = '#8a5a35';
      ellipse(x, reedX, height - reedHeight + 14, 6, 16);
    }
  }
}

// The park's ground: a lawn with a sandy path along it.
export function drawParkGround(): HTMLCanvasElement {
  const width = 1600;
  const height = 420;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const random = seededRandom(53);
  x.fillStyle = '#8cc47a';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(60 110 60 / 25%)';
  x.lineWidth = 2;
  for (let blade = 0; blade < 900; blade++) {
    const bladeX = random() * width;
    const bladeY = random() * height;
    x.beginPath();
    x.moveTo(bladeX, bladeY);
    x.lineTo(bladeX + (random() - 0.5) * 6, bladeY - 8);
    x.stroke();
  }
  x.fillStyle = '#e2c99a';
  x.fillRect(0, height * 0.62, width, height * 0.3);
  x.fillStyle = 'rgb(255 255 255 / 25%)';
  for (let pebble = 0; pebble < 160; pebble++) {
    ellipse(x, random() * width, height * 0.64 + random() * height * 0.26, 3, 2);
  }
  addGrain(canvas, 12, 54);
  return canvas;
}

// The lake's water, with soft ripples.
export function drawLake(): HTMLCanvasElement {
  const width = 800;
  const height = 300;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const gradient = x.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#5fa8d6');
  gradient.addColorStop(1, '#8cc3e6');
  x.fillStyle = gradient;
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(255 255 255 / 45%)';
  x.lineWidth = 3;
  const random = seededRandom(59);
  for (let ripple = 0; ripple < 26; ripple++) {
    const rippleX = random() * width;
    const rippleY = random() * height;
    x.beginPath();
    x.ellipse(rippleX, rippleY, 26 + random() * 30, 5, 0, Math.PI * 1.1, Math.PI * 1.9);
    x.stroke();
  }
  addGrain(canvas, 10, 60);
  return canvas;
}
