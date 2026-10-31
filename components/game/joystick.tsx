import { type PointerEvent, useRef, useState } from 'react';
import { type Direction, joystickDirection, STILL } from '@/game/movement';

const RADIUS = 48;

type Props = {
  onChange: (direction: Direction) => void;
};

// Keyboard and screen reader users don't need it, so it stays out of the accessibility tree.
export function Joystick({ onChange }: Props) {
  const area = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState<Direction>(STILL);

  const update = (event: PointerEvent) => {
    const bounds = area.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }
    const direction = joystickDirection(
      event.clientX - (bounds.left + bounds.width / 2),
      event.clientY - (bounds.top + bounds.height / 2),
      RADIUS,
    );
    setKnob(direction);
    onChange(direction);
  };

  const release = () => {
    setKnob(STILL);
    onChange(STILL);
  };

  return (
    <div
      ref={area}
      aria-hidden="true"
      className="absolute bottom-8 left-8 hidden size-32 touch-none select-none items-center justify-center rounded-full border border-current/30 bg-current/10 pointer-coarse:flex"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          update(event);
        }
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div
        className="size-14 rounded-full bg-current/50"
        style={{ transform: `translate(${knob.x * RADIUS}px, ${knob.z * RADIUS}px)` }}
      />
    </div>
  );
}
