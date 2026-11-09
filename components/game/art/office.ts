// The administrative office: Brutus, Mme Hulotte, Mlle Trotte, Bastien, and the bureau's floors.

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
} from './core';
import { drawSkyline } from './downtown';

export const BRUTUS_SIZE = { width: 320, height: 330 };
export const BRUTUS_FACE = { x: 160, y: 168, size: 210 };

// Brutus, the bulldog who guards the administrative office: a black suit, a white shirt and a thin tie,
// dark glasses that hide his eyes, an earpiece, and his arms folded. Fearsome, but polite.
export function drawBrutus(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 40;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // Ears, folded over.
  x.fillStyle = '#9a6e48';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.ellipse(cx + side * 70, bodyY - 92, 30, 18, side * 0.6, 0, Math.PI * 2);
    x.fill();
  }
  // Feet in black shoes.
  x.fillStyle = '#1e1e26';
  ellipse(x, cx - 42, bottom - 8, 30, 11);
  ellipse(x, cx + 42, bottom - 8, 30, 11);
  // A broad body, its head sunk into its shoulders.
  x.fillStyle = '#d8b48a';
  ellipse(x, cx, bodyY - 10, 104, 110);
  // The suit, open on a white shirt and a thin black tie.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY - 10, 104, 110, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#23232d';
  x.fillRect(cx - 120, bodyY + 4, 240, 140);
  x.fillStyle = '#fbf6ea';
  x.beginPath();
  x.moveTo(cx - 26, bodyY + 4);
  x.lineTo(cx, bodyY + 70);
  x.lineTo(cx + 26, bodyY + 4);
  x.fill();
  x.fillStyle = '#23232d';
  x.beginPath();
  x.moveTo(cx - 6, bodyY + 10);
  x.lineTo(cx + 6, bodyY + 10);
  x.lineTo(cx + 4, bodyY + 60);
  x.lineTo(cx, bodyY + 68);
  x.lineTo(cx - 4, bodyY + 60);
  x.closePath();
  x.fill();
  x.restore();
  // The arms, folded across his chest, in the suit's sleeves.
  x.fillStyle = '#2e2e3a';
  roundedRect(x, cx - 84, bodyY + 34, 168, 40, 20);
  x.fill();
  x.fillStyle = '#d8b48a';
  ellipse(x, cx - 70, bodyY + 54, 16, 14);
  ellipse(x, cx + 70, bodyY + 54, 16, 14);
  // His face: heavy jowls, a black nose, an underbite with two teeth showing.
  x.fillStyle = '#ead2b2';
  ellipse(x, cx, eyesY + 40, 58, 34);
  x.fillStyle = '#2c2a35';
  ellipse(x, cx, eyesY + 20, 16, 10);
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(cx - 30, eyesY + 52);
  x.quadraticCurveTo(cx, eyesY + 44, cx + 30, eyesY + 52);
  x.stroke();
  x.fillStyle = '#fbf6ea';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 16, eyesY + 49);
    x.lineTo(cx + side * 21, eyesY + 38);
    x.lineTo(cx + side * 25, eyesY + 50);
    x.closePath();
    x.fill();
  }
  // The wrinkles of his brow, frowning.
  x.strokeStyle = 'rgb(120 80 50 / 45%)';
  x.lineWidth = 3;
  for (const line of [0, 9]) {
    x.beginPath();
    x.moveTo(cx - 26, eyesY - 26 - line);
    x.quadraticCurveTo(cx, eyesY - 18 - line, cx + 26, eyesY - 26 - line);
    x.stroke();
  }
  // Dark glasses, a glint on each, and the earpiece's curly wire.
  x.fillStyle = '#16161c';
  for (const side of [-1, 1]) {
    roundedRect(x, cx + side * 32 - 24, eyesY - 12, 48, 26, 8);
    x.fill();
  }
  x.fillRect(cx - 10, eyesY - 6, 20, 5);
  x.fillStyle = 'rgb(255 255 255 / 35%)';
  for (const side of [-1, 1]) {
    x.fillRect(cx + side * 32 - 16, eyesY - 8, 14, 4);
  }
  x.strokeStyle = '#3a3a46';
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(cx + 86, bodyY - 70);
  for (let coil = 0; coil < 5; coil++) {
    x.quadraticCurveTo(cx + 96, bodyY - 60 + coil * 12, cx + 86, bodyY - 54 + coil * 12);
  }
  x.stroke();
  x.fillStyle = '#3a3a46';
  ellipse(x, cx + 84, bodyY - 72, 6, 6);
}

export const HULOTTE_SIZE = { width: 300, height: 330 };
export const HULOTTE_FACE = { x: 150, y: 176, size: 200 };

