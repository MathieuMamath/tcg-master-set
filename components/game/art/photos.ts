// Flash the chameleon, and the city sky of his photos with its balloons and kites.

import {
  addGrain,
  context,
  createCanvas,
  cutOut,
  drawEye,
  type Eyes,
  ellipse,
  pasteCutOut,
  roundedRect,
} from './core';
import { drawCloud } from './street';

const CHAMELEON = '#6cbf6a';
const CHAMELEON_DARK = '#4a9a52';

export const PHOTOGRAPHER_SIZE = { width: 300, height: 380 };
export const PHOTOGRAPHER_FACE = { x: 170, y: 130, size: 170 };

// Flash, the chameleon who photographs the big city's sky: green with a curled tail, a turret eye,
// a cap turned backwards, a pocketed waistcoat and a camera on its strap.
export function drawPhotographer(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const bodyY = bottom - 110;
  const headY = bodyY - 116;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // The curled tail behind.
  x.strokeStyle = CHAMELEON_DARK;
  x.lineWidth = 16;
  x.beginPath();
  x.moveTo(cx - 40, bodyY + 50);
  x.quadraticCurveTo(cx - 120, bodyY + 60, cx - 110, bodyY + 10);
  x.arc(cx - 92, bodyY + 10, 18, Math.PI, Math.PI * 2.6);
  x.stroke();
  // Legs.
  x.fillStyle = CHAMELEON_DARK;
  for (const side of [-1, 1]) {
    roundedRect(x, cx + side * 28 - 12, bodyY + 50, 24, bottom - bodyY - 50, 10);
    x.fill();
  }
  // The body and its pale belly, the waistcoat over it.
  x.fillStyle = CHAMELEON;
  ellipse(x, cx, bodyY, 66, 80);
  x.fillStyle = '#c7e6a8';
  ellipse(x, cx + 14, bodyY + 10, 34, 58);
  x.fillStyle = '#c99a5b';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 10, bodyY - 74);
    x.quadraticCurveTo(cx + side * 70, bodyY - 60, cx + side * 62, bodyY + 60);
    x.lineTo(cx + side * 22, bodyY + 64);
    x.closePath();
    x.fill();
  }
  x.fillStyle = '#a87644';
  roundedRect(x, cx - 52, bodyY + 4, 24, 20, 4);
  x.fill();
  roundedRect(x, cx + 32, bodyY + 4, 24, 20, 4);
  x.fill();
  // Spots along the back.
  x.fillStyle = CHAMELEON_DARK;
  for (const [spotX, spotY] of [
    [-50, -40],
    [-58, 0],
    [-46, 40],
  ] as const) {
    ellipse(x, cx + spotX, bodyY + spotY, 7, 6);
  }
  // The camera on its strap, held at the chest.
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 5;
  x.beginPath();
  x.moveTo(cx - 30, bodyY - 70);
  x.lineTo(cx + 30, bodyY - 10);
  x.stroke();
  x.fillStyle = '#2c2a35';
  roundedRect(x, cx + 14, bodyY - 20, 74, 48, 8);
  x.fill();
  x.fillStyle = '#4a4458';
  roundedRect(x, cx + 26, bodyY - 30, 22, 12, 3);
  x.fill();
  x.fillStyle = '#8fb3d9';
  ellipse(x, cx + 56, bodyY + 4, 17, 17);
  x.fillStyle = '#2c2a35';
  ellipse(x, cx + 56, bodyY + 4, 9, 9);
  x.fillStyle = '#fbf6ea';
  ellipse(x, cx + 52, bodyY, 3, 3);
  x.fillStyle = CHAMELEON;
  ellipse(x, cx + 12, bodyY + 10, 16, 14);
  ellipse(x, cx + 92, bodyY + 10, 14, 13);
  // The head: a pointed snout to the right, a casque on top, the turret eye.
  x.fillStyle = CHAMELEON;
  x.beginPath();
  x.moveTo(cx - 50, headY + 30);
  x.quadraticCurveTo(cx - 54, headY - 40, cx - 10, headY - 64);
  x.quadraticCurveTo(cx + 40, headY - 50, cx + 84, headY + 6);
  x.quadraticCurveTo(cx + 70, headY + 44, cx + 10, headY + 50);
  x.quadraticCurveTo(cx - 40, headY + 52, cx - 50, headY + 30);
  x.closePath();
  x.fill();
  x.strokeStyle = CHAMELEON_DARK;
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(cx + 20, headY + 28);
  x.quadraticCurveTo(cx + 50, headY + 34, cx + 76, headY + 12);
  x.stroke();
  x.fillStyle = CHAMELEON_DARK;
  ellipse(x, cx + 22, headY - 4, 26, 26);
  x.fillStyle = '#f0c43a';
  ellipse(x, cx + 22, headY - 4, 17, 17);
  drawEye(x, cx + 26, headY - 2, eyes, { width: 8 });
  x.fillStyle = 'rgb(240 110 100 / 30%)';
  ellipse(x, cx + 44, headY + 24, 9, 5);
  // The cap, turned backwards, its peak behind.
  x.fillStyle = '#d0443a';
  x.beginPath();
  x.moveTo(cx - 44, headY - 30);
  x.quadraticCurveTo(cx - 30, headY - 84, cx + 16, headY - 70);
  x.quadraticCurveTo(cx + 30, headY - 60, cx + 20, headY - 48);
  x.closePath();
  x.fill();
  x.fillStyle = '#a8352c';
  x.beginPath();
  x.ellipse(cx - 58, headY - 34, 26, 8, 0.4, 0, Math.PI * 2);
  x.fill();
}

