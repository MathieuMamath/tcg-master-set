// Drawings for the paper world, made on canvases in the browser and used as textures. Everything is
// drawn by code, so that the repository holds no images.

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
// The shadow a diorama's front edge casts on the table it stands on, darkest under the edge.
export function drawEdgeShadow(): HTMLCanvasElement {
  const canvas = createCanvas(4, 128);
  const x = context(canvas);
  const shadow = x.createLinearGradient(0, 0, 0, canvas.height);
  shadow.addColorStop(0, 'rgb(60 40 20 / 45%)');
  shadow.addColorStop(0.35, 'rgb(60 40 20 / 15%)');
  shadow.addColorStop(1, 'rgb(60 40 20 / 0%)');
  x.fillStyle = shadow;
  x.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
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

// The clouds seen through a window, white on nothing: the scene tints them with the sky of the
// moment, and slides them along. Each is drawn again one sky further, so that it wraps.
export function drawWindowClouds(): HTMLCanvasElement {
  const width = 1024;
  const height = 256;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const random = seededRandom(23);
  const count = 5;
  x.fillStyle = '#ffffff';
  for (let cloud = 0; cloud < count; cloud++) {
    const centerX = ((cloud + random() * 0.6) / count) * width;
    const centerY = height * (0.25 + random() * 0.4);
    const size = 30 + random() * 26;
    for (const shift of [0, -width, width]) {
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
// Stars scattered over the upper part of a sky, smaller and fainter towards the horizon.
function drawStars(x: CanvasRenderingContext2D, width: number, height: number, count: number) {
  const random = seededRandom(91);
  for (let star = 0; star < count; star++) {
    const starY = random() * height * 0.7;
    const fade = 1 - starY / (height * 0.85);
    const size = 1.2 + random() * 1.5;
    x.fillStyle = `rgb(255 248 220 / ${Math.round((0.7 + random() * 0.3) * fade * 100)}%)`;
    ellipse(x, random() * width, starY, size, size);
  }
}

// The stars of a whole place's sky, on nothing, for the scene to fade in at night. Wide and tall
// enough for them to stay round once stretched over the place.
export function drawStarField(): HTMLCanvasElement {
  const canvas = createCanvas(2048, 384);
  drawStars(context(canvas), canvas.width, canvas.height, 420);
  return canvas;
}

// A fluffy cloud with a soft grey belly, whole within its drawing: its puffs reach neither the top
// nor the bottom edge, or the paper's outline would cut them flat.
export function drawCloud(color: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    x.fillStyle = color;
    for (const [left, top, radius] of [
      [0.3, 0.56, 0.2],
      [0.5, 0.44, 0.27],
      [0.71, 0.55, 0.2],
      [0.5, 0.62, 0.24],
    ]) {
      ellipse(x, width * left, height * top, width * radius, height * radius * 1.2);
    }
    x.fillStyle = 'rgb(140 180 200 / 25%)';
    ellipse(x, width * 0.5, height * 0.8, width * 0.3, height * 0.07);
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

// A pine: a trunk under three tiers of needles, alternating two greens.
export function drawPine(seed: number) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(seed);
    const dark = random() < 0.5 ? '#3f7d48' : '#4c8a4a';
    x.fillStyle = '#8a5a35';
    x.fillRect(width / 2 - 12, height * 0.7, 24, height * 0.3);
    for (let tier = 0; tier < 3; tier++) {
      const top = height * (0.02 + tier * 0.19);
      const bottom = height * (0.36 + tier * 0.19);
      const halfWidth = width * (0.24 + tier * 0.1);
      x.fillStyle = tier % 2 === 0 ? dark : '#5a9a55';
      x.beginPath();
      x.moveTo(width / 2, top);
      x.lineTo(width / 2 + halfWidth, bottom);
      x.lineTo(width / 2 - halfWidth, bottom);
      x.closePath();
      x.fill();
    }
    x.fillStyle = 'rgb(255 255 255 / 16%)';
    x.beginPath();
    x.moveTo(width / 2, height * 0.04);
    x.lineTo(width / 2 - width * 0.12, height * 0.2);
    x.lineTo(width / 2 - width * 0.04, height * 0.2);
    x.closePath();
    x.fill();
  };
}

const FLOWER_COLORS = ['#e8645a', '#f3c14b', '#f4f0e6', '#9a7bd6'];

// A tuft of grass, with a flower or two standing out of it.
export function drawTuft(seed: number) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(seed);
    for (let blade = 0; blade < 9; blade++) {
      x.fillStyle = blade % 2 === 0 ? '#6fae5e' : '#4f8f4e';
      const baseX = width * 0.15 + random() * width * 0.7;
      const bladeHeight = height * (0.35 + random() * 0.45);
      x.beginPath();
      x.moveTo(baseX - 8, height);
      x.quadraticCurveTo(
        baseX + (random() - 0.5) * 30,
        height - bladeHeight * 0.6,
        baseX + (random() - 0.5) * 24,
        height - bladeHeight,
      );
      x.quadraticCurveTo(baseX + 4, height - bladeHeight * 0.4, baseX + 8, height);
      x.fill();
    }
    const flowers = 1 + Math.floor(random() * 2);
    for (let flower = 0; flower < flowers; flower++) {
      const flowerX = width * (flowers === 1 ? 0.5 : 0.3 + flower * 0.4);
      const flowerY = height * (0.25 + random() * 0.2);
      x.strokeStyle = '#4f8f4e';
      x.lineWidth = 4;
      x.beginPath();
      x.moveTo(flowerX, height);
      x.lineTo(flowerX, flowerY);
      x.stroke();
      x.fillStyle = FLOWER_COLORS[Math.floor(random() * FLOWER_COLORS.length)] ?? '#f3c14b';
      for (let petal = 0; petal < 5; petal++) {
        const angle = (petal / 5) * Math.PI * 2;
        ellipse(x, flowerX + Math.cos(angle) * 10, flowerY + Math.sin(angle) * 10, 8, 8);
      }
      x.fillStyle = '#f7d36a';
      ellipse(x, flowerX, flowerY, 6, 6);
    }
  };
}

// A lamp's warm halo, brightest in the middle and fading out to nothing.
export function drawLampGlow(): HTMLCanvasElement {
  const canvas = createCanvas(256, 256);
  const x = context(canvas);
  const gradient = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgb(255 236 170 / 100%)');
  gradient.addColorStop(0.18, 'rgb(255 214 130 / 75%)');
  gradient.addColorStop(0.5, 'rgb(255 190 100 / 22%)');
  gradient.addColorStop(1, 'rgb(255 180 90 / 0%)');
  x.fillStyle = gradient;
  x.fillRect(0, 0, 256, 256);
  return canvas;
}

export type LampStyle = 'classic' | 'modern';

// Each lamp's drawing, and where its light sits in it, as shares of its width and height.
export const LAMP_DRAWINGS: Record<
  LampStyle,
  { width: number; height: number; lightX: number; lightY: number }
> = {
  classic: { width: 140, height: 440, lightX: 0.5, lightY: 0.14 },
  modern: { width: 220, height: 440, lightX: 0.74, lightY: 0.09 },
};

// A street lamp: a green cast-iron lantern for the village and the park, or a slim grey pole with
// a long arm for the big city. Its glass stays pale: the scene lights it up at night.
export function drawStreetLamp(style: LampStyle) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    if (style === 'classic') {
      const middle = width / 2;
      x.fillStyle = '#2f5a48';
      // The base, the pole, and the ring under the lantern.
      roundedRect(x, middle - 26, height - 46, 52, 46, 8);
      x.fill();
      x.fillRect(middle - 9, height * 0.26, 18, height * 0.66);
      roundedRect(x, middle - 22, height * 0.245, 44, 14, 5);
      x.fill();
      // The lantern: a glass box under a pointed roof, with a knob on top.
      x.fillStyle = '#f3ead0';
      x.beginPath();
      x.moveTo(middle - 30, height * 0.08);
      x.lineTo(middle + 30, height * 0.08);
      x.lineTo(middle + 22, height * 0.24);
      x.lineTo(middle - 22, height * 0.24);
      x.closePath();
      x.fill();
      x.strokeStyle = '#2f5a48';
      x.lineWidth = 6;
      x.stroke();
      x.beginPath();
      x.moveTo(middle, height * 0.08);
      x.lineTo(middle, height * 0.24);
      x.lineWidth = 4;
      x.stroke();
      x.fillStyle = '#2f5a48';
      x.beginPath();
      x.moveTo(middle - 40, height * 0.085);
      x.lineTo(middle, height * 0.02);
      x.lineTo(middle + 40, height * 0.085);
      x.closePath();
      x.fill();
      ellipse(x, middle, height * 0.018, 8, 8);
      return;
    }
    const poleX = width * 0.26;
    x.fillStyle = '#5b6470';
    roundedRect(x, poleX - 20, height - 24, 40, 24, 6);
    x.fill();
    x.fillRect(poleX - 7, height * 0.07, 14, height * 0.9);
    // The arm reaching over the pavement, and the flat head at its end.
    x.strokeStyle = '#5b6470';
    x.lineWidth = 12;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(poleX, height * 0.1);
    x.quadraticCurveTo(poleX + 10, height * 0.05, width * 0.55, height * 0.06);
    x.lineTo(width * 0.66, height * 0.065);
    x.stroke();
    x.fillStyle = '#3e4651';
    roundedRect(x, width * 0.56, height * 0.045, width * 0.36, 22, 10);
    x.fill();
    x.fillStyle = '#eef3f6';
    roundedRect(x, width * 0.6, height * 0.045 + 16, width * 0.28, 8, 4);
    x.fill();
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

export const GASPARD_SIZE = { width: 300, height: 420 };
export const GASPARD_FACE = { x: 150, y: 150, size: 190 };

const GASPARD_FUR = '#c8582e';
const GASPARD_CREAM = '#fbf1e1';
const GASPARD_INK = '#3a2219';

// Gaspard, the slim fox who keeps the dalgona stand: a straw boater, a striped waistcoat and a bow
// tie, the look of a fairground barker. He is sly but never mean: half-shut eyes, one eyebrow up
// and a crooked smile, as if he knew something you don't.
export function drawGaspard(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const bodyY = bottom - 150;
  const headY = bottom - 270;
  const eyesY = headY - 12;
  x.lineCap = 'round';
  x.lineJoin = 'round';

  // His bushy tail, curling up on his left, with its pale tip.
  x.fillStyle = GASPARD_FUR;
  x.beginPath();
  x.moveTo(cx + 30, bottom - 80);
  x.bezierCurveTo(cx + 150, bottom - 90, cx + 150, bottom - 230, cx + 96, bottom - 262);
  x.bezierCurveTo(cx + 110, bottom - 210, cx + 90, bottom - 150, cx + 36, bottom - 132);
  x.closePath();
  x.fill();
  x.fillStyle = GASPARD_CREAM;
  x.beginPath();
  x.moveTo(cx + 96, bottom - 262);
  x.quadraticCurveTo(cx + 132, bottom - 236, cx + 128, bottom - 206);
  x.quadraticCurveTo(cx + 112, bottom - 226, cx + 101, bottom - 230);
  x.closePath();
  x.fill();

  // Long thin legs.
  x.fillStyle = GASPARD_INK;
  for (const side of [-1, 1]) {
    roundedRect(x, cx + side * 22 - 9, bottom - 96, 18, 90, 8);
    x.fill();
    ellipse(x, cx + side * 26, bottom - 8, 22, 9);
  }

  // A slim body, with his pale chest showing between the sides of his waistcoat.
  x.fillStyle = GASPARD_FUR;
  ellipse(x, cx, bodyY, 58, 96);
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 58, 96, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = GASPARD_CREAM;
  ellipse(x, cx, bodyY + 10, 34, 80);
  // The waistcoat, striped, open in a V down the front.
  for (const side of [-1, 1]) {
    x.fillStyle = '#3d6b4f';
    x.beginPath();
    x.moveTo(cx + side * 70, bodyY - 80);
    x.lineTo(cx + side * 10, bodyY - 70);
    x.lineTo(cx + side * 4, bodyY + 30);
    x.lineTo(cx + side * 70, bodyY + 60);
    x.closePath();
    x.fill();
    x.strokeStyle = 'rgb(251 241 225 / 35%)';
    x.lineWidth = 3;
    for (let stripe = 1; stripe < 6; stripe++) {
      x.beginPath();
      x.moveTo(cx + side * (10 + stripe * 11), bodyY - 76);
      x.lineTo(cx + side * (6 + stripe * 12), bodyY + 50);
      x.stroke();
    }
  }
  x.restore();
  x.fillStyle = '#f3c14b';
  for (const buttonY of [bodyY - 30, bodyY - 5, bodyY + 20]) {
    ellipse(x, cx - 14, buttonY, 4, 4);
  }

  // A red bow tie at his neck.
  x.fillStyle = '#d0443a';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx, bodyY - 84);
    x.lineTo(cx + side * 22, bodyY - 96);
    x.lineTo(cx + side * 22, bodyY - 70);
    x.closePath();
    x.fill();
  }
  ellipse(x, cx, bodyY - 83, 6, 6);

  // Tall pointed ears, dark at their tips.
  for (const side of [-1, 1]) {
    x.fillStyle = GASPARD_FUR;
    x.beginPath();
    x.moveTo(cx + side * 16, headY - 30);
    x.lineTo(cx + side * 58, headY - 120);
    x.lineTo(cx + side * 56, headY - 10);
    x.closePath();
    x.fill();
    x.fillStyle = '#f2c3a0';
    x.beginPath();
    x.moveTo(cx + side * 30, headY - 36);
    x.lineTo(cx + side * 56, headY - 96);
    x.lineTo(cx + side * 54, headY - 30);
    x.closePath();
    x.fill();
    x.fillStyle = GASPARD_INK;
    x.beginPath();
    x.moveTo(cx + side * 52, headY - 100);
    x.lineTo(cx + side * 58, headY - 120);
    x.lineTo(cx + side * 61, headY - 98);
    x.closePath();
    x.fill();
  }

  // His head, with fluffy cheeks and a long pale muzzle.
  x.fillStyle = GASPARD_FUR;
  ellipse(x, cx, headY, 66, 54);
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 50, headY - 6);
    x.lineTo(cx + side * 84, headY + 24);
    x.lineTo(cx + side * 40, headY + 34);
    x.closePath();
    x.fill();
  }
  x.fillStyle = GASPARD_CREAM;
  ellipse(x, cx, headY + 26, 40, 24);
  x.fillStyle = GASPARD_INK;
  ellipse(x, cx, headY + 14, 9, 6);

  // Half-shut eyes: their lids hang low, and they shut altogether when he blinks.
  for (const side of [-1, 1]) {
    const eyeX = cx + side * 26;
    if (eyes === 'shut') {
      drawEye(x, eyeX, eyesY, 'shut', { color: GASPARD_INK });
      continue;
    }
    drawEye(x, eyeX, eyesY, 'open', { color: GASPARD_INK, width: 8 });
    x.fillStyle = GASPARD_FUR;
    ellipse(x, eyeX, eyesY - 10, 13, 9);
    x.strokeStyle = GASPARD_INK;
    x.lineWidth = 3;
    x.beginPath();
    x.moveTo(eyeX - 11, eyesY - 3);
    x.quadraticCurveTo(eyeX, eyesY - 6, eyeX + 11, eyesY - 3);
    x.stroke();
  }
  // One eyebrow raised, the other flat.
  x.strokeStyle = GASPARD_INK;
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(cx - 40, eyesY - 26);
  x.quadraticCurveTo(cx - 28, eyesY - 38, cx - 14, eyesY - 30);
  x.stroke();
  x.beginPath();
  x.moveTo(cx + 14, eyesY - 18);
  x.lineTo(cx + 38, eyesY - 20);
  x.stroke();
  // A crooked smile, higher on one side.
  x.lineWidth = 3.5;
  x.beginPath();
  x.moveTo(cx - 16, headY + 30);
  x.quadraticCurveTo(cx + 2, headY + 40, cx + 20, headY + 24);
  x.stroke();
  x.strokeStyle = 'rgb(58 34 25 / 55%)';
  x.lineWidth = 1.5;
  for (const side of [-1, 1]) {
    for (const tilt of [-1, 1]) {
      x.beginPath();
      x.moveTo(cx + side * 34, headY + 22 + tilt * 3);
      x.lineTo(cx + side * 70, headY + 18 + tilt * 9);
      x.stroke();
    }
  }

  // His arms, in the cream sleeves of his shirt, ending in dark paws. One is folded up, its paw
  // under his chin as if weighing you up; the other holds up the carving needle.
  // A sleeve from the shoulder to the elbow, then the forearm to the paw.
  const sleeve = (points: readonly (readonly [number, number])[]) => {
    const [shoulder, elbow, wrist] = points;
    for (const [color, thickness] of [
      ['#d8c3a0', 22],
      [GASPARD_CREAM, 16],
    ] as const) {
      x.strokeStyle = color;
      x.lineWidth = thickness;
      x.beginPath();
      x.moveTo(shoulder[0], shoulder[1]);
      x.lineTo(elbow[0], elbow[1]);
      x.lineTo(wrist[0], wrist[1]);
      x.stroke();
    }
  };
  sleeve([
    [cx + 44, bodyY - 62],
    [cx + 66, bodyY - 8],
    [cx + 32, headY + 54],
  ]);
  x.fillStyle = GASPARD_INK;
  ellipse(x, cx + 26, headY + 47, 16, 13);
  // His paw's fingers, curled under his chin.
  x.strokeStyle = 'rgb(251 241 225 / 35%)';
  x.lineWidth = 1.5;
  for (const finger of [-5, 2, 9]) {
    x.beginPath();
    x.moveTo(cx + 20 + finger, headY + 40);
    x.lineTo(cx + 20 + finger, headY + 46);
    x.stroke();
  }
  // The needle, held up beside him.
  x.strokeStyle = '#9a9aa6';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(cx - 72, bodyY - 58);
  x.lineTo(cx - 88, bodyY - 124);
  x.stroke();
  x.fillStyle = '#d0443a';
  ellipse(x, cx - 89, bodyY - 128, 5, 5);
  sleeve([
    [cx - 44, bodyY - 62],
    [cx - 76, bodyY - 10],
    [cx - 74, bodyY - 50],
  ]);
  x.fillStyle = GASPARD_INK;
  ellipse(x, cx - 73, bodyY - 48, 13, 12);

  // A straw boater with a red band, worn at an angle.
  x.save();
  x.translate(cx - 4, headY - 46);
  x.rotate(-0.14);
  x.fillStyle = '#e8c87a';
  ellipse(x, 0, 0, 62, 12);
  roundedRect(x, -38, -34, 76, 34, 6);
  x.fill();
  x.fillStyle = '#d0443a';
  x.fillRect(-38, -14, 76, 10);
  x.strokeStyle = 'rgb(140 100 40 / 45%)';
  x.lineWidth = 1.5;
  for (let straw = -30; straw <= 30; straw += 10) {
    x.beginPath();
    x.moveTo(straw, -32);
    x.lineTo(straw, -16);
    x.stroke();
  }
  x.restore();
}

// The back of Gaspard's stand, behind him: two poles and a striped awning with a scalloped edge.
export function drawDalgonaAwning(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  x.fillStyle = WOOD_DARK;
  for (const poleX of [18, width - 30]) {
    roundedRect(x, poleX, 60, 12, height - 60, 4);
    x.fill();
  }
  const stripes = 8;
  const stripeWidth = width / stripes;
  for (let stripe = 0; stripe < stripes; stripe++) {
    x.fillStyle = stripe % 2 === 0 ? '#d0443a' : '#fbf1e1';
    x.beginPath();
    x.moveTo(stripe * stripeWidth + 6, 0);
    x.lineTo((stripe + 1) * stripeWidth - 6, 0);
    x.lineTo((stripe + 1) * stripeWidth, 70);
    x.lineTo(stripe * stripeWidth, 70);
    x.closePath();
    x.fill();
    x.beginPath();
    x.arc(stripe * stripeWidth + stripeWidth / 2, 70, stripeWidth / 2, 0, Math.PI);
    x.fill();
  }
  x.fillStyle = 'rgb(0 0 0 / 12%)';
  x.fillRect(0, 62, width, 8);
}

// The front of the stand, before him: a wooden cart on wheels, its name painted on the front, with
// a little burner and its ladle for the caramel, and a tray of biscuits waiting to be carved.
export function drawDalgonaCart(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const top = 46;
    // The burner and its ladle of caramel, on the left.
    x.fillStyle = '#5a5a66';
    roundedRect(x, 26, top - 26, 60, 26, 6);
    x.fill();
    x.fillStyle = '#f08a3a';
    ellipse(x, 56, top - 28, 20, 5);
    x.strokeStyle = '#8a8a96';
    x.lineWidth = 5;
    x.beginPath();
    x.moveTo(56, top - 34);
    x.lineTo(16, top - 30);
    x.stroke();
    x.fillStyle = WOOD_DARK;
    roundedRect(x, 4, top - 36, 18, 12, 6);
    x.fill();
    x.fillStyle = '#8a8a96';
    ellipse(x, 56, top - 34, 18, 7);
    x.fillStyle = '#e0a03a';
    ellipse(x, 56, top - 36, 13, 4);
    // A tray of round caramel biscuits, a shape pressed into each.
    x.fillStyle = WOOD_DARK;
    roundedRect(x, width - 150, top - 12, 128, 12, 3);
    x.fill();
    for (const [index, offset] of [0, 42, 84].entries()) {
      const biscuitX = width - 128 + offset;
      x.fillStyle = '#e0a03a';
      ellipse(x, biscuitX, top - 16, 18, 7);
      x.strokeStyle = '#a8661f';
      x.lineWidth = 2;
      x.beginPath();
      if (index === 0) {
        x.moveTo(biscuitX - 7, top - 13);
        x.lineTo(biscuitX, top - 20);
        x.lineTo(biscuitX + 7, top - 13);
        x.closePath();
      } else {
        x.ellipse(biscuitX, top - 16, 7, 3, 0, 0, Math.PI * 2);
      }
      x.stroke();
    }
    // The cart.
    x.fillStyle = WOOD_DARK;
    roundedRect(x, 0, top, width, 16, 5);
    x.fill();
    x.fillStyle = WOOD;
    x.fillRect(10, top + 16, width - 20, height - top - 46);
    x.fillStyle = '#fbf1e1';
    roundedRect(x, 30, top + 28, width - 60, 50, 8);
    x.fill();
    x.fillStyle = '#d0443a';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 38;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > width - 90 && size > 14);
    x.fillText(name, width / 2, top + 55);
    // Two wheels.
    for (const wheelX of [56, width - 56]) {
      x.fillStyle = WOOD_DARK;
      ellipse(x, wheelX, height - 26, 24, 24);
      x.fillStyle = WOOD_LIGHT;
      ellipse(x, wheelX, height - 26, 8, 8);
    }
  };
}

export const BERENICE_SIZE = { width: 300, height: 330 };
export const BERENICE_FACE = { x: 150, y: 190, size: 200 };

