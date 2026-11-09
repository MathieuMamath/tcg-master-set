// Gustave the heron's post stand, its counter and its stamps.

import { drawEye, type Eyes, ellipse, roundedRect, WOOD_DARK } from './core';

const HERON_GREY = '#9fb0c2';
const HERON_DARK = '#4a5566';
const POST_BLUE = '#2f4f86';
const POST_YELLOW = '#f0c43a';

export const POSTMAN_SIZE = { width: 300, height: 420 };
export const POSTMAN_FACE = { x: 140, y: 150, size: 190 };

// Gustave, the old heron who keeps the post stand: blue-grey feathers, a long yellow beak, a dark
// crest feather, a postman's cap with its yellow badge, and a satchel of letters at his side.
export function drawPostman(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2 - 14;
  const bottom = height - 6;
  const bodyY = bottom - 150;
  const headY = bodyY - 120;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // Long thin legs.
  x.strokeStyle = '#c99a5b';
  x.lineWidth = 7;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 20, bodyY + 60);
    x.lineTo(cx + side * 24, bottom - 6);
    x.lineTo(cx + side * 24 + 18, bottom - 4);
    x.stroke();
  }
  // The body, a tall rounded shape, its pale breast, and a wing folded on the side.
  x.fillStyle = HERON_GREY;
  ellipse(x, cx, bodyY, 72, 86);
  x.fillStyle = '#e6edf2';
  ellipse(x, cx + 12, bodyY + 10, 40, 64);
  x.fillStyle = '#8496aa';
  x.beginPath();
  x.ellipse(cx - 30, bodyY + 4, 36, 66, 0.25, 0, Math.PI * 2);
  x.fill();
  // The neck, rising to the head.
  x.fillStyle = HERON_GREY;
  x.beginPath();
  x.moveTo(cx - 26, bodyY - 60);
  x.quadraticCurveTo(cx - 34, headY + 40, cx - 20, headY + 20);
  x.lineTo(cx + 26, headY + 20);
  x.quadraticCurveTo(cx + 30, headY + 40, cx + 30, bodyY - 60);
  x.closePath();
  x.fill();
  x.fillStyle = '#e6edf2';
  x.beginPath();
  x.moveTo(cx + 4, bodyY - 60);
  x.quadraticCurveTo(cx + 2, headY + 50, cx + 12, headY + 26);
  x.lineTo(cx + 24, headY + 26);
  x.quadraticCurveTo(cx + 26, headY + 50, cx + 26, bodyY - 60);
  x.closePath();
  x.fill();
  // The head, its long beak to the right, and the dark crest feather trailing behind.
  x.fillStyle = '#e6edf2';
  ellipse(x, cx, headY, 52, 46);
  x.fillStyle = HERON_DARK;
  x.beginPath();
  x.moveTo(cx - 30, headY - 18);
  x.quadraticCurveTo(cx - 80, headY - 30, cx - 100, headY - 8);
  x.quadraticCurveTo(cx - 70, headY - 14, cx - 30, headY - 6);
  x.closePath();
  x.fill();
  x.fillStyle = POST_YELLOW;
  x.beginPath();
  x.moveTo(cx + 40, headY - 6);
  x.lineTo(cx + 128, headY + 6);
  x.lineTo(cx + 40, headY + 14);
  x.closePath();
  x.fill();
  x.strokeStyle = '#c99a2a';
  x.lineWidth = 2.5;
  x.beginPath();
  x.moveTo(cx + 44, headY + 5);
  x.lineTo(cx + 122, headY + 6);
  x.stroke();
  // The eye, with the dark stripe behind it.
  x.strokeStyle = HERON_DARK;
  x.lineWidth = 6;
  x.beginPath();
  x.moveTo(cx - 6, headY - 6);
  x.lineTo(cx - 34, headY - 12);
  x.stroke();
  drawEye(x, cx + 14, headY - 4, eyes, { width: 8 });
  x.fillStyle = 'rgb(240 110 100 / 35%)';
  ellipse(x, cx + 22, headY + 20, 10, 6);
  // The postman's cap, its peak over the beak and its yellow badge.
  x.fillStyle = POST_BLUE;
  x.beginPath();
  x.moveTo(cx - 38, headY - 26);
  x.quadraticCurveTo(cx - 34, headY - 70, cx + 4, headY - 72);
  x.quadraticCurveTo(cx + 40, headY - 70, cx + 40, headY - 30);
  x.closePath();
  x.fill();
  x.fillStyle = '#233c69';
  roundedRect(x, cx - 40, headY - 32, 84, 12, 5);
  x.fill();
  x.beginPath();
  x.ellipse(cx + 46, headY - 24, 26, 7, 0.1, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = POST_YELLOW;
  ellipse(x, cx, headY - 50, 9, 9);
  // The satchel, its strap across the breast, letters peeping out.
  x.strokeStyle = '#7a4e2a';
  x.lineWidth = 8;
  x.beginPath();
  x.moveTo(cx - 40, bodyY - 56);
  x.lineTo(cx + 46, bodyY + 40);
  x.stroke();
  x.fillStyle = '#fbf6ea';
  x.fillRect(cx + 34, bodyY + 22, 18, 22);
  x.fillRect(cx + 54, bodyY + 18, 16, 24);
  x.fillStyle = '#8a5a34';
  roundedRect(x, cx + 26, bodyY + 34, 56, 46, 8);
  x.fill();
  x.fillStyle = POST_YELLOW;
  ellipse(x, cx + 54, bodyY + 50, 6, 6);
}

