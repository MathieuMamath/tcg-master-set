// The Grand Galleries downtown: a bright shopping centre under a glass roof, lined on both floors with
// shopfronts, each seller standing in front of their own. Mme Poche, the kangaroo who sells bags,
// has the first; the others are shuttered until their sellers come.

import { drawBag } from './bags';
import {
  addGrain,
  context,
  createCanvas,
  drawEye,
  drawRoundedEar,
  type Eyes,
  ellipse,
  roundBody,
  roundedRect,
} from './core';

const WHITE = '#f8f6f1';
const STONE = '#e6e1d8';
const CHROME = '#c9ced4';
const CHROME_DARK = '#9aa2ab';
const TEAL = '#2f8f86';
const GLASS = '#cfe8f2';
const LIT = '#fff1c9';
const GOLD = '#d9aa3f';
// The colours of the shopfronts upstairs.
const SHOP_COLORS = ['#2f8f86', '#e2603a', '#d9aa3f', '#7e63be', '#3a86c8', '#c8453a'];

export const KANGAROO_SIZE = { width: 330, height: 400 };
export const KANGAROO_FACE = { x: 165, y: 252, size: 210 };

// Mme Poche, a kangaroo: long ears, a soft muzzle, a measuring tape round her neck, and a pouch full
// of the bags she sells.
export function drawKangaroo(
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
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // Long ears, standing up.
  for (const side of [-1, 1]) {
    const ear = [
      { x: cx + side * 18, y: bodyY - 84 },
      { x: cx + side * 52, y: bodyY - 196 },
      { x: cx + side * 64, y: bodyY - 70 },
    ];
    drawRoundedEar(x, ear, '#b8804e');
    drawRoundedEar(
      x,
      ear.map(({ x: pointX, y: pointY }) => ({
        x: cx + side * 42 + (pointX - (cx + side * 42)) * 0.5,
        y: bodyY - 110 + (pointY - (bodyY - 110)) * 0.6,
      })),
      '#e8b08a',
    );
  }
  roundBody(x, cx, bottom, { body: '#c9925e', belly: '#ecc9a0', feet: '#9a6a40' });
  // The pouch, with bags peeking out.
  drawBag(x, cx - 44, bodyY + 18, 'schoolBag', 0.55);
  drawBag(x, cx + 2, bodyY + 14, 'canvasBag', 0.55);
  x.fillStyle = '#ddb487';
  x.beginPath();
  x.moveTo(cx - 54, bodyY + 34);
  x.quadraticCurveTo(cx, bodyY + 48, cx + 54, bodyY + 34);
  x.quadraticCurveTo(cx + 50, bodyY + 92, cx, bodyY + 96);
  x.quadraticCurveTo(cx - 50, bodyY + 92, cx - 54, bodyY + 34);
  x.fill();
  x.strokeStyle = '#b8895e';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(cx - 54, bodyY + 34);
  x.quadraticCurveTo(cx, bodyY + 48, cx + 54, bodyY + 34);
  x.stroke();
  // A measuring tape round her neck.
  x.strokeStyle = '#f3c14b';
  x.lineWidth = 7;
  x.beginPath();
  x.moveTo(cx - 62, bodyY - 20);
  x.quadraticCurveTo(cx, bodyY + 6, cx + 62, bodyY - 20);
  x.stroke();
  x.beginPath();
  x.moveTo(cx + 40, bodyY - 8);
  x.lineTo(cx + 46, bodyY + 30);
  x.stroke();
  x.strokeStyle = 'rgb(44 42 53 / 55%)';
  x.lineWidth = 1.5;
  for (let mark = -50; mark <= 50; mark += 10) {
    x.beginPath();
    x.moveTo(cx + mark, bodyY - 12 + Math.abs(mark) * -0.22);
    x.lineTo(cx + mark, bodyY - 6 + Math.abs(mark) * -0.22);
    x.stroke();
  }
  // Her face: a pale muzzle, a dark nose, and the eyes.
  x.fillStyle = '#ecc9a0';
  ellipse(x, cx, eyesY + 30, 34, 24);
  drawEye(x, cx - 30, eyesY, eyes, { width: 9 });
  drawEye(x, cx + 30, eyesY, eyes, { width: 9 });
  x.fillStyle = '#3a2c26';
  ellipse(x, cx, eyesY + 18, 9, 6);
  x.strokeStyle = '#3a2c26';
  x.lineWidth = 3.5;
  x.beginPath();
  x.moveTo(cx - 9, eyesY + 34);
  x.quadraticCurveTo(cx, eyesY + 42, cx + 9, eyesY + 34);
  x.stroke();
  x.fillStyle = 'rgb(240 110 100 / 40%)';
  ellipse(x, cx - 52, eyesY + 24, 12, 7);
  ellipse(x, cx + 52, eyesY + 24, 12, 7);
}