export const CITY_SCENERY_SIZE = { width: 900, height: 600 };

// One row of the big city's towers along the bottom of Flash's sky, cut out of paper: flat tops,
// stepped crowns, a dome, antennas and water tanks, with rows of lit windows.
function drawTowerRow(
  towers: readonly { left: number; width: number; top: number; crown: string }[],
  colors: { wall: string; shade: string; window: string },
) {
  return (drawing: CanvasRenderingContext2D, _width: number, height: number) => {
    const x = drawing;
    for (const tower of towers) {
      const right = tower.left + tower.width;
      x.fillStyle = colors.wall;
      x.fillRect(tower.left, tower.top, tower.width, height - tower.top);
      // The shaded side, for depth.
      x.fillStyle = colors.shade;
      x.fillRect(right - tower.width * 0.22, tower.top, tower.width * 0.22, height - tower.top);
      x.fillStyle = colors.wall;
      if (tower.crown === 'step') {
        x.fillRect(tower.left + tower.width * 0.15, tower.top - 26, tower.width * 0.7, 28);
        x.fillRect(tower.left + tower.width * 0.32, tower.top - 50, tower.width * 0.36, 26);
      } else if (tower.crown === 'dome') {
        x.beginPath();
        x.ellipse(tower.left + tower.width / 2, tower.top, tower.width * 0.36, 30, 0, Math.PI, 0);
        x.fill();
      } else if (tower.crown === 'antenna') {
        x.strokeStyle = colors.wall;
        x.lineWidth = 5;
        x.beginPath();
        x.moveTo(tower.left + tower.width / 2, tower.top);
        x.lineTo(tower.left + tower.width / 2, tower.top - 70);
        x.stroke();
        x.fillStyle = '#d0443a';
        ellipse(x, tower.left + tower.width / 2, tower.top - 72, 5, 5);
      } else if (tower.crown === 'tank') {
        x.fillRect(tower.left + tower.width * 0.2, tower.top - 30, 30, 30);
        x.beginPath();
        x.moveTo(tower.left + tower.width * 0.2 - 4, tower.top - 30);
        x.lineTo(tower.left + tower.width * 0.2 + 15, tower.top - 46);
        x.lineTo(tower.left + tower.width * 0.2 + 34, tower.top - 30);
        x.closePath();
        x.fill();
      }
      // Rows of windows, some lit.
      for (let row = tower.top + 18; row < height - 14; row += 24) {
        for (let column = tower.left + 12; column < right - 18; column += 20) {
          const isLit = (row * 7 + column * 3) % 5 < 3;
          x.fillStyle = isLit ? colors.window : colors.shade;
          x.fillRect(column, row, 9, 12);
        }
      }
    }
  };
}

