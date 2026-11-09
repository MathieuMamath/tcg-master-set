// Ramen Yuzu: Yuzu the red panda, her shop, and the bowls, ingredients and tables of her jobs.

import {
  addGrain,
  context,
  createCanvas,
  drawEye,
  drawRoundedEar,
  type Eyes,
  ellipse,
  roundBody,
  roundedRect,
} from './core';

const RAMEN_RED = '#c8453a';
const RAMEN_WOOD = '#8a5a34';
const RAMEN_WOOD_DARK = '#5e3a22';
const PANDA_FUR = '#c9592e';
const PANDA_DARK = '#4a2a22';

export const RAMEN_CHEF_SIZE = { width: 330, height: 300 };
export const RAMEN_CHEF_FACE = { x: 151, y: 140, size: 200 };

// Yuzu, the red panda who runs the ramen shop: rust fur with white cheeks and brows, a white
// headband tied at the back, a striped tail, an apron, and her ladle.
export function drawRamenChef(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2 - 14;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 40;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // Her thick tail, ringed, curling up behind her.
  x.save();
  x.translate(cx + 96, bottom - 60);
  x.rotate(-0.5);
  for (let ring = 0; ring < 6; ring++) {
    x.fillStyle = ring % 2 === 0 ? PANDA_FUR : '#7a3a22';
    ellipse(x, 0, -ring * 22, 30 - ring * 1.5, 16);
  }
  x.restore();
  // Rounded pointed ears, rimmed in white. Each one's dark inside is the same shape shrunk towards
  // its middle, so that the rim is even all round, and their bases sink behind the head.
  for (const side of [-1, 1]) {
    // Their bases sit on the top of the head, a little inside its outline.
    const ear = [
      { x: cx + side * 22, y: bodyY - 86 },
      { x: cx + side * 58, y: bodyY - 150 },
      { x: cx + side * 72, y: bodyY - 48 },
    ];
    drawRoundedEar(x, ear, '#f6efe6');
    const middle = {
      x: (ear[0].x + ear[1].x + ear[2].x) / 3,
      y: (ear[0].y + ear[1].y + ear[2].y) / 3,
    };
    drawRoundedEar(
      x,
      ear.map(({ x: pointX, y: pointY }) => ({
        x: middle.x + (pointX - middle.x) * 0.6,
        y: middle.y + (pointY - middle.y) * 0.6 + 4,
      })),
      PANDA_DARK,
    );
  }
  roundBody(x, cx, bottom, { body: PANDA_FUR, belly: PANDA_DARK, feet: PANDA_DARK });
  // Her apron, tied at the neck, with a bowl stitched on its pocket.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#f6efe6';
  roundedRect(x, cx - 54, bodyY + 4, 108, 130, 14);
  x.fill();
  x.fillStyle = RAMEN_RED;
  roundedRect(x, cx - 26, bodyY + 40, 52, 34, 8);
  x.fill();
  x.fillStyle = '#f6efe6';
  x.beginPath();
  x.arc(cx, bodyY + 52, 14, 0, Math.PI);
  x.fill();
  x.restore();
  x.strokeStyle = '#e6dccd';
  x.lineWidth = 6;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 50, bodyY + 8);
    x.lineTo(cx + side * 30, bodyY - 20);
    x.stroke();
  }
  // White cheeks and muzzle, and the dark marks running down from her eyes.
  x.fillStyle = '#f6efe6';
  for (const side of [-1, 1]) {
    ellipse(x, cx + side * 40, eyesY + 30, 30, 22);
    ellipse(x, cx + side * 28, eyesY - 26, 13, 9);
  }
  ellipse(x, cx, eyesY + 36, 26, 18);
  x.fillStyle = '#9b3f22';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 22, eyesY + 8);
    x.quadraticCurveTo(cx + side * 30, eyesY + 34, cx + side * 20, eyesY + 52);
    x.lineTo(cx + side * 12, eyesY + 50);
    x.quadraticCurveTo(cx + side * 18, eyesY + 30, cx + side * 14, eyesY + 10);
    x.closePath();
    x.fill();
  }
  for (const side of [-1, 1]) {
    drawEye(x, cx + side * 28, eyesY + 2, eyes, { width: 10 });
  }
  x.fillStyle = '#2c2a35';
  ellipse(x, cx, eyesY + 30, 9, 7);
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 3.5;
  x.beginPath();
  x.moveTo(cx - 9, eyesY + 42);
  x.quadraticCurveTo(cx - 4, eyesY + 48, cx, eyesY + 42);
  x.quadraticCurveTo(cx + 4, eyesY + 48, cx + 9, eyesY + 42);
  x.stroke();
  x.fillStyle = 'rgb(240 110 100 / 40%)';
  ellipse(x, cx - 56, eyesY + 30, 11, 7);
  ellipse(x, cx + 56, eyesY + 30, 11, 7);
  // Her white headband, its knot and loose ends at the back.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#fbf6ea';
  x.fillRect(cx - 100, eyesY - 52, 200, 20);
  x.fillStyle = RAMEN_RED;
  ellipse(x, cx, eyesY - 42, 9, 9);
  x.restore();
  // The knot's loose ends, tied where the band meets the side of her head.
  const knotX = cx - Math.sqrt(1 - ((eyesY - 42 - bodyY) / 100) ** 2) * 90 + 6;
  x.fillStyle = '#fbf6ea';
  ellipse(x, knotX, eyesY - 42, 9, 11);
  x.beginPath();
  x.moveTo(knotX, eyesY - 46);
  x.lineTo(knotX - 34, eyesY - 66);
  x.lineTo(knotX - 26, eyesY - 40);
  x.closePath();
  x.fill();
  x.beginPath();
  x.moveTo(knotX, eyesY - 38);
  x.lineTo(knotX - 30, eyesY - 18);
  x.lineTo(knotX - 14, eyesY - 14);
  x.closePath();
  x.fill();
  // Her ladle, held up in her right paw.
  const ladleX = cx + 78;
  const ladleY = bodyY + 50;
  x.strokeStyle = '#8b8f99';
  x.lineWidth = 7;
  x.beginPath();
  x.moveTo(ladleX, ladleY);
  x.lineTo(ladleX + 14, ladleY - 92);
  x.stroke();
  x.fillStyle = '#a7abb4';
  x.beginPath();
  x.arc(ladleX + 2, ladleY + 4, 20, 0, Math.PI);
  x.fill();
  x.fillStyle = PANDA_FUR;
  ellipse(x, ladleX + 6, ladleY - 34, 16, 14);
}

