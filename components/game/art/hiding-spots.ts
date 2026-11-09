// The kitten's hiding places: crates, bushes, flowers and a log.

import { ellipse, roundedRect } from './core';

export const HIDING_PROP_SIZE = { width: 220, height: 160 };

// What each hiding place looks like, all drawn the same size, standing on the ground: a stack of
// wooden crates, a round bush, a tub of flowers, or a hollow log.
export function drawHidingProp(look: 'crates' | 'bush' | 'flowers' | 'log') {
  return (drawing: CanvasRenderingContext2D, width: number, height: number) => {
    const x = drawing;
    const bottom = height - 4;
    if (look === 'crates') {
      for (const [left, top, size] of [
        [20, bottom - 90, 90],
        [110, bottom - 80, 80],
        [56, bottom - 160, 74],
      ] as const) {
        x.fillStyle = '#c99a5b';
        x.fillRect(left, top, size, size);
        x.strokeStyle = '#8a5a34';
        x.lineWidth = 6;
        x.strokeRect(left + 3, top + 3, size - 6, size - 6);
        x.beginPath();
        x.moveTo(left + 6, top + 6);
        x.lineTo(left + size - 6, top + size - 6);
        x.stroke();
      }
    } else if (look === 'bush') {
      x.fillStyle = '#3f7a3a';
      for (const [bushX, bushY, size] of [
        [60, bottom - 50, 52],
        [160, bottom - 50, 52],
        [110, bottom - 80, 66],
      ] as const) {
        ellipse(x, bushX, bushY, size, size * 0.9);
      }
      x.fillStyle = '#5a9a48';
      for (const [bushX, bushY, size] of [
        [70, bottom - 60, 34],
        [150, bottom - 62, 32],
        [104, bottom - 96, 40],
      ] as const) {
        ellipse(x, bushX, bushY, size, size * 0.8);
      }
      x.fillStyle = '#f2b8c6';
      for (const [flowerX, flowerY] of [
        [52, bottom - 70],
        [130, bottom - 110],
        [170, bottom - 54],
      ] as const) {
        ellipse(x, flowerX, flowerY, 6, 6);
      }
    } else if (look === 'flowers') {
      // Stems and blooms, then the wooden tub in front.
      x.strokeStyle = '#4f7a34';
      x.lineWidth = 5;
      const blooms = ['#d0443a', '#f0c43a', '#9d7bb8', '#f08a7e', '#fbf6ea'];
      for (let stem = 0; stem < 9; stem++) {
        const stemX = 40 + stem * 18;
        const top = bottom - 110 - ((stem * 23) % 36);
        x.beginPath();
        x.moveTo(stemX, bottom - 60);
        x.lineTo(stemX + (stem % 2 ? 6 : -6), top);
        x.stroke();
        x.fillStyle = blooms[stem % blooms.length];
        ellipse(x, stemX + (stem % 2 ? 6 : -6), top, 11, 11);
        x.fillStyle = '#f0c43a';
        ellipse(x, stemX + (stem % 2 ? 6 : -6), top, 4, 4);
      }
      x.fillStyle = '#a87644';
      x.beginPath();
      x.moveTo(24, bottom - 70);
      x.lineTo(width - 24, bottom - 70);
      x.lineTo(width - 40, bottom);
      x.lineTo(40, bottom);
      x.closePath();
      x.fill();
      x.fillStyle = '#7f5530';
      x.fillRect(30, bottom - 52, width - 60, 8);
      x.fillRect(36, bottom - 24, width - 72, 8);
    } else {
      // A hollow log lying on its side, its dark opening towards the viewer's right.
      x.fillStyle = '#8a5a34';
      roundedRect(x, 20, bottom - 80, width - 70, 76, 30);
      x.fill();
      x.strokeStyle = '#6b4a2e';
      x.lineWidth = 4;
      for (const lineY of [bottom - 60, bottom - 36]) {
        x.beginPath();
        x.moveTo(40, lineY);
        x.lineTo(width - 80, lineY + 4);
        x.stroke();
      }
      x.fillStyle = '#c99a5b';
      ellipse(x, width - 50, bottom - 42, 30, 38);
      x.fillStyle = '#3a2618';
      ellipse(x, width - 50, bottom - 42, 20, 28);
      x.fillStyle = '#5a9a48';
      ellipse(x, 70, bottom - 80, 16, 8);
      ellipse(x, 96, bottom - 82, 12, 6);
    }
  };
}

// --- Bastien, the administrative office's archivist. --------------------------------------------
