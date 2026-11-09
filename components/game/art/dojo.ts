// Maître Kaito's dojo: the badger, the dojo inside and out, and his lessons' targets and throws.

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

const DOJO_WOOD = '#6b4a2e';
const DOJO_WOOD_DARK = '#3f2a1c';
const DOJO_PLASTER = '#f1e8d6';
const BADGER_GREY = '#8a8a90';
const BADGER_DARK = '#2f2d33';
const BADGER_WHITE = '#f4f1ea';
const GI_WHITE = '#fbf8f1';

export const DOJO_MASTER_SIZE = { width: 320, height: 300 };
export const DOJO_MASTER_FACE = { x: 146, y: 130, size: 200 };

// Maître Kaito, the old badger who keeps the dojo: grey fur, the white stripe down his face
// between two dark bands, small rounded ears, bushy white brows and a little beard, a white gi
// with a worn black belt, and a wooden sword resting on his shoulder.
export function drawDojoMaster(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2 - 14;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 36;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // His wooden sword, its handle in his paw and its blade leaning up past his shoulder.
  x.save();
  x.translate(cx + 80, bodyY + 52);
  x.rotate(0.3);
  x.fillStyle = '#c99a5b';
  roundedRect(x, -8, -190, 16, 190, 7);
  x.fill();
  x.fillStyle = '#3a2a20';
  roundedRect(x, -9, -26, 18, 34, 5);
  x.fill();
  x.fillStyle = '#2c2a35';
  roundedRect(x, -16, -32, 32, 8, 3);
  x.fill();
  x.restore();
  // Small rounded ears, dark with a white rim, their bases sunk behind the head.
  for (const side of [-1, 1]) {
    const earX = cx + side * 60;
    const earY = bodyY - 82;
    x.fillStyle = BADGER_WHITE;
    ellipse(x, earX, earY, 22, 19);
    x.fillStyle = BADGER_DARK;
    ellipse(x, earX, earY + 2, 14, 12);
  }
  roundBody(x, cx, bottom, { body: BADGER_GREY, belly: '#a9a9ae', feet: BADGER_DARK });
  // The face: dark bands from the nose up over the eyes, the white stripe between them, and white
  // cheeks outside, all clipped to the head.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = BADGER_WHITE;
  for (const side of [-1, 1]) {
    ellipse(x, cx + side * 56, eyesY + 24, 26, 22);
  }
  x.fillStyle = BADGER_DARK;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 10, eyesY + 30);
    x.quadraticCurveTo(cx + side * 40, eyesY + 14, cx + side * 46, eyesY - 30);
    x.lineTo(cx + side * 40, bodyY - 110);
    x.lineTo(cx + side * 14, bodyY - 110);
    x.quadraticCurveTo(cx + side * 16, eyesY - 10, cx + side * 6, eyesY + 22);
    x.closePath();
    x.fill();
  }
  x.fillStyle = BADGER_WHITE;
  x.beginPath();
  x.moveTo(cx - 13, bodyY - 110);
  x.lineTo(cx + 13, bodyY - 110);
  x.quadraticCurveTo(cx + 14, eyesY, cx + 12, eyesY + 26);
  x.lineTo(cx - 12, eyesY + 26);
  x.quadraticCurveTo(cx - 14, eyesY, cx - 13, bodyY - 110);
  x.fill();
  ellipse(x, cx, eyesY + 36, 30, 20);
  x.restore();
  // His gi: white, crossed left over right, with wide sleeves, and the black belt knotted in front.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = GI_WHITE;
  x.fillRect(cx - 100, bodyY + 4, 200, 120);
  x.fillStyle = '#a9a9ae';
  x.beginPath();
  x.moveTo(cx - 24, bodyY + 4);
  x.lineTo(cx, bodyY + 40);
  x.lineTo(cx + 24, bodyY + 4);
  x.closePath();
  x.fill();
  x.strokeStyle = '#d8d1c2';
  x.lineWidth = 7;
  x.beginPath();
  x.moveTo(cx - 30, bodyY + 4);
  x.lineTo(cx + 6, bodyY + 48);
  x.moveTo(cx + 30, bodyY + 4);
  x.lineTo(cx + 2, bodyY + 38);
  x.stroke();
  x.strokeStyle = 'rgb(44 42 53 / 18%)';
  x.lineWidth = 3;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 62, bodyY + 20);
    x.quadraticCurveTo(cx + side * 70, bodyY + 60, cx + side * 60, bodyY + 92);
    x.stroke();
  }
  x.fillStyle = '#2c2a35';
  x.fillRect(cx - 100, bodyY + 58, 200, 16);
  x.restore();
  // The belt's knot and its two frayed tails.
  x.fillStyle = '#2c2a35';
  roundedRect(x, cx - 12, bodyY + 54, 24, 24, 6);
  x.fill();
  x.beginPath();
  x.moveTo(cx - 6, bodyY + 74);
  x.lineTo(cx - 20, bodyY + 112);
  x.lineTo(cx - 6, bodyY + 114);
  x.lineTo(cx + 2, bodyY + 76);
  x.closePath();
  x.fill();
  x.beginPath();
  x.moveTo(cx + 4, bodyY + 74);
  x.lineTo(cx + 22, bodyY + 108);
  x.lineTo(cx + 34, bodyY + 104);
  x.lineTo(cx + 10, bodyY + 72);
  x.closePath();
  x.fill();
  x.strokeStyle = '#6d6a72';
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(cx - 17, bodyY + 108);
  x.lineTo(cx - 10, bodyY + 110);
  x.moveTo(cx + 25, bodyY + 104);
  x.lineTo(cx + 31, bodyY + 101);
  x.stroke();
  // Eyes in the dark bands, bushy white brows over them, the nose and a calm smile.
  for (const side of [-1, 1]) {
    x.fillStyle = '#d9d4ca';
    ellipse(x, cx + side * 28, eyesY + 4, 15, 19);
    drawEye(x, cx + side * 28, eyesY + 4, eyes, { width: 9 });
  }
  x.fillStyle = '#ffffff';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 16, eyesY - 18);
    x.quadraticCurveTo(cx + side * 30, eyesY - 28, cx + side * 46, eyesY - 22);
    x.quadraticCurveTo(cx + side * 34, eyesY - 16, cx + side * 16, eyesY - 18);
    x.fill();
  }
  x.fillStyle = '#2c2a35';
  ellipse(x, cx, eyesY + 28, 10, 7);
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 3.5;
  x.beginPath();
  x.moveTo(cx - 10, eyesY + 41);
  x.quadraticCurveTo(cx - 5, eyesY + 46, cx, eyesY + 40);
  x.quadraticCurveTo(cx + 5, eyesY + 46, cx + 10, eyesY + 41);
  x.stroke();
  // A little white beard under the chin, pointed.
  x.fillStyle = '#ffffff';
  x.strokeStyle = '#c9c4ba';
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(cx - 16, eyesY + 50);
  x.quadraticCurveTo(cx, eyesY + 84, cx + 4, eyesY + 76);
  x.quadraticCurveTo(cx + 10, eyesY + 66, cx + 16, eyesY + 50);
  x.quadraticCurveTo(cx, eyesY + 56, cx - 16, eyesY + 50);
  x.fill();
  x.stroke();
  // His paw on the sword's handle.
  x.fillStyle = BADGER_GREY;
  ellipse(x, cx + 76, bodyY + 40, 17, 15);
}

