// Linden Park: Papy Caillou, Lucas, and the trees, grass, lamps, benches and lake the outside shares.

import {
  addGrain,
  context,
  createCanvas,
  drawEye,
  type Eyes,
  ellipse,
  roundBody,
  roundedRect,
  seededRandom,
  WOOD,
} from './core';

function smilingEyes(x: CanvasRenderingContext2D, cx: number, eyesY: number) {
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 4;
  x.lineCap = 'round';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.arc(cx + side * 26, eyesY + 2, 9, 1.15 * Math.PI, 1.85 * Math.PI);
    x.stroke();
  }
  x.fillStyle = 'rgb(240 110 100 / 45%)';
  ellipse(x, cx - 50, eyesY + 24, 12, 7);
  ellipse(x, cx + 50, eyesY + 24, 12, 7);
}

// Where Papy Caillou's face sits in his drawing, to frame it in a portrait.
export const PAPY_SIZE = { width: 340, height: 330 };
export const PAPY_FACE = { x: 150, y: 196, size: 200 };

// Papy Caillou, the old tortoise of the park: mischievous and kind, a flat cap, a white moustache,
// a buttoned cardigan over his shell, and a cane.
export function drawPapy(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2 - 20;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 36;
  const headTop = bodyY - 100;
  // The shell behind him, with its plates.
  x.fillStyle = '#8a5a35';
  ellipse(x, cx, bottom - 96, 112, 104);
  x.fillStyle = '#b07a45';
  ellipse(x, cx, bottom - 96, 102, 94);
  roundBody(x, cx, bottom, { body: '#8dba7a', belly: '#e6e0b8', feet: '#6e9a5e' });
  // The cardigan, buttoned over his belly.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#5b7fa8';
  x.fillRect(cx - 100, bodyY - 6, 200, 120);
  x.fillStyle = '#e6e0b8';
  x.beginPath();
  x.moveTo(cx - 22, bodyY - 6);
  x.lineTo(cx, bodyY + 44);
  x.lineTo(cx + 22, bodyY - 6);
  x.fill();
  x.fillStyle = '#f3c14b';
  for (let button = 0; button < 3; button++) {
    ellipse(x, cx + 8, bodyY + 48 + button * 18, 4, 4);
  }
  x.restore();
  // Face: smiling eyes, a little nose, and a big white moustache.
  smilingEyes(x, cx, eyesY);
  x.fillStyle = '#4f7a44';
  ellipse(x, cx - 5, eyesY + 10, 2.5, 2.5);
  ellipse(x, cx + 5, eyesY + 10, 2.5, 2.5);
  x.fillStyle = '#f4f1ec';
  x.beginPath();
  x.ellipse(cx - 16, eyesY + 22, 20, 9, -0.3, 0, Math.PI * 2);
  x.fill();
  x.beginPath();
  x.ellipse(cx + 16, eyesY + 22, 20, 9, 0.3, 0, Math.PI * 2);
  x.fill();
  // The flat cap, with its peak.
  x.fillStyle = '#c9b48a';
  x.beginPath();
  x.ellipse(cx - 4, headTop + 22, 66, 30, 0, Math.PI, 0);
  x.fill();
  x.fillStyle = '#a8946a';
  ellipse(x, cx + 40, headTop + 24, 38, 9);
  x.strokeStyle = 'rgb(255 255 255 / 25%)';
  x.lineWidth = 2;
  for (let stripe = -3; stripe <= 3; stripe++) {
    x.beginPath();
    x.moveTo(cx - 4 + stripe * 14, headTop - 4);
    x.lineTo(cx - 4 + stripe * 16, headTop + 20);
    x.stroke();
  }
  // The cane.
  x.strokeStyle = '#7f5530';
  x.lineWidth = 8;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(cx + 96, bottom - 4);
  x.lineTo(cx + 96, bottom - 110);
  x.arc(cx + 82, bottom - 110, 14, 0, Math.PI, true);
  x.stroke();
}

// Where Lucas's face sits in his drawing, to frame it in a portrait.
export const LUCAS_SIZE = { width: 300, height: 330 };
export const LUCAS_FACE = { x: 108, y: 200, size: 160 };

