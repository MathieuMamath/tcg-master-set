// Pépin the squirrel's garden, and the scenery of the park's clean-up, watering and stones.

import {
  addGrain,
  context,
  createCanvas,
  cutOut,
  drawEye,
  drawRoundedEar,
  type Eyes,
  ellipse,
  pasteCutOut,
  roundBody,
  roundedRect,
  seededRandom,
} from './core';
import { drawBench, drawPine, drawTree } from './park';
import { drawCloud, drawHills } from './street';

const SQUIRREL_FUR = '#c9772e';
const SQUIRREL_DARK = '#8e4f1c';
const SQUIRREL_CREAM = '#f4e2c2';
const GARDEN_GREEN = '#4f8a3c';

export const GARDENER_SIZE = { width: 320, height: 320 };
export const GARDENER_FACE = { x: 140, y: 150, size: 200 };

// Pépin, the squirrel who tends Linden Park: russet fur and a cream belly, a great bushy tail curling
// up behind him, tufted ears under a straw hat, a green apron with a trowel in its pocket, and his
// two front teeth.
export function drawGardener(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2 - 20;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 34;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // The tail, rising behind him on the right and curling over at the top.
  x.fillStyle = SQUIRREL_DARK;
  x.beginPath();
  x.moveTo(cx + 60, bottom - 30);
  x.bezierCurveTo(cx + 170, bottom - 40, cx + 170, bodyY - 150, cx + 100, bodyY - 150);
  x.bezierCurveTo(cx + 60, bodyY - 150, cx + 50, bodyY - 100, cx + 90, bodyY - 96);
  x.bezierCurveTo(cx + 120, bodyY - 60, cx + 80, bottom - 70, cx + 40, bottom - 60);
  x.closePath();
  x.fill();
  x.fillStyle = SQUIRREL_FUR;
  x.beginPath();
  x.moveTo(cx + 64, bottom - 40);
  x.bezierCurveTo(cx + 154, bottom - 50, cx + 154, bodyY - 136, cx + 102, bodyY - 136);
  x.bezierCurveTo(cx + 72, bodyY - 136, cx + 66, bodyY - 106, cx + 92, bodyY - 104);
  x.bezierCurveTo(cx + 110, bodyY - 70, cx + 86, bottom - 80, cx + 50, bottom - 66);
  x.closePath();
  x.fill();
  // Tufted ears, their bases sunk behind the head, each inside a shrunk copy of its outline.
  for (const side of [-1, 1]) {
    const ear = [
      { x: cx + side * 26, y: bodyY - 84 },
      { x: cx + side * 56, y: bodyY - 148 },
      { x: cx + side * 70, y: bodyY - 56 },
    ];
    drawRoundedEar(x, ear, SQUIRREL_FUR);
    const middle = {
      x: (ear[0].x + ear[1].x + ear[2].x) / 3,
      y: (ear[0].y + ear[1].y + ear[2].y) / 3,
    };
    drawRoundedEar(
      x,
      ear.map(({ x: pointX, y: pointY }) => ({
        x: middle.x + (pointX - middle.x) * 0.55,
        y: middle.y + (pointY - middle.y) * 0.55 + 4,
      })),
      '#e8a77a',
    );
    // The tuft at the tip.
    x.strokeStyle = SQUIRREL_DARK;
    x.lineWidth = 4;
    for (const flick of [-8, 0, 8]) {
      x.beginPath();
      x.moveTo(ear[1].x, ear[1].y + 6);
      x.lineTo(ear[1].x + flick + side * 4, ear[1].y - 12);
      x.stroke();
    }
  }
  roundBody(x, cx, bottom, { body: SQUIRREL_FUR, belly: SQUIRREL_CREAM, feet: SQUIRREL_DARK });
  // Cream cheeks and muzzle.
  x.fillStyle = SQUIRREL_CREAM;
  ellipse(x, cx, eyesY + 34, 34, 24);
  // His green apron, tied at the neck, a trowel in its pocket.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = GARDEN_GREEN;
  roundedRect(x, cx - 52, bodyY + 26, 104, 120, 14);
  x.fill();
  x.fillStyle = '#3f6f30';
  roundedRect(x, cx - 28, bodyY + 56, 56, 30, 6);
  x.fill();
  x.restore();
  x.fillStyle = '#9aa0a8';
  x.beginPath();
  x.moveTo(cx + 8, bodyY + 58);
  x.lineTo(cx + 18, bodyY + 32);
  x.lineTo(cx + 26, bodyY + 58);
  x.closePath();
  x.fill();
  x.fillStyle = '#8a5a34';
  x.fillRect(cx + 14, bodyY + 54, 8, 16);
  // Eyes, nose, a smile and two front teeth.
  for (const side of [-1, 1]) {
    drawEye(x, cx + side * 28, eyesY + 2, eyes, { width: 10 });
  }
  x.fillStyle = '#4a2a22';
  ellipse(x, cx, eyesY + 26, 9, 6);
  x.strokeStyle = '#4a2a22';
  x.lineWidth = 3.5;
  x.beginPath();
  x.moveTo(cx - 10, eyesY + 38);
  x.quadraticCurveTo(cx, eyesY + 44, cx + 10, eyesY + 38);
  x.stroke();
  x.fillStyle = '#ffffff';
  x.fillRect(cx - 6, eyesY + 40, 5, 9);
  x.fillRect(cx + 1, eyesY + 40, 5, 9);
  x.fillStyle = 'rgb(240 110 100 / 40%)';
  ellipse(x, cx - 52, eyesY + 24, 11, 7);
  ellipse(x, cx + 52, eyesY + 24, 11, 7);
  // The straw hat, tilted a little, over the top of his head.
  x.save();
  x.translate(cx, bodyY - 92);
  x.rotate(-0.08);
  x.fillStyle = '#e3c66f';
  ellipse(x, 0, 6, 86, 16);
  x.beginPath();
  x.moveTo(-44, 4);
  x.quadraticCurveTo(-42, -40, 0, -42);
  x.quadraticCurveTo(42, -40, 44, 4);
  x.closePath();
  x.fill();
  x.fillStyle = GARDEN_GREEN;
  x.fillRect(-44, -8, 88, 10);
  x.strokeStyle = 'rgb(140 100 30 / 40%)';
  x.lineWidth = 2;
  for (let weave = -36; weave <= 36; weave += 12) {
    x.beginPath();
    x.moveTo(weave, -32);
    x.lineTo(weave + 4, 2);
    x.stroke();
  }
  x.restore();
  // His paw holding a little watering can, on the left.
  x.fillStyle = '#7fa8c9';
  roundedRect(x, cx - 112, bodyY + 30, 40, 34, 6);
  x.fill();
  x.strokeStyle = '#7fa8c9';
  x.lineWidth = 6;
  x.beginPath();
  x.moveTo(cx - 112, bodyY + 40);
  x.lineTo(cx - 134, bodyY + 22);
  x.stroke();
  x.fillStyle = SQUIRREL_FUR;
  ellipse(x, cx - 78, bodyY + 40, 15, 13);
}