// The big city's sky as Flash frames it: a warm afternoon sky deepening to blue at the top, the
// sun, paper clouds, a far row of pale towers and a near row of darker ones, all cut out of paper
// like the rest of the world.
export function drawCityScenery(): HTMLCanvasElement {
  const { width, height } = CITY_SCENERY_SIZE;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const sky = x.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#4f8fcf');
  sky.addColorStop(0.55, '#9fd0ec');
  sky.addColorStop(0.85, '#f6dcb0');
  sky.addColorStop(1, '#f4c58f');
  x.fillStyle = sky;
  x.fillRect(0, 0, width, height);
  // The sun, low on the left, with its soft glow.
  const glow = x.createRadialGradient(170, 250, 20, 170, 250, 220);
  glow.addColorStop(0, 'rgb(255 236 170 / 80%)');
  glow.addColorStop(1, 'rgb(255 236 170 / 0%)');
  x.fillStyle = glow;
  x.fillRect(0, 30, 400, 440);
  const sun = cutOut(
    120,
    120,
    (art, w, h) => {
      art.fillStyle = '#f7c948';
      ellipse(art, w / 2, h / 2, w / 2, h / 2);
      art.fillStyle = '#fbe28a';
      ellipse(art, w / 2 - 14, h / 2 - 14, w / 4, h / 4);
    },
    6,
    443,
  );
  pasteCutOut(x, sun, 170, 305, 100);
  const cloud = cutOut(160, 90, drawCloud('#fbfbf6'), 6, 441);
  for (const [cloudX, cloudY, size] of [
    [130, 60, 58],
    [560, 40, 44],
    [790, 130, 52],
    [380, 170, 34],
    [680, 250, 30],
  ]) {
    pasteCutOut(x, cloud, cloudX, cloudY + size, size);
  }
  // A few birds, far off.
  x.strokeStyle = 'rgb(44 42 53 / 55%)';
  x.lineWidth = 3;
  x.lineCap = 'round';
  for (const [birdX, birdY] of [
    [460, 110],
    [482, 124],
    [500, 104],
  ]) {
    x.beginPath();
    x.moveTo(birdX - 9, birdY);
    x.quadraticCurveTo(birdX - 4, birdY - 7, birdX, birdY);
    x.quadraticCurveTo(birdX + 4, birdY - 7, birdX + 9, birdY);
    x.stroke();
  }
  const far = cutOut(
    width,
    220,
    drawTowerRow(
      [
        { left: 20, width: 90, top: 70, crown: 'flat' },
        { left: 130, width: 70, top: 30, crown: 'antenna' },
        { left: 230, width: 110, top: 90, crown: 'step' },
        { left: 370, width: 80, top: 50, crown: 'dome' },
        { left: 480, width: 100, top: 100, crown: 'flat' },
        { left: 610, width: 70, top: 20, crown: 'antenna' },
        { left: 700, width: 120, top: 80, crown: 'step' },
        { left: 840, width: 60, top: 60, crown: 'flat' },
      ],
      { wall: '#a9b8cc', shade: '#97a7bd', window: '#e6eef5' },
    ),
    6,
    444,
  );
  // Each row spans the whole width, a little past each edge so that its paper margin never shows.
  x.drawImage(far, -14, height - 46 - 175, width + 28, 175);
  const near = cutOut(
    width,
    170,
    drawTowerRow(
      [
        { left: 0, width: 120, top: 60, crown: 'tank' },
        { left: 140, width: 100, top: 20, crown: 'step' },
        { left: 270, width: 130, top: 80, crown: 'flat' },
        { left: 420, width: 90, top: 40, crown: 'antenna' },
        { left: 540, width: 140, top: 90, crown: 'tank' },
        { left: 700, width: 100, top: 30, crown: 'dome' },
        { left: 820, width: 80, top: 70, crown: 'flat' },
      ],
      { wall: '#4f5d70', shade: '#3f4b5c', window: '#ffe5a0' },
    ),
    7,
    445,
  );
  x.drawImage(near, -14, height + 8 - 135, width + 28, 135);
  addGrain(canvas, 8, 442);
  return canvas;
}

export const SKY_BALLOON_SIZE = { width: 200, height: 270 };
// Where the envelope's middle is in its drawing, as a share of its height: the point that counts.
export const SKY_BALLOON_CENTRE = 0.36;