// Mme Hulotte, the owl who keeps the administrative office: round glasses on big eyes, ear tufts, a
// green cardigan with a pencil in its pocket, and a folder of charts held to her chest.
export function drawHulotte(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 46;
  const headTop = bodyY - 100;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // Ear tufts.
  x.fillStyle = '#7a5838';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 40, headTop + 22);
    x.lineTo(cx + side * 70, headTop - 22);
    x.lineTo(cx + side * 76, headTop + 30);
    x.closePath();
    x.fill();
  }
  roundBody(x, cx, bottom, { body: '#9a7350', belly: '#e8d3b0', feet: '#e0a03a' });
  // Speckles on her chest.
  x.fillStyle = 'rgb(122 88 56 / 35%)';
  for (const [speckX, speckY] of [
    [-20, 30],
    [10, 44],
    [-6, 64],
    [24, 70],
    [-30, 80],
  ]) {
    ellipse(x, cx + speckX, bodyY + speckY, 5, 3);
  }
  // The cardigan, open over her chest.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#5b8a5a';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 100, bodyY - 30);
    x.lineTo(cx + side * 34, bodyY - 20);
    x.lineTo(cx + side * 40, bodyY + 120);
    x.lineTo(cx + side * 100, bodyY + 120);
    x.closePath();
    x.fill();
  }
  x.restore();
  x.strokeStyle = '#f3c14b';
  x.lineWidth = 5;
  x.beginPath();
  x.moveTo(cx + 62, bodyY + 6);
  x.lineTo(cx + 62, bodyY + 34);
  x.stroke();
  // The folder of charts, held to her chest.
  x.save();
  x.translate(cx - 40, bodyY + 40);
  x.rotate(-0.12);
  x.fillStyle = '#e8645a';
  roundedRect(x, -36, -30, 72, 56, 4);
  x.fill();
  x.fillStyle = '#fbf6ea';
  roundedRect(x, -28, -38, 56, 50, 3);
  x.fill();
  for (const [index, barHeight] of [12, 22, 16, 28].entries()) {
    x.fillStyle = '#3a86c8';
    x.fillRect(-20 + index * 11, 4 - barHeight, 7, barHeight);
  }
  x.restore();
  // The pale disc of her face, and her beak.
  x.fillStyle = '#e8d3b0';
  ellipse(x, cx - 30, eyesY + 4, 36, 34);
  ellipse(x, cx + 30, eyesY + 4, 36, 34);
  x.fillStyle = '#e0a03a';
  x.beginPath();
  x.moveTo(cx - 9, eyesY + 22);
  x.lineTo(cx + 9, eyesY + 22);
  x.lineTo(cx, eyesY + 40);
  x.closePath();
  x.fill();
  // Big eyes behind round glasses.
  for (const side of [-1, 1]) {
    const eyeX = cx + side * 30;
    if (eyes === 'shut') {
      drawEye(x, eyeX, eyesY + 8, 'shut');
    } else {
      x.fillStyle = '#fffdf6';
      ellipse(x, eyeX, eyesY + 4, 20, 20);
      x.fillStyle = '#2c2a35';
      ellipse(x, eyeX + side * 2, eyesY + 6, 11, 12);
      x.fillStyle = '#ffffff';
      ellipse(x, eyeX + side * 2 + 4, eyesY + 1, 4, 4);
    }
    x.strokeStyle = '#3a2a20';
    x.lineWidth = 5;
    x.beginPath();
    x.arc(eyeX, eyesY + 4, 25, 0, Math.PI * 2);
    x.stroke();
  }
  x.beginPath();
  x.moveTo(cx - 6, eyesY + 2);
  x.lineTo(cx + 6, eyesY + 2);
  x.stroke();
}

export const TROTTE_SIZE = { width: 320, height: 330 };
export const TROTTE_FACE = { x: 160, y: 150, size: 200 };

