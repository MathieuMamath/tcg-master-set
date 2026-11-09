// The Page Nook: Mamie Noisette the hedgehog, her shop front and her shelves of binders.

import { ellipse, roundedRect, seededRandom, WOOD, WOOD_DARK, WOOD_LIGHT } from './core';

const BOOK_COLORS = [
  '#c8453a',
  '#3a86c8',
  '#5b9c4e',
  '#e0a51f',
  '#7e63be',
  '#2f74ae',
  '#d9655a',
  '#5e8c6a',
];
const BOOKSHOP_GREEN = '#3f6b52';

// The bookshop from the street: a wooden shopfront under a green board with its name, a bay window
// stacked with books, and a door with a little bell.
export function drawBookshop(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(13);
    const top = 64;
    const wallLeft = 18;
    const wallRight = width - 18;
    // Walls, and the wooden panel along the bottom.
    x.fillStyle = '#efe0c2';
    x.fillRect(wallLeft, top, wallRight - wallLeft, height - top);
    x.fillStyle = WOOD;
    x.fillRect(wallLeft, height - 40, wallRight - wallLeft, 40);
    x.fillStyle = WOOD_DARK;
    x.fillRect(wallLeft, height - 40, wallRight - wallLeft, 6);
    // A roof edge of tiles.
    x.fillStyle = '#9a5a3a';
    for (let tile = wallLeft - 12; tile < wallRight + 12; tile += 24) {
      x.beginPath();
      x.arc(tile + 12, top, 13, 0, Math.PI);
      x.fill();
    }
    x.fillRect(wallLeft - 12, top - 10, wallRight - wallLeft + 24, 12);
    // The green board with the shop's name.
    x.fillStyle = BOOKSHOP_GREEN;
    roundedRect(x, wallLeft + 6, top + 22, wallRight - wallLeft - 12, 58, 6);
    x.fill();
    x.strokeStyle = '#e0a51f';
    x.lineWidth = 3;
    roundedRect(x, wallLeft + 12, top + 28, wallRight - wallLeft - 24, 46, 4);
    x.stroke();
    x.fillStyle = '#fbf6ea';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 36;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > wallRight - wallLeft - 60 && size > 14);
    x.fillText(name, width / 2, top + 53);
    // The bay window, with piles of books and one standing open.
    const windowLeft = wallLeft + 22;
    const windowTop = top + 104;
    const windowWidth = 220;
    const windowHeight = 150;
    x.fillStyle = BOOKSHOP_GREEN;
    roundedRect(x, windowLeft - 9, windowTop - 9, windowWidth + 18, windowHeight + 18, 6);
    x.fill();
    x.fillStyle = '#f6e7c4';
    x.fillRect(windowLeft, windowTop, windowWidth, windowHeight);
    x.fillStyle = WOOD_DARK;
    x.fillRect(windowLeft, windowTop + windowHeight - 14, windowWidth, 14);
    for (const pileX of [16, 150]) {
      let floor = windowTop + windowHeight - 14;
      for (let book = 0; book < 4; book++) {
        const bookHeight = 12 + random() * 6;
        const bookWidth = 52 - book * 3 + random() * 6;
        x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
        roundedRect(
          x,
          windowLeft + pileX + (random() - 0.5) * 6,
          floor - bookHeight,
          bookWidth,
          bookHeight,
          2,
        );
        x.fill();
        floor -= bookHeight;
      }
    }
    // An open book on a stand, in the middle.
    const standX = windowLeft + windowWidth / 2 + 2;
    const standY = windowTop + windowHeight - 40;
    x.fillStyle = WOOD;
    x.fillRect(standX - 4, standY, 8, 26);
    x.fillStyle = '#fbf6ea';
    x.beginPath();
    x.moveTo(standX, standY + 4);
    x.quadraticCurveTo(standX - 24, standY - 8, standX - 46, standY - 2);
    x.lineTo(standX - 46, standY - 50);
    x.quadraticCurveTo(standX - 24, standY - 56, standX, standY - 44);
    x.quadraticCurveTo(standX + 24, standY - 56, standX + 46, standY - 50);
    x.lineTo(standX + 46, standY - 2);
    x.quadraticCurveTo(standX + 24, standY - 8, standX, standY + 4);
    x.fill();
    x.strokeStyle = 'rgb(44 42 53 / 25%)';
    x.lineWidth = 2;
    for (let line = 0; line < 4; line++) {
      for (const side of [-1, 1]) {
        x.beginPath();
        x.moveTo(standX + side * 8, standY - 36 + line * 9);
        x.lineTo(standX + side * 38, standY - 38 + line * 9);
        x.stroke();
      }
    }
    // Light on the glass, and the window's crossbars.
    x.fillStyle = 'rgb(255 255 255 / 35%)';
    x.beginPath();
    x.moveTo(windowLeft + 20, windowTop + windowHeight);
    x.lineTo(windowLeft + 80, windowTop);
    x.lineTo(windowLeft + 100, windowTop);
    x.lineTo(windowLeft + 40, windowTop + windowHeight);
    x.fill();
    x.fillStyle = BOOKSHOP_GREEN;
    x.fillRect(windowLeft, windowTop + 46, windowWidth, 6);
    x.fillRect(windowLeft + windowWidth / 2 - 3, windowTop, 6, 52);
    // The door, on the right, with its little bell.
    const doorWidth = 96;
    const doorLeft = wallRight - doorWidth - 30;
    const doorTop = top + 108;
    x.fillStyle = BOOKSHOP_GREEN;
    roundedRect(x, doorLeft - 8, doorTop - 8, doorWidth + 16, height - doorTop + 8, 8);
    x.fill();
    x.fillStyle = '#7f5530';
    x.fillRect(doorLeft, doorTop, doorWidth, height - doorTop);
    x.fillStyle = '#f6e7c4';
    roundedRect(x, doorLeft + 14, doorTop + 14, doorWidth - 28, 84, 30);
    x.fill();
    x.fillStyle = '#f3c14b';
    ellipse(x, doorLeft + doorWidth - 14, doorTop + 130, 5, 5);
    x.beginPath();
    x.arc(doorLeft + doorWidth / 2, doorTop - 2, 9, Math.PI, 0);
    x.fill();
    ellipse(x, doorLeft + doorWidth / 2, doorTop + 1, 3, 3);
  };
}

