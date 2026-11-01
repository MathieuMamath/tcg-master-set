'use client';

import { type ReactNode, useState } from 'react';
import { cardTilt, FLAT_TILT } from '@/game/card-tilt';

export function TiltCard({ isSpecial, children }: { isSpecial: boolean; children: ReactNode }) {
  const [{ rotateX, rotateY }, setTilt] = useState(FLAT_TILT);
  const flatten = () => setTilt(FLAT_TILT);

  return (
    // The pointer is read on this still element: on the moving card, the tilt would change the area.
    <div
      onPointerMove={(event) =>
        setTilt(cardTilt(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect()))
      }
      onPointerLeave={flatten}
      onPointerCancel={flatten}
      className="size-full touch-none select-none [perspective:60rem]"
    >
      <div
        style={{ transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }}
        className={`relative size-full rounded-[4.5%/3.2%] transition-transform duration-100 ease-out ${
          isSpecial ? 'ui-card-special' : ''
        }`}
      >
        {children}
        {isSpecial && (
          <span className="ui-shine pointer-events-none absolute inset-0 rounded-[4.5%/3.2%]" />
        )}
      </div>
    </div>
  );
}