// Bérénice, the jolly goat of the raffle stand: little curved horns, floppy ears, a white beard,
// a bell on a red collar, and a plum bowler hat with a gold ribbon.
export function drawBerenice(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 36;
  const headTop = bodyY - 100;
  x.lineCap = 'round';
  x.lineJoin = 'round';

  // Horns, curving back from the top of her head.
  x.strokeStyle = '#b9a27a';
  x.lineWidth = 14;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 30, headTop + 22);
    x.quadraticCurveTo(cx + side * 40, headTop - 26, cx + side * 70, headTop - 18);
    x.stroke();
  }
  // Floppy ears, out to the sides.
  for (const side of [-1, 1]) {
    x.save();
    x.translate(cx + side * 88, eyesY - 18);
    x.rotate(side * 0.35);
    x.fillStyle = '#e6dccb';
    ellipse(x, 0, 0, 34, 15);
    x.fillStyle = '#f2b8c6';
    ellipse(x, side * 4, 1, 22, 8);
    x.restore();
  }

  roundBody(x, cx, bottom, { body: '#f4efe6', belly: '#fffdf6', feet: '#6b5a48' });

  // The collar and its bell.
  x.strokeStyle = '#d0443a';
  x.lineWidth = 10;
  x.beginPath();
  x.ellipse(cx, bodyY + 8, 74, 26, 0, 0.12 * Math.PI, 0.88 * Math.PI);
  x.stroke();
  x.fillStyle = '#f3c14b';
  ellipse(x, cx, bodyY + 44, 14, 14);
  x.fillStyle = '#c99a2a';
  x.fillRect(cx - 9, bodyY + 32, 18, 5);
  ellipse(x, cx, bodyY + 52, 3, 3);

  // Her muzzle, nostrils and a wide smile, with her white beard below.
  x.fillStyle = '#efd9c6';
  ellipse(x, cx, eyesY + 26, 40, 24);
  x.fillStyle = '#8a6a58';
  ellipse(x, cx - 9, eyesY + 18, 4, 3);
  ellipse(x, cx + 9, eyesY + 18, 4, 3);
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 4;
  x.beginPath();
  x.arc(cx, eyesY + 26, 14, 0.15 * Math.PI, 0.85 * Math.PI);
  x.stroke();
  x.fillStyle = '#ddd3c2';
  x.beginPath();
  x.moveTo(cx - 14, eyesY + 46);
  x.quadraticCurveTo(cx, eyesY + 84, cx + 14, eyesY + 46);
  x.closePath();
  x.fill();
  x.fillStyle = 'rgb(240 110 100 / 45%)';
  ellipse(x, cx - 52, eyesY + 18, 12, 7);
  ellipse(x, cx + 52, eyesY + 18, 12, 7);
  drawEye(x, cx - 28, eyesY - 4, eyes);
  drawEye(x, cx + 28, eyesY - 4, eyes);

  // A plum bowler hat with a gold ribbon, perched between her horns.
  x.save();
  x.translate(cx + 6, headTop + 6);
  x.rotate(0.1);
  x.fillStyle = '#5a3b62';
  ellipse(x, 0, 6, 54, 10);
  x.beginPath();
  x.ellipse(0, 4, 36, 34, 0, Math.PI, 0);
  x.fill();
  x.fillStyle = '#f3c14b';
  x.fillRect(-36, -6, 72, 9);
  x.fillStyle = 'rgb(255 255 255 / 20%)';
  ellipse(x, -14, -16, 9, 5);
  x.restore();
}

// The back of Bérénice's stand, behind her: two striped posts, a board with the raffle's name on
// top, and a string of little flags between them.
export function drawRaffleBooth(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    for (const postX of [16, width - 30]) {
      x.fillStyle = '#fbf1e1';
      roundedRect(x, postX, 40, 14, height - 40, 4);
      x.fill();
      x.fillStyle = '#3a86c8';
      for (let stripe = 60; stripe < height; stripe += 34) {
        x.fillRect(postX, stripe, 14, 14);
      }
    }
    // The board, with the name.
    x.fillStyle = '#3a86c8';
    roundedRect(x, 4, 0, width - 8, 66, 14);
    x.fill();
    x.fillStyle = '#fbf1e1';
    roundedRect(x, 12, 8, width - 24, 50, 10);
    x.fill();
    x.fillStyle = '#d0443a';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 38;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > width - 60 && size > 14);
    x.fillText(name, width / 2, 35);
    // The string of flags, sagging between the posts.
    x.strokeStyle = '#7f5530';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(24, 90);
    x.quadraticCurveTo(width / 2, 140, width - 22, 90);
    x.stroke();
    const colors = ['#d0443a', '#f3c14b', '#3a86c8', '#5b9c4e', '#9a7bd6'];
    for (let flag = 0; flag < 9; flag++) {
      const t = (flag + 0.5) / 9;
      const flagX = 24 + (width - 46) * t;
      const flagY = 90 + 4 * t * (1 - t) * 25;
      x.fillStyle = colors[flag % colors.length];
      x.beginPath();
      x.moveTo(flagX - 11, flagY);
      x.lineTo(flagX + 11, flagY);
      x.lineTo(flagX, flagY + 24);
      x.closePath();
      x.fill();
    }
  };
}

// The front of the stand, before her: a counter with the raffle drum on top, a cage of wire turned
// by a crank, with the balls inside.
export function drawRaffleCounter(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  const top = 110;
  // On the right of the counter, leaving Bérénice's face clear.
  const drumX = width - 112;
  const drumY = 56;
  // The drum's stand.
  x.strokeStyle = WOOD_DARK;
  x.lineWidth = 8;
  x.beginPath();
  x.moveTo(drumX - 64, top);
  x.lineTo(drumX - 36, drumY);
  x.moveTo(drumX + 64, top);
  x.lineTo(drumX + 36, drumY);
  x.stroke();
  // The inside of the drum, the balls in it, then the wire cage over them.
  const drumOutline = () => {
    x.beginPath();
    for (let corner = 0; corner < 6; corner++) {
      const angle = (corner / 6) * Math.PI * 2;
      x.lineTo(drumX + Math.cos(angle) * 62, drumY + Math.sin(angle) * 52);
    }
    x.closePath();
  };
  x.fillStyle = '#cfe3f2';
  drumOutline();
  x.fill();
  for (const [ballX, ballY, color] of [
    [-24, 30, '#fffdf6'],
    [6, 34, '#d0443a'],
    [34, 24, '#fffdf6'],
    [-6, 14, '#f3c14b'],
    [20, 6, '#fffdf6'],
    [-34, 6, '#fffdf6'],
    [10, -14, '#fffdf6'],
  ] as const) {
    x.fillStyle = color;
    ellipse(x, drumX + ballX, drumY + ballY, 10, 10);
  }
  x.strokeStyle = '#b8b6c2';
  x.lineWidth = 3;
  x.beginPath();
  const corners = 6;
  for (let corner = 0; corner <= corners; corner++) {
    const angle = (corner / corners) * Math.PI * 2;
    const pointX = drumX + Math.cos(angle) * 62;
    const pointY = drumY + Math.sin(angle) * 52;
    if (corner === 0) {
      x.moveTo(pointX, pointY);
    } else {
      x.lineTo(pointX, pointY);
    }
  }
  for (let wire = -40; wire <= 40; wire += 16) {
    x.moveTo(drumX + wire, drumY - 50);
    x.lineTo(drumX + wire, drumY + 50);
  }
  x.stroke();
  x.fillStyle = '#f3c14b';
  ellipse(x, drumX, drumY, 7, 7);
  // The crank, on the right.
  x.strokeStyle = WOOD_DARK;
  x.lineWidth = 6;
  x.beginPath();
  x.moveTo(drumX + 62, drumY);
  x.lineTo(drumX + 90, drumY - 26);
  x.stroke();
  x.fillStyle = '#d0443a';
  ellipse(x, drumX + 92, drumY - 28, 8, 8);
  // The counter, with its striped front.
  x.fillStyle = WOOD_DARK;
  roundedRect(x, 0, top, width, 16, 5);
  x.fill();
  x.fillStyle = '#fbf1e1';
  x.fillRect(10, top + 16, width - 20, height - top - 16);
  x.fillStyle = '#3a86c8';
  for (let stripe = 10; stripe < width - 10; stripe += 40) {
    x.fillRect(stripe, top + 16, 20, height - top - 16);
  }
  x.fillStyle = WOOD_DARK;
  x.fillRect(10, height - 12, width - 20, 12);
}

// A balloon on its string, tied below to the stand.
export function drawBalloon(color: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const cx = width / 2;
    const radius = width / 2 - 2;
    x.strokeStyle = 'rgb(44 42 53 / 55%)';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(cx, radius * 2.3);
    x.bezierCurveTo(cx - 10, radius * 2.3 + 40, cx + 10, height - 50, cx, height);
    x.stroke();
    x.fillStyle = color;
    x.beginPath();
    x.ellipse(cx, radius * 1.15, radius, radius * 1.15, 0, 0, Math.PI * 2);
    x.fill();
    x.beginPath();
    x.moveTo(cx - 6, radius * 2.3 + 6);
    x.lineTo(cx + 6, radius * 2.3 + 6);
    x.lineTo(cx, radius * 2.3 - 4);
    x.closePath();
    x.fill();
    x.fillStyle = 'rgb(255 255 255 / 45%)';
    ellipse(x, cx - radius * 0.38, radius * 0.7, radius * 0.18, radius * 0.32);
  };
}

// The big city's towers, each built in a style of its own.
export type TowerLook = 'curtain' | 'fins' | 'setback' | 'ribbon' | 'diagrid' | 'cylinder';

// The entrance at the foot of every tower, two floors high, so that its doors are to the scale of
// the characters walking past. Each style has its own: a glass lobby, a stone base with an arched
// door, an art-deco canopy, a lobby set back behind columns, or a revolving door.
const TOWER_ENTRANCE = 330;
const DOOR_HEIGHT_PX = 270;

type TowerEntrance = {
  frame: string;
  // The band over the lobby, if any, and the sunburst of an art-deco canopy.
  canopy: string | null;
  isSunburst?: boolean;
  // A solid base around the doors instead of a glass lobby.
  base?: string;
  // The lobby set back behind columns.
  hasColumns?: boolean;
  door: 'double' | 'arch' | 'revolving';
};

function towerEntrance(
  x: CanvasRenderingContext2D,
  left: number,
  right: number,
  height: number,
  entrance: TowerEntrance,
) {
  const width = right - left;
  const top = height - TOWER_ENTRANCE;
  const { frame } = entrance;
  // The lobby, or the base.
  if (entrance.base) {
    x.fillStyle = entrance.base;
    x.fillRect(left, top, width, TOWER_ENTRANCE);
    x.fillStyle = 'rgb(255 255 255 / 10%)';
    for (let course = top + 30; course < height; course += 36) {
      x.fillRect(left, course, width, 3);
    }
  } else {
    x.fillStyle = entrance.hasColumns ? '#8fa7b8' : '#cfe3f2';
    x.fillRect(left + 14, top + 24, width - 28, TOWER_ENTRANCE - 24);
    x.strokeStyle = frame;
    x.lineWidth = 5;
    for (let pane = 1; pane < 4; pane++) {
      const paneX = left + 14 + ((width - 28) * pane) / 4;
      x.beginPath();
      x.moveTo(paneX, top + 24);
      x.lineTo(paneX, height);
      x.stroke();
    }
    x.fillStyle = 'rgb(255 255 255 / 30%)';
    x.fillRect(left + 14, top + 24, width - 28, 10);
  }
  // The doors.
  const doorWidth = Math.min(width * 0.44, 190);
  const doorLeft = left + (width - doorWidth) / 2;
  const doorTop = height - DOOR_HEIGHT_PX;
  x.fillStyle = '#e6f2fa';
  x.strokeStyle = frame;
  x.lineWidth = 7;
  if (entrance.door === 'arch') {
    x.beginPath();
    x.moveTo(doorLeft, height);
    x.lineTo(doorLeft, doorTop + doorWidth / 2);
    x.arc(doorLeft + doorWidth / 2, doorTop + doorWidth / 2, doorWidth / 2, Math.PI, 0);
    x.lineTo(doorLeft + doorWidth, height);
    x.closePath();
    x.fill();
    x.stroke();
  } else {
    x.fillRect(doorLeft, doorTop, doorWidth, DOOR_HEIGHT_PX);
    x.strokeRect(doorLeft, doorTop, doorWidth, DOOR_HEIGHT_PX);
  }
  if (entrance.door === 'revolving') {
    // The drum of the door, with its leaves seen edge on.
    x.fillStyle = 'rgb(255 255 255 / 45%)';
    x.fillRect(doorLeft, doorTop, doorWidth, 22);
    x.lineWidth = 5;
    for (const leaf of [0.2, 0.5, 0.8]) {
      x.beginPath();
      x.moveTo(doorLeft + doorWidth * leaf, doorTop + 22);
      x.lineTo(doorLeft + doorWidth * leaf, height);
      x.stroke();
    }
  } else {
    x.beginPath();
    x.moveTo(doorLeft + doorWidth / 2, doorTop);
    x.lineTo(doorLeft + doorWidth / 2, height);
    x.stroke();
    x.fillStyle = frame;
    for (const side of [-1, 1]) {
      x.fillRect(doorLeft + doorWidth / 2 + side * 14 - 3, height - 150, 6, 50);
    }
  }
  // Columns in front of a set-back lobby.
  if (entrance.hasColumns) {
    x.fillStyle = '#e2dfd8';
    for (const column of [0.08, 0.92]) {
      x.fillRect(left + width * column - 12, top + 26, 24, TOWER_ENTRANCE - 26);
    }
  }
  // The canopy.
  if (entrance.canopy) {
    x.fillStyle = entrance.canopy;
    x.fillRect(left, top, width, 26);
    x.fillStyle = 'rgb(0 0 0 / 12%)';
    x.fillRect(left, top + 26, width, 8);
    if (entrance.isSunburst) {
      x.strokeStyle = entrance.canopy;
      x.lineWidth = 4;
      for (let ray = -3; ray <= 3; ray++) {
        x.beginPath();
        x.moveTo(left + width / 2, top + 26);
        x.lineTo(left + width / 2 + ray * 26, top - 34);
        x.stroke();
      }
      x.fillStyle = entrance.canopy;
      ellipse(x, left + width / 2, top + 4, 26, 26);
    }
  }
}

// A sheen of light down a glass face.
function towerSheen(
  x: CanvasRenderingContext2D,
  left: number,
  width: number,
  top: number,
  bottom: number,
) {
  x.fillStyle = 'rgb(255 255 255 / 15%)';
  x.beginPath();
  x.moveTo(left + width * 0.12, top);
  x.lineTo(left + width * 0.3, top);
  x.lineTo(left + width * 0.1, bottom);
  x.lineTo(left, bottom);
  x.closePath();
  x.fill();
}

// Glass from top to bottom between thin mullions, under a slanted roof.
function drawCurtainTower(x: CanvasRenderingContext2D, width: number, height: number) {
  const body = height - TOWER_ENTRANCE;
  x.fillStyle = '#7fb0d6';
  x.beginPath();
  x.moveTo(0, 90);
  x.lineTo(width, 20);
  x.lineTo(width, height);
  x.lineTo(0, height);
  x.closePath();
  x.fill();
  x.save();
  x.clip();
  for (let floorY = 0; floorY < body; floorY += 40) {
    x.fillStyle = floorY % 80 === 0 ? 'rgb(255 255 255 / 10%)' : 'rgb(20 60 100 / 8%)';
    x.fillRect(0, floorY, width, 40);
  }
  x.strokeStyle = '#4f7fa6';
  x.lineWidth = 3;
  for (let mullion = 0; mullion <= width; mullion += 38) {
    x.beginPath();
    x.moveTo(mullion, 0);
    x.lineTo(mullion, body);
    x.stroke();
  }
  towerSheen(x, 0, width, 0, body);
  towerSheen(x, width * 0.55, width * 0.6, 0, body);
  x.restore();
  x.strokeStyle = '#3d6a90';
  x.lineWidth = 8;
  x.beginPath();
  x.moveTo(0, 90);
  x.lineTo(width, 20);
  x.stroke();
  towerEntrance(x, 0, width, height, { frame: '#3d6a90', canopy: null, door: 'double' });
}

// Dark stone with tall pale fins, narrow lit windows between them, and a spire on top.
function drawFinsTower(x: CanvasRenderingContext2D, width: number, height: number) {
  const top = 150;
  const body = height - TOWER_ENTRANCE;
  x.fillStyle = '#4b5668';
  x.beginPath();
  x.moveTo(width / 2 - 4, 0);
  x.lineTo(width / 2 + 4, 0);
  x.lineTo(width / 2 + 30, top - 60);
  x.lineTo(width * 0.8, top);
  x.lineTo(width * 0.2, top);
  x.lineTo(width / 2 - 30, top - 60);
  x.closePath();
  x.fill();
  x.fillRect(0, top, width, height - top);
  const random = seededRandom(Math.round(width));
  for (let fin = 18; fin < width - 10; fin += 40) {
    x.fillStyle = '#7d8aa0';
    x.fillRect(fin, top + 10, 9, body - top - 10);
    for (let windowY = top + 24; windowY < body - 20; windowY += 34) {
      x.fillStyle = random() < 0.22 ? '#f6e7a8' : '#36404f';
      x.fillRect(fin + 15, windowY, 18, 22);
    }
  }
  x.fillStyle = '#d0443a';
  ellipse(x, width / 2, 6, 6, 6);
  towerEntrance(x, 0, width, height, {
    frame: '#c9a24a',
    canopy: null,
    base: '#3a4352',
    door: 'arch',
  });
}

// An art-deco tower narrowing in steps towards a crown, with a flag on top.
function drawSetbackTower(x: CanvasRenderingContext2D, width: number, height: number) {
  const body = height - TOWER_ENTRANCE;
  const tiers = [
    { inset: 0.24, top: 110 },
    { inset: 0.12, top: body * 0.3 },
    { inset: 0, top: body * 0.55 },
  ];
  const random = seededRandom(Math.round(height));
  x.strokeStyle = '#2f6f6b';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(width / 2, 110);
  x.lineTo(width / 2, 20);
  x.stroke();
  x.fillStyle = '#f3c14b';
  x.beginPath();
  x.moveTo(width / 2, 22);
  x.lineTo(width / 2 + 30, 32);
  x.lineTo(width / 2, 44);
  x.fill();
  for (const { inset, top } of tiers) {
    const left = width * inset;
    const right = width - left;
    x.fillStyle = '#4f9a96';
    x.fillRect(left, top, right - left, height - top);
    x.fillStyle = '#3b7a76';
    x.fillRect(left, top, right - left, 16);
  }
  for (const [index, { inset, top }] of tiers.entries()) {
    const left = width * inset + 16;
    const right = width - width * inset - 16;
    const bottom = index < tiers.length - 1 ? tiers[index + 1].top : body;
    for (let windowY = top + 30; windowY < bottom - 20; windowY += 40) {
      for (let windowX = left; windowX < right - 14; windowX += 30) {
        x.fillStyle = random() < 0.18 ? '#e3f6f1' : '#86c4bd';
        x.fillRect(windowX, windowY, 18, 26);
      }
    }
  }
  towerEntrance(x, 0, width, height, {
    frame: '#c9a24a',
    canopy: '#d8b25a',
    isSunburst: true,
    door: 'double',
  });
}

// White concrete floors between long ribbons of dark glass, balconies, and a garden on the roof.
function drawRibbonTower(x: CanvasRenderingContext2D, width: number, height: number) {
  const top = 70;
  const body = height - TOWER_ENTRANCE;
  for (const [bushX, size, color] of [
    [width * 0.2, 26, '#5b9c4e'],
    [width * 0.45, 34, '#78ae6c'],
    [width * 0.72, 28, '#5b9c4e'],
  ] as const) {
    x.fillStyle = color;
    ellipse(x, bushX, top - size * 0.4, size, size * 0.8);
  }
  x.fillStyle = '#ebe9e4';
  x.fillRect(0, top, width, height - top);
  for (let floorY = top + 24; floorY < body - 20; floorY += 54) {
    x.fillStyle = '#5b6f80';
    x.fillRect(10, floorY, width - 20, 28);
    x.fillStyle = 'rgb(255 255 255 / 20%)';
    x.fillRect(10, floorY + 3, width - 20, 5);
    x.strokeStyle = '#a9a69f';
    x.lineWidth = 3;
    x.beginPath();
    x.moveTo(10, floorY + 36);
    x.lineTo(width - 10, floorY + 36);
    x.stroke();
  }
  towerEntrance(x, 0, width, height, {
    frame: '#6f7c86',
    canopy: '#ebe9e4',
    hasColumns: true,
    door: 'double',
  });
}

// Bronze diagonal braces criss-crossing dark glass, and a helipad on the roof.
function drawDiagridTower(x: CanvasRenderingContext2D, width: number, height: number) {
  const top = 60;
  const body = height - TOWER_ENTRANCE;
  x.fillStyle = '#2f3b48';
  x.fillRect(0, top, width, height - top);
  x.save();
  x.beginPath();
  x.rect(0, top, width, body - top);
  x.clip();
  for (let floorY = top; floorY < body; floorY += 30) {
    x.fillStyle = 'rgb(140 180 210 / 12%)';
    x.fillRect(0, floorY, width, 14);
  }
  x.strokeStyle = '#b98a5e';
  x.lineWidth = 7;
  const step = width / 2;
  for (let start = top - width; start < body; start += step) {
    x.beginPath();
    x.moveTo(0, start);
    x.lineTo(width, start + width);
    x.moveTo(width, start);
    x.lineTo(0, start + width);
    x.stroke();
  }
  towerSheen(x, 0, width, top, body);
  x.restore();
  x.fillStyle = '#b98a5e';
  x.fillRect(0, top - 12, width, 14);
  x.fillStyle = '#5a5a66';
  x.fillRect(width * 0.2, top - 22, width * 0.6, 10);
  x.strokeStyle = '#fbf6ea';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(width / 2 - 10, top - 32);
  x.lineTo(width / 2 - 10, top - 18);
  x.moveTo(width / 2 + 10, top - 32);
  x.lineTo(width / 2 + 10, top - 18);
  x.moveTo(width / 2 - 10, top - 25);
  x.lineTo(width / 2 + 10, top - 25);
  x.stroke();
  x.fillStyle = '#d0443a';
  ellipse(x, 10, top - 18, 5, 5);
  ellipse(x, width - 10, top - 18, 5, 5);
  towerEntrance(x, 0, width, height, { frame: '#b98a5e', canopy: '#7a5a3c', door: 'revolving' });
}

// A round tower under a dome, shaded at its edges, with tall strips of windows.
function drawCylinderTower(x: CanvasRenderingContext2D, width: number, height: number) {
  const top = width * 0.45;
  const body = height - TOWER_ENTRANCE;
  const shading = x.createLinearGradient(0, 0, width, 0);
  shading.addColorStop(0, '#8c8fa8');
  shading.addColorStop(0.4, '#c6c8da');
  shading.addColorStop(1, '#7c7f98');
  x.fillStyle = shading;
  x.beginPath();
  x.ellipse(width / 2, top, width / 2, top, 0, Math.PI, 0);
  x.lineTo(width, height);
  x.lineTo(0, height);
  x.closePath();
  x.fill();
  for (let strip = 1; strip < 6; strip++) {
    const stripX = (width * strip) / 6;
    const stripWidth = 12 * Math.sin((Math.PI * strip) / 6);
    x.fillStyle = 'rgb(60 70 100 / 45%)';
    x.fillRect(stripX - stripWidth / 2, top + 20, stripWidth, body - top - 30);
  }
  towerEntrance(x, 0, width, height, { frame: '#5c5f78', canopy: null, door: 'arch' });
}