// Where Mamie Noisette's face sits in her drawing, to frame it in a portrait.
export const HEDGEHOG_SIZE = { width: 300, height: 330 };
export const HEDGEHOG_FACE = { x: 164, y: 196, size: 210 };

// Mamie Noisette, the hedgehog who has kept the bookshop for decades: a ring of spines with a
// flower tucked in, a knitted shawl and half-moon glasses on a chain.
export function drawHedgehog(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  // Two rings of spines behind her.
  for (const [color, outer, inner, turn] of [
    ['#6e5038', 132, 104, 0],
    ['#8c6a4c', 116, 96, 0.5],
  ] as const) {
    x.fillStyle = color;
    x.beginPath();
    for (let spike = 0; spike < 48; spike++) {
      const angle = ((spike + turn) / 48) * Math.PI * 2;
      const radius = spike % 2 === 1 ? outer : inner;
      x.lineTo(cx + Math.cos(angle) * radius * 0.95, bodyY - 8 + Math.sin(angle) * radius);
    }
    x.closePath();
    x.fill();
  }
  // Feet, body and pale belly.
  x.fillStyle = '#8c6a4c';
  ellipse(x, cx - 38, bottom - 8, 26, 11);
  ellipse(x, cx + 38, bottom - 8, 26, 11);
  x.fillStyle = '#ebcfa8';
  ellipse(x, cx, bodyY, 90, 100);
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#f7e6cc';
  ellipse(x, cx, bottom - 44, 60, 70);
  x.restore();
  // Small round ears, and a flower tucked in the spines.
  x.fillStyle = '#c99a72';
  ellipse(x, cx - 62, bodyY - 74, 14, 12);
  ellipse(x, cx + 62, bodyY - 74, 14, 12);
  x.fillStyle = '#e8645a';
  for (let petal = 0; petal < 5; petal++) {
    const angle = (petal / 5) * Math.PI * 2;
    ellipse(x, cx + 76 + Math.cos(angle) * 9, bodyY - 92 + Math.sin(angle) * 9, 7, 7);
  }
  x.fillStyle = '#f7d36a';
  ellipse(x, cx + 76, bodyY - 92, 5, 5);
  // The knitted shawl over her shoulders, pinned with a brooch.
  const shawlTop = bottom - 100;
  x.fillStyle = '#c8453a';
  x.beginPath();
  x.moveTo(cx - 90, shawlTop - 6);
  x.quadraticCurveTo(cx, shawlTop + 14, cx + 90, shawlTop - 6);
  x.lineTo(cx + 66, shawlTop + 28);
  x.quadraticCurveTo(cx + 20, shawlTop + 50, cx, shawlTop + 82);
  x.quadraticCurveTo(cx - 20, shawlTop + 50, cx - 66, shawlTop + 28);
  x.closePath();
  x.fill();
  x.strokeStyle = 'rgb(142 47 39 / 55%)';
  x.lineWidth = 3;
  for (let row = 0; row < 4; row++) {
    const y = shawlTop + 14 + row * 15;
    const halfWidth = 70 - row * 17;
    for (let stitch = -halfWidth; stitch <= halfWidth; stitch += 12) {
      x.beginPath();
      x.moveTo(cx + stitch - 4, y - 4);
      x.lineTo(cx + stitch, y + 3);
      x.lineTo(cx + stitch + 4, y - 4);
      x.stroke();
    }
  }
  x.fillStyle = '#8e2f27';
  for (let tassel = -2; tassel <= 2; tassel++) {
    x.fillRect(cx - 2 + tassel * 6, shawlTop + 76 - Math.abs(tassel) * 6, 3, 14);
  }
  x.fillStyle = '#f3c14b';
  ellipse(x, cx, shawlTop + 10, 9, 9);
  x.fillStyle = '#b8861f';
  ellipse(x, cx, shawlTop + 10, 4, 4);
  // Smiling eyes, rosy cheeks, nose and mouth.
  const eyesY = bodyY - 36;
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 4;
  x.lineCap = 'round';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.arc(cx + side * 26, eyesY + 2, 9, 1.15 * Math.PI, 1.85 * Math.PI);
    x.stroke();
  }
  x.fillStyle = 'rgb(240 110 100 / 50%)';
  ellipse(x, cx - 50, eyesY + 24, 13, 7);
  ellipse(x, cx + 50, eyesY + 24, 13, 7);
  x.beginPath();
  x.arc(cx, eyesY + 20, 9, 0.15 * Math.PI, 0.85 * Math.PI);
  x.stroke();
  x.fillStyle = '#2c2a35';
  ellipse(x, cx, eyesY + 10, 8, 6);
  // Half-moon glasses, and their chain hanging down to her shoulders.
  x.strokeStyle = '#b8861f';
  x.lineWidth = 4;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 26 - 19, eyesY + 2);
    x.lineTo(cx + side * 26 + 19, eyesY + 2);
    x.arc(cx + side * 26, eyesY + 2, 19, 0, Math.PI);
    x.stroke();
  }
  x.beginPath();
  x.moveTo(cx - 7, eyesY + 4);
  x.quadraticCurveTo(cx, eyesY - 2, cx + 7, eyesY + 4);
  x.stroke();
  x.lineWidth = 2;
  x.setLineDash([3, 3]);
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 45, eyesY + 3);
    x.quadraticCurveTo(cx + side * 70, eyesY + 70, cx + side * 30, eyesY + 92);
    x.stroke();
  }
  x.setLineDash([]);
}