// The garden's flower beds, for the park: a low border of stones around soil and flowers.
export function drawFlowerBeds(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const beds = 5;
  const bedWidth = width / beds;
  const colors = ['#e05a7e', '#f0c43a', '#9a6ad6', '#f08a3a', '#e8e2f0'];
  for (let bed = 0; bed < beds; bed++) {
    const cx = bedWidth * (bed + 0.5);
    drawFlowerBed(x, cx, height, bedWidth * 0.9, 'blooming', colors[bed]);
  }
}

// One flower bed, as the watering game shows it: blooming, thirsty, or drowned in a puddle.
export function drawFlowerBed(
  x: CanvasRenderingContext2D,
  cx: number,
  bottom: number,
  bedWidth: number,
  look: 'blooming' | 'thirsty' | 'drowned',
  color: string,
) {
  const soilTop = bottom - bedWidth * 0.28;
  // Stems and flowers, upright when blooming, drooping when thirsty.
  for (let stem = 0; stem < 4; stem++) {
    const stemX = cx - bedWidth * 0.3 + stem * bedWidth * 0.2;
    const tall = bedWidth * (0.5 + (stem % 2) * 0.12);
    const droop = look === 'thirsty' ? bedWidth * 0.18 : 0;
    x.strokeStyle = look === 'thirsty' ? '#8a8a4a' : '#4f8a3c';
    x.lineWidth = Math.max(2, bedWidth * 0.035);
    x.beginPath();
    x.moveTo(stemX, soilTop);
    x.quadraticCurveTo(stemX, soilTop - tall, stemX + droop, soilTop - tall + droop);
    x.stroke();
    const headX = stemX + droop;
    const headY = soilTop - tall + droop;
    if (look === 'blooming') {
      x.fillStyle = color;
      for (let petal = 0; petal < 5; petal++) {
        const angle = (petal / 5) * Math.PI * 2;
        ellipse(
          x,
          headX + Math.cos(angle) * bedWidth * 0.06,
          headY + Math.sin(angle) * bedWidth * 0.06,
          bedWidth * 0.055,
          bedWidth * 0.055,
        );
      }
      x.fillStyle = '#f6d24a';
      ellipse(x, headX, headY, bedWidth * 0.04, bedWidth * 0.04);
    } else {
      x.fillStyle = look === 'thirsty' ? '#b59a5a' : color;
      ellipse(x, headX, headY, bedWidth * 0.045, bedWidth * 0.06);
    }
  }
  // The soil, darker when wet, and its border of stones.
  x.fillStyle = look === 'drowned' ? '#4a3420' : look === 'thirsty' ? '#a9845a' : '#6b4a2e';
  ellipse(x, cx, soilTop + bedWidth * 0.06, bedWidth * 0.46, bedWidth * 0.12);
  if (look === 'drowned') {
    x.fillStyle = 'rgb(120 170 220 / 70%)';
    ellipse(x, cx, soilTop + bedWidth * 0.06, bedWidth * 0.36, bedWidth * 0.07);
  }
  x.fillStyle = '#b3afa6';
  for (let stone = 0; stone < 6; stone++) {
    ellipse(
      x,
      cx - bedWidth * 0.42 + stone * bedWidth * 0.168,
      bottom - bedWidth * 0.07,
      bedWidth * 0.08,
      bedWidth * 0.06,
    );
  }
}

