// Maison Éventail, the luxury boutique downtown: Mlle Éventail the peahen, her shop front, and
// inside, the fitting room, the rack of scarves and her glass counter.

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

const GREEN = '#1f4a3d';
const GREEN_DARK = '#163a30';
const GOLD = '#d9aa3f';
const GOLD_LIGHT = '#f3d27a';
const VELVET = '#8e2b45';
// The colours of the scarves for sale, hanging on the rack and folded in the counter.
const SCARF_COLORS = ['#c8453a', '#f3c14b', '#f29bb8', '#2b3566'];

export const PEAHEN_SIZE = { width: 360, height: 380 };
export const PEAHEN_FACE = { x: 180, y: 232, size: 200 };

// Mlle Éventail, the peahen who keeps the boutique: deep blue, her tail spread in a fan of eyed
// feathers behind her, a crest of three plumes, a little beak, and a string of pearls.
export function drawPeahen(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 40;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // The tail, spread in a fan behind her, each feather ending in an eye.
  const fanX = cx;
  const fanY = bodyY + 20;
  for (let feather = 0; feather < 9; feather++) {
    const angle = Math.PI * (1.08 + (feather / 8) * 0.84);
    const tipX = fanX + Math.cos(angle) * 150;
    const tipY = fanY + Math.sin(angle) * 150;
    x.strokeStyle = '#2f8f6e';
    x.lineWidth = 26;
    x.beginPath();
    x.moveTo(fanX, fanY);
    x.lineTo(tipX, tipY);
    x.stroke();
    x.fillStyle = GOLD;
    ellipse(x, tipX, tipY, 19, 21);
    x.fillStyle = '#1f9a92';
    ellipse(x, tipX, tipY + 1, 14, 16);
    x.fillStyle = '#203a80';
    ellipse(x, tipX, tipY + 2, 8, 9);
  }
  // The crest: three plumes with round tips.
  x.strokeStyle = '#203a80';
  x.lineWidth = 3;
  for (const lean of [-14, 0, 14]) {
    x.beginPath();
    x.moveTo(cx + lean * 0.3, bodyY - 96);
    x.lineTo(cx + lean, bodyY - 136);
    x.stroke();
    x.fillStyle = '#1f9a92';
    ellipse(x, cx + lean, bodyY - 138, 6, 7);
  }
  roundBody(x, cx, bottom, { body: '#2f72b0', belly: '#4a92cf', feet: '#8a8f99' });
  // White marks round her eyes, and long lashes.
  x.fillStyle = '#f6efe6';
  for (const side of [-1, 1]) {
    ellipse(x, cx + side * 30, eyesY, 20, 13);
  }
  for (const side of [-1, 1]) {
    drawEye(x, cx + side * 30, eyesY + 1, eyes, { width: 9.5 });
    if (eyes === 'open') {
      x.strokeStyle = '#2c2a35';
      x.lineWidth = 2.5;
      for (const lash of [0, 1, 2]) {
        x.beginPath();
        x.moveTo(cx + side * (34 + lash * 4), eyesY - 12 + lash * 3);
        x.lineTo(cx + side * (42 + lash * 6), eyesY - 18 + lash * 4);
        x.stroke();
      }
    }
  }
  // Her beak.
  x.fillStyle = '#e9c38a';
  x.beginPath();
  x.moveTo(cx - 10, eyesY + 18);
  x.quadraticCurveTo(cx, eyesY + 12, cx + 10, eyesY + 18);
  x.lineTo(cx, eyesY + 34);
  x.closePath();
  x.fill();
  x.fillStyle = 'rgb(240 110 100 / 40%)';
  ellipse(x, cx - 52, eyesY + 22, 12, 7);
  ellipse(x, cx + 52, eyesY + 22, 12, 7);
  // A string of pearls.
  x.fillStyle = '#fbf6ea';
  for (let pearl = 0; pearl < 11; pearl++) {
    const angle = Math.PI * (0.18 + (pearl / 10) * 0.64);
    ellipse(x, cx + Math.cos(angle) * 62, bodyY - 4 + Math.sin(angle) * 30, 6, 6);
  }
}

