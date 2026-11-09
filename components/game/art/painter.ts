// Pinceau the sheep, his easel and the painting of his puzzle.

import { addGrain, context, createCanvas, drawEye, type Eyes, ellipse, roundedRect } from './core';

const WOOL = '#f3ecdc';
const WOOL_SHADE = '#ddd2bb';
const SMOCK_BLUE = '#5a7fb0';
const BERET_RED = '#c8453a';

export const PAINTER_SIZE = { width: 300, height: 380 };
export const PAINTER_FACE = { x: 168, y: 120, size: 170 };

// Pinceau, the sheep who paints by the lake: a woolly head under a red beret, a blue smock spotted
// with paint, a palette on one arm and a brush in the other hand.
export function drawPainter(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const bodyY = bottom - 110;
  const headY = bodyY - 128;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // Little dark legs and hooves.
  x.fillStyle = '#3d3a42';
  for (const side of [-1, 1]) {
    roundedRect(x, cx + side * 30 - 10, bodyY + 60, 20, bottom - bodyY - 60, 8);
    x.fill();
  }
  // The smock, wide at the hem, with spots of paint.
  x.fillStyle = SMOCK_BLUE;
  x.beginPath();
  x.moveTo(cx - 52, bodyY - 70);
  x.quadraticCurveTo(cx - 90, bodyY + 40, cx - 78, bodyY + 74);
  x.lineTo(cx + 78, bodyY + 74);
  x.quadraticCurveTo(cx + 90, bodyY + 40, cx + 52, bodyY - 70);
  x.closePath();
  x.fill();
  for (const [spotX, spotY, color] of [
    [-30, 10, '#f0c43a'],
    [22, 36, BERET_RED],
    [-8, 54, '#4f8a3c'],
    [36, -14, '#fbf6ea'],
  ] as const) {
    x.fillStyle = color;
    ellipse(x, cx + spotX, bodyY + spotY, 7, 6);
  }
  // A woolly collar.
  x.fillStyle = WOOL;
  for (let puff = 0; puff < 7; puff++) {
    ellipse(x, cx - 54 + puff * 18, bodyY - 66, 16, 14);
  }
  // The palette, held on the left arm.
  x.fillStyle = WOOL;
  ellipse(x, cx - 70, bodyY + 4, 18, 16);
  x.fillStyle = '#d9b27a';
  x.beginPath();
  x.ellipse(cx - 92, bodyY + 18, 44, 30, -0.3, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#efe2c8';
  ellipse(x, cx - 110, bodyY + 30, 8, 7);
  for (const [dabX, dabY, color] of [
    [-112, 4, BERET_RED],
    [-94, -4, '#f0c43a'],
    [-76, 6, '#3c78b4'],
    [-82, 28, '#4f8a3c'],
  ] as const) {
    x.fillStyle = color;
    ellipse(x, cx + dabX, bodyY + dabY, 8, 6);
  }
  // The brush, raised in the right hand.
  x.strokeStyle = '#8a5a34';
  x.lineWidth = 6;
  x.beginPath();
  x.moveTo(cx + 66, bodyY + 4);
  x.lineTo(cx + 104, bodyY - 56);
  x.stroke();
  x.fillStyle = '#3c78b4';
  x.beginPath();
  x.ellipse(cx + 108, bodyY - 64, 6, 12, 0.6, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = WOOL;
  ellipse(x, cx + 66, bodyY + 8, 17, 15);
  // The head: wool all round, a long pale face turned right, and drooping ears.
  x.fillStyle = WOOL_SHADE;
  for (const [puffX, puffY, size] of [
    [-44, -10, 34],
    [-30, -40, 32],
    [6, -50, 32],
    [-46, 24, 28],
  ] as const) {
    ellipse(x, cx + puffX, headY + puffY, size, size);
  }
  x.fillStyle = WOOL;
  for (const [puffX, puffY, size] of [
    [-36, -12, 30],
    [-20, -38, 28],
    [10, -44, 26],
    [-38, 20, 24],
  ] as const) {
    ellipse(x, cx + puffX, headY + puffY, size, size);
  }
  x.fillStyle = '#e9d2c0';
  x.beginPath();
  x.ellipse(cx + 22, headY + 8, 44, 52, -0.25, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#d8b9a6';
  x.beginPath();
  x.ellipse(cx - 34, headY + 4, 14, 30, 0.7, 0, Math.PI * 2);
  x.fill();
  // The nose and a little smile.
  x.fillStyle = '#b77c75';
  ellipse(x, cx + 52, headY + 30, 9, 7);
  x.strokeStyle = '#7a4a45';
  x.lineWidth = 3;
  x.beginPath();
  x.arc(cx + 44, headY + 40, 9, 0.2 * Math.PI, 0.8 * Math.PI);
  x.stroke();
  drawEye(x, cx + 28, headY - 2, eyes, { width: 8 });
  x.fillStyle = 'rgb(240 110 100 / 30%)';
  ellipse(x, cx + 16, headY + 26, 10, 6);
  // The beret, tilted, with its little stalk.
  x.fillStyle = BERET_RED;
  x.beginPath();
  x.ellipse(cx - 8, headY - 56, 54, 20, -0.15, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#a8352c';
  x.beginPath();
  x.ellipse(cx - 6, headY - 46, 46, 8, -0.15, 0, Math.PI);
  x.fill();
  x.strokeStyle = '#a8352c';
  x.lineWidth = 5;
  x.beginPath();
  x.moveTo(cx - 10, headY - 74);
  x.lineTo(cx - 6, headY - 86);
  x.stroke();
}

export const PAINTING_SIZE = 600;

// Pinceau's painting of the lake, square, the one his puzzle cuts up: a sun and clouds in the sky,
// green hills, a tree on the left bank, a red boat on the water and reeds on the right, framed, so
// that every piece shows something of its own.
export function drawPainting(): HTMLCanvasElement {
  const size = PAINTING_SIZE;
  const canvas = createCanvas(size, size);
  const x = context(canvas);
  const sky = x.createLinearGradient(0, 0, 0, size * 0.5);
  sky.addColorStop(0, '#f4b77a');
  sky.addColorStop(1, '#bfe0f0');
  x.fillStyle = sky;
  x.fillRect(0, 0, size, size);
  // The sun, low on the right, and its rays.
  x.fillStyle = '#f7d46a';
  ellipse(x, size * 0.8, size * 0.2, 56, 56);
  x.strokeStyle = 'rgb(247 212 106 / 70%)';
  x.lineWidth = 8;
  x.lineCap = 'round';
  for (let ray = 0; ray < 10; ray++) {
    const angle = (ray / 10) * Math.PI * 2;
    x.beginPath();
    x.moveTo(size * 0.8 + Math.cos(angle) * 72, size * 0.2 + Math.sin(angle) * 72);
    x.lineTo(size * 0.8 + Math.cos(angle) * 96, size * 0.2 + Math.sin(angle) * 96);
    x.stroke();
  }
  // Clouds on the left, and birds in the middle.
  x.fillStyle = '#fbf6ea';
  for (const [cloudX, cloudY, rx] of [
    [0.16, 0.12, 60],
    [0.26, 0.1, 44],
    [0.42, 0.24, 40],
  ] as const) {
    ellipse(x, size * cloudX, size * cloudY, rx, rx * 0.5);
  }
  x.strokeStyle = '#4a4458';
  x.lineWidth = 4;
  for (const [birdX, birdY] of [
    [0.5, 0.12],
    [0.56, 0.16],
  ] as const) {
    x.beginPath();
    x.moveTo(size * birdX - 14, size * birdY);
    x.quadraticCurveTo(size * birdX - 6, size * birdY - 10, size * birdX, size * birdY);
    x.quadraticCurveTo(size * birdX + 6, size * birdY - 10, size * birdX + 14, size * birdY);
    x.stroke();
  }
  // Two rows of hills.
  for (const [color, top, bump] of [
    ['#7fae6a', 0.42, 0],
    ['#5f9150', 0.5, 1.4],
  ] as const) {
    x.fillStyle = color;
    x.beginPath();
    x.moveTo(0, size);
    for (let step = 0; step <= 20; step++) {
      const along = step / 20;
      x.lineTo(along * size, size * top - Math.sin(along * 6 + bump) * 26 - 14);
    }
    x.lineTo(size, size);
    x.closePath();
    x.fill();
  }
  // The lake, its ripples, and the red boat with its sail.
  const water = x.createLinearGradient(0, size * 0.6, 0, size);
  water.addColorStop(0, '#5aa0c8');
  water.addColorStop(1, '#2f6f9a');
  x.fillStyle = water;
  x.fillRect(0, size * 0.62, size, size * 0.38);
  x.strokeStyle = 'rgb(255 255 255 / 45%)';
  x.lineWidth = 4;
  for (const [rippleX, rippleY] of [
    [0.1, 0.72],
    [0.3, 0.86],
    [0.62, 0.92],
    [0.82, 0.76],
    [0.46, 0.7],
  ] as const) {
    x.beginPath();
    x.moveTo(size * rippleX - 20, size * rippleY);
    x.lineTo(size * rippleX + 20, size * rippleY);
    x.stroke();
  }
  x.fillStyle = '#c8453a';
  x.beginPath();
  x.moveTo(size * 0.4, size * 0.8);
  x.lineTo(size * 0.6, size * 0.8);
  x.lineTo(size * 0.56, size * 0.85);
  x.lineTo(size * 0.44, size * 0.85);
  x.closePath();
  x.fill();
  x.fillStyle = '#fbf6ea';
  x.beginPath();
  x.moveTo(size * 0.5, size * 0.66);
  x.lineTo(size * 0.5, size * 0.79);
  x.lineTo(size * 0.58, size * 0.79);
  x.closePath();
  x.fill();
  // A round tree on the left bank.
  x.fillStyle = '#7a4e2a';
  x.fillRect(size * 0.12, size * 0.44, 18, size * 0.2);
  x.fillStyle = '#3f7a3a';
  ellipse(x, size * 0.14, size * 0.4, 70, 76);
  x.fillStyle = '#4f8a3c';
  ellipse(x, size * 0.11, size * 0.36, 44, 44);
  x.fillStyle = '#d0443a';
  for (const [appleX, appleY] of [
    [0.1, 0.42],
    [0.2, 0.36],
    [0.16, 0.46],
  ] as const) {
    ellipse(x, size * appleX, size * appleY, 7, 7);
  }
  // Reeds and a bulrush on the right bank.
  x.strokeStyle = '#4f7a34';
  x.lineWidth = 6;
  for (let reed = 0; reed < 6; reed++) {
    const reedX = size * 0.8 + reed * 18;
    x.beginPath();
    x.moveTo(reedX, size);
    x.quadraticCurveTo(reedX - 10, size * 0.84, reedX + (reed % 2 ? 8 : -6), size * 0.7);
    x.stroke();
  }
  x.fillStyle = '#7a4e2a';
  for (const reedX of [0.83, 0.89, 0.95]) {
    roundedRect(x, size * reedX - 6, size * 0.68, 12, 34, 6);
    x.fill();
  }
  // A water lily on the left, and the painter's signature.
  x.fillStyle = '#5f9150';
  ellipse(x, size * 0.18, size * 0.9, 34, 12);
  x.fillStyle = '#f2b8c6';
  ellipse(x, size * 0.2, size * 0.88, 10, 8);
  x.fillStyle = '#fbf6ea';
  x.font = `italic 700 34px ${'serif'}`;
  x.fillText('P.', size * 0.86, size * 0.97);
  // The frame.
  x.strokeStyle = '#b8873e';
  x.lineWidth = 18;
  x.strokeRect(9, 9, size - 18, size - 18);
  addGrain(canvas, 10, 501);
  return canvas;
}

// Pinceau's easel, the painting on it, seen from the side of the path.
export function drawEasel(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  x.strokeStyle = '#8a5a34';
  x.lineWidth = 12;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(cx - 60, height - 6);
  x.lineTo(cx - 8, 20);
  x.moveTo(cx + 60, height - 6);
  x.lineTo(cx + 8, 20);
  x.moveTo(cx, 40);
  x.lineTo(cx + 24, height - 6);
  x.stroke();
  x.lineWidth = 10;
  x.beginPath();
  x.moveTo(cx - 70, height * 0.62);
  x.lineTo(cx + 70, height * 0.62);
  x.stroke();
  const painting = drawPainting();
  const side = width - 40;
  x.drawImage(painting, 20, height * 0.62 - side - 4, side, side);
}

// --- Mme Ronron and her kitten, by Léa's block. -------------------------------------------------
