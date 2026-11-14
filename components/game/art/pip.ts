// Pip, the character the player walks about as: a fox at first, or whichever animal was chosen at
// the wardrobe. Every animal keeps the same round shape, scarf and satchel, and only its ears, its
// coat and a few features change.

import type { AvatarSpecies } from '@/game/avatar/species';
import { drawEye, type Eyes, ellipse, roundedRect } from './core';

type Coat = {
  fur: string;
  // The far ear and anything else seen in shade.
  shade: string;
  feet: string;
  // The pale front, from the muzzle down.
  belly: string;
  // Inside the ears, where they show it.
  inner: string;
};

const COATS: Record<AvatarSpecies, Coat> = {
  fox: { fur: '#f2a95b', shade: '#e2914c', feet: '#c0703a', belly: '#fce7c4', inner: '#f6c6a0' },
  turtle: { fur: '#a5cf74', shade: '#8fbb5f', feet: '#7aa54c', belly: '#f3e7b3', inner: '#f3e7b3' },
  dog: { fur: '#e8c48f', shade: '#9c6a3c', feet: '#b98a52', belly: '#fbf0dc', inner: '#b98a52' },
  cat: { fur: '#c9c1ba', shade: '#b2a9a1', feet: '#958c84', belly: '#f6f2ed', inner: '#f2bcc4' },
  rabbit: { fur: '#f4efe7', shade: '#e2dbd0', feet: '#d4cbbe', belly: '#fffdf9', inner: '#f5b9c3' },
  bear: { fur: '#b07a4f', shade: '#9b693f', feet: '#7a4f30', belly: '#e9cba3', inner: '#d8a27c' },
  wolf: { fur: '#a3abb5', shade: '#8d96a1', feet: '#6f7782', belly: '#eceff2', inner: '#d9c8c8' },
  gorilla: {
    fur: '#4d4853',
    shade: '#3c3842',
    feet: '#2f2b33',
    belly: '#6e6775',
    inner: '#a8968a',
  },
  penguin: {
    fur: '#2f5590',
    shade: '#24457a',
    feet: '#f2a33a',
    belly: '#f5f7fb',
    inner: '#f5f7fb',
  },
  redPanda: {
    fur: '#c8572e',
    shade: '#a8441f',
    feet: '#3e2a24',
    belly: '#5a3a2c',
    inner: '#fdf3e6',
  },
};

const INK = '#2c2a35';