// Lucas, the little otter who keeps dropping his things in the lake: a cap on backwards, and his
// fishing rod held out over the water.
export function drawLucas(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = 110;
  const bottom = height - 6;
  const scale = 0.78;
  x.save();
  x.translate(cx, bottom);
  x.scale(scale, scale);
  x.translate(-cx, -bottom);
  const bodyY = bottom - 104;
  const eyesY = bodyY - 36;
  const headTop = bodyY - 100;
  // Small round ears.
  x.fillStyle = '#7a5236';
  ellipse(x, cx - 56, headTop + 20, 16, 16);
  ellipse(x, cx + 56, headTop + 20, 16, 16);
  roundBody(x, cx, bottom, { body: '#8e6040', belly: '#e9d3b4', feet: '#6e4a30' });
  // A pale muzzle, eyes, nose and whiskers.
  x.fillStyle = '#e9d3b4';
  ellipse(x, cx, eyesY + 20, 40, 26);
  drawEye(x, cx - 26, eyesY, eyes);
  drawEye(x, cx + 26, eyesY, eyes);
  x.fillStyle = '#3a2a20';
  ellipse(x, cx, eyesY + 8, 9, 6);
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 4;
  x.lineCap = 'round';
  x.beginPath();
  x.arc(cx, eyesY + 18, 9, 0.15 * Math.PI, 0.85 * Math.PI);
  x.stroke();
  x.strokeStyle = '#5a3e2a';
  x.lineWidth = 2;
  for (const side of [-1, 1]) {
    for (const tilt of [-1, 1]) {
      x.beginPath();
      x.moveTo(cx + side * 30, eyesY + 20 + tilt * 4);
      x.lineTo(cx + side * 64, eyesY + 16 + tilt * 10);
      x.stroke();
    }
  }
  x.fillStyle = 'rgb(240 110 100 / 45%)';
  ellipse(x, cx - 50, eyesY + 22, 11, 7);
  ellipse(x, cx + 50, eyesY + 22, 11, 7);
  // The cap, on backwards.
  x.fillStyle = '#f3c14b';
  x.beginPath();
  x.ellipse(cx, headTop + 24, 58, 30, 0, Math.PI, 0);
  x.fill();
  ellipse(x, cx - 56, headTop + 24, 30, 8);
  x.fillStyle = '#fbf6ea';
  ellipse(x, cx, headTop - 4, 6, 6);
  x.restore();
  // The rod, held out to the right, with its line and red float.
  x.strokeStyle = '#8a5a35';
  x.lineWidth = 6;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(cx + 40, bottom - 60);
  x.lineTo(width - 20, bottom - 250);
  x.stroke();
  x.strokeStyle = 'rgb(44 42 53 / 60%)';
  x.lineWidth = 1.5;
  x.beginPath();
  x.moveTo(width - 20, bottom - 250);
  x.quadraticCurveTo(width - 4, bottom - 150, width - 14, bottom - 40);
  x.stroke();
  x.fillStyle = '#e8453a';
  ellipse(x, width - 14, bottom - 40, 7, 7);
  x.fillStyle = '#fbf6ea';
  ellipse(x, width - 14, bottom - 45, 7, 3);
  x.fillStyle = '#3a3845';
  ellipse(x, cx + 44, bottom - 66, 8, 6);
}

// A round tree: a trunk and a cloud of leaves in two greens.
export function drawTree(seed: number) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(seed);
    x.fillStyle = '#8a5a35';
    x.fillRect(width / 2 - 14, height * 0.55, 28, height * 0.45);
    for (const [left, top, size] of [
      [0.5, 0.28, 0.32],
      [0.3, 0.42, 0.24],
      [0.7, 0.42, 0.24],
      [0.5, 0.5, 0.28],
    ]) {
      x.fillStyle = random() < 0.5 ? '#579552' : '#6fae5e';
      ellipse(x, width * left, height * top, width * size, width * size);
    }
    x.fillStyle = 'rgb(255 255 255 / 18%)';
    ellipse(x, width * 0.4, height * 0.2, width * 0.09, width * 0.06);
  };
}

// A pine: a trunk under three tiers of needles, alternating two greens.
export function drawPine(seed: number) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(seed);
    const dark = random() < 0.5 ? '#3f7d48' : '#4c8a4a';
    x.fillStyle = '#8a5a35';
    x.fillRect(width / 2 - 12, height * 0.7, 24, height * 0.3);
    for (let tier = 0; tier < 3; tier++) {
      const top = height * (0.02 + tier * 0.19);
      const bottom = height * (0.36 + tier * 0.19);
      const halfWidth = width * (0.24 + tier * 0.1);
      x.fillStyle = tier % 2 === 0 ? dark : '#5a9a55';
      x.beginPath();
      x.moveTo(width / 2, top);
      x.lineTo(width / 2 + halfWidth, bottom);
      x.lineTo(width / 2 - halfWidth, bottom);
      x.closePath();
      x.fill();
    }
    x.fillStyle = 'rgb(255 255 255 / 16%)';
    x.beginPath();
    x.moveTo(width / 2, height * 0.04);
    x.lineTo(width / 2 - width * 0.12, height * 0.2);
    x.lineTo(width / 2 - width * 0.04, height * 0.2);
    x.closePath();
    x.fill();
  };
}

