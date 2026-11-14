// The hats Pip can wear, from Sir Moustache's hat shop downtown, the same way on every animal, in
// front of the ears' bases. The stiff ones, the top hat, the bowler and the boater, sit on top of
// the head; the soft ones, the beanie, the beret and the flat cap, wrap it, following its curve
// down to above the eyes and never past its outline, the ears poking out. `drawHat` draws a hat at any spot and size, for the
// hat shop's stands.

import type { HatId } from '@/game/avatar/items';
import { ellipse, roundedRect } from './core';

// Pip's head, the top of its round body: its middle and its half-width and half-height, as drawn
// by `drawPip`.
const HEAD = { dx: 4, dy: -104, rx: 90, ry: 102 };

type Head = { hx: number; hy: number; rx: number; ry: number };

// Where a hat sits on Pip. A stiff hat's brim's middle is a little above the top of the head and a
// little forward, since Pip faces right.
export function drawWornHat(x: CanvasRenderingContext2D, cx: number, by: number, hat: HatId) {
  const fitted = FITTED[hat];
  if (fitted) {
    x.save();
    x.lineCap = 'round';
    x.lineJoin = 'round';
    fitted(x, { hx: cx + HEAD.dx, hy: by + HEAD.dy, rx: HEAD.rx, ry: HEAD.ry });
    x.restore();
    return;
  }
  drawHat(x, cx + 12, by - 188, hat, 1);
}

// How far a soft hat stands out of the head's outline: not at all, so that it never shows past the
// head's edge.
const SWELL = 0;

// Draws inside the head's outline above a line, so that nothing of a soft hat goes past the head.
function onHead(x: CanvasRenderingContext2D, head: Head, rimY: number, draw: () => void) {
  x.save();
  x.beginPath();
  x.rect(head.hx - head.rx - SWELL, rimY - head.ry * 2, (head.rx + SWELL) * 2, head.ry * 2);
  x.clip();
  x.beginPath();
  x.ellipse(head.hx, head.hy, head.rx + SWELL, head.ry + SWELL, 0, 0, Math.PI * 2);
  x.clip();
  x.fillRect(head.hx - head.rx - SWELL, rimY - head.ry * 2, (head.rx + SWELL) * 2, head.ry * 2);
  draw();
  x.restore();
}