// Mlle Trotte, the mouse who keeps the coupon floor: big round ears, round glasses, a long tail,
// a lilac cardigan, and her rubber stamp, ready to make a coupon official.
export function drawTrotte(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2 - 10;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const eyesY = bodyY - 42;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // Her long tail, curling up behind her.
  x.strokeStyle = '#d9a3b0';
  x.lineWidth = 8;
  x.beginPath();
  x.moveTo(cx + 70, bottom - 30);
  x.bezierCurveTo(cx + 132, bottom - 20, cx + 136, bottom - 116, cx + 108, bottom - 130);
  x.stroke();
  // Big round ears.
  for (const side of [-1, 1]) {
    x.fillStyle = '#aaa3b8';
    ellipse(x, cx + side * 70, bodyY - 92, 46, 46);
    x.fillStyle = '#f2b8c4';
    ellipse(x, cx + side * 70, bodyY - 92, 30, 30);
  }
  roundBody(x, cx, bottom, { body: '#bdb7c9', belly: '#ece8f2', feet: '#f2b8c4' });
  // A lilac cardigan, open over her belly, with a coupon peeking from its pocket.
  x.save();
  x.beginPath();
  x.ellipse(cx, bodyY, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = '#9b86c9';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 100, bodyY - 20);
    x.lineTo(cx + side * 36, bodyY - 10);
    x.lineTo(cx + side * 44, bodyY + 120);
    x.lineTo(cx + side * 100, bodyY + 120);
    x.closePath();
    x.fill();
  }
  x.restore();
  x.save();
  x.translate(cx - 62, bodyY + 30);
  x.rotate(-0.25);
  x.fillStyle = '#fbf6ea';
  roundedRect(x, -14, -14, 28, 18, 3);
  x.fill();
  x.fillStyle = '#c8453a';
  x.fillRect(-14, -14, 8, 18);
  x.restore();
  x.fillStyle = '#86719f';
  roundedRect(x, cx - 84, bodyY + 22, 40, 26, 6);
  x.fill();
  // Eyes behind round glasses.
  for (const side of [-1, 1]) {
    drawEye(x, cx + side * 28, eyesY + 4, eyes, { width: 9 });
  }
  x.strokeStyle = '#5a3a22';
  x.lineWidth = 4;
  for (const side of [-1, 1]) {
    x.beginPath();
    x.arc(cx + side * 28, eyesY + 4, 21, 0, Math.PI * 2);
    x.stroke();
  }
  x.beginPath();
  x.moveTo(cx - 7, eyesY + 2);
  x.lineTo(cx + 7, eyesY + 2);
  x.stroke();
  // Pink nose, whiskers and cheeks.
  x.fillStyle = '#e0788a';
  ellipse(x, cx, eyesY + 32, 8, 6);
  x.strokeStyle = '#8a8494';
  x.lineWidth = 2.5;
  for (const side of [-1, 1]) {
    for (const tilt of [-6, 4]) {
      x.beginPath();
      x.moveTo(cx + side * 24, eyesY + 36);
      x.lineTo(cx + side * 64, eyesY + 36 + tilt);
      x.stroke();
    }
  }
  x.fillStyle = 'rgb(240 110 100 / 40%)';
  ellipse(x, cx - 52, eyesY + 42, 12, 7);
  ellipse(x, cx + 52, eyesY + 42, 12, 7);
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 3.5;
  x.beginPath();
  x.moveTo(cx - 8, eyesY + 44);
  x.quadraticCurveTo(cx - 4, eyesY + 49, cx, eyesY + 44);
  x.quadraticCurveTo(cx + 4, eyesY + 49, cx + 8, eyesY + 44);
  x.stroke();
  // Her rubber stamp, held up in her right paw.
  const stampX = cx + 70;
  const stampY = bodyY + 58;
  x.fillStyle = '#7a4f2e';
  roundedRect(x, stampX - 8, stampY - 42, 16, 32, 7);
  x.fill();
  ellipse(x, stampX, stampY - 44, 13, 10);
  x.fillStyle = '#3a3845';
  roundedRect(x, stampX - 22, stampY - 12, 44, 11, 3);
  x.fill();
  x.fillStyle = '#c8453a';
  roundedRect(x, stampX - 20, stampY - 3, 40, 7, 2);
  x.fill();
  x.fillStyle = '#bdb7c9';
  ellipse(x, stampX, stampY - 26, 15, 13);
}

// The office's lift, set in its back wall: brushed steel doors, a floor dial over them and the call
// buttons beside.
export function drawElevator(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  going: 'up' | 'down',
) {
  const x = drawing;
  x.fillStyle = '#9aa0a8';
  x.fillRect(0, 0, width, height);
  const doorTop = height * 0.18;
  const doorWidth = width * 0.68;
  const doorLeft = width * 0.06;
  x.fillStyle = '#c3c8cf';
  x.fillRect(doorLeft, doorTop, doorWidth, height - doorTop);
  x.strokeStyle = 'rgb(255 255 255 / 30%)';
  x.lineWidth = 2;
  for (let line = doorLeft + 10; line < doorLeft + doorWidth; line += 12) {
    x.beginPath();
    x.moveTo(line, doorTop + 6);
    x.lineTo(line, height - 4);
    x.stroke();
  }
  x.fillStyle = '#7d838c';
  x.fillRect(doorLeft + doorWidth / 2 - 2, doorTop, 4, height - doorTop);
  // The floor dial, its needle on the floor it goes to.
  const dialX = doorLeft + doorWidth / 2;
  x.fillStyle = '#e0a51f';
  x.beginPath();
  x.arc(dialX, doorTop - 8, 26, Math.PI, 0);
  x.fill();
  x.strokeStyle = '#2c2a35';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(dialX, doorTop - 8);
  x.lineTo(dialX + (going === 'up' ? 16 : -16), doorTop - 26);
  x.stroke();
  // The call buttons.
  const panelX = doorLeft + doorWidth + width * 0.06;
  x.fillStyle = '#5b6470';
  roundedRect(x, panelX, height * 0.45, width * 0.16, 70, 6);
  x.fill();
  x.fillStyle = going === 'up' ? '#f3c14b' : '#cfd4da';
  ellipse(x, panelX + width * 0.08, height * 0.45 + 20, 9, 9);
  x.fillStyle = going === 'down' ? '#f3c14b' : '#cfd4da';
  ellipse(x, panelX + width * 0.08, height * 0.45 + 50, 9, 9);
  x.fillStyle = '#2c2a35';
  x.beginPath();
  x.moveTo(panelX + width * 0.08 - 5, height * 0.45 + 24);
  x.lineTo(panelX + width * 0.08, height * 0.45 + 15);
  x.lineTo(panelX + width * 0.08 + 5, height * 0.45 + 24);
  x.closePath();
  x.moveTo(panelX + width * 0.08 - 5, height * 0.45 + 46);
  x.lineTo(panelX + width * 0.08, height * 0.45 + 55);
  x.lineTo(panelX + width * 0.08 + 5, height * 0.45 + 46);
  x.closePath();
  x.fill();
}

