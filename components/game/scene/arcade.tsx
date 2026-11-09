import { useMemo } from 'react';
import { ARCADE_MACHINES, ARCADE_WALLS } from '@/game/world/side-rooms';
import {
  drawArcadeCabinet,
  drawArcadeCarpet,
  drawArcadeDoor,
  drawBasketballMachine,
  drawClawMachine,
} from '../art/arcade';
import { drawShadowBlob, drawWallpaper } from '../art/bedroom';
import { cutOut, paint } from '../art/core';
import {
  DOOR_HEIGHT,
  DOOR_WIDTH,
  Furniture,
  PIXELS_PER_UNIT,
  RoomShell,
  texture,
  WALL_Z,
} from './stage';

const MACHINES_Z = -1.1;
const NEON_STRIPS = [
  { y: 3.7, color: '#ff4fa3' },
  { y: 3.55, color: '#4fd8ff' },
];

// The arcade: neon strips along a dark wall, a carpet of bright shapes, and a row of machines, of
// which only the basketball one can be played.
export function Arcade() {
  const { cabinetA, cabinetB, basketball, claw, cabinetC } = ARCADE_MACHINES;
  const textures = useMemo(
    () => ({
      room: {
        wall: texture(drawWallpaper('#3f3a63', 'rgb(255 79 163 / 14%)')),
        floor: texture(drawArcadeCarpet()),
        door: texture(
          paint(
            Math.round(DOOR_WIDTH * PIXELS_PER_UNIT),
            Math.round(DOOR_HEIGHT * PIXELS_PER_UNIT),
            drawArcadeDoor,
            101,
          ),
        ),
      },
      shadow: texture(drawShadowBlob()),
      cabinets: [
        ['#6a5acd', '#7cff9a'],
        ['#d9655a', '#4fd8ff'],
        ['#3fa08a', '#ffd84f'],
      ].map(([color, screen], index) =>
        texture(cutOut(120, 260, drawArcadeCabinet(color, screen), 8, 102 + index)),
      ),
      basketball: texture(cutOut(260, 360, drawBasketballMachine, 9, 105)),
      claw: texture(cutOut(170, 270, drawClawMachine, 9, 106)),
    }),
    [],
  );
  const width = ARCADE_WALLS.right - ARCADE_WALLS.left;
  return (
    <>
      <RoomShell walls={ARCADE_WALLS} doorSide="left" textures={textures.room} />
      {NEON_STRIPS.map(({ y, color }) => (
        <mesh key={color} position={[0, y, WALL_Z + 0.02]}>
          <planeGeometry args={[width - 0.4, 0.06]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
      {[cabinetA, cabinetB, cabinetC].map(({ x }, index) => (
        <Furniture
          key={x}
          map={textures.cabinets[index]}
          x={x}
          z={MACHINES_Z}
          height={2.45}
          shadow={textures.shadow}
        />
      ))}
      <Furniture
        map={textures.basketball}
        x={basketball.x}
        z={MACHINES_Z}
        height={3.2}
        shadow={textures.shadow}
      />
      <Furniture
        map={textures.claw}
        x={claw.x}
        z={MACHINES_Z}
        height={2.6}
        shadow={textures.shadow}
      />
    </>
  );
}