// The pile of books Mamie Noisette uses as a counter, her old till on top.
export function drawBookPile(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const random = seededRandom(17);
  // The books, lying flat, each a little off from the one below.
  let floor = height;
  const pileTop = 82;
  while (floor > pileTop + 8) {
    const bookHeight = Math.min(22 + random() * 12, floor - pileTop);
    const bookWidth = width * (0.82 + random() * 0.14);
    const left = (width - bookWidth) / 2 + (random() - 0.5) * 16;
    x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
    roundedRect(x, left, floor - bookHeight, bookWidth, bookHeight, 4);
    x.fill();
    // The edge of the pages on one end, and a band on the spine.
    const pagesOnRight = random() < 0.5;
    x.fillStyle = '#fbf6ea';
    x.fillRect(
      pagesOnRight ? left + bookWidth - 16 : left + 4,
      floor - bookHeight + 4,
      12,
      bookHeight - 8,
    );
    x.fillStyle = 'rgb(255 255 255 / 45%)';
    x.fillRect(left + bookWidth * 0.3, floor - bookHeight + 3, 6, bookHeight - 6);
    x.fillRect(left + bookWidth * 0.62, floor - bookHeight + 3, 6, bookHeight - 6);
    floor -= bookHeight;
  }
  // The till, an old brass one, on the top book.
  // Off to the right, where it doesn't hide her face.
  const tillLeft = width - 128;
  const tillWidth = 116;
  const tillBottom = floor;
  x.fillStyle = '#b8861f';
  roundedRect(x, tillLeft, tillBottom - 18, tillWidth, 18, 3);
  x.fill();
  x.fillStyle = '#e0a51f';
  x.beginPath();
  x.moveTo(tillLeft + 6, tillBottom - 18);
  x.lineTo(tillLeft + 22, tillBottom - 58);
  x.lineTo(tillLeft + tillWidth - 10, tillBottom - 58);
  x.lineTo(tillLeft + tillWidth - 6, tillBottom - 18);
  x.closePath();
  x.fill();
  x.fillStyle = '#fbf6ea';
  for (let row = 0; row < 2; row++) {
    for (let key = 0; key < 4; key++) {
      ellipse(x, tillLeft + 32 + key * 18 + row * 4, tillBottom - 44 + row * 14, 5, 4);
    }
  }
  // Its little screen, raised on top.
  x.fillStyle = '#b8861f';
  x.fillRect(tillLeft + 70, tillBottom - 74, 8, 18);
  x.fillStyle = '#2c2a35';
  roundedRect(x, tillLeft + 50, tillBottom - 78, 50, 22, 4);
  x.fill();
  x.fillStyle = '#9ed6a0';
  x.fillRect(tillLeft + 56, tillBottom - 72, 38, 10);
}

