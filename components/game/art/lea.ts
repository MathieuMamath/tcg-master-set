// Léa the rabbit, her block of flats and her dusty flat.

import { ellipse, roundedRect, seededRandom, WOOD, WOOD_DARK } from './core';

// Where Léa's face sits in her drawing, to frame it in a portrait.
export const LEA_SIZE = { width: 340, height: 360 };
export const LEA_FACE = { x: 170, y: 160, size: 190 };

// Léa, the young rabbit next door, too busy with work to dust: her ears droop with tiredness, a
// pencil holds her bun, and square glasses hide her eyes behind the glare of her screen. She sits
// at her desk, behind her laptop, with a coffee and sticky notes.
export function drawLea(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 36;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 36;
  const headTop = bodyY - 100;
  // Drooping ears.
  for (const side of [-1, 1]) {
    x.save();
    x.translate(cx + side * 50, bodyY - 72);
    x.rotate(side * 0.9);
    x.fillStyle = '#d8cfc4';
    ellipse(x, 0, -36, 18, 50);
    x.fillStyle = '#f2b8c6';
    ellipse(x, 0, -34, 9, 36);
    x.restore();
  }
  // Body and pale belly.
  x.fillStyle = '#e6ded4';
  ellipse(x, cx, bodyY, 90, 100);
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#fbf6ea';
  ellipse(x, cx, bottom - 44, 60, 70);
  x.restore();
  // The bun, held by a pencil.
  x.fillStyle = '#c9c0b4';
  ellipse(x, cx + 8, headTop + 4, 26, 22);
  x.save();
  x.translate(cx + 8, headTop + 2);
  x.rotate(-0.6);
  x.fillStyle = '#f3c14b';
  x.fillRect(-36, -3, 62, 7);
  x.fillStyle = '#e8a0a0';
  x.fillRect(26, -3, 8, 7);
  x.fillStyle = '#2c2a35';
  x.beginPath();
  x.moveTo(-36, -3);
  x.lineTo(-46, 0.5);
  x.lineTo(-36, 4);
  x.fill();
  x.restore();
  // Cheeks and nose.
  x.fillStyle = 'rgb(240 110 100 / 45%)';
  ellipse(x, cx - 50, eyesY + 24, 12, 7);
  ellipse(x, cx + 50, eyesY + 24, 12, 7);
  x.fillStyle = '#e07c8c';
  ellipse(x, cx, eyesY + 14, 7, 5);
  // Square glasses that can't be seen through, white with the screen's glare.
  for (const side of [-1, 1]) {
    const left = cx + side * 27 - 20;
    x.fillStyle = '#2c2a35';
    roundedRect(x, left, eyesY - 15, 40, 30, 5);
    x.fill();
    x.fillStyle = '#b9d6e8';
    roundedRect(x, left + 4, eyesY - 11, 32, 22, 3);
    x.fill();
    x.fillStyle = 'rgb(255 255 255 / 85%)';
    x.beginPath();
    x.moveTo(left + 8, eyesY + 9);
    x.lineTo(left + 22, eyesY - 9);
    x.lineTo(left + 29, eyesY - 9);
    x.lineTo(left + 15, eyesY + 9);
    x.fill();
  }
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(cx - 7, eyesY - 4);
  x.lineTo(cx + 7, eyesY - 4);
  x.stroke();
  // The desk.
  const top = height - 70;
  x.fillStyle = WOOD;
  roundedRect(x, cx - 150, top, 300, 16, 5);
  x.fill();
  x.fillStyle = WOOD_DARK;
  x.fillRect(cx - 138, top + 16, 16, height - top - 16);
  x.fillRect(cx + 122, top + 16, 16, height - top - 16);
  // The laptop, its lid towards us, with a sticker.
  x.fillStyle = '#9aa3ae';
  roundedRect(x, cx - 70, top - 92, 140, 94, 8);
  x.fill();
  x.fillStyle = '#b8c0c9';
  roundedRect(x, cx - 62, top - 84, 124, 78, 5);
  x.fill();
  x.fillStyle = '#e07c8c';
  ellipse(x, cx, top - 46, 13, 13);
  x.fillStyle = '#fbf6ea';
  ellipse(x, cx, top - 46, 6, 6);
  x.fillStyle = '#7c8590';
  x.fillRect(cx - 78, top - 4, 156, 6);
  // A mug of steaming coffee.
  x.fillStyle = '#fbf6ea';
  roundedRect(x, cx + 88, top - 34, 30, 34, 4);
  x.fill();
  x.strokeStyle = '#fbf6ea';
  x.lineWidth = 5;
  x.beginPath();
  x.arc(cx + 122, top - 18, 8, -1.2, 1.2);
  x.stroke();
  x.fillStyle = '#e07c8c';
  x.fillRect(cx + 88, top - 22, 30, 6);
  x.strokeStyle = 'rgb(160 160 170 / 70%)';
  x.lineWidth = 3;
  for (const shift of [0, 10]) {
    x.beginPath();
    x.moveTo(cx + 97 + shift, top - 40);
    x.quadraticCurveTo(cx + 91 + shift, top - 52, cx + 99 + shift, top - 62);
    x.stroke();
  }
  // Sticky notes.
  for (const [dx, dy, color, turn] of [
    [-130, -30, '#f3c14b', -0.1],
    [-112, -44, '#9ed6a0', 0.12],
    [-128, -58, '#f2b8c6', -0.05],
  ] as const) {
    x.save();
    x.translate(cx + dx, top + dy);
    x.rotate(turn);
    x.fillStyle = color;
    x.fillRect(0, 0, 26, 26);
    x.restore();
  }
}

