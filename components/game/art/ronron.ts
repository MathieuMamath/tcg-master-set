// Mme Ronron the cat and her kitten Mistigri.

import { drawEye, type Eyes, ellipse, roundedRect } from './core';

const CAT_GREY = '#9c938a';
const CAT_DARK = '#6d655d';
const SHAWL = '#9d7bb8';

export const RONRON_SIZE = { width: 300, height: 360 };
export const RONRON_FACE = { x: 150, y: 130, size: 170 };

// Mme Ronron, the old tabby cat who lives in Léa's block: grey fur with darker stripes, round
// glasses, a lilac shawl over her shoulders and a cane, worried for her kitten.
export function drawRonron(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const bodyY = bottom - 100;
  const headY = bodyY - 112;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // The tail, curling up behind.
  x.strokeStyle = CAT_GREY;
  x.lineWidth = 18;
  x.beginPath();
  x.moveTo(cx - 50, bottom - 30);
  x.quadraticCurveTo(cx - 120, bottom - 60, cx - 100, bodyY - 30);
  x.stroke();
  // The body, in a long skirt, and the feet.
  x.fillStyle = '#6a7f62';
  x.beginPath();
  x.moveTo(cx - 54, bodyY - 30);
  x.quadraticCurveTo(cx - 80, bodyY + 70, cx - 70, bottom - 10);
  x.lineTo(cx + 70, bottom - 10);
  x.quadraticCurveTo(cx + 80, bodyY + 70, cx + 54, bodyY - 30);
  x.closePath();
  x.fill();
  x.fillStyle = CAT_GREY;
  ellipse(x, cx - 28, bottom - 8, 22, 10);
  ellipse(x, cx + 30, bottom - 8, 22, 10);
  // The shawl, knotted at the front.
  x.fillStyle = SHAWL;
  x.beginPath();
  x.moveTo(cx - 70, bodyY - 50);
  x.quadraticCurveTo(cx, bodyY - 80, cx + 70, bodyY - 50);
  x.lineTo(cx + 30, bodyY + 30);
  x.lineTo(cx, bodyY + 10);
  x.lineTo(cx - 30, bodyY + 30);
  x.closePath();
  x.fill();
  x.fillStyle = '#86669f';
  ellipse(x, cx, bodyY - 10, 12, 10);
  // The cane, in the right paw.
  x.strokeStyle = '#7a4e2a';
  x.lineWidth = 8;
  x.beginPath();
  x.moveTo(cx + 78, bottom - 6);
  x.lineTo(cx + 72, bodyY - 20);
  x.arc(cx + 60, bodyY - 20, 12, 0, Math.PI, true);
  x.stroke();
  x.fillStyle = CAT_GREY;
  ellipse(x, cx + 70, bodyY - 8, 15, 13);
  // The head, its ears, stripes and white muzzle.
  x.fillStyle = CAT_GREY;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 22, headY - 44);
    x.lineTo(cx + side * 52, headY - 82);
    x.lineTo(cx + side * 58, headY - 26);
    x.closePath();
    x.fill();
  }
  x.fillStyle = '#e8b8b0';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 32, headY - 44);
    x.lineTo(cx + side * 50, headY - 68);
    x.lineTo(cx + side * 52, headY - 36);
    x.closePath();
    x.fill();
  }
  x.fillStyle = CAT_GREY;
  ellipse(x, cx, headY, 66, 58);
  x.strokeStyle = CAT_DARK;
  x.lineWidth = 6;
  for (const stripe of [-18, 0, 18]) {
    x.beginPath();
    x.moveTo(cx + stripe, headY - 56);
    x.lineTo(cx + stripe * 0.8, headY - 36);
    x.stroke();
  }
  x.fillStyle = '#f3ece2';
  ellipse(x, cx, headY + 26, 34, 24);
  x.fillStyle = '#d98a8a';
  x.beginPath();
  x.moveTo(cx - 8, headY + 12);
  x.lineTo(cx + 8, headY + 12);
  x.lineTo(cx, headY + 22);
  x.closePath();
  x.fill();
  x.strokeStyle = '#5a5048';
  x.lineWidth = 2.5;
  for (const side of [-1, 1]) {
    for (const tilt of [-6, 4]) {
      x.beginPath();
      x.moveTo(cx + side * 24, headY + 24);
      x.lineTo(cx + side * 66, headY + 24 + tilt);
      x.stroke();
    }
  }
  // A worried mouth, the eyes behind round glasses.
  x.lineWidth = 3;
  x.beginPath();
  x.arc(cx, headY + 40, 8, 1.15 * Math.PI, 1.85 * Math.PI);
  x.stroke();
  drawEye(x, cx - 24, headY - 8, eyes, { width: 7 });
  drawEye(x, cx + 24, headY - 8, eyes, { width: 7 });
  x.strokeStyle = '#b8873e';
  x.lineWidth = 4;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.arc(cx + side * 24, headY - 8, 18, 0, Math.PI * 2);
    x.stroke();
  }
  x.beginPath();
  x.moveTo(cx - 6, headY - 10);
  x.lineTo(cx + 6, headY - 10);
  x.stroke();
}