// The bookshop's back wall: shelves to the ceiling, full of books standing and lying, with the
// binders for sale on the shelves in the middle, behind the till.
export function drawBookWall(binders: { from: number; to: number }) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(19);
    x.fillStyle = WOOD;
    x.fillRect(0, 0, width, height);
    x.fillStyle = WOOD_DARK;
    x.fillRect(10, 10, width - 20, height - 20);
    const shelves = 4;
    const shelfHeight = (height - 20) / shelves;
    for (let shelf = 0; shelf < shelves; shelf++) {
      const floor = 10 + shelfHeight * (shelf + 1);
      let spine = 18;
      while (spine < width - 30) {
        const isBinder = spine > binders.from && spine < binders.to;
        if (isBinder) {
          // Binders: all the same height, each with a white label.
          const binderWidth = 24;
          const binderHeight = shelfHeight * 0.8;
          x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
          roundedRect(x, spine, floor - binderHeight - 4, binderWidth, binderHeight, 3);
          x.fill();
          x.fillStyle = '#fbf6ea';
          x.fillRect(spine + 5, floor - binderHeight * 0.75, binderWidth - 10, 18);
          x.fillStyle = 'rgb(0 0 0 / 25%)';
          ellipse(x, spine + binderWidth / 2, floor - binderHeight * 0.3, 4, 4);
          spine += binderWidth + 3;
          continue;
        }
        if (random() < 0.08) {
          // A short pile of books lying flat.
          let pileFloor = floor - 4;
          const pileWidth = 50 + random() * 14;
          for (let book = 0; book < 3; book++) {
            const bookHeight = 10 + random() * 5;
            x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
            roundedRect(
              x,
              spine + (random() - 0.5) * 6,
              pileFloor - bookHeight,
              pileWidth,
              bookHeight,
              2,
            );
            x.fill();
            pileFloor -= bookHeight;
          }
          spine += pileWidth + 6;
          continue;
        }
        const spineWidth = 10 + random() * 9;
        const spineHeight = shelfHeight * (0.5 + random() * 0.3);
        x.save();
        x.translate(spine, floor - 4);
        x.rotate(random() < 0.08 ? -0.14 : 0);
        x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
        roundedRect(x, 0, -spineHeight, spineWidth, spineHeight, 2);
        x.fill();
        x.fillStyle = 'rgb(255 255 255 / 40%)';
        x.fillRect(2, -spineHeight * 0.82, spineWidth - 4, 3);
        x.fillRect(2, -spineHeight * 0.22, spineWidth - 4, 3);
        x.restore();
        spine += spineWidth + 1;
      }
      x.fillStyle = WOOD_LIGHT;
      x.fillRect(6, floor - 4, width - 12, 9);
    }
  };
}

