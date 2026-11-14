// The scarves Pip can wear: the blue striped one everyone starts with, and those of the luxury
// boutique downtown. Each has its colours, a pattern on its band, and its own ends, drawn in three
// parts so that the flying end goes behind the body and the rest in front.

import type { ScarfId } from '@/game/avatar/items';
import { ellipse, roundedRect } from './core';

type Pattern = 'stripes' | 'tartan' | 'knit' | 'dots' | 'stars';
// How the scarf ends: in fringes, in pompoms, in a bow tied at the front, or in golden tassels.
type Ends = 'fringe' | 'pompom' | 'bow' | 'tassel';

type ScarfLook = {
  base: string;
  dark: string;
  // The pattern's second colour.
  accent: string;
  pattern: Pattern;
  ends: Ends;
};

const LOOKS: Record<ScarfId, ScarfLook> = {
  blueStripes: {
    base: '#3d8fd1',
    dark: '#2f74ae',
    accent: '#2f74ae',
    pattern: 'stripes',
    ends: 'fringe',
  },
  tartan: {
    base: '#c8453a',
    dark: '#8e2b25',
    accent: '#f3c14b',
    pattern: 'tartan',
    ends: 'fringe',
  },
  pompomKnit: {
    base: '#f3c14b',
    dark: '#cf9425',
    accent: '#fff6df',
    pattern: 'knit',
    ends: 'pompom',
  },
  polkaBow: { base: '#f29bb8', dark: '#d9668f', accent: '#ffffff', pattern: 'dots', ends: 'bow' },
  starryNight: {
    base: '#2b3566',
    dark: '#1b2249',
    accent: '#f3c14b',
    pattern: 'stars',
    ends: 'tassel',
  },
};

// The scarf's end, flying out behind the body.
export function drawScarfEnd(x: CanvasRenderingContext2D, cx: number, by: number, id: ScarfId) {
  const look = LOOKS[id];
  x.fillStyle = look.dark;
  x.beginPath();
  x.moveTo(cx - 70, by - 104);
  x.quadraticCurveTo(cx - 100, by - 112, cx - 116, by - 86);
  x.lineTo(cx - 104, by - 74);
  x.quadraticCurveTo(cx - 92, by - 92, cx - 66, by - 86);
  x.fill();
  if (look.ends === 'fringe') {
    x.strokeStyle = look.dark;
    x.lineWidth = 3;
    for (let fringe = 0; fringe < 3; fringe++) {
      x.beginPath();
      x.moveTo(cx - 114 + fringe * 5, by - 84 + fringe * 4);
      x.lineTo(cx - 122 + fringe * 5, by - 78 + fringe * 4);
      x.stroke();
    }
  } else if (look.ends === 'pompom') {
    drawPompom(x, cx - 116, by - 76, 11, look);
  } else if (look.ends === 'tassel') {
    drawTassel(x, cx - 112, by - 80, Math.PI * 0.75, look);
  }
}

// The band round the neck, with its pattern, and its front: the knot and its two hanging ends, or
// a bow.
export function drawScarfFront(x: CanvasRenderingContext2D, cx: number, by: number, id: ScarfId) {
  const look = LOOKS[id];
  x.save();
  x.beginPath();
  x.moveTo(cx - 88, by - 110);
  x.quadraticCurveTo(cx + 4, by - 84, cx + 94, by - 110);
  x.lineTo(cx + 92, by - 86);
  x.quadraticCurveTo(cx + 4, by - 58, cx - 86, by - 86);
  x.closePath();
  x.fillStyle = look.base;
  x.fill();
  x.clip();
  drawPattern(x, cx, by, look);
  // The light along the band.
  x.fillStyle = 'rgb(255 255 255 / 22%)';
  x.beginPath();
  x.moveTo(cx - 80, by - 104);
  x.quadraticCurveTo(cx + 4, by - 80, cx + 88, by - 104);
  x.lineTo(cx + 88, by - 98);
  x.quadraticCurveTo(cx + 4, by - 74, cx - 80, by - 98);
  x.fill();
  x.restore();

  if (look.ends === 'bow') {
    drawBow(x, cx + 72, by - 82, look);
    return;
  }
  for (const [offsetX, angle, tailWidth, tailHeight] of [
    [70, 0.12, 18, 40],
    [80, -0.3, 16, 32],
  ]) {
    x.save();
    x.translate(cx + offsetX, by - 80);
    x.rotate(angle);
    x.fillStyle = look.base;
    roundedRect(x, -tailWidth / 2, 0, tailWidth, tailHeight, 6);
    x.fill();
    if (look.ends === 'fringe') {
      x.fillStyle = look.dark;
      x.fillRect(-tailWidth / 2, tailHeight - 10, tailWidth, 6);
    } else if (look.ends === 'pompom') {
      drawPompom(x, 0, tailHeight + 4, 8, look);
    } else {
      x.fillStyle = look.accent;
      x.fillRect(-tailWidth / 2, tailHeight - 8, tailWidth, 4);
      drawTassel(x, 0, tailHeight, Math.PI / 2, look);
    }
    x.restore();
  }
  x.fillStyle = look.dark;
  ellipse(x, cx + 74, by - 82, 13, 11);
  x.fillStyle = look.base;
  ellipse(x, cx + 73, by - 84, 9, 7);
}

