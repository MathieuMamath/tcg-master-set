// The arcade: its neon front, its carpet and its machines.

import { addGrain, context, createCanvas, ellipse, roundedRect, seededRandom } from './core';

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