// A cork board pinned all over with coupons, on the wall of the coupon floor.
export function drawCouponBoard(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.fillStyle = '#8a5a35';
  roundedRect(x, 0, 0, width, height, 10);
  x.fill();
  x.fillStyle = '#c9a272';
  roundedRect(x, 10, 10, width - 20, height - 20, 6);
  x.fill();
  const random = seededRandom(57);
  x.fillStyle = 'rgb(110 75 40 / 25%)';
  for (let speck = 0; speck < 120; speck++) {
    ellipse(x, 14 + random() * (width - 28), 14 + random() * (height - 28), 1.5, 1.5);
  }
  const colors = ['#c8453a', '#3a86c8', '#3f8a6a', '#e0a51f', '#7e63be'];
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 4; column++) {
      const couponX = 30 + column * ((width - 60) / 4) + random() * 10;
      const couponY = 34 + row * ((height - 60) / 3) + random() * 8;
      x.save();
      x.translate(couponX + 30, couponY + 16);
      x.rotate((random() - 0.5) * 0.4);
      x.fillStyle = '#fbf6ea';
      roundedRect(x, -30, -16, 60, 32, 3);
      x.fill();
      x.fillStyle = colors[(row * 4 + column) % colors.length] ?? '#c8453a';
      x.fillRect(-30, -16, 14, 32);
      roundedRect(x, -10, -6, 30, 5, 2);
      x.fill();
      roundedRect(x, -10, 3, 20, 4, 2);
      x.fill();
      x.fillStyle = '#c8453a';
      ellipse(x, 0, -18, 4, 4);
      x.restore();
    }
  }
}

// A tall filing cabinet of coupons, its drawers labelled.
export function drawFilingCabinet(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  x.fillStyle = '#5b7a8c';
  roundedRect(x, 0, 0, width, height, 8);
  x.fill();
  const drawers = 4;
  const drawerHeight = (height - 24) / drawers;
  for (let drawer = 0; drawer < drawers; drawer++) {
    const top = 12 + drawer * drawerHeight;
    x.fillStyle = '#6f90a3';
    roundedRect(x, 12, top + 4, width - 24, drawerHeight - 8, 5);
    x.fill();
    x.fillStyle = '#fbf6ea';
    roundedRect(x, width / 2 - 22, top + 12, 44, 16, 2);
    x.fill();
    x.fillStyle = '#c3c8cf';
    roundedRect(x, width / 2 - 18, top + drawerHeight - 26, 36, 8, 4);
    x.fill();
  }
  // A coupon left sticking out of the top drawer.
  x.save();
  x.translate(width / 2 + 10, 14);
  x.rotate(-0.2);
  x.fillStyle = '#fbf6ea';
  roundedRect(x, -20, -18, 40, 22, 3);
  x.fill();
  x.fillStyle = '#e0a51f';
  x.fillRect(-20, -18, 10, 22);
  x.restore();
}

// The administrative office's walls: white panels with thin seams, over a grey skirting.
export function drawOfficeWall(): HTMLCanvasElement {
  const width = 1300;
  const height = 440;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#f1f2f4';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(140 150 165 / 30%)';
  x.lineWidth = 2;
  for (let seam = 0; seam < width; seam += 130) {
    x.beginPath();
    x.moveTo(seam, 0);
    x.lineTo(seam, height - 24);
    x.stroke();
  }
  x.fillStyle = 'rgb(160 200 230 / 35%)';
  x.fillRect(0, 26, width, 6);
  x.fillStyle = '#8e96a3';
  x.fillRect(0, height - 24, width, 24);
  addGrain(canvas, 8, 32);
  return canvas;
}

// The bureau's floor: large pale tiles, polished, catching the light.
export function drawOfficeFloor(): HTMLCanvasElement {
  const width = 1300;
  const height = 420;
  const canvas = createCanvas(width, height);
  const x = context(canvas);
  x.fillStyle = '#d9dde3';
  x.fillRect(0, 0, width, height);
  x.strokeStyle = 'rgb(120 130 145 / 30%)';
  x.lineWidth = 2;
  for (let row = 0; row < height; row += 105) {
    x.beginPath();
    x.moveTo(0, row);
    x.lineTo(width, row);
    x.stroke();
  }
  for (let column = 0; column < width; column += 162) {
    x.beginPath();
    x.moveTo(column, 0);
    x.lineTo(column, height);
    x.stroke();
  }
  x.fillStyle = 'rgb(255 255 255 / 22%)';
  for (const sheen of [0.18, 0.55, 0.82]) {
    x.beginPath();
    x.moveTo(width * sheen, 0);
    x.lineTo(width * sheen + 60, 0);
    x.lineTo(width * sheen - 40, height);
    x.lineTo(width * sheen - 100, height);
    x.closePath();
    x.fill();
  }
  addGrain(canvas, 6, 33);
  return canvas;
}

// The city seen from the administrative office's window, in layers over the live sky: its towers,
// their windows lit at night, and the window's frame with a glint on the glass.
export function drawPanoramaCity(drawing: CanvasRenderingContext2D, width: number, height: number) {
  drawing.save();
  drawing.translate(0, height * 0.25);
  drawSkyline(drawing, width, height * 0.75);
  drawing.restore();
}

// Lit windows scattered over the towers, and nowhere else, for the night.
export function drawPanoramaLights(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const towers = createCanvas(width, height);
  drawPanoramaCity(context(towers), width, height);
  const random = seededRandom(131);
  drawing.fillStyle = '#ffd77a';
  for (let light = 0; light < 140; light++) {
    drawing.fillRect(
      Math.round(random() * width),
      Math.round(height * (0.3 + random() * 0.7)),
      5,
      7,
    );
  }
  drawing.globalCompositeOperation = 'destination-in';
  drawing.drawImage(towers, 0, 0);
  drawing.globalCompositeOperation = 'source-over';
}