const TOWER_DRAWINGS: Record<
  TowerLook,
  (drawing: CanvasRenderingContext2D, width: number, height: number) => void
> = {
  curtain: drawCurtainTower,
  fins: drawFinsTower,
  setback: drawSetbackTower,
  ribbon: drawRibbonTower,
  diagrid: drawDiagridTower,
  cylinder: drawCylinderTower,
};

// A modern tower of the big city, in its own style. Seen from afar, it fades into the haze of the
// sky.
export function drawTower(look: TowerLook, isFar = false) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    TOWER_DRAWINGS[look](drawing, width, height);
    if (isFar) {
      drawing.globalCompositeOperation = 'source-atop';
      drawing.fillStyle = 'rgb(214 228 240 / 55%)';
      drawing.fillRect(0, 0, width, height);
      drawing.globalCompositeOperation = 'source-over';
    }
  };
}

// The pavement downtown: wide pale slabs, with a darker kerb along the front.
export function drawPavement(): HTMLCanvasElement {
  const width = 2048;
  const height = 466;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#d8d6d0';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(120 118 110 / 35%)';
  x.lineWidth = 3;
  for (let row = 0; row < height; row += 78) {
    x.beginPath();
    x.moveTo(0, row);
    x.lineTo(width, row);
    x.stroke();
    const offset = (row / 78) % 2 === 0 ? 0 : 64;
    for (let slab = offset; slab < width; slab += 128) {
      x.beginPath();
      x.moveTo(slab, row);
      x.lineTo(slab, row + 78);
      x.stroke();
    }
  }
  x.fillStyle = '#a9a7a0';
  x.fillRect(0, height - 60, width, 60);
  addGrain(canvas, 10, 13);
  return canvas;
}

// Downtown seen from the village, far behind the hills: towers packed tight, of every width and
// height, in two rows, pale with distance, a few windows catching the light. Their colours are
// downtown's own, under the haze.
// The near row, then the far one, paler and narrower.
const SKYLINE_ROWS = [
  { colors: ['#b4c6d8', '#a9c3c2', '#bcc1cb', '#aec1d6'], scale: 1 },
  { colors: ['#cdd8e4', '#d0dbda', '#d6d8de', '#c8d3df'], scale: 0.78 },
];

function skylineTower(
  x: CanvasRenderingContext2D,
  left: number,
  towerWidth: number,
  top: number,
  bottom: number,
  color: string,
  roof: number,
  random: () => number,
) {
  x.fillStyle = color;
  x.beginPath();
  if (roof === 0) {
    // A flat roof with an antenna.
    x.rect(left, top, towerWidth, bottom - top);
    x.rect(left + towerWidth * 0.5 - 2, top - 30, 4, 30);
  } else if (roof === 1) {
    // A slanted top.
    x.moveTo(left, top + 26);
    x.lineTo(left + towerWidth, top);
    x.lineTo(left + towerWidth, bottom);
    x.lineTo(left, bottom);
  } else if (roof === 2) {
    // A stepped top.
    x.rect(left + towerWidth * 0.25, top, towerWidth * 0.5, 24);
    x.rect(left + towerWidth * 0.12, top + 20, towerWidth * 0.76, 24);
    x.rect(left, top + 40, towerWidth, bottom - top - 40);
  } else {
    // A plain flat roof.
    x.rect(left, top, towerWidth, bottom - top);
  }
  x.fill();
  x.fillStyle = 'rgb(255 255 255 / 34%)';
  const columns = Math.max(2, Math.floor(towerWidth / 16));
  for (let windowY = top + 50; windowY < bottom - 6; windowY += 20) {
    for (let column = 0; column < columns; column++) {
      if (random() < 0.32) {
        x.fillRect(left + 6 + (column * (towerWidth - 12)) / columns, windowY, 6, 9);
      }
    }
  }
}

export function drawSkyline(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const random = seededRandom(31);
  // The far row first, then the near one over it.
  for (const [rowIndex, row] of [...SKYLINE_ROWS].reverse().entries()) {
    let left = -20 + random() * 30;
    while (left < width) {
      const towerWidth = (60 + random() * 120) * row.scale;
      const centre = (left + towerWidth / 2) / width;
      // Taller towards the middle of the cluster, and lower at its edges.
      const middle = 1 - Math.abs(centre - 0.5) * 2;
      const rise = 0.25 + middle * 0.55 + random() * 0.2;
      const top = height - height * rise * (rowIndex === 0 ? 0.92 : 1);
      const color = row.colors[Math.floor(random() * row.colors.length)];
      skylineTower(x, left, towerWidth, top, height, color, Math.floor(random() * 4), random);
      // Packed close, sometimes overlapping the last one.
      left += towerWidth * (0.7 + random() * 0.35);
    }
  }
}

// The administrative office's tower: dark glass with gold trim, a gold plaque over its entrance with
// the bureau's name and a little chart, and a red rope on brass posts before its doors.
export function drawBureauTower(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const top = 60;
    const body = height - TOWER_ENTRANCE;
    x.fillStyle = '#26324a';
    x.fillRect(0, top, width, height - top);
    x.fillStyle = '#c9a24a';
    x.fillRect(0, top - 14, width, 16);
    x.fillRect(width / 2 - 3, 0, 6, top - 14);
    ellipse(x, width / 2, 6, 7, 7);
    const random = seededRandom(Math.round(width + height));
    for (let floorY = top + 24; floorY < body - 100; floorY += 40) {
      for (let column = 18; column < width - 30; column += 32) {
        x.fillStyle = random() < 0.25 ? '#f6e7a8' : '#3b4a66';
        x.fillRect(column, floorY, 22, 26);
      }
    }
    x.fillStyle = '#c9a24a';
    for (const side of [10, width - 16]) {
      x.fillRect(side, top, 6, body - top);
    }
    // The plaque, with the bureau's name and a little bar chart.
    const plaqueTop = body - 96;
    x.fillStyle = '#c9a24a';
    roundedRect(x, 20, plaqueTop, width - 40, 82, 10);
    x.fill();
    x.fillStyle = '#26324a';
    roundedRect(x, 28, plaqueTop + 8, width - 56, 66, 7);
    x.fill();
    for (const [index, barHeight] of [18, 30, 24, 40].entries()) {
      x.fillStyle = '#f3c14b';
      x.fillRect(42 + index * 12, plaqueTop + 64 - barHeight, 8, barHeight);
    }
    x.fillStyle = '#fbf1e1';
    x.textAlign = 'left';
    x.textBaseline = 'middle';
    let size = 30;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > width - 130 && size > 12);
    x.fillText(name, 100, plaqueTop + 42);
    towerEntrance(x, 0, width, height, {
      frame: '#c9a24a',
      canopy: '#c9a24a',
      base: '#1f2a3e',
      door: 'double',
    });
    // The red rope on its brass posts.
    x.strokeStyle = '#c8453a';
    x.lineWidth = 6;
    x.beginPath();
    x.moveTo(width * 0.12, height - 70);
    x.quadraticCurveTo(width * 0.22, height - 44, width * 0.3, height - 70);
    x.moveTo(width * 0.7, height - 70);
    x.quadraticCurveTo(width * 0.78, height - 44, width * 0.88, height - 70);
    x.stroke();
    x.fillStyle = '#c9a24a';
    for (const post of [0.12, 0.3, 0.7, 0.88]) {
      x.fillRect(width * post - 4, height - 76, 8, 76);
      ellipse(x, width * post, height - 78, 8, 8);
    }
  };
}

export const BRUTUS_SIZE = { width: 320, height: 330 };
export const BRUTUS_FACE = { x: 160, y: 168, size: 210 };

// Brutus, the bulldog who guards the administrative office: a black suit, a white shirt and a thin tie,
// dark glasses that hide his eyes, an earpiece, and his arms folded. Fearsome, but polite.
export function drawBrutus(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 40;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // Ears, folded over.
  x.fillStyle = '#9a6e48';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.ellipse(cx + side * 70, bodyY - 92, 30, 18, side * 0.6, 0, Math.PI * 2);
    x.fill();
  }
  // Feet in black shoes.
  x.fillStyle = '#1e1e26';
  ellipse(x, cx - 42, bottom - 8, 30, 11);
  ellipse(x, cx + 42, bottom - 8, 30, 11);
  // A broad body, its head sunk into its shoulders.
  x.fillStyle = '#d8b48a';
  ellipse(x, cx, bodyY - 10, 104, 110);
  // The suit, open on a white shirt and a thin black tie.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY - 10, 104, 110, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#23232d';
  x.fillRect(cx - 120, bodyY + 4, 240, 140);
  x.fillStyle = '#fbf6ea';
  x.beginPath();
  x.moveTo(cx - 26, bodyY + 4);
  x.lineTo(cx, bodyY + 70);
  x.lineTo(cx + 26, bodyY + 4);
  x.fill();
  x.fillStyle = '#23232d';
  x.beginPath();
  x.moveTo(cx - 6, bodyY + 10);
  x.lineTo(cx + 6, bodyY + 10);
  x.lineTo(cx + 4, bodyY + 60);
  x.lineTo(cx, bodyY + 68);
  x.lineTo(cx - 4, bodyY + 60);
  x.closePath();
  x.fill();
  x.restore();
  // The arms, folded across his chest, in the suit's sleeves.
  x.fillStyle = '#2e2e3a';
  roundedRect(x, cx - 84, bodyY + 34, 168, 40, 20);
  x.fill();
  x.fillStyle = '#d8b48a';
  ellipse(x, cx - 70, bodyY + 54, 16, 14);
  ellipse(x, cx + 70, bodyY + 54, 16, 14);
  // His face: heavy jowls, a black nose, an underbite with two teeth showing.
  x.fillStyle = '#ead2b2';
  ellipse(x, cx, eyesY + 40, 58, 34);
  x.fillStyle = '#2c2a35';
  ellipse(x, cx, eyesY + 20, 16, 10);
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(cx - 30, eyesY + 52);
  x.quadraticCurveTo(cx, eyesY + 44, cx + 30, eyesY + 52);
  x.stroke();
  x.fillStyle = '#fbf6ea';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 16, eyesY + 49);
    x.lineTo(cx + side * 21, eyesY + 38);
    x.lineTo(cx + side * 25, eyesY + 50);
    x.closePath();
    x.fill();
  }
  // The wrinkles of his brow, frowning.
  x.strokeStyle = 'rgb(120 80 50 / 45%)';
  x.lineWidth = 3;
  for (const line of [0, 9]) {
    x.beginPath();
    x.moveTo(cx - 26, eyesY - 26 - line);
    x.quadraticCurveTo(cx, eyesY - 18 - line, cx + 26, eyesY - 26 - line);
    x.stroke();
  }
  // Dark glasses, a glint on each, and the earpiece's curly wire.
  x.fillStyle = '#16161c';
  for (const side of [-1, 1]) {
    roundedRect(x, cx + side * 32 - 24, eyesY - 12, 48, 26, 8);
    x.fill();
  }
  x.fillRect(cx - 10, eyesY - 6, 20, 5);
  x.fillStyle = 'rgb(255 255 255 / 35%)';
  for (const side of [-1, 1]) {
    x.fillRect(cx + side * 32 - 16, eyesY - 8, 14, 4);
  }
  x.strokeStyle = '#3a3a46';
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(cx + 86, bodyY - 70);
  for (let coil = 0; coil < 5; coil++) {
    x.quadraticCurveTo(cx + 96, bodyY - 60 + coil * 12, cx + 86, bodyY - 54 + coil * 12);
  }
  x.stroke();
  x.fillStyle = '#3a3a46';
  ellipse(x, cx + 84, bodyY - 72, 6, 6);
}

export const HULOTTE_SIZE = { width: 300, height: 330 };
export const HULOTTE_FACE = { x: 150, y: 176, size: 200 };

// Mme Hulotte, the owl who keeps the administrative office: round glasses on big eyes, ear tufts, a
// green cardigan with a pencil in its pocket, and a folder of charts held to her chest.
export function drawHulotte(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 46;
  const headTop = bodyY - 100;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // Ear tufts.
  x.fillStyle = '#7a5838';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 40, headTop + 22);
    x.lineTo(cx + side * 70, headTop - 22);
    x.lineTo(cx + side * 76, headTop + 30);
    x.closePath();
    x.fill();
  }
  roundBody(x, cx, bottom, { body: '#9a7350', belly: '#e8d3b0', feet: '#e0a03a' });
  // Speckles on her chest.
  x.fillStyle = 'rgb(122 88 56 / 35%)';
  for (const [speckX, speckY] of [
    [-20, 30],
    [10, 44],
    [-6, 64],
    [24, 70],
    [-30, 80],
  ]) {
    ellipse(x, cx + speckX, bodyY + speckY, 5, 3);
  }
  // The cardigan, open over her chest.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#5b8a5a';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 100, bodyY - 30);
    x.lineTo(cx + side * 34, bodyY - 20);
    x.lineTo(cx + side * 40, bodyY + 120);
    x.lineTo(cx + side * 100, bodyY + 120);
    x.closePath();
    x.fill();
  }
  x.restore();
  x.strokeStyle = '#f3c14b';
  x.lineWidth = 5;
  x.beginPath();
  x.moveTo(cx + 62, bodyY + 6);
  x.lineTo(cx + 62, bodyY + 34);
  x.stroke();
  // The folder of charts, held to her chest.
  x.save();
  x.translate(cx - 40, bodyY + 40);
  x.rotate(-0.12);
  x.fillStyle = '#e8645a';
  roundedRect(x, -36, -30, 72, 56, 4);
  x.fill();
  x.fillStyle = '#fbf6ea';
  roundedRect(x, -28, -38, 56, 50, 3);
  x.fill();
  for (const [index, barHeight] of [12, 22, 16, 28].entries()) {
    x.fillStyle = '#3a86c8';
    x.fillRect(-20 + index * 11, 4 - barHeight, 7, barHeight);
  }
  x.restore();
  // The pale disc of her face, and her beak.
  x.fillStyle = '#e8d3b0';
  ellipse(x, cx - 30, eyesY + 4, 36, 34);
  ellipse(x, cx + 30, eyesY + 4, 36, 34);
  x.fillStyle = '#e0a03a';
  x.beginPath();
  x.moveTo(cx - 9, eyesY + 22);
  x.lineTo(cx + 9, eyesY + 22);
  x.lineTo(cx, eyesY + 40);
  x.closePath();
  x.fill();
  // Big eyes behind round glasses.
  for (const side of [-1, 1]) {
    const eyeX = cx + side * 30;
    if (eyes === 'shut') {
      drawEye(x, eyeX, eyesY + 8, 'shut');
    } else {
      x.fillStyle = '#fffdf6';
      ellipse(x, eyeX, eyesY + 4, 20, 20);
      x.fillStyle = '#2c2a35';
      ellipse(x, eyeX + side * 2, eyesY + 6, 11, 12);
      x.fillStyle = '#ffffff';
      ellipse(x, eyeX + side * 2 + 4, eyesY + 1, 4, 4);
    }
    x.strokeStyle = '#3a2a20';
    x.lineWidth = 5;
    x.beginPath();
    x.arc(eyeX, eyesY + 4, 25, 0, Math.PI * 2);
    x.stroke();
  }
  x.beginPath();
  x.moveTo(cx - 6, eyesY + 2);
  x.lineTo(cx + 6, eyesY + 2);
  x.stroke();
}

export const TROTTE_SIZE = { width: 320, height: 330 };
export const TROTTE_FACE = { x: 160, y: 150, size: 200 };

// Mlle Trotte, the mouse who keeps the coupon floor: big round ears, round glasses, a long tail,
// a lilac cardigan, and her rubber stamp, ready to make a coupon official.
export function drawTrotte(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2 - 10;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 42;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // Her long tail, curling up behind her.
  x.strokeStyle = '#d9a3b0';
  x.lineWidth = 8;
  x.beginPath();
  x.moveTo(cx + 70, bottom - 30);
  x.bezierCurveTo(cx + 132, bottom - 20, cx + 136, bottom - 116, cx + 108, bottom - 130);
  x.stroke();
  // Big round ears.
  for (const side of [-1, 1]) {
    x.fillStyle = '#aaa3b8';
    ellipse(x, cx + side * 70, bodyY - 92, 46, 46);
    x.fillStyle = '#f2b8c4';
    ellipse(x, cx + side * 70, bodyY - 92, 30, 30);
  }
  roundBody(x, cx, bottom, { body: '#bdb7c9', belly: '#ece8f2', feet: '#f2b8c4' });
  // A lilac cardigan, open over her belly, with a coupon peeking from its pocket.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#9b86c9';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 100, bodyY - 20);
    x.lineTo(cx + side * 36, bodyY - 10);
    x.lineTo(cx + side * 44, bodyY + 120);
    x.lineTo(cx + side * 100, bodyY + 120);
    x.closePath();
    x.fill();
  }
  x.restore();
  x.save();
  x.translate(cx - 62, bodyY + 30);
  x.rotate(-0.25);
  x.fillStyle = '#fbf6ea';
  roundedRect(x, -14, -14, 28, 18, 3);
  x.fill();
  x.fillStyle = '#c8453a';
  x.fillRect(-14, -14, 8, 18);
  x.restore();
  x.fillStyle = '#86719f';
  roundedRect(x, cx - 84, bodyY + 22, 40, 26, 6);
  x.fill();
  // Eyes behind round glasses.
  for (const side of [-1, 1]) {
    drawEye(x, cx + side * 28, eyesY + 4, eyes, { width: 9 });
  }
  x.strokeStyle = '#5a3a22';
  x.lineWidth = 4;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.arc(cx + side * 28, eyesY + 4, 21, 0, Math.PI * 2);
    x.stroke();
  }
  x.beginPath();
  x.moveTo(cx - 7, eyesY + 2);
  x.lineTo(cx + 7, eyesY + 2);
  x.stroke();
  // Pink nose, whiskers and cheeks.
  x.fillStyle = '#e0788a';
  ellipse(x, cx, eyesY + 32, 8, 6);
  x.strokeStyle = '#8a8494';
  x.lineWidth = 2.5;
  for (const side of [-1, 1]) {
    for (const tilt of [-6, 4]) {
      x.beginPath();
      x.moveTo(cx + side * 24, eyesY + 36);
      x.lineTo(cx + side * 64, eyesY + 36 + tilt);
      x.stroke();
    }
  }
  x.fillStyle = 'rgb(240 110 100 / 40%)';
  ellipse(x, cx - 52, eyesY + 42, 12, 7);
  ellipse(x, cx + 52, eyesY + 42, 12, 7);
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 3.5;
  x.beginPath();
  x.moveTo(cx - 8, eyesY + 44);
  x.quadraticCurveTo(cx - 4, eyesY + 49, cx, eyesY + 44);
  x.quadraticCurveTo(cx + 4, eyesY + 49, cx + 8, eyesY + 44);
  x.stroke();
  // Her rubber stamp, held up in her right paw.
  const stampX = cx + 70;
  const stampY = bodyY + 58;
  x.fillStyle = '#7a4f2e';
  roundedRect(x, stampX - 8, stampY - 42, 16, 32, 7);
  x.fill();
  ellipse(x, stampX, stampY - 44, 13, 10);
  x.fillStyle = '#3a3845';
  roundedRect(x, stampX - 22, stampY - 12, 44, 11, 3);
  x.fill();
  x.fillStyle = '#c8453a';
  roundedRect(x, stampX - 20, stampY - 3, 40, 7, 2);
  x.fill();
  x.fillStyle = '#bdb7c9';
  ellipse(x, stampX, stampY - 26, 15, 13);
}

// The office's lift, set in its back wall: brushed steel doors, a floor dial over them and the call
// buttons beside.
export function drawElevator(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  going: 'up' | 'down',
) {
  const x = drawing;
  x.fillStyle = '#9aa0a8';
  x.fillRect(0, 0, width, height);
  const doorTop = height * 0.18;
  const doorWidth = width * 0.68;
  const doorLeft = width * 0.06;
  x.fillStyle = '#c3c8cf';
  x.fillRect(doorLeft, doorTop, doorWidth, height - doorTop);
  x.strokeStyle = 'rgb(255 255 255 / 30%)';
  x.lineWidth = 2;
  for (let line = doorLeft + 10; line < doorLeft + doorWidth; line += 12) {
    x.beginPath();
    x.moveTo(line, doorTop + 6);
    x.lineTo(line, height - 4);
    x.stroke();
  }
  x.fillStyle = '#7d838c';
  x.fillRect(doorLeft + doorWidth / 2 - 2, doorTop, 4, height - doorTop);
  // The floor dial, its needle on the floor it goes to.
  const dialX = doorLeft + doorWidth / 2;
  x.fillStyle = '#e0a51f';
  x.beginPath();
  x.arc(dialX, doorTop - 8, 26, Math.PI, 0);
  x.fill();
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(dialX, doorTop - 8);
  x.lineTo(dialX + (going === 'up' ? 16 : -16), doorTop - 26);
  x.stroke();
  // The call buttons.
  const panelX = doorLeft + doorWidth + width * 0.06;
  x.fillStyle = '#5b6470';
  roundedRect(x, panelX, height * 0.45, width * 0.16, 70, 6);
  x.fill();
  x.fillStyle = going === 'up' ? '#f3c14b' : '#cfd4da';
  ellipse(x, panelX + width * 0.08, height * 0.45 + 20, 9, 9);
  x.fillStyle = going === 'down' ? '#f3c14b' : '#cfd4da';
  ellipse(x, panelX + width * 0.08, height * 0.45 + 50, 9, 9);
  x.fillStyle = '#2c2a35';
  x.beginPath();
  x.moveTo(panelX + width * 0.08 - 5, height * 0.45 + 24);
  x.lineTo(panelX + width * 0.08, height * 0.45 + 15);
  x.lineTo(panelX + width * 0.08 + 5, height * 0.45 + 24);
  x.closePath();
  x.moveTo(panelX + width * 0.08 - 5, height * 0.45 + 46);
  x.lineTo(panelX + width * 0.08, height * 0.45 + 55);
  x.lineTo(panelX + width * 0.08 + 5, height * 0.45 + 46);
  x.closePath();
  x.fill();
}

// A cork board pinned all over with coupons, on the wall of the coupon floor.
export function drawCouponBoard(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.fillStyle = '#8a5a35';
  roundedRect(x, 0, 0, width, height, 10);
  x.fill();
  x.fillStyle = '#c9a272';
  roundedRect(x, 10, 10, width - 20, height - 20, 6);
  x.fill();
  const random = seededRandom(57);
  x.fillStyle = 'rgb(110 75 40 / 25%)';
  for (let speck = 0; speck < 120; speck++) {
    ellipse(x, 14 + random() * (width - 28), 14 + random() * (height - 28), 1.5, 1.5);
  }
  const colors = ['#c8453a', '#3a86c8', '#3f8a6a', '#e0a51f', '#7e63be'];
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 4; column++) {
      const couponX = 30 + column * ((width - 60) / 4) + random() * 10;
      const couponY = 34 + row * ((height - 60) / 3) + random() * 8;
      x.save();
      x.translate(couponX + 30, couponY + 16);
      x.rotate((random() - 0.5) * 0.4);
      x.fillStyle = '#fbf6ea';
      roundedRect(x, -30, -16, 60, 32, 3);
      x.fill();
      x.fillStyle = colors[(row * 4 + column) % colors.length] ?? '#c8453a';
      x.fillRect(-30, -16, 14, 32);
      roundedRect(x, -10, -6, 30, 5, 2);
      x.fill();
      roundedRect(x, -10, 3, 20, 4, 2);
      x.fill();
      x.fillStyle = '#c8453a';
      ellipse(x, 0, -18, 4, 4);
      x.restore();
    }
  }
}

