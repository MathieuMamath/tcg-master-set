'use client';

import { useEffect, useRef } from 'react';
import {
  drawHedgehog,
  drawRaccoon,
  HEDGEHOG_FACE,
  HEDGEHOG_SIZE,
  RACCOON_FACE,
  RACCOON_SIZE,
  SELLERS,
} from './paper-art';

const PORTRAIT_SIZE = 208;

// Each seller's whole drawing, and where her face is in it.
function sellerDrawing(stock: keyof typeof SELLERS | 'binderSeller') {
  return stock === 'binderSeller'
    ? { draw: drawHedgehog, size: HEDGEHOG_SIZE, face: HEDGEHOG_FACE }
    : { draw: drawRaccoon(SELLERS[stock].look), size: RACCOON_SIZE, face: RACCOON_FACE };
}

// A seller's face, cut from her full drawing, for the round portrait of the speech box.
export function SellerPortrait({ stock }: { stock: keyof typeof SELLERS | 'binderSeller' }) {
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