// The boutique's front on the pavement: dark green with gold trim, a striped awning, its name on
// a gold sign, a window dressed with a scarf on a stand, and a glass door.
export function drawBoutiqueFront(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const top = 40;
    const left = 16;
    const right = width - 16;
    x.fillStyle = GREEN;
    x.fillRect(left, top, right - left, height - top);
    // A gold cornice, and gold pilasters at the corners.
    x.fillStyle = GOLD;
    x.fillRect(left - 10, top - 14, right - left + 20, 22);
    x.fillRect(left, top, 14, height - top);
    x.fillRect(right - 14, top, 14, height - top);
    // The sign.
    x.fillStyle = GREEN_DARK;
    roundedRect(x, width / 2 - 170, top + 22, 340, 62, 8);
    x.fill();
    x.strokeStyle = GOLD;
    x.lineWidth = 4;
    x.stroke();
    x.fillStyle = GOLD_LIGHT;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 40;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > 300 && size > 14);
    x.fillText(name, width / 2, top + 55);
    // The striped awning.
    const awningTop = top + 100;
    for (let stripe = 0; stripe < 12; stripe++) {
      x.fillStyle = stripe % 2 === 0 ? '#f6efe6' : GREEN_DARK;
      const stripeWidth = (right - left) / 12;
      x.beginPath();
      x.moveTo(left + stripe * stripeWidth, awningTop);
      x.lineTo(left + (stripe + 1) * stripeWidth, awningTop);
      x.lineTo(left + (stripe + 1) * stripeWidth, awningTop + 44);
      x.quadraticCurveTo(
        left + (stripe + 0.5) * stripeWidth,
        awningTop + 58,
        left + stripe * stripeWidth,
        awningTop + 44,
      );
      x.closePath();
      x.fill();
    }
    // The window, on the left, with a scarf on a stand.
    const windowTop = awningTop + 76;
    const windowLeft = left + 34;
    const windowWidth = width * 0.42;
    const windowBottom = height - 40;
    x.fillStyle = '#fff3d6';
    x.fillRect(windowLeft, windowTop, windowWidth, windowBottom - windowTop);
    x.fillStyle = 'rgb(217 170 63 / 25%)';
    ellipse(x, windowLeft + windowWidth / 2, windowTop + 40, windowWidth * 0.45, 40);
    const standX = windowLeft + windowWidth / 2;
    x.fillStyle = GOLD;
    x.fillRect(standX - 4, windowTop + 70, 8, windowBottom - windowTop - 80);
    x.fillRect(standX - 30, windowBottom - 12, 60, 8);
    x.fillStyle = '#e7ddd0';
    ellipse(x, standX, windowTop + 60, 28, 34);
    x.fillStyle = SCARF_COLORS[0];
    roundedRect(x, standX - 34, windowTop + 78, 68, 18, 8);
    x.fill();
    roundedRect(x, standX + 6, windowTop + 86, 16, 60, 6);
    x.fill();
    x.strokeStyle = GOLD;
    x.lineWidth = 8;
    x.strokeRect(windowLeft, windowTop, windowWidth, windowBottom - windowTop);
    // The glass door, on the right, with its gold handle.
    const doorWidth = 120;
    const doorX = width * 0.72;
    x.fillStyle = '#2b3a36';
    x.fillRect(doorX - doorWidth / 2, windowTop - 8, doorWidth, height - windowTop + 8);
    x.fillStyle = 'rgb(190 225 220 / 55%)';
    x.fillRect(doorX - doorWidth / 2 + 14, windowTop + 6, doorWidth - 28, height - windowTop - 40);
    x.strokeStyle = GOLD;
    x.lineWidth = 6;
    x.strokeRect(doorX - doorWidth / 2, windowTop - 8, doorWidth, height - windowTop + 8);
    x.fillStyle = GOLD_LIGHT;
    roundedRect(x, doorX + 30, windowTop + 90, 10, 50, 5);
    x.fill();
    // The step.
    x.fillStyle = '#d8d2c8';
    x.fillRect(left - 6, height - 16, right - left + 12, 16);
  };
}

// The boutique's walls inside: cream with fine gold stripes over a dark green panelling.
export function drawBoutiqueWall(): HTMLCanvasElement {
  const width = 1200;
  const height = 440;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#f4ead6';
  x.fillRect(0, 0, width, height);
  x.fillStyle = 'rgb(217 170 63 / 45%)';
  for (let stripe = 0; stripe < width; stripe += 48) {
    x.fillRect(stripe, 0, 4, height - 140);
  }
  x.fillStyle = GOLD;
  x.fillRect(0, 26, width, 10);
  x.fillStyle = GREEN;
  x.fillRect(0, height - 140, width, 140);
  x.fillStyle = GOLD;
  x.fillRect(0, height - 146, width, 8);
  x.strokeStyle = GOLD;
  x.lineWidth = 3;
  for (let panel = 20; panel < width; panel += 150) {
    x.strokeRect(panel, height - 118, 120, 96);
  }
  addGrain(canvas, 6, 231);
  return canvas;
}

// Its floor: polished marble in black and white squares.
export function drawBoutiqueFloor(): HTMLCanvasElement {
  const width = 1200;
  const height = 420;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const tile = 70;
  for (let row = 0; row * tile < height; row++) {
    for (let column = 0; column * tile < width; column++) {
      x.fillStyle = (row + column) % 2 === 0 ? '#f2eee6' : '#3a3b40';
      x.fillRect(column * tile, row * tile, tile, tile);
    }
  }
  x.fillStyle = 'rgb(255 255 255 / 12%)';
  x.fillRect(0, 0, width, height / 3);
  addGrain(canvas, 6, 232);
  return canvas;
}