// A small stone fountain, water arching from its spout.
export function drawFountain(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  x.fillStyle = '#9a968e';
  roundedRect(x, cx - width * 0.42, height - 60, width * 0.84, 54, 10);
  x.fill();
  x.fillStyle = '#7fb3d9';
  ellipse(x, cx, height - 58, width * 0.38, 10);
  x.fillStyle = '#b3afa6';
  x.fillRect(cx - 10, height - 150, 20, 94);
  ellipse(x, cx, height - 150, 34, 10);
  x.strokeStyle = 'rgb(140 195 235 / 90%)';
  x.lineWidth = 6;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx, height - 158);
    x.quadraticCurveTo(cx + side * 40, height - 200, cx + side * 60, height - 64);
    x.stroke();
  }
}

// The three sorting bins: blue for paper, yellow for packaging, green for glass.
export const BIN_COLORS = { paper: '#3c78b4', packaging: '#e8b33e', glass: '#4f8a3c' } as const;

export function drawSortingBin(bin: keyof typeof BIN_COLORS) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    x.fillStyle = BIN_COLORS[bin];
    x.beginPath();
    x.moveTo(width * 0.14, height * 0.24);
    x.lineTo(width * 0.86, height * 0.24);
    x.lineTo(width * 0.78, height * 0.98);
    x.lineTo(width * 0.22, height * 0.98);
    x.closePath();
    x.fill();
    x.fillStyle = 'rgb(0 0 0 / 22%)';
    roundedRect(x, width * 0.08, height * 0.14, width * 0.84, height * 0.12, 6);
    x.fill();
    x.fillStyle = 'rgb(255 255 255 / 85%)';
    // A sign of what goes in: a sheet, a can, a bottle.
    if (bin === 'paper') {
      x.fillRect(width * 0.38, height * 0.42, width * 0.24, height * 0.3);
    } else if (bin === 'packaging') {
      roundedRect(x, width * 0.4, height * 0.4, width * 0.2, height * 0.34, 6);
      x.fill();
    } else {
      roundedRect(x, width * 0.42, height * 0.48, width * 0.16, height * 0.28, 6);
      x.fill();
      x.fillRect(width * 0.47, height * 0.38, width * 0.06, height * 0.12);
    }
  };
}