export function drawPanoramaFrame(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const x = drawing;
  x.fillStyle = 'rgb(255 255 255 / 18%)';
  x.beginPath();
  x.moveTo(width * 0.1, 0);
  x.lineTo(width * 0.22, 0);
  x.lineTo(width * 0.08, height);
  x.lineTo(width * -0.04, height);
  x.closePath();
  x.fill();
  x.fillStyle = '#6f7887';
  const panes = 4;
  for (let mullion = 0; mullion <= panes; mullion++) {
    x.fillRect((width - 10) * (mullion / panes), 0, 10, height);
  }
  x.fillRect(0, 0, width, 10);
  x.fillRect(0, height - 14, width, 14);
}

// A wall screen of the bureau's dashboards: figures, bars, a rising line and a ring.
export function drawDashboard(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  x.fillStyle = '#1b1f27';
  roundedRect(x, 0, 0, width, height, 12);
  x.fill();
  const inner = { left: 14, top: 14, width: width - 28, height: height - 28 };
  x.fillStyle = '#16233a';
  x.fillRect(inner.left, inner.top, inner.width, inner.height);
  // Three tiles of figures along the top.
  const tileWidth = (inner.width - 40) / 3;
  for (const [index, color] of ['#7fe0b0', '#f3c14b', '#8cc3e6'].entries()) {
    const left = inner.left + 10 + index * (tileWidth + 10);
    x.fillStyle = '#22314d';
    roundedRect(x, left, inner.top + 10, tileWidth, 44, 6);
    x.fill();
    x.fillStyle = color;
    x.fillRect(left + 10, inner.top + 20, tileWidth * 0.5, 10);
    x.fillStyle = 'rgb(255 255 255 / 35%)';
    x.fillRect(left + 10, inner.top + 36, tileWidth * 0.7, 6);
  }
  const chartTop = inner.top + 66;
  const chartHeight = inner.height - 76;
  // Bars on the left.
  for (const [bar, share] of [0.4, 0.65, 0.5, 0.85, 0.7].entries()) {
    x.fillStyle = '#5aa0d8';
    const barHeight = chartHeight * share;
    x.fillRect(inner.left + 14 + bar * 20, chartTop + chartHeight - barHeight, 13, barHeight);
  }
  // A rising line in the middle.
  x.strokeStyle = '#7fe0b0';
  x.lineWidth = 4;
  x.beginPath();
  const lineLeft = inner.left + inner.width * 0.4;
  const lineWidth = inner.width * 0.32;
  for (const [point, share] of [0.2, 0.35, 0.3, 0.55, 0.5, 0.8].entries()) {
    const pointX = lineLeft + (lineWidth * point) / 5;
    const pointY = chartTop + chartHeight - chartHeight * share;
    if (point === 0) {
      x.moveTo(pointX, pointY);
    } else {
      x.lineTo(pointX, pointY);
    }
  }
  x.stroke();
  // A ring on the right.
  const ringX = inner.left + inner.width * 0.86;
  const ringY = chartTop + chartHeight / 2;
  const radius = Math.min(chartHeight, inner.width * 0.2) * 0.4;
  x.lineWidth = 14;
  for (const [from, to, color] of [
    [0, 0.55, '#f3c14b'],
    [0.55, 0.8, '#e8645a'],
    [0.8, 1, '#9a7bd6'],
  ] as const) {
    x.strokeStyle = color;
    x.beginPath();
    x.arc(ringX, ringY, radius, from * Math.PI * 2 - Math.PI / 2, to * Math.PI * 2 - Math.PI / 2);
    x.stroke();
  }
  // The glow of the screen on its glass.
  x.fillStyle = 'rgb(255 255 255 / 6%)';
  x.fillRect(inner.left, inner.top, inner.width, inner.height / 2);
}

// Mme Hulotte's desk: a slim white top on dark legs, a thin screen on its left, out of the way of
// her face, and a cup and a little plant on its right.
export function drawModernDesk(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const top = height * 0.5;
  // The screen on its stand, on the left.
  x.fillStyle = '#2c2f38';
  x.fillRect(width * 0.17, top - 22, 8, 22);
  x.fillRect(width * 0.12, top - 6, width * 0.14, 6);
  roundedRect(x, 6, top - 100, width * 0.36, 76, 6);
  x.fill();
  x.fillStyle = '#16233a';
  x.fillRect(12, top - 94, width * 0.36 - 12, 64);
  x.strokeStyle = '#7fe0b0';
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(20, top - 42);
  x.lineTo(width * 0.14, top - 62);
  x.lineTo(width * 0.22, top - 52);
  x.lineTo(width * 0.33, top - 84);
  x.stroke();
  drawDeskWithCup(x, width, height);
}

