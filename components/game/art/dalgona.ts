// Gaspard the fox and his dalgona stand.

import { drawEye, type Eyes, ellipse, roundedRect, WOOD, WOOD_DARK, WOOD_LIGHT } from './core';

export const GASPARD_SIZE = { width: 300, height: 420 };
export const GASPARD_FACE = { x: 150, y: 150, size: 190 };

const GASPARD_FUR = '#c8582e';
const GASPARD_CREAM = '#fbf1e1';
const GASPARD_INK = '#3a2219';

// Gaspard, the slim fox who keeps the dalgona stand: a straw boater, a striped waistcoat and a bow
// tie, the look of a fairground barker. He is sly but never mean: half-shut eyes, one eyebrow up
// and a crooked smile, as if he knew something you don't.
export function drawGaspard(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const bodyY = bottom - 150;
  const headY = bottom - 270;
  const eyesY = headY - 12;
  x.lineCap = 'round';
  x.lineJoin = 'round';

  // His bushy tail, curling up on his left, with its pale tip.
  x.fillStyle = GASPARD_FUR;
  x.beginPath();
  x.moveTo(cx + 30, bottom - 80);
  x.bezierCurveTo(cx + 150, bottom - 90, cx + 150, bottom - 230, cx + 96, bottom - 262);
  x.bezierCurveTo(cx + 110, bottom - 210, cx + 90, bottom - 150, cx + 36, bottom - 132);
  x.closePath();
  x.fill();
  x.fillStyle = GASPARD_CREAM;
  x.beginPath();
  x.moveTo(cx + 96, bottom - 262);
  x.quadraticCurveTo(cx + 132, bottom - 236, cx + 128, bottom - 206);
  x.quadraticCurveTo(cx + 112, bottom - 226, cx + 101, bottom - 230);
  x.closePath();
  x.fill();

  // Long thin legs.
  x.fillStyle = GASPARD_INK;
  for (const side of [-1, 1]) {
    roundedRect(x, cx + side * 22 - 9, bottom - 96, 18, 90, 8);
    x.fill();
    ellipse(x, cx + side * 26, bottom - 8, 22, 9);
  }

  // A slim body, with his pale chest showing between the sides of his waistcoat.
  x.fillStyle = GASPARD_FUR;
  ellipse(x, cx, bodyY, 58, 96);
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 58, 96, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = GASPARD_CREAM;
  ellipse(x, cx, bodyY + 10, 34, 80);
  // The waistcoat, striped, open in a V down the front.
  for (const side of [-1, 1]) {
    x.fillStyle = '#3d6b4f';
    x.beginPath();
    x.moveTo(cx + side * 70, bodyY - 80);
    x.lineTo(cx + side * 10, bodyY - 70);
    x.lineTo(cx + side * 4, bodyY + 30);
    x.lineTo(cx + side * 70, bodyY + 60);
    x.closePath();
    x.fill();
    x.strokeStyle = 'rgb(251 241 225 / 35%)';
    x.lineWidth = 3;
    for (let stripe = 1; stripe < 6; stripe++) {
      x.beginPath();
      x.moveTo(cx + side * (10 + stripe * 11), bodyY - 76);
      x.lineTo(cx + side * (6 + stripe * 12), bodyY + 50);
      x.stroke();
    }
  }
  x.restore();
  x.fillStyle = '#f3c14b';
  for (const buttonY of [bodyY - 30, bodyY - 5, bodyY + 20]) {
    ellipse(x, cx - 14, buttonY, 4, 4);
  }

  // A red bow tie at his neck.
  x.fillStyle = '#d0443a';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx, bodyY - 84);
    x.lineTo(cx + side * 22, bodyY - 96);
    x.lineTo(cx + side * 22, bodyY - 70);
    x.closePath();
    x.fill();
  }
  ellipse(x, cx, bodyY - 83, 6, 6);

  // Tall pointed ears, dark at their tips.
  for (const side of [-1, 1]) {
    x.fillStyle = GASPARD_FUR;
    x.beginPath();
    x.moveTo(cx + side * 16, headY - 30);
    x.lineTo(cx + side * 58, headY - 120);
    x.lineTo(cx + side * 56, headY - 10);
    x.closePath();
    x.fill();
    x.fillStyle = '#f2c3a0';
    x.beginPath();
    x.moveTo(cx + side * 30, headY - 36);
    x.lineTo(cx + side * 56, headY - 96);
    x.lineTo(cx + side * 54, headY - 30);
    x.closePath();
    x.fill();
    x.fillStyle = GASPARD_INK;
    x.beginPath();
    x.moveTo(cx + side * 52, headY - 100);
    x.lineTo(cx + side * 58, headY - 120);
    x.lineTo(cx + side * 61, headY - 98);
    x.closePath();
    x.fill();
  }

  // His head, with fluffy cheeks and a long pale muzzle.
  x.fillStyle = GASPARD_FUR;
  ellipse(x, cx, headY, 66, 54);
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 50, headY - 6);
    x.lineTo(cx + side * 84, headY + 24);
    x.lineTo(cx + side * 40, headY + 34);
    x.closePath();
    x.fill();
  }
  x.fillStyle = GASPARD_CREAM;
  ellipse(x, cx, headY + 26, 40, 24);
  x.fillStyle = GASPARD_INK;
  ellipse(x, cx, headY + 14, 9, 6);

  // Half-shut eyes: their lids hang low, and they shut altogether when he blinks.
  for (const side of [-1, 1]) {
    const eyeX = cx + side * 26;
    if (eyes === 'shut') {
      drawEye(x, eyeX, eyesY, 'shut', { color: GASPARD_INK });
      continue;
    }
    drawEye(x, eyeX, eyesY, 'open', { color: GASPARD_INK, width: 8 });
    x.fillStyle = GASPARD_FUR;
    ellipse(x, eyeX, eyesY - 10, 13, 9);
    x.strokeStyle = GASPARD_INK;
    x.lineWidth = 3;
    x.beginPath();
    x.moveTo(eyeX - 11, eyesY - 3);
    x.quadraticCurveTo(eyeX, eyesY - 6, eyeX + 11, eyesY - 3);
    x.stroke();
  }
  // One eyebrow raised, the other flat.
  x.strokeStyle = GASPARD_INK;
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(cx - 40, eyesY - 26);
  x.quadraticCurveTo(cx - 28, eyesY - 38, cx - 14, eyesY - 30);
  x.stroke();
  x.beginPath();
  x.moveTo(cx + 14, eyesY - 18);
  x.lineTo(cx + 38, eyesY - 20);
  x.stroke();
  // A crooked smile, higher on one side.
  x.lineWidth = 3.5;
  x.beginPath();
  x.moveTo(cx - 16, headY + 30);
  x.quadraticCurveTo(cx + 2, headY + 40, cx + 20, headY + 24);
  x.stroke();
  x.strokeStyle = 'rgb(58 34 25 / 55%)';
  x.lineWidth = 1.5;
  for (const side of [-1, 1]) {
    for (const tilt of [-1, 1]) {
      x.beginPath();
      x.moveTo(cx + side * 34, headY + 22 + tilt * 3);
      x.lineTo(cx + side * 70, headY + 18 + tilt * 9);
      x.stroke();
    }
  }

  // His arms, in the cream sleeves of his shirt, ending in dark paws. One is folded up, its paw
  // under his chin as if weighing you up; the other holds up the carving needle.
  // A sleeve from the shoulder to the elbow, then the forearm to the paw.
  const sleeve = (points: readonly (readonly [number, number])[]) => {
    const [shoulder, elbow, wrist] = points;
    for (const [color, thickness] of [
      ['#d8c3a0', 22],
      [GASPARD_CREAM, 16],
    ] as const) {
      x.strokeStyle = color;
      x.lineWidth = thickness;
      x.beginPath();
      x.moveTo(shoulder[0], shoulder[1]);
      x.lineTo(elbow[0], elbow[1]);
      x.lineTo(wrist[0], wrist[1]);
      x.stroke();
    }
  };
  sleeve([
    [cx + 44, bodyY - 62],
    [cx + 66, bodyY - 8],
    [cx + 32, headY + 54],
  ]);
  x.fillStyle = GASPARD_INK;
  ellipse(x, cx + 26, headY + 47, 16, 13);
  // His paw's fingers, curled under his chin.
  x.strokeStyle = 'rgb(251 241 225 / 35%)';
  x.lineWidth = 1.5;
  for (const finger of [-5, 2, 9]) {
    x.beginPath();
    x.moveTo(cx + 20 + finger, headY + 40);
    x.lineTo(cx + 20 + finger, headY + 46);
    x.stroke();
  }
  // The needle, held up beside him.
  x.strokeStyle = '#9a9aa6';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(cx - 72, bodyY - 58);
  x.lineTo(cx - 88, bodyY - 124);
  x.stroke();
  x.fillStyle = '#d0443a';
  ellipse(x, cx - 89, bodyY - 128, 5, 5);
  sleeve([
    [cx - 44, bodyY - 62],
    [cx - 76, bodyY - 10],
    [cx - 74, bodyY - 50],
  ]);
  x.fillStyle = GASPARD_INK;
  ellipse(x, cx - 73, bodyY - 48, 13, 12);

  // A straw boater with a red band, worn at an angle.
  x.save();
  x.translate(cx - 4, headY - 46);
  x.rotate(-0.14);
  x.fillStyle = '#e8c87a';
  ellipse(x, 0, 0, 62, 12);
  roundedRect(x, -38, -34, 76, 34, 6);
  x.fill();
  x.fillStyle = '#d0443a';
  x.fillRect(-38, -14, 76, 10);
  x.strokeStyle = 'rgb(140 100 40 / 45%)';
  x.lineWidth = 1.5;
  for (let straw = -30; straw <= 30; straw += 10) {
    x.beginPath();
    x.moveTo(straw, -32);
    x.lineTo(straw, -16);
    x.stroke();
  }
  x.restore();
}