// Léa's block of flats: three storeys of pastel brick, window boxes of flowers, and a door at the
// bottom right.
// A drop of sweat, for someone overworked.
export function drawSweatDrop(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  const radius = width / 2;
  x.fillStyle = '#8cc8ee';
  x.beginPath();
  x.moveTo(cx, 0);
  x.quadraticCurveTo(cx + radius * 0.9, height * 0.45, cx + radius, height - radius);
  x.arc(cx, height - radius, radius, 0, Math.PI);
  x.quadraticCurveTo(cx - radius * 0.9, height * 0.45, cx, 0);
  x.fill();
  x.fillStyle = 'rgb(255 255 255 / 75%)';
  ellipse(x, cx - radius * 0.35, height - radius * 1.1, radius * 0.22, radius * 0.38);
}

export function drawFlats(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const random = seededRandom(31);
  const left = 14;
  const right = width - 14;
  const top = 26;
  x.fillStyle = '#e9b8a4';
  x.fillRect(left, top, right - left, height - top);
  // Bricks, a few lighter than the others.
  for (let row = top + 8; row < height - 30; row += 18) {
    for (let column = left + ((row / 18) % 2) * 20; column < right - 30; column += 40) {
      if (random() < 0.3) {
        x.fillStyle = 'rgb(255 255 255 / 18%)';
        x.fillRect(column, row, 34, 12);
      }
    }
  }
  // The roof's edge.
  x.fillStyle = '#7f5530';
  x.fillRect(left - 10, top - 14, right - left + 20, 18);
  // Windows on three floors, with flower boxes.
  const windowWidth = 70;
  const windowHeight = 78;
  for (let floor = 0; floor < 3; floor++) {
    for (let column = 0; column < 3; column++) {
      if (floor === 2 && column === 2) {
        continue;
      }
      const windowLeft = left + 34 + column * 132;
      const windowTop = top + 26 + floor * 112;
      x.fillStyle = '#fbf6ea';
      roundedRect(x, windowLeft - 7, windowTop - 7, windowWidth + 14, windowHeight + 14, 6);
      x.fill();
      x.fillStyle = '#8cc3e6';
      x.fillRect(windowLeft, windowTop, windowWidth, windowHeight);
      x.fillStyle = '#fbf6ea';
      x.fillRect(windowLeft + windowWidth / 2 - 3, windowTop, 6, windowHeight);
      x.fillStyle = 'rgb(255 255 255 / 35%)';
      x.fillRect(windowLeft + 8, windowTop + 6, 8, windowHeight - 12);
      x.fillStyle = WOOD;
      x.fillRect(windowLeft - 6, windowTop + windowHeight + 6, windowWidth + 12, 12);
      for (let flower = 0; flower < 5; flower++) {
        x.fillStyle = ['#e8645a', '#f3c14b', '#9a7bd6'][flower % 3];
        ellipse(x, windowLeft + 4 + flower * 15, windowTop + windowHeight + 4, 6, 6);
      }
    }
  }
  // The front door, under a little awning.
  const doorWidth = 96;
  const doorLeft = right - doorWidth - 30;
  const doorTop = height - 150;
  x.fillStyle = '#5e8c6a';
  x.fillRect(doorLeft - 16, doorTop - 22, doorWidth + 32, 16);
  x.fillStyle = '#fbf6ea';
  roundedRect(x, doorLeft - 8, doorTop - 6, doorWidth + 16, height - doorTop + 6, 6);
  x.fill();
  x.fillStyle = '#3f6b52';
  x.fillRect(doorLeft, doorTop, doorWidth, height - doorTop);
  x.fillStyle = '#8cc3e6';
  x.fillRect(doorLeft + 14, doorTop + 14, doorWidth - 28, 54);
  x.fillStyle = '#f3c14b';
  ellipse(x, doorLeft + doorWidth - 14, doorTop + 90, 5, 5);
}