// A tall filing cabinet of coupons, its drawers labelled.
export function drawFilingCabinet(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  x.fillStyle = '#5b7a8c';
  roundedRect(x, 0, 0, width, height, 8);
  x.fill();
  const drawers = 4;
  const drawerHeight = (height - 24) / drawers;
  for (let drawer = 0; drawer < drawers; drawer++) {
    const top = 12 + drawer * drawerHeight;
    x.fillStyle = '#6f90a3';
    roundedRect(x, 12, top + 4, width - 24, drawerHeight - 8, 5);
    x.fill();
    x.fillStyle = '#fbf6ea';
    roundedRect(x, width / 2 - 22, top + 12, 44, 16, 2);
    x.fill();
    x.fillStyle = '#c3c8cf';
    roundedRect(x, width / 2 - 18, top + drawerHeight - 26, 36, 8, 4);
    x.fill();
  }
  // A coupon left sticking out of the top drawer.
  x.save();
  x.translate(width / 2 + 10, 14);
  x.rotate(-0.2);
  x.fillStyle = '#fbf6ea';
  roundedRect(x, -20, -18, 40, 22, 3);
  x.fill();
  x.fillStyle = '#e0a51f';
  x.fillRect(-20, -18, 10, 22);
  x.restore();
}

// The administrative office's walls: white panels with thin seams, over a grey skirting.
export function drawOfficeWall(): HTMLCanvasElement {
  const width = 1300;
  const height = 440;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#f1f2f4';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(140 150 165 / 30%)';
  x.lineWidth = 2;
  for (let seam = 0; seam < width; seam += 130) {
    x.beginPath();
    x.moveTo(seam, 0);
    x.lineTo(seam, height - 24);
    x.stroke();
  }
  x.fillStyle = 'rgb(160 200 230 / 35%)';
  x.fillRect(0, 26, width, 6);
  x.fillStyle = '#8e96a3';
  x.fillRect(0, height - 24, width, 24);
  addGrain(canvas, 8, 32);
  return canvas;
}

// The bureau's floor: large pale tiles, polished, catching the light.
export function drawOfficeFloor(): HTMLCanvasElement {
  const width = 1300;
  const height = 420;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#d9dde3';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(120 130 145 / 30%)';
  x.lineWidth = 2;
  for (let row = 0; row < height; row += 105) {
    x.beginPath();
    x.moveTo(0, row);
    x.lineTo(width, row);
    x.stroke();
  }
  for (let column = 0; column < width; column += 162) {
    x.beginPath();
    x.moveTo(column, 0);
    x.lineTo(column, height);
    x.stroke();
  }
  x.fillStyle = 'rgb(255 255 255 / 22%)';
  for (const sheen of [0.18, 0.55, 0.82]) {
    x.beginPath();
    x.moveTo(width * sheen, 0);
    x.lineTo(width * sheen + 60, 0);
    x.lineTo(width * sheen - 40, height);
    x.lineTo(width * sheen - 100, height);
    x.closePath();
    x.fill();
  }
  addGrain(canvas, 6, 33);
  return canvas;
}

// The city seen from the administrative office's window, in layers over the live sky: its towers,
// their windows lit at night, and the window's frame with a glint on the glass.
export function drawPanoramaCity(drawing: CanvasRenderingContext2D, width: number, height: number) {
  drawing.save();
  drawing.translate(0, height * 0.25);
  drawSkyline(drawing, width, height * 0.75);
  drawing.restore();
}

// Lit windows scattered over the towers, and nowhere else, for the night.
export function drawPanoramaLights(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const towers = createCanvas(width, height);
  drawPanoramaCity(context(towers), width, height);
  const random = seededRandom(131);
  drawing.fillStyle = '#ffd77a';
  for (let light = 0; light < 140; light++) {
    drawing.fillRect(
      Math.round(random() * width),
      Math.round(height * (0.3 + random() * 0.7)),
      5,
      7,
    );
  }
  drawing.globalCompositeOperation = 'destination-in';
  drawing.drawImage(towers, 0, 0);
  drawing.globalCompositeOperation = 'source-over';
}

export function drawPanoramaFrame(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  x.fillStyle = 'rgb(255 255 255 / 18%)';
  x.beginPath();
  x.moveTo(width * 0.1, 0);
  x.lineTo(width * 0.22, 0);
  x.lineTo(width * 0.08, height);
  x.lineTo(width * -0.04, height);
  x.closePath();
  x.fill();
  x.fillStyle = '#6f7887';
  const panes = 4;
  for (let mullion = 0; mullion <= panes; mullion++) {
    x.fillRect((width - 10) * (mullion / panes), 0, 10, height);
  }
  x.fillRect(0, 0, width, 10);
  x.fillRect(0, height - 14, width, 14);
}

// A wall screen of the bureau's dashboards: figures, bars, a rising line and a ring.
export function drawDashboard(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.fillStyle = '#1b1f27';
  roundedRect(x, 0, 0, width, height, 12);
  x.fill();
  const inner = { left: 14, top: 14, width: width - 28, height: height - 28 };
  x.fillStyle = '#16233a';
  x.fillRect(inner.left, inner.top, inner.width, inner.height);
  // Three tiles of figures along the top.
  const tileWidth = (inner.width - 40) / 3;
  for (const [index, color] of ['#7fe0b0', '#f3c14b', '#8cc3e6'].entries()) {
    const left = inner.left + 10 + index * (tileWidth + 10);
    x.fillStyle = '#22314d';
    roundedRect(x, left, inner.top + 10, tileWidth, 44, 6);
    x.fill();
    x.fillStyle = color;
    x.fillRect(left + 10, inner.top + 20, tileWidth * 0.5, 10);
    x.fillStyle = 'rgb(255 255 255 / 35%)';
    x.fillRect(left + 10, inner.top + 36, tileWidth * 0.7, 6);
  }
  const chartTop = inner.top + 66;
  const chartHeight = inner.height - 76;
  // Bars on the left.
  for (const [bar, share] of [0.4, 0.65, 0.5, 0.85, 0.7].entries()) {
    x.fillStyle = '#5aa0d8';
    const barHeight = chartHeight * share;
    x.fillRect(inner.left + 14 + bar * 20, chartTop + chartHeight - barHeight, 13, barHeight);
  }
  // A rising line in the middle.
  x.strokeStyle = '#7fe0b0';
  x.lineWidth = 4;
  x.beginPath();
  const lineLeft = inner.left + inner.width * 0.4;
  const lineWidth = inner.width * 0.32;
  for (const [point, share] of [0.2, 0.35, 0.3, 0.55, 0.5, 0.8].entries()) {
    const pointX = lineLeft + (lineWidth * point) / 5;
    const pointY = chartTop + chartHeight - chartHeight * share;
    if (point === 0) {
      x.moveTo(pointX, pointY);
    } else {
      x.lineTo(pointX, pointY);
    }
  }
  x.stroke();
  // A ring on the right.
  const ringX = inner.left + inner.width * 0.86;
  const ringY = chartTop + chartHeight / 2;
  const radius = Math.min(chartHeight, inner.width * 0.2) * 0.4;
  x.lineWidth = 14;
  for (const [from, to, color] of [
    [0, 0.55, '#f3c14b'],
    [0.55, 0.8, '#e8645a'],
    [0.8, 1, '#9a7bd6'],
  ] as const) {
    x.strokeStyle = color;
    x.beginPath();
    x.arc(ringX, ringY, radius, from * Math.PI * 2 - Math.PI / 2, to * Math.PI * 2 - Math.PI / 2);
    x.stroke();
  }
  // The glow of the screen on its glass.
  x.fillStyle = 'rgb(255 255 255 / 6%)';
  x.fillRect(inner.left, inner.top, inner.width, inner.height / 2);
}

// Mme Hulotte's desk: a slim white top on dark legs, a thin screen on its left, out of the way of
// her face, and a cup and a little plant on its right.
export function drawModernDesk(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const top = height * 0.5;
  // The screen on its stand, on the left.
  x.fillStyle = '#2c2f38';
  x.fillRect(width * 0.17, top - 22, 8, 22);
  x.fillRect(width * 0.12, top - 6, width * 0.14, 6);
  roundedRect(x, 6, top - 100, width * 0.36, 76, 6);
  x.fill();
  x.fillStyle = '#16233a';
  x.fillRect(12, top - 94, width * 0.36 - 12, 64);
  x.strokeStyle = '#7fe0b0';
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(20, top - 42);
  x.lineTo(width * 0.14, top - 62);
  x.lineTo(width * 0.22, top - 52);
  x.lineTo(width * 0.33, top - 84);
  x.stroke();
  drawDeskWithCup(x, width, height);
}

// Mlle Trotte's desk: the same white desk, with a pile of coupons and an ink pad on its left in
// place of a screen.
export function drawCouponDesk(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const top = height * 0.5;
  const random = seededRandom(83);
  for (let sheet = 0; sheet < 9; sheet++) {
    x.save();
    x.translate(width * 0.2 + (random() - 0.5) * 8, top - 6 - sheet * 6);
    x.rotate((random() - 0.5) * 0.12);
    x.fillStyle = sheet % 3 === 1 ? '#fde9a8' : '#fbf6ea';
    roundedRect(x, -38, -4, 76, 7, 2);
    x.fill();
    x.restore();
  }
  x.fillStyle = '#3a3845';
  roundedRect(x, width * 0.38, top - 12, 44, 12, 3);
  x.fill();
  x.fillStyle = '#c8453a';
  roundedRect(x, width * 0.38 + 4, top - 10, 36, 6, 2);
  x.fill();
  drawDeskWithCup(x, width, height);
}

// The white desk itself, with a cup and a little plant on its right.
function drawDeskWithCup(x: CanvasRenderingContext2D, width: number, height: number) {
  const top = height * 0.5;
  x.fillStyle = '#fbf6ea';
  roundedRect(x, width * 0.66, top - 30, 26, 30, 5);
  x.fill();
  x.fillStyle = '#3a86c8';
  x.fillRect(width * 0.66, top - 20, 26, 6);
  x.fillStyle = '#e8e6e1';
  roundedRect(x, width * 0.82, top - 26, 34, 26, 6);
  x.fill();
  x.fillStyle = '#5b9c4e';
  for (const [leafX, leafHeight] of [
    [-8, 34],
    [0, 44],
    [8, 30],
  ] as const) {
    ellipse(x, width * 0.82 + 17 + leafX, top - 26 - leafHeight / 2, 6, leafHeight / 2);
  }
  x.fillStyle = '#f4f4f2';
  roundedRect(x, 0, top, width, 16, 4);
  x.fill();
  x.fillStyle = '#c9ccd2';
  x.fillRect(0, top + 12, width, 4);
  x.fillStyle = '#2c2f38';
  x.fillRect(20, top + 16, 10, height - top - 16);
  x.fillRect(width - 30, top + 16, 10, height - top - 16);
  x.fillStyle = '#e4e6ea';
  roundedRect(x, width * 0.56, top + 16, width * 0.3, (height - top) * 0.55, 4);
  x.fill();
  x.fillStyle = '#9aa3b0';
  x.fillRect(width * 0.66, top + 40, width * 0.1, 5);
}

// A tall, teetering pile of papers on the floor, each sheet a little askew, with coloured folders
// and coupons slipped in here and there, and a fat binder clip on top.
export function drawPaperStack(seed: number) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(seed);
    const sheetHeight = 9;
    const sheets = Math.floor((height - 30) / sheetHeight);
    let drift = 0;
    for (let sheet = 0; sheet < sheets; sheet++) {
      // The pile leans more the higher it goes.
      drift += (random() - 0.45) * 2.2;
      const y = height - 4 - sheet * sheetHeight;
      x.save();
      x.translate(width / 2 + drift, y);
      x.rotate((random() - 0.5) * 0.08);
      const roll = random();
      x.fillStyle =
        roll < 0.08 ? '#e0a51f' : roll < 0.14 ? '#3a86c8' : roll < 0.2 ? '#c8453a' : '#fbf6ea';
      const sheetWidth = width * (0.7 + random() * 0.12);
      roundedRect(x, -sheetWidth / 2, -sheetHeight + 1, sheetWidth, sheetHeight - 1, 2);
      x.fill();
      x.fillStyle = 'rgb(44 42 53 / 10%)';
      x.fillRect(-sheetWidth / 2, -2, sheetWidth, 2);
      // A coupon's coloured end sticking out of the side.
      if (random() < 0.12) {
        x.fillStyle = random() < 0.5 ? '#7e63be' : '#3f8a6a';
        x.fillRect(sheetWidth / 2 - 4, -sheetHeight + 2, 16, sheetHeight - 3);
      }
      x.restore();
    }
    const topY = height - 4 - sheets * sheetHeight;
    x.fillStyle = '#2c2a35';
    roundedRect(x, width / 2 + drift - 12, topY - 4, 24, 12, 3);
    x.fill();
    x.strokeStyle = '#9aa0a8';
    x.lineWidth = 3;
    x.beginPath();
    x.moveTo(width / 2 + drift - 8, topY - 4);
    x.lineTo(width / 2 + drift - 4, topY - 16);
    x.lineTo(width / 2 + drift + 4, topY - 16);
    x.lineTo(width / 2 + drift + 8, topY - 4);
    x.stroke();
  };
}

// Loose sheets fallen on the floor, seen from above: overlapping pages with lines of writing, and
// a coupon or two among them.
export function drawLooseSheets(seed: number) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(seed);
    const count = 3 + Math.floor(random() * 3);
    for (let sheet = 0; sheet < count; sheet++) {
      x.save();
      x.translate(width * (0.2 + random() * 0.6), height * (0.3 + random() * 0.4));
      x.rotate((random() - 0.5) * 1.6);
      const isCoupon = random() < 0.3;
      const sheetWidth = isCoupon ? 70 : 84;
      const sheetHeight = isCoupon ? 38 : 108;
      x.fillStyle = 'rgb(44 42 53 / 12%)';
      roundedRect(x, -sheetWidth / 2 + 3, -sheetHeight / 2 + 4, sheetWidth, sheetHeight, 3);
      x.fill();
      x.fillStyle = '#fbf6ea';
      roundedRect(x, -sheetWidth / 2, -sheetHeight / 2, sheetWidth, sheetHeight, 3);
      x.fill();
      if (isCoupon) {
        x.fillStyle =
          ['#c8453a', '#3a86c8', '#e0a51f', '#7e63be'][Math.floor(random() * 4)] ?? '#c8453a';
        x.fillRect(-sheetWidth / 2, -sheetHeight / 2, 16, sheetHeight);
        roundedRect(x, -14, -8, 36, 5, 2);
        x.fill();
        roundedRect(x, -14, 3, 24, 4, 2);
        x.fill();
      } else {
        x.fillStyle = 'rgb(90 100 120 / 45%)';
        for (let line = 0; line < 7; line++) {
          x.fillRect(
            -sheetWidth / 2 + 10,
            -sheetHeight / 2 + 14 + line * 12,
            sheetWidth * (0.5 + random() * 0.3),
            3,
          );
        }
      }
      x.restore();
    }
  };
}

// A tall snake plant in a white pot, its leaves edged in yellow.
export function drawTallPlant(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const potTop = height * 0.7;
  const leaves = [
    { lean: -0.32, length: 0.62 },
    { lean: -0.12, length: 0.72 },
    { lean: 0.06, length: 0.66 },
    { lean: 0.22, length: 0.56 },
    { lean: 0.38, length: 0.46 },
  ];
  for (const { lean, length } of leaves) {
    x.save();
    x.translate(width / 2, potTop);
    x.rotate(lean);
    x.fillStyle = '#d9c25a';
    x.beginPath();
    x.moveTo(-15, 0);
    x.quadraticCurveTo(-13, -height * length * 0.6, 0, -height * length);
    x.quadraticCurveTo(13, -height * length * 0.6, 15, 0);
    x.fill();
    x.fillStyle = '#3f7d48';
    x.beginPath();
    x.moveTo(-10, 0);
    x.quadraticCurveTo(-9, -height * length * 0.6, 0, -height * length + 10);
    x.quadraticCurveTo(9, -height * length * 0.6, 10, 0);
    x.fill();
    x.restore();
  }
  x.fillStyle = '#f2f2f0';
  x.beginPath();
  x.moveTo(width * 0.18, potTop);
  x.lineTo(width * 0.82, potTop);
  x.lineTo(width * 0.74, height);
  x.lineTo(width * 0.26, height);
  x.closePath();
  x.fill();
  x.fillStyle = '#c9ccd2';
  x.fillRect(width * 0.18, potTop, width * 0.64, 8);
}

// A low modern sofa in charcoal fabric, on thin metal legs, with two bright cushions.
export function drawModernSofa(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const legs = 16;
  const seatTop = height * 0.5;
  // The back and the arms.
  x.fillStyle = '#4a5160';
  roundedRect(x, 0, height * 0.12, width, seatTop - height * 0.12 + 20, 18);
  x.fill();
  x.fillStyle = '#545c6c';
  roundedRect(x, 0, height * 0.3, 40, height - legs - height * 0.3, 14);
  x.fill();
  roundedRect(x, width - 40, height * 0.3, 40, height - legs - height * 0.3, 14);
  x.fill();
  // The seat, in two cushions.
  x.fillStyle = '#5d6577';
  for (const half of [0, 1]) {
    roundedRect(
      x,
      36 + half * ((width - 72) / 2),
      seatTop,
      (width - 72) / 2 - 4,
      height - legs - seatTop,
      12,
    );
    x.fill();
  }
  x.fillStyle = 'rgb(255 255 255 / 10%)';
  x.fillRect(40, seatTop + 6, width - 80, 6);
  // Two bright cushions leaning on the back.
  for (const [cushionX, color, tilt] of [
    [width * 0.24, '#f3c14b', -0.12],
    [width * 0.7, '#3f8a6a', 0.1],
  ] as const) {
    x.save();
    x.translate(cushionX, seatTop - 12);
    x.rotate(tilt);
    x.fillStyle = color;
    roundedRect(x, -34, -30, 68, 56, 14);
    x.fill();
    x.restore();
  }
  // Thin metal legs.
  x.fillStyle = '#2c2f38';
  for (const legX of [24, width - 30]) {
    x.fillRect(legX, height - legs, 6, legs);
  }
}

// --- Ramen Yuzu, downtown. ---------------------------------------------------------------------

const RAMEN_RED = '#c8453a';
const RAMEN_WOOD = '#8a5a34';
const RAMEN_WOOD_DARK = '#5e3a22';
const PANDA_FUR = '#c9592e';
const PANDA_DARK = '#4a2a22';

// A pointed ear with a rounded tip, from its base on the head, its tip, and its other base.
function drawRoundedEar(
  x: CanvasRenderingContext2D,
  [base, tip, otherBase]: { x: number; y: number }[],
  color: string,
) {
  const near = (from: { x: number; y: number }, share: number) => ({
    x: tip.x + (from.x - tip.x) * share,
    y: tip.y + (from.y - tip.y) * share,
  });
  const before = near(base, 0.18);
  const after = near(otherBase, 0.18);
  x.fillStyle = color;
  x.beginPath();
  x.moveTo(base.x, base.y);
  x.lineTo(before.x, before.y);
  x.quadraticCurveTo(tip.x, tip.y, after.x, after.y);
  x.lineTo(otherBase.x, otherBase.y);
  x.closePath();
  x.fill();
}

export const RAMEN_CHEF_SIZE = { width: 330, height: 300 };
export const RAMEN_CHEF_FACE = { x: 151, y: 140, size: 200 };

// Yuzu, the red panda who runs the ramen shop: rust fur with white cheeks and brows, a white
// headband tied at the back, a striped tail, an apron, and her ladle.
export function drawRamenChef(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2 - 14;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 40;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // Her thick tail, ringed, curling up behind her.
  x.save();
  x.translate(cx + 96, bottom - 60);
  x.rotate(-0.5);
  for (let ring = 0; ring < 6; ring++) {
    x.fillStyle = ring % 2 === 0 ? PANDA_FUR : '#7a3a22';
    ellipse(x, 0, -ring * 22, 30 - ring * 1.5, 16);
  }
  x.restore();
  // Rounded pointed ears, rimmed in white. Each one's dark inside is the same shape shrunk towards
  // its middle, so that the rim is even all round, and their bases sink behind the head.
  for (const side of [-1, 1]) {
    // Their bases sit on the top of the head, a little inside its outline.
    const ear = [
      { x: cx + side * 22, y: bodyY - 86 },
      { x: cx + side * 58, y: bodyY - 150 },
      { x: cx + side * 72, y: bodyY - 48 },
    ];
    drawRoundedEar(x, ear, '#f6efe6');
    const middle = {
      x: (ear[0].x + ear[1].x + ear[2].x) / 3,
      y: (ear[0].y + ear[1].y + ear[2].y) / 3,
    };
    drawRoundedEar(
      x,
      ear.map(({ x: pointX, y: pointY }) => ({
        x: middle.x + (pointX - middle.x) * 0.6,
        y: middle.y + (pointY - middle.y) * 0.6 + 4,
      })),
      PANDA_DARK,
    );
  }
  roundBody(x, cx, bottom, { body: PANDA_FUR, belly: PANDA_DARK, feet: PANDA_DARK });
  // Her apron, tied at the neck, with a bowl stitched on its pocket.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#f6efe6';
  roundedRect(x, cx - 54, bodyY + 4, 108, 130, 14);
  x.fill();
  x.fillStyle = RAMEN_RED;
  roundedRect(x, cx - 26, bodyY + 40, 52, 34, 8);
  x.fill();
  x.fillStyle = '#f6efe6';
  x.beginPath();
  x.arc(cx, bodyY + 52, 14, 0, Math.PI);
  x.fill();
  x.restore();
  x.strokeStyle = '#e6dccd';
  x.lineWidth = 6;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 50, bodyY + 8);
    x.lineTo(cx + side * 30, bodyY - 20);
    x.stroke();
  }
  // White cheeks and muzzle, and the dark marks running down from her eyes.
  x.fillStyle = '#f6efe6';
  for (const side of [-1, 1]) {
    ellipse(x, cx + side * 40, eyesY + 30, 30, 22);
    ellipse(x, cx + side * 28, eyesY - 26, 13, 9);
  }
  ellipse(x, cx, eyesY + 36, 26, 18);
  x.fillStyle = '#9b3f22';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 22, eyesY + 8);
    x.quadraticCurveTo(cx + side * 30, eyesY + 34, cx + side * 20, eyesY + 52);
    x.lineTo(cx + side * 12, eyesY + 50);
    x.quadraticCurveTo(cx + side * 18, eyesY + 30, cx + side * 14, eyesY + 10);
    x.closePath();
    x.fill();
  }
  for (const side of [-1, 1]) {
    drawEye(x, cx + side * 28, eyesY + 2, eyes, { width: 10 });
  }
  x.fillStyle = '#2c2a35';
  ellipse(x, cx, eyesY + 30, 9, 7);
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 3.5;
  x.beginPath();
  x.moveTo(cx - 9, eyesY + 42);
  x.quadraticCurveTo(cx - 4, eyesY + 48, cx, eyesY + 42);
  x.quadraticCurveTo(cx + 4, eyesY + 48, cx + 9, eyesY + 42);
  x.stroke();
  x.fillStyle = 'rgb(240 110 100 / 40%)';
  ellipse(x, cx - 56, eyesY + 30, 11, 7);
  ellipse(x, cx + 56, eyesY + 30, 11, 7);
  // Her white headband, its knot and loose ends at the back.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#fbf6ea';
  x.fillRect(cx - 100, eyesY - 52, 200, 20);
  x.fillStyle = RAMEN_RED;
  ellipse(x, cx, eyesY - 42, 9, 9);
  x.restore();
  // The knot's loose ends, tied where the band meets the side of her head.
  const knotX = cx - Math.sqrt(1 - ((eyesY - 42 - bodyY) / 100) ** 2) * 90 + 6;
  x.fillStyle = '#fbf6ea';
  ellipse(x, knotX, eyesY - 42, 9, 11);
  x.beginPath();
  x.moveTo(knotX, eyesY - 46);
  x.lineTo(knotX - 34, eyesY - 66);
  x.lineTo(knotX - 26, eyesY - 40);
  x.closePath();
  x.fill();
  x.beginPath();
  x.moveTo(knotX, eyesY - 38);
  x.lineTo(knotX - 30, eyesY - 18);
  x.lineTo(knotX - 14, eyesY - 14);
  x.closePath();
  x.fill();
  // Her ladle, held up in her right paw.
  const ladleX = cx + 78;
  const ladleY = bodyY + 50;
  x.strokeStyle = '#8b8f99';
  x.lineWidth = 7;
  x.beginPath();
  x.moveTo(ladleX, ladleY);
  x.lineTo(ladleX + 14, ladleY - 92);
  x.stroke();
  x.fillStyle = '#a7abb4';
  x.beginPath();
  x.arc(ladleX + 2, ladleY + 4, 20, 0, Math.PI);
  x.fill();
  x.fillStyle = PANDA_FUR;
  ellipse(x, ladleX + 6, ladleY - 34, 16, 14);
}

