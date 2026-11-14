// The bedroom, and the stage every place stands on: its floor, its edges and its walls.

import {
  addGrain,
  context,
  createCanvas,
  ellipse,
  roundedRect,
  seededRandom,
  WOOD,
  WOOD_DARK,
  WOOD_LIGHT,
} from './core';

// The shadow a diorama's front edge casts on the table it stands on, darkest under the edge.
// The kraft of the table the diorama stands on, as a tile that repeats without seams: the page's
// own colour, crossed by fine fibres and faint pale streaks like the page around the scene.
export const KRAFT_TILE = 256;
export function drawKraft(): HTMLCanvasElement {
  const size = KRAFT_TILE;
  const canvas = createCanvas(size, size);
  const x = context(canvas);
  const random = seededRandom(42);
  x.fillStyle = '#c8a574';
  x.fillRect(0, 0, size, size);
  // Each stroke is drawn again one tile over in every direction, so that the edges meet.
  const stroke = (fromX: number, fromY: number, toX: number, toY: number) => {
    for (const offsetX of [-size, 0, size]) {
      for (const offsetY of [-size, 0, size]) {
        x.beginPath();
        x.moveTo(fromX + offsetX, fromY + offsetY);
        x.lineTo(toX + offsetX, toY + offsetY);
        x.stroke();
      }
    }
  };
  x.lineCap = 'round';
  for (let index = 0; index < 260; index += 1) {
    const isDark = random() < 0.6;
    x.strokeStyle = isDark
      ? `rgb(110 75 40 / ${8 + random() * 10}%)`
      : `rgb(255 240 210 / ${8 + random() * 12}%)`;
    x.lineWidth = 0.6 + random() * 1.4;
    const length = 6 + random() * 26;
    const angle = (-68 + (random() - 0.5) * 24) * (Math.PI / 180);
    const startX = random() * size;
    const startY = random() * size;
    stroke(startX, startY, startX + Math.cos(angle) * length, startY + Math.sin(angle) * length);
  }
  addGrain(canvas, 10, 7);
  return canvas;
}

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

// The wardrobe where Pip changes look: two doors, a mirror on the left one, and the end of a
// scarf caught in the gap between them.
export function drawWardrobe(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const crown = 22;
  const middle = width / 2;
  const doorTop = crown + 8;
  const doorHeight = height - crown - 42;
  // The crown along the top.
  x.fillStyle = WOOD_DARK;
  roundedRect(x, 0, 0, width, crown, 8);
  x.fill();
  // The body and its two doors.
  x.fillStyle = WOOD;
  roundedRect(x, 6, crown - 4, width - 12, height - crown - 10, 8);
  x.fill();
  x.fillStyle = WOOD_LIGHT;
  for (const left of [16, middle + 3]) {
    roundedRect(x, left, doorTop, middle - 19, doorHeight, 6);
    x.fill();
  }
  // The mirror on the left door.
  const mirrorX = 16 + (middle - 19) / 2;
  x.fillStyle = '#cfe3ea';
  ellipse(x, mirrorX, doorTop + doorHeight * 0.42, 22, 52);
  x.fillStyle = 'rgb(255 255 255 / 55%)';
  x.beginPath();
  x.ellipse(mirrorX - 7, doorTop + doorHeight * 0.34, 6, 24, -0.25, 0, Math.PI * 2);
  x.fill();
  // The knobs.
  x.fillStyle = '#f3c14b';
  ellipse(x, middle - 9, height * 0.52, 5, 5);
  ellipse(x, middle + 9, height * 0.52, 5, 5);
  // A striped scarf caught in the doors.
  x.fillStyle = '#e2603a';
  x.beginPath();
  x.moveTo(middle - 4, height * 0.6);
  x.quadraticCurveTo(middle + 14, height * 0.7, middle + 4, height * 0.82);
  x.lineTo(middle + 16, height * 0.83);
  x.quadraticCurveTo(middle + 24, height * 0.7, middle + 4, height * 0.58);
  x.closePath();
  x.fill();
  x.fillStyle = '#f3c14b';
  x.fillRect(middle + 3, height * 0.8, 14, 5);
  // Feet.
  x.fillStyle = WOOD_DARK;
  x.fillRect(12, height - 14, 18, 14);
  x.fillRect(width - 30, height - 14, 18, 14);
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
