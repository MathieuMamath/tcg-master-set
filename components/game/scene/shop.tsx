// The Card Den, where the raccoon triplets sell boosters.

import { type RefObject, useMemo } from 'react';
import { SHOP_COUNTERS, SHOP_WALLS } from '@/game/world/side-rooms';
import { drawPlanks, drawShadowBlob, drawWallpaper } from '../art/bedroom';
import {
  drawBoosterShelves,
  drawCounter,
  drawRaccoon,
  drawSign,
  RACCOON_SIZE,
  SELLERS,
} from '../art/card-den';
import { cutOut, paint } from '../art/core';
import {
  blinker,
  Character,
  doorTexture,
  Furniture,
  RoomShell,
  type SceneSigns,
  type SpeakerTops,
  SpeakerTopsOf,
  texture,
  useFontsReady,
  WALL_Z,
} from './stage';

const SELLER_HEIGHT = 2.8;
const SELLER_Z = -1;

// The Card Den: shelves of boosters along the back, and a counter for each raccoon, with the
// theme she sells on a sign above her.
export function Shop({
  signs,
  speakerTops,
}: {
  signs: SceneSigns;
  speakerTops: RefObject<SpeakerTops>;
}) {
  const fontsReady = useFontsReady();
  const textures = useMemo(
    () => ({
      room: {
        wall: texture(drawWallpaper('#d9ece3', 'rgb(90 150 125 / 18%)')),
        floor: texture(drawPlanks()),
        door: doorTexture(47),
      },
      shadow: texture(drawShadowBlob()),
      shelves: texture(paint(360, 170, drawBoosterShelves, 48)),
      sellers: SHOP_COUNTERS.map(({ stock }) =>
        blinker(RACCOON_SIZE.width, RACCOON_SIZE.height, drawRaccoon(SELLERS[stock].look), 9, 70),
      ),
      counters: SHOP_COUNTERS.map(({ stock }) =>
        texture(cutOut(260, 150, drawCounter(SELLERS[stock].color), 8, 71)),
      ),
    }),
    [],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const boards = useMemo(
    () =>
      SHOP_COUNTERS.map(({ stock }) =>
        texture(paint(300, 74, drawSign(signs[stock], SELLERS[stock].color), 72)),
      ),
    [fontsReady, signs.latest, signs.thisYear, signs.older],
  );
  return (
    <>
      <RoomShell walls={SHOP_WALLS} doorSide="left" textures={textures.room} />
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={SHOP_COUNTERS.map(({ stock }, index) => ({
          interaction: stock,
          map: textures.sellers[index].open,
          height: SELLER_HEIGHT,
          z: SELLER_Z,
        }))}
      />
      {SHOP_COUNTERS.map(({ stock, x }, index) => (
        <group key={stock}>
          <mesh position={[x, 1.85, WALL_Z + 0.01]}>
            <planeGeometry args={[3.6, 1.7]} />
            <meshBasicMaterial map={textures.shelves} />
          </mesh>
          <mesh position={[x, 3.4, WALL_Z + 0.02]}>
            <planeGeometry args={[2.5, 0.62]} />
            {/* Cut along its rounded corners. */}
            <meshBasicMaterial map={boards[index]} alphaTest={0.5} />
          </mesh>
          <Character
            map={textures.sellers[index].open}
            blinks={textures.sellers[index]}
            // The drawing leaves room for the tail on its right, so it moves right to stay centred.
            x={x + 0.3}
            z={SELLER_Z}
            height={SELLER_HEIGHT}
            shadow={textures.shadow}
          />
          <Furniture
            map={textures.counters[index]}
            x={x}
            z={-0.35}
            height={1.1}
            shadow={textures.shadow}
          />
        </group>
      ))}
    </>
  );
}