// A red paper lantern, ribbed, with black caps and a tassel.
export function drawRedLantern(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  x.fillStyle = '#2c2a35';
  x.fillRect(cx - 2, 0, 4, 14);
  roundedRect(x, cx - 22, 10, 44, 12, 4);
  x.fill();
  x.fillStyle = RAMEN_RED;
  ellipse(x, cx, height / 2, width / 2 - 6, height / 2 - 26);
  x.strokeStyle = 'rgb(90 20 20 / 35%)';
  x.lineWidth = 3;
  for (let rib = 1; rib < 5; rib++) {
    const y = 22 + ((height - 52) * rib) / 5;
    x.beginPath();
    x.ellipse(cx, y, width / 2 - 10, 6, 0, 0, Math.PI);
    x.stroke();
  }
  x.fillStyle = 'rgb(255 230 180 / 35%)';
  ellipse(x, cx - 10, height / 2 - 12, 10, 24);
  x.fillStyle = '#2c2a35';
  roundedRect(x, cx - 22, height - 32, 44, 12, 4);
  x.fill();
  x.strokeStyle = '#e8b33e';
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(cx, height - 20);
  x.lineTo(cx, height - 4);
  x.stroke();
}

// A steaming bowl of ramen: noodles, an egg, greens and a slice of tofu.
function drawRamenBowl(x: CanvasRenderingContext2D, cx: number, top: number, size: number) {
  x.fillStyle = '#fbf6ea';
  x.beginPath();
  x.ellipse(cx, top + size * 0.2, size, size * 0.24, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#e5b765';
  x.beginPath();
  x.ellipse(cx, top + size * 0.2, size * 0.86, size * 0.17, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#fff7d8';
  ellipse(x, cx - size * 0.3, top + size * 0.17, size * 0.18, size * 0.08);
  x.fillStyle = '#f2a541';
  ellipse(x, cx - size * 0.3, top + size * 0.17, size * 0.08, size * 0.05);
  x.fillStyle = '#5fa04e';
  ellipse(x, cx + size * 0.2, top + size * 0.15, size * 0.14, size * 0.05);
  x.fillStyle = RAMEN_RED;
  x.beginPath();
  x.moveTo(cx - size, top + size * 0.2);
  x.quadraticCurveTo(cx, top + size * 1.1, cx + size, top + size * 0.2);
  x.fill();
  x.fillStyle = '#fbf6ea';
  x.fillRect(cx - size * 0.6, top + size * 0.42, size * 1.2, size * 0.08);
}

// The front of Ramen Yuzu: a low wooden house with a tiled roof, its name on a board over the
// door, a split curtain hanging in the doorway, a window onto a steaming bowl, and red lanterns.
export function drawRamenShop(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const roofTop = 70;
    const wallTop = 130;
    const wallLeft = 30;
    const wallRight = width - 30;
    // Wooden walls, in boards.
    x.fillStyle = RAMEN_WOOD;
    x.fillRect(wallLeft, wallTop, wallRight - wallLeft, height - wallTop);
    x.strokeStyle = 'rgb(60 30 15 / 35%)';
    x.lineWidth = 3;
    for (let board = wallLeft + 34; board < wallRight; board += 34) {
      x.beginPath();
      x.moveTo(board, wallTop);
      x.lineTo(board, height);
      x.stroke();
    }
    x.fillStyle = RAMEN_WOOD_DARK;
    x.fillRect(wallLeft, height - 30, wallRight - wallLeft, 30);
    // The tiled roof, overhanging both sides.
    x.fillStyle = '#4f5d70';
    x.beginPath();
    x.moveTo(4, wallTop + 6);
    x.lineTo(40, roofTop);
    x.lineTo(width - 40, roofTop);
    x.lineTo(width - 4, wallTop + 6);
    x.closePath();
    x.fill();
    x.strokeStyle = 'rgb(255 255 255 / 18%)';
    x.lineWidth = 4;
    for (let tile = 30; tile < width - 20; tile += 26) {
      x.beginPath();
      x.moveTo(tile, roofTop + 6);
      x.lineTo(tile - 8, wallTop);
      x.stroke();
    }
    x.fillStyle = '#3a4554';
    x.fillRect(0, wallTop - 2, width, 14);
    // The name board over the door.
    const doorX = width / 2;
    x.fillStyle = '#f6efe6';
    roundedRect(x, doorX - 150, wallTop + 22, 300, 64, 10);
    x.fill();
    x.strokeStyle = RAMEN_WOOD_DARK;
    x.lineWidth = 6;
    x.stroke();
    x.fillStyle = RAMEN_RED;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 40;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > 260 && size > 14);
    x.fillText(name, doorX, wallTop + 56);
    // The doorway, dark inside, and its curtain split in three, a bowl on the middle panel.
    const doorTop = wallTop + 110;
    x.fillStyle = '#2f2622';
    x.fillRect(doorX - 70, doorTop, 140, height - 30 - doorTop);
    x.fillStyle = '#2f4a7a';
    for (const panel of [-1, 0, 1]) {
      roundedRect(x, doorX - 66 + (panel + 1) * 44, doorTop - 6, 40, 120, 4);
      x.fill();
    }
    drawRamenBowl(x, doorX, doorTop + 40, 16);
    // The window, with a bowl steaming behind it.
    const windowX = wallLeft + 40;
    x.fillStyle = '#ffe7b8';
    roundedRect(x, windowX, doorTop + 10, 110, 100, 8);
    x.fill();
    x.strokeStyle = RAMEN_WOOD_DARK;
    x.lineWidth = 8;
    x.stroke();
    x.beginPath();
    x.moveTo(windowX + 55, doorTop + 10);
    x.lineTo(windowX + 55, doorTop + 110);
    x.moveTo(windowX, doorTop + 60);
    x.lineTo(windowX + 110, doorTop + 60);
    x.stroke();
    drawRamenBowl(x, windowX + 55, doorTop + 66, 26);
    x.strokeStyle = 'rgb(255 255 255 / 70%)';
    x.lineWidth = 4;
    for (const wisp of [-12, 0, 12]) {
      x.beginPath();
      x.moveTo(windowX + 55 + wisp, doorTop + 60);
      x.quadraticCurveTo(windowX + 65 + wisp, doorTop + 44, windowX + 55 + wisp, doorTop + 28);
      x.stroke();
    }
    // A menu card pinned beside the door, on the right.
    x.fillStyle = '#f6efe6';
    roundedRect(x, wallRight - 120, doorTop + 14, 80, 96, 6);
    x.fill();
    x.fillStyle = 'rgb(44 42 53 / 45%)';
    for (let line = 0; line < 5; line++) {
      x.fillRect(wallRight - 108, doorTop + 30 + line * 16, line % 2 === 0 ? 56 : 42, 5);
    }
    // Red lanterns hanging from the eaves.
    for (const lanternX of [wallLeft + 14, wallRight - 70]) {
      x.save();
      x.translate(lanternX, wallTop + 6);
      drawRedLantern(x, 56, 88);
      x.restore();
    }
  };
}

// Ramen Yuzu's walls inside: warm plaster over dark wood panels, with beams.
export function drawRamenWall(): HTMLCanvasElement {
  const width = 1300;
  const height = 440;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#efe2c8';
  x.fillRect(0, 0, width, height);
  x.fillStyle = RAMEN_WOOD;
  for (let beam = 0; beam < width; beam += 260) {
    x.fillRect(beam, 0, 18, height);
  }
  x.fillRect(0, 30, width, 16);
  x.fillStyle = RAMEN_WOOD_DARK;
  x.fillRect(0, height - 130, width, 130);
  x.strokeStyle = 'rgb(30 15 5 / 30%)';
  x.lineWidth = 3;
  for (let board = 0; board < width; board += 44) {
    x.beginPath();
    x.moveTo(board, height - 130);
    x.lineTo(board, height);
    x.stroke();
  }
  addGrain(canvas, 8, 191);
  return canvas;
}

// Its floor: worn wooden planks.
export function drawRamenFloor(): HTMLCanvasElement {
  const width = 1300;
  const height = 420;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#b07a48';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(70 40 20 / 35%)';
  x.lineWidth = 3;
  for (let plank = 0; plank < height; plank += 52) {
    x.beginPath();
    x.moveTo(0, plank);
    x.lineTo(width, plank);
    x.stroke();
  }
  addGrain(canvas, 10, 192);
  return canvas;
}

// The counter Yuzu works behind: dark wood, bowls and chopsticks waiting on top, stools before it.
export function drawRamenCounter(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const top = 60;
  x.fillStyle = RAMEN_WOOD_DARK;
  x.fillRect(10, top, width - 20, 26);
  x.fillStyle = RAMEN_WOOD;
  x.fillRect(22, top + 26, width - 44, height - top - 70);
  x.strokeStyle = 'rgb(40 20 10 / 30%)';
  x.lineWidth = 3;
  for (let board = 60; board < width - 30; board += 60) {
    x.beginPath();
    x.moveTo(board, top + 26);
    x.lineTo(board, height - 44);
    x.stroke();
  }
  for (const bowlX of [width * 0.22, width * 0.5, width * 0.78]) {
    drawRamenBowl(x, bowlX, top - 30, 30);
  }
  // Stools before the counter.
  for (const stoolX of [width * 0.2, width * 0.5, width * 0.8]) {
    x.fillStyle = RAMEN_RED;
    roundedRect(x, stoolX - 34, height - 64, 68, 16, 8);
    x.fill();
    x.fillStyle = '#3a3845';
    x.fillRect(stoolX - 4, height - 48, 8, 44);
    x.fillRect(stoolX - 24, height - 8, 48, 6);
  }
}

// The big stockpot on its stove, steaming.
export function drawRamenPot(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  x.fillStyle = '#3a3845';
  x.fillRect(cx - 70, height - 70, 140, 70);
  x.fillStyle = '#e8792b';
  for (const flame of [-30, 0, 30]) {
    ellipse(x, cx + flame, height - 74, 10, 8);
  }
  x.fillStyle = '#9aa0a8';
  roundedRect(x, cx - 62, height - 200, 124, 126, 12);
  x.fill();
  x.fillStyle = '#c0c5cc';
  x.fillRect(cx - 62, height - 200, 124, 16);
  x.fillStyle = '#7d838c';
  for (const side of [-1, 1]) {
    roundedRect(x, cx + side * 62 - (side > 0 ? 0 : 18), height - 170, 18, 12, 4);
    x.fill();
  }
  x.strokeStyle = 'rgb(255 255 255 / 75%)';
  x.lineWidth = 6;
  for (const wisp of [-28, 0, 28]) {
    x.beginPath();
    x.moveTo(cx + wisp, height - 206);
    x.bezierCurveTo(
      cx + wisp + 20,
      height - 236,
      cx + wisp - 20,
      height - 262,
      cx + wisp,
      height - 292,
    );
    x.stroke();
  }
}

// The menu board on the wall: a wooden frame and cards of the day's bowls.
export function drawRamenMenu(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.fillStyle = RAMEN_WOOD_DARK;
  roundedRect(x, 4, 4, width - 8, height - 8, 10);
  x.fill();
  const cards = 4;
  const cardWidth = (width - 40) / cards;
  for (let card = 0; card < cards; card++) {
    const left = 20 + card * cardWidth;
    x.fillStyle = '#f6efe6';
    x.fillRect(left + 4, 22, cardWidth - 8, height - 44);
    drawRamenBowl(x, left + cardWidth / 2, 34, cardWidth * 0.3);
    x.fillStyle = 'rgb(44 42 53 / 45%)';
    x.fillRect(left + 16, height - 70, cardWidth - 32, 6);
    x.fillRect(left + 22, height - 54, cardWidth - 44, 6);
  }
}

// Two small tables by the window, a bowl on each, with stools.
export function drawRamenTables(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  for (const tableX of [width * 0.27, width * 0.73]) {
    x.fillStyle = RAMEN_WOOD;
    roundedRect(x, tableX - 70, height - 120, 140, 18, 6);
    x.fill();
    x.fillStyle = RAMEN_WOOD_DARK;
    x.fillRect(tableX - 6, height - 102, 12, 98);
    x.fillRect(tableX - 40, height - 8, 80, 6);
    drawRamenBowl(x, tableX, height - 150, 24);
    for (const side of [-1, 1]) {
      x.fillStyle = RAMEN_RED;
      roundedRect(x, tableX + side * 92 - 20, height - 70, 40, 12, 6);
      x.fill();
      x.fillStyle = '#3a3845';
      x.fillRect(tableX + side * 92 - 3, height - 58, 6, 54);
    }
  }
}

// One of the four bowls guests order at Ramen Yuzu, seen from above at an angle, each with its
// own broth and toppings so that it reads at a glance, even small on a phone.
export type ServiceDishLook = 'shoyu' | 'miso' | 'curry' | 'veggie';

const DISH_BROTHS: Record<ServiceDishLook, string> = {
  shoyu: '#9b5a2e',
  miso: '#efc189',
  curry: '#d9a321',
  veggie: '#b9d98c',
};

export function drawServiceDish(dish: ServiceDishLook) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const cx = width / 2;
    const rim = height * 0.38;
    const rx = width * 0.44;
    const ry = height * 0.2;
    // The bowl, red outside with a white band.
    x.fillStyle = RAMEN_RED;
    x.beginPath();
    x.moveTo(cx - rx, rim);
    x.quadraticCurveTo(cx - rx, height * 0.96, cx, height * 0.96);
    x.quadraticCurveTo(cx + rx, height * 0.96, cx + rx, rim);
    x.fill();
    x.fillStyle = '#fbf6ea';
    x.fillRect(cx - rx * 0.78, height * 0.66, rx * 1.56, height * 0.07);
    x.fillStyle = '#fbf6ea';
    ellipse(x, cx, rim, rx, ry);
    // The broth.
    x.fillStyle = DISH_BROTHS[dish];
    ellipse(x, cx, rim + 2, rx * 0.86, ry * 0.78);
    // Noodles, in waves.
    x.strokeStyle = '#f5d78a';
    x.lineWidth = Math.max(2, width * 0.025);
    x.lineCap = 'round';
    for (const row of [-0.25, 0, 0.25]) {
      x.beginPath();
      x.moveTo(cx - rx * 0.6, rim + ry * row);
      for (let step = 1; step <= 6; step++) {
        x.quadraticCurveTo(
          cx - rx * 0.6 + rx * 0.2 * step - rx * 0.1,
          rim + ry * row + (step % 2 === 0 ? -4 : 4),
          cx - rx * 0.6 + rx * 0.2 * step,
          rim + ry * row,
        );
      }
      x.stroke();
    }
    // Each bowl's own toppings.
    if (dish === 'shoyu') {
      x.fillStyle = '#fff7d8';
      ellipse(x, cx - rx * 0.32, rim - ry * 0.1, rx * 0.2, ry * 0.36);
      x.fillStyle = '#f2a541';
      ellipse(x, cx - rx * 0.32, rim - ry * 0.1, rx * 0.09, ry * 0.18);
      x.fillStyle = '#2f3b2e';
      x.fillRect(cx + rx * 0.24, rim - ry * 0.95, rx * 0.22, ry * 1.2);
    } else if (dish === 'miso') {
      x.fillStyle = '#f4f0e2';
      for (const [dx, dy] of [
        [-0.3, -0.1],
        [-0.1, 0.25],
      ]) {
        x.fillRect(cx + rx * dx, rim + ry * dy, rx * 0.18, ry * 0.36);
      }
      x.fillStyle = '#f6d23c';
      for (let corn = 0; corn < 7; corn++) {
        ellipse(
          x,
          cx + rx * (0.15 + (corn % 3) * 0.12),
          rim + ry * (-0.3 + Math.floor(corn / 3) * 0.3),
          3,
          3,
        );
      }
    } else if (dish === 'curry') {
      x.fillStyle = '#e8792b';
      for (const [dx, dy] of [
        [-0.35, -0.1],
        [0.05, 0.2],
        [0.35, -0.2],
      ]) {
        ellipse(x, cx + rx * dx, rim + ry * dy, rx * 0.11, ry * 0.2);
      }
    } else {
      x.fillStyle = '#4f9a3e';
      for (const [dx, dy] of [
        [-0.3, -0.15],
        [0.25, 0.1],
      ]) {
        ellipse(x, cx + rx * dx, rim + ry * dy, rx * 0.13, ry * 0.3);
        ellipse(x, cx + rx * (dx + 0.08), rim + ry * (dy - 0.15), rx * 0.1, ry * 0.24);
      }
      x.fillStyle = '#7cc46a';
      ellipse(x, cx, rim + ry * 0.35, rx * 0.16, ry * 0.18);
    }
  };
}

// One table of Ramen Yuzu's dining room, seen from the front: a wooden top with its edge, its
// leg, and a red stool on each side.
export function drawServiceTable(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const top = height * 0.18;
  for (const side of [-1, 1]) {
    const stoolX = width / 2 + side * width * 0.36;
    x.fillStyle = '#3a3845';
    x.fillRect(stoolX - 3, height * 0.55, 6, height * 0.42);
    x.fillStyle = RAMEN_RED;
    roundedRect(x, stoolX - width * 0.11, height * 0.5, width * 0.22, height * 0.1, 6);
    x.fill();
  }
  x.fillStyle = RAMEN_WOOD_DARK;
  x.fillRect(width / 2 - 7, top + 20, 14, height - top - 26);
  x.fillRect(width / 2 - width * 0.18, height - 8, width * 0.36, 6);
  x.fillStyle = RAMEN_WOOD;
  roundedRect(x, 6, top, width - 12, 16, 6);
  x.fill();
  x.fillStyle = RAMEN_WOOD_DARK;
  roundedRect(x, 10, top + 14, width - 20, 10, 4);
  x.fill();
}

// One of the six ingredients of Ramen Yuzu's kitchen, as a little heap seen from the front.
export type KitchenIngredientLook = 'noodles' | 'miso' | 'tofu' | 'egg' | 'onion' | 'mushroom';

export function drawIngredient(ingredient: KitchenIngredientLook) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const cx = width / 2;
    const cy = height / 2;
    const unit = Math.min(width, height);
    x.lineCap = 'round';
    x.lineJoin = 'round';
    if (ingredient === 'noodles') {
      x.strokeStyle = '#e9c35a';
      x.lineWidth = unit * 0.06;
      for (let strand = 0; strand < 6; strand++) {
        x.beginPath();
        const y = cy - unit * 0.2 + strand * unit * 0.08;
        x.moveTo(cx - unit * 0.32, y);
        x.bezierCurveTo(
          cx - unit * 0.1,
          y - unit * 0.12,
          cx + unit * 0.1,
          y + unit * 0.12,
          cx + unit * 0.32,
          y,
        );
        x.stroke();
      }
    } else if (ingredient === 'miso') {
      x.fillStyle = '#b5652a';
      roundedRect(x, cx - unit * 0.3, cy - unit * 0.18, unit * 0.6, unit * 0.42, unit * 0.08);
      x.fill();
      x.fillStyle = '#d98a4a';
      roundedRect(x, cx - unit * 0.3, cy - unit * 0.18, unit * 0.6, unit * 0.12, unit * 0.06);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 30%)';
      ellipse(x, cx - unit * 0.12, cy, unit * 0.06, unit * 0.04);
    } else if (ingredient === 'tofu') {
      for (const [dx, dy] of [
        [-0.17, 0.08],
        [0.17, 0.08],
        [0, -0.14],
      ]) {
        x.fillStyle = '#f4efdf';
        x.fillRect(
          cx + unit * dx - unit * 0.14,
          cy + unit * dy - unit * 0.14,
          unit * 0.28,
          unit * 0.28,
        );
        x.strokeStyle = '#b9ad90';
        x.lineWidth = unit * 0.025;
        x.strokeRect(
          cx + unit * dx - unit * 0.14,
          cy + unit * dy - unit * 0.14,
          unit * 0.28,
          unit * 0.28,
        );
        x.fillStyle = '#ddd5bd';
        x.fillRect(
          cx + unit * dx - unit * 0.14,
          cy + unit * dy + unit * 0.06,
          unit * 0.28,
          unit * 0.08,
        );
      }
    } else if (ingredient === 'egg') {
      x.fillStyle = '#fff7e6';
      ellipse(x, cx, cy, unit * 0.3, unit * 0.36);
      x.strokeStyle = '#d4c49f';
      x.lineWidth = unit * 0.03;
      x.beginPath();
      x.ellipse(cx, cy, unit * 0.3, unit * 0.36, 0, 0, Math.PI * 2);
      x.stroke();
      x.fillStyle = '#f2a541';
      ellipse(x, cx, cy + unit * 0.04, unit * 0.15, unit * 0.17);
      x.fillStyle = 'rgb(255 255 255 / 45%)';
      ellipse(x, cx - unit * 0.05, cy - unit * 0.02, unit * 0.04, unit * 0.05);
    } else if (ingredient === 'onion') {
      x.strokeStyle = '#4f9a3e';
      x.lineWidth = unit * 0.05;
      for (const [dx, dy] of [
        [-0.18, -0.08],
        [0.12, -0.14],
        [-0.04, 0.14],
        [0.2, 0.12],
      ]) {
        x.beginPath();
        x.arc(cx + unit * dx, cy + unit * dy, unit * 0.1, 0, Math.PI * 2);
        x.stroke();
      }
    } else {
      for (const [dx, dy, size] of [
        [-0.16, 0.06, 1],
        [0.16, 0.1, 0.85],
      ]) {
        const capX = cx + unit * dx;
        const capY = cy + unit * dy;
        x.fillStyle = '#efe2c8';
        x.fillRect(capX - unit * 0.05 * size, capY, unit * 0.1 * size, unit * 0.22 * size);
        x.fillStyle = '#8a5a34';
        x.beginPath();
        x.arc(capX, capY, unit * 0.18 * size, Math.PI, 0);
        x.closePath();
        x.fill();
        x.fillStyle = 'rgb(255 255 255 / 25%)';
        ellipse(x, capX - unit * 0.06 * size, capY - unit * 0.08 * size, unit * 0.04, unit * 0.025);
      }
    }
  };
}

