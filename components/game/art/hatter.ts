// Sir Moustache's hat shop downtown: the old walrus who keeps it, its front, and inside, the tall
// mirror, the stands of hats and his counter of hatboxes.

import {
  addGrain,
  context,
  createCanvas,
  drawEye,
  type Eyes,
  ellipse,
  roundBody,
  roundedRect,
} from './core';
import { drawHat } from './hats';

const OXBLOOD = '#6e2430';
const WOOD = '#5a3a26';
const WOOD_LIGHT = '#7a5136';
const BRASS = '#c9a24a';
const BRASS_LIGHT = '#ecd08a';

export const WALRUS_SIZE = { width: 340, height: 400 };
export const WALRUS_FACE = { x: 170, y: 262, size: 210 };

// Sir Moustache, an old walrus of a gentleman: a great bristling moustache over his tusks, a
// monocle on its chain, a waistcoat with a watch chain, and his top hat.
export function drawWalrus(
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
  roundBody(x, cx, bottom, { body: '#9a7864', belly: '#b8977f', feet: '#6e5444' });
  // His waistcoat, buttoned, with a watch chain across.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = OXBLOOD;
  x.beginPath();
  x.moveTo(cx - 60, bodyY + 10);
  x.lineTo(cx, bodyY + 40);
  x.lineTo(cx + 60, bodyY + 10);
  x.lineTo(cx + 64, bottom);
  x.lineTo(cx - 64, bottom);
  x.closePath();
  x.fill();
  x.restore();
  x.fillStyle = BRASS_LIGHT;
  for (const button of [0, 1, 2]) {
    ellipse(x, cx, bodyY + 56 + button * 22, 4.5, 4.5);
  }
  x.strokeStyle = BRASS;
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(cx - 40, bodyY + 64);
  x.quadraticCurveTo(cx - 20, bodyY + 86, cx, bodyY + 78);
  x.stroke();
  // The eyes, small, one behind his monocle.
  drawEye(x, cx - 30, eyesY, eyes, { width: 8 });
  drawEye(x, cx + 30, eyesY, eyes, { width: 8 });
  x.strokeStyle = BRASS;
  x.lineWidth = 4;
  x.beginPath();
  x.ellipse(cx + 30, eyesY, 17, 17, 0, 0, Math.PI * 2);
  x.stroke();
  x.fillStyle = 'rgb(220 240 245 / 30%)';
  ellipse(x, cx + 30, eyesY, 15, 15);
  x.strokeStyle = BRASS_LIGHT;
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(cx + 46, eyesY + 6);
  x.quadraticCurveTo(cx + 70, eyesY + 50, cx + 50, bodyY + 30);
  x.stroke();
  // His muzzle, the tusks below it, and the great moustache over them.
  x.fillStyle = '#f6efe2';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 14, eyesY + 40);
    x.lineTo(cx + side * 22, eyesY + 92);
    x.lineTo(cx + side * 8, eyesY + 46);
    x.closePath();
    x.fill();
  }
  x.fillStyle = '#c8ad94';
  for (const side of [-1, 1]) {
    ellipse(x, cx + side * 26, eyesY + 36, 32, 22);
  }
  x.strokeStyle = '#8a6d58';
  x.lineWidth = 2.5;
  for (const side of [-1, 1]) {
    for (let bristle = 0; bristle < 5; bristle++) {
      x.beginPath();
      x.moveTo(cx + side * (10 + bristle * 9), eyesY + 40);
      x.lineTo(cx + side * (8 + bristle * 10), eyesY + 56);
      x.stroke();
    }
  }
  x.fillStyle = '#3a2c26';
  ellipse(x, cx, eyesY + 18, 10, 7);
  x.fillStyle = 'rgb(240 110 100 / 35%)';
  ellipse(x, cx - 58, eyesY + 22, 12, 7);
  ellipse(x, cx + 62, eyesY + 26, 10, 6);
  // His top hat, a touch to one side.
  x.save();
  x.translate(cx - 4, bodyY - 88);
  x.rotate(-0.06);
  drawHat(x, 0, 0, 'topHat', 0.92);
  x.restore();
}