// The front of the dojo: white plaster between dark timbers, a sweeping tiled roof with upturned
// ends, its name on a board over the sliding doors, paper windows, and white paper lanterns.
export function drawDojo(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const roofTop = 40;
    const wallTop = 140;
    const wallLeft = 36;
    const wallRight = width - 36;
    // A stone base, then the plaster walls framed in timber.
    x.fillStyle = '#8f8a82';
    x.fillRect(wallLeft - 10, height - 34, wallRight - wallLeft + 20, 34);
    x.fillStyle = DOJO_PLASTER;
    x.fillRect(wallLeft, wallTop, wallRight - wallLeft, height - 34 - wallTop);
    x.fillStyle = DOJO_WOOD_DARK;
    for (const post of [wallLeft, wallLeft + 120, wallRight - 132, wallRight - 12]) {
      x.fillRect(post, wallTop, 12, height - 34 - wallTop);
    }
    x.fillRect(wallLeft, wallTop + 96, wallRight - wallLeft, 10);
    // The roof: a curved sweep, its ends turned up, in dark tiles with a ridge.
    x.fillStyle = '#3d4654';
    x.beginPath();
    x.moveTo(0, wallTop - 10);
    x.quadraticCurveTo(26, wallTop + 4, 60, roofTop + 40);
    x.lineTo(width - 60, roofTop + 40);
    x.quadraticCurveTo(width - 26, wallTop + 4, width, wallTop - 10);
    x.lineTo(width - 10, wallTop + 8);
    x.lineTo(10, wallTop + 8);
    x.closePath();
    x.fill();
    x.beginPath();
    x.moveTo(60, roofTop + 40);
    x.quadraticCurveTo(width / 2, roofTop + 10, width - 60, roofTop + 40);
    x.fill();
    x.fillStyle = '#2a313c';
    roundedRect(x, 50, roofTop + 28, width - 100, 14, 7);
    x.fill();
    x.strokeStyle = 'rgb(255 255 255 / 16%)';
    x.lineWidth = 4;
    for (let tile = 40; tile < width - 30; tile += 24) {
      x.beginPath();
      x.moveTo(tile + 6, roofTop + 48);
      x.lineTo(tile, wallTop);
      x.stroke();
    }
    // The name board, dark with light letters.
    const doorX = width / 2;
    x.fillStyle = DOJO_WOOD_DARK;
    roundedRect(x, doorX - 140, wallTop + 18, 280, 62, 6);
    x.fill();
    x.strokeStyle = '#c99a5b';
    x.lineWidth = 4;
    x.stroke();
    x.fillStyle = '#f6efe6';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 40;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > 240 && size > 14);
    x.fillText(name, doorX, wallTop + 50);
    // Sliding doors of paper in a wooden grid, one of them pulled half open.
    const doorTop = wallTop + 110;
    const doorBottom = height - 34;
    x.fillStyle = '#2f2622';
    x.fillRect(doorX - 90, doorTop, 180, doorBottom - doorTop);
    const shoji = (left: number, top: number, panelWidth: number, panelHeight: number) => {
      x.fillStyle = '#fbf3df';
      x.fillRect(left, top, panelWidth, panelHeight);
      x.strokeStyle = DOJO_WOOD;
      x.lineWidth = 5;
      x.strokeRect(left, top, panelWidth, panelHeight);
      x.lineWidth = 2.5;
      for (let column = 1; column < 3; column++) {
        const lineX = left + (panelWidth * column) / 3;
        x.beginPath();
        x.moveTo(lineX, top);
        x.lineTo(lineX, top + panelHeight);
        x.stroke();
      }
      for (let row = 1; row < 4; row++) {
        const lineY = top + (panelHeight * row) / 4;
        x.beginPath();
        x.moveTo(left, lineY);
        x.lineTo(left + panelWidth, lineY);
        x.stroke();
      }
    };
    shoji(doorX - 90, doorTop, 90, doorBottom - doorTop);
    shoji(doorX + 24, doorTop, 66, doorBottom - doorTop);
    // A paper window on each side.
    for (const windowX of [wallLeft + 28, wallRight - 104]) {
      shoji(windowX, doorTop + 10, 76, 90);
    }
    // White paper lanterns hanging from the eaves.
    for (const lanternX of [wallLeft + 50, wallRight - 96]) {
      x.save();
      x.translate(lanternX, wallTop + 8);
      drawPaperLantern(x, 46, 74);
      x.restore();
    }
  };
}