// Mlle Trotte's desk: the same white desk, with a pile of coupons and an ink pad on its left in
// place of a screen.
export function drawCouponDesk(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const top = height * 0.5;
  const random = seededRandom(83);
  for (let sheet = 0; sheet < 9; sheet++) {
    x.save();
    x.translate(width * 0.2 + (random() - 0.5) * 8, top - 6 - sheet * 6);
    x.rotate((random() - 0.5) * 0.12);
    x.fillStyle = sheet % 3 === 1 ? '#fde9a8' : '#fbf6ea';
    roundedRect(x, -38, -4, 76, 7, 2);
    x.fill();
    x.restore();
  }
  x.fillStyle = '#3a3845';
  roundedRect(x, width * 0.38, top - 12, 44, 12, 3);
  x.fill();
  x.fillStyle = '#c8453a';
  roundedRect(x, width * 0.38 + 4, top - 10, 36, 6, 2);
  x.fill();
  drawDeskWithCup(x, width, height);
}

// The white desk itself, with a cup and a little plant on its right.
function drawDeskWithCup(x: CanvasRenderingContext2D, width: number, height: number) {
  const top = height * 0.5;
  x.fillStyle = '#fbf6ea';
  roundedRect(x, width * 0.66, top - 30, 26, 30, 5);
  x.fill();
  x.fillStyle = '#3a86c8';
  x.fillRect(width * 0.66, top - 20, 26, 6);
  x.fillStyle = '#e8e6e1';
  roundedRect(x, width * 0.82, top - 26, 34, 26, 6);
  x.fill();
  x.fillStyle = '#5b9c4e';
  for (const [leafX, leafHeight] of [
    [-8, 34],
    [0, 44],
    [8, 30],
  ] as const) {
    ellipse(x, width * 0.82 + 17 + leafX, top - 26 - leafHeight / 2, 6, leafHeight / 2);
  }
  x.fillStyle = '#f4f4f2';
  roundedRect(x, 0, top, width, 16, 4);
  x.fill();
  x.fillStyle = '#c9ccd2';
  x.fillRect(0, top + 12, width, 4);
  x.fillStyle = '#2c2f38';
  x.fillRect(20, top + 16, 10, height - top - 16);
  x.fillRect(width - 30, top + 16, 10, height - top - 16);
  x.fillStyle = '#e4e6ea';
  roundedRect(x, width * 0.56, top + 16, width * 0.3, (height - top) * 0.55, 4);
  x.fill();
  x.fillStyle = '#9aa3b0';
  x.fillRect(width * 0.66, top + 40, width * 0.1, 5);
}

// A tall, teetering pile of papers on the floor, each sheet a little askew, with coloured folders
// and coupons slipped in here and there, and a fat binder clip on top.
export function drawPaperStack(seed: number) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(seed);
    const sheetHeight = 9;
    const sheets = Math.floor((height - 30) / sheetHeight);
    let drift = 0;
    for (let sheet = 0; sheet < sheets; sheet++) {
      // The pile leans more the higher it goes.
      drift += (random() - 0.45) * 2.2;
      const y = height - 4 - sheet * sheetHeight;
      x.save();
      x.translate(width / 2 + drift, y);
      x.rotate((random() - 0.5) * 0.08);
      const roll = random();
      x.fillStyle =
        roll < 0.08 ? '#e0a51f' : roll < 0.14 ? '#3a86c8' : roll < 0.2 ? '#c8453a' : '#fbf6ea';
      const sheetWidth = width * (0.7 + random() * 0.12);
      roundedRect(x, -sheetWidth / 2, -sheetHeight + 1, sheetWidth, sheetHeight - 1, 2);
      x.fill();
      x.fillStyle = 'rgb(44 42 53 / 10%)';
      x.fillRect(-sheetWidth / 2, -2, sheetWidth, 2);
      // A coupon's coloured end sticking out of the side.
      if (random() < 0.12) {
        x.fillStyle = random() < 0.5 ? '#7e63be' : '#3f8a6a';
        x.fillRect(sheetWidth / 2 - 4, -sheetHeight + 2, 16, sheetHeight - 3);
      }
      x.restore();
    }
    const topY = height - 4 - sheets * sheetHeight;
    x.fillStyle = '#2c2a35';
    roundedRect(x, width / 2 + drift - 12, topY - 4, 24, 12, 3);
    x.fill();
    x.strokeStyle = '#9aa0a8';
    x.lineWidth = 3;
    x.beginPath();
    x.moveTo(width / 2 + drift - 8, topY - 4);
    x.lineTo(width / 2 + drift - 4, topY - 16);
    x.lineTo(width / 2 + drift + 4, topY - 16);
    x.lineTo(width / 2 + drift + 8, topY - 4);
    x.stroke();
  };
}

// Loose sheets fallen on the floor, seen from above: overlapping pages with lines of writing, and
// a coupon or two among them.
export function drawLooseSheets(seed: number) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const random = seededRandom(seed);
    const count = 3 + Math.floor(random() * 3);
    for (let sheet = 0; sheet < count; sheet++) {
      x.save();
      x.translate(width * (0.2 + random() * 0.6), height * (0.3 + random() * 0.4));
      x.rotate((random() - 0.5) * 1.6);
      const isCoupon = random() < 0.3;
      const sheetWidth = isCoupon ? 70 : 84;
      const sheetHeight = isCoupon ? 38 : 108;
      x.fillStyle = 'rgb(44 42 53 / 12%)';
      roundedRect(x, -sheetWidth / 2 + 3, -sheetHeight / 2 + 4, sheetWidth, sheetHeight, 3);
      x.fill();
      x.fillStyle = '#fbf6ea';
      roundedRect(x, -sheetWidth / 2, -sheetHeight / 2, sheetWidth, sheetHeight, 3);
      x.fill();
      if (isCoupon) {
        x.fillStyle =
          ['#c8453a', '#3a86c8', '#e0a51f', '#7e63be'][Math.floor(random() * 4)] ?? '#c8453a';
        x.fillRect(-sheetWidth / 2, -sheetHeight / 2, 16, sheetHeight);
        roundedRect(x, -14, -8, 36, 5, 2);
        x.fill();
        roundedRect(x, -14, 3, 24, 4, 2);
        x.fill();
      } else {
        x.fillStyle = 'rgb(90 100 120 / 45%)';
        for (let line = 0; line < 7; line++) {
          x.fillRect(
            -sheetWidth / 2 + 10,
            -sheetHeight / 2 + 14 + line * 12,
            sheetWidth * (0.5 + random() * 0.3),
            3,
          );
        }
      }
      x.restore();
    }
  };
}