// A red paper lantern, ribbed, with black caps and a tassel.
export function drawRedLantern(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  x.fillStyle = '#2c2a35';
  x.fillRect(cx - 2, 0, 4, 14);
  roundedRect(x, cx - 22, 10, 44, 12, 4);
  x.fill();
  x.fillStyle = RAMEN_RED;
  ellipse(x, cx, height / 2, width / 2 - 6, height / 2 - 26);
  x.strokeStyle = 'rgb(90 20 20 / 35%)';
  x.lineWidth = 3;
  for (let rib = 1; rib < 5; rib++) {
    const y = 22 + ((height - 52) * rib) / 5;
    x.beginPath();
    x.ellipse(cx, y, width / 2 - 10, 6, 0, 0, Math.PI);
    x.stroke();
  }
  x.fillStyle = 'rgb(255 230 180 / 35%)';
  ellipse(x, cx - 10, height / 2 - 12, 10, 24);
  x.fillStyle = '#2c2a35';
  roundedRect(x, cx - 22, height - 32, 44, 12, 4);
  x.fill();
  x.strokeStyle = '#e8b33e';
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(cx, height - 20);
  x.lineTo(cx, height - 4);
  x.stroke();
}

// A steaming bowl of ramen: noodles, an egg, greens and a slice of tofu.
function drawRamenBowl(x: CanvasRenderingContext2D, cx: number, top: number, size: number) {
  x.fillStyle = '#fbf6ea';
  x.beginPath();
  x.ellipse(cx, top + size * 0.2, size, size * 0.24, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#e5b765';
  x.beginPath();
  x.ellipse(cx, top + size * 0.2, size * 0.86, size * 0.17, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#fff7d8';
  ellipse(x, cx - size * 0.3, top + size * 0.17, size * 0.18, size * 0.08);
  x.fillStyle = '#f2a541';
  ellipse(x, cx - size * 0.3, top + size * 0.17, size * 0.08, size * 0.05);
  x.fillStyle = '#5fa04e';
  ellipse(x, cx + size * 0.2, top + size * 0.15, size * 0.14, size * 0.05);
  x.fillStyle = RAMEN_RED;
  x.beginPath();
  x.moveTo(cx - size, top + size * 0.2);
  x.quadraticCurveTo(cx, top + size * 1.1, cx + size, top + size * 0.2);
  x.fill();
  x.fillStyle = '#fbf6ea';
  x.fillRect(cx - size * 0.6, top + size * 0.42, size * 1.2, size * 0.08);
}

// The front of Ramen Yuzu: a low wooden house with a tiled roof, its name on a board over the
// door, a split curtain hanging in the doorway, a window onto a steaming bowl, and red lanterns.
export function drawRamenShop(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const roofTop = 70;
    const wallTop = 130;
    const wallLeft = 30;
    const wallRight = width - 30;
    // Wooden walls, in boards.
    x.fillStyle = RAMEN_WOOD;
    x.fillRect(wallLeft, wallTop, wallRight - wallLeft, height - wallTop);
    x.strokeStyle = 'rgb(60 30 15 / 35%)';
    x.lineWidth = 3;
    for (let board = wallLeft + 34; board < wallRight; board += 34) {
      x.beginPath();
      x.moveTo(board, wallTop);
      x.lineTo(board, height);
      x.stroke();
    }
    x.fillStyle = RAMEN_WOOD_DARK;
    x.fillRect(wallLeft, height - 30, wallRight - wallLeft, 30);
    // The tiled roof, overhanging both sides.
    x.fillStyle = '#4f5d70';
    x.beginPath();
    x.moveTo(4, wallTop + 6);
    x.lineTo(40, roofTop);
    x.lineTo(width - 40, roofTop);
    x.lineTo(width - 4, wallTop + 6);
    x.closePath();
    x.fill();
    x.strokeStyle = 'rgb(255 255 255 / 18%)';
    x.lineWidth = 4;
    for (let tile = 30; tile < width - 20; tile += 26) {
      x.beginPath();
      x.moveTo(tile, roofTop + 6);
      x.lineTo(tile - 8, wallTop);
      x.stroke();
    }
    x.fillStyle = '#3a4554';
    x.fillRect(0, wallTop - 2, width, 14);
    // The name board over the door.
    const doorX = width / 2;
    x.fillStyle = '#f6efe6';
    roundedRect(x, doorX - 150, wallTop + 22, 300, 64, 10);
    x.fill();
    x.strokeStyle = RAMEN_WOOD_DARK;
    x.lineWidth = 6;
    x.stroke();
    x.fillStyle = RAMEN_RED;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 40;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > 260 && size > 14);
    x.fillText(name, doorX, wallTop + 56);
    // The doorway, dark inside, and its curtain split in three, a bowl on the middle panel.
    const doorTop = wallTop + 110;
    x.fillStyle = '#2f2622';
    x.fillRect(doorX - 70, doorTop, 140, height - 30 - doorTop);
    x.fillStyle = '#2f4a7a';
    for (const panel of [-1, 0, 1]) {
      roundedRect(x, doorX - 66 + (panel + 1) * 44, doorTop - 6, 40, 120, 4);
      x.fill();
    }
    drawRamenBowl(x, doorX, doorTop + 40, 16);
    // The window, with a bowl steaming behind it.
    const windowX = wallLeft + 40;
    x.fillStyle = '#ffe7b8';
    roundedRect(x, windowX, doorTop + 10, 110, 100, 8);
    x.fill();
    x.strokeStyle = RAMEN_WOOD_DARK;
    x.lineWidth = 8;
    x.stroke();
    x.beginPath();
    x.moveTo(windowX + 55, doorTop + 10);
    x.lineTo(windowX + 55, doorTop + 110);
    x.moveTo(windowX, doorTop + 60);
    x.lineTo(windowX + 110, doorTop + 60);
    x.stroke();
    drawRamenBowl(x, windowX + 55, doorTop + 66, 26);
    x.strokeStyle = 'rgb(255 255 255 / 70%)';
    x.lineWidth = 4;
    for (const wisp of [-12, 0, 12]) {
      x.beginPath();
      x.moveTo(windowX + 55 + wisp, doorTop + 60);
      x.quadraticCurveTo(windowX + 65 + wisp, doorTop + 44, windowX + 55 + wisp, doorTop + 28);
      x.stroke();
    }
    // A menu card pinned beside the door, on the right.
    x.fillStyle = '#f6efe6';
    roundedRect(x, wallRight - 120, doorTop + 14, 80, 96, 6);
    x.fill();
    x.fillStyle = 'rgb(44 42 53 / 45%)';
    for (let line = 0; line < 5; line++) {
      x.fillRect(wallRight - 108, doorTop + 30 + line * 16, line % 2 === 0 ? 56 : 42, 5);
    }
    // Red lanterns hanging from the eaves.
    for (const lanternX of [wallLeft + 14, wallRight - 70]) {
      x.save();
      x.translate(lanternX, wallTop + 6);
      drawRedLantern(x, 56, 88);
      x.restore();
    }
  };
}