// A white paper lantern, ribbed, with dark caps.
export function drawPaperLantern(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  x.fillStyle = '#2c2a35';
  x.fillRect(cx - 2, 0, 4, 12);
  roundedRect(x, cx - 16, 8, 32, 10, 3);
  x.fill();
  x.fillStyle = '#fbf3df';
  ellipse(x, cx, height / 2, width / 2 - 4, height / 2 - 20);
  x.strokeStyle = 'rgb(120 90 60 / 35%)';
  x.lineWidth = 2.5;
  for (let rib = 1; rib < 5; rib++) {
    const y = 18 + ((height - 40) * rib) / 5;
    x.beginPath();
    x.ellipse(cx, y, width / 2 - 7, 5, 0, 0, Math.PI);
    x.stroke();
  }
  x.fillStyle = '#c8453a';
  ellipse(x, cx, height / 2, 7, 7);
  x.fillStyle = '#2c2a35';
  roundedRect(x, cx - 16, height - 24, 32, 10, 3);
  x.fill();
}

// The dojo's walls inside: paper screens in a wooden grid under a plain plaster band, with posts.
export function drawDojoWall(): HTMLCanvasElement {
  const width = 1300;
  const height = 440;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = DOJO_PLASTER;
  x.fillRect(0, 0, width, height);
  // The paper screens, from the band down to the skirting.
  const screensTop = 120;
  const screensBottom = height - 40;
  x.fillStyle = '#fbf3df';
  x.fillRect(0, screensTop, width, screensBottom - screensTop);
  x.strokeStyle = DOJO_WOOD;
  x.lineWidth = 3;
  for (let column = 0; column < width; column += 54) {
    x.beginPath();
    x.moveTo(column, screensTop);
    x.lineTo(column, screensBottom);
    x.stroke();
  }
  for (let row = screensTop; row < screensBottom; row += 66) {
    x.beginPath();
    x.moveTo(0, row);
    x.lineTo(width, row);
    x.stroke();
  }
  x.fillStyle = DOJO_WOOD_DARK;
  for (let post = 0; post < width; post += 324) {
    x.fillRect(post, 0, 20, height);
  }
  x.fillRect(0, screensTop - 14, width, 14);
  x.fillRect(0, screensBottom, width, height - screensBottom);
  x.fillRect(0, 0, width, 18);
  addGrain(canvas, 8, 211);
  return canvas;
}