// A tall snake plant in a white pot, its leaves edged in yellow.
export function drawTallPlant(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const potTop = height * 0.7;
  const leaves = [
    { lean: -0.32, length: 0.62 },
    { lean: -0.12, length: 0.72 },
    { lean: 0.06, length: 0.66 },
    { lean: 0.22, length: 0.56 },
    { lean: 0.38, length: 0.46 },
  ];
  for (const { lean, length } of leaves) {
    x.save();
    x.translate(width / 2, potTop);
    x.rotate(lean);
    x.fillStyle = '#d9c25a';
    x.beginPath();
    x.moveTo(-15, 0);
    x.quadraticCurveTo(-13, -height * length * 0.6, 0, -height * length);
    x.quadraticCurveTo(13, -height * length * 0.6, 15, 0);
    x.fill();
    x.fillStyle = '#3f7d48';
    x.beginPath();
    x.moveTo(-10, 0);
    x.quadraticCurveTo(-9, -height * length * 0.6, 0, -height * length + 10);
    x.quadraticCurveTo(9, -height * length * 0.6, 10, 0);
    x.fill();
    x.restore();
  }
  x.fillStyle = '#f2f2f0';
  x.beginPath();
  x.moveTo(width * 0.18, potTop);
  x.lineTo(width * 0.82, potTop);
  x.lineTo(width * 0.74, height);
  x.lineTo(width * 0.26, height);
  x.closePath();
  x.fill();
  x.fillStyle = '#c9ccd2';
  x.fillRect(width * 0.18, potTop, width * 0.64, 8);
}

// A low modern sofa in charcoal fabric, on thin metal legs, with two bright cushions.
export function drawModernSofa(drawing: CanvasRenderingContext2D, width: number, height: number) {
  const x = drawing;
  const legs = 16;
  const seatTop = height * 0.5;
  // The back and the arms.
  x.fillStyle = '#4a5160';
  roundedRect(x, 0, height * 0.12, width, seatTop - height * 0.12 + 20, 18);
  x.fill();
  x.fillStyle = '#545c6c';
  roundedRect(x, 0, height * 0.3, 40, height - legs - height * 0.3, 14);
  x.fill();
  roundedRect(x, width - 40, height * 0.3, 40, height - legs - height * 0.3, 14);
  x.fill();
  // The seat, in two cushions.
  x.fillStyle = '#5d6577';
  for (const half of [0, 1]) {
    roundedRect(
      x,
      36 + half * ((width - 72) / 2),
      seatTop,
      (width - 72) / 2 - 4,
      height - legs - seatTop,
      12,
    );
    x.fill();
  }
  x.fillStyle = 'rgb(255 255 255 / 10%)';
  x.fillRect(40, seatTop + 6, width - 80, 6);
  // Two bright cushions leaning on the back.
  for (const [cushionX, color, tilt] of [
    [width * 0.24, '#f3c14b', -0.12],
    [width * 0.7, '#3f8a6a', 0.1],
  ] as const) {
    x.save();
    x.translate(cushionX, seatTop - 12);
    x.rotate(tilt);
    x.fillStyle = color;
    roundedRect(x, -34, -30, 68, 56, 14);
    x.fill();
    x.restore();
  }
  // Thin metal legs.
  x.fillStyle = '#2c2f38';
  for (const legX of [24, width - 30]) {
    x.fillRect(legX, height - legs, 6, legs);
  }
}

// --- Ramen Yuzu, downtown. ---------------------------------------------------------------------

const BEAVER_BROWN = '#9a6a42';
const BEAVER_DARK = '#6e4a2c';

export const ARCHIVIST_SIZE = { width: 300, height: 380 };
export const ARCHIVIST_FACE = { x: 156, y: 128, size: 170 };

