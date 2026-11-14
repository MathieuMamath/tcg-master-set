import { type RefObject, useMemo } from 'react';
import { BAG_SELLER_X, STORE_FURNITURE, STORE_WALLS } from '@/game/world/side-rooms';
import { drawDoor, drawShadowBlob } from '../art/bedroom';
import { cutOut, paint } from '../art/core';
import {
  drawBagShopfront,
  drawClosedShopfront,
  drawKangaroo,
  drawMallLamp,
  drawStoreFloor,
  drawStoreMirror,
  drawStoreWall,
  KANGAROO_SIZE,
} from '../art/store';
import {
  blinker,
  Character,
  CutOut,
  DOOR_HEIGHT,
  DOOR_WIDTH,
  Furniture,
  PIXELS_PER_UNIT,
  RoomShell,
  type SceneSigns,
  type SpeakerTops,
  SpeakerTopsOf,
  texture,
  useFontsReady,
  WALL_Z,
} from './stage';

const KANGAROO_HEIGHT = 3.2;
const KANGAROO_Z = -0.6;
// The shopfronts stand against the back wall, under the upper floor's slab.
const SHOPFRONT_HEIGHT = 2.3;
const SHOPFRONT_Z = WALL_Z + 0.1;

// Inside the Grand Galleries: a bright shopping centre under a glass roof, its back wall lined with
// shopfronts on both floors, pendant lamps, a marble floor, Mme Poche standing in front of her bag
// shop with the cheval mirror beside her, and two shops shuttered until their sellers come.
export function Store({
  signs,
  speakerTops,
}: {
  signs: SceneSigns;
  speakerTops: RefObject<SpeakerTops>;
}) {
  const fontsReady = useFontsReady();
  const { bagShop, mirror, closedShops } = STORE_FURNITURE;
  const textures = useMemo(() => {
    const shopfront = (draw: typeof drawClosedShopfront, seed: number) =>
      texture(
        cutOut(
          Math.round(bagShop.width * PIXELS_PER_UNIT),
          Math.round(SHOPFRONT_HEIGHT * PIXELS_PER_UNIT),
          draw,
          6,
          seed,
        ),
      );
    return {
      room: {
        wall: texture(drawStoreWall()),
        floor: texture(drawStoreFloor()),
        door: texture(
          paint(
            Math.round(DOOR_WIDTH * PIXELS_PER_UNIT),
            Math.round(DOOR_HEIGHT * PIXELS_PER_UNIT),
            drawDoor,
            274,
          ),
        ),
      },
      shadow: texture(drawShadowBlob()),
      mirror: texture(
        cutOut(Math.round(mirror.width * PIXELS_PER_UNIT), 260, drawStoreMirror, 8, 275),
      ),
      closedShop: shopfront(drawClosedShopfront, 277),
      lamp: texture(cutOut(80, 200, drawMallLamp, 6, 279)),
      kangaroo: blinker(KANGAROO_SIZE.width, KANGAROO_SIZE.height, drawKangaroo, 9, 278),
    };
  }, []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const bagShopFront = useMemo(
    () =>
      texture(
        cutOut(
          Math.round(bagShop.width * PIXELS_PER_UNIT),
          Math.round(SHOPFRONT_HEIGHT * PIXELS_PER_UNIT),
          drawBagShopfront(signs.bagShop),
          6,
          276,
        ),
      ),
    [fontsReady, signs.bagShop],
  );
  return (
    <>
      <RoomShell walls={STORE_WALLS} doorSide="both" textures={textures.room} />
      {/* Pendant lamps hanging from the glass roof. */}
      {[-6, -2, 2, 6].map((lampX) => (
        <group key={lampX} position={[lampX, 3.1, WALL_Z + 0.4]}>
          <CutOut map={textures.lamp} height={1.5} />
        </group>
      ))}
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[
          {
            interaction: 'bagSeller',
            map: textures.kangaroo.open,
            height: KANGAROO_HEIGHT,
            z: KANGAROO_Z,
          },
        ]}
      />
      <group position={[bagShop.x, 0, SHOPFRONT_Z]}>
        <CutOut map={bagShopFront} height={SHOPFRONT_HEIGHT} />
      </group>
      {closedShops.map(({ x: shopX }) => (
        <group key={shopX} position={[shopX, 0, SHOPFRONT_Z]}>
          <CutOut map={textures.closedShop} height={SHOPFRONT_HEIGHT} />
        </group>
      ))}
      <Furniture
        map={textures.mirror}
        x={mirror.x}
        z={-0.8}
        height={2.4}
        shadow={textures.shadow}
      />
      <Character
        map={textures.kangaroo.open}
        blinks={textures.kangaroo}
        x={BAG_SELLER_X}
        z={KANGAROO_Z}
        height={KANGAROO_HEIGHT}
        shadow={textures.shadow}
      />
    </>
  );
}
