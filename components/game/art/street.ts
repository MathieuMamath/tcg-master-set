// The village street: our house, the shop fronts, the hills behind and the sky's clouds and stars.

import { addGrain, context, createCanvas, ellipse, roundedRect, seededRandom } from './core';

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