// Ramen Yuzu's walls inside: warm plaster over dark wood panels, with beams.
export function drawRamenWall(): HTMLCanvasElement {
  const width = 1300;
  const height = 440;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#efe2c8';
  x.fillRect(0, 0, width, height);
  x.fillStyle = RAMEN_WOOD;
  for (let beam = 0; beam < width; beam += 260) {
    x.fillRect(beam, 0, 18, height);
  }
  x.fillRect(0, 30, width, 16);
  x.fillStyle = RAMEN_WOOD_DARK;
  x.fillRect(0, height - 130, width, 130);
  x.strokeStyle = 'rgb(30 15 5 / 30%)';
  x.lineWidth = 3;
  for (let board = 0; board < width; board += 44) {
    x.beginPath();
    x.moveTo(board, height - 130);
    x.lineTo(board, height);
    x.stroke();
  }
  addGrain(canvas, 8, 191);
  return canvas;
}

// Its floor: worn wooden planks.
export function drawRamenFloor(): HTMLCanvasElement {
  const width = 1300;
  const height = 420;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#b07a48';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(70 40 20 / 35%)';
  x.lineWidth = 3;
  for (let plank = 0; plank < height; plank += 52) {
    x.beginPath();
    x.moveTo(0, plank);
    x.lineTo(width, plank);
    x.stroke();
  }
  addGrain(canvas, 10, 192);
  return canvas;
}