// A hot-air balloon drifting over the city: an envelope of alternating gores, shaded round, with a
// shine, its crown band and skirt, the ropes and a wicker basket.
export function drawSkyBalloon(colors: readonly [string, string]) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const cx = width / 2;
    const cy = height * 0.36;
    const rx = width * 0.46;
    const ry = height * 0.34;
    // The envelope's outline, round on top and narrowing to the skirt.
    const envelope = () => {
      x.beginPath();
      x.moveTo(cx - rx * 0.32, cy + ry * 1.05);
      x.bezierCurveTo(cx - rx * 1.2, cy + ry * 0.5, cx - rx * 1.05, cy - ry * 1.05, cx, cy - ry);
      x.bezierCurveTo(
        cx + rx * 1.05,
        cy - ry * 1.05,
        cx + rx * 1.2,
        cy + ry * 0.5,
        cx + rx * 0.32,
        cy + ry * 1.05,
      );
      x.closePath();
    };
    x.save();
    envelope();
    x.clip();
    x.fillStyle = colors[0];
    x.fillRect(0, 0, width, height);
    // Gores: curved bands from crown to skirt, every other one in the second colour.
    x.fillStyle = colors[1];
    for (const gore of [-0.62, 0, 0.62]) {
      x.beginPath();
      x.moveTo(cx, cy - ry);
      x.quadraticCurveTo(
        cx + rx * (gore - 0.2) * 1.4,
        cy,
        cx + rx * (gore - 0.12) * 0.4,
        cy + ry * 1.1,
      );
      x.lineTo(cx + rx * (gore + 0.12) * 0.4, cy + ry * 1.1);
      x.quadraticCurveTo(cx + rx * (gore + 0.2) * 1.4, cy, cx, cy - ry);
      x.fill();
    }
    // Shading on the right, and a shine on the left.
    const shade = x.createLinearGradient(cx - rx, 0, cx + rx, 0);
    shade.addColorStop(0, 'rgb(255 255 255 / 18%)');
    shade.addColorStop(0.55, 'rgb(0 0 0 / 0%)');
    shade.addColorStop(1, 'rgb(0 0 0 / 28%)');
    x.fillStyle = shade;
    x.fillRect(0, 0, width, height);
    x.fillStyle = 'rgb(255 255 255 / 45%)';
    x.beginPath();
    x.ellipse(cx - rx * 0.45, cy - ry * 0.45, rx * 0.14, ry * 0.3, -0.4, 0, Math.PI * 2);
    x.fill();
    x.restore();
    // The skirt.
    x.fillStyle = '#7f5530';
    roundedRect(x, cx - rx * 0.34, cy + ry * 1.0, rx * 0.68, 10, 4);
    x.fill();
    // The ropes and the basket.
    x.strokeStyle = '#6b4a2e';
    x.lineWidth = 2.5;
    const basketTop = height - 44;
    for (const [from, to] of [
      [-0.3, -0.18],
      [-0.1, -0.06],
      [0.1, 0.06],
      [0.3, 0.18],
    ]) {
      x.beginPath();
      x.moveTo(cx + rx * from, cy + ry * 1.05 + 8);
      x.lineTo(cx + rx * to, basketTop);
      x.stroke();
    }
    x.fillStyle = '#b8873e';
    roundedRect(x, cx - 26, basketTop, 52, 38, 6);
    x.fill();
    x.strokeStyle = '#8a5a34';
    x.lineWidth = 2;
    for (let weave = 1; weave < 4; weave++) {
      x.beginPath();
      x.moveTo(cx - 24, basketTop + weave * 9.5);
      x.lineTo(cx + 24, basketTop + weave * 9.5);
      x.stroke();
    }
    x.fillStyle = '#8a5a34';
    roundedRect(x, cx - 30, basketTop - 4, 60, 8, 4);
    x.fill();
  };
}

export const SKY_KITE_SIZE = { width: 160, height: 200 };
// Where the kite's middle is in its drawing, as a share of its height.
export const SKY_KITE_CENTRE = 0.42;

// A diamond kite: four panels in two colours, the light catching the upper ones, its crossed spars,
// and a bow where the tail ties on. The tail itself flutters in the scene.
export function drawSkyKite(colors: readonly [string, string]) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const cx = width / 2;
    const top = 8;
    const middle = height * 0.42;
    const bottom = height - 30;
    const half = width * 0.44;
    const panels = [
      {
        points: [
          [cx, top],
          [cx + half, middle],
          [cx, middle],
        ],
        color: colors[0],
        light: 0.22,
      },
      {
        points: [
          [cx, top],
          [cx - half, middle],
          [cx, middle],
        ],
        color: colors[1],
        light: 0.3,
      },
      {
        points: [
          [cx, bottom],
          [cx + half, middle],
          [cx, middle],
        ],
        color: colors[1],
        light: -0.12,
      },
      {
        points: [
          [cx, bottom],
          [cx - half, middle],
          [cx, middle],
        ],
        color: colors[0],
        light: 0,
      },
    ] as const;
    for (const { points, color, light } of panels) {
      x.fillStyle = color;
      x.beginPath();
      x.moveTo(points[0][0], points[0][1]);
      x.lineTo(points[1][0], points[1][1]);
      x.lineTo(points[2][0], points[2][1]);
      x.closePath();
      x.fill();
      x.fillStyle =
        light > 0 ? `rgb(255 255 255 / ${light * 100}%)` : `rgb(0 0 0 / ${-light * 100}%)`;
      x.fill();
    }
    x.strokeStyle = '#6b4a2e';
    x.lineWidth = 4;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(cx, top + 4);
    x.lineTo(cx, bottom - 4);
    x.moveTo(cx - half + 6, middle);
    x.lineTo(cx + half - 6, middle);
    x.stroke();
    // The bow at the bottom point.
    x.fillStyle = colors[1];
    for (const side of [-1, 1]) {
      x.beginPath();
      x.moveTo(cx, bottom + 4);
      x.lineTo(cx + side * 18, bottom - 6);
      x.lineTo(cx + side * 18, bottom + 14);
      x.closePath();
      x.fill();
    }
    x.fillStyle = '#6b4a2e';
    ellipse(x, cx, bottom + 4, 5, 5);
  };
}

// --- Where Mme Ronron's kitten hides. -----------------------------------------------------------