// A bowl in the sink, seen from above: white, with its brown stains left to scrub, or gleaming
// once rinsed.
export function drawWashBowl(stains: number, isRinsed: boolean) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.44;
    x.fillStyle = RAMEN_RED;
    ellipse(x, cx, cy, radius, radius);
    x.fillStyle = '#fbf6ea';
    ellipse(x, cx, cy, radius * 0.86, radius * 0.86);
    x.fillStyle = '#efe6d2';
    ellipse(x, cx, cy, radius * 0.6, radius * 0.6);
    const spots = [
      [-0.28, -0.2, 0.26],
      [0.28, 0.12, 0.22],
      [-0.04, 0.34, 0.24],
    ];
    for (const [dx, dy, size] of spots.slice(0, stains)) {
      const spotX = cx + radius * dx;
      const spotY = cy + radius * dy;
      x.fillStyle = 'rgb(130 80 40 / 80%)';
      for (const [ox, oy, scale] of [
        [0, 0, 1],
        [0.5, -0.3, 0.55],
        [-0.45, 0.35, 0.5],
      ]) {
        ellipse(
          x,
          spotX + radius * size * ox,
          spotY + radius * size * oy,
          radius * size * scale,
          radius * size * scale * 0.8,
        );
      }
      x.fillStyle = 'rgb(90 50 25 / 55%)';
      ellipse(x, spotX + radius * 0.04, spotY, radius * size * 0.45, radius * size * 0.35);
    }
    if (isRinsed) {
      x.strokeStyle = 'rgb(255 255 255 / 90%)';
      x.lineWidth = radius * 0.06;
      x.beginPath();
      x.arc(cx, cy, radius * 0.7, 1.15 * Math.PI, 1.55 * Math.PI);
      x.stroke();
      x.fillStyle = 'rgb(160 210 240 / 35%)';
      ellipse(x, cx, cy, radius * 0.6, radius * 0.6);
    }
  };
}

// An empty bowl of broth, waiting for its ingredients on the kitchen's belt.
export function drawBrothBowl(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  const rim = height * 0.38;
  const rx = width * 0.44;
  const ry = height * 0.2;
  x.fillStyle = RAMEN_RED;
  x.beginPath();
  x.moveTo(cx - rx, rim);
  x.quadraticCurveTo(cx - rx, height * 0.96, cx, height * 0.96);
  x.quadraticCurveTo(cx + rx, height * 0.96, cx + rx, rim);
  x.fill();
  x.fillStyle = '#fbf6ea';
  x.fillRect(cx - rx * 0.78, height * 0.66, rx * 1.56, height * 0.07);
  ellipse(x, cx, rim, rx, ry);
  x.fillStyle = '#e8c98f';
  ellipse(x, cx, rim + 2, rx * 0.86, ry * 0.78);
}

// Ramen Yuzu's washing-up corner, behind the bowl: a tiled wall, a wooden worktop, a steel sink
// full of soapy water, and the tap over it. The tap's spout ends at 50% across and 20% down.
export function drawSinkBackdrop(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  // Tiles.
  x.fillStyle = '#e4f0f5';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(120 160 185 / 35%)';
  x.lineWidth = 2;
  const tile = width / 8;
  for (let column = 0; column <= width; column += tile) {
    x.beginPath();
    x.moveTo(column, 0);
    x.lineTo(column, height * 0.55);
    x.stroke();
  }
  for (let row = 0; row <= height * 0.55; row += tile) {
    x.beginPath();
    x.moveTo(0, row);
    x.lineTo(width, row);
    x.stroke();
  }
  // The worktop.
  x.fillStyle = RAMEN_WOOD;
  x.fillRect(0, height * 0.55, width, height * 0.45);
  x.fillStyle = RAMEN_WOOD_DARK;
  x.fillRect(0, height * 0.55, width, height * 0.05);
  // The sink: a steel rim, the water inside, a few ripples.
  const sinkTop = height * 0.5;
  x.fillStyle = '#b8c0c8';
  roundedRect(x, width * 0.08, sinkTop, width * 0.84, height * 0.42, 22);
  x.fill();
  x.fillStyle = '#8e9aa6';
  roundedRect(x, width * 0.12, sinkTop + height * 0.04, width * 0.76, height * 0.34, 18);
  x.fill();
  x.fillStyle = '#9fd0ea';
  roundedRect(x, width * 0.12, sinkTop + height * 0.12, width * 0.76, height * 0.26, 16);
  x.fill();
  x.strokeStyle = 'rgb(255 255 255 / 55%)';
  x.lineWidth = 3;
  for (const [dx, dy, size] of [
    [0.25, 0.2, 0.08],
    [0.72, 0.26, 0.06],
    [0.6, 0.16, 0.05],
  ]) {
    x.beginPath();
    x.ellipse(width * dx, sinkTop + height * dy, width * size, height * 0.02, 0, 0, Math.PI * 2);
    x.stroke();
  }
  // The tap, from the back of the worktop, its spout over the middle of the sink.
  x.strokeStyle = '#8a929b';
  x.lineWidth = width * 0.045;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(width * 0.82, height * 0.52);
  x.lineTo(width * 0.82, height * 0.12);
  x.quadraticCurveTo(width * 0.82, height * 0.04, width * 0.7, height * 0.04);
  x.lineTo(width * 0.56, height * 0.04);
  x.quadraticCurveTo(width * 0.5, height * 0.04, width * 0.5, height * 0.12);
  x.lineTo(width * 0.5, height * 0.18);
  x.stroke();
  x.fillStyle = '#c8453a';
  ellipse(x, width * 0.86, height * 0.2, width * 0.035, width * 0.025);
  x.fillStyle = '#5f6b78';
  ellipse(x, width * 0.5, height * 0.2, width * 0.03, height * 0.015);
}

// The yellow sponge with its green scouring side, for scrubbing.
export function drawSponge(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.fillStyle = '#4f9a3e';
  roundedRect(x, width * 0.08, height * 0.12, width * 0.84, height * 0.32, 10);
  x.fill();
  x.fillStyle = '#f6d23c';
  roundedRect(x, width * 0.08, height * 0.36, width * 0.84, height * 0.52, 12);
  x.fill();
  x.fillStyle = 'rgb(200 150 30 / 45%)';
  for (const [dx, dy] of [
    [0.3, 0.55],
    [0.55, 0.7],
    [0.72, 0.5],
    [0.42, 0.78],
  ]) {
    ellipse(x, width * dx, height * dy, width * 0.05, height * 0.05);
  }
}

// --- The dojo, downtown. -----------------------------------------------------------------------

const DOJO_WOOD = '#6b4a2e';
const DOJO_WOOD_DARK = '#3f2a1c';
const DOJO_PLASTER = '#f1e8d6';
const BADGER_GREY = '#8a8a90';
const BADGER_DARK = '#2f2d33';
const BADGER_WHITE = '#f4f1ea';
const GI_WHITE = '#fbf8f1';

export const DOJO_MASTER_SIZE = { width: 320, height: 300 };
export const DOJO_MASTER_FACE = { x: 146, y: 130, size: 200 };

// Maître Kaito, the old badger who keeps the dojo: grey fur, the white stripe down his face
// between two dark bands, small rounded ears, bushy white brows and a little beard, a white gi
// with a worn black belt, and a wooden sword resting on his shoulder.
export function drawDojoMaster(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2 - 14;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 36;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // His wooden sword, its handle in his paw and its blade leaning up past his shoulder.
  x.save();
  x.translate(cx + 80, bodyY + 52);
  x.rotate(0.3);
  x.fillStyle = '#c99a5b';
  roundedRect(x, -8, -190, 16, 190, 7);
  x.fill();
  x.fillStyle = '#3a2a20';
  roundedRect(x, -9, -26, 18, 34, 5);
  x.fill();
  x.fillStyle = '#2c2a35';
  roundedRect(x, -16, -32, 32, 8, 3);
  x.fill();
  x.restore();
  // Small rounded ears, dark with a white rim, their bases sunk behind the head.
  for (const side of [-1, 1]) {
    const earX = cx + side * 60;
    const earY = bodyY - 82;
    x.fillStyle = BADGER_WHITE;
    ellipse(x, earX, earY, 22, 19);
    x.fillStyle = BADGER_DARK;
    ellipse(x, earX, earY + 2, 14, 12);
  }
  roundBody(x, cx, bottom, { body: BADGER_GREY, belly: '#a9a9ae', feet: BADGER_DARK });
  // The face: dark bands from the nose up over the eyes, the white stripe between them, and white
  // cheeks outside, all clipped to the head.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = BADGER_WHITE;
  for (const side of [-1, 1]) {
    ellipse(x, cx + side * 56, eyesY + 24, 26, 22);
  }
  x.fillStyle = BADGER_DARK;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 10, eyesY + 30);
    x.quadraticCurveTo(cx + side * 40, eyesY + 14, cx + side * 46, eyesY - 30);
    x.lineTo(cx + side * 40, bodyY - 110);
    x.lineTo(cx + side * 14, bodyY - 110);
    x.quadraticCurveTo(cx + side * 16, eyesY - 10, cx + side * 6, eyesY + 22);
    x.closePath();
    x.fill();
  }
  x.fillStyle = BADGER_WHITE;
  x.beginPath();
  x.moveTo(cx - 13, bodyY - 110);
  x.lineTo(cx + 13, bodyY - 110);
  x.quadraticCurveTo(cx + 14, eyesY, cx + 12, eyesY + 26);
  x.lineTo(cx - 12, eyesY + 26);
  x.quadraticCurveTo(cx - 14, eyesY, cx - 13, bodyY - 110);
  x.fill();
  ellipse(x, cx, eyesY + 36, 30, 20);
  x.restore();
  // His gi: white, crossed left over right, with wide sleeves, and the black belt knotted in front.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = GI_WHITE;
  x.fillRect(cx - 100, bodyY + 4, 200, 120);
  x.fillStyle = '#a9a9ae';
  x.beginPath();
  x.moveTo(cx - 24, bodyY + 4);
  x.lineTo(cx, bodyY + 40);
  x.lineTo(cx + 24, bodyY + 4);
  x.closePath();
  x.fill();
  x.strokeStyle = '#d8d1c2';
  x.lineWidth = 7;
  x.beginPath();
  x.moveTo(cx - 30, bodyY + 4);
  x.lineTo(cx + 6, bodyY + 48);
  x.moveTo(cx + 30, bodyY + 4);
  x.lineTo(cx + 2, bodyY + 38);
  x.stroke();
  x.strokeStyle = 'rgb(44 42 53 / 18%)';
  x.lineWidth = 3;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 62, bodyY + 20);
    x.quadraticCurveTo(cx + side * 70, bodyY + 60, cx + side * 60, bodyY + 92);
    x.stroke();
  }
  x.fillStyle = '#2c2a35';
  x.fillRect(cx - 100, bodyY + 58, 200, 16);
  x.restore();
  // The belt's knot and its two frayed tails.
  x.fillStyle = '#2c2a35';
  roundedRect(x, cx - 12, bodyY + 54, 24, 24, 6);
  x.fill();
  x.beginPath();
  x.moveTo(cx - 6, bodyY + 74);
  x.lineTo(cx - 20, bodyY + 112);
  x.lineTo(cx - 6, bodyY + 114);
  x.lineTo(cx + 2, bodyY + 76);
  x.closePath();
  x.fill();
  x.beginPath();
  x.moveTo(cx + 4, bodyY + 74);
  x.lineTo(cx + 22, bodyY + 108);
  x.lineTo(cx + 34, bodyY + 104);
  x.lineTo(cx + 10, bodyY + 72);
  x.closePath();
  x.fill();
  x.strokeStyle = '#6d6a72';
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(cx - 17, bodyY + 108);
  x.lineTo(cx - 10, bodyY + 110);
  x.moveTo(cx + 25, bodyY + 104);
  x.lineTo(cx + 31, bodyY + 101);
  x.stroke();
  // Eyes in the dark bands, bushy white brows over them, the nose and a calm smile.
  for (const side of [-1, 1]) {
    x.fillStyle = '#d9d4ca';
    ellipse(x, cx + side * 28, eyesY + 4, 15, 19);
    drawEye(x, cx + side * 28, eyesY + 4, eyes, { width: 9 });
  }
  x.fillStyle = '#ffffff';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 16, eyesY - 18);
    x.quadraticCurveTo(cx + side * 30, eyesY - 28, cx + side * 46, eyesY - 22);
    x.quadraticCurveTo(cx + side * 34, eyesY - 16, cx + side * 16, eyesY - 18);
    x.fill();
  }
  x.fillStyle = '#2c2a35';
  ellipse(x, cx, eyesY + 28, 10, 7);
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 3.5;
  x.beginPath();
  x.moveTo(cx - 10, eyesY + 41);
  x.quadraticCurveTo(cx - 5, eyesY + 46, cx, eyesY + 40);
  x.quadraticCurveTo(cx + 5, eyesY + 46, cx + 10, eyesY + 41);
  x.stroke();
  // A little white beard under the chin, pointed.
  x.fillStyle = '#ffffff';
  x.strokeStyle = '#c9c4ba';
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(cx - 16, eyesY + 50);
  x.quadraticCurveTo(cx, eyesY + 84, cx + 4, eyesY + 76);
  x.quadraticCurveTo(cx + 10, eyesY + 66, cx + 16, eyesY + 50);
  x.quadraticCurveTo(cx, eyesY + 56, cx - 16, eyesY + 50);
  x.fill();
  x.stroke();
  // His paw on the sword's handle.
  x.fillStyle = BADGER_GREY;
  ellipse(x, cx + 76, bodyY + 40, 17, 15);
}

// The front of the dojo: white plaster between dark timbers, a sweeping tiled roof with upturned
// ends, its name on a board over the sliding doors, paper windows, and white paper lanterns.
export function drawDojo(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const roofTop = 40;
    const wallTop = 140;
    const wallLeft = 36;
    const wallRight = width - 36;
    // A stone base, then the plaster walls framed in timber.
    x.fillStyle = '#8f8a82';
    x.fillRect(wallLeft - 10, height - 34, wallRight - wallLeft + 20, 34);
    x.fillStyle = DOJO_PLASTER;
    x.fillRect(wallLeft, wallTop, wallRight - wallLeft, height - 34 - wallTop);
    x.fillStyle = DOJO_WOOD_DARK;
    for (const post of [wallLeft, wallLeft + 120, wallRight - 132, wallRight - 12]) {
      x.fillRect(post, wallTop, 12, height - 34 - wallTop);
    }
    x.fillRect(wallLeft, wallTop + 96, wallRight - wallLeft, 10);
    // The roof: a curved sweep, its ends turned up, in dark tiles with a ridge.
    x.fillStyle = '#3d4654';
    x.beginPath();
    x.moveTo(0, wallTop - 10);
    x.quadraticCurveTo(26, wallTop + 4, 60, roofTop + 40);
    x.lineTo(width - 60, roofTop + 40);
    x.quadraticCurveTo(width - 26, wallTop + 4, width, wallTop - 10);
    x.lineTo(width - 10, wallTop + 8);
    x.lineTo(10, wallTop + 8);
    x.closePath();
    x.fill();
    x.beginPath();
    x.moveTo(60, roofTop + 40);
    x.quadraticCurveTo(width / 2, roofTop + 10, width - 60, roofTop + 40);
    x.fill();
    x.fillStyle = '#2a313c';
    roundedRect(x, 50, roofTop + 28, width - 100, 14, 7);
    x.fill();
    x.strokeStyle = 'rgb(255 255 255 / 16%)';
    x.lineWidth = 4;
    for (let tile = 40; tile < width - 30; tile += 24) {
      x.beginPath();
      x.moveTo(tile + 6, roofTop + 48);
      x.lineTo(tile, wallTop);
      x.stroke();
    }
    // The name board, dark with light letters.
    const doorX = width / 2;
    x.fillStyle = DOJO_WOOD_DARK;
    roundedRect(x, doorX - 140, wallTop + 18, 280, 62, 6);
    x.fill();
    x.strokeStyle = '#c99a5b';
    x.lineWidth = 4;
    x.stroke();
    x.fillStyle = '#f6efe6';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 40;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > 240 && size > 14);
    x.fillText(name, doorX, wallTop + 50);
    // Sliding doors of paper in a wooden grid, one of them pulled half open.
    const doorTop = wallTop + 110;
    const doorBottom = height - 34;
    x.fillStyle = '#2f2622';
    x.fillRect(doorX - 90, doorTop, 180, doorBottom - doorTop);
    const shoji = (left: number, top: number, panelWidth: number, panelHeight: number) => {
      x.fillStyle = '#fbf3df';
      x.fillRect(left, top, panelWidth, panelHeight);
      x.strokeStyle = DOJO_WOOD;
      x.lineWidth = 5;
      x.strokeRect(left, top, panelWidth, panelHeight);
      x.lineWidth = 2.5;
      for (let column = 1; column < 3; column++) {
        const lineX = left + (panelWidth * column) / 3;
        x.beginPath();
        x.moveTo(lineX, top);
        x.lineTo(lineX, top + panelHeight);
        x.stroke();
      }
      for (let row = 1; row < 4; row++) {
        const lineY = top + (panelHeight * row) / 4;
        x.beginPath();
        x.moveTo(left, lineY);
        x.lineTo(left + panelWidth, lineY);
        x.stroke();
      }
    };
    shoji(doorX - 90, doorTop, 90, doorBottom - doorTop);
    shoji(doorX + 24, doorTop, 66, doorBottom - doorTop);
    // A paper window on each side.
    for (const windowX of [wallLeft + 28, wallRight - 104]) {
      shoji(windowX, doorTop + 10, 76, 90);
    }
    // White paper lanterns hanging from the eaves.
    for (const lanternX of [wallLeft + 50, wallRight - 96]) {
      x.save();
      x.translate(lanternX, wallTop + 8);
      drawPaperLantern(x, 46, 74);
      x.restore();
    }
  };
}

// A white paper lantern, ribbed, with dark caps.
export function drawPaperLantern(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  x.fillStyle = '#2c2a35';
  x.fillRect(cx - 2, 0, 4, 12);
  roundedRect(x, cx - 16, 8, 32, 10, 3);
  x.fill();
  x.fillStyle = '#fbf3df';
  ellipse(x, cx, height / 2, width / 2 - 4, height / 2 - 20);
  x.strokeStyle = 'rgb(120 90 60 / 35%)';
  x.lineWidth = 2.5;
  for (let rib = 1; rib < 5; rib++) {
    const y = 18 + ((height - 40) * rib) / 5;
    x.beginPath();
    x.ellipse(cx, y, width / 2 - 7, 5, 0, 0, Math.PI);
    x.stroke();
  }
  x.fillStyle = '#c8453a';
  ellipse(x, cx, height / 2, 7, 7);
  x.fillStyle = '#2c2a35';
  roundedRect(x, cx - 16, height - 24, 32, 10, 3);
  x.fill();
}

// The dojo's walls inside: paper screens in a wooden grid under a plain plaster band, with posts.
export function drawDojoWall(): HTMLCanvasElement {
  const width = 1300;
  const height = 440;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = DOJO_PLASTER;
  x.fillRect(0, 0, width, height);
  // The paper screens, from the band down to the skirting.
  const screensTop = 120;
  const screensBottom = height - 40;
  x.fillStyle = '#fbf3df';
  x.fillRect(0, screensTop, width, screensBottom - screensTop);
  x.strokeStyle = DOJO_WOOD;
  x.lineWidth = 3;
  for (let column = 0; column < width; column += 54) {
    x.beginPath();
    x.moveTo(column, screensTop);
    x.lineTo(column, screensBottom);
    x.stroke();
  }
  for (let row = screensTop; row < screensBottom; row += 66) {
    x.beginPath();
    x.moveTo(0, row);
    x.lineTo(width, row);
    x.stroke();
  }
  x.fillStyle = DOJO_WOOD_DARK;
  for (let post = 0; post < width; post += 324) {
    x.fillRect(post, 0, 20, height);
  }
  x.fillRect(0, screensTop - 14, width, 14);
  x.fillRect(0, screensBottom, width, height - screensBottom);
  x.fillRect(0, 0, width, 18);
  addGrain(canvas, 8, 211);
  return canvas;
}

// Its floor: tatami mats, edged in dark cloth.
export function drawDojoFloor(): HTMLCanvasElement {
  const width = 1300;
  const height = 420;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#cdbf86';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(120 105 60 / 25%)';
  x.lineWidth = 2;
  for (let weave = 0; weave < height; weave += 9) {
    x.beginPath();
    x.moveTo(0, weave);
    x.lineTo(width, weave);
    x.stroke();
  }
  x.fillStyle = '#3f4a3a';
  for (let row = 0; row < height; row += 140) {
    x.fillRect(0, row, width, 8);
  }
  for (let column = 0; column < width; column += 260) {
    for (let row = 0; row < height; row += 140) {
      const offset = (row / 140) % 2 === 0 ? 0 : 130;
      x.fillRect(column + offset, row, 8, 140);
    }
  }
  addGrain(canvas, 10, 212);
  return canvas;
}

// A hanging scroll with a brushed circle, for the dojo's wall.
export function drawDojoScroll(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  x.fillStyle = '#5a6b7a';
  x.fillRect(10, 14, width - 20, height - 28);
  x.fillStyle = '#f6efe0';
  x.fillRect(22, 30, width - 44, height - 66);
  x.fillStyle = DOJO_WOOD_DARK;
  roundedRect(x, 2, 6, width - 4, 12, 6);
  x.fill();
  roundedRect(x, 2, height - 18, width - 4, 12, 6);
  x.fill();
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 10;
  x.beginPath();
  x.arc(cx, height * 0.42, width * 0.26, 0.6, Math.PI * 2 - 0.2);
  x.stroke();
  x.fillStyle = '#c8453a';
  x.fillRect(cx + width * 0.1, height - 70, 16, 16);
}