// The counter Yuzu works behind: dark wood, bowls and chopsticks waiting on top, stools before it.
export function drawRamenCounter(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const top = 60;
  x.fillStyle = RAMEN_WOOD_DARK;
  x.fillRect(10, top, width - 20, 26);
  x.fillStyle = RAMEN_WOOD;
  x.fillRect(22, top + 26, width - 44, height - top - 70);
  x.strokeStyle = 'rgb(40 20 10 / 30%)';
  x.lineWidth = 3;
  for (let board = 60; board < width - 30; board += 60) {
    x.beginPath();
    x.moveTo(board, top + 26);
    x.lineTo(board, height - 44);
    x.stroke();
  }
  for (const bowlX of [width * 0.22, width * 0.5, width * 0.78]) {
    drawRamenBowl(x, bowlX, top - 30, 30);
  }
  // Stools before the counter.
  for (const stoolX of [width * 0.2, width * 0.5, width * 0.8]) {
    x.fillStyle = RAMEN_RED;
    roundedRect(x, stoolX - 34, height - 64, 68, 16, 8);
    x.fill();
    x.fillStyle = '#3a3845';
    x.fillRect(stoolX - 4, height - 48, 8, 44);
    x.fillRect(stoolX - 24, height - 8, 48, 6);
  }
}

// The big stockpot on its stove, steaming.
export function drawRamenPot(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  x.fillStyle = '#3a3845';
  x.fillRect(cx - 70, height - 70, 140, 70);
  x.fillStyle = '#e8792b';
  for (const flame of [-30, 0, 30]) {
    ellipse(x, cx + flame, height - 74, 10, 8);
  }
  x.fillStyle = '#9aa0a8';
  roundedRect(x, cx - 62, height - 200, 124, 126, 12);
  x.fill();
  x.fillStyle = '#c0c5cc';
  x.fillRect(cx - 62, height - 200, 124, 16);
  x.fillStyle = '#7d838c';
  for (const side of [-1, 1]) {
    roundedRect(x, cx + side * 62 - (side > 0 ? 0 : 18), height - 170, 18, 12, 4);
    x.fill();
  }
  x.strokeStyle = 'rgb(255 255 255 / 75%)';
  x.lineWidth = 6;
  for (const wisp of [-28, 0, 28]) {
    x.beginPath();
    x.moveTo(cx + wisp, height - 206);
    x.bezierCurveTo(
      cx + wisp + 20,
      height - 236,
      cx + wisp - 20,
      height - 262,
      cx + wisp,
      height - 292,
    );
    x.stroke();
  }
}

