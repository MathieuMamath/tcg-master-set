// The big city: its towers, its pavement and the skyline seen from the village.

import { addGrain, context, createCanvas, ellipse, roundedRect, seededRandom } from './core';

// The big city's towers, each built in a style of its own.
export type TowerLook = 'curtain' | 'fins' | 'setback' | 'ribbon' | 'diagrid' | 'cylinder';

// The entrance at the foot of every tower, two floors high, so that its doors are to the scale of
// the characters walking past. Each style has its own: a glass lobby, a stone base with an arched
// door, an art-deco canopy, a lobby set back behind columns, or a revolving door.
const TOWER_ENTRANCE = 330;
const DOOR_HEIGHT_PX = 270;

type TowerEntrance = {
  frame: string;
  // The band over the lobby, if any, and the sunburst of an art-deco canopy.
  canopy: string | null;
  isSunburst?: boolean;
  // A solid base around the doors instead of a glass lobby.
  base?: string;
  // The lobby set back behind columns.
  hasColumns?: boolean;
  door: 'double' | 'arch' | 'revolving';
};

function towerEntrance(
  x: CanvasRenderingContext2D,
  left: number,
  right: number,
  height: number,
  entrance: TowerEntrance,
) {
  const width = right - left;
  const top = height - TOWER_ENTRANCE;
  const { frame } = entrance;
  // The lobby, or the base.
  if (entrance.base) {
    x.fillStyle = entrance.base;
    x.fillRect(left, top, width, TOWER_ENTRANCE);
    x.fillStyle = 'rgb(255 255 255 / 10%)';
    for (let course = top + 30; course < height; course += 36) {
      x.fillRect(left, course, width, 3);
    }
  } else {
    x.fillStyle = entrance.hasColumns ? '#8fa7b8' : '#cfe3f2';
    x.fillRect(left + 14, top + 24, width - 28, TOWER_ENTRANCE - 24);
    x.strokeStyle = frame;
    x.lineWidth = 5;
    for (let pane = 1; pane < 4; pane++) {
      const paneX = left + 14 + ((width - 28) * pane) / 4;
      x.beginPath();
      x.moveTo(paneX, top + 24);
      x.lineTo(paneX, height);
      x.stroke();
    }
    x.fillStyle = 'rgb(255 255 255 / 30%)';
    x.fillRect(left + 14, top + 24, width - 28, 10);
  }
  // The doors.
  const doorWidth = Math.min(width * 0.44, 190);
  const doorLeft = left + (width - doorWidth) / 2;
  const doorTop = height - DOOR_HEIGHT_PX;
  x.fillStyle = '#e6f2fa';
  x.strokeStyle = frame;
  x.lineWidth = 7;
  if (entrance.door === 'arch') {
    x.beginPath();
    x.moveTo(doorLeft, height);
    x.lineTo(doorLeft, doorTop + doorWidth / 2);
    x.arc(doorLeft + doorWidth / 2, doorTop + doorWidth / 2, doorWidth / 2, Math.PI, 0);
    x.lineTo(doorLeft + doorWidth, height);
    x.closePath();
    x.fill();
    x.stroke();
  } else {
    x.fillRect(doorLeft, doorTop, doorWidth, DOOR_HEIGHT_PX);
    x.strokeRect(doorLeft, doorTop, doorWidth, DOOR_HEIGHT_PX);
  }
  if (entrance.door === 'revolving') {
    // The drum of the door, with its leaves seen edge on.
    x.fillStyle = 'rgb(255 255 255 / 45%)';
    x.fillRect(doorLeft, doorTop, doorWidth, 22);
    x.lineWidth = 5;
    for (const leaf of [0.2, 0.5, 0.8]) {
      x.beginPath();
      x.moveTo(doorLeft + doorWidth * leaf, doorTop + 22);
      x.lineTo(doorLeft + doorWidth * leaf, height);
      x.stroke();
    }
  } else {
    x.beginPath();
    x.moveTo(doorLeft + doorWidth / 2, doorTop);
    x.lineTo(doorLeft + doorWidth / 2, height);
    x.stroke();
    x.fillStyle = frame;
    for (const side of [-1, 1]) {
      x.fillRect(doorLeft + doorWidth / 2 + side * 14 - 3, height - 150, 6, 50);
    }
  }
  // Columns in front of a set-back lobby.
  if (entrance.hasColumns) {
    x.fillStyle = '#e2dfd8';
    for (const column of [0.08, 0.92]) {
      x.fillRect(left + width * column - 12, top + 26, 24, TOWER_ENTRANCE - 26);
    }
  }
  // The canopy.
  if (entrance.canopy) {
    x.fillStyle = entrance.canopy;
    x.fillRect(left, top, width, 26);
    x.fillStyle = 'rgb(0 0 0 / 12%)';
    x.fillRect(left, top + 26, width, 8);
    if (entrance.isSunburst) {
      x.strokeStyle = entrance.canopy;
      x.lineWidth = 4;
      for (let ray = -3; ray <= 3; ray++) {
        x.beginPath();
        x.moveTo(left + width / 2, top + 26);
        x.lineTo(left + width / 2 + ray * 26, top - 34);
        x.stroke();
      }
      x.fillStyle = entrance.canopy;
      ellipse(x, left + width / 2, top + 4, 26, 26);
    }
  }
}