// A soft pool of light, brightest in its middle.
function glow(
  x: CanvasRenderingContext2D,
  glowX: number,
  glowY: number,
  radius: number,
  alpha: number,
) {
  const light = x.createRadialGradient(glowX, glowY, 0, glowX, glowY, radius);
  light.addColorStop(0, `rgb(255 248 225 / ${alpha})`);
  light.addColorStop(1, 'rgb(255 248 225 / 0)');
  x.fillStyle = light;
  x.fillRect(glowX - radius, glowY - radius, radius * 2, radius * 2);
}

// Where the front's two entrances stand, as shares of its width, matching the street's doors.
export const STORE_ENTRANCES = [0.1, 0.9];

// The shopping centre's front: a wall of glass in a white frame, two lit floors of shops behind it,
// its name lit on a band across the top, and an entrance at each end, glass doors under a canopy.
export function drawStoreFront(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const top = 30;
    // The white frame.
    x.fillStyle = WHITE;
    x.fillRect(8, top, width - 16, height - top);
    // The lit name band.
    x.fillStyle = TEAL;
    x.fillRect(8, top, width - 16, 70);
    x.fillStyle = '#ffffff';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 44;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > width - 80 && size > 14);
    x.shadowColor = 'rgb(255 250 220 / 90%)';
    x.shadowBlur = 14;
    x.fillText(name, width / 2, top + 37);
    x.shadowBlur = 0;
    // The glass wall, two floors of lit shops behind it.
    const glassTop = top + 86;
    const glassBottom = height - 24;
    const floorY = glassTop + (glassBottom - glassTop) * 0.46;
    x.fillStyle = LIT;
    x.fillRect(22, glassTop, width - 44, glassBottom - glassTop);
    for (const [levelTop, levelBottom] of [
      [glassTop + 14, floorY - 10],
      [floorY + 16, glassBottom - 4],
    ]) {
      // About one shop for every 140 pixels of front.
      const shops = Math.max(5, Math.round((width - 64) / 140));
      const shopWidth = (width - 64) / shops;
      for (let shop = 0; shop < shops; shop++) {
        const shopX = 32 + shop * shopWidth;
        x.fillStyle = SHOP_COLORS[(shop + (levelTop > floorY ? 2 : 0)) % SHOP_COLORS.length];
        x.fillRect(shopX + 4, levelTop, shopWidth - 8, 12);
        x.fillStyle = '#fffaf0';
        x.fillRect(shopX + 4, levelTop + 14, shopWidth - 8, levelBottom - levelTop - 14);
      }
    }
    // The upper floor's slab and glass railing.
    x.fillStyle = STONE;
    x.fillRect(22, floorY - 6, width - 44, 14);
    x.fillStyle = 'rgb(207 232 242 / 55%)';
    x.fillRect(22, floorY - 30, width - 44, 24);
    // The glass, its mullions and its sheen.
    x.fillStyle = 'rgb(190 225 240 / 28%)';
    x.fillRect(22, glassTop, width - 44, glassBottom - glassTop);
    x.strokeStyle = CHROME_DARK;
    x.lineWidth = 4;
    const panes = Math.max(6, Math.round((width - 44) / 120));
    for (let mullion = 22; mullion <= width - 22; mullion += (width - 44) / panes) {
      x.beginPath();
      x.moveTo(mullion, glassTop);
      x.lineTo(mullion, glassBottom);
      x.stroke();
    }
    x.strokeRect(22, glassTop, width - 44, glassBottom - glassTop);
    x.fillStyle = 'rgb(255 255 255 / 30%)';
    for (const streak of [0.12, 0.47, 0.8]) {
      x.beginPath();
      x.moveTo(width * streak, glassTop);
      x.lineTo(width * streak + 40, glassTop);
      x.lineTo(width * streak - 20, glassBottom);
      x.lineTo(width * streak - 60, glassBottom);
      x.closePath();
      x.fill();
    }
    // An entrance at each end, its glass doors under a canopy.
    for (const doorX of STORE_ENTRANCES.map((share) => width * share)) {
      x.fillStyle = TEAL;
      roundedRect(x, doorX - 110, glassBottom - 150, 220, 18, 6);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 70%)';
      x.fillRect(doorX - 80, glassBottom - 132, 160, 128);
      x.strokeStyle = CHROME_DARK;
      x.lineWidth = 4;
      x.strokeRect(doorX - 80, glassBottom - 132, 160, 128);
      x.beginPath();
      x.moveTo(doorX, glassBottom - 132);
      x.lineTo(doorX, glassBottom - 4);
      x.stroke();
      glow(x, doorX, glassBottom - 60, 110, 0.5);
    }
    // The pavement step.
    x.fillStyle = '#d8d2c8';
    x.fillRect(0, height - 20, width, 20);
  };
}