// The menu board on the wall: a wooden frame and cards of the day's bowls.
export function drawRamenMenu(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.fillStyle = RAMEN_WOOD_DARK;
  roundedRect(x, 4, 4, width - 8, height - 8, 10);
  x.fill();
  const cards = 4;
  const cardWidth = (width - 40) / cards;
  for (let card = 0; card < cards; card++) {
    const left = 20 + card * cardWidth;
    x.fillStyle = '#f6efe6';
    x.fillRect(left + 4, 22, cardWidth - 8, height - 44);
    drawRamenBowl(x, left + cardWidth / 2, 34, cardWidth * 0.3);
    x.fillStyle = 'rgb(44 42 53 / 45%)';
    x.fillRect(left + 16, height - 70, cardWidth - 32, 6);
    x.fillRect(left + 22, height - 54, cardWidth - 44, 6);
  }
}

// Two small tables by the window, a bowl on each, with stools.
export function drawRamenTables(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  for (const tableX of [width * 0.27, width * 0.73]) {
    x.fillStyle = RAMEN_WOOD;
    roundedRect(x, tableX - 70, height - 120, 140, 18, 6);
    x.fill();
    x.fillStyle = RAMEN_WOOD_DARK;
    x.fillRect(tableX - 6, height - 102, 12, 98);
    x.fillRect(tableX - 40, height - 8, 80, 6);
    drawRamenBowl(x, tableX, height - 150, 24);
    for (const side of [-1, 1]) {
      x.fillStyle = RAMEN_RED;
      roundedRect(x, tableX + side * 92 - 20, height - 70, 40, 12, 6);
      x.fill();
      x.fillStyle = '#3a3845';
      x.fillRect(tableX + side * 92 - 3, height - 58, 6, 54);
    }
  }
}

// One of the four bowls guests order at Ramen Yuzu, seen from above at an angle, each with its
// own broth and toppings so that it reads at a glance, even small on a phone.
export type ServiceDishLook = 'shoyu' | 'miso' | 'curry' | 'veggie';

const DISH_BROTHS: Record<ServiceDishLook, string> = {
  shoyu: '#9b5a2e',
  miso: '#efc189',
  curry: '#d9a321',
  veggie: '#b9d98c',
};

export function drawServiceDish(dish: ServiceDishLook) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const cx = width / 2;
    const rim = height * 0.38;
    const rx = width * 0.44;
    const ry = height * 0.2;
    // The bowl, red outside with a white band.
    x.fillStyle = RAMEN_RED;
    x.beginPath();
    x.moveTo(cx - rx, rim);
    x.quadraticCurveTo(cx - rx, height * 0.96, cx, height * 0.96);
    x.quadraticCurveTo(cx + rx, height * 0.96, cx + rx, rim);
    x.fill();
    x.fillStyle = '#fbf6ea';
    x.fillRect(cx - rx * 0.78, height * 0.66, rx * 1.56, height * 0.07);
    x.fillStyle = '#fbf6ea';
    ellipse(x, cx, rim, rx, ry);
    // The broth.
    x.fillStyle = DISH_BROTHS[dish];
    ellipse(x, cx, rim + 2, rx * 0.86, ry * 0.78);
    // Noodles, in waves.
    x.strokeStyle = '#f5d78a';
    x.lineWidth = Math.max(2, width * 0.025);
    x.lineCap = 'round';
    for (const row of [-0.25, 0, 0.25]) {
      x.beginPath();
      x.moveTo(cx - rx * 0.6, rim + ry * row);
      for (let step = 1; step <= 6; step++) {
        x.quadraticCurveTo(
          cx - rx * 0.6 + rx * 0.2 * step - rx * 0.1,
          rim + ry * row + (step % 2 === 0 ? -4 : 4),
          cx - rx * 0.6 + rx * 0.2 * step,
          rim + ry * row,
        );
      }
      x.stroke();
    }
    // Each bowl's own toppings.
    if (dish === 'shoyu') {
      x.fillStyle = '#fff7d8';
      ellipse(x, cx - rx * 0.32, rim - ry * 0.1, rx * 0.2, ry * 0.36);
      x.fillStyle = '#f2a541';
      ellipse(x, cx - rx * 0.32, rim - ry * 0.1, rx * 0.09, ry * 0.18);
      x.fillStyle = '#2f3b2e';
      x.fillRect(cx + rx * 0.24, rim - ry * 0.95, rx * 0.22, ry * 1.2);
    } else if (dish === 'miso') {
      x.fillStyle = '#f4f0e2';
      for (const [dx, dy] of [
        [-0.3, -0.1],
        [-0.1, 0.25],
      ]) {
        x.fillRect(cx + rx * dx, rim + ry * dy, rx * 0.18, ry * 0.36);
      }
      x.fillStyle = '#f6d23c';
      for (let corn = 0; corn < 7; corn++) {
        ellipse(
          x,
          cx + rx * (0.15 + (corn % 3) * 0.12),
          rim + ry * (-0.3 + Math.floor(corn / 3) * 0.3),
          3,
          3,
        );
      }
    } else if (dish === 'curry') {
      x.fillStyle = '#e8792b';
      for (const [dx, dy] of [
        [-0.35, -0.1],
        [0.05, 0.2],
        [0.35, -0.2],
      ]) {
        ellipse(x, cx + rx * dx, rim + ry * dy, rx * 0.11, ry * 0.2);
      }
    } else {
      x.fillStyle = '#4f9a3e';
      for (const [dx, dy] of [
        [-0.3, -0.15],
        [0.25, 0.1],
      ]) {
        ellipse(x, cx + rx * dx, rim + ry * dy, rx * 0.13, ry * 0.3);
        ellipse(x, cx + rx * (dx + 0.08), rim + ry * (dy - 0.15), rx * 0.1, ry * 0.24);
      }
      x.fillStyle = '#7cc46a';
      ellipse(x, cx, rim + ry * 0.35, rx * 0.16, ry * 0.18);
    }
  };
}

