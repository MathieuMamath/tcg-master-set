'use client';

import { type CSSProperties, type ReactNode, useState } from 'react';
import { cardTilt, FLAT_TILT } from '@/game/cards/card-tilt';
import { cardFoil } from '@/game/cards/foil';
import { CardFoil } from './card-foil';

type Light = { x: number; y: number } | null;

// A card held up: it leans away from the pointer, and a holo's or a reverse's foil catches the
// light where the pointer is. At rest, the foil's light drifts by itself.
export function TiltCard({ variant, children }: { variant: string; children: ReactNode }) {
  const [{ rotateX, rotateY }, setTilt] = useState(FLAT_TILT);
  const [light, setLight] = useState<Light>(null);
  const foil = cardFoil(variant);
  const flatten = () => {
    setTilt(FLAT_TILT);
    setLight(null);
  };

  return (
    // The pointer is read on this still element: on the moving card, the tilt would change the area.
    <div
      onPointerMove={(event) => {
        const area = event.currentTarget.getBoundingClientRect();
        setTilt(cardTilt(event.clientX, event.clientY, area));
        setLight({
          x: ((event.clientX - area.left) / area.width) * 100,
          y: ((event.clientY - area.top) / area.height) * 100,
        });
      }}
      onPointerLeave={flatten}
      onPointerCancel={flatten}
      className="size-full touch-none select-none [perspective:60rem]"
    >
      <div
        style={
          {
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            ...(light ? { '--foil-x': light.x, '--foil-y': light.y, '--foil-on': 1 } : {}),
          } as CSSProperties
        }
        className={`relative size-full rounded-[4.5%/3.2%] transition-transform duration-100 ease-out ${
          foil ? 'ui-card-special' : ''
        } ${foil && !light ? 'ui-foil-idle' : ''}`}
      >
        {children}
        <CardFoil foil={foil} />
      </div>
    </div>
  );
}
