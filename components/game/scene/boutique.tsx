import { type RefObject, useMemo } from 'react';
import { BOUTIQUE_FURNITURE, BOUTIQUE_SELLER_X, BOUTIQUE_WALLS } from '@/game/world/side-rooms';
import { drawDoor, drawShadowBlob } from '../art/bedroom';
import {
  drawBoutiqueCounter,
  drawBoutiqueFloor,
  drawBoutiqueWall,
  drawFittingRoom,
  drawPeahen,
  drawScarfRack,
  PEAHEN_SIZE,
} from '../art/boutique';
import { cutOut, paint } from '../art/core';
import {
  blinker,
  Character,
  DOOR_HEIGHT,
  DOOR_WIDTH,
  Furniture,
  PIXELS_PER_UNIT,
  RoomShell,
  type SpeakerTops,
  SpeakerTopsOf,
  texture,
} from './stage';

const PEAHEN_HEIGHT = 3.6;
const PEAHEN_Z = -1.1;

// Inside Maison Éventail: cream and gold over dark green panelling, a marble floor, the fitting
// room against the left wall, the rack of scarves, and Mlle Éventail behind her glass counter.
export function Boutique({ speakerTops }: { speakerTops: RefObject<SpeakerTops> }) {
  const { fittingRoom, rack, counter } = BOUTIQUE_FURNITURE;
  const textures = useMemo(
    () => ({
      room: {
        wall: texture(drawBoutiqueWall()),
        floor: texture(drawBoutiqueFloor()),
        door: texture(
          paint(
            Math.round(DOOR_WIDTH * PIXELS_PER_UNIT),
            Math.round(DOOR_HEIGHT * PIXELS_PER_UNIT),
            drawDoor,
            233,
          ),
        ),
      },
      shadow: texture(drawShadowBlob()),
      fittingRoom: texture(
        cutOut(Math.round(fittingRoom.width * PIXELS_PER_UNIT), 320, drawFittingRoom, 9, 234),
      ),
      rack: texture(cutOut(Math.round(rack.width * PIXELS_PER_UNIT), 240, drawScarfRack, 8, 235)),
      counter: texture(
        cutOut(Math.round(counter.width * PIXELS_PER_UNIT), 160, drawBoutiqueCounter, 9, 236),
      ),
      peahen: blinker(PEAHEN_SIZE.width, PEAHEN_SIZE.height, drawPeahen, 9, 237),
    }),
    [],
  );
  return (
    <>
      <RoomShell walls={BOUTIQUE_WALLS} doorSide="right" textures={textures.room} />
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[
          {
            interaction: 'boutiqueSeller',
            map: textures.peahen.open,
            height: PEAHEN_HEIGHT,
            z: PEAHEN_Z,
          },
        ]}
      />
      <Furniture
        map={textures.fittingRoom}
        x={fittingRoom.x}
        z={-1.2}
        height={3.1}
        shadow={textures.shadow}
      />
      <Furniture map={textures.rack} x={rack.x} z={-1.1} height={2.2} shadow={textures.shadow} />
      <Character
        map={textures.peahen.open}
        blinks={textures.peahen}
        x={BOUTIQUE_SELLER_X}
        z={PEAHEN_Z}
        height={PEAHEN_HEIGHT}
        shadow={textures.shadow}
      />
      <Furniture
        map={textures.counter}
        x={counter.x}
        z={-0.6}
        height={1.1}
        shadow={textures.shadow}
      />
    </>
  );
}