// A sheen of light down a glass face.
function towerSheen(
  x: CanvasRenderingContext2D,
  left: number,
  width: number,
  top: number,
  bottom: number,
) {
  x.fillStyle = 'rgb(255 255 255 / 15%)';
  x.beginPath();
  x.moveTo(left + width * 0.12, top);
  x.lineTo(left + width * 0.3, top);
  x.lineTo(left + width * 0.1, bottom);
  x.lineTo(left, bottom);
  x.closePath();
  x.fill();
}

// Glass from top to bottom between thin mullions, under a slanted roof.
function drawCurtainTower(x: CanvasRenderingContext2D, width: number, height: number) {
  const body = height - TOWER_ENTRANCE;
  x.fillStyle = '#7fb0d6';
  x.beginPath();
  x.moveTo(0, 90);
  x.lineTo(width, 20);
  x.lineTo(width, height);
  x.lineTo(0, height);
  x.closePath();
  x.fill();
  x.save();
  x.clip();
  for (let floorY = 0; floorY < body; floorY += 40) {
    x.fillStyle = floorY % 80 === 0 ? 'rgb(255 255 255 / 10%)' : 'rgb(20 60 100 / 8%)';
    x.fillRect(0, floorY, width, 40);
  }
  x.strokeStyle = '#4f7fa6';
  x.lineWidth = 3;
  for (let mullion = 0; mullion <= width; mullion += 38) {
    x.beginPath();
    x.moveTo(mullion, 0);
    x.lineTo(mullion, body);
    x.stroke();
  }
  towerSheen(x, 0, width, 0, body);
  towerSheen(x, width * 0.55, width * 0.6, 0, body);
  x.restore();
  x.strokeStyle = '#3d6a90';
  x.lineWidth = 8;
  x.beginPath();
  x.moveTo(0, 90);
  x.lineTo(width, 20);
  x.stroke();
  towerEntrance(x, 0, width, height, { frame: '#3d6a90', canopy: null, door: 'double' });
}

// Dark stone with tall pale fins, narrow lit windows between them, and a spire on top.
function drawFinsTower(x: CanvasRenderingContext2D, width: number, height: number) {
  const top = 150;
  const body = height - TOWER_ENTRANCE;
  x.fillStyle = '#4b5668';
  x.beginPath();
  x.moveTo(width / 2 - 4, 0);
  x.lineTo(width / 2 + 4, 0);
  x.lineTo(width / 2 + 30, top - 60);
  x.lineTo(width * 0.8, top);
  x.lineTo(width * 0.2, top);
  x.lineTo(width / 2 - 30, top - 60);
  x.closePath();
  x.fill();
  x.fillRect(0, top, width, height - top);
  const random = seededRandom(Math.round(width));
  for (let fin = 18; fin < width - 10; fin += 40) {
    x.fillStyle = '#7d8aa0';
    x.fillRect(fin, top + 10, 9, body - top - 10);
    for (let windowY = top + 24; windowY < body - 20; windowY += 34) {
      x.fillStyle = random() < 0.22 ? '#f6e7a8' : '#36404f';
      x.fillRect(fin + 15, windowY, 18, 22);
    }
  }
  x.fillStyle = '#d0443a';
  ellipse(x, width / 2, 6, 6, 6);
  towerEntrance(x, 0, width, height, {
    frame: '#c9a24a',
    canopy: null,
    base: '#3a4352',
    door: 'arch',
  });
}

