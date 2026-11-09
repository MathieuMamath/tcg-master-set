import { type RefObject, useMemo } from 'react';
import { BOOKSHOP_FURNITURE, BOOKSHOP_SELLER_X, BOOKSHOP_WALLS } from '@/game/world/side-rooms';
import { drawPlanks, drawShadowBlob, drawWallpaper } from '../art/bedroom';
import {
  drawBookPile,
  drawBookWall,
  drawHedgehog,
  drawMagazineRack,
  drawStationeryTable,
  HEDGEHOG_SIZE,
} from '../art/bookshop';
import { cutOut, paint } from '../art/core';
import {
  Character,
  doorTexture,
  Furniture,
  PIXELS_PER_UNIT,
  RoomShell,
  type SpeakerTops,
  SpeakerTopsOf,
  texture,
  WALL_Z,
} from './stage';

const BOOK_WALL = { margin: 0.35, height: 2.95, centerY: 1.95 };
const BOOKSELLER_HEIGHT = 3;
const BOOKSELLER_Z = -0.5;
const BOOK_WALL_WIDTH = BOOKSHOP_WALLS.right - BOOKSHOP_WALLS.left - BOOK_WALL.margin * 2;

// The Page Nook: books from floor to ceiling, a rack of magazines, a table of notebooks and pens,
// and Mamie Noisette in front of her pile of books, with the binders she sells on the shelves behind.
export function Bookshop({ speakerTops }: { speakerTops: RefObject<SpeakerTops> }) {
  const { magazines, pile, table } = BOOKSHOP_FURNITURE;
  const textures = useMemo(() => {
    const pixels = BOOK_WALL_WIDTH * PIXELS_PER_UNIT;
    const sellerOnWall =
      (BOOKSHOP_SELLER_X - BOOKSHOP_WALLS.left - BOOK_WALL.margin) * PIXELS_PER_UNIT;
    return {
      room: {
        wall: texture(drawWallpaper('#f1e2c6', 'rgb(160 110 60 / 16%)')),
        floor: texture(drawPlanks()),
        door: doorTexture(81),
      },
      shadow: texture(drawShadowBlob()),
      books: texture(
        paint(
          pixels,
          BOOK_WALL.height * PIXELS_PER_UNIT,
          drawBookWall({ from: sellerOnWall - 120, to: sellerOnWall + 120 }),
          82,
        ),
      ),
      seller: texture(cutOut(HEDGEHOG_SIZE.width, HEDGEHOG_SIZE.height, drawHedgehog, 9, 83)),
      pile: texture(cutOut(340, 220, drawBookPile, 8, 84)),
      magazines: texture(cutOut(160, 190, drawMagazineRack, 8, 85)),
      table: texture(cutOut(240, 150, drawStationeryTable, 8, 86)),
    };
  }, []);
  return (
    <>
      <RoomShell walls={BOOKSHOP_WALLS} doorSide="left" textures={textures.room} />
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[
          {
            interaction: 'binderSeller',
            map: textures.seller,
            height: BOOKSELLER_HEIGHT,
            z: BOOKSELLER_Z,
          },
        ]}
      />
      <mesh
        position={[
          (BOOKSHOP_WALLS.left + BOOKSHOP_WALLS.right) / 2,
          BOOK_WALL.centerY,
          WALL_Z + 0.01,
        ]}
      >
        <planeGeometry args={[BOOK_WALL_WIDTH, BOOK_WALL.height]} />
        <meshBasicMaterial map={textures.books} />
      </mesh>
      <Furniture
        map={textures.magazines}
        x={magazines.x}
        z={-0.9}
        height={1.95}
        shadow={textures.shadow}
      />
      <Furniture map={textures.pile} x={pile.x} z={-1.2} height={1.6} shadow={textures.shadow} />
      <Character
        map={textures.seller}
        x={BOOKSHOP_SELLER_X}
        z={BOOKSELLER_Z}
        height={BOOKSELLER_HEIGHT}
        shadow={textures.shadow}
      />
      <Furniture map={textures.table} x={table.x} z={-0.8} height={1.6} shadow={textures.shadow} />
    </>
  );
}