const FLOWER_COLORS = ['#e8645a', '#f3c14b', '#f4f0e6', '#9a7bd6'];

// A tuft of grass, with a flower or two standing out of it.
export function drawTuft(seed: number) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(seed);
    for (let blade = 0; blade < 9; blade++) {
      x.fillStyle = blade % 2 === 0 ? '#6fae5e' : '#4f8f4e';
      const baseX = width * 0.15 + random() * width * 0.7;
      const bladeHeight = height * (0.35 + random() * 0.45);
      x.beginPath();
      x.moveTo(baseX - 8, height);
      x.quadraticCurveTo(
        baseX + (random() - 0.5) * 30,
        height - bladeHeight * 0.6,
        baseX + (random() - 0.5) * 24,
        height - bladeHeight,
      );
      x.quadraticCurveTo(baseX + 4, height - bladeHeight * 0.4, baseX + 8, height);
      x.fill();
    }
    const flowers = 1 + Math.floor(random() * 2);
    for (let flower = 0; flower < flowers; flower++) {
      const flowerX = width * (flowers === 1 ? 0.5 : 0.3 + flower * 0.4);
      const flowerY = height * (0.25 + random() * 0.2);
      x.strokeStyle = '#4f8f4e';
      x.lineWidth = 4;
      x.beginPath();
      x.moveTo(flowerX, height);
      x.lineTo(flowerX, flowerY);
      x.stroke();
      x.fillStyle = FLOWER_COLORS[Math.floor(random() * FLOWER_COLORS.length)] ?? '#f3c14b';
      for (let petal = 0; petal < 5; petal++) {
        const angle = (petal / 5) * Math.PI * 2;
        ellipse(x, flowerX + Math.cos(angle) * 10, flowerY + Math.sin(angle) * 10, 8, 8);
      }
      x.fillStyle = '#f7d36a';
      ellipse(x, flowerX, flowerY, 6, 6);
    }
  };
}

// A lamp's warm halo, brightest in the middle and fading out to nothing.
export function drawLampGlow(): HTMLCanvasElement {
  const canvas = createCanvas(256, 256);
  const x = context(canvas);
  const gradient = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgb(255 236 170 / 100%)');
  gradient.addColorStop(0.18, 'rgb(255 214 130 / 75%)');
  gradient.addColorStop(0.5, 'rgb(255 190 100 / 22%)');
  gradient.addColorStop(1, 'rgb(255 180 90 / 0%)');
  x.fillStyle = gradient;
  x.fillRect(0, 0, 256, 256);
  return canvas;
}

export type LampStyle = 'classic' | 'modern';

// Each lamp's drawing, and where its light sits in it, as shares of its width and height.
export const LAMP_DRAWINGS: Record<
  LampStyle,
  { width: number; height: number; lightX: number; lightY: number }
> = {
  classic: { width: 140, height: 440, lightX: 0.5, lightY: 0.14 },
  modern: { width: 220, height: 440, lightX: 0.74, lightY: 0.09 },
};

// A street lamp: a green cast-iron lantern for the village and the park, or a slim grey pole with
// a long arm for the big city. Its glass stays pale: the scene lights it up at night.
export function drawStreetLamp(style: LampStyle) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    if (style === 'classic') {
      const middle = width / 2;
      x.fillStyle = '#2f5a48';
      // The base, the pole, and the ring under the lantern.
      roundedRect(x, middle - 26, height - 46, 52, 46, 8);
      x.fill();
      x.fillRect(middle - 9, height * 0.26, 18, height * 0.66);
      roundedRect(x, middle - 22, height * 0.245, 44, 14, 5);
      x.fill();
      // The lantern: a glass box under a pointed roof, with a knob on top.
      x.fillStyle = '#f3ead0';
      x.beginPath();
      x.moveTo(middle - 30, height * 0.08);
      x.lineTo(middle + 30, height * 0.08);
      x.lineTo(middle + 22, height * 0.24);
      x.lineTo(middle - 22, height * 0.24);
      x.closePath();
      x.fill();
      x.strokeStyle = '#2f5a48';
      x.lineWidth = 6;
      x.stroke();
      x.beginPath();
      x.moveTo(middle, height * 0.08);
      x.lineTo(middle, height * 0.24);
      x.lineWidth = 4;
      x.stroke();
      x.fillStyle = '#2f5a48';
      x.beginPath();
      x.moveTo(middle - 40, height * 0.085);
      x.lineTo(middle, height * 0.02);
      x.lineTo(middle + 40, height * 0.085);
      x.closePath();
      x.fill();
      ellipse(x, middle, height * 0.018, 8, 8);
      return;
    }
    const poleX = width * 0.26;
    x.fillStyle = '#5b6470';
    roundedRect(x, poleX - 20, height - 24, 40, 24, 6);
    x.fill();
    x.fillRect(poleX - 7, height * 0.07, 14, height * 0.9);
    // The arm reaching over the pavement, and the flat head at its end.
    x.strokeStyle = '#5b6470';
    x.lineWidth = 12;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(poleX, height * 0.1);
    x.quadraticCurveTo(poleX + 10, height * 0.05, width * 0.55, height * 0.06);
    x.lineTo(width * 0.66, height * 0.065);
    x.stroke();
    x.fillStyle = '#3e4651';
    roundedRect(x, width * 0.56, height * 0.045, width * 0.36, 22, 10);
    x.fill();
    x.fillStyle = '#eef3f6';
    roundedRect(x, width * 0.6, height * 0.045 + 16, width * 0.28, 8, 4);
    x.fill();
  };
}