// An art-deco tower narrowing in steps towards a crown, with a flag on top.
function drawSetbackTower(x: CanvasRenderingContext2D, width: number, height: number) {
  const body = height - TOWER_ENTRANCE;
  const tiers = [
    { inset: 0.24, top: 110 },
    { inset: 0.12, top: body * 0.3 },
    { inset: 0, top: body * 0.55 },
  ];
  const random = seededRandom(Math.round(height));
  x.strokeStyle = '#2f6f6b';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(width / 2, 110);
  x.lineTo(width / 2, 20);
  x.stroke();
  x.fillStyle = '#f3c14b';
  x.beginPath();
  x.moveTo(width / 2, 22);
  x.lineTo(width / 2 + 30, 32);
  x.lineTo(width / 2, 44);
  x.fill();
  for (const { inset, top } of tiers) {
    const left = width * inset;
    const right = width - left;
    x.fillStyle = '#4f9a96';
    x.fillRect(left, top, right - left, height - top);
    x.fillStyle = '#3b7a76';
    x.fillRect(left, top, right - left, 16);
  }
  for (const [index, { inset, top }] of tiers.entries()) {
    const left = width * inset + 16;
    const right = width - width * inset - 16;
    const bottom = index < tiers.length - 1 ? tiers[index + 1].top : body;
    for (let windowY = top + 30; windowY < bottom - 20; windowY += 40) {
      for (let windowX = left; windowX < right - 14; windowX += 30) {
        x.fillStyle = random() < 0.18 ? '#e3f6f1' : '#86c4bd';
        x.fillRect(windowX, windowY, 18, 26);
      }
    }
  }
  towerEntrance(x, 0, width, height, {
    frame: '#c9a24a',
    canopy: '#d8b25a',
    isSunburst: true,
    door: 'double',
  });
}

// White concrete floors between long ribbons of dark glass, balconies, and a garden on the roof.
function drawRibbonTower(x: CanvasRenderingContext2D, width: number, height: number) {
  const top = 70;
  const body = height - TOWER_ENTRANCE;
  for (const [bushX, size, color] of [
    [width * 0.2, 26, '#5b9c4e'],
    [width * 0.45, 34, '#78ae6c'],
    [width * 0.72, 28, '#5b9c4e'],
  ] as const) {
    x.fillStyle = color;
    ellipse(x, bushX, top - size * 0.4, size, size * 0.8);
  }
  x.fillStyle = '#ebe9e4';
  x.fillRect(0, top, width, height - top);
  for (let floorY = top + 24; floorY < body - 20; floorY += 54) {
    x.fillStyle = '#5b6f80';
    x.fillRect(10, floorY, width - 20, 28);
    x.fillStyle = 'rgb(255 255 255 / 20%)';
    x.fillRect(10, floorY + 3, width - 20, 5);
    x.strokeStyle = '#a9a69f';
    x.lineWidth = 3;
    x.beginPath();
    x.moveTo(10, floorY + 36);
    x.lineTo(width - 10, floorY + 36);
    x.stroke();
  }
  towerEntrance(x, 0, width, height, {
    frame: '#6f7c86',
    canopy: '#ebe9e4',
    hasColumns: true,
    door: 'double',
  });
}

// Bronze diagonal braces criss-crossing dark glass, and a helipad on the roof.
function drawDiagridTower(x: CanvasRenderingContext2D, width: number, height: number) {
  const top = 60;
  const body = height - TOWER_ENTRANCE;
  x.fillStyle = '#2f3b48';
  x.fillRect(0, top, width, height - top);
  x.save();
  x.beginPath();
  x.rect(0, top, width, body - top);
  x.clip();
  for (let floorY = top; floorY < body; floorY += 30) {
    x.fillStyle = 'rgb(140 180 210 / 12%)';
    x.fillRect(0, floorY, width, 14);
  }
  x.strokeStyle = '#b98a5e';
  x.lineWidth = 7;
  const step = width / 2;
  for (let start = top - width; start < body; start += step) {
    x.beginPath();
    x.moveTo(0, start);
    x.lineTo(width, start + width);
    x.moveTo(width, start);
    x.lineTo(0, start + width);
    x.stroke();
  }
  towerSheen(x, 0, width, top, body);
  x.restore();
  x.fillStyle = '#b98a5e';
  x.fillRect(0, top - 12, width, 14);
  x.fillStyle = '#5a5a66';
  x.fillRect(width * 0.2, top - 22, width * 0.6, 10);
  x.strokeStyle = '#fbf6ea';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(width / 2 - 10, top - 32);
  x.lineTo(width / 2 - 10, top - 18);
  x.moveTo(width / 2 + 10, top - 32);
  x.lineTo(width / 2 + 10, top - 18);
  x.moveTo(width / 2 - 10, top - 25);
  x.lineTo(width / 2 + 10, top - 25);
  x.stroke();
  x.fillStyle = '#d0443a';
  ellipse(x, 10, top - 18, 5, 5);
  ellipse(x, width - 10, top - 18, 5, 5);
  towerEntrance(x, 0, width, height, { frame: '#b98a5e', canopy: '#7a5a3c', door: 'revolving' });
}

