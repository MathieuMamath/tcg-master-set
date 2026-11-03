'use client';

import { useState } from 'react';

// The catalogue's largest images are 600 pixels wide, so a card stops growing there to stay sharp.
export const ENLARGED_CARD_CLASS = 'aspect-[5/7] w-[min(100%,calc((100dvh-16rem)*5/7),37.5rem)]';

const IMAGE_FILES = { low: 'low.webp', high: 'high.webp', max: 'high.png' };

type Props = {
  name: string;
  imageUrl: string | null;
  // `max` is lossless and much heavier, for a card looked at up close.
  quality: keyof typeof IMAGE_FILES;
};

// Shows the card's name instead when the catalogue has no image, or its server can't provide it.
export function CardPicture({ name, imageUrl, quality }: Props) {
  const src = imageUrl && `${imageUrl}/${IMAGE_FILES[quality]}`;
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
      // The small image the player has already seen, until the heavy one arrives.
      style={
        quality === 'max'
          ? { backgroundImage: `url(${imageUrl}/${IMAGE_FILES.low})`, backgroundSize: 'cover' }
          : undefined
      }
      className="size-full rounded-[4.5%/3.2%] bg-ui-paper object-cover"
    />
  );
}