const FITTED: Partial<Record<HatId, (x: CanvasRenderingContext2D, head: Head) => void>> = {
  // The beanie pulled down over the head to the brow, its ribbed band turned up, the pompom on top.
  beanie: (x, head) => {
    const rimY = head.hy - 50;
    const top = head.hy - head.ry;
    x.fillStyle = '#c8453a';
    onHead(x, head, rimY, () => {
      x.strokeStyle = '#a83a30';
      x.lineWidth = 3;
      for (const rib of [-60, -30, 0, 30, 60]) {
        x.beginPath();
        x.moveTo(head.hx + rib, rimY);
        x.quadraticCurveTo(head.hx + rib * 0.8, top + 40, head.hx + rib * 0.3, top - 4);
        x.stroke();
      }
      // The band, turned up, and its ribs.
      x.fillStyle = '#a83a30';
      x.fillRect(head.hx - head.rx - SWELL, rimY - 26, (head.rx + SWELL) * 2, 26);
      x.strokeStyle = 'rgb(255 255 255 / 22%)';
      x.lineWidth = 2.5;
      for (let rib = -96; rib <= 96; rib += 9) {
        x.beginPath();
        x.moveTo(head.hx + rib, rimY - 26);
        x.lineTo(head.hx + rib, rimY);
        x.stroke();
      }
    });
    x.fillStyle = '#fff6ea';
    ellipse(x, head.hx + 4, top - 12, 19, 18);
    x.strokeStyle = '#e8dccb';
    x.lineWidth = 2;
    for (let tuft = 0; tuft < 6; tuft++) {
      const angle = (tuft * Math.PI) / 3;
      x.beginPath();
      x.moveTo(head.hx + 4 + Math.cos(angle) * 5, top - 12 + Math.sin(angle) * 5);
      x.lineTo(head.hx + 4 + Math.cos(angle) * 14, top - 12 + Math.sin(angle) * 14);
      x.stroke();
    }
  },
  // The beret: a flat round disc of felt, wider than the head and worn tilted, dipping to the left,
  // its darker edge showing underneath and its little stalk in the middle. The one soft hat whose
  // shape is its own rather than the head's.
  beret: (x, head) => {
    const top = head.hy - head.ry;
    x.save();
    x.translate(head.hx - 6, top + 22);
    x.rotate(-0.14);
    // The underside's edge, then the disc over it.
    x.fillStyle = '#1b2249';
    ellipse(x, 0, 7, 86, 24);
    x.fillStyle = '#2b3566';
    ellipse(x, 0, 0, 86, 24);
    // The felt's sheen, and the seam round the crown.
    x.fillStyle = 'rgb(255 255 255 / 14%)';
    ellipse(x, -28, -8, 34, 7);
    x.strokeStyle = 'rgb(0 0 0 / 18%)';
    x.lineWidth = 2;
    x.beginPath();
    x.ellipse(0, -2, 36, 10, 0, 0, Math.PI * 2);
    x.stroke();
    // The stalk.
    x.strokeStyle = '#1b2249';
    x.lineWidth = 5;
    x.beginPath();
    x.moveTo(2, -10);
    x.lineTo(5, -24);
    x.stroke();
    x.restore();
  },
  // The flat cap snug over the head, a seam across its tweed crown and a short peak over the face.
  flatCap: (x, head) => {
    const rimY = head.hy - 62;
    const top = head.hy - head.ry;
    x.fillStyle = '#8a7a62';
    onHead(x, head, rimY, () => {
      // The tweed's flecks.
      x.fillStyle = 'rgb(240 225 190 / 45%)';
      for (let fleck = 0; fleck < 46; fleck++) {
        ellipse(
          x,
          head.hx - 90 + ((fleck * 37) % 180),
          top + ((fleck * 23) % (rimY - top)),
          1.8,
          1.8,
        );
      }
      // The seam where the crown is gathered forward.
      x.strokeStyle = '#6e604b';
      x.lineWidth = 3;
      x.beginPath();
      x.moveTo(head.hx - 70, rimY - 8);
      x.quadraticCurveTo(head.hx + 10, top + 6, head.hx + 74, rimY - 10);
      x.stroke();
      // The edge of the cap, all round the head.
      x.fillStyle = '#6e604b';
      x.fillRect(head.hx - head.rx, rimY - 6, head.rx * 2, 6);
    });
    // The short peak, out over the face, from the cap's front edge.
    x.fillStyle = '#5f523f';
    x.beginPath();
    x.moveTo(head.hx + 30, rimY - 4);
    x.quadraticCurveTo(head.hx + 84, rimY - 10, head.hx + 104, rimY + 2);
    x.quadraticCurveTo(head.hx + 74, rimY + 12, head.hx + 26, rimY + 4);
    x.closePath();
    x.fill();
    x.fillStyle = '#5a4e3c';
    ellipse(x, head.hx - 4, top + 4, 5, 4);
  },
};

// A hat whose brim's middle is at (hx, hy), at the given scale.
export function drawHat(
  x: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  hat: HatId,
  scale: number,
) {
  x.save();
  x.translate(hx, hy);
  x.scale(scale, scale);
  x.lineCap = 'round';
  x.lineJoin = 'round';
  HATS[hat](x);
  x.restore();
}

