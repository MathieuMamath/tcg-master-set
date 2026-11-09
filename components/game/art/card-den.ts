// The Card Den: the raccoon triplets, their counters, shelves and signs.

import {
  context,
  drawEye,
  type Eyes,
  ellipse,
  roundedRect,
  seededRandom,
  WOOD,
  WOOD_DARK,
  WOOD_LIGHT,
} from './core';

export type SellerLook = { accessory: 'crown' | 'glasses' | 'beret' };

// What each raccoon triplet wears on her head, and her colour, painted on her counter and her sign.
export const SELLERS: Record<'latest' | 'thisYear' | 'older', { look: SellerLook; color: string }> =
  {
    latest: { look: { accessory: 'crown' }, color: '#e0a51f' },
    thisYear: { look: { accessory: 'glasses' }, color: '#3a86c8' },
    older: { look: { accessory: 'beret' }, color: '#c8453a' },
  };

// Where a raccoon's face sits in her drawing, to frame it in a portrait.
export const RACCOON_SIZE = { width: 360, height: 314 };
export const RACCOON_FACE = { x: 140, y: 168, size: 210 };

// One of the raccoon triplets behind her counter: grey fur, a black mask round the eyes, round
// ears and a ringed tail. They look alike, so each wears something of her own on her head.
export function drawRaccoon({ accessory }: SellerLook) {
  return (
    drawing: CanvasRenderingContext2D,
    width: number,
    height: number,
    eyes: Eyes = 'open',
  ) => {
    const x = drawing;
    // Off centre, to leave room on the right for the whole tail.
    const cx = width / 2 - 40;
    const bottom = height - 4;
    const bodyY = bottom - 104;
    const headTop = bodyY - 100;
    // The ringed tail, sweeping out behind on the right.
    x.save();
    x.translate(cx + 70, bottom - 60);
    x.rotate(-0.6);
    for (let ring = 0; ring < 5; ring++) {
      x.fillStyle = ring % 2 === 0 ? '#9c9aa6' : '#3c3a44';
      ellipse(x, ring * 26, 0, 16, 22);
    }
    x.restore();
    // Ears, with their dark inside.
    for (const side of [-1, 1]) {
      x.fillStyle = '#7e7b88';
      ellipse(x, cx + side * 58, headTop + 18, 24, 26);
      x.fillStyle = '#3c3a44';
      ellipse(x, cx + side * 58, headTop + 18, 13, 15);
    }
    // Feet and body, with its pale belly.
    x.fillStyle = '#3c3a44';
    ellipse(x, cx - 38, bottom - 8, 26, 11);
    ellipse(x, cx + 38, bottom - 8, 26, 11);
    x.fillStyle = '#9c9aa6';
    ellipse(x, cx, bodyY, 90, 100);
    x.save();
    x.beginPath();
    x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
    x.clip();
    x.fillStyle = '#e8e6ec';
    ellipse(x, cx, bottom - 44, 60, 70);
    x.restore();
    // The mask round the eyes, and the pale snout.
    const eyesY = bodyY - 36;
    x.fillStyle = '#3c3a44';
    x.beginPath();
    x.ellipse(cx - 28, eyesY, 30, 20, -0.2, 0, Math.PI * 2);
    x.fill();
    x.beginPath();
    x.ellipse(cx + 28, eyesY, 30, 20, 0.2, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#e8e6ec';
    ellipse(x, cx, eyesY + 22, 22, 16);
    // Eyes, nose and smile.
    // Shut, the lids are pale, or they would vanish into the mask.
    const eyeColor = eyes === 'shut' ? '#c9c7d0' : '#111111';
    drawEye(x, cx - 26, eyesY, eyes, { color: eyeColor });
    drawEye(x, cx + 26, eyesY, eyes, { color: eyeColor });
    x.fillStyle = 'rgb(240 110 100 / 50%)';
    ellipse(x, cx - 50, eyesY + 22, 11, 7);
    ellipse(x, cx + 50, eyesY + 22, 11, 7);
    x.fillStyle = '#2c2a35';
    ellipse(x, cx, eyesY + 12, 7, 5);
    x.strokeStyle = '#2c2a35';
    x.lineWidth = 4;
    x.lineCap = 'round';
    x.beginPath();
    x.arc(cx, eyesY + 18, 9, 0.15 * Math.PI, 0.85 * Math.PI);
    x.stroke();
    // What each one wears on her head.
    if (accessory === 'crown') {
      const base = headTop + 14;
      x.fillStyle = '#f3c14b';
      x.beginPath();
      x.moveTo(cx - 34, base);
      x.lineTo(cx - 34, base - 36);
      x.lineTo(cx - 17, base - 18);
      x.lineTo(cx, base - 42);
      x.lineTo(cx + 17, base - 18);
      x.lineTo(cx + 34, base - 36);
      x.lineTo(cx + 34, base);
      x.closePath();
      x.fill();
      x.fillStyle = '#c8453a';
      ellipse(x, cx, base - 14, 5, 5);
    } else if (accessory === 'glasses') {
      x.strokeStyle = '#3a6fb0';
      x.lineWidth = 5;
      for (const side of [-1, 1]) {
        x.beginPath();
        x.arc(cx + side * 26, eyesY, 20, 0, Math.PI * 2);
        x.stroke();
      }
      x.beginPath();
      x.moveTo(cx - 6, eyesY);
      x.lineTo(cx + 6, eyesY);
      x.stroke();
    } else {
      // The beret sits snug on the top of the head, between the ears, tipped to one side.
      x.save();
      x.translate(cx + 6, headTop + 14);
      x.rotate(-0.18);
      x.fillStyle = '#c8453a';
      ellipse(x, 0, 0, 52, 20);
      x.fillStyle = '#a8372e';
      x.fillRect(-50, 6, 100, 9);
      x.fillStyle = '#c8453a';
      ellipse(x, 4, -20, 6, 7);
      x.restore();
    }
  };
}

// A shop counter, its front in its seller's colour, with a few packs on top.
export function drawCounter(color: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const top = 34;
    for (const [index, pack] of ['#5e4ba8', '#3c8fb4', '#7e63be'].entries()) {
      x.save();
      x.translate(30 + index * 34, top);
      x.rotate((index - 1) * 0.08);
      x.fillStyle = pack;
      roundedRect(x, 0, -34, 26, 38, 3);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 40%)';
      x.fillRect(5, -26, 16, 6);
      x.restore();
    }
    x.fillStyle = WOOD_DARK;
    roundedRect(x, 0, top, width, 18, 5);
    x.fill();
    x.fillStyle = WOOD;
    x.fillRect(10, top + 18, width - 20, height - top - 18);
    x.fillStyle = color;
    x.fillRect(10, top + 34, width - 20, 26);
    x.fillStyle = 'rgb(255 255 255 / 30%)';
    x.fillRect(10, top + 38, width - 20, 4);
    x.fillStyle = WOOD_LIGHT;
    for (let panel = 0; panel < 3; panel++) {
      const panelWidth = (width - 60) / 3;
      roundedRect(x, 20 + panel * (panelWidth + 10), top + 72, panelWidth, height - top - 86, 4);
      x.fill();
    }
  };
}

