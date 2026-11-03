'use client';

import { useEffect, useRef } from 'react';
import { drawRaccoon, RACCOON_FACE, RACCOON_SIZE, SELLERS } from './paper-art';

const PORTRAIT_SIZE = 208;

// A raccoon's face, cut from her full drawing, for the round portrait of the speech box.
export function SellerPortrait({ stock }: { stock: keyof typeof SELLERS }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const drawing = canvas.current?.getContext('2d');
    if (!drawing) {
      return;
    }
    const full = document.createElement('canvas');
    full.width = RACCOON_SIZE.width;
    full.height = RACCOON_SIZE.height;
    const fullDrawing = full.getContext('2d');
    if (!fullDrawing) {
      return;
    }
    drawRaccoon(SELLERS[stock].look)(fullDrawing, full.width, full.height);
    const { x, y, size } = RACCOON_FACE;
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