// Bastien, the beaver who keeps the office's archives: brown fur, big front teeth, a flat scaly
// tail, a green visor and sleeve garters, and a stack of printed tables in his arms.
export function drawArchivist(
  drawing: CanvasRenderingContext2D,
  width: number,
  height: number,
  eyes: Eyes = 'open',
) {
  const x = drawing;
  const cx = width / 2;
  const bottom = height - 6;
  const bodyY = bottom - 104;
  const headY = bodyY - 116;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // The flat tail, behind, crossed with scales.
  x.fillStyle = '#5a3c26';
  x.beginPath();
  x.ellipse(cx - 92, bottom - 30, 54, 22, -0.35, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = '#7a5434';
  x.lineWidth = 2.5;
  for (let line = -2; line <= 2; line++) {
    x.beginPath();
    x.moveTo(cx - 130, bottom - 30 + line * 8 + 14);
    x.lineTo(cx - 56, bottom - 30 + line * 8 - 12);
    x.stroke();
  }
  // Feet, and the round body in a white shirt and a brown waistcoat.
  x.fillStyle = BEAVER_DARK;
  ellipse(x, cx - 30, bottom - 8, 26, 11);
  ellipse(x, cx + 30, bottom - 8, 26, 11);
  x.fillStyle = BEAVER_BROWN;
  ellipse(x, cx, bodyY + 20, 70, 84);
  x.fillStyle = '#f3ece2';
  x.beginPath();
  x.moveTo(cx - 30, bodyY - 60);
  x.lineTo(cx + 30, bodyY - 60);
  x.lineTo(cx + 20, bodyY + 80);
  x.lineTo(cx - 20, bodyY + 80);
  x.closePath();
  x.fill();
  x.fillStyle = '#5a6b4a';
  for (const side of [-1, 1]) {
    x.beginPath();
    x.moveTo(cx + side * 30, bodyY - 60);
    x.quadraticCurveTo(cx + side * 70, bodyY, cx + side * 56, bodyY + 86);
    x.lineTo(cx + side * 18, bodyY + 90);
    x.closePath();
    x.fill();
  }
  x.fillStyle = '#d0443a';
  x.beginPath();
  x.moveTo(cx, bodyY - 56);
  x.lineTo(cx - 10, bodyY - 66);
  x.lineTo(cx - 10, bodyY - 46);
  x.closePath();
  x.fill();
  x.beginPath();
  x.moveTo(cx, bodyY - 56);
  x.lineTo(cx + 10, bodyY - 66);
  x.lineTo(cx + 10, bodyY - 46);
  x.closePath();
  x.fill();
  // The stack of printed tables, held in both arms, sleeve garters on the arms.
  x.fillStyle = '#fbf6ea';
  for (let sheet = 0; sheet < 4; sheet++) {
    roundedRect(x, cx - 46 + sheet * 2, bodyY - 2 - sheet * 7, 92, 52, 3);
    x.fill();
  }
  x.strokeStyle = 'rgb(44 42 53 / 35%)';
  x.lineWidth = 2;
  for (let row = 0; row < 4; row++) {
    x.beginPath();
    x.moveTo(cx - 34, bodyY - 12 + row * 9);
    x.lineTo(cx + 36, bodyY - 12 + row * 9);
    x.stroke();
  }
  x.fillStyle = '#3c78b4';
  for (const [barX, barHeight] of [
    [-28, 10],
    [-18, 16],
    [-8, 8],
  ] as const) {
    x.fillRect(cx + barX, bodyY + 30 - barHeight, 7, barHeight);
  }
  x.fillStyle = BEAVER_BROWN;
  ellipse(x, cx - 52, bodyY + 18, 18, 16);
  ellipse(x, cx + 54, bodyY + 18, 18, 16);
  x.fillStyle = '#d0443a';
  x.fillRect(cx - 66, bodyY - 14, 28, 7);
  x.fillRect(cx + 40, bodyY - 14, 28, 7);
  // The head, round ears, a pale muzzle with big front teeth, and a dark nose.
  x.fillStyle = BEAVER_DARK;
  ellipse(x, cx - 46, headY - 40, 16, 16);
  ellipse(x, cx + 46, headY - 40, 16, 16);
  x.fillStyle = BEAVER_BROWN;
  ellipse(x, cx, headY, 64, 58);
  x.fillStyle = '#d9b48a';
  ellipse(x, cx, headY + 26, 36, 26);
  x.fillStyle = '#2c2a35';
  ellipse(x, cx, headY + 10, 11, 8);
  x.fillStyle = '#fbf6ea';
  roundedRect(x, cx - 12, headY + 30, 11, 18, 3);
  x.fill();
  roundedRect(x, cx + 1, headY + 30, 11, 18, 3);
  x.fill();
  x.strokeStyle = 'rgb(44 42 53 / 40%)';
  x.lineWidth = 1.5;
  x.beginPath();
  x.moveTo(cx, headY + 30);
  x.lineTo(cx, headY + 48);
  x.stroke();
  drawEye(x, cx - 24, headY - 10, eyes, { width: 8 });
  drawEye(x, cx + 24, headY - 10, eyes, { width: 8 });
  x.fillStyle = 'rgb(240 110 100 / 30%)';
  ellipse(x, cx - 40, headY + 16, 10, 6);
  ellipse(x, cx + 40, headY + 16, 10, 6);
  // The green visor, on its band round the head.
  x.fillStyle = 'rgb(76 160 110 / 85%)';
  x.beginPath();
  x.moveTo(cx - 60, headY - 48);
  x.quadraticCurveTo(cx, headY - 36, cx + 60, headY - 48);
  x.lineTo(cx + 52, headY - 26);
  x.quadraticCurveTo(cx, headY - 16, cx - 52, headY - 26);
  x.closePath();
  x.fill();
  x.fillStyle = '#2f6b48';
  x.beginPath();
  x.ellipse(cx, headY - 48, 62, 8, 0, Math.PI, 0);
  x.fill();
}