// Its floor: tatami mats, edged in dark cloth.
export function drawDojoFloor(): HTMLCanvasElement {
  const width = 1300;
  const height = 420;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#cdbf86';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(120 105 60 / 25%)';
  x.lineWidth = 2;
  for (let weave = 0; weave < height; weave += 9) {
    x.beginPath();
    x.moveTo(0, weave);
    x.lineTo(width, weave);
    x.stroke();
  }
  x.fillStyle = '#3f4a3a';
  for (let row = 0; row < height; row += 140) {
    x.fillRect(0, row, width, 8);
  }
  for (let column = 0; column < width; column += 260) {
    for (let row = 0; row < height; row += 140) {
      const offset = (row / 140) % 2 === 0 ? 0 : 130;
      x.fillRect(column + offset, row, 8, 140);
    }
  }
  addGrain(canvas, 10, 212);
  return canvas;
}

// A hanging scroll with a brushed circle, for the dojo's wall.
export function drawDojoScroll(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  x.fillStyle = '#5a6b7a';
  x.fillRect(10, 14, width - 20, height - 28);
  x.fillStyle = '#f6efe0';
  x.fillRect(22, 30, width - 44, height - 66);
  x.fillStyle = DOJO_WOOD_DARK;
  roundedRect(x, 2, 6, width - 4, 12, 6);
  x.fill();
  roundedRect(x, 2, height - 18, width - 4, 12, 6);
  x.fill();
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 10;
  x.beginPath();
  x.arc(cx, height * 0.42, width * 0.26, 0.6, Math.PI * 2 - 0.2);
  x.stroke();
  x.fillStyle = '#c8453a';
  x.fillRect(cx + width * 0.1, height - 70, 16, 16);
}