// Shelves full of sealed boosters, for the wall behind the counters.
export function drawBoosterShelves(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  const random = seededRandom(9);
  const colors = ['#5e4ba8', '#3c8fb4', '#7e63be', '#e2603a', '#5b9c4e', '#f3c14b', '#c8453a'];
  x.fillStyle = WOOD;
  x.fillRect(0, 0, width, height);
  x.fillStyle = WOOD_DARK;
  x.fillRect(10, 10, width - 20, height - 20);
  const shelves = 3;
  const shelfHeight = (height - 20) / shelves;
  for (let shelf = 0; shelf < shelves; shelf++) {
    const floor = 10 + shelfHeight * (shelf + 1);
    for (let pack = 20; pack < width - 40; pack += 30) {
      x.fillStyle = colors[Math.floor(random() * colors.length)];
      roundedRect(x, pack, floor - shelfHeight * 0.72, 24, shelfHeight * 0.66, 3);
      x.fill();
      x.fillStyle = 'rgb(255 255 255 / 35%)';
      x.fillRect(pack + 4, floor - shelfHeight * 0.62, 16, 6);
    }
    x.fillStyle = WOOD_LIGHT;
    x.fillRect(6, floor - 4, width - 12, 9);
  }
}

// A painted board with a word on it, in the game's title font.
export function drawSign(text: string, color: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    x.fillStyle = color;
    roundedRect(x, 0, 0, width, height, 14);
    x.fill();
    x.fillStyle = '#fbf6ea';
    roundedRect(x, 8, 8, width - 16, height - 16, 10);
    x.fill();
    x.fillStyle = '#2c2a35';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 40;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 2;
    } while (x.measureText(text).width > width - 40 && size > 14);
    x.fillText(text, width / 2, height / 2 + 2);
  };
}

// How far down a drawing its first solid row is, as a share of its height: where the top of a
// character's head, or of what it wears, is.
export function solidTop(canvas: HTMLCanvasElement): number {
  const pixels = context(canvas).getImageData(0, 0, canvas.width, canvas.height).data;
  for (let row = 0; row < canvas.height; row++) {
    for (let column = 0; column < canvas.width; column++) {
      if (pixels[(row * canvas.width + column) * 4 + 3] > 128) {
        return row / canvas.height;
      }
    }
  }
  return 1;
}