function drawPattern(x: CanvasRenderingContext2D, cx: number, by: number, look: ScarfLook) {
  if (look.pattern === 'stripes') {
    x.fillStyle = look.dark;
    for (let stripe = 0; stripe < 7; stripe++) {
      x.beginPath();
      x.moveTo(cx - 76 + stripe * 28, by - 120);
      x.lineTo(cx - 68 + stripe * 28, by - 120);
      x.lineTo(cx - 64 + stripe * 28, by - 50);
      x.lineTo(cx - 72 + stripe * 28, by - 50);
      x.fill();
    }
  } else if (look.pattern === 'tartan') {
    // Broad dark bands both ways, crossed by thin golden lines.
    x.fillStyle = 'rgb(40 60 45 / 55%)';
    for (let band = 0; band < 7; band++) {
      x.fillRect(cx - 82 + band * 28, by - 120, 12, 70);
    }
    x.fillRect(cx - 90, by - 100, 190, 10);
    x.fillStyle = look.accent;
    for (let line = 0; line < 7; line++) {
      x.fillRect(cx - 64 + line * 28, by - 120, 2.5, 70);
    }
    x.fillRect(cx - 90, by - 82, 190, 2.5);
  } else if (look.pattern === 'knit') {
    // Rows of little stitches, as on a chunky knit.
    x.strokeStyle = look.dark;
    x.lineWidth = 2.5;
    for (let row = 0; row < 4; row++) {
      for (let column = 0; column < 13; column++) {
        const stitchX = cx - 84 + column * 14 + (row % 2) * 7;
        const stitchY = by - 112 + row * 12 + Math.abs(column - 6) * 1.2;
        x.beginPath();
        x.moveTo(stitchX - 4, stitchY - 3);
        x.lineTo(stitchX, stitchY + 2);
        x.lineTo(stitchX + 4, stitchY - 3);
        x.stroke();
      }
    }
  } else if (look.pattern === 'dots') {
    x.fillStyle = look.accent;
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 9; column++) {
        ellipse(x, cx - 82 + column * 22 + (row % 2) * 11, by - 108 + row * 16, 4, 4);
      }
    }
  } else {
    // Golden stars on midnight blue, between two golden edges.
    x.strokeStyle = look.accent;
    x.lineWidth = 2.5;
    for (const offset of [0, 22]) {
      x.beginPath();
      x.moveTo(cx - 88, by - 107 + offset);
      x.quadraticCurveTo(cx + 4, by - 81 + offset, cx + 94, by - 107 + offset);
      x.stroke();
    }
    x.fillStyle = look.accent;
    for (const [starX, starY, size] of [
      [cx - 60, by - 96, 5],
      [cx - 26, by - 88, 4],
      [cx + 8, by - 84, 5.5],
      [cx + 42, by - 88, 4],
      [cx + 74, by - 98, 5],
    ]) {
      drawStar(x, starX, starY, size);
    }
  }
}

function drawStar(x: CanvasRenderingContext2D, starX: number, starY: number, size: number) {
  x.beginPath();
  for (let point = 0; point < 10; point++) {
    const radius = point % 2 === 0 ? size : size * 0.45;
    const angle = -Math.PI / 2 + (point * Math.PI) / 5;
    x.lineTo(starX + Math.cos(angle) * radius, starY + Math.sin(angle) * radius);
  }
  x.closePath();
  x.fill();
}

function drawPompom(
  x: CanvasRenderingContext2D,
  pomX: number,
  pomY: number,
  size: number,
  look: ScarfLook,
) {
  x.fillStyle = look.accent;
  ellipse(x, pomX, pomY, size, size);
  x.strokeStyle = look.dark;
  x.lineWidth = 1.5;
  for (let tuft = 0; tuft < 6; tuft++) {
    const angle = (tuft * Math.PI) / 3;
    x.beginPath();
    x.moveTo(pomX + Math.cos(angle) * size * 0.3, pomY + Math.sin(angle) * size * 0.3);
    x.lineTo(pomX + Math.cos(angle) * size * 0.8, pomY + Math.sin(angle) * size * 0.8);
    x.stroke();
  }
}

// A golden tassel hanging from a point, in the given direction.
function drawTassel(
  x: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  angle: number,
  look: ScarfLook,
) {
  x.save();
  x.translate(fromX, fromY);
  x.rotate(angle - Math.PI / 2);
  x.fillStyle = look.accent;
  ellipse(x, 0, 3, 4, 4);
  x.strokeStyle = look.accent;
  x.lineWidth = 2;
  for (const spread of [-4, -1.5, 1.5, 4]) {
    x.beginPath();
    x.moveTo(spread * 0.4, 5);
    x.lineTo(spread, 16);
    x.stroke();
  }
  x.restore();
}

// A bow tied at the front, its two loops and two short ends.
function drawBow(x: CanvasRenderingContext2D, bowX: number, bowY: number, look: ScarfLook) {
  x.fillStyle = look.base;
  for (const [angle, side] of [
    [0.5, 1],
    [-0.4, -1],
  ]) {
    x.save();
    x.translate(bowX, bowY + 6);
    x.rotate(angle);
    roundedRect(x, -6, 0, 12, 24, 5);
    x.fill();
    x.restore();
    x.save();
    x.translate(bowX + side * 15, bowY - 2);
    x.rotate(side * 0.35);
    ellipse(x, 0, 0, 15, 10);
    x.fillStyle = look.dark;
    ellipse(x, -side * 4, 0, 6, 4);
    x.fillStyle = look.base;
    x.restore();
  }
  x.fillStyle = look.dark;
  ellipse(x, bowX, bowY - 1, 7, 8);
  x.fillStyle = look.accent;
  ellipse(x, bowX - 1, bowY - 3, 2.5, 2.5);
}