// The hat shop's front: dark wood and oxblood, a brass sign, a bay window of hats on stands, and a
// door with a hat painted on its glass.
export function drawHatterFront(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const top = 40;
    const left = 14;
    const right = width - 14;
    x.fillStyle = OXBLOOD;
    x.fillRect(left, top, right - left, height - top);
    x.fillStyle = WOOD;
    x.fillRect(left - 8, top - 18, right - left + 16, 26);
    x.fillRect(left, top, 16, height - top);
    x.fillRect(right - 16, top, 16, height - top);
    // The sign.
    x.fillStyle = WOOD;
    roundedRect(x, width / 2 - 170, top + 20, 340, 60, 6);
    x.fill();
    x.strokeStyle = BRASS;
    x.lineWidth = 4;
    x.stroke();
    x.fillStyle = BRASS_LIGHT;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 36;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > 310 && size > 14);
    x.fillText(name, width / 2, top + 51);
    // The bay window, on the left, with three hats on stands.
    const windowTop = top + 110;
    const windowLeft = left + 34;
    const windowWidth = width * 0.44;
    const windowBottom = height - 36;
    x.fillStyle = '#f6e7c4';
    x.fillRect(windowLeft, windowTop, windowWidth, windowBottom - windowTop);
    const stands: [number, 'topHat' | 'bowler' | 'boater'][] = [
      [0.22, 'bowler'],
      [0.5, 'topHat'],
      [0.78, 'boater'],
    ];
    for (const [share, hat] of stands) {
      const standX = windowLeft + windowWidth * share;
      x.fillStyle = BRASS;
      x.fillRect(standX - 3, windowTop + 90, 6, windowBottom - windowTop - 96);
      x.fillRect(standX - 18, windowBottom - 10, 36, 6);
      drawHat(x, standX, windowTop + 92, hat, 0.42);
    }
    x.strokeStyle = WOOD;
    x.lineWidth = 10;
    x.strokeRect(windowLeft, windowTop, windowWidth, windowBottom - windowTop);
    x.lineWidth = 5;
    x.beginPath();
    x.moveTo(windowLeft + windowWidth / 3, windowTop);
    x.lineTo(windowLeft + windowWidth / 3, windowBottom);
    x.moveTo(windowLeft + (windowWidth * 2) / 3, windowTop);
    x.lineTo(windowLeft + (windowWidth * 2) / 3, windowBottom);
    x.stroke();
    // The door, on the right.
    const doorWidth = 116;
    const doorX = width * 0.74;
    x.fillStyle = WOOD;
    x.fillRect(doorX - doorWidth / 2, windowTop - 10, doorWidth, height - windowTop + 10);
    x.fillStyle = 'rgb(240 225 190 / 55%)';
    x.fillRect(doorX - doorWidth / 2 + 14, windowTop + 4, doorWidth - 28, 110);
    drawHat(x, doorX, windowTop + 84, 'topHat', 0.36);
    x.fillStyle = BRASS_LIGHT;
    ellipse(x, doorX + 38, windowTop + 150, 6, 6);
    x.fillStyle = '#d8d2c8';
    x.fillRect(left - 6, height - 14, right - left + 12, 14);
  };
}

// The hat shop's walls inside: oxblood paper over dark wood panelling, with a brass rail.
export function drawHatterWall(): HTMLCanvasElement {
  const width = 1200;
  const height = 440;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = OXBLOOD;
  x.fillRect(0, 0, width, height);
  x.fillStyle = 'rgb(0 0 0 / 12%)';
  for (let column = 0; column < width; column += 60) {
    for (let row = 20; row < height - 150; row += 60) {
      x.beginPath();
      x.moveTo(column + 30, row);
      x.lineTo(column + 42, row + 14);
      x.lineTo(column + 30, row + 28);
      x.lineTo(column + 18, row + 14);
      x.closePath();
      x.fill();
    }
  }
  x.fillStyle = WOOD;
  x.fillRect(0, height - 150, width, 150);
  x.fillStyle = BRASS;
  x.fillRect(0, height - 156, width, 7);
  x.strokeStyle = WOOD_LIGHT;
  x.lineWidth = 3;
  for (let panel = 24; panel < width; panel += 140) {
    x.strokeRect(panel, height - 128, 110, 100);
  }
  addGrain(canvas, 7, 251);
  return canvas;
}