// The back of the post stand, behind Gustave: a blue and white awning on its poles, and a rack of
// pigeonholes with letters in some.
export function drawPostBooth(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.fillStyle = WOOD_DARK;
  for (const poleX of [18, width - 30]) {
    roundedRect(x, poleX, 60, 12, height - 60, 4);
    x.fill();
  }
  // The rack of pigeonholes, between the poles.
  const rackTop = 110;
  const rackHeight = 150;
  x.fillStyle = '#c99a5b';
  x.fillRect(46, rackTop, width - 92, rackHeight);
  x.fillStyle = '#6b4a2e';
  const columns = 4;
  const rows = 3;
  const cellWidth = (width - 112) / columns;
  const cellHeight = (rackHeight - 20) / rows;
  for (let column = 0; column < columns; column++) {
    for (let row = 0; row < rows; row++) {
      const cellX = 56 + column * cellWidth;
      const cellY = rackTop + 10 + row * cellHeight;
      x.fillRect(cellX + 3, cellY + 3, cellWidth - 6, cellHeight - 6);
      if ((column + row) % 2 === 0) {
        x.fillStyle = '#fbf6ea';
        x.fillRect(cellX + 8, cellY + cellHeight - 22, cellWidth - 16, 14);
        x.fillStyle = '#6b4a2e';
      }
    }
  }
  const stripes = 8;
  const stripeWidth = width / stripes;
  for (let stripe = 0; stripe < stripes; stripe++) {
    x.fillStyle = stripe % 2 === 0 ? POST_BLUE : '#fbf1e1';
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

// The front of the post stand, before Gustave: a wooden counter with the stand's name, a pile of
// parcels, and a yellow letterbox at its side.
export function drawPostCounter(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const top = 50;
    // Parcels on the counter, tied with string.
    for (const [parcelX, parcelWidth, parcelHeight] of [
      [40, 52, 34],
      [96, 40, 26],
    ]) {
      x.fillStyle = '#c99a5b';
      x.fillRect(parcelX, top - parcelHeight, parcelWidth, parcelHeight);
      x.strokeStyle = '#7a4e2a';
      x.lineWidth = 2;
      x.beginPath();
      x.moveTo(parcelX + parcelWidth / 2, top - parcelHeight);
      x.lineTo(parcelX + parcelWidth / 2, top);
      x.moveTo(parcelX, top - parcelHeight / 2);
      x.lineTo(parcelX + parcelWidth, top - parcelHeight / 2);
      x.stroke();
    }
    x.fillStyle = WOOD_DARK;
    x.fillRect(0, top, width - 70, 14);
    x.fillStyle = '#8a5a34';
    x.fillRect(8, top + 14, width - 86, height - top - 14);
    // The stand's name on a cream board.
    x.fillStyle = '#fbf6ea';
    roundedRect(x, 24, top + 30, width - 118, 52, 8);
    x.fill();
    x.fillStyle = POST_BLUE;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 32;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > width - 140 && size > 12);
    x.fillText(name, 24 + (width - 118) / 2, top + 57);
    // The yellow letterbox on its post.
    const boxX = width - 46;
    x.fillStyle = '#3a3845';
    x.fillRect(boxX - 4, top + 40, 8, height - top - 40);
    x.fillStyle = POST_YELLOW;
    roundedRect(x, boxX - 30, top - 10, 60, 56, 14);
    x.fill();
    x.fillStyle = '#3a3845';
    x.fillRect(boxX - 18, top + 6, 36, 5);
  };
}