// A round tower under a dome, shaded at its edges, with tall strips of windows.
function drawCylinderTower(x: CanvasRenderingContext2D, width: number, height: number) {
  const top = width * 0.45;
  const body = height - TOWER_ENTRANCE;
  const shading = x.createLinearGradient(0, 0, width, 0);
  shading.addColorStop(0, '#8c8fa8');
  shading.addColorStop(0.4, '#c6c8da');
  shading.addColorStop(1, '#7c7f98');
  x.fillStyle = shading;
  x.beginPath();
  x.ellipse(width / 2, top, width / 2, top, 0, Math.PI, 0);
  x.lineTo(width, height);
  x.lineTo(0, height);
  x.closePath();
  x.fill();
  for (let strip = 1; strip < 6; strip++) {
    const stripX = (width * strip) / 6;
    const stripWidth = 12 * Math.sin((Math.PI * strip) / 6);
    x.fillStyle = 'rgb(60 70 100 / 45%)';
    x.fillRect(stripX - stripWidth / 2, top + 20, stripWidth, body - top - 30);
  }
  towerEntrance(x, 0, width, height, { frame: '#5c5f78', canopy: null, door: 'arch' });
}

const TOWER_DRAWINGS: Record<
  TowerLook,
  (drawing: CanvasRenderingContext2D, width: number, height: number) => void
> = {
  curtain: drawCurtainTower,
  fins: drawFinsTower,
  setback: drawSetbackTower,
  ribbon: drawRibbonTower,
  diagrid: drawDiagridTower,
  cylinder: drawCylinderTower,
};

// A modern tower of the big city, in its own style. Seen from afar, it fades into the haze of the
// sky.
export function drawTower(look: TowerLook, isFar = false) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    TOWER_DRAWINGS[look](drawing, width, height);
    if (isFar) {
      drawing.globalCompositeOperation = 'source-atop';
      drawing.fillStyle = 'rgb(214 228 240 / 55%)';
      drawing.fillRect(0, 0, width, height);
      drawing.globalCompositeOperation = 'source-over';
    }
  };
}

// The pavement downtown: wide pale slabs, with a darker kerb along the front.
export function drawPavement(): HTMLCanvasElement {
  const width = 2048;
  const height = 466;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#d8d6d0';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(120 118 110 / 35%)';
  x.lineWidth = 3;
  for (let row = 0; row < height; row += 78) {
    x.beginPath();
    x.moveTo(0, row);
    x.lineTo(width, row);
    x.stroke();
    const offset = (row / 78) % 2 === 0 ? 0 : 64;
    for (let slab = offset; slab < width; slab += 128) {
      x.beginPath();
      x.moveTo(slab, row);
      x.lineTo(slab, row + 78);
      x.stroke();
    }
  }
  x.fillStyle = '#a9a7a0';
  x.fillRect(0, height - 60, width, 60);
  addGrain(canvas, 10, 13);
  return canvas;
}

// Downtown seen from the village, far behind the hills: towers packed tight, of every width and
// height, in two rows, pale with distance, a few windows catching the light. Their colours are
// downtown's own, under the haze.
// The near row, then the far one, paler and narrower.
const SKYLINE_ROWS = [
  { colors: ['#b4c6d8', '#a9c3c2', '#bcc1cb', '#aec1d6'], scale: 1 },
  { colors: ['#cdd8e4', '#d0dbda', '#d6d8de', '#c8d3df'], scale: 0.78 },
];

function skylineTower(
  x: CanvasRenderingContext2D,
  left: number,
  towerWidth: number,
  top: number,
  bottom: number,
  color: string,
  roof: number,
  random: () => number,
) {
  x.fillStyle = color;
  x.beginPath();
  if (roof === 0) {
    // A flat roof with an antenna.
    x.rect(left, top, towerWidth, bottom - top);
    x.rect(left + towerWidth * 0.5 - 2, top - 30, 4, 30);
  } else if (roof === 1) {
    // A slanted top.
    x.moveTo(left, top + 26);
    x.lineTo(left + towerWidth, top);
    x.lineTo(left + towerWidth, bottom);
    x.lineTo(left, bottom);
  } else if (roof === 2) {
    // A stepped top.
    x.rect(left + towerWidth * 0.25, top, towerWidth * 0.5, 24);
    x.rect(left + towerWidth * 0.12, top + 20, towerWidth * 0.76, 24);
    x.rect(left, top + 40, towerWidth, bottom - top - 40);
  } else {
    // A plain flat roof.
    x.rect(left, top, towerWidth, bottom - top);
  }
  x.fill();
  x.fillStyle = 'rgb(255 255 255 / 34%)';
  const columns = Math.max(2, Math.floor(towerWidth / 16));
  for (let windowY = top + 50; windowY < bottom - 6; windowY += 20) {
    for (let column = 0; column < columns; column++) {
      if (random() < 0.32) {
        x.fillRect(left + 6 + (column * (towerWidth - 12)) / columns, windowY, 6, 9);
      }
    }
  }
}