// The park's bench, with Papy Caillou's memory cards laid out on it, face down.
export function drawBench(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const seat = height * 0.5;
  x.fillStyle = '#5e8c6a';
  x.fillRect(16, height * 0.12, width - 32, 16);
  x.fillRect(16, height * 0.3, width - 32, 16);
  x.fillStyle = WOOD;
  roundedRect(x, 0, seat, width, 18, 5);
  x.fill();
  x.fillStyle = '#3f6b52';
  for (const legX of [20, width - 36]) {
    x.fillRect(legX, seat + 18, 16, height - seat - 18);
    x.fillRect(legX, height * 0.12, 10, seat - height * 0.12);
  }
  for (let card = 0; card < 4; card++) {
    x.save();
    x.translate(width * 0.22 + card * 34, seat - 2);
    x.rotate((card - 1.5) * 0.08);
    x.fillStyle = '#fbf6ea';
    roundedRect(x, -12, -6, 26, 8, 2);
    x.fill();
    x.fillStyle = '#c8453a';
    x.fillRect(-9, -5, 20, 5);
    x.restore();
  }
}

// Reeds at the edge of the lake.
export function drawReeds(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const random = seededRandom(47);
  for (let reed = 0; reed < 9; reed++) {
    const reedX = 10 + reed * ((width - 20) / 8);
    const reedHeight = height * (0.5 + random() * 0.45);
    x.strokeStyle = reed % 2 === 0 ? '#5b9c4e' : '#78ae6c';
    x.lineWidth = 5;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(reedX, height);
    x.quadraticCurveTo(
      reedX + (random() - 0.5) * 20,
      height - reedHeight / 2,
      reedX + (random() - 0.5) * 14,
      height - reedHeight,
    );
    x.stroke();
    if (reed % 3 === 0) {
      x.fillStyle = '#8a5a35';
      ellipse(x, reedX, height - reedHeight + 14, 6, 16);
    }
  }
}

// The park's ground: a lawn with a sandy path along it.
export function drawParkGround(): HTMLCanvasElement {
  const width = 1600;
  const height = 420;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const random = seededRandom(53);
  x.fillStyle = '#8cc47a';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(60 110 60 / 25%)';
  x.lineWidth = 2;
  for (let blade = 0; blade < 900; blade++) {
    const bladeX = random() * width;
    const bladeY = random() * height;
    x.beginPath();
    x.moveTo(bladeX, bladeY);
    x.lineTo(bladeX + (random() - 0.5) * 6, bladeY - 8);
    x.stroke();
  }
  x.fillStyle = '#e2c99a';
  x.fillRect(0, height * 0.62, width, height * 0.3);
  x.fillStyle = 'rgb(255 255 255 / 25%)';
  for (let pebble = 0; pebble < 160; pebble++) {
    ellipse(x, random() * width, height * 0.64 + random() * height * 0.26, 3, 2);
  }
  addGrain(canvas, 12, 54);
  return canvas;
}

// The lake's water, with soft ripples.
export function drawLake(): HTMLCanvasElement {
  const width = 800;
  const height = 300;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  const gradient = x.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#5fa8d6');
  gradient.addColorStop(1, '#8cc3e6');
  x.fillStyle = gradient;
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(255 255 255 / 45%)';
  x.lineWidth = 3;
  const random = seededRandom(59);
  for (let ripple = 0; ripple < 26; ripple++) {
    const rippleX = random() * width;
    const rippleY = random() * height;
    x.beginPath();
    x.ellipse(rippleX, rippleY, 26 + random() * 30, 5, 0, Math.PI * 1.1, Math.PI * 1.9);
    x.stroke();
  }
  addGrain(canvas, 10, 60);
  return canvas;
}