export function drawSortingBins(drawing: CanvasRenderingContext2D, width: number, height: number) {
  (['paper', 'packaging', 'glass'] as const).forEach((bin, index) => {
    drawing.save();
    drawing.translate((width / 3) * index, 0);
    drawSortingBin(bin)(drawing, width / 3, height);
    drawing.restore();
  });
}

// A piece of litter on the lawn.
export type LitterDrawing =
  | 'newspaper'
  | 'crumpledPaper'
  | 'can'
  | 'plasticBottle'
  | 'jar'
  | 'glassBottle';

export function drawLitter(look: LitterDrawing) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const cx = width / 2;
    const cy = height / 2;
    const unit = Math.min(width, height);
    if (look === 'newspaper') {
      x.save();
      x.translate(cx, cy);
      x.rotate(-0.25);
      x.fillStyle = '#efe9dc';
      x.fillRect(-unit * 0.32, -unit * 0.22, unit * 0.64, unit * 0.44);
      x.fillStyle = 'rgb(44 42 53 / 45%)';
      x.fillRect(-unit * 0.26, -unit * 0.16, unit * 0.52, unit * 0.08);
      for (let line = 0; line < 3; line++) {
        x.fillRect(
          -unit * 0.26,
          -unit * 0.02 + line * unit * 0.07,
          unit * (line === 2 ? 0.3 : 0.52),
          unit * 0.03,
        );
      }
      x.restore();
    } else if (look === 'crumpledPaper') {
      // A sheet of writing paper, crumpled into a ball: white, creased, a few lines of ink.
      x.fillStyle = '#fbfaf5';
      x.beginPath();
      const points = 11;
      for (let point = 0; point <= points; point++) {
        const angle = (point / points) * Math.PI * 2;
        const radius = unit * (point % 2 === 0 ? 0.3 : 0.24);
        const pointX = cx + Math.cos(angle) * radius;
        const pointY = cy + Math.sin(angle) * radius * 0.92;
        if (point === 0) {
          x.moveTo(pointX, pointY);
        } else {
          x.lineTo(pointX, pointY);
        }
      }
      x.closePath();
      x.fill();
      x.strokeStyle = 'rgb(120 120 130 / 45%)';
      x.lineWidth = unit * 0.018;
      x.stroke();
      x.beginPath();
      x.moveTo(cx - unit * 0.18, cy - unit * 0.08);
      x.lineTo(cx + unit * 0.02, cy + unit * 0.02);
      x.lineTo(cx + unit * 0.16, cy - unit * 0.12);
      x.moveTo(cx - unit * 0.06, cy + unit * 0.18);
      x.lineTo(cx + unit * 0.04, cy + unit * 0.02);
      x.stroke();
      x.strokeStyle = 'rgb(60 100 170 / 55%)';
      x.lineWidth = unit * 0.022;
      for (const [fromX, fromY, toX] of [
        [-0.2, -0.16, 0.06],
        [-0.14, 0.08, 0.16],
        [-0.22, 0.16, -0.04],
      ]) {
        x.beginPath();
        x.moveTo(cx + unit * fromX, cy + unit * fromY);
        x.lineTo(cx + unit * toX, cy + unit * (fromY + 0.03));
        x.stroke();
      }
    } else if (look === 'can') {
      x.save();
      x.translate(cx, cy);
      x.rotate(1.2);
      x.fillStyle = '#c8453a';
      roundedRect(x, -unit * 0.16, -unit * 0.3, unit * 0.32, unit * 0.6, unit * 0.06);
      x.fill();
      x.fillStyle = '#c0c5cc';
      x.fillRect(-unit * 0.16, -unit * 0.3, unit * 0.32, unit * 0.07);
      x.fillStyle = '#fbf6ea';
      x.fillRect(-unit * 0.16, -unit * 0.02, unit * 0.32, unit * 0.06);
      x.restore();
    } else if (look === 'plasticBottle') {
      x.save();
      x.translate(cx, cy);
      x.rotate(-1.1);
      x.fillStyle = 'rgb(140 200 230 / 85%)';
      roundedRect(x, -unit * 0.14, -unit * 0.22, unit * 0.28, unit * 0.52, unit * 0.08);
      x.fill();
      x.fillRect(-unit * 0.07, -unit * 0.34, unit * 0.14, unit * 0.14);
      x.fillStyle = '#3c78b4';
      x.fillRect(-unit * 0.08, -unit * 0.4, unit * 0.16, unit * 0.07);
      x.fillStyle = '#fbf6ea';
      x.fillRect(-unit * 0.14, -unit * 0.02, unit * 0.28, unit * 0.1);
      x.restore();
    } else if (look === 'jar') {
      x.fillStyle = 'rgb(170 210 190 / 85%)';
      roundedRect(x, cx - unit * 0.2, cy - unit * 0.18, unit * 0.4, unit * 0.44, unit * 0.08);
      x.fill();
      x.fillStyle = '#9aa0a8';
      x.fillRect(cx - unit * 0.18, cy - unit * 0.28, unit * 0.36, unit * 0.1);
      x.fillStyle = 'rgb(255 255 255 / 55%)';
      x.fillRect(cx - unit * 0.12, cy - unit * 0.1, unit * 0.05, unit * 0.26);
    } else {
      x.save();
      x.translate(cx, cy);
      x.rotate(0.9);
      x.fillStyle = 'rgb(70 140 90 / 90%)';
      roundedRect(x, -unit * 0.13, -unit * 0.14, unit * 0.26, unit * 0.46, unit * 0.06);
      x.fill();
      x.fillRect(-unit * 0.05, -unit * 0.36, unit * 0.1, unit * 0.24);
      x.fillStyle = 'rgb(255 255 255 / 45%)';
      x.fillRect(-unit * 0.08, -unit * 0.06, unit * 0.04, unit * 0.3);
      x.restore();
    }
  };
}