// A wooden rack of magazines, their covers facing out on slanted tiers.
export function drawMagazineRack(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const random = seededRandom(23);
  const tiers = 3;
  const tierHeight = (height - 30) / tiers;
  // The two side boards.
  x.fillStyle = WOOD_DARK;
  x.fillRect(4, 0, 12, height);
  x.fillRect(width - 16, 0, 12, height);
  for (let tier = 0; tier < tiers; tier++) {
    const floor = 10 + tierHeight * (tier + 1);
    for (let cover = 0; cover < 3; cover++) {
      const left = 22 + cover * ((width - 44) / 3);
      const coverWidth = (width - 44) / 3 - 6;
      const coverHeight = tierHeight * 0.86;
      x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
      roundedRect(x, left, floor - coverHeight, coverWidth, coverHeight, 2);
      x.fill();
      // A title band, and a round picture.
      x.fillStyle = '#fbf6ea';
      x.fillRect(left + 4, floor - coverHeight + 5, coverWidth - 8, 9);
      x.fillStyle = 'rgb(255 255 255 / 55%)';
      ellipse(
        x,
        left + coverWidth / 2,
        floor - coverHeight * 0.4,
        coverWidth * 0.28,
        coverWidth * 0.28,
      );
    }
    x.fillStyle = WOOD;
    x.fillRect(4, floor, width - 8, 10);
  }
  x.fillStyle = WOOD;
  x.fillRect(4, height - 20, width - 8, 20);
}

// A table of stationery: piles of notebooks and pots full of pens and pencils.
export function drawStationeryTable(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  const random = seededRandom(29);
  const top = height - 92;
  // Legs and top.
  x.fillStyle = WOOD_DARK;
  x.fillRect(16, top + 12, 14, height - top - 12);
  x.fillRect(width - 30, top + 12, 14, height - top - 12);
  x.fillStyle = WOOD;
  roundedRect(x, 0, top, width, 18, 5);
  x.fill();
  // Piles of notebooks, with their spiral.
  for (const pileX of [14, 108]) {
    let floor = top;
    for (let notebook = 0; notebook < 4; notebook++) {
      const notebookHeight = 11;
      const notebookWidth = 76 - notebook * 2;
      const left = pileX + (random() - 0.5) * 8;
      x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
      roundedRect(x, left, floor - notebookHeight, notebookWidth, notebookHeight, 2);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 70%)';
      for (let ring = 4; ring < notebookWidth - 4; ring += 7) {
        x.fillRect(left + ring, floor - notebookHeight + 2, 3, 3);
      }
      floor -= notebookHeight + 1;
    }
  }
  // Pots of pens and pencils.
  for (const [potX, potColor] of [
    [width - 70, '#3a86c8'],
    [width - 38, '#e0a51f'],
  ] as const) {
    for (let pen = 0; pen < 4; pen++) {
      x.save();
      x.translate(potX + 6 + pen * 4, top - 30);
      x.rotate((pen - 1.5) * 0.16);
      x.fillStyle = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)];
      x.fillRect(-2, -34, 5, 40);
      x.fillStyle = '#2c2a35';
      x.fillRect(-2, -38, 5, 5);
      x.restore();
    }
    x.fillStyle = potColor;
    roundedRect(x, potX - 4, top - 34, 30, 34, 4);
    x.fill();
    x.fillStyle = 'rgb(255 255 255 / 30%)';
    x.fillRect(potX, top - 28, 4, 24);
  }
}
