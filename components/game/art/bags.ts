// The bags Pip carries its cards in, worn on the left side on a strap across the body: the
// satchel everyone starts with, and those of Mme Poche's counter at the department store downtown.
// `drawBag` draws one at any spot and size, for the store's shelves.

import type { GearId } from '@/game/avatar/items';
import { ellipse, roundedRect } from './core';

// The bag's own size, from its top-left corner.
export const BAG_SIZE = { width: 62, height: 52 };

type BagLook = {
  body: string;
  // Inside, seen behind the cards.
  inside: string;
  // The top edge of the front.
  edge: string;
  strap: string;
  // What makes each bag its own, drawn over its front.
  details: (x: CanvasRenderingContext2D) => void;
};

function stitches(x: CanvasRenderingContext2D, color: string) {
  x.strokeStyle = color;
  x.lineWidth = 1.5;
  x.setLineDash([3, 3]);
  roundedRect(x, 4, 16, 54, 32, 7);
  x.stroke();
  x.setLineDash([]);
}

function buckle(x: CanvasRenderingContext2D, buckleX: number, strap: string, metal: string) {
  x.fillStyle = strap;
  x.fillRect(buckleX - 5, 10, 10, 26);
  x.strokeStyle = metal;
  x.lineWidth = 2.5;
  x.strokeRect(buckleX - 6, 26, 12, 9);
}

const LOOKS: Record<GearId, BagLook> = {
  // The brown leather satchel everyone starts with, its brass clasp.
  satchel: {
    body: '#b4552f',
    inside: '#6e2e17',
    edge: '#9a4326',
    strap: '#8c4b2e',
    details: (x) => {
      x.fillStyle = '#f3c14b';
      ellipse(x, 31, 30, 5, 5);
    },
  },
  // A khaki canvas messenger bag, its flap held by two leather straps.
  canvasBag: {
    body: '#8f8d5e',
    inside: '#5c5a3a',
    edge: '#74724c',
    strap: '#6e6c46',
    details: (x) => {
      stitches(x, 'rgb(255 250 220 / 55%)');
      buckle(x, 18, '#6e4a2e', '#d6c08a');
      buckle(x, 44, '#6e4a2e', '#d6c08a');
    },
  },
  // A denim bag with orange stitching and copper rivets.
  denimBag: {
    body: '#4a6fa5',
    inside: '#2f4a73',
    edge: '#3d5f8f',
    strap: '#3d5f8f',
    details: (x) => {
      stitches(x, '#e8a04a');
      x.fillStyle = '#c87b3a';
      for (const [rivetX, rivetY] of [
        [8, 18],
        [54, 18],
        [8, 44],
        [54, 44],
      ]) {
        ellipse(x, rivetX, rivetY, 2.5, 2.5);
      }
      // A little front pocket.
      x.strokeStyle = '#e8a04a';
      x.lineWidth = 1.5;
      x.setLineDash([3, 3]);
      x.beginPath();
      x.moveTo(18, 30);
      x.lineTo(44, 30);
      x.lineTo(42, 44);
      x.lineTo(20, 44);
      x.closePath();
      x.stroke();
      x.setLineDash([]);
    },
  },
  // A red school satchel, its deep flap shut with two silver buckles.
  schoolBag: {
    body: '#c8453a',
    inside: '#8e2b25',
    edge: '#a83a30',
    strap: '#a83a30',
    details: (x) => {
      x.fillStyle = '#a83a30';
      roundedRect(x, 2, 14, 58, 22, 8);
      x.fill();
      buckle(x, 18, '#8e2b25', '#e3e6ea');
      buckle(x, 44, '#8e2b25', '#e3e6ea');
    },
  },
  // A quilted black leather bag with gold trim, a gold clasp and a gold chain.
  goldBag: {
    body: '#2b2a30',
    inside: '#16151a',
    edge: '#d9aa3f',
    strap: '#d9aa3f',
    details: (x) => {
      x.save();
      x.beginPath();
      x.rect(0, 16, 62, 36);
      x.clip();
      x.strokeStyle = 'rgb(255 255 255 / 14%)';
      x.lineWidth = 1.5;
      for (let line = -40; line < 80; line += 12) {
        x.beginPath();
        x.moveTo(line, 16);
        x.lineTo(line + 36, 52);
        x.moveTo(line + 36, 16);
        x.lineTo(line, 52);
        x.stroke();
      }
      x.restore();
      x.strokeStyle = '#d9aa3f';
      x.lineWidth = 2;
      roundedRect(x, 1, 13, 60, 38, 9);
      x.stroke();
      x.fillStyle = '#f3d27a';
      roundedRect(x, 24, 24, 14, 10, 3);
      x.fill();
    },
  },
};

// The strap across the body, from the right shoulder down to the bag on the left.
export function drawBagStrap(x: CanvasRenderingContext2D, cx: number, by: number, gear: GearId) {
  const look = LOOKS[gear];
  x.strokeStyle = look.strap;
  x.lineWidth = 7;
  if (gear === 'goldBag') {
    // A chain rather than a strap.
    x.lineWidth = 4;
    x.setLineDash([6, 3]);
  }
  x.beginPath();
  x.moveTo(cx + 62, by - 74);
  x.quadraticCurveTo(cx, by - 60, cx - 58, by - 52);
  x.stroke();
  x.setLineDash([]);
}

// The bag worn on Pip's left side, with three cards sticking out.
export function drawWornBag(x: CanvasRenderingContext2D, cx: number, by: number, gear: GearId) {
  drawBag(x, cx - 96, by - 80, gear, 1);
}

// A bag whose top-left corner is at (left, top), at the given scale.
export function drawBag(
  x: CanvasRenderingContext2D,
  left: number,
  top: number,
  gear: GearId,
  scale: number,
) {
  const look = LOOKS[gear];
  x.save();
  x.translate(left, top);
  x.scale(scale, scale);
  x.fillStyle = look.body;
  roundedRect(x, 0, 0, 62, 52, 10);
  x.fill();
  x.fillStyle = look.inside;
  roundedRect(x, 4, 2, 54, 16, 7);
  x.fill();
  for (const [index, [color, degrees]] of (
    [
      ['#e2603a', -8],
      ['#3a86c8', 4],
      ['#5b9c4e', 14],
    ] as const
  ).entries()) {
    x.save();
    x.translate(16 + index * 15, 24);
    x.rotate((degrees * Math.PI) / 180);
    x.fillStyle = '#fbf6ea';
    x.fillRect(-12, -30, 24, 40);
    x.fillStyle = color;
    x.fillRect(-9, -27, 18, 24);
    x.restore();
  }
  x.fillStyle = look.body;
  roundedRect(x, 0, 12, 62, 40, 10);
  x.fill();
  x.fillStyle = look.edge;
  x.fillRect(0, 12, 62, 5);
  look.details(x);
  x.restore();
}
