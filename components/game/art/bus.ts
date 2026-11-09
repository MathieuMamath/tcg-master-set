// The bus stop, its shelter and the bus.

import { ellipse, roundedRect, WOOD, WOOD_DARK } from './core';

const BUS_YELLOW = '#f3c14b';
const BUS_GREEN = '#3f8a6a';

// A little bus seen from the side, as a pictogram on signs.
function busPictogram(x: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) {
  x.fillStyle = '#fbf6ea';
  roundedRect(x, centerX - size, centerY - size * 0.6, size * 2, size * 1.1, size * 0.25);
  x.fill();
  x.fillStyle = BUS_GREEN;
  for (let pane = 0; pane < 3; pane++) {
    x.fillRect(
      centerX - size * 0.85 + pane * size * 0.6,
      centerY - size * 0.45,
      size * 0.48,
      size * 0.4,
    );
  }
  x.fillStyle = '#2c2a35';
  ellipse(x, centerX - size * 0.55, centerY + size * 0.55, size * 0.22, size * 0.22);
  ellipse(x, centerX + size * 0.55, centerY + size * 0.55, size * 0.22, size * 0.22);
}

// The bus shelter: a roof over a glass back and a bench, and by the kerb the stop's sign, with its
// name on a board.
export function drawBusShelter(name: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    // The sign's pole and round sign, on the left.
    const poleX = 30;
    x.fillStyle = '#7c8590';
    x.fillRect(poleX - 4, 40, 8, height - 40);
    x.fillStyle = BUS_GREEN;
    ellipse(x, poleX, 42, 30, 30);
    x.fillStyle = '#fbf6ea';
    ellipse(x, poleX, 42, 24, 24);
    x.fillStyle = BUS_GREEN;
    ellipse(x, poleX, 42, 20, 20);
    busPictogram(x, poleX, 42, 11);
    // The name board under it.
    x.fillStyle = '#fbf6ea';
    roundedRect(x, poleX - 26, 80, 120, 30, 5);
    x.fill();
    x.fillStyle = BUS_GREEN;
    x.fillRect(poleX - 26, 80, 6, 30);
    x.fillStyle = '#2c2a35';
    x.textAlign = 'left';
    x.textBaseline = 'middle';
    let size = 20;
    do {
      x.font = `${size}px "Bagel Fat One", sans-serif`;
      size -= 1;
    } while (x.measureText(name).width > 104 && size > 9);
    x.fillText(name, poleX - 14, 96);
    // The shelter: posts, a glass back, a roof and a bench.
    const left = 150;
    const right = width - 6;
    const roofY = 60;
    x.fillStyle = 'rgb(180 220 240 / 55%)';
    x.fillRect(left + 8, roofY + 18, right - left - 16, height - roofY - 60);
    x.fillStyle = 'rgb(255 255 255 / 45%)';
    x.fillRect(left + 22, roofY + 30, 10, height - roofY - 90);
    x.fillStyle = BUS_GREEN;
    x.fillRect(left, roofY + 10, 10, height - roofY - 10);
    x.fillRect(right - 10, roofY + 10, 10, height - roofY - 10);
    roundedRect(x, left - 12, roofY, right - left + 18, 22, 6);
    x.fill();
    x.fillStyle = BUS_YELLOW;
    x.fillRect(left - 12, roofY + 16, right - left + 18, 6);
    // A timetable on the glass.
    x.fillStyle = '#fbf6ea';
    x.fillRect(right - 62, roofY + 44, 40, 54);
    x.fillStyle = 'rgb(44 42 53 / 35%)';
    for (let line = 0; line < 5; line++) {
      x.fillRect(right - 56, roofY + 52 + line * 9, 28, 3);
    }
    // The bench.
    x.fillStyle = WOOD;
    roundedRect(x, left + 20, height - 66, right - left - 40, 12, 4);
    x.fill();
    x.fillStyle = WOOD_DARK;
    x.fillRect(left + 34, height - 54, 8, 54);
    x.fillRect(right - 42, height - 54, 8, 54);
  };
}

// The bus, waiting with its doors open: yellow with a green stripe, a row of windows, the line's
// name lit up over the windscreen, and big round wheels.
export function drawBus(line: string) {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const bottom = height - 34;
    // Body, with a rounded nose on the left, where it faces.
    x.fillStyle = BUS_YELLOW;
    roundedRect(x, 0, 20, width, bottom - 20, 26);
    x.fill();
    x.fillStyle = BUS_GREEN;
    x.fillRect(0, bottom - 60, width, 22);
    x.fillStyle = '#d99a22';
    x.fillRect(0, bottom - 16, width, 16);
    // The line's display, over the windscreen.
    x.fillStyle = '#14122a';
    roundedRect(x, 22, 30, 150, 30, 5);
    x.fill();
    x.fillStyle = '#ffc83d';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    let size = 20;
    do {
      x.font = `bold ${size}px "Courier New", monospace`;
      size -= 1;
    } while (x.measureText(line).width > 136 && size > 9);
    x.fillText(line, 97, 46);
    // Windscreen and side windows.
    x.fillStyle = '#8cc3e6';
    roundedRect(x, 10, 70, 70, 100, 14);
    x.fill();
    for (let pane = 0; pane < 5; pane++) {
      x.fillRect(178 + pane * 92, 70, 78, 80);
    }
    x.fillStyle = 'rgb(255 255 255 / 40%)';
    for (let pane = 0; pane < 5; pane++) {
      x.fillRect(186 + pane * 92, 76, 10, 66);
    }
    // The open door, between the windscreen and the windows.
    x.fillStyle = '#5d6b7a';
    x.fillRect(94, 70, 72, bottom - 74);
    x.fillStyle = '#8cc3e6';
    x.fillRect(102, 78, 24, 80);
    x.fillRect(134, 78, 24, 80);
    // Headlight and a mirror.
    x.fillStyle = '#fff3c4';
    ellipse(x, 18, bottom - 30, 9, 9);
    x.fillStyle = '#2c2a35';
    x.fillRect(-2, 64, 8, 30);
    // Wheels.
    for (const wheelX of [110, width - 120]) {
      x.fillStyle = '#2c2a35';
      ellipse(x, wheelX, bottom + 6, 32, 32);
      x.fillStyle = '#9aa3ae';
      ellipse(x, wheelX, bottom + 6, 14, 14);
    }
  };
}