// The light the front's glass gives off at night, for the scene to add over the dark: warm over the
// glass wall and the name, nothing elsewhere.
export function drawStoreFrontGlow(width: number, height: number): HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const glassTop = 116;
  const glassBottom = height - 24;
  x.fillStyle = 'rgb(255 214 150 / 55%)';
  x.filter = 'blur(10px)';
  x.fillRect(26, glassTop + 4, width - 52, glassBottom - glassTop - 8);
  x.fillStyle = 'rgb(200 255 245 / 55%)';
  x.fillRect(16, 34, width - 32, 62);
  x.filter = 'none';
  return canvas;
}

// The shopping centre's walls inside: the glass roof letting the daylight in along the top, an upper
// floor of lit shopfronts behind a glass railing, and white stone below, all bathed in light.
export function drawStoreWall(): HTMLCanvasElement {
  const width = 1700;
  const height = 440;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = WHITE;
  x.fillRect(0, 0, width, height);
  // The glass roof, bright sky through white ribs.
  x.fillStyle = GLASS;
  x.fillRect(0, 0, width, 34);
  x.fillStyle = '#ffffff';
  for (let rib = 0; rib < width; rib += 60) {
    x.fillRect(rib, 0, 5, 34);
  }
  x.fillRect(0, 32, width, 6);
  // The upper floor's shopfronts, lit, each under its coloured band.
  const shopTop = 58;
  const shopBottom = 168;
  const shopWidth = 210;
  for (let shop = 0; shop * shopWidth < width; shop++) {
    const shopX = shop * shopWidth + 14;
    x.fillStyle = SHOP_COLORS[shop % SHOP_COLORS.length];
    x.fillRect(shopX, shopTop, shopWidth - 28, 18);
    x.fillStyle = LIT;
    x.fillRect(shopX, shopTop + 20, shopWidth - 28, shopBottom - shopTop - 20);
    x.fillStyle = 'rgb(255 255 255 / 55%)';
    for (let shelf = 0; shelf < 3; shelf++) {
      x.fillRect(shopX + 16, shopTop + 44 + shelf * 28, shopWidth - 60, 5);
    }
    x.strokeStyle = CHROME;
    x.lineWidth = 3;
    x.strokeRect(shopX, shopTop + 20, shopWidth - 28, shopBottom - shopTop - 20);
  }
  // The upper floor's slab and its glass railing.
  x.fillStyle = STONE;
  x.fillRect(0, shopBottom, width, 22);
  x.fillStyle = 'rgb(207 232 242 / 60%)';
  x.fillRect(0, shopBottom - 34, width, 34);
  x.fillStyle = CHROME;
  x.fillRect(0, shopBottom - 36, width, 4);
  for (let post = 20; post < width; post += 110) {
    x.fillRect(post, shopBottom - 36, 4, 34);
  }
  // The ground floor's wall: white stone in large slabs, a chrome rail.
  x.strokeStyle = 'rgb(0 0 0 / 6%)';
  x.lineWidth = 2;
  for (let slab = 0; slab < width; slab += 170) {
    x.strokeRect(slab, shopBottom + 22, 170, height - shopBottom - 22);
  }
  x.fillStyle = CHROME;
  x.fillRect(0, height - 60, width, 5);
  // The light: daylight pooling under the glass roof, and the lamps' glow.
  const daylight = x.createLinearGradient(0, 0, 0, height);
  daylight.addColorStop(0, 'rgb(255 255 255 / 45%)');
  daylight.addColorStop(0.5, 'rgb(255 255 255 / 0%)');
  x.fillStyle = daylight;
  x.fillRect(0, 0, width, height);
  for (let lamp = 140; lamp < width; lamp += 340) {
    glow(x, lamp, shopBottom + 80, 170, 0.55);
  }
  addGrain(canvas, 4, 271);
  return canvas;
}