const HATS: Record<HatId, (x: CanvasRenderingContext2D) => void> = {
  // A tall black top hat with a burgundy band, and a gleam down its side.
  topHat: (x) => {
    x.fillStyle = '#2b2a30';
    ellipse(x, 0, 0, 74, 13);
    x.beginPath();
    x.moveTo(-44, 0);
    x.lineTo(-40, -104);
    x.quadraticCurveTo(0, -112, 40, -104);
    x.lineTo(44, 0);
    x.closePath();
    x.fill();
    x.fillStyle = '#3d3c44';
    ellipse(x, 0, -104, 40, 9);
    x.fillStyle = '#8e2b45';
    x.fillRect(-44, -26, 88, 18);
    x.fillStyle = 'rgb(255 255 255 / 16%)';
    x.fillRect(-30, -96, 8, 66);
  },
  // A round bowler hat in dark brown, its narrow brim curled up.
  bowler: (x) => {
    x.fillStyle = '#3b2f2a';
    ellipse(x, 0, 0, 66, 11);
    x.beginPath();
    x.ellipse(0, -2, 48, 56, 0, Math.PI, Math.PI * 2);
    x.fill();
    x.fillStyle = '#241c19';
    x.fillRect(-48, -16, 96, 12);
    x.strokeStyle = '#241c19';
    x.lineWidth = 5;
    x.beginPath();
    x.moveTo(-66, -2);
    x.quadraticCurveTo(-70, -10, -62, -12);
    x.moveTo(66, -2);
    x.quadraticCurveTo(70, -10, 62, -12);
    x.stroke();
    x.fillStyle = 'rgb(255 255 255 / 14%)';
    x.beginPath();
    x.ellipse(-16, -36, 9, 16, -0.4, 0, Math.PI * 2);
    x.fill();
  },
  // A tweed flat cap, its peak forward over the eyes.
  flatCap: (x) => {
    x.fillStyle = '#8a7a62';
    x.beginPath();
    x.moveTo(-58, 6);
    x.quadraticCurveTo(-60, -40, -6, -44);
    x.quadraticCurveTo(52, -42, 70, -6);
    x.lineTo(92, 6);
    x.quadraticCurveTo(60, 16, -58, 6);
    x.closePath();
    x.fill();
    x.fillStyle = '#6e604b';
    x.beginPath();
    x.moveTo(40, 0);
    x.quadraticCurveTo(70, -2, 92, 6);
    x.quadraticCurveTo(66, 16, 36, 10);
    x.closePath();
    x.fill();
    // The tweed's flecks.
    x.fillStyle = 'rgb(240 225 190 / 45%)';
    for (let fleck = 0; fleck < 26; fleck++) {
      ellipse(x, -48 + ((fleck * 37) % 104), -34 + ((fleck * 23) % 36), 1.8, 1.8);
    }
    x.fillStyle = '#5a4e3c';
    ellipse(x, -6, -42, 5, 4);
  },
  // A knitted red beanie with a ribbed band and a big white pompom.
  beanie: (x) => {
    x.fillStyle = '#c8453a';
    x.beginPath();
    x.ellipse(0, -4, 58, 60, 0, Math.PI, Math.PI * 2);
    x.fill();
    x.strokeStyle = '#a83a30';
    x.lineWidth = 3;
    for (const rib of [-36, -12, 12, 36]) {
      x.beginPath();
      x.moveTo(rib, -6);
      x.quadraticCurveTo(rib * 0.7, -40, rib * 0.3, -60);
      x.stroke();
    }
    x.fillStyle = '#a83a30';
    roundedRect(x, -62, -16, 124, 22, 8);
    x.fill();
    x.strokeStyle = 'rgb(255 255 255 / 25%)';
    x.lineWidth = 2;
    for (let rib = -56; rib <= 56; rib += 8) {
      x.beginPath();
      x.moveTo(rib, -12);
      x.lineTo(rib, 2);
      x.stroke();
    }
    x.fillStyle = '#fff6ea';
    ellipse(x, 2, -68, 17, 16);
    x.strokeStyle = '#e8dccb';
    x.lineWidth = 2;
    for (let tuft = 0; tuft < 6; tuft++) {
      const angle = (tuft * Math.PI) / 3;
      x.beginPath();
      x.moveTo(2 + Math.cos(angle) * 5, -68 + Math.sin(angle) * 5);
      x.lineTo(2 + Math.cos(angle) * 13, -68 + Math.sin(angle) * 13);
      x.stroke();
    }
  },
  // A straw boater with a wide flat brim and a navy band.
  boater: (x) => {
    x.fillStyle = '#e8c97a';
    ellipse(x, 0, 0, 86, 13);
    x.fillRect(-42, -40, 84, 40);
    x.fillStyle = '#f0d58f';
    ellipse(x, 0, -40, 42, 9);
    x.fillStyle = '#2b3566';
    x.fillRect(-42, -18, 84, 14);
    x.strokeStyle = 'rgb(150 110 40 / 45%)';
    x.lineWidth = 2;
    for (const line of [-30, -26, 6]) {
      x.beginPath();
      x.moveTo(-42, line);
      x.lineTo(42, line);
      x.stroke();
    }
    x.beginPath();
    x.ellipse(0, 0, 70, 8, 0, 0, Math.PI);
    x.stroke();
  },
  // A navy beret, worn tilted, with its little stalk on top.
  beret: (x) => {
    x.save();
    x.rotate(-0.12);
    x.fillStyle = '#2b3566';
    ellipse(x, -2, -16, 66, 24);
    x.fillStyle = '#1b2249';
    roundedRect(x, -46, -8, 92, 12, 6);
    x.fill();
    x.fillStyle = 'rgb(255 255 255 / 14%)';
    ellipse(x, -22, -26, 22, 6);
    x.strokeStyle = '#1b2249';
    x.lineWidth = 5;
    x.beginPath();
    x.moveTo(4, -38);
    x.lineTo(8, -50);
    x.stroke();
    x.restore();
  },
};