// --- The park's mini-games' sceneries. ----------------------------------------------------------

export const PATH_SCENERY_SIZE = { width: 960, height: 300 };

// The park's path as the clean-up walks along it: sky and clouds, far hills, trees and benches, a
// hedge, then the sandy path with its paving and its grassy edges. It tiles from side to side, so
// that it can scroll by without a seam: nothing crosses its left or right edge.
export function drawParkPathScenery(): HTMLCanvasElement {
  const { width, height } = PATH_SCENERY_SIZE;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const sky = x.createLinearGradient(0, 0, 0, 170);
  sky.addColorStop(0, '#b6dcef');
  sky.addColorStop(1, '#e4f1ee');
  x.fillStyle = sky;
  x.fillRect(0, 0, width, 200);
  const cloud = cutOut(160, 90, drawCloud('#fbfbf6'), 5, 401);
  for (const [cloudX, cloudY, size] of [
    [150, 50, 44],
    [520, 30, 36],
    [800, 64, 40],
  ]) {
    pasteCutOut(x, cloud, cloudX, cloudY + size, size);
  }
  // Far hills, in a band that repeats from side to side.
  x.fillStyle = '#b4d39a';
  for (let hill = 0; hill <= width; hill += 240) {
    ellipse(x, hill, 150, 150, 46);
  }
  x.fillRect(0, 150, width, 40);
  // Trees and pines along the far side of the path, and a bench between some.
  const trees = [
    cutOut(240, 320, drawTree(31), 8, 402),
    cutOut(240, 320, drawPine(32), 8, 403),
    cutOut(240, 320, drawTree(33), 8, 404),
    cutOut(240, 320, drawPine(34), 8, 405),
  ];
  for (const [index, treeX] of [70, 230, 420, 590, 780, 900].entries()) {
    pasteCutOut(x, trees[index % trees.length], treeX, 192, index % 2 === 0 ? 132 : 150);
  }
  // A hedge of rounded bushes, its period dividing the width.
  x.fillStyle = '#6f9f4f';
  for (let bush = 0; bush <= width; bush += 48) {
    ellipse(x, bush, 196, 30, 22);
  }
  x.fillStyle = '#7fb85a';
  for (let bush = 24; bush <= width; bush += 48) {
    ellipse(x, bush, 200, 26, 16);
  }
  const bench = cutOut(260, 150, drawBench, 7, 406);
  pasteCutOut(x, bench, 330, 214, 46);
  pasteCutOut(x, bench, 690, 214, 46);
  // The grass verge, then the path, with its paving stones.
  x.fillStyle = '#8cbf5f';
  x.fillRect(0, 200, width, 18);
  x.fillStyle = '#dcc89a';
  x.fillRect(0, 216, width, height - 216);
  x.fillStyle = '#c4ae7c';
  x.fillRect(0, 216, width, 5);
  for (let row = 0; row < 3; row++) {
    const rowY = 238 + row * 22;
    const offset = row % 2 === 0 ? 0 : 40;
    for (let stone = offset; stone < width; stone += 80) {
      x.fillStyle = row % 2 === 0 ? 'rgb(196 174 124 / 55%)' : 'rgb(196 174 124 / 40%)';
      // Drawn again a width to the left, so that a stone cut by the right edge goes on at the left.
      for (const shift of [0, -width]) {
        roundedRect(x, stone + 6 + shift, rowY, 66, 14, 7);
        x.fill();
      }
    }
  }
  // A few flowers in the verge.
  for (let flower = 40; flower < width; flower += 120) {
    x.fillStyle = flower % 240 === 40 ? '#e05a7e' : '#f0c43a';
    ellipse(x, flower, 208, 4, 4);
    ellipse(x, flower + 9, 211, 3, 3);
  }
  addGrain(canvas, 8, 407);
  return canvas;
}