// One table of Ramen Yuzu's dining room, seen from the front: a wooden top with its edge, its
// leg, and a red stool on each side.
export function drawServiceTable(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const top = height * 0.18;
  for (const side of [-1, 1]) {
    const stoolX = width / 2 + side * width * 0.36;
    x.fillStyle = '#3a3845';
    x.fillRect(stoolX - 3, height * 0.55, 6, height * 0.42);
    x.fillStyle = RAMEN_RED;
    roundedRect(x, stoolX - width * 0.11, height * 0.5, width * 0.22, height * 0.1, 6);
    x.fill();
  }
  x.fillStyle = RAMEN_WOOD_DARK;
  x.fillRect(width / 2 - 7, top + 20, 14, height - top - 26);
  x.fillRect(width / 2 - width * 0.18, height - 8, width * 0.36, 6);
  x.fillStyle = RAMEN_WOOD;
  roundedRect(x, 6, top, width - 12, 16, 6);
  x.fill();
  x.fillStyle = RAMEN_WOOD_DARK;
  roundedRect(x, 10, top + 14, width - 20, 10, 4);
  x.fill();
}

// One of the six ingredients of Ramen Yuzu's kitchen, as a little heap seen from the front.
export type KitchenIngredientLook = 'noodles' | 'miso' | 'tofu' | 'egg' | 'onion' | 'mushroom';