// Pip facing right, with a scarf and a satchel of cards, as the given animal.
export function drawPip(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
  species: AvatarSpecies = 'fox',
) {
  const x = drawing;
  const cx = width / 2 - 6;
  const by = height - 10;
  const coat = COATS[species];
  x.lineCap = 'round';
  x.lineJoin = 'round';

  if (species === 'turtle') {
    drawShell(x, cx, by);
  }

  // The scarf's end, flying behind.
  x.fillStyle = '#2f74ae';
  x.beginPath();
  x.moveTo(cx - 70, by - 104);
  x.quadraticCurveTo(cx - 100, by - 112, cx - 116, by - 86);
  x.lineTo(cx - 104, by - 74);
  x.quadraticCurveTo(cx - 92, by - 92, cx - 66, by - 86);
  x.fill();
  x.strokeStyle = '#2f74ae';
  x.lineWidth = 3;
  for (let fringe = 0; fringe < 3; fringe++) {
    x.beginPath();
    x.moveTo(cx - 114 + fringe * 5, by - 84 + fringe * 4);
    x.lineTo(cx - 122 + fringe * 5, by - 78 + fringe * 4);
    x.stroke();
  }

  // Feet, broad and heavy on the gorilla.
  x.fillStyle = coat.feet;
  const isBroadFooted = species === 'gorilla';
  const footWidth = isBroadFooted ? 36 : 26;
  const footHeight = isBroadFooted ? 15 : 11;
  const spread = isBroadFooted ? 4 : 0;
  ellipse(x, cx - 34 - spread, by - 8, footWidth, footHeight);
  ellipse(x, cx + 40 + spread, by - 8, footWidth, footHeight);

  drawEarsBehind(x, cx, by, species, coat);

  // Body and pale muzzle.
  x.fillStyle = coat.fur;
  ellipse(x, cx + 4, by - 104, 90, 102);
  x.save();
  x.beginPath();
  x.ellipse(cx + 4, by - 104, 90, 102, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = coat.belly;
  ellipse(x, cx + 39, by - 49, 66, 78);
  drawMarkings(x, cx, by, species, coat);
  x.restore();

  if (species === 'dog') {
    drawFloppyEar(x, cx, by, coat);
  }

  // Face.
  drawEye(x, cx + 16, by - 138, eyes, { width: 9.5 });
  drawEye(x, cx + 60, by - 138, eyes, { width: 9.5 });
  x.fillStyle = 'rgb(240 110 100 / 55%)';
  ellipse(x, cx - 2, by - 114, 11, 7);
  ellipse(x, cx + 78, by - 114, 9, 6);
  if (species === 'penguin') {
    drawBeak(x, cx, by);
  } else {
    if (species !== 'fox' && species !== 'turtle') {
      x.fillStyle = species === 'rabbit' || species === 'cat' ? '#e98a9a' : INK;
      ellipse(x, cx + 40, by - 128, species === 'rabbit' || species === 'cat' ? 5 : 7, 4.5);
    }
    x.strokeStyle = INK;
    x.lineWidth = 4;
    x.beginPath();
    x.arc(cx + 40, by - 120, 9, 0.15 * Math.PI, 0.85 * Math.PI);
    x.stroke();
  }
  if (species === 'cat') {
    drawWhiskers(x, cx, by);
  }

  drawGear(x, cx, by);
}

// The fox's pointed ears, which the wolf shares. They are drawn mirrored around the body's middle,
// so that the taller, lighter ear stands on the left and the darker one on the right.
function drawPointedEars(x: CanvasRenderingContext2D, cx: number, by: number, coat: Coat) {
  x.save();
  x.translate(2 * (cx + 4), 0);
  x.scale(-1, 1);
  x.fillStyle = coat.shade;
  x.beginPath();
  x.moveTo(cx - 60, by - 168);
  x.quadraticCurveTo(cx - 56, by - 230, cx - 36, by - 262);
  x.quadraticCurveTo(cx - 16, by - 232, cx - 6, by - 196);
  x.lineTo(cx - 30, by - 160);
  x.closePath();
  x.fill();
  x.fillStyle = coat.fur;
  x.beginPath();
  x.moveTo(cx + 22, by - 192);
  x.quadraticCurveTo(cx + 40, by - 236, cx + 66, by - 264);
  x.quadraticCurveTo(cx + 80, by - 224, cx + 70, by - 168);
  x.lineTo(cx + 46, by - 160);
  x.closePath();
  x.fill();
  // Only the near ear shows its pale inside: the far one is seen from behind.
  x.fillStyle = coat.inner;
  x.beginPath();
  x.moveTo(cx + 36, by - 196);
  x.quadraticCurveTo(cx + 48, by - 226, cx + 64, by - 246);
  x.quadraticCurveTo(cx + 70, by - 216, cx + 64, by - 182);
  x.closePath();
  x.fill();
  x.restore();
}

// The ears standing up behind the head, before the body is drawn over their base.
function drawEarsBehind(
  x: CanvasRenderingContext2D,
  cx: number,
  by: number,
  species: AvatarSpecies,
  coat: Coat,
) {
  if (species === 'fox' || species === 'wolf') {
    drawPointedEars(x, cx, by, coat);
  } else if (species === 'cat') {
    // Short and pointed, set wide apart.
    x.fillStyle = coat.shade;
    x.beginPath();
    // Its base reaches well into the head, so that the body drawn over it leaves no gap.
    x.moveTo(cx + 12, by - 186);
    x.quadraticCurveTo(cx + 44, by - 228, cx + 62, by - 244);
    x.quadraticCurveTo(cx + 80, by - 206, cx + 80, by - 150);
    x.closePath();
    x.fill();
    x.fillStyle = coat.fur;
    x.beginPath();
    x.moveTo(cx - 64, by - 172);
    x.quadraticCurveTo(cx - 62, by - 214, cx - 50, by - 246);
    x.quadraticCurveTo(cx - 28, by - 226, cx - 12, by - 198);
    x.closePath();
    x.fill();
    x.fillStyle = coat.inner;
    x.beginPath();
    x.moveTo(cx - 54, by - 184);
    x.quadraticCurveTo(cx - 52, by - 212, cx - 48, by - 230);
    x.quadraticCurveTo(cx - 34, by - 216, cx - 24, by - 198);
    x.closePath();
    x.fill();
  } else if (species === 'rabbit') {
    // Long and rounded, the near one showing its pink inside.
    x.save();
    x.translate(cx + 46, by - 226);
    x.rotate(0.24);
    x.fillStyle = coat.shade;
    ellipse(x, 0, 0, 17, 54);
    x.restore();
    x.save();
    x.translate(cx - 26, by - 228);
    x.rotate(-0.16);
    x.fillStyle = coat.fur;
    ellipse(x, 0, 0, 19, 56);
    x.fillStyle = coat.inner;
    ellipse(x, 1, -2, 9, 42);
    x.restore();
  } else if (species === 'bear') {
    // Small and round, high on the head.
    for (const [earX, color] of [
      [cx + 58, coat.shade],
      [cx - 46, coat.fur],
    ] as const) {
      x.fillStyle = color;
      ellipse(x, earX, by - 186, 27, 27);
      x.fillStyle = coat.inner;
      ellipse(x, earX, by - 184, 14, 14);
    }
  } else if (species === 'gorilla') {
    // Small ears low on the sides of the head.
    for (const [earX, earY] of [
      [cx - 82, by - 148],
      [cx + 90, by - 150],
    ]) {
      x.fillStyle = coat.shade;
      ellipse(x, earX, earY, 14, 15);
      x.fillStyle = coat.inner;
      ellipse(x, earX, earY + 1, 7, 8);
    }
  } else if (species === 'redPanda') {
    // Wide, rounded ears with white rims.
    for (const [left, tipX, right] of [
      [cx + 18, cx + 58, cx + 84],
      [cx - 74, cx - 46, cx - 10],
    ]) {
      x.fillStyle = coat.inner;
      x.beginPath();
      x.moveTo(left, by - 176);
      x.quadraticCurveTo(left + 2, by - 236, tipX, by - 236);
      x.quadraticCurveTo(right, by - 232, right, by - 176);
      x.closePath();
      x.fill();
      x.fillStyle = coat.shade;
      x.beginPath();
      x.moveTo(left + 12, by - 184);
      x.quadraticCurveTo(left + 14, by - 222, tipX, by - 222);
      x.quadraticCurveTo(right - 12, by - 220, right - 12, by - 184);
      x.closePath();
      x.fill();
    }
  } else if (species === 'dog') {
    // The far ear, seen from behind the head; the near one hangs in front, drawn after the body.
    x.save();
    x.translate(cx + 72, by - 178);
    x.rotate(-0.55);
    x.fillStyle = coat.shade;
    ellipse(x, 0, 0, 21, 42);
    x.restore();
  }
  // The turtle has no ears.
}

// The dog's near ear, soft and hanging down the side of its head.
function drawFloppyEar(x: CanvasRenderingContext2D, cx: number, by: number, coat: Coat) {
  x.save();
  x.translate(cx - 70, by - 166);
  x.rotate(0.32);
  x.fillStyle = coat.shade;
  ellipse(x, 0, 0, 21, 42);
  x.fillStyle = 'rgb(0 0 0 / 12%)';
  ellipse(x, 4, 8, 12, 28);
  x.restore();
}

// What some coats have on top, drawn inside the body's outline.
function drawMarkings(
  x: CanvasRenderingContext2D,
  cx: number,
  by: number,
  species: AvatarSpecies,
  coat: Coat,
) {
  if (species === 'cat') {
    // Tabby stripes on the brow.
    x.strokeStyle = coat.feet;
    x.lineWidth = 6;
    for (const offset of [-16, 0, 16]) {
      x.beginPath();
      x.moveTo(cx + 38 + offset, by - 198);
      x.lineTo(cx + 38 + offset * 0.8, by - 176);
      x.stroke();
    }
  } else if (species === 'dog') {
    // A brown patch round the far eye.
    x.fillStyle = coat.inner;
    ellipse(x, cx + 62, by - 142, 20, 18);
  } else if (species === 'turtle') {
    // A few freckles on the crown.
    x.fillStyle = coat.feet;
    for (const [dotX, dotY, size] of [
      [cx - 20, by - 186, 6],
      [cx + 4, by - 194, 5],
      [cx - 36, by - 168, 4],
    ]) {
      ellipse(x, dotX, dotY, size, size);
    }
  } else if (species === 'gorilla') {
    // A bare face under a heavy brow.
    x.fillStyle = coat.inner;
    ellipse(x, cx + 38, by - 130, 54, 38);
    x.fillStyle = coat.shade;
    ellipse(x, cx + 38, by - 159, 44, 9);
  } else if (species === 'penguin') {
    // A white face, joined to the white front.
    x.fillStyle = coat.belly;
    ellipse(x, cx + 38, by - 132, 52, 38);
  } else if (species === 'redPanda') {
    // A white muzzle and white marks over the eyes.
    x.fillStyle = coat.inner;
    ellipse(x, cx + 40, by - 120, 32, 21);
    ellipse(x, cx + 14, by - 162, 11, 7);
    ellipse(x, cx + 62, by - 162, 11, 7);
  } else if (species === 'wolf') {
    // A darker cap over the head.
    x.fillStyle = coat.shade;
    ellipse(x, cx - 6, by - 196, 70, 30);
  }
}

// The penguin's little orange beak, where the others have a mouth.
function drawBeak(x: CanvasRenderingContext2D, cx: number, by: number) {
  x.fillStyle = '#f2a33a';
  x.beginPath();
  x.moveTo(cx + 28, by - 126);
  x.quadraticCurveTo(cx + 40, by - 134, cx + 52, by - 126);
  x.quadraticCurveTo(cx + 40, by - 108, cx + 28, by - 126);
  x.fill();
  x.fillStyle = 'rgb(0 0 0 / 15%)';
  x.beginPath();
  x.moveTo(cx + 30, by - 122);
  x.quadraticCurveTo(cx + 40, by - 118, cx + 50, by - 122);
  x.quadraticCurveTo(cx + 40, by - 110, cx + 30, by - 122);
  x.fill();
}

// The cat's whiskers, either side of its nose.
function drawWhiskers(x: CanvasRenderingContext2D, cx: number, by: number) {
  x.strokeStyle = 'rgb(44 42 53 / 70%)';
  x.lineWidth = 2.5;
  for (const [fromX, toX, rise] of [
    [cx + 66, cx + 98, -8],
    [cx + 66, cx + 100, 2],
    [cx + 12, cx - 20, -8],
    [cx + 12, cx - 22, 2],
  ]) {
    x.beginPath();
    x.moveTo(fromX, by - 124);
    x.lineTo(toX, by - 124 + rise);
    x.stroke();
  }
}

// The turtle's shell, on its back, behind everything else.
function drawShell(x: CanvasRenderingContext2D, cx: number, by: number) {
  x.fillStyle = '#4f7a33';
  ellipse(x, cx - 66, by - 116, 64, 82);
  x.fillStyle = '#6a9a44';
  ellipse(x, cx - 66, by - 116, 54, 72);
  x.strokeStyle = '#4f7a33';
  x.lineWidth = 5;
  for (const [plateX, plateY] of [
    [cx - 92, by - 146],
    [cx - 96, by - 98],
    [cx - 70, by - 178],
  ]) {
    x.beginPath();
    x.ellipse(plateX, plateY, 18, 20, 0, 0, Math.PI * 2);
    x.stroke();
  }
}

// The scarf and the satchel, the same on every animal.
function drawGear(x: CanvasRenderingContext2D, cx: number, by: number) {
  // The satchel's strap.
  x.strokeStyle = '#8c4b2e';
  x.lineWidth = 7;
  x.beginPath();
  x.moveTo(cx + 62, by - 74);
  x.quadraticCurveTo(cx, by - 60, cx - 58, by - 52);
  x.stroke();

  // The scarf round the neck, striped.
  x.beginPath();
  x.moveTo(cx - 88, by - 110);
  x.quadraticCurveTo(cx + 4, by - 84, cx + 94, by - 110);
  x.lineTo(cx + 92, by - 86);
  x.quadraticCurveTo(cx + 4, by - 58, cx - 86, by - 86);
  x.closePath();
  x.fillStyle = '#3d8fd1';
  x.fill();
  x.save();
  x.clip();
  x.fillStyle = '#2f74ae';
  for (let stripe = 0; stripe < 7; stripe++) {
    x.beginPath();
    x.moveTo(cx - 76 + stripe * 28, by - 120);
    x.lineTo(cx - 68 + stripe * 28, by - 120);
    x.lineTo(cx - 64 + stripe * 28, by - 50);
    x.lineTo(cx - 72 + stripe * 28, by - 50);
    x.fill();
  }
  x.fillStyle = 'rgb(255 255 255 / 22%)';
  x.beginPath();
  x.moveTo(cx - 80, by - 104);
  x.quadraticCurveTo(cx + 4, by - 80, cx + 88, by - 104);
  x.lineTo(cx + 88, by - 98);
  x.quadraticCurveTo(cx + 4, by - 74, cx - 80, by - 98);
  x.fill();
  x.restore();

  // The scarf's knot, hanging in front.
  for (const [offsetX, angle, tailWidth, tailHeight] of [
    [70, 0.12, 18, 40],
    [80, -0.3, 16, 32],
  ]) {
    x.save();
    x.translate(cx + offsetX, by - 80);
    x.rotate(angle);
    x.fillStyle = '#3d8fd1';
    roundedRect(x, -tailWidth / 2, 0, tailWidth, tailHeight, 6);
    x.fill();
    x.fillStyle = '#2f74ae';
    x.fillRect(-tailWidth / 2, tailHeight - 10, tailWidth, 6);
    x.restore();
  }
  x.fillStyle = '#2f74ae';
  ellipse(x, cx + 74, by - 82, 13, 11);
  x.fillStyle = '#3d8fd1';
  ellipse(x, cx + 73, by - 84, 9, 7);

  // The satchel, with three cards sticking out.
  x.fillStyle = '#b4552f';
  roundedRect(x, cx - 96, by - 80, 62, 52, 10);
  x.fill();
  x.fillStyle = '#6e2e17';
  roundedRect(x, cx - 92, by - 78, 54, 16, 7);
  x.fill();
  for (const [index, [color, degrees]] of (
    [
      ['#e2603a', -8],
      ['#3a86c8', 4],
      ['#5b9c4e', 14],
    ] as const
  ).entries()) {
    x.save();
    x.translate(cx - 80 + index * 15, by - 56);
    x.rotate((degrees * Math.PI) / 180);
    x.fillStyle = '#fbf6ea';
    x.fillRect(-12, -30, 24, 40);
    x.fillStyle = color;
    x.fillRect(-9, -27, 18, 24);
    x.restore();
  }
  x.fillStyle = '#b4552f';
  roundedRect(x, cx - 96, by - 68, 62, 40, 10);
  x.fill();
  x.fillStyle = '#9a4326';
  x.fillRect(cx - 96, by - 68, 62, 5);
  x.fillStyle = '#f3c14b';
  ellipse(x, cx - 65, by - 50, 5, 5);
}

const drawers = new Map<AvatarSpecies, typeof drawPip>();

// Pip as the given animal, as a drawing function that stays the same for the same animal, so that
// what draws it only draws again when the animal changes.
export function pipAs(species: AvatarSpecies): typeof drawPip {
  let drawer = drawers.get(species);
  if (!drawer) {
    drawer = (drawing, width, height, eyes = 'open') =>
      drawPip(drawing, width, height, eyes, species);
    drawers.set(species, drawer);
  }
  return drawer;
}