// A rack of wooden swords and a bow, against the wall.
export function drawDojoRack(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.fillStyle = DOJO_WOOD_DARK;
  for (const legX of [16, width - 28]) {
    x.fillRect(legX, 20, 12, height - 20);
  }
  x.fillRect(8, 40, width - 16, 12);
  x.fillRect(8, height - 70, width - 16, 12);
  // The swords, leaning in the rack.
  for (let sword = 0; sword < 4; sword++) {
    const swordX = 50 + sword * ((width - 140) / 3);
    x.save();
    x.translate(swordX, height - 10);
    x.rotate(-0.08);
    x.fillStyle = '#c99a5b';
    roundedRect(x, -6, -height + 30, 12, height - 40, 6);
    x.fill();
    x.fillStyle = '#3a2a20';
    roundedRect(x, -7, -40, 14, 34, 4);
    x.fill();
    x.restore();
  }
  // The bow, standing at the end.
  x.strokeStyle = '#7a3a22';
  x.lineWidth = 8;
  x.beginPath();
  x.moveTo(width - 44, 6);
  x.quadraticCurveTo(width - 4, height / 2, width - 44, height - 6);
  x.stroke();
  x.strokeStyle = '#e8e2d4';
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(width - 44, 6);
  x.lineTo(width - 44, height - 6);
  x.stroke();
}

// A straw archery target on its stand: rings of paper from white to the red bullseye.
export const TARGET_RINGS = ['#fbf6ea', '#2c2a35', '#3c78b4', '#e8b33e', '#c8453a'] as const;

export function drawArcheryTarget(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  const cx = width / 2;
  const radius = Math.min(width, height) / 2 - 6;
  const cy = radius + 6;
  // The stand, when there is room under the target.
  if (height > width) {
    x.fillStyle = DOJO_WOOD_DARK;
    x.save();
    x.translate(cx, cy);
    for (const side of [-1, 1]) {
      x.save();
      x.rotate(side * 0.28);
      x.fillRect(-6, 0, 12, height - cy);
      x.restore();
    }
    x.restore();
  }
  x.fillStyle = '#d8b56a';
  ellipse(x, cx, cy, radius, radius);
  // In the proportions of the game's rings, from 0.85 out to 0.1 at the bullseye.
  const radii = [1, 0.6 / 0.85, 0.4 / 0.85, 0.24 / 0.85, 0.1 / 0.85];
  radii.forEach((share, index) => {
    x.fillStyle = TARGET_RINGS[index];
    ellipse(x, cx, cy, radius * share * 0.92, radius * share * 0.92);
  });
  x.strokeStyle = 'rgb(44 42 53 / 25%)';
  x.lineWidth = 2;
  for (const share of radii) {
    x.beginPath();
    x.arc(cx, cy, radius * share * 0.92, 0, Math.PI * 2);
    x.stroke();
  }
}

// The vegetables of the slicing game, and the clay pot not to cut.
export type ThrownLook = 'carrot' | 'radish' | 'pepper' | 'eggplant' | 'cabbage' | 'pot';

export function drawThrown(kind: ThrownLook) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const cx = width / 2;
    const cy = height / 2;
    const unit = Math.min(width, height);
    x.lineCap = 'round';
    x.lineJoin = 'round';
    if (kind === 'carrot') {
      x.fillStyle = '#e8792b';
      x.beginPath();
      x.moveTo(cx - unit * 0.14, cy - unit * 0.2);
      x.quadraticCurveTo(cx, cy - unit * 0.28, cx + unit * 0.14, cy - unit * 0.2);
      x.lineTo(cx + unit * 0.02, cy + unit * 0.36);
      x.quadraticCurveTo(cx, cy + unit * 0.4, cx - unit * 0.02, cy + unit * 0.36);
      x.closePath();
      x.fill();
      x.strokeStyle = 'rgb(140 60 20 / 45%)';
      x.lineWidth = unit * 0.02;
      for (const line of [-0.08, 0.04, 0.16]) {
        x.beginPath();
        x.moveTo(cx - unit * 0.08, cy + unit * line);
        x.lineTo(cx + unit * 0.02, cy + unit * (line + 0.02));
        x.stroke();
      }
      x.fillStyle = '#5fa04e';
      for (const leaf of [-0.1, 0, 0.1]) {
        x.beginPath();
        x.ellipse(
          cx + unit * leaf,
          cy - unit * 0.3,
          unit * 0.04,
          unit * 0.12,
          leaf * 3,
          0,
          Math.PI * 2,
        );
        x.fill();
      }
    } else if (kind === 'radish') {
      x.fillStyle = '#5fa04e';
      for (const leaf of [-0.12, 0.12]) {
        x.beginPath();
        x.ellipse(
          cx + unit * leaf,
          cy - unit * 0.26,
          unit * 0.07,
          unit * 0.14,
          leaf * 4,
          0,
          Math.PI * 2,
        );
        x.fill();
      }
      x.fillStyle = '#d6456b';
      ellipse(x, cx, cy + unit * 0.04, unit * 0.24, unit * 0.22);
      x.fillStyle = '#fbf6ea';
      x.beginPath();
      x.moveTo(cx - unit * 0.06, cy + unit * 0.22);
      x.quadraticCurveTo(cx, cy + unit * 0.42, cx + unit * 0.06, cy + unit * 0.22);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 35%)';
      ellipse(x, cx - unit * 0.1, cy - unit * 0.04, unit * 0.06, unit * 0.04);
    } else if (kind === 'pepper') {
      x.fillStyle = '#e0b22e';
      x.beginPath();
      x.moveTo(cx - unit * 0.24, cy - unit * 0.1);
      x.bezierCurveTo(
        cx - unit * 0.3,
        cy + unit * 0.3,
        cx - unit * 0.1,
        cy + unit * 0.36,
        cx,
        cy + unit * 0.3,
      );
      x.bezierCurveTo(
        cx + unit * 0.1,
        cy + unit * 0.36,
        cx + unit * 0.3,
        cy + unit * 0.3,
        cx + unit * 0.24,
        cy - unit * 0.1,
      );
      x.quadraticCurveTo(cx, cy - unit * 0.22, cx - unit * 0.24, cy - unit * 0.1);
      x.fill();
      x.strokeStyle = 'rgb(150 100 10 / 40%)';
      x.lineWidth = unit * 0.02;
      x.beginPath();
      x.moveTo(cx, cy - unit * 0.12);
      x.lineTo(cx, cy + unit * 0.28);
      x.stroke();
      x.fillStyle = '#4e8a3f';
      roundedRect(x, cx - unit * 0.04, cy - unit * 0.3, unit * 0.08, unit * 0.14, unit * 0.03);
      x.fill();
    } else if (kind === 'eggplant') {
      x.fillStyle = '#6a3f8a';
      x.beginPath();
      x.ellipse(cx + unit * 0.02, cy + unit * 0.08, unit * 0.18, unit * 0.3, -0.35, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 25%)';
      x.beginPath();
      x.ellipse(
        cx - unit * 0.04,
        cy + unit * 0.04,
        unit * 0.04,
        unit * 0.14,
        -0.35,
        0,
        Math.PI * 2,
      );
      x.fill();
      x.fillStyle = '#4e8a3f';
      x.beginPath();
      x.ellipse(cx - unit * 0.1, cy - unit * 0.22, unit * 0.14, unit * 0.07, -0.35, 0, Math.PI * 2);
      x.fill();
      x.fillRect(cx - unit * 0.16, cy - unit * 0.38, unit * 0.05, unit * 0.14);
    } else if (kind === 'cabbage') {
      x.fillStyle = '#7fb85a';
      ellipse(x, cx, cy, unit * 0.3, unit * 0.28);
      x.fillStyle = '#a8d27a';
      ellipse(x, cx + unit * 0.04, cy - unit * 0.02, unit * 0.2, unit * 0.2);
      x.strokeStyle = '#5e9a42';
      x.lineWidth = unit * 0.025;
      for (const vein of [-0.5, 0, 0.5]) {
        x.beginPath();
        x.moveTo(cx + unit * 0.04, cy + unit * 0.16);
        x.quadraticCurveTo(
          cx + unit * (0.04 + vein * 0.2),
          cy,
          cx + unit * (0.04 + vein * 0.28),
          cy - unit * 0.16,
        );
        x.stroke();
      }
    } else {
      // The clay pot: round-bellied, with a rim and a painted band.
      x.fillStyle = '#b5652a';
      ellipse(x, cx, cy + unit * 0.06, unit * 0.28, unit * 0.27);
      x.fillStyle = '#9a521f';
      roundedRect(x, cx - unit * 0.18, cy - unit * 0.32, unit * 0.36, unit * 0.12, unit * 0.04);
      x.fill();
      x.fillStyle = '#7a3e14';
      ellipse(x, cx, cy - unit * 0.3, unit * 0.13, unit * 0.04);
      x.fillStyle = '#f2d39a';
      x.fillRect(cx - unit * 0.27, cy + unit * 0.02, unit * 0.54, unit * 0.06);
      x.fillStyle = '#2c2a35';
      for (const dot of [-0.16, 0, 0.16]) {
        ellipse(x, cx + unit * dot, cy + unit * 0.05, unit * 0.02, unit * 0.02);
      }
      x.fillStyle = 'rgb(255 255 255 / 25%)';
      ellipse(x, cx - unit * 0.12, cy - unit * 0.04, unit * 0.05, unit * 0.09);
    }
  };
}

// The dojo's garden, where archery is practised: a pale sky, far hills, a bamboo fence, a maple
// in autumn red on the left, bamboo on the right, a stone lantern, and the lawn.
export function drawDojoGarden(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const lawn = height * 0.8;
  const sky = x.createLinearGradient(0, 0, 0, lawn);
  sky.addColorStop(0, '#a9d4ec');
  sky.addColorStop(1, '#e6f2f2');
  x.fillStyle = sky;
  x.fillRect(0, 0, width, lawn);
  // Clouds.
  x.fillStyle = 'rgb(255 255 255 / 85%)';
  for (const [cloudX, cloudY, size] of [
    [0.18, 0.14, 1],
    [0.62, 0.08, 0.8],
    [0.86, 0.2, 0.65],
  ]) {
    for (const [dx, dy, r] of [
      [-0.9, 0.2, 0.55],
      [0, 0, 0.8],
      [0.9, 0.2, 0.55],
    ]) {
      ellipse(
        x,
        width * cloudX + dx * 30 * size,
        height * cloudY + dy * 30 * size,
        r * 34 * size,
        r * 22 * size,
      );
    }
  }
  // Far hills.
  x.fillStyle = '#b9d3a8';
  x.beginPath();
  x.moveTo(0, height * 0.5);
  x.quadraticCurveTo(width * 0.25, height * 0.36, width * 0.5, height * 0.5);
  x.quadraticCurveTo(width * 0.75, height * 0.4, width, height * 0.48);
  x.lineTo(width, lawn);
  x.lineTo(0, lawn);
  x.closePath();
  x.fill();
  // The bamboo fence, its canes bound by two cords.
  const fenceTop = height * 0.56;
  for (let cane = 0; cane < width; cane += 14) {
    x.fillStyle = cane % 28 === 0 ? '#c9b46a' : '#b8a35c';
    x.fillRect(cane, fenceTop + ((cane / 14) % 2) * 4, 12, lawn - fenceTop);
  }
  x.fillStyle = '#6b4a2e';
  x.fillRect(0, fenceTop + 18, width, 5);
  x.fillRect(0, lawn - 26, width, 5);
  // The maple on the left, its crown in reds and oranges.
  x.fillStyle = '#5e3a22';
  x.beginPath();
  x.moveTo(width * 0.08, lawn);
  x.quadraticCurveTo(width * 0.1, height * 0.5, width * 0.06, height * 0.3);
  x.lineTo(width * 0.1, height * 0.3);
  x.quadraticCurveTo(width * 0.14, height * 0.52, width * 0.13, lawn);
  x.closePath();
  x.fill();
  for (const [leafX, leafY, r, color] of [
    [0.02, 0.26, 44, '#c8453a'],
    [0.1, 0.16, 50, '#d9603a'],
    [0.18, 0.28, 40, '#e8792b'],
    [0.08, 0.34, 38, '#b8362e'],
  ] as const) {
    x.fillStyle = color;
    ellipse(x, width * leafX, height * leafY, r * (height / 320), r * 0.8 * (height / 320));
  }
  // Bamboo on the right.
  for (const stalkX of [0.9, 0.95, 0.985]) {
    x.fillStyle = '#6f9a4a';
    x.fillRect(width * stalkX, 0, 9, lawn);
    x.fillStyle = '#557a38';
    for (let node = 20; node < lawn; node += 46) {
      x.fillRect(width * stalkX - 1, node, 11, 3);
    }
    x.fillStyle = '#7fb85a';
    for (let leaf = 30; leaf < lawn * 0.7; leaf += 60) {
      x.beginPath();
      x.ellipse(width * stalkX - 14, leaf, 18, 5, -0.4, 0, Math.PI * 2);
      x.fill();
    }
  }
  // A stone lantern by the fence.
  const lanternX = width * 0.8;
  x.fillStyle = '#9a968e';
  x.fillRect(lanternX - 5, lawn - 52, 10, 40);
  x.fillRect(lanternX - 16, lawn - 14, 32, 14);
  x.fillStyle = '#b3afa6';
  x.fillRect(lanternX - 12, lawn - 70, 24, 20);
  x.fillStyle = '#ffe7a6';
  x.fillRect(lanternX - 6, lawn - 65, 12, 10);
  x.fillStyle = '#8a867e';
  x.beginPath();
  x.moveTo(lanternX - 22, lawn - 70);
  x.lineTo(lanternX, lawn - 86);
  x.lineTo(lanternX + 22, lawn - 70);
  x.closePath();
  x.fill();
  // The lawn, with tufts.
  x.fillStyle = '#8cbf5f';
  x.fillRect(0, lawn, width, height - lawn);
  x.strokeStyle = '#6f9f45';
  x.lineWidth = 2;
  for (let tuft = 10; tuft < width; tuft += 37) {
    const tuftY = lawn + 10 + ((tuft * 7) % (height - lawn - 14));
    x.beginPath();
    x.moveTo(tuft - 4, tuftY);
    x.lineTo(tuft - 6, tuftY - 7);
    x.moveTo(tuft, tuftY);
    x.lineTo(tuft, tuftY - 9);
    x.moveTo(tuft + 4, tuftY);
    x.lineTo(tuft + 6, tuftY - 7);
    x.stroke();
  }
}

// The dojo's back screens slid open onto the garden, its target standing on the lawn.
export function drawGardenView(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.save();
  x.beginPath();
  x.rect(10, 10, width - 20, height - 20);
  x.clip();
  x.translate(10, 10);
  drawDojoGarden(x, width - 20, height - 20);
  x.translate((width - 20) / 2 - 26, (height - 20) * 0.5);
  drawArcheryTarget(x, 52, 70);
  x.restore();
  x.strokeStyle = DOJO_WOOD_DARK;
  x.lineWidth = 12;
  x.strokeRect(6, 6, width - 12, height - 12);
  x.lineWidth = 6;
  x.beginPath();
  x.moveTo(width / 2, 6);
  x.lineTo(width / 2, 22);
  x.stroke();
}

// --- Linden Park's garden. ---------------------------------------------------------------------

const SQUIRREL_FUR = '#c9772e';
const SQUIRREL_DARK = '#8e4f1c';
const SQUIRREL_CREAM = '#f4e2c2';
const GARDEN_GREEN = '#4f8a3c';

export const GARDENER_SIZE = { width: 320, height: 320 };
export const GARDENER_FACE = { x: 140, y: 150, size: 200 };

// Pépin, the squirrel who tends Linden Park: russet fur and a cream belly, a great bushy tail curling
// up behind him, tufted ears under a straw hat, a green apron with a trowel in its pocket, and his
// two front teeth.
export function drawGardener(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2 - 20;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 34;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // The tail, rising behind him on the right and curling over at the top.
  x.fillStyle = SQUIRREL_DARK;
  x.beginPath();
  x.moveTo(cx + 60, bottom - 30);
  x.bezierCurveTo(cx + 170, bottom - 40, cx + 170, bodyY - 150, cx + 100, bodyY - 150);
  x.bezierCurveTo(cx + 60, bodyY - 150, cx + 50, bodyY - 100, cx + 90, bodyY - 96);
  x.bezierCurveTo(cx + 120, bodyY - 60, cx + 80, bottom - 70, cx + 40, bottom - 60);
  x.closePath();
  x.fill();
  x.fillStyle = SQUIRREL_FUR;
  x.beginPath();
  x.moveTo(cx + 64, bottom - 40);
  x.bezierCurveTo(cx + 154, bottom - 50, cx + 154, bodyY - 136, cx + 102, bodyY - 136);
  x.bezierCurveTo(cx + 72, bodyY - 136, cx + 66, bodyY - 106, cx + 92, bodyY - 104);
  x.bezierCurveTo(cx + 110, bodyY - 70, cx + 86, bottom - 80, cx + 50, bottom - 66);
  x.closePath();
  x.fill();
  // Tufted ears, their bases sunk behind the head, each inside a shrunk copy of its outline.
  for (const side of [-1, 1]) {
    const ear = [
      { x: cx + side * 26, y: bodyY - 84 },
      { x: cx + side * 56, y: bodyY - 148 },
      { x: cx + side * 70, y: bodyY - 56 },
    ];
    drawRoundedEar(x, ear, SQUIRREL_FUR);
    const middle = {
      x: (ear[0].x + ear[1].x + ear[2].x) / 3,
      y: (ear[0].y + ear[1].y + ear[2].y) / 3,
    };
    drawRoundedEar(
      x,
      ear.map(({ x: pointX, y: pointY }) => ({
        x: middle.x + (pointX - middle.x) * 0.55,
        y: middle.y + (pointY - middle.y) * 0.55 + 4,
      })),
      '#e8a77a',
    );
    // The tuft at the tip.
    x.strokeStyle = SQUIRREL_DARK;
    x.lineWidth = 4;
    for (const flick of [-8, 0, 8]) {
      x.beginPath();
      x.moveTo(ear[1].x, ear[1].y + 6);
      x.lineTo(ear[1].x + flick + side * 4, ear[1].y - 12);
      x.stroke();
    }
  }
  roundBody(x, cx, bottom, { body: SQUIRREL_FUR, belly: SQUIRREL_CREAM, feet: SQUIRREL_DARK });
  // Cream cheeks and muzzle.
  x.fillStyle = SQUIRREL_CREAM;
  ellipse(x, cx, eyesY + 34, 34, 24);
  // His green apron, tied at the neck, a trowel in its pocket.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = GARDEN_GREEN;
  roundedRect(x, cx - 52, bodyY + 26, 104, 120, 14);
  x.fill();
  x.fillStyle = '#3f6f30';
  roundedRect(x, cx - 28, bodyY + 56, 56, 30, 6);
  x.fill();
  x.restore();
  x.fillStyle = '#9aa0a8';
  x.beginPath();
  x.moveTo(cx + 8, bodyY + 58);
  x.lineTo(cx + 18, bodyY + 32);
  x.lineTo(cx + 26, bodyY + 58);
  x.closePath();
  x.fill();
  x.fillStyle = '#8a5a34';
  x.fillRect(cx + 14, bodyY + 54, 8, 16);
  // Eyes, nose, a smile and two front teeth.
  for (const side of [-1, 1]) {
    drawEye(x, cx + side * 28, eyesY + 2, eyes, { width: 10 });
  }
  x.fillStyle = '#4a2a22';
  ellipse(x, cx, eyesY + 26, 9, 6);
  x.strokeStyle = '#4a2a22';
  x.lineWidth = 3.5;
  x.beginPath();
  x.moveTo(cx - 10, eyesY + 38);
  x.quadraticCurveTo(cx, eyesY + 44, cx + 10, eyesY + 38);
  x.stroke();
  x.fillStyle = '#ffffff';
  x.fillRect(cx - 6, eyesY + 40, 5, 9);
  x.fillRect(cx + 1, eyesY + 40, 5, 9);
  x.fillStyle = 'rgb(240 110 100 / 40%)';
  ellipse(x, cx - 52, eyesY + 24, 11, 7);
  ellipse(x, cx + 52, eyesY + 24, 11, 7);
  // The straw hat, tilted a little, over the top of his head.
  x.save();
  x.translate(cx, bodyY - 92);
  x.rotate(-0.08);
  x.fillStyle = '#e3c66f';
  ellipse(x, 0, 6, 86, 16);
  x.beginPath();
  x.moveTo(-44, 4);
  x.quadraticCurveTo(-42, -40, 0, -42);
  x.quadraticCurveTo(42, -40, 44, 4);
  x.closePath();
  x.fill();
  x.fillStyle = GARDEN_GREEN;
  x.fillRect(-44, -8, 88, 10);
  x.strokeStyle = 'rgb(140 100 30 / 40%)';
  x.lineWidth = 2;
  for (let weave = -36; weave <= 36; weave += 12) {
    x.beginPath();
    x.moveTo(weave, -32);
    x.lineTo(weave + 4, 2);
    x.stroke();
  }
  x.restore();
  // His paw holding a little watering can, on the left.
  x.fillStyle = '#7fa8c9';
  roundedRect(x, cx - 112, bodyY + 30, 40, 34, 6);
  x.fill();
  x.strokeStyle = '#7fa8c9';
  x.lineWidth = 6;
  x.beginPath();
  x.moveTo(cx - 112, bodyY + 40);
  x.lineTo(cx - 134, bodyY + 22);
  x.stroke();
  x.fillStyle = SQUIRREL_FUR;
  ellipse(x, cx - 78, bodyY + 40, 15, 13);
}

// The garden's flower beds, for the park: a low border of stones around soil and flowers.
export function drawFlowerBeds(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const beds = 5;
  const bedWidth = width / beds;
  const colors = ['#e05a7e', '#f0c43a', '#9a6ad6', '#f08a3a', '#e8e2f0'];
  for (let bed = 0; bed < beds; bed++) {
    const cx = bedWidth * (bed + 0.5);
    drawFlowerBed(x, cx, height, bedWidth * 0.9, 'blooming', colors[bed]);
  }
}