// A stamp of a pigeonhole's sign, for the mail: a house, a bowl, a leaf or a book, on its colour.
export const STAMP_COLORS = {
  house: '#d0443a',
  bowl: '#e8a33e',
  leaf: '#4f8a3c',
  book: '#3c78b4',
} as const;

export function drawStamp(sign: keyof typeof STAMP_COLORS) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const cx = width / 2;
    const cy = height / 2;
    const unit = Math.min(width, height);
    // The stamp's toothed paper edge, then its colour.
    x.fillStyle = '#fbf6ea';
    x.fillRect(unit * 0.08, unit * 0.08, width - unit * 0.16, height - unit * 0.16);
    x.fillStyle = 'rgb(44 42 53 / 15%)';
    for (let tooth = 0; tooth < 6; tooth++) {
      const along = unit * 0.12 + (tooth * (width - unit * 0.24)) / 5;
      ellipse(x, along, unit * 0.08, unit * 0.03, unit * 0.03);
      ellipse(x, along, height - unit * 0.08, unit * 0.03, unit * 0.03);
    }
    x.fillStyle = STAMP_COLORS[sign];
    x.fillRect(unit * 0.16, unit * 0.16, width - unit * 0.32, height - unit * 0.32);
    x.fillStyle = '#fbf6ea';
    x.strokeStyle = '#fbf6ea';
    x.lineWidth = unit * 0.05;
    if (sign === 'house') {
      x.beginPath();
      x.moveTo(cx - unit * 0.2, cy);
      x.lineTo(cx, cy - unit * 0.18);
      x.lineTo(cx + unit * 0.2, cy);
      x.closePath();
      x.fill();
      x.fillRect(cx - unit * 0.14, cy, unit * 0.28, unit * 0.18);
    } else if (sign === 'bowl') {
      x.beginPath();
      x.moveTo(cx - unit * 0.22, cy - unit * 0.02);
      x.quadraticCurveTo(cx, cy + unit * 0.3, cx + unit * 0.22, cy - unit * 0.02);
      x.closePath();
      x.fill();
      for (const steam of [-0.08, 0.04]) {
        x.beginPath();
        x.moveTo(cx + unit * steam, cy - unit * 0.06);
        x.quadraticCurveTo(
          cx + unit * (steam + 0.05),
          cy - unit * 0.14,
          cx + unit * steam,
          cy - unit * 0.22,
        );
        x.stroke();
      }
    } else if (sign === 'leaf') {
      x.beginPath();
      x.ellipse(cx, cy, unit * 0.12, unit * 0.22, 0.6, 0, Math.PI * 2);
      x.fill();
      x.strokeStyle = STAMP_COLORS.leaf;
      x.lineWidth = unit * 0.03;
      x.beginPath();
      x.moveTo(cx - unit * 0.12, cy + unit * 0.16);
      x.lineTo(cx + unit * 0.12, cy - unit * 0.16);
      x.stroke();
    } else {
      x.fillRect(cx - unit * 0.2, cy - unit * 0.16, unit * 0.18, unit * 0.32);
      x.fillRect(cx + unit * 0.02, cy - unit * 0.16, unit * 0.18, unit * 0.32);
      x.fillStyle = STAMP_COLORS.book;
      x.fillRect(cx - unit * 0.01, cy - unit * 0.16, unit * 0.02, unit * 0.32);
    }
  };
}
