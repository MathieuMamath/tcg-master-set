// Bérénice the goat, her raffle stand, and the fair behind her Pop'Balloons.

import {
  addGrain,
  context,
  createCanvas,
  cutOut,
  drawEye,
  type Eyes,
  ellipse,
  pasteCutOut,
  roundBody,
  roundedRect,
  WOOD_DARK,
} from './core';
import { drawCloud } from './street';

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

export const FAIR_SCENERY_SIZE = { width: 900, height: 420 };

// The sky over Bérénice's stand for Pop'Balloons: clouds, a garland of bunting across the top, the
// village's roofs far below, and the grass the balloons rise from.
export function drawFairScenery(): HTMLCanvasElement {
  const { width, height } = FAIR_SCENERY_SIZE;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const sky = x.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#9fd0ec');
  sky.addColorStop(1, '#e8f3ee');
  x.fillStyle = sky;
  x.fillRect(0, 0, width, height);
  const cloud = cutOut(160, 90, drawCloud('#fbfbf6'), 5, 431);
  for (const [cloudX, cloudY, size] of [
    [140, 150, 50],
    [470, 110, 40],
    [760, 180, 46],
  ]) {
    pasteCutOut(x, cloud, cloudX, cloudY + size, size);
  }
  // The village's roofs, far below.
  const roofs = ['#c8453a', '#4f5d70', '#8a5a34', '#d9603a'];
  for (let house = 0; house < 12; house++) {
    const houseX = house * 80 + 10;
    const houseHeight = 40 + ((house * 37) % 30);
    x.fillStyle = '#efe2c8';
    x.fillRect(houseX, height - 60 - houseHeight, 60, houseHeight);
    x.fillStyle = roofs[house % roofs.length];
    x.beginPath();
    x.moveTo(houseX - 6, height - 60 - houseHeight);
    x.lineTo(houseX + 30, height - 84 - houseHeight);
    x.lineTo(houseX + 66, height - 60 - houseHeight);
    x.closePath();
    x.fill();
  }
  x.fillStyle = '#8cbf5f';
  x.fillRect(0, height - 60, width, 60);
  x.fillStyle = '#7fb35a';
  x.fillRect(0, height - 60, width, 8);
  // A garland of bunting across the top.
  x.strokeStyle = '#6b4a2e';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(0, 18);
  x.quadraticCurveTo(width / 2, 70, width, 18);
  x.stroke();
  const flags = ['#d0443a', '#f0c43a', '#3c78b4', '#4f8a3c'];
  for (let flag = 0; flag < 18; flag++) {
    const share = (flag + 0.5) / 18;
    const flagX = share * width;
    const flagY = 18 + 4 * 52 * share * (1 - share);
    x.fillStyle = flags[flag % flags.length];
    x.beginPath();
    x.moveTo(flagX - 16, flagY);
    x.lineTo(flagX + 16, flagY);
    x.lineTo(flagX, flagY + 30);
    x.closePath();
    x.fill();
  }
  addGrain(canvas, 8, 432);
  return canvas;
}

// --- Pinceau's easel, at Linden Park. ------------------------------------------------------------