// The fitting room: a booth of dark green and gold, its velvet curtain drawn back, a mirror and a
// hanger inside.
export function drawFittingRoom(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const top = 30;
  x.fillStyle = GREEN;
  x.fillRect(0, top, width, height - top);
  x.fillStyle = '#2b3a36';
  x.fillRect(16, top + 30, width - 32, height - top - 40);
  // The mirror at the back, and a hanger on its hook.
  x.fillStyle = '#cfe3ea';
  roundedRect(x, width / 2 - 34, top + 60, 68, height - top - 120, 30);
  x.fill();
  x.fillStyle = 'rgb(255 255 255 / 55%)';
  roundedRect(x, width / 2 - 24, top + 72, 10, height - top - 150, 5);
  x.fill();
  x.strokeStyle = GOLD;
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(width / 2 - 22, top + 50);
  x.lineTo(width / 2, top + 38);
  x.lineTo(width / 2 + 22, top + 50);
  x.closePath();
  x.stroke();
  // The curtain, drawn back to the right in heavy folds.
  x.fillStyle = VELVET;
  x.beginPath();
  x.moveTo(width - 70, top + 20);
  x.lineTo(width - 8, top + 20);
  x.lineTo(width - 8, height - 6);
  x.quadraticCurveTo(width - 40, height - 30, width - 54, height - 6);
  x.quadraticCurveTo(width - 46, height * 0.55, width - 70, top + 20);
  x.fill();
  x.strokeStyle = 'rgb(0 0 0 / 22%)';
  x.lineWidth = 3;
  for (const fold of [22, 38]) {
    x.beginPath();
    x.moveTo(width - 8 - fold, top + 24);
    x.lineTo(width - 8 - fold * 0.8, height - 14);
    x.stroke();
  }
  x.fillStyle = GOLD_LIGHT;
  ellipse(x, width - 44, height * 0.5, 9, 6);
  // The rail and the gold crown on top.
  x.fillStyle = GOLD;
  x.fillRect(0, top, width, 18);
  x.fillRect(width / 2 - 30, top - 26, 60, 26);
  x.fillStyle = GOLD_LIGHT;
  ellipse(x, width / 2, top - 30, 10, 10);
}

// A gold rail on its stand, with the four scarves for sale draped over it.
export function drawScarfRack(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const railY = 40;
  x.fillStyle = GOLD;
  x.fillRect(16, railY - 6, width - 32, 10);
  x.fillRect(22, railY, 8, height - railY - 14);
  x.fillRect(width - 30, railY, 8, height - railY - 14);
  x.fillRect(6, height - 16, 40, 10);
  x.fillRect(width - 46, height - 16, 40, 10);
  const spacing = (width - 80) / SCARF_COLORS.length;
  for (const [index, color] of SCARF_COLORS.entries()) {
    const scarfX = 48 + index * spacing;
    x.fillStyle = color;
    roundedRect(x, scarfX, railY - 4, 22, 130 + (index % 2) * 24, 8);
    x.fill();
    roundedRect(x, scarfX + 20, railY - 4, 20, 104 + (index % 2) * 18, 8);
    x.fill();
    x.fillStyle = 'rgb(0 0 0 / 15%)';
    x.fillRect(scarfX, railY + 4, 40, 8);
  }
}

// Mlle Éventail's counter: glass over gold, folded scarves inside, a bell on top.
export function drawBoutiqueCounter(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  const top = 40;
  x.fillStyle = GOLD;
  x.fillRect(0, top, width, 14);
  x.fillStyle = 'rgb(190 225 220 / 70%)';
  x.fillRect(10, top + 14, width - 20, height - top - 40);
  x.strokeStyle = GOLD;
  x.lineWidth = 6;
  x.strokeRect(10, top + 14, width - 20, height - top - 40);
  const spacing = (width - 60) / SCARF_COLORS.length;
  for (const [index, color] of SCARF_COLORS.entries()) {
    x.fillStyle = color;
    roundedRect(x, 30 + index * spacing, height - 70, spacing - 14, 30, 6);
    x.fill();
    x.fillStyle = 'rgb(255 255 255 / 25%)';
    x.fillRect(30 + index * spacing, height - 62, spacing - 14, 5);
  }
  x.fillStyle = GREEN_DARK;
  x.fillRect(0, height - 26, width, 26);
  // A little bell.
  x.fillStyle = GOLD_LIGHT;
  x.beginPath();
  x.arc(width - 50, top, 16, Math.PI, 0);
  x.fill();
  ellipse(x, width - 50, top - 18, 4, 4);
}