// A rack of wooden swords and a bow, against the wall.
export function drawDojoRack(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.fillStyle = DOJO_WOOD_DARK;
  for (const legX of [16, width - 28]) {
    x.fillRect(legX, 20, 12, height - 20);
  }
  x.fillRect(8, 40, width - 16, 12);
  x.fillRect(8, height - 70, width - 16, 12);
  // The swords, leaning in the rack.
  for (let sword = 0; sword < 4; sword++) {
    const swordX = 50 + sword * ((width - 140) / 3);
    x.save();
    x.translate(swordX, height - 10);
    x.rotate(-0.08);
    x.fillStyle = '#c99a5b';
    roundedRect(x, -6, -height + 30, 12, height - 40, 6);
    x.fill();
    x.fillStyle = '#3a2a20';
    roundedRect(x, -7, -40, 14, 34, 4);
    x.fill();
    x.restore();
  }
  // The bow, standing at the end.
  x.strokeStyle = '#7a3a22';
  x.lineWidth = 8;
  x.beginPath();
  x.moveTo(width - 44, 6);
  x.quadraticCurveTo(width - 4, height / 2, width - 44, height - 6);
  x.stroke();
  x.strokeStyle = '#e8e2d4';
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(width - 44, 6);
  x.lineTo(width - 44, height - 6);
  x.stroke();
}

// A straw archery target on its stand: rings of paper from white to the red bullseye.
export const TARGET_RINGS = ['#fbf6ea', '#2c2a35', '#3c78b4', '#e8b33e', '#c8453a'] as const;

export function drawArcheryTarget(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  const cx = width / 2;
  const radius = Math.min(width, height) / 2 - 6;
  const cy = radius + 6;
  // The stand, when there is room under the target.
  if (height > width) {
    x.fillStyle = DOJO_WOOD_DARK;
    x.save();
    x.translate(cx, cy);
    for (const side of [-1, 1]) {
      x.save();
      x.rotate(side * 0.28);
      x.fillRect(-6, 0, 12, height - cy);
      x.restore();
    }
    x.restore();
  }
  x.fillStyle = '#d8b56a';
  ellipse(x, cx, cy, radius, radius);
  // In the proportions of the game's rings, from 0.85 out to 0.1 at the bullseye.
  const radii = [1, 0.6 / 0.85, 0.4 / 0.85, 0.24 / 0.85, 0.1 / 0.85];
  radii.forEach((share, index) => {
    x.fillStyle = TARGET_RINGS[index];
    ellipse(x, cx, cy, radius * share * 0.92, radius * share * 0.92);
  });
  x.strokeStyle = 'rgb(44 42 53 / 25%)';
  x.lineWidth = 2;
  for (const share of radii) {
    x.beginPath();
    x.arc(cx, cy, radius * share * 0.92, 0, Math.PI * 2);
    x.stroke();
  }
}

// The vegetables of the slicing game, and the clay pot not to cut.
export type ThrownLook = 'carrot' | 'radish' | 'pepper' | 'eggplant' | 'cabbage' | 'pot';