// The back of Gaspard's stand, behind him: two poles and a striped awning with a scalloped edge.
export function drawDalgonaAwning(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  x.fillStyle = WOOD_DARK;
  for (const poleX of [18, width - 30]) {
    roundedRect(x, poleX, 60, 12, height - 60, 4);
    x.fill();
  }
  const stripes = 8;
  const stripeWidth = width / stripes;
  for (let stripe = 0; stripe < stripes; stripe++) {
    x.fillStyle = stripe % 2 === 0 ? '#d0443a' : '#fbf1e1';
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

// The front of the stand, before him: a wooden cart on wheels, its name painted on the front, with
// a little burner and its ladle for the caramel, and a tray of biscuits waiting to be carved.
export function drawDalgonaCart(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const top = 46;
    // The burner and its ladle of caramel, on the left.
    x.fillStyle = '#5a5a66';
    roundedRect(x, 26, top - 26, 60, 26, 6);
    x.fill();
    x.fillStyle = '#f08a3a';
    ellipse(x, 56, top - 28, 20, 5);
    x.strokeStyle = '#8a8a96';
    x.lineWidth = 5;
    x.beginPath();
    x.moveTo(56, top - 34);
    x.lineTo(16, top - 30);
    x.stroke();
    x.fillStyle = WOOD_DARK;
    roundedRect(x, 4, top - 36, 18, 12, 6);
    x.fill();
    x.fillStyle = '#8a8a96';
    ellipse(x, 56, top - 34, 18, 7);
    x.fillStyle = '#e0a03a';
    ellipse(x, 56, top - 36, 13, 4);
    // A tray of round caramel biscuits, a shape pressed into each.
    x.fillStyle = WOOD_DARK;
    roundedRect(x, width - 150, top - 12, 128, 12, 3);
    x.fill();
    for (const [index, offset] of [0, 42, 84].entries()) {
      const biscuitX = width - 128 + offset;
      x.fillStyle = '#e0a03a';
      ellipse(x, biscuitX, top - 16, 18, 7);
      x.strokeStyle = '#a8661f';
      x.lineWidth = 2;
      x.beginPath();
      if (index === 0) {
        x.moveTo(biscuitX - 7, top - 13);
        x.lineTo(biscuitX, top - 20);
        x.lineTo(biscuitX + 7, top - 13);
        x.closePath();
      } else {
        x.ellipse(biscuitX, top - 16, 7, 3, 0, 0, Math.PI * 2);
      }
      x.stroke();
    }
    // The cart.
    x.fillStyle = WOOD_DARK;
    roundedRect(x, 0, top, width, 16, 5);
    x.fill();
    x.fillStyle = WOOD;
    x.fillRect(10, top + 16, width - 20, height - top - 46);
    x.fillStyle = '#fbf1e1';
    roundedRect(x, 30, top + 28, width - 60, 50, 8);
    x.fill();
    x.fillStyle = '#d0443a';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 38;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > width - 90 && size > 14);
    x.fillText(name, width / 2, top + 55);
    // Two wheels.
    for (const wheelX of [56, width - 56]) {
      x.fillStyle = WOOD_DARK;
      ellipse(x, wheelX, height - 26, 24, 24);
      x.fillStyle = WOOD_LIGHT;
      ellipse(x, wheelX, height - 26, 8, 8);
    }
  };
}
