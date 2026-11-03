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

// Pip, the player's fox, facing right with a scarf and a satchel of cards.
export function drawPip(drawing: CanvasRenderingContext2D, width: number, height: number) {
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

  // Ears, with their pale inside.
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
  x.fillStyle = '#f6c6a0';
  x.beginPath();
  x.moveTo(cx - 50, by - 182);
  x.quadraticCurveTo(cx - 46, by - 224, cx - 36, by - 244);
  x.quadraticCurveTo(cx - 24, by - 222, cx - 16, by - 196);
  x.closePath();
  x.fill();
  x.beginPath();
  x.moveTo(cx + 36, by - 196);
  x.quadraticCurveTo(cx + 48, by - 226, cx + 64, by - 246);
  x.quadraticCurveTo(cx + 70, by - 216, cx + 64, by - 182);
  x.closePath();
  x.fill();

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
  x.fillStyle = '#2c2a35';
  ellipse(x, cx + 16, by - 138, 9.5, 14);
  ellipse(x, cx + 60, by - 138, 9.5, 14);
  x.fillStyle = '#ffffff';
  ellipse(x, cx + 19, by - 143, 3.4, 4.4);
  ellipse(x, cx + 63, by - 143, 3.4, 4.4);
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

// The bedroom's back wall: striped paper over a skirting board.
export function drawWallpaper(): HTMLCanvasElement {
  const width = 1300;
  const height = 440;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#ecdfc8';
  x.fillRect(0, 0, width, height);
  for (let stripe = 0; stripe < width; stripe += 52) {
    x.fillStyle = 'rgb(200 165 116 / 22%)';
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

// The shop, still closed: a striped awning, a window full of boosters, its name on a board, and a
// note hanging on the door. The texts come from the player's language.
export function drawShop(name: string, closed: string) {
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
    // The note on the door, hanging from a string.
    const noteTop = doorTop + 48;
    x.strokeStyle = '#2c2a35';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(doorLeft + doorWidth / 2 - 20, noteTop);
    x.lineTo(doorLeft + doorWidth / 2, doorTop + 24);
    x.lineTo(doorLeft + doorWidth / 2 + 20, noteTop);
    x.stroke();
    x.save();
    x.translate(doorLeft + doorWidth / 2, noteTop + 22);
    x.rotate(-0.06);
    x.fillStyle = '#fbf6ea';
    x.fillRect(-52, -22, 104, 44);
    x.fillStyle = '#c8453a';
    size = 20;
    do {
      x.font = `${size}px "Patrick Hand", sans-serif`;
      size -= 1;
    } while (x.measureText(closed).width > 94 && size > 10);
    x.fillText(closed, 0, 2);
    x.restore();
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