export function drawIngredient(ingredient: KitchenIngredientLook) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const cx = width / 2;
    const cy = height / 2;
    const unit = Math.min(width, height);
    x.lineCap = 'round';
    x.lineJoin = 'round';
    if (ingredient === 'noodles') {
      x.strokeStyle = '#e9c35a';
      x.lineWidth = unit * 0.06;
      for (let strand = 0; strand < 6; strand++) {
        x.beginPath();
        const y = cy - unit * 0.2 + strand * unit * 0.08;
        x.moveTo(cx - unit * 0.32, y);
        x.bezierCurveTo(
          cx - unit * 0.1,
          y - unit * 0.12,
          cx + unit * 0.1,
          y + unit * 0.12,
          cx + unit * 0.32,
          y,
        );
        x.stroke();
      }
    } else if (ingredient === 'miso') {
      x.fillStyle = '#b5652a';
      roundedRect(x, cx - unit * 0.3, cy - unit * 0.18, unit * 0.6, unit * 0.42, unit * 0.08);
      x.fill();
      x.fillStyle = '#d98a4a';
      roundedRect(x, cx - unit * 0.3, cy - unit * 0.18, unit * 0.6, unit * 0.12, unit * 0.06);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 30%)';
      ellipse(x, cx - unit * 0.12, cy, unit * 0.06, unit * 0.04);
    } else if (ingredient === 'tofu') {
      for (const [dx, dy] of [
        [-0.17, 0.08],
        [0.17, 0.08],
        [0, -0.14],
      ]) {
        x.fillStyle = '#f4efdf';
        x.fillRect(
          cx + unit * dx - unit * 0.14,
          cy + unit * dy - unit * 0.14,
          unit * 0.28,
          unit * 0.28,
        );
        x.strokeStyle = '#b9ad90';
        x.lineWidth = unit * 0.025;
        x.strokeRect(
          cx + unit * dx - unit * 0.14,
          cy + unit * dy - unit * 0.14,
          unit * 0.28,
          unit * 0.28,
        );
        x.fillStyle = '#ddd5bd';
        x.fillRect(
          cx + unit * dx - unit * 0.14,
          cy + unit * dy + unit * 0.06,
          unit * 0.28,
          unit * 0.08,
        );
      }
    } else if (ingredient === 'egg') {
      x.fillStyle = '#fff7e6';
      ellipse(x, cx, cy, unit * 0.3, unit * 0.36);
      x.strokeStyle = '#d4c49f';
      x.lineWidth = unit * 0.03;
      x.beginPath();
      x.ellipse(cx, cy, unit * 0.3, unit * 0.36, 0, 0, Math.PI * 2);
      x.stroke();
      x.fillStyle = '#f2a541';
      ellipse(x, cx, cy + unit * 0.04, unit * 0.15, unit * 0.17);
      x.fillStyle = 'rgb(255 255 255 / 45%)';
      ellipse(x, cx - unit * 0.05, cy - unit * 0.02, unit * 0.04, unit * 0.05);
    } else if (ingredient === 'onion') {
      x.strokeStyle = '#4f9a3e';
      x.lineWidth = unit * 0.05;
      for (const [dx, dy] of [
        [-0.18, -0.08],
        [0.12, -0.14],
        [-0.04, 0.14],
        [0.2, 0.12],
      ]) {
        x.beginPath();
        x.arc(cx + unit * dx, cy + unit * dy, unit * 0.1, 0, Math.PI * 2);
        x.stroke();
      }
    } else {
      for (const [dx, dy, size] of [
        [-0.16, 0.06, 1],
        [0.16, 0.1, 0.85],
      ]) {
        const capX = cx + unit * dx;
        const capY = cy + unit * dy;
        x.fillStyle = '#efe2c8';
        x.fillRect(capX - unit * 0.05 * size, capY, unit * 0.1 * size, unit * 0.22 * size);
        x.fillStyle = '#8a5a34';
        x.beginPath();
        x.arc(capX, capY, unit * 0.18 * size, Math.PI, 0);
        x.closePath();
        x.fill();
        x.fillStyle = 'rgb(255 255 255 / 25%)';
        ellipse(x, capX - unit * 0.06 * size, capY - unit * 0.08 * size, unit * 0.04, unit * 0.025);
      }
    }
  };
}

// A bowl in the sink, seen from above: white, with its brown stains left to scrub, or gleaming
// once rinsed.
export function drawWashBowl(stains: number, isRinsed: boolean) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.44;
    x.fillStyle = RAMEN_RED;
    ellipse(x, cx, cy, radius, radius);
    x.fillStyle = '#fbf6ea';
    ellipse(x, cx, cy, radius * 0.86, radius * 0.86);
    x.fillStyle = '#efe6d2';
    ellipse(x, cx, cy, radius * 0.6, radius * 0.6);
    const spots = [
      [-0.28, -0.2, 0.26],
      [0.28, 0.12, 0.22],
      [-0.04, 0.34, 0.24],
    ];
    for (const [dx, dy, size] of spots.slice(0, stains)) {
      const spotX = cx + radius * dx;
      const spotY = cy + radius * dy;
      x.fillStyle = 'rgb(130 80 40 / 80%)';
      for (const [ox, oy, scale] of [
        [0, 0, 1],
        [0.5, -0.3, 0.55],
        [-0.45, 0.35, 0.5],
      ]) {
        ellipse(
          x,
          spotX + radius * size * ox,
          spotY + radius * size * oy,
          radius * size * scale,
          radius * size * scale * 0.8,
        );
      }
      x.fillStyle = 'rgb(90 50 25 / 55%)';
      ellipse(x, spotX + radius * 0.04, spotY, radius * size * 0.45, radius * size * 0.35);
    }
    if (isRinsed) {
      x.strokeStyle = 'rgb(255 255 255 / 90%)';
      x.lineWidth = radius * 0.06;
      x.beginPath();
      x.arc(cx, cy, radius * 0.7, 1.15 * Math.PI, 1.55 * Math.PI);
      x.stroke();
      x.fillStyle = 'rgb(160 210 240 / 35%)';
      ellipse(x, cx, cy, radius * 0.6, radius * 0.6);
    }
  };
}