export const KITTEN_SIZE = { width: 200, height: 220 };

// Mistigri, Mme Ronron's kitten: a little ginger tabby in a striped scarf, glad to be found.
export function drawKitten(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const headY = bottom - 120;
  const ginger = '#e39a4f';
  x.lineCap = 'round';
  x.lineJoin = 'round';
  x.strokeStyle = ginger;
  x.lineWidth = 12;
  x.beginPath();
  x.moveTo(cx + 30, bottom - 20);
  x.quadraticCurveTo(cx + 80, bottom - 40, cx + 70, bottom - 90);
  x.stroke();
  x.fillStyle = ginger;
  ellipse(x, cx, bottom - 38, 42, 36);
  x.fillStyle = '#f6e3c8';
  ellipse(x, cx, bottom - 30, 24, 26);
  ellipse(x, cx - 20, bottom - 6, 14, 8);
  ellipse(x, cx + 20, bottom - 6, 14, 8);
  // The scarf, its end blowing.
  x.fillStyle = '#3c78b4';
  roundedRect(x, cx - 40, headY + 36, 80, 18, 8);
  x.fill();
  x.fillRect(cx + 18, headY + 44, 18, 40);
  x.fillStyle = '#f0c43a';
  x.fillRect(cx - 20, headY + 36, 10, 18);
  x.fillRect(cx + 10, headY + 36, 10, 18);
  x.fillRect(cx + 18, headY + 62, 18, 8);
  x.fillStyle = ginger;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 16, headY - 30);
    x.lineTo(cx + side * 40, headY - 64);
    x.lineTo(cx + side * 46, headY - 14);
    x.closePath();
    x.fill();
  }
  ellipse(x, cx, headY, 50, 44);
  x.strokeStyle = '#c0712f';
  x.lineWidth = 5;
  for (const stripe of [-14, 0, 14]) {
    x.beginPath();
    x.moveTo(cx + stripe, headY - 42);
    x.lineTo(cx + stripe * 0.8, headY - 26);
    x.stroke();
  }
  x.fillStyle = '#f6e3c8';
  ellipse(x, cx, headY + 18, 24, 18);
  x.fillStyle = '#d98a8a';
  ellipse(x, cx, headY + 10, 6, 4);
  x.strokeStyle = '#5a3a2a';
  x.lineWidth = 3;
  x.beginPath();
  x.arc(cx - 6, headY + 18, 6, 0.1 * Math.PI, 0.9 * Math.PI);
  x.arc(cx + 6, headY + 18, 6, 0.1 * Math.PI, 0.9 * Math.PI);
  x.stroke();
  drawEye(x, cx - 18, headY - 6, eyes, { width: 8 });
  drawEye(x, cx + 18, headY - 6, eyes, { width: 8 });
  x.fillStyle = 'rgb(240 110 100 / 35%)';
  ellipse(x, cx - 30, headY + 12, 8, 5);
  ellipse(x, cx + 30, headY + 12, 8, 5);
}

// --- Flash the photographer, downtown. ----------------------------------------------------------