export function drawThrown(kind: ThrownLook) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const cx = width / 2;
    const cy = height / 2;
    const unit = Math.min(width, height);
    x.lineCap = 'round';
    x.lineJoin = 'round';
    if (kind === 'carrot') {
      x.fillStyle = '#e8792b';
      x.beginPath();
      x.moveTo(cx - unit * 0.14, cy - unit * 0.2);
      x.quadraticCurveTo(cx, cy - unit * 0.28, cx + unit * 0.14, cy - unit * 0.2);
      x.lineTo(cx + unit * 0.02, cy + unit * 0.36);
      x.quadraticCurveTo(cx, cy + unit * 0.4, cx - unit * 0.02, cy + unit * 0.36);
      x.closePath();
      x.fill();
      x.strokeStyle = 'rgb(140 60 20 / 45%)';
      x.lineWidth = unit * 0.02;
      for (const line of [-0.08, 0.04, 0.16]) {
        x.beginPath();
        x.moveTo(cx - unit * 0.08, cy + unit * line);
        x.lineTo(cx + unit * 0.02, cy + unit * (line + 0.02));
        x.stroke();
      }
      x.fillStyle = '#5fa04e';
      for (const leaf of [-0.1, 0, 0.1]) {
        x.beginPath();
        x.ellipse(
          cx + unit * leaf,
          cy - unit * 0.3,
          unit * 0.04,
          unit * 0.12,
          leaf * 3,
          0,
          Math.PI * 2,
        );
        x.fill();
      }
    } else if (kind === 'radish') {
      x.fillStyle = '#5fa04e';
      for (const leaf of [-0.12, 0.12]) {
        x.beginPath();
        x.ellipse(
          cx + unit * leaf,
          cy - unit * 0.26,
          unit * 0.07,
          unit * 0.14,
          leaf * 4,
          0,
          Math.PI * 2,
        );
        x.fill();
      }
      x.fillStyle = '#d6456b';
      ellipse(x, cx, cy + unit * 0.04, unit * 0.24, unit * 0.22);
      x.fillStyle = '#fbf6ea';
      x.beginPath();
      x.moveTo(cx - unit * 0.06, cy + unit * 0.22);
      x.quadraticCurveTo(cx, cy + unit * 0.42, cx + unit * 0.06, cy + unit * 0.22);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 35%)';
      ellipse(x, cx - unit * 0.1, cy - unit * 0.04, unit * 0.06, unit * 0.04);
    } else if (kind === 'pepper') {
      x.fillStyle = '#e0b22e';
      x.beginPath();
      x.moveTo(cx - unit * 0.24, cy - unit * 0.1);
      x.bezierCurveTo(
        cx - unit * 0.3,
        cy + unit * 0.3,
        cx - unit * 0.1,
        cy + unit * 0.36,
        cx,
        cy + unit * 0.3,
      );
      x.bezierCurveTo(
        cx + unit * 0.1,
        cy + unit * 0.36,
        cx + unit * 0.3,
        cy + unit * 0.3,
        cx + unit * 0.24,
        cy - unit * 0.1,
      );
      x.quadraticCurveTo(cx, cy - unit * 0.22, cx - unit * 0.24, cy - unit * 0.1);
      x.fill();
      x.strokeStyle = 'rgb(150 100 10 / 40%)';
      x.lineWidth = unit * 0.02;
      x.beginPath();
      x.moveTo(cx, cy - unit * 0.12);
      x.lineTo(cx, cy + unit * 0.28);
      x.stroke();
      x.fillStyle = '#4e8a3f';
      roundedRect(x, cx - unit * 0.04, cy - unit * 0.3, unit * 0.08, unit * 0.14, unit * 0.03);
      x.fill();
    } else if (kind === 'eggplant') {
      x.fillStyle = '#6a3f8a';
      x.beginPath();
      x.ellipse(cx + unit * 0.02, cy + unit * 0.08, unit * 0.18, unit * 0.3, -0.35, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 25%)';
      x.beginPath();
      x.ellipse(
        cx - unit * 0.04,
        cy + unit * 0.04,
        unit * 0.04,
        unit * 0.14,
        -0.35,
        0,
        Math.PI * 2,
      );
      x.fill();
      x.fillStyle = '#4e8a3f';
      x.beginPath();
      x.ellipse(cx - unit * 0.1, cy - unit * 0.22, unit * 0.14, unit * 0.07, -0.35, 0, Math.PI * 2);
      x.fill();
      x.fillRect(cx - unit * 0.16, cy - unit * 0.38, unit * 0.05, unit * 0.14);
    } else if (kind === 'cabbage') {
      x.fillStyle = '#7fb85a';
      ellipse(x, cx, cy, unit * 0.3, unit * 0.28);
      x.fillStyle = '#a8d27a';
      ellipse(x, cx + unit * 0.04, cy - unit * 0.02, unit * 0.2, unit * 0.2);
      x.strokeStyle = '#5e9a42';
      x.lineWidth = unit * 0.025;
      for (const vein of [-0.5, 0, 0.5]) {
        x.beginPath();
        x.moveTo(cx + unit * 0.04, cy + unit * 0.16);
        x.quadraticCurveTo(
          cx + unit * (0.04 + vein * 0.2),
          cy,
          cx + unit * (0.04 + vein * 0.28),
          cy - unit * 0.16,
        );
        x.stroke();
      }
    } else {
      // The clay pot: round-bellied, with a rim and a painted band.
      x.fillStyle = '#b5652a';
      ellipse(x, cx, cy + unit * 0.06, unit * 0.28, unit * 0.27);
      x.fillStyle = '#9a521f';
      roundedRect(x, cx - unit * 0.18, cy - unit * 0.32, unit * 0.36, unit * 0.12, unit * 0.04);
      x.fill();
      x.fillStyle = '#7a3e14';
      ellipse(x, cx, cy - unit * 0.3, unit * 0.13, unit * 0.04);
      x.fillStyle = '#f2d39a';
      x.fillRect(cx - unit * 0.27, cy + unit * 0.02, unit * 0.54, unit * 0.06);
      x.fillStyle = '#2c2a35';
      for (const dot of [-0.16, 0, 0.16]) {
        ellipse(x, cx + unit * dot, cy + unit * 0.05, unit * 0.02, unit * 0.02);
      }
      x.fillStyle = 'rgb(255 255 255 / 25%)';
      ellipse(x, cx - unit * 0.12, cy - unit * 0.04, unit * 0.05, unit * 0.09);
    }
  };
}