// The little cart Pip pulls along, with its plank for the bins, two wheels and a handle.
export function drawBinCart(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.fillStyle = '#8a5a34';
  roundedRect(x, 6, height * 0.35, width - 40, height * 0.22, 6);
  x.fill();
  x.strokeStyle = 'rgb(60 30 15 / 35%)';
  x.lineWidth = 3;
  for (let board = 40; board < width - 40; board += 40) {
    x.beginPath();
    x.moveTo(board, height * 0.35);
    x.lineTo(board, height * 0.57);
    x.stroke();
  }
  // The handle, reaching forward to Pip.
  x.strokeStyle = '#6b4a2e';
  x.lineWidth = 7;
  x.beginPath();
  x.moveTo(width - 40, height * 0.45);
  x.lineTo(width - 4, height * 0.3);
  x.stroke();
  for (const wheelX of [width * 0.2, width * 0.62]) {
    x.fillStyle = '#3f2a1c';
    ellipse(x, wheelX, height * 0.66, height * 0.17, height * 0.17);
    x.fillStyle = '#c99a5b';
    ellipse(x, wheelX, height * 0.66, height * 0.06, height * 0.06);
  }
}

export const LAKE_SCENERY_SIZE = { width: 900, height: 480 };

// Linden Park's lake for the skipping stones: the sky, far hills and the wooded shore across, the
// water with its streaks of light, reflections and water lilies, and the pebbly bank in front.
export function drawLakeScenery(): HTMLCanvasElement {
  const { width, height } = LAKE_SCENERY_SIZE;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const shore = height * 0.42;
  const sky = x.createLinearGradient(0, 0, 0, shore);
  sky.addColorStop(0, '#b6dcef');
  sky.addColorStop(1, '#e8f3ef');
  x.fillStyle = sky;
  x.fillRect(0, 0, width, shore);
  const cloud = cutOut(160, 90, drawCloud('#fbfbf6'), 5, 411);
  pasteCutOut(x, cloud, 180, 90, 48);
  pasteCutOut(x, cloud, 640, 70, 40);
  pasteCutOut(
    x,
    cutOut(1200, 120, drawHills('#b4d39a', '#a3c78a', 5, 412), 6, 413),
    width / 2,
    shore + 8,
    90,
  );
  // The wooded shore across the lake.
  const trees = [
    cutOut(240, 320, drawPine(41), 7, 414),
    cutOut(240, 320, drawTree(42), 7, 415),
    cutOut(240, 320, drawPine(43), 7, 416),
  ];
  for (const [index, treeX] of [60, 150, 260, 380, 520, 610, 740, 850].entries()) {
    pasteCutOut(x, trees[index % trees.length], treeX, shore + 6, 78 + (index % 3) * 14);
  }
  x.fillStyle = '#8fb86a';
  x.fillRect(0, shore, width, 14);
  // The water, lighter far away, with streaks of light and the trees' dark reflections.
  const water = x.createLinearGradient(0, shore + 14, 0, height);
  water.addColorStop(0, '#8cc0de');
  water.addColorStop(1, '#3f7fa8');
  x.fillStyle = water;
  x.fillRect(0, shore + 14, width, height - shore - 14);
  x.fillStyle = 'rgb(40 80 60 / 18%)';
  for (const [index, treeX] of [60, 150, 260, 380, 520, 610, 740, 850].entries()) {
    ellipse(x, treeX, shore + 34, 26, 16 + (index % 3) * 4);
  }
  x.strokeStyle = 'rgb(255 255 255 / 30%)';
  x.lineWidth = 3;
  const random = seededRandom(417);
  for (let streak = 0; streak < 26; streak++) {
    const streakY = shore + 40 + random() * (height - shore - 60);
    const streakX = random() * width;
    const length = 30 + random() * 70;
    x.beginPath();
    x.moveTo(streakX, streakY);
    x.lineTo(streakX + length, streakY);
    x.stroke();
  }
  // Water lilies, flat on the water.
  for (const [lilyX, lilyY, size] of [
    [560, shore + 70, 22],
    [600, shore + 82, 15],
    [780, shore + 140, 26],
    [380, shore + 210, 20],
  ]) {
    x.fillStyle = '#5f9f4e';
    x.beginPath();
    x.ellipse(lilyX, lilyY, size, size * 0.4, 0, 0.3, Math.PI * 2 - 0.1);
    x.lineTo(lilyX, lilyY);
    x.closePath();
    x.fill();
  }
  x.fillStyle = '#f2a7c0';
  ellipse(x, 785, shore + 132, 7, 5);
  // The pebbly bank in front, on the left, where Papy stands.
  x.fillStyle = '#c9b07a';
  x.beginPath();
  x.moveTo(0, height * 0.66);
  x.quadraticCurveTo(width * 0.2, height * 0.68, width * 0.3, height);
  x.lineTo(0, height);
  x.closePath();
  x.fill();
  x.fillStyle = '#8cbf5f';
  x.beginPath();
  x.moveTo(0, height * 0.62);
  x.quadraticCurveTo(width * 0.14, height * 0.62, width * 0.2, height * 0.7);
  x.quadraticCurveTo(width * 0.1, height * 0.68, 0, height * 0.7);
  x.closePath();
  x.fill();
  for (const [pebbleX, pebbleY, size] of [
    [60, 0.86, 12],
    [110, 0.92, 9],
    [170, 0.88, 11],
    [210, 0.96, 8],
    [40, 0.97, 10],
  ]) {
    x.fillStyle = '#9a968e';
    ellipse(x, pebbleX, height * pebbleY, size, size * 0.6);
    x.fillStyle = 'rgb(255 255 255 / 35%)';
    ellipse(x, pebbleX - size * 0.3, height * pebbleY - size * 0.2, size * 0.35, size * 0.2);
  }
  addGrain(canvas, 8, 418);
  return canvas;
}

