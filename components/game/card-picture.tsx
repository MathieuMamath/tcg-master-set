'use client';

import { useState } from 'react';

type Props = {
  name: string;
  imageUrl: string | null;
  quality: 'high' | 'low';
};

// Shows the card's name instead when the catalogue has no image, or its server can't provide it.
export function CardPicture({ name, imageUrl, quality }: Props) {
  const src = imageUrl && `${imageUrl}/${quality}.webp`;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || src === failedSrc) {
    return (
      <span
        className={`flex size-full items-center justify-center rounded-[4.5%/3.2%] border-ui-accent bg-ui-paper text-center font-semibold text-ui-ink ${
          quality === 'high' ? 'border-8 p-2 text-2xl' : 'border-4 p-1 text-xs'
        }`}
      >
        {name}
      </span>
    );
  }
  return (
    // The images come from the card catalogue's own server, in its optimised sizes.
    // biome-ignore lint/performance/noImgElement: next/image would only proxy them again.
    <img
      src={src}
      alt={name}
      draggable={false}
      loading={quality === 'low' ? 'lazy' : undefined}
      onError={() => setFailedSrc(src)}
      className="size-full rounded-[4.5%/3.2%] bg-ui-paper object-cover"
    />
  );
}