// The dojo's garden, where archery is practised: a pale sky, far hills, a bamboo fence, a maple
// in autumn red on the left, bamboo on the right, a stone lantern, and the lawn.
export function drawDojoGarden(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const lawn = height * 0.8;
  const sky = x.createLinearGradient(0, 0, 0, lawn);
  sky.addColorStop(0, '#a9d4ec');
  sky.addColorStop(1, '#e6f2f2');
  x.fillStyle = sky;
  x.fillRect(0, 0, width, lawn);
  // Clouds.
  x.fillStyle = 'rgb(255 255 255 / 85%)';
  for (const [cloudX, cloudY, size] of [
    [0.18, 0.14, 1],
    [0.62, 0.08, 0.8],
    [0.86, 0.2, 0.65],
  ]) {
    for (const [dx, dy, r] of [
      [-0.9, 0.2, 0.55],
      [0, 0, 0.8],
      [0.9, 0.2, 0.55],
    ]) {
      ellipse(
        x,
        width * cloudX + dx * 30 * size,
        height * cloudY + dy * 30 * size,
        r * 34 * size,
        r * 22 * size,
      );
    }
  }
  // Far hills.
  x.fillStyle = '#b9d3a8';
  x.beginPath();
  x.moveTo(0, height * 0.5);
  x.quadraticCurveTo(width * 0.25, height * 0.36, width * 0.5, height * 0.5);
  x.quadraticCurveTo(width * 0.75, height * 0.4, width, height * 0.48);
  x.lineTo(width, lawn);
  x.lineTo(0, lawn);
  x.closePath();
  x.fill();
  // The bamboo fence, its canes bound by two cords.
  const fenceTop = height * 0.56;
  for (let cane = 0; cane < width; cane += 14) {
    x.fillStyle = cane % 28 === 0 ? '#c9b46a' : '#b8a35c';
    x.fillRect(cane, fenceTop + ((cane / 14) % 2) * 4, 12, lawn - fenceTop);
  }
  x.fillStyle = '#6b4a2e';
  x.fillRect(0, fenceTop + 18, width, 5);
  x.fillRect(0, lawn - 26, width, 5);
  // The maple on the left, its crown in reds and oranges.
  x.fillStyle = '#5e3a22';
  x.beginPath();
  x.moveTo(width * 0.08, lawn);
  x.quadraticCurveTo(width * 0.1, height * 0.5, width * 0.06, height * 0.3);
  x.lineTo(width * 0.1, height * 0.3);
  x.quadraticCurveTo(width * 0.14, height * 0.52, width * 0.13, lawn);
  x.closePath();
  x.fill();
  for (const [leafX, leafY, r, color] of [
    [0.02, 0.26, 44, '#c8453a'],
    [0.1, 0.16, 50, '#d9603a'],
    [0.18, 0.28, 40, '#e8792b'],
    [0.08, 0.34, 38, '#b8362e'],
  ] as const) {
    x.fillStyle = color;
    ellipse(x, width * leafX, height * leafY, r * (height / 320), r * 0.8 * (height / 320));
  }
  // Bamboo on the right.
  for (const stalkX of [0.9, 0.95, 0.985]) {
    x.fillStyle = '#6f9a4a';
    x.fillRect(width * stalkX, 0, 9, lawn);
    x.fillStyle = '#557a38';
    for (let node = 20; node < lawn; node += 46) {
      x.fillRect(width * stalkX - 1, node, 11, 3);
    }
    x.fillStyle = '#7fb85a';
    for (let leaf = 30; leaf < lawn * 0.7; leaf += 60) {
      x.beginPath();
      x.ellipse(width * stalkX - 14, leaf, 18, 5, -0.4, 0, Math.PI * 2);
      x.fill();
    }
  }
  // A stone lantern by the fence.
  const lanternX = width * 0.8;
  x.fillStyle = '#9a968e';
  x.fillRect(lanternX - 5, lawn - 52, 10, 40);
  x.fillRect(lanternX - 16, lawn - 14, 32, 14);
  x.fillStyle = '#b3afa6';
  x.fillRect(lanternX - 12, lawn - 70, 24, 20);
  x.fillStyle = '#ffe7a6';
  x.fillRect(lanternX - 6, lawn - 65, 12, 10);
  x.fillStyle = '#8a867e';
  x.beginPath();
  x.moveTo(lanternX - 22, lawn - 70);
  x.lineTo(lanternX, lawn - 86);
  x.lineTo(lanternX + 22, lawn - 70);
  x.closePath();
  x.fill();
  // The lawn, with tufts.
  x.fillStyle = '#8cbf5f';
  x.fillRect(0, lawn, width, height - lawn);
  x.strokeStyle = '#6f9f45';
  x.lineWidth = 2;
  for (let tuft = 10; tuft < width; tuft += 37) {
    const tuftY = lawn + 10 + ((tuft * 7) % (height - lawn - 14));
    x.beginPath();
    x.moveTo(tuft - 4, tuftY);
    x.lineTo(tuft - 6, tuftY - 7);
    x.moveTo(tuft, tuftY);
    x.lineTo(tuft, tuftY - 9);
    x.moveTo(tuft + 4, tuftY);
    x.lineTo(tuft + 6, tuftY - 7);
    x.stroke();
  }
}

// The dojo's back screens slid open onto the garden, its target standing on the lawn.
export function drawGardenView(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.save();
  x.beginPath();
  x.rect(10, 10, width - 20, height - 20);
  x.clip();
  x.translate(10, 10);
  drawDojoGarden(x, width - 20, height - 20);
  x.translate((width - 20) / 2 - 26, (height - 20) * 0.5);
  drawArcheryTarget(x, 52, 70);
  x.restore();
  x.strokeStyle = DOJO_WOOD_DARK;
  x.lineWidth = 12;
  x.strokeRect(6, 6, width - 12, height - 12);
  x.lineWidth = 6;
  x.beginPath();
  x.moveTo(width / 2, 6);
  x.lineTo(width / 2, 22);
  x.stroke();
}

// --- Linden Park's garden. ---------------------------------------------------------------------
