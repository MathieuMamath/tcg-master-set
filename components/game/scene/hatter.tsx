import { type RefObject, useMemo } from 'react';
import { HATTER_FURNITURE, HATTER_WALLS, HATTER_X } from '@/game/world/side-rooms';
import { drawDoor, drawShadowBlob } from '../art/bedroom';
import { cutOut, paint } from '../art/core';
import {
  drawHatStands,
  drawHatterCounter,
  drawHatterFloor,
  drawHatterMirror,
  drawHatterWall,
  drawWalrus,
  WALRUS_SIZE,
} from '../art/hatter';
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

const WALRUS_HEIGHT = 3.5;
const WALRUS_Z = -1.1;

// Inside Sir Moustache's hat shop: oxblood paper over dark panelling, a herringbone floor, the tall
// mirror against the left wall, two brass stands of hats, and the walrus behind his counter.
export function Hatter({ speakerTops }: { speakerTops: RefObject<SpeakerTops> }) {
  const { mirror, stands, counter } = HATTER_FURNITURE;
  const textures = useMemo(
    () => ({
      room: {
        wall: texture(drawHatterWall()),
        floor: texture(drawHatterFloor()),
        door: texture(
          paint(
            Math.round(DOOR_WIDTH * PIXELS_PER_UNIT),
            Math.round(DOOR_HEIGHT * PIXELS_PER_UNIT),
            drawDoor,
            253,
          ),
        ),
      },
      shadow: texture(drawShadowBlob()),
      mirror: texture(
        cutOut(Math.round(mirror.width * PIXELS_PER_UNIT), 300, drawHatterMirror, 9, 254),
      ),
      stands: texture(
        cutOut(Math.round(stands.width * PIXELS_PER_UNIT), 260, drawHatStands, 8, 255),
      ),
      counter: texture(
        cutOut(Math.round(counter.width * PIXELS_PER_UNIT), 150, drawHatterCounter, 9, 256),
      ),
      walrus: blinker(WALRUS_SIZE.width, WALRUS_SIZE.height, drawWalrus, 9, 257),
    }),
    [],
  );
  return (
    <>
      <RoomShell walls={HATTER_WALLS} doorSide="right" textures={textures.room} />
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[
          {
            interaction: 'hatter',
            map: textures.walrus.open,
            height: WALRUS_HEIGHT,
            z: WALRUS_Z,
          },
        ]}
      />
      <Furniture map={textures.mirror} x={mirror.x} z={-1.2} height={3} shadow={textures.shadow} />
      <Furniture
        map={textures.stands}
        x={stands.x}
        z={-1.1}
        height={2.4}
        shadow={textures.shadow}
      />
      <Character
        map={textures.walrus.open}
        blinks={textures.walrus}
        x={HATTER_X}
        z={WALRUS_Z}
        height={WALRUS_HEIGHT}
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
