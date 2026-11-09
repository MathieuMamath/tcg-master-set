// The coupon floor of the administrative office, kept by Mlle Trotte.

import { type RefObject, useMemo } from 'react';
import { COUPONS_FURNITURE, COUPONS_WALLS, TROTTE_X } from '@/game/world/side-rooms';
import { drawShadowBlob } from '../art/bedroom';
import { cutOut, paint } from '../art/core';
import {
  drawCouponBoard,
  drawCouponDesk,
  drawElevator,
  drawFilingCabinet,
  drawLooseSheets,
  drawOfficeFloor,
  drawOfficeWall,
  drawPaperStack,
  drawTallPlant,
  drawTrotte,
  TROTTE_SIZE,
} from '../art/office';
import {
  blinker,
  Character,
  CutOut,
  DOOR_HEIGHT,
  DOOR_WIDTH,
  Furniture,
  PIXELS_PER_UNIT,
  RoomShell,
  type SpeakerTops,
  SpeakerTopsOf,
  texture,
  WALL_Z,
} from './stage';

// The coupon floor's paperwork: tall piles along the back wall, two short ones at the front, and
// loose sheets and coupons all over the floor.
const COUPON_STACKS = [
  { x: -3.4, z: -1.25, height: 2.3 },
  { x: -2.9, z: -0.85, height: 1.4 },
  { x: 0.25, z: -1.3, height: 2.6 },
  { x: -0.1, z: -0.95, height: 1.5 },
  { x: 3.45, z: -1.35, height: 2.1 },
  { x: -1.9, z: 2.25, height: 0.8 },
  { x: 4.35, z: 2.15, height: 1 },
];
const COUPON_SHEETS = [
  { x: -3.9, z: 1.9, turn: 0.3 },
  { x: -2.3, z: 0.5, turn: -0.5 },
  { x: -0.7, z: 1.7, turn: 0.9 },
  { x: 0.9, z: 0.3, turn: -0.2 },
  { x: 1.6, z: 2.3, turn: 0.6 },
  { x: 3, z: 1.6, turn: -0.8 },
  { x: 0.2, z: 2.6, turn: 0.1 },
  { x: -3.2, z: -0.2, turn: 1.2 },
];
const TROTTE_HEIGHT = 2.7;
const TROTTE_Z = -0.9;

// The coupon floor, above the administrative office: Mlle Trotte at her desk, a cork board pinned
// with coupons, a filing cabinet, and the lift in the left wall to go back down.
export function Coupons({ speakerTops }: { speakerTops: RefObject<SpeakerTops> }) {
  const { plant, board, desk, cabinet } = COUPONS_FURNITURE;
  const textures = useMemo(
    () => ({
      room: {
        wall: texture(drawOfficeWall()),
        floor: texture(drawOfficeFloor()),
        door: texture(
          paint(
            Math.round(DOOR_WIDTH * PIXELS_PER_UNIT),
            Math.round(DOOR_HEIGHT * PIXELS_PER_UNIT),
            (drawing, width, height) => drawElevator(drawing, width, height, 'down'),
            171,
          ),
        ),
      },
      shadow: texture(drawShadowBlob()),
      board: texture(
        cutOut(Math.round(board.width * PIXELS_PER_UNIT), 190, drawCouponBoard, 8, 172),
      ),
      desk: texture(cutOut(320, 200, drawCouponDesk, 9, 173)),
      stacks: [1, 2, 3, 4].map((seed) =>
        texture(cutOut(150, 420, drawPaperStack(seed * 13), 6, 177 + seed)),
      ),
      sheets: [1, 2, 3].map((seed) =>
        texture(paint(280, 150, drawLooseSheets(seed * 7), 181 + seed)),
      ),
      cabinet: texture(cutOut(130, 260, drawFilingCabinet, 8, 174)),
      plant: texture(cutOut(140, 300, drawTallPlant, 8, 175)),
      trotte: blinker(TROTTE_SIZE.width, TROTTE_SIZE.height, drawTrotte, 9, 176),
    }),
    [],
  );
  return (
    <>
      <RoomShell walls={COUPONS_WALLS} doorSide="left" textures={textures.room} />
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[
          { interaction: 'trotte', map: textures.trotte.open, height: TROTTE_HEIGHT, z: TROTTE_Z },
        ]}
      />
      <group position={[board.x, 1.5, WALL_Z + 0.02]}>
        <CutOut map={textures.board} height={1.9} />
      </group>
      <Furniture map={textures.plant} x={plant.x} z={-1.1} height={2} shadow={textures.shadow} />
      {/* Papers everywhere: sheets and coupons fallen on the floor, and piles taller than her. */}
      {COUPON_SHEETS.map(({ x, z, turn }, index) => (
        <mesh
          key={`${x}-${z}`}
          rotation={[-Math.PI / 2, 0, turn]}
          position={[x, 0.012 + index * 0.001, z]}
        >
          <planeGeometry args={[1.5, 0.8]} />
          <meshBasicMaterial
            map={textures.sheets[index % textures.sheets.length]}
            transparent
            depthWrite={false}
          />
        </mesh>
      ))}
      {COUPON_STACKS.map(({ x, z, height }, index) => (
        <Furniture
          key={`${x}-${z}`}
          map={textures.stacks[index % textures.stacks.length]}
          x={x}
          z={z}
          height={height}
          shadow={textures.shadow}
        />
      ))}
      <Furniture
        map={textures.cabinet}
        x={cabinet.x}
        z={-1.2}
        height={2.2}
        shadow={textures.shadow}
      />
      <Character
        map={textures.trotte.open}
        blinks={textures.trotte}
        x={TROTTE_X}
        z={TROTTE_Z}
        height={TROTTE_HEIGHT}
        shadow={textures.shadow}
      />
      <Furniture map={textures.desk} x={desk.x} z={-0.5} height={1.7} shadow={textures.shadow} />
    </>
  );
}