// Its floor: polished pale marble, its tiles faint, the light shining back from it.
export function drawStoreFloor(): HTMLCanvasElement {
  const width = 1700;
  const height = 420;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#efeae2';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(150 140 125 / 22%)';
  x.lineWidth = 2;
  for (let row = 0; row < height; row += 70) {
    x.beginPath();
    x.moveTo(0, row);
    x.lineTo(width, row);
    x.stroke();
  }
  for (let column = 0; column < width; column += 140) {
    x.beginPath();
    x.moveTo(column, 0);
    x.lineTo(column, height);
    x.stroke();
  }
  // Veins in the marble, and the shine of the lamps on it.
  x.strokeStyle = 'rgb(160 150 140 / 18%)';
  x.lineWidth = 1.5;
  for (let vein = 0; vein < 30; vein++) {
    const veinX = (vein * 157) % width;
    const veinY = (vein * 89) % height;
    x.beginPath();
    x.moveTo(veinX, veinY);
    x.quadraticCurveTo(veinX + 40, veinY + 20, veinX + 90, veinY + 6);
    x.stroke();
  }
  for (let lamp = 140; lamp < width; lamp += 340) {
    glow(x, lamp, 60, 150, 0.6);
  }
  addGrain(canvas, 4, 272);
  return canvas;
}

// A pendant lamp hanging from the glass roof: a warm glass globe in a chrome cap, on a long cord,
// glowing.
export function drawMallLamp(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  const globeY = height - 40;
  x.strokeStyle = CHROME_DARK;
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(cx, 0);
  x.lineTo(cx, globeY - 28);
  x.stroke();
  glow(x, cx, globeY, 40, 0.95);
  x.fillStyle = '#f6d98a';
  ellipse(x, cx, globeY, 26, 26);
  x.fillStyle = '#fff4d0';
  ellipse(x, cx - 4, globeY - 4, 16, 16);
  x.strokeStyle = 'rgb(180 140 60 / 60%)';
  x.lineWidth = 2;
  x.beginPath();
  x.ellipse(cx, globeY, 26, 26, 0, 0, Math.PI * 2);
  x.stroke();
  x.fillStyle = CHROME_DARK;
  roundedRect(x, cx - 14, globeY - 34, 28, 12, 4);
  x.fill();
}