// An empty bowl of broth, waiting for its ingredients on the kitchen's belt.
export function drawBrothBowl(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  const rim = height * 0.38;
  const rx = width * 0.44;
  const ry = height * 0.2;
  x.fillStyle = RAMEN_RED;
  x.beginPath();
  x.moveTo(cx - rx, rim);
  x.quadraticCurveTo(cx - rx, height * 0.96, cx, height * 0.96);
  x.quadraticCurveTo(cx + rx, height * 0.96, cx + rx, rim);
  x.fill();
  x.fillStyle = '#fbf6ea';
  x.fillRect(cx - rx * 0.78, height * 0.66, rx * 1.56, height * 0.07);
  ellipse(x, cx, rim, rx, ry);
  x.fillStyle = '#e8c98f';
  ellipse(x, cx, rim + 2, rx * 0.86, ry * 0.78);
}

// Ramen Yuzu's washing-up corner, behind the bowl: a tiled wall, a wooden worktop, a steel sink
// full of soapy water, and the tap over it. The tap's spout ends at 50% across and 20% down.
export function drawSinkBackdrop(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  // Tiles.
  x.fillStyle = '#e4f0f5';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(120 160 185 / 35%)';
  x.lineWidth = 2;
  const tile = width / 8;
  for (let column = 0; column <= width; column += tile) {
    x.beginPath();
    x.moveTo(column, 0);
    x.lineTo(column, height * 0.55);
    x.stroke();
  }
  for (let row = 0; row <= height * 0.55; row += tile) {
    x.beginPath();
    x.moveTo(0, row);
    x.lineTo(width, row);
    x.stroke();
  }
  // The worktop.
  x.fillStyle = RAMEN_WOOD;
  x.fillRect(0, height * 0.55, width, height * 0.45);
  x.fillStyle = RAMEN_WOOD_DARK;
  x.fillRect(0, height * 0.55, width, height * 0.05);
  // The sink: a steel rim, the water inside, a few ripples.
  const sinkTop = height * 0.5;
  x.fillStyle = '#b8c0c8';
  roundedRect(x, width * 0.08, sinkTop, width * 0.84, height * 0.42, 22);
  x.fill();
  x.fillStyle = '#8e9aa6';
  roundedRect(x, width * 0.12, sinkTop + height * 0.04, width * 0.76, height * 0.34, 18);
  x.fill();
  x.fillStyle = '#9fd0ea';
  roundedRect(x, width * 0.12, sinkTop + height * 0.12, width * 0.76, height * 0.26, 16);
  x.fill();
  x.strokeStyle = 'rgb(255 255 255 / 55%)';
  x.lineWidth = 3;
  for (const [dx, dy, size] of [
    [0.25, 0.2, 0.08],
    [0.72, 0.26, 0.06],
    [0.6, 0.16, 0.05],
  ]) {
    x.beginPath();
    x.ellipse(width * dx, sinkTop + height * dy, width * size, height * 0.02, 0, 0, Math.PI * 2);
    x.stroke();
  }
  // The tap, from the back of the worktop, its spout over the middle of the sink.
  x.strokeStyle = '#8a929b';
  x.lineWidth = width * 0.045;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(width * 0.82, height * 0.52);
  x.lineTo(width * 0.82, height * 0.12);
  x.quadraticCurveTo(width * 0.82, height * 0.04, width * 0.7, height * 0.04);
  x.lineTo(width * 0.56, height * 0.04);
  x.quadraticCurveTo(width * 0.5, height * 0.04, width * 0.5, height * 0.12);
  x.lineTo(width * 0.5, height * 0.18);
  x.stroke();
  x.fillStyle = '#c8453a';
  ellipse(x, width * 0.86, height * 0.2, width * 0.035, width * 0.025);
  x.fillStyle = '#5f6b78';
  ellipse(x, width * 0.5, height * 0.2, width * 0.03, height * 0.015);
}

// The yellow sponge with its green scouring side, for scrubbing.
export function drawSponge(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.fillStyle = '#4f9a3e';
  roundedRect(x, width * 0.08, height * 0.12, width * 0.84, height * 0.32, 10);
  x.fill();
  x.fillStyle = '#f6d23c';
  roundedRect(x, width * 0.08, height * 0.36, width * 0.84, height * 0.52, 12);
  x.fill();
  x.fillStyle = 'rgb(200 150 30 / 45%)';
  for (const [dx, dy] of [
    [0.3, 0.55],
    [0.55, 0.7],
    [0.72, 0.5],
    [0.42, 0.78],
  ]) {
    ellipse(x, width * dx, height * dy, width * 0.05, height * 0.05);
  }
}

// --- The dojo, downtown. -----------------------------------------------------------------------
