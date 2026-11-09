'use client';

import { useEffect, useRef, useState } from 'react';
import { logoFiles } from '@/cards/tcgdex';
import { clearEdgeBackground } from '@/game/cards/logo-background';

// The first of the logo's files that loads.
async function loadImage(logoUrl: string): Promise<HTMLImageElement> {
  for (const file of logoFiles(logoUrl)) {
    const image = new Image();
    // Without this, the browser refuses to let the canvas read the image.
    image.crossOrigin = 'anonymous';
    image.src = file;
    try {
      await image.decode();
      return image;
    } catch {
      // Missing in this format: the next one may have it.
    }
  }
  throw new Error(`No logo at ${logoUrl}`);
}

async function loadLogo(logoUrl: string) {
  const image = await loadImage(logoUrl);

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

  const placeholder = useRef<HTMLSpanElement>(null);

  // Only once it's on screen, because the list of binders has a logo for every set.
  useEffect(() => {
    if (!logoUrl || !placeholder.current) {
      return;
    }
    let isCurrent = true;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        observer.disconnect();
        loadLogo(logoUrl).then(
          (src) => isCurrent && setLogo({ src }),
          () => isCurrent && setLogo({ status: 'failed' }),
        );
      }
    });
    observer.observe(placeholder.current);

    return () => {
      isCurrent = false;
      observer.disconnect();
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
  ) : (
    <span ref={placeholder} className="size-full" />
  );
}