// A soft sofa with two cushions.
export function drawSofa(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const seat = height * 0.55;
  x.fillStyle = WOOD_DARK;
  x.fillRect(24, height - 18, 14, 18);
  x.fillRect(width - 38, height - 18, 14, 18);
  x.fillStyle = '#6a8fb8';
  roundedRect(x, 10, 10, width - 20, seat, 20);
  x.fill();
  x.fillStyle = '#7ea3cc';
  roundedRect(x, 0, seat - 20, width, height - seat, 16);
  x.fill();
  x.fillStyle = '#5a7fa8';
  roundedRect(x, 0, seat - 40, 40, height - seat + 20, 14);
  x.fill();
  roundedRect(x, width - 40, seat - 40, 40, height - seat + 20, 14);
  x.fill();
  for (const [cushionX, color] of [
    [70, '#f3c14b'],
    [width - 130, '#e8645a'],
  ] as const) {
    x.fillStyle = color;
    roundedRect(x, cushionX, seat - 64, 60, 52, 12);
    x.fill();
  }
}

// A patch of dust on the wall: a grey cloud with a few darker specks.
export function drawDust(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const random = seededRandom(37);
  x.fillStyle = 'rgb(120 112 104 / 55%)';
  for (let puff = 0; puff < 9; puff++) {
    ellipse(
      x,
      width * (0.25 + random() * 0.5),
      height * (0.3 + random() * 0.4),
      width * (0.12 + random() * 0.12),
      height * (0.12 + random() * 0.12),
    );
  }
  x.fillStyle = 'rgb(80 72 66 / 60%)';
  for (let speck = 0; speck < 14; speck++) {
    ellipse(x, width * (0.15 + random() * 0.7), height * (0.15 + random() * 0.7), 2.5, 2.5);
  }
}

// A picture in a wooden frame: a little landscape of hills under the sun.
export function drawFrame(color: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    x.fillStyle = WOOD;
    roundedRect(x, 0, 0, width, height, 6);
    x.fill();
    x.fillStyle = '#d7ecf4';
    x.fillRect(10, 10, width - 20, height - 20);
    x.fillStyle = color;
    ellipse(x, width * 0.35, height - 10, width * 0.4, height * 0.3);
    ellipse(x, width * 0.75, height - 10, width * 0.35, height * 0.22);
    x.fillStyle = '#f7cb52';
    ellipse(x, width * 0.7, height * 0.35, 9, 9);
  };
}