// A shopfront on the ground floor, against the hall's back wall: white pilasters, a sign band on
// top, a wide shop window and a doorway. Mme Poche's is open and lit, its window full of bags, its
// name on the sign beside a bag.
export function drawBagShopfront(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const signHeight = 34;
    const doorLeft = width * 0.66;
    // The lit inside, behind the window and the open doorway.
    x.fillStyle = LIT;
    x.fillRect(10, signHeight, width - 20, height - signHeight);
    x.fillStyle = 'rgb(255 255 255 / 55%)';
    for (let shelf = 0; shelf < 2; shelf++) {
      x.fillRect(22, signHeight + 70 + shelf * 64, doorLeft - 40, 6);
    }
    const bags = ['canvasBag', 'denimBag', 'schoolBag', 'goldBag'] as const;
    for (const [index, bag] of bags.entries()) {
      const row = Math.floor(index / 2);
      const column = index % 2;
      drawBag(x, 34 + column * ((doorLeft - 60) / 2), signHeight + 28 + row * 64, bag, 0.7);
    }
    // Through the doorway, a rack of bags further in.
    x.fillStyle = CHROME;
    x.fillRect(doorLeft + 18, signHeight + 40, width - doorLeft - 46, 4);
    drawBag(x, doorLeft + 26, signHeight + 46, 'satchel', 0.55);
    drawBag(x, doorLeft + 66, signHeight + 46, 'goldBag', 0.55);
    // The window's glass and its sheen.
    x.fillStyle = 'rgb(207 232 242 / 30%)';
    x.fillRect(10, signHeight, doorLeft - 16, height - signHeight);
    x.fillStyle = 'rgb(255 255 255 / 35%)';
    x.beginPath();
    x.moveTo(40, signHeight);
    x.lineTo(70, signHeight);
    x.lineTo(30, height);
    x.lineTo(0, height);
    x.closePath();
    x.fill();
    drawShopFrame(x, width, height, signHeight, doorLeft, GOLD);
    // The name on the sign, a bag before it as its emblem.
    x.fillStyle = '#ffffff';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 24;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 1;
    } while (x.measureText(name).width > width - 90 && size > 10);
    const nameWidth = x.measureText(name).width;
    drawBag(x, width / 2 - nameWidth / 2 - 30, 4, 'satchel', 0.42);
    x.fillText(name, width / 2 + 12, signHeight / 2 + 1);
  };
}

// A shopfront still waiting for its seller: its sign unlit and its shutter pulled down.
export function drawClosedShopfront(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  const signHeight = 34;
  const doorLeft = width * 0.66;
  // The shutter, in ribs, down to the floor.
  x.fillStyle = '#c9cfd5';
  x.fillRect(10, signHeight, width - 20, height - signHeight);
  x.strokeStyle = 'rgb(90 100 110 / 30%)';
  x.lineWidth = 2;
  for (let rib = signHeight + 8; rib < height; rib += 12) {
    x.beginPath();
    x.moveTo(10, rib);
    x.lineTo(width - 10, rib);
    x.stroke();
  }
  x.fillStyle = '#9aa2ab';
  roundedRect(x, width / 2 - 14, height - 26, 28, 10, 4);
  x.fill();
  drawShopFrame(x, width, height, signHeight, doorLeft, '#b8c2c9');
}

// The frame every shopfront shares: its pilasters, the mullion between window and door, and the
// sign band on top in the shop's colour.
function drawShopFrame(
  x: CanvasRenderingContext2D,
  width: number,
  height: number,
  signHeight: number,
  doorLeft: number,
  sign: string,
) {
  x.fillStyle = WHITE;
  x.fillRect(0, 0, 12, height);
  x.fillRect(width - 12, 0, 12, height);
  x.fillStyle = CHROME;
  x.fillRect(doorLeft - 4, signHeight, 6, height - signHeight);
  x.fillStyle = sign;
  roundedRect(x, 0, 0, width, signHeight, 6);
  x.fill();
  x.fillStyle = 'rgb(255 255 255 / 30%)';
  x.fillRect(12, 6, width - 24, 4);
}

// A tall cheval mirror on the shop floor, for trying the bags on: white and chrome.
export function drawStoreMirror(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  x.fillStyle = CHROME;
  x.fillRect(10, 40, 8, height - 52);
  x.fillRect(width - 18, 40, 8, height - 52);
  x.fillRect(2, height - 12, 26, 8);
  x.fillRect(width - 28, height - 12, 26, 8);
  x.fillStyle = WHITE;
  roundedRect(x, 20, 16, width - 40, height - 70, 26);
  x.fill();
  x.fillStyle = GLASS;
  roundedRect(x, 28, 24, width - 56, height - 86, 20);
  x.fill();
  x.fillStyle = 'rgb(255 255 255 / 65%)';
  roundedRect(x, 36, 36, 8, height - 130, 4);
  x.fill();
  x.fillStyle = GOLD;
  ellipse(x, cx, 14, 9, 9);
}
