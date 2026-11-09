import { type RefObject, useMemo } from 'react';
import { RAMEN_CHEF_X, RAMEN_FURNITURE, RAMEN_WALLS } from '@/game/world/side-rooms';
import { drawDoor, drawShadowBlob } from '../art/bedroom';
import { cutOut, paint } from '../art/core';
import {
  drawRamenChef,
  drawRamenCounter,
  drawRamenFloor,
  drawRamenMenu,
  drawRamenPot,
  drawRamenTables,
  drawRamenWall,
  drawRedLantern,
  RAMEN_CHEF_SIZE,
} from '../art/ramen';
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

const RAMEN_CHEF_HEIGHT = 2.6;
const RAMEN_CHEF_Z = -1.1;

// Inside Ramen Yuzu: warm plaster over dark wood, the stockpot steaming in the kitchen, Yuzu behind
// her counter of bowls and stools, the menu on the wall, two tables, and red lanterns overhead.
export function Ramen({ speakerTops }: { speakerTops: RefObject<SpeakerTops> }) {
  const { pot, counter, menu, tables } = RAMEN_FURNITURE;
  const textures = useMemo(
    () => ({
      room: {
        wall: texture(drawRamenWall()),
        floor: texture(drawRamenFloor()),
        door: texture(
          paint(
            Math.round(DOOR_WIDTH * PIXELS_PER_UNIT),
            Math.round(DOOR_HEIGHT * PIXELS_PER_UNIT),
            drawDoor,
            193,
          ),
        ),
      },
      shadow: texture(drawShadowBlob()),
      pot: texture(cutOut(220, 300, drawRamenPot, 8, 194)),
      counter: texture(
        cutOut(Math.round(counter.width * PIXELS_PER_UNIT), 190, drawRamenCounter, 9, 195),
      ),
      menu: texture(cutOut(Math.round(menu.width * PIXELS_PER_UNIT), 120, drawRamenMenu, 7, 196)),
      tables: texture(
        cutOut(Math.round(tables.width * PIXELS_PER_UNIT), 190, drawRamenTables, 8, 197),
      ),
      lantern: texture(cutOut(70, 110, drawRedLantern, 6, 198)),
      chef: blinker(RAMEN_CHEF_SIZE.width, RAMEN_CHEF_SIZE.height, drawRamenChef, 9, 199),
    }),
    [],
  );
  return (
    <>
      <RoomShell walls={RAMEN_WALLS} doorSide="right" textures={textures.room} />
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[
          {
            interaction: 'ramenChef',
            map: textures.chef.open,
            height: RAMEN_CHEF_HEIGHT,
            z: RAMEN_CHEF_Z,
          },
        ]}
      />
      <group position={[menu.x, 2.6, WALL_Z + 0.02]}>
        <CutOut map={textures.menu} height={1.2} />
      </group>
      {[-3.2, 0, 3].map((lanternX) => (
        <group key={lanternX} position={[lanternX, 3.1, WALL_Z + 0.3]}>
          <CutOut map={textures.lantern} height={0.9} />
        </group>
      ))}
      <Furniture map={textures.pot} x={pot.x} z={-1.2} height={2.2} shadow={textures.shadow} />
      <Character
        map={textures.chef.open}
        blinks={textures.chef}
        x={RAMEN_CHEF_X}
        z={RAMEN_CHEF_Z}
        height={RAMEN_CHEF_HEIGHT}
        shadow={textures.shadow}
      />
      <Furniture
        map={textures.counter}
        x={counter.x}
        z={-0.6}
        height={1.35}
        shadow={textures.shadow}
      />
      <Furniture
        map={textures.tables}
        x={tables.x}
        z={-0.9}
        height={1.9}
        shadow={textures.shadow}
      />
    </>
  );
}