// One flower bed, as the watering game shows it: blooming, thirsty, or drowned in a puddle.
export function drawFlowerBed(
  x: CanvasRenderingContext2D,
  cx: number,
  bottom: number,
  bedWidth: number,
  look: 'blooming' | 'thirsty' | 'drowned',
  color: string,
) {
  const soilTop = bottom - bedWidth * 0.28;
  // Stems and flowers, upright when blooming, drooping when thirsty.
  for (let stem = 0; stem < 4; stem++) {
    const stemX = cx - bedWidth * 0.3 + stem * bedWidth * 0.2;
    const tall = bedWidth * (0.5 + (stem % 2) * 0.12);
    const droop = look === 'thirsty' ? bedWidth * 0.18 : 0;
    x.strokeStyle = look === 'thirsty' ? '#8a8a4a' : '#4f8a3c';
    x.lineWidth = Math.max(2, bedWidth * 0.035);
    x.beginPath();
    x.moveTo(stemX, soilTop);
    x.quadraticCurveTo(stemX, soilTop - tall, stemX + droop, soilTop - tall + droop);
    x.stroke();
    const headX = stemX + droop;
    const headY = soilTop - tall + droop;
    if (look === 'blooming') {
      x.fillStyle = color;
      for (let petal = 0; petal < 5; petal++) {
        const angle = (petal / 5) * Math.PI * 2;
        ellipse(
          x,
          headX + Math.cos(angle) * bedWidth * 0.06,
          headY + Math.sin(angle) * bedWidth * 0.06,
          bedWidth * 0.055,
          bedWidth * 0.055,
        );
      }
      x.fillStyle = '#f6d24a';
      ellipse(x, headX, headY, bedWidth * 0.04, bedWidth * 0.04);
    } else {
      x.fillStyle = look === 'thirsty' ? '#b59a5a' : color;
      ellipse(x, headX, headY, bedWidth * 0.045, bedWidth * 0.06);
    }
  }
  // The soil, darker when wet, and its border of stones.
  x.fillStyle = look === 'drowned' ? '#4a3420' : look === 'thirsty' ? '#a9845a' : '#6b4a2e';
  ellipse(x, cx, soilTop + bedWidth * 0.06, bedWidth * 0.46, bedWidth * 0.12);
  if (look === 'drowned') {
    x.fillStyle = 'rgb(120 170 220 / 70%)';
    ellipse(x, cx, soilTop + bedWidth * 0.06, bedWidth * 0.36, bedWidth * 0.07);
  }
  x.fillStyle = '#b3afa6';
  for (let stone = 0; stone < 6; stone++) {
    ellipse(
      x,
      cx - bedWidth * 0.42 + stone * bedWidth * 0.168,
      bottom - bedWidth * 0.07,
      bedWidth * 0.08,
      bedWidth * 0.06,
    );
  }
}

// A small stone fountain, water arching from its spout.
export function drawFountain(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  x.fillStyle = '#9a968e';
  roundedRect(x, cx - width * 0.42, height - 60, width * 0.84, 54, 10);
  x.fill();
  x.fillStyle = '#7fb3d9';
  ellipse(x, cx, height - 58, width * 0.38, 10);
  x.fillStyle = '#b3afa6';
  x.fillRect(cx - 10, height - 150, 20, 94);
  ellipse(x, cx, height - 150, 34, 10);
  x.strokeStyle = 'rgb(140 195 235 / 90%)';
  x.lineWidth = 6;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx, height - 158);
    x.quadraticCurveTo(cx + side * 40, height - 200, cx + side * 60, height - 64);
    x.stroke();
  }
}

// The three sorting bins: blue for paper, yellow for packaging, green for glass.
export const BIN_COLORS = { paper: '#3c78b4', packaging: '#e8b33e', glass: '#4f8a3c' } as const;

export function drawSortingBin(bin: keyof typeof BIN_COLORS) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    x.fillStyle = BIN_COLORS[bin];
    x.beginPath();
    x.moveTo(width * 0.14, height * 0.24);
    x.lineTo(width * 0.86, height * 0.24);
    x.lineTo(width * 0.78, height * 0.98);
    x.lineTo(width * 0.22, height * 0.98);
    x.closePath();
    x.fill();
    x.fillStyle = 'rgb(0 0 0 / 22%)';
    roundedRect(x, width * 0.08, height * 0.14, width * 0.84, height * 0.12, 6);
    x.fill();
    x.fillStyle = 'rgb(255 255 255 / 85%)';
    // A sign of what goes in: a sheet, a can, a bottle.
    if (bin === 'paper') {
      x.fillRect(width * 0.38, height * 0.42, width * 0.24, height * 0.3);
    } else if (bin === 'packaging') {
      roundedRect(x, width * 0.4, height * 0.4, width * 0.2, height * 0.34, 6);
      x.fill();
    } else {
      roundedRect(x, width * 0.42, height * 0.48, width * 0.16, height * 0.28, 6);
      x.fill();
      x.fillRect(width * 0.47, height * 0.38, width * 0.06, height * 0.12);
    }
  };
}

export function drawSortingBins(drawing: CanvasRenderingContext2D, width: number, height: number) {
  (['paper', 'packaging', 'glass'] as const).forEach((bin, index) => {
    drawing.save();
    drawing.translate((width / 3) * index, 0);
    drawSortingBin(bin)(drawing, width / 3, height);
    drawing.restore();
  });
}

// A piece of litter on the lawn.
export type LitterDrawing =
  | 'newspaper'
  | 'crumpledPaper'
  | 'can'
  | 'plasticBottle'
  | 'jar'
  | 'glassBottle';

export function drawLitter(look: LitterDrawing) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const cx = width / 2;
    const cy = height / 2;
    const unit = Math.min(width, height);
    if (look === 'newspaper') {
      x.save();
      x.translate(cx, cy);
      x.rotate(-0.25);
      x.fillStyle = '#efe9dc';
      x.fillRect(-unit * 0.32, -unit * 0.22, unit * 0.64, unit * 0.44);
      x.fillStyle = 'rgb(44 42 53 / 45%)';
      x.fillRect(-unit * 0.26, -unit * 0.16, unit * 0.52, unit * 0.08);
      for (let line = 0; line < 3; line++) {
        x.fillRect(
          -unit * 0.26,
          -unit * 0.02 + line * unit * 0.07,
          unit * (line === 2 ? 0.3 : 0.52),
          unit * 0.03,
        );
      }
      x.restore();
    } else if (look === 'crumpledPaper') {
      // A sheet of writing paper, crumpled into a ball: white, creased, a few lines of ink.
      x.fillStyle = '#fbfaf5';
      x.beginPath();
      const points = 11;
      for (let point = 0; point <= points; point++) {
        const angle = (point / points) * Math.PI * 2;
        const radius = unit * (point % 2 === 0 ? 0.3 : 0.24);
        const pointX = cx + Math.cos(angle) * radius;
        const pointY = cy + Math.sin(angle) * radius * 0.92;
        if (point === 0) {
          x.moveTo(pointX, pointY);
        } else {
          x.lineTo(pointX, pointY);
        }
      }
      x.closePath();
      x.fill();
      x.strokeStyle = 'rgb(120 120 130 / 45%)';
      x.lineWidth = unit * 0.018;
      x.stroke();
      x.beginPath();
      x.moveTo(cx - unit * 0.18, cy - unit * 0.08);
      x.lineTo(cx + unit * 0.02, cy + unit * 0.02);
      x.lineTo(cx + unit * 0.16, cy - unit * 0.12);
      x.moveTo(cx - unit * 0.06, cy + unit * 0.18);
      x.lineTo(cx + unit * 0.04, cy + unit * 0.02);
      x.stroke();
      x.strokeStyle = 'rgb(60 100 170 / 55%)';
      x.lineWidth = unit * 0.022;
      for (const [fromX, fromY, toX] of [
        [-0.2, -0.16, 0.06],
        [-0.14, 0.08, 0.16],
        [-0.22, 0.16, -0.04],
      ]) {
        x.beginPath();
        x.moveTo(cx + unit * fromX, cy + unit * fromY);
        x.lineTo(cx + unit * toX, cy + unit * (fromY + 0.03));
        x.stroke();
      }
    } else if (look === 'can') {
      x.save();
      x.translate(cx, cy);
      x.rotate(1.2);
      x.fillStyle = '#c8453a';
      roundedRect(x, -unit * 0.16, -unit * 0.3, unit * 0.32, unit * 0.6, unit * 0.06);
      x.fill();
      x.fillStyle = '#c0c5cc';
      x.fillRect(-unit * 0.16, -unit * 0.3, unit * 0.32, unit * 0.07);
      x.fillStyle = '#fbf6ea';
      x.fillRect(-unit * 0.16, -unit * 0.02, unit * 0.32, unit * 0.06);
      x.restore();
    } else if (look === 'plasticBottle') {
      x.save();
      x.translate(cx, cy);
      x.rotate(-1.1);
      x.fillStyle = 'rgb(140 200 230 / 85%)';
      roundedRect(x, -unit * 0.14, -unit * 0.22, unit * 0.28, unit * 0.52, unit * 0.08);
      x.fill();
      x.fillRect(-unit * 0.07, -unit * 0.34, unit * 0.14, unit * 0.14);
      x.fillStyle = '#3c78b4';
      x.fillRect(-unit * 0.08, -unit * 0.4, unit * 0.16, unit * 0.07);
      x.fillStyle = '#fbf6ea';
      x.fillRect(-unit * 0.14, -unit * 0.02, unit * 0.28, unit * 0.1);
      x.restore();
    } else if (look === 'jar') {
      x.fillStyle = 'rgb(170 210 190 / 85%)';
      roundedRect(x, cx - unit * 0.2, cy - unit * 0.18, unit * 0.4, unit * 0.44, unit * 0.08);
      x.fill();
      x.fillStyle = '#9aa0a8';
      x.fillRect(cx - unit * 0.18, cy - unit * 0.28, unit * 0.36, unit * 0.1);
      x.fillStyle = 'rgb(255 255 255 / 55%)';
      x.fillRect(cx - unit * 0.12, cy - unit * 0.1, unit * 0.05, unit * 0.26);
    } else {
      x.save();
      x.translate(cx, cy);
      x.rotate(0.9);
      x.fillStyle = 'rgb(70 140 90 / 90%)';
      roundedRect(x, -unit * 0.13, -unit * 0.14, unit * 0.26, unit * 0.46, unit * 0.06);
      x.fill();
      x.fillRect(-unit * 0.05, -unit * 0.36, unit * 0.1, unit * 0.24);
      x.fillStyle = 'rgb(255 255 255 / 45%)';
      x.fillRect(-unit * 0.08, -unit * 0.06, unit * 0.04, unit * 0.3);
      x.restore();
    }
  };
}

// --- The park's mini-games' sceneries. ----------------------------------------------------------

// A paper cut-out pasted onto a scenery at its place, scaled to a height.
function pasteCutOut(
  x: CanvasRenderingContext2D,
  piece: HTMLCanvasElement,
  left: number,
  bottom: number,
  height: number,
) {
  const width = (piece.width / piece.height) * height;
  x.drawImage(piece, left - width / 2, bottom - height, width, height);
}

export const PATH_SCENERY_SIZE = { width: 960, height: 300 };

// The park's path as the clean-up walks along it: sky and clouds, far hills, trees and benches, a
// hedge, then the sandy path with its paving and its grassy edges. It tiles from side to side, so
// that it can scroll by without a seam: nothing crosses its left or right edge.
export function drawParkPathScenery(): HTMLCanvasElement {
  const { width, height } = PATH_SCENERY_SIZE;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const sky = x.createLinearGradient(0, 0, 0, 170);
  sky.addColorStop(0, '#b6dcef');
  sky.addColorStop(1, '#e4f1ee');
  x.fillStyle = sky;
  x.fillRect(0, 0, width, 200);
  const cloud = cutOut(160, 90, drawCloud('#fbfbf6'), 5, 401);
  for (const [cloudX, cloudY, size] of [
    [150, 50, 44],
    [520, 30, 36],
    [800, 64, 40],
  ]) {
    pasteCutOut(x, cloud, cloudX, cloudY + size, size);
  }
  // Far hills, in a band that repeats from side to side.
  x.fillStyle = '#b4d39a';
  for (let hill = 0; hill <= width; hill += 240) {
    ellipse(x, hill, 150, 150, 46);
  }
  x.fillRect(0, 150, width, 40);
  // Trees and pines along the far side of the path, and a bench between some.
  const trees = [
    cutOut(240, 320, drawTree(31), 8, 402),
    cutOut(240, 320, drawPine(32), 8, 403),
    cutOut(240, 320, drawTree(33), 8, 404),
    cutOut(240, 320, drawPine(34), 8, 405),
  ];
  for (const [index, treeX] of [70, 230, 420, 590, 780, 900].entries()) {
    pasteCutOut(x, trees[index % trees.length], treeX, 192, index % 2 === 0 ? 132 : 150);
  }
  // A hedge of rounded bushes, its period dividing the width.
  x.fillStyle = '#6f9f4f';
  for (let bush = 0; bush <= width; bush += 48) {
    ellipse(x, bush, 196, 30, 22);
  }
  x.fillStyle = '#7fb85a';
  for (let bush = 24; bush <= width; bush += 48) {
    ellipse(x, bush, 200, 26, 16);
  }
  const bench = cutOut(260, 150, drawBench, 7, 406);
  pasteCutOut(x, bench, 330, 214, 46);
  pasteCutOut(x, bench, 690, 214, 46);
  // The grass verge, then the path, with its paving stones.
  x.fillStyle = '#8cbf5f';
  x.fillRect(0, 200, width, 18);
  x.fillStyle = '#dcc89a';
  x.fillRect(0, 216, width, height - 216);
  x.fillStyle = '#c4ae7c';
  x.fillRect(0, 216, width, 5);
  for (let row = 0; row < 3; row++) {
    const rowY = 238 + row * 22;
    const offset = row % 2 === 0 ? 0 : 40;
    for (let stone = offset; stone < width; stone += 80) {
      x.fillStyle = row % 2 === 0 ? 'rgb(196 174 124 / 55%)' : 'rgb(196 174 124 / 40%)';
      // Drawn again a width to the left, so that a stone cut by the right edge goes on at the left.
      for (const shift of [0, -width]) {
        roundedRect(x, stone + 6 + shift, rowY, 66, 14, 7);
        x.fill();
      }
    }
  }
  // A few flowers in the verge.
  for (let flower = 40; flower < width; flower += 120) {
    x.fillStyle = flower % 240 === 40 ? '#e05a7e' : '#f0c43a';
    ellipse(x, flower, 208, 4, 4);
    ellipse(x, flower + 9, 211, 3, 3);
  }
  addGrain(canvas, 8, 407);
  return canvas;
}

// The little cart Pip pulls along, with its plank for the bins, two wheels and a handle.
export function drawBinCart(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.fillStyle = '#8a5a34';
  roundedRect(x, 6, height * 0.35, width - 40, height * 0.22, 6);
  x.fill();
  x.strokeStyle = 'rgb(60 30 15 / 35%)';
  x.lineWidth = 3;
  for (let board = 40; board < width - 40; board += 40) {
    x.beginPath();
    x.moveTo(board, height * 0.35);
    x.lineTo(board, height * 0.57);
    x.stroke();
  }
  // The handle, reaching forward to Pip.
  x.strokeStyle = '#6b4a2e';
  x.lineWidth = 7;
  x.beginPath();
  x.moveTo(width - 40, height * 0.45);
  x.lineTo(width - 4, height * 0.3);
  x.stroke();
  for (const wheelX of [width * 0.2, width * 0.62]) {
    x.fillStyle = '#3f2a1c';
    ellipse(x, wheelX, height * 0.66, height * 0.17, height * 0.17);
    x.fillStyle = '#c99a5b';
    ellipse(x, wheelX, height * 0.66, height * 0.06, height * 0.06);
  }
}

export const LAKE_SCENERY_SIZE = { width: 900, height: 480 };

// Linden Park's lake for the skipping stones: the sky, far hills and the wooded shore across, the
// water with its streaks of light, reflections and water lilies, and the pebbly bank in front.
export function drawLakeScenery(): HTMLCanvasElement {
  const { width, height } = LAKE_SCENERY_SIZE;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const shore = height * 0.42;
  const sky = x.createLinearGradient(0, 0, 0, shore);
  sky.addColorStop(0, '#b6dcef');
  sky.addColorStop(1, '#e8f3ef');
  x.fillStyle = sky;
  x.fillRect(0, 0, width, shore);
  const cloud = cutOut(160, 90, drawCloud('#fbfbf6'), 5, 411);
  pasteCutOut(x, cloud, 180, 90, 48);
  pasteCutOut(x, cloud, 640, 70, 40);
  pasteCutOut(
    x,
    cutOut(1200, 120, drawHills('#b4d39a', '#a3c78a', 5, 412), 6, 413),
    width / 2,
    shore + 8,
    90,
  );
  // The wooded shore across the lake.
  const trees = [
    cutOut(240, 320, drawPine(41), 7, 414),
    cutOut(240, 320, drawTree(42), 7, 415),
    cutOut(240, 320, drawPine(43), 7, 416),
  ];
  for (const [index, treeX] of [60, 150, 260, 380, 520, 610, 740, 850].entries()) {
    pasteCutOut(x, trees[index % trees.length], treeX, shore + 6, 78 + (index % 3) * 14);
  }
  x.fillStyle = '#8fb86a';
  x.fillRect(0, shore, width, 14);
  // The water, lighter far away, with streaks of light and the trees' dark reflections.
  const water = x.createLinearGradient(0, shore + 14, 0, height);
  water.addColorStop(0, '#8cc0de');
  water.addColorStop(1, '#3f7fa8');
  x.fillStyle = water;
  x.fillRect(0, shore + 14, width, height - shore - 14);
  x.fillStyle = 'rgb(40 80 60 / 18%)';
  for (const [index, treeX] of [60, 150, 260, 380, 520, 610, 740, 850].entries()) {
    ellipse(x, treeX, shore + 34, 26, 16 + (index % 3) * 4);
  }
  x.strokeStyle = 'rgb(255 255 255 / 30%)';
  x.lineWidth = 3;
  const random = seededRandom(417);
  for (let streak = 0; streak < 26; streak++) {
    const streakY = shore + 40 + random() * (height - shore - 60);
    const streakX = random() * width;
    const length = 30 + random() * 70;
    x.beginPath();
    x.moveTo(streakX, streakY);
    x.lineTo(streakX + length, streakY);
    x.stroke();
  }
  // Water lilies, flat on the water.
  for (const [lilyX, lilyY, size] of [
    [560, shore + 70, 22],
    [600, shore + 82, 15],
    [780, shore + 140, 26],
    [380, shore + 210, 20],
  ]) {
    x.fillStyle = '#5f9f4e';
    x.beginPath();
    x.ellipse(lilyX, lilyY, size, size * 0.4, 0, 0.3, Math.PI * 2 - 0.1);
    x.lineTo(lilyX, lilyY);
    x.closePath();
    x.fill();
  }
  x.fillStyle = '#f2a7c0';
  ellipse(x, 785, shore + 132, 7, 5);
  // The pebbly bank in front, on the left, where Papy stands.
  x.fillStyle = '#c9b07a';
  x.beginPath();
  x.moveTo(0, height * 0.66);
  x.quadraticCurveTo(width * 0.2, height * 0.68, width * 0.3, height);
  x.lineTo(0, height);
  x.closePath();
  x.fill();
  x.fillStyle = '#8cbf5f';
  x.beginPath();
  x.moveTo(0, height * 0.62);
  x.quadraticCurveTo(width * 0.14, height * 0.62, width * 0.2, height * 0.7);
  x.quadraticCurveTo(width * 0.1, height * 0.68, 0, height * 0.7);
  x.closePath();
  x.fill();
  for (const [pebbleX, pebbleY, size] of [
    [60, 0.86, 12],
    [110, 0.92, 9],
    [170, 0.88, 11],
    [210, 0.96, 8],
    [40, 0.97, 10],
  ]) {
    x.fillStyle = '#9a968e';
    ellipse(x, pebbleX, height * pebbleY, size, size * 0.6);
    x.fillStyle = 'rgb(255 255 255 / 35%)';
    ellipse(x, pebbleX - size * 0.3, height * pebbleY - size * 0.2, size * 0.35, size * 0.2);
  }
  addGrain(canvas, 8, 418);
  return canvas;
}

export const GARDEN_SCENERY_SIZE = { width: 900, height: 360 };

// Pépin's garden behind its flower beds: the sky and clouds, trees beyond a wooden fence, the
// fountain on the right, and the lawn the beds stand on.
export function drawGardenScenery(): HTMLCanvasElement {
  const { width, height } = GARDEN_SCENERY_SIZE;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const lawn = height * 0.5;
  const sky = x.createLinearGradient(0, 0, 0, lawn);
  sky.addColorStop(0, '#b6dcef');
  sky.addColorStop(1, '#e6f2ee');
  x.fillStyle = sky;
  x.fillRect(0, 0, width, lawn);
  const cloud = cutOut(160, 90, drawCloud('#fbfbf6'), 5, 421);
  pasteCutOut(x, cloud, 160, 70, 42);
  pasteCutOut(x, cloud, 560, 54, 34);
  x.fillStyle = '#b4d39a';
  for (let hill = 0; hill <= width; hill += 300) {
    ellipse(x, hill + 120, lawn, 190, 60);
  }
  const trees = [
    cutOut(240, 320, drawTree(51), 8, 422),
    cutOut(240, 320, drawPine(52), 8, 423),
    cutOut(240, 320, drawTree(53), 8, 424),
  ];
  for (const [index, treeX] of [70, 250, 470, 640].entries()) {
    pasteCutOut(x, trees[index % trees.length], treeX, lawn + 4, index % 2 === 0 ? 140 : 160);
  }
  // A wooden fence along the back of the garden.
  x.fillStyle = '#c99a5b';
  x.fillRect(0, lawn - 34, width, 8);
  x.fillRect(0, lawn - 16, width, 8);
  for (let post = 10; post < width; post += 38) {
    roundedRect(x, post, lawn - 52, 14, 56, 6);
    x.fill();
  }
  x.fillStyle = 'rgb(90 60 30 / 25%)';
  for (let post = 10; post < width; post += 38) {
    x.fillRect(post + 10, lawn - 50, 3, 52);
  }
  // The lawn, with a few tufts.
  x.fillStyle = '#8cbf5f';
  x.fillRect(0, lawn, width, height - lawn);
  x.fillStyle = '#7fb35a';
  x.fillRect(0, lawn, width, 10);
  x.strokeStyle = '#6f9f45';
  x.lineWidth = 3;
  for (let tuft = 20; tuft < width; tuft += 46) {
    const tuftY = lawn + 30 + ((tuft * 13) % 140);
    x.beginPath();
    x.moveTo(tuft - 5, tuftY);
    x.lineTo(tuft - 8, tuftY - 9);
    x.moveTo(tuft, tuftY);
    x.lineTo(tuft, tuftY - 12);
    x.moveTo(tuft + 5, tuftY);
    x.lineTo(tuft + 8, tuftY - 9);
    x.stroke();
  }
  // The fountain, on the right.
  pasteCutOut(x, cutOut(160, 220, drawFountain, 7, 425), 830, lawn + 40, 150);
  addGrain(canvas, 8, 426);
  return canvas;
}

// Pépin's watering can, its spout to the left.
export function drawWateringCan(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  // The spout, reaching out to the left, with its rose.
  x.strokeStyle = '#5f8fb8';
  x.lineWidth = height * 0.1;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(width * 0.4, height * 0.62);
  x.lineTo(width * 0.1, height * 0.3);
  x.stroke();
  x.fillStyle = '#5f8fb8';
  ellipse(x, width * 0.09, height * 0.28, width * 0.07, height * 0.1);
  // The body, and its handle over the top.
  x.fillStyle = '#7fb3d9';
  roundedRect(x, width * 0.36, height * 0.38, width * 0.5, height * 0.52, width * 0.08);
  x.fill();
  x.fillStyle = 'rgb(255 255 255 / 30%)';
  roundedRect(x, width * 0.42, height * 0.44, width * 0.08, height * 0.36, width * 0.04);
  x.fill();
  x.strokeStyle = '#5f8fb8';
  x.lineWidth = height * 0.07;
  x.beginPath();
  x.arc(width * 0.66, height * 0.38, width * 0.17, Math.PI, 0);
  x.stroke();
}
