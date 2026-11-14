'use client';

import { useEffect, useRef } from 'react';
import type { QuestGiver } from '@/game/world/world';
import { drawHedgehog, HEDGEHOG_FACE, HEDGEHOG_SIZE } from '../art/bookshop';
import { drawPeahen, PEAHEN_FACE, PEAHEN_SIZE } from '../art/boutique';
import { drawRaccoon, RACCOON_FACE, RACCOON_SIZE, SELLERS } from '../art/card-den';
import { drawGaspard, GASPARD_FACE, GASPARD_SIZE } from '../art/dalgona';
import { DOJO_MASTER_FACE, DOJO_MASTER_SIZE, drawDojoMaster } from '../art/dojo';
import { drawLea, LEA_FACE, LEA_SIZE } from '../art/lea';
import {
  ARCHIVIST_FACE,
  ARCHIVIST_SIZE,
  BRUTUS_FACE,
  BRUTUS_SIZE,
  drawArchivist,
  drawBrutus,
  drawHulotte,
  drawTrotte,
  HULOTTE_FACE,
  HULOTTE_SIZE,
  TROTTE_FACE,
  TROTTE_SIZE,
} from '../art/office';
import { drawPainter, PAINTER_FACE, PAINTER_SIZE } from '../art/painter';
import { drawLucas, drawPapy, LUCAS_FACE, LUCAS_SIZE, PAPY_FACE, PAPY_SIZE } from '../art/park';
import { drawGardener, GARDENER_FACE, GARDENER_SIZE } from '../art/park-games';
import { drawPhotographer, PHOTOGRAPHER_FACE, PHOTOGRAPHER_SIZE } from '../art/photos';
import { drawPostman, POSTMAN_FACE, POSTMAN_SIZE } from '../art/post';
import { BERENICE_FACE, BERENICE_SIZE, drawBerenice } from '../art/raffle';
import { drawRamenChef, RAMEN_CHEF_FACE, RAMEN_CHEF_SIZE } from '../art/ramen';
import { drawKitten, drawRonron, KITTEN_SIZE, RONRON_FACE, RONRON_SIZE } from '../art/ronron';

const PORTRAIT_SIZE = 208;

// The characters with a portrait: the sellers, and the quest givers.
export type Character =
  | keyof typeof SELLERS
  | 'binderSeller'
  | QuestGiver
  | 'brutus'
  | 'hulotte'
  | 'archivist'
  | 'trotte'
  | 'ramenChef'
  | 'dojoMaster'
  | 'gardener'
  | 'postman'
  | 'painter'
  | 'ronron'
  | 'kitten'
  | 'photographer'
  | 'boutiqueSeller';

// Each character's whole drawing, and where the face is in it.
function sellerDrawing(stock: Character) {
  if (stock === 'grandma') {
    return { draw: drawLea, size: LEA_SIZE, face: LEA_FACE };
  }
  if (stock === 'grandpa') {
    return { draw: drawPapy, size: PAPY_SIZE, face: PAPY_FACE };
  }
  if (stock === 'boy') {
    return { draw: drawLucas, size: LUCAS_SIZE, face: LUCAS_FACE };
  }
  if (stock === 'brutus') {
    return { draw: drawBrutus, size: BRUTUS_SIZE, face: BRUTUS_FACE };
  }
  if (stock === 'hulotte') {
    return { draw: drawHulotte, size: HULOTTE_SIZE, face: HULOTTE_FACE };
  }
  if (stock === 'archivist') {
    return { draw: drawArchivist, size: ARCHIVIST_SIZE, face: ARCHIVIST_FACE };
  }
  if (stock === 'trotte') {
    return { draw: drawTrotte, size: TROTTE_SIZE, face: TROTTE_FACE };
  }
  if (stock === 'berenice') {
    return { draw: drawBerenice, size: BERENICE_SIZE, face: BERENICE_FACE };
  }
  if (stock === 'ramenChef') {
    return { draw: drawRamenChef, size: RAMEN_CHEF_SIZE, face: RAMEN_CHEF_FACE };
  }
  if (stock === 'postman') {
    return { draw: drawPostman, size: POSTMAN_SIZE, face: POSTMAN_FACE };
  }
  if (stock === 'painter') {
    return { draw: drawPainter, size: PAINTER_SIZE, face: PAINTER_FACE };
  }
  if (stock === 'ronron') {
    return { draw: drawRonron, size: RONRON_SIZE, face: RONRON_FACE };
  }
  if (stock === 'kitten') {
    return { draw: drawKitten, size: KITTEN_SIZE, face: { x: 100, y: 100, size: 150 } };
  }
  if (stock === 'boutiqueSeller') {
    return { draw: drawPeahen, size: PEAHEN_SIZE, face: PEAHEN_FACE };
  }
  if (stock === 'photographer') {
    return { draw: drawPhotographer, size: PHOTOGRAPHER_SIZE, face: PHOTOGRAPHER_FACE };
  }
  if (stock === 'gardener') {
    return { draw: drawGardener, size: GARDENER_SIZE, face: GARDENER_FACE };
  }
  if (stock === 'dojoMaster') {
    return { draw: drawDojoMaster, size: DOJO_MASTER_SIZE, face: DOJO_MASTER_FACE };
  }
  if (stock === 'gaspard') {
    return { draw: drawGaspard, size: GASPARD_SIZE, face: GASPARD_FACE };
  }
  return stock === 'binderSeller'
    ? { draw: drawHedgehog, size: HEDGEHOG_SIZE, face: HEDGEHOG_FACE }
    : { draw: drawRaccoon(SELLERS[stock].look), size: RACCOON_SIZE, face: RACCOON_FACE };
}

// A character's face, cut from her full drawing, for the round portrait of the speech box.
export function SellerPortrait({ stock }: { stock: Character }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const drawing = canvas.current?.getContext('2d');
    if (!drawing) {
      return;
    }
    const { draw, size: drawingSize, face } = sellerDrawing(stock);
    const full = document.createElement('canvas');
    full.width = drawingSize.width;
    full.height = drawingSize.height;
    const fullDrawing = full.getContext('2d');
    if (!fullDrawing) {
      return;
    }
    draw(fullDrawing, full.width, full.height);
    const { x, y, size } = face;
    drawing.clearRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
    drawing.drawImage(
      full,
      x - size / 2,
      y - size / 2,
      size,
      size,
      0,
      0,
      PORTRAIT_SIZE,
      PORTRAIT_SIZE,
    );
  }, [stock]);

  return <canvas ref={canvas} width={PORTRAIT_SIZE} height={PORTRAIT_SIZE} className="size-full" />;
}