// Its floor: herringbone parquet.
export function drawHatterFloor(): HTMLCanvasElement {
  const width = 1200;
  const height = 420;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#8a5a34';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(50 25 10 / 40%)';
  x.lineWidth = 3;
  for (let row = 0; row < height; row += 40) {
    for (let column = 0; column < width; column += 80) {
      x.beginPath();
      x.moveTo(column, row);
      x.lineTo(column + 40, row + 40);
      x.lineTo(column + 80, row);
      x.stroke();
    }
  }
  addGrain(canvas, 9, 252);
  return canvas;
}

// The tall mirror where hats are tried on: an arched glass in a carved wooden frame.
export function drawHatterMirror(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  x.fillStyle = WOOD;
  roundedRect(x, 6, 10, width - 12, height - 30, 60);
  x.fill();
  x.fillStyle = '#cfe3ea';
  roundedRect(x, 22, 26, width - 44, height - 66, 48);
  x.fill();
  x.fillStyle = 'rgb(255 255 255 / 55%)';
  roundedRect(x, 34, 44, 12, height - 120, 6);
  x.fill();
  x.fillStyle = BRASS;
  ellipse(x, cx, 12, 18, 12);
  x.fillStyle = WOOD;
  x.fillRect(16, height - 22, 30, 22);
  x.fillRect(width - 46, height - 22, 30, 22);
}

// Two brass stands of hats, each a pole with arms, a hat on every arm.
export function drawHatStands(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const stands: { at: number; hats: ('beanie' | 'beret' | 'flatCap' | 'bowler')[] }[] = [
    { at: width * 0.27, hats: ['beret', 'flatCap'] },
    { at: width * 0.73, hats: ['beanie', 'bowler'] },
  ];
  for (const { at, hats } of stands) {
    x.fillStyle = BRASS;
    x.fillRect(at - 4, 60, 8, height - 74);
    x.fillRect(at - 30, height - 16, 60, 10);
    for (const [index, hat] of hats.entries()) {
      const armY = 80 + index * 80;
      const side = index % 2 === 0 ? -1 : 1;
      x.fillRect(Math.min(at, at + side * 40), armY, 40, 5);
      drawHat(x, at + side * 40, armY, hat, 0.46);
    }
  }
}

// Sir Moustache's counter: dark wood, a stack of striped hatboxes, and a brass bell.
export function drawHatterCounter(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  const top = 60;
  x.fillStyle = WOOD_LIGHT;
  x.fillRect(0, top, width, 16);
  x.fillStyle = WOOD;
  x.fillRect(10, top + 16, width - 20, height - top - 16);
  x.strokeStyle = WOOD_LIGHT;
  x.lineWidth = 3;
  for (let panel = 26; panel < width - 60; panel += 86) {
    x.strokeRect(panel, top + 32, 66, height - top - 48);
  }
  // Hatboxes on the left end.
  for (const [index, color] of ['#e7d6b8', '#2b3566'].entries()) {
    const boxY = top - 30 - index * 30;
    x.fillStyle = color;
    roundedRect(x, 20 + index * 8, boxY, 80 - index * 16, 30, 6);
    x.fill();
    x.fillStyle = OXBLOOD;
    x.fillRect(20 + index * 8, boxY + 12, 80 - index * 16, 6);
  }
  x.fillStyle = BRASS_LIGHT;
  x.beginPath();
  x.arc(width - 46, top, 15, Math.PI, 0);
  x.fill();
  ellipse(x, width - 46, top - 18, 4, 4);
}
