'use client';

import { useEffect, useState } from 'react';
import { clearEdgeBackground } from '@/game/logo-background';

async function loadLogo(logoUrl: string) {
  const image = new Image();
  // Without this, the browser refuses to let the canvas read the image.
  image.crossOrigin = 'anonymous';
  image.src = `${logoUrl}.png`;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('No canvas');
  }
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  clearEdgeBackground(data, canvas.width, canvas.height);
  context.putImageData(new ImageData(data, canvas.width, canvas.height), 0, 0);
  return canvas.toDataURL();
}

export function SetLogo({ setName, logoUrl }: { setName: string; logoUrl: string | null }) {
  const [logo, setLogo] = useState<{ status: 'loading' | 'failed' } | { src: string }>({
    status: logoUrl ? 'loading' : 'failed',
  });

  useEffect(() => {
    if (!logoUrl) {
      return;
    }
    let isCurrent = true;
    loadLogo(logoUrl).then(
      (src) => isCurrent && setLogo({ src }),
      () => isCurrent && setLogo({ status: 'failed' }),
    );
    return () => {
      isCurrent = false;
    };
  }, [logoUrl]);

  if ('src' in logo) {
    return (
      // The logo comes from the card catalogue's own server, like the card images.
      // biome-ignore lint/performance/noImgElement: next/image can't show a logo drawn in the browser.
      <img
        src={logo.src}
        alt={setName}
        draggable={false}
        className="ui-pop-in max-h-full max-w-full object-contain drop-shadow-[0_3px_6px_rgb(0_0_0/60%)]"
      />
    );
  }
  return logo.status === 'failed' ? (
    <span className="text-2xl font-semibold">{setName}</span>
  ) : null;
}