export function drawSkyline(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const random = seededRandom(31);
  // The far row first, then the near one over it.
  for (const [rowIndex, row] of [...SKYLINE_ROWS].reverse().entries()) {
    let left = -20 + random() * 30;
    while (left < width) {
      const towerWidth = (60 + random() * 120) * row.scale;
      const centre = (left + towerWidth / 2) / width;
      // Taller towards the middle of the cluster, and lower at its edges.
      const middle = 1 - Math.abs(centre - 0.5) * 2;
      const rise = 0.25 + middle * 0.55 + random() * 0.2;
      const top = height - height * rise * (rowIndex === 0 ? 0.92 : 1);
      const color = row.colors[Math.floor(random() * row.colors.length)];
      skylineTower(x, left, towerWidth, top, height, color, Math.floor(random() * 4), random);
      // Packed close, sometimes overlapping the last one.
      left += towerWidth * (0.7 + random() * 0.35);
    }
  }
}

// The administrative office's tower: dark glass with gold trim, a gold plaque over its entrance with
// the bureau's name and a little chart, and a red rope on brass posts before its doors.
export function drawBureauTower(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const top = 60;
    const body = height - TOWER_ENTRANCE;
    x.fillStyle = '#26324a';
    x.fillRect(0, top, width, height - top);
    x.fillStyle = '#c9a24a';
    x.fillRect(0, top - 14, width, 16);
    x.fillRect(width / 2 - 3, 0, 6, top - 14);
    ellipse(x, width / 2, 6, 7, 7);
    const random = seededRandom(Math.round(width + height));
    for (let floorY = top + 24; floorY < body - 100; floorY += 40) {
      for (let column = 18; column < width - 30; column += 32) {
        x.fillStyle = random() < 0.25 ? '#f6e7a8' : '#3b4a66';
        x.fillRect(column, floorY, 22, 26);
      }
    }
    x.fillStyle = '#c9a24a';
    for (const side of [10, width - 16]) {
      x.fillRect(side, top, 6, body - top);
    }
    // The plaque, with the bureau's name and a little bar chart.
    const plaqueTop = body - 96;
    x.fillStyle = '#c9a24a';
    roundedRect(x, 20, plaqueTop, width - 40, 82, 10);
    x.fill();
    x.fillStyle = '#26324a';
    roundedRect(x, 28, plaqueTop + 8, width - 56, 66, 7);
    x.fill();
    for (const [index, barHeight] of [18, 30, 24, 40].entries()) {
      x.fillStyle = '#f3c14b';
      x.fillRect(42 + index * 12, plaqueTop + 64 - barHeight, 8, barHeight);
    }
    x.fillStyle = '#fbf1e1';
    x.textAlign = 'left';
    x.textBaseline = 'middle';
    let size = 30;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(name).width > width - 130 && size > 12);
    x.fillText(name, 100, plaqueTop + 42);
    towerEntrance(x, 0, width, height, {
      frame: '#c9a24a',
      canopy: '#c9a24a',
      base: '#1f2a3e',
      door: 'double',
    });
    // The red rope on its brass posts.
    x.strokeStyle = '#c8453a';
    x.lineWidth = 6;
    x.beginPath();
    x.moveTo(width * 0.12, height - 70);
    x.quadraticCurveTo(width * 0.22, height - 44, width * 0.3, height - 70);
    x.moveTo(width * 0.7, height - 70);
    x.quadraticCurveTo(width * 0.78, height - 44, width * 0.88, height - 70);
    x.stroke();
    x.fillStyle = '#c9a24a';
    for (const post of [0.12, 0.3, 0.7, 0.88]) {
      x.fillRect(width * post - 4, height - 76, 8, 76);
      ellipse(x, width * post, height - 78, 8, 8);
    }
  };
}