export const GARDEN_SCENERY_SIZE = { width: 900, height: 360 };

// Pépin's garden behind its flower beds: the sky and clouds, trees beyond a wooden fence, the
// fountain on the right, and the lawn the beds stand on.
export function drawGardenScenery(): HTMLCanvasElement {
  const { width, height } = GARDEN_SCENERY_SIZE;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const lawn = height * 0.5;
  const sky = x.createLinearGradient(0, 0, 0, lawn);
  sky.addColorStop(0, '#b6dcef');
  sky.addColorStop(1, '#e6f2ee');
  x.fillStyle = sky;
  x.fillRect(0, 0, width, lawn);
  const cloud = cutOut(160, 90, drawCloud('#fbfbf6'), 5, 421);
  pasteCutOut(x, cloud, 160, 70, 42);
  pasteCutOut(x, cloud, 560, 54, 34);
  x.fillStyle = '#b4d39a';
  for (let hill = 0; hill <= width; hill += 300) {
    ellipse(x, hill + 120, lawn, 190, 60);
  }
  const trees = [
    cutOut(240, 320, drawTree(51), 8, 422),
    cutOut(240, 320, drawPine(52), 8, 423),
    cutOut(240, 320, drawTree(53), 8, 424),
  ];
  for (const [index, treeX] of [70, 250, 470, 640].entries()) {
    pasteCutOut(x, trees[index % trees.length], treeX, lawn + 4, index % 2 === 0 ? 140 : 160);
  }
  // A wooden fence along the back of the garden.
  x.fillStyle = '#c99a5b';
  x.fillRect(0, lawn - 34, width, 8);
  x.fillRect(0, lawn - 16, width, 8);
  for (let post = 10; post < width; post += 38) {
    roundedRect(x, post, lawn - 52, 14, 56, 6);
    x.fill();
  }
  x.fillStyle = 'rgb(90 60 30 / 25%)';
  for (let post = 10; post < width; post += 38) {
    x.fillRect(post + 10, lawn - 50, 3, 52);
  }
  // The lawn, with a few tufts.
  x.fillStyle = '#8cbf5f';
  x.fillRect(0, lawn, width, height - lawn);
  x.fillStyle = '#7fb35a';
  x.fillRect(0, lawn, width, 10);
  x.strokeStyle = '#6f9f45';
  x.lineWidth = 3;
  for (let tuft = 20; tuft < width; tuft += 46) {
    const tuftY = lawn + 30 + ((tuft * 13) % 140);
    x.beginPath();
    x.moveTo(tuft - 5, tuftY);
    x.lineTo(tuft - 8, tuftY - 9);
    x.moveTo(tuft, tuftY);
    x.lineTo(tuft, tuftY - 12);
    x.moveTo(tuft + 5, tuftY);
    x.lineTo(tuft + 8, tuftY - 9);
    x.stroke();
  }
  // The fountain, on the right.
  pasteCutOut(x, cutOut(160, 220, drawFountain, 7, 425), 830, lawn + 40, 150);
  addGrain(canvas, 8, 426);
  return canvas;
}

// Pépin's watering can, its spout to the left.
export function drawWateringCan(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  // The spout, reaching out to the left, with its rose.
  x.strokeStyle = '#5f8fb8';
  x.lineWidth = height * 0.1;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(width * 0.4, height * 0.62);
  x.lineTo(width * 0.1, height * 0.3);
  x.stroke();
  x.fillStyle = '#5f8fb8';
  ellipse(x, width * 0.09, height * 0.28, width * 0.07, height * 0.1);
  // The body, and its handle over the top.
  x.fillStyle = '#7fb3d9';
  roundedRect(x, width * 0.36, height * 0.38, width * 0.5, height * 0.52, width * 0.08);
  x.fill();
  x.fillStyle = 'rgb(255 255 255 / 30%)';
  roundedRect(x, width * 0.42, height * 0.44, width * 0.08, height * 0.36, width * 0.04);
  x.fill();
  x.strokeStyle = '#5f8fb8';
  x.lineWidth = height * 0.07;
  x.beginPath();
  x.arc(width * 0.66, height * 0.38, width * 0.17, Math.PI, 0);
  x.stroke();
}

// --- Gustave's post stand, in the village. ------------------------------------------------------
