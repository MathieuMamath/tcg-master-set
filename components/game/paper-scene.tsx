'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import {
  CanvasTexture,
  DoubleSide,
  type Group,
  type Mesh,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
  Vector3,
} from 'three';
import { type DashState, NO_DASH, tickDash } from '@/game/dash';
import { type Direction, STILL } from '@/game/movement';
import { SCRUBS_PER_STAIN, type Stain, stainAlong } from '@/game/quests';
import {
  ARCADE_MACHINES,
  ARCADE_WALLS,
  BEDROOM,
  BEDROOM_FURNITURE,
  BEDROOM_WALLS,
  BOOKSHOP_FURNITURE,
  BOOKSHOP_SELLER_X,
  BOOKSHOP_WALLS,
  exitAlong,
  FLAT_FURNITURE,
  FLAT_WALLS,
  FLAT_WINDOW_X,
  interactionAlong,
  LEA_X,
  PARK_ENDS,
  PARK_SPOTS,
  SHOP_COUNTERS,
  SHOP_WALLS,
  SIDE_PLACES,
  type SideExit,
  type SidePlaceId,
  type SideRoom,
  speakerAlong,
  TOWN_BUILDINGS,
  TOWN_ENDS,
} from '@/game/side-rooms';
import {
  cameraX as cameraTarget,
  type Facing,
  sidePush,
  stepWalker,
  WALKING_SPEED,
  type Walker,
} from '@/game/side-walk';
import { skyLook } from '@/game/sky';
import type { Interaction } from '@/game/world';
import {
  cutOut,
  drawArcade,
  drawArcadeCabinet,
  drawArcadeCarpet,
  drawArcadeDoor,
  drawBasketballMachine,
  drawBed,
  drawBench,
  drawBigPlant,
  drawBookcase,
  drawBookPile,
  drawBookshop,
  drawBookWall,
  drawBoosterShelves,
  drawBus,
  drawBusShelter,
  drawChair,
  drawClawMachine,
  drawCloud,
  drawCorrugatedEdge,
  drawCounter,
  drawDesk,
  drawDoor,
  drawDust,
  drawFlats,
  drawFrame,
  drawHedgehog,
  drawHills,
  drawHouse,
  drawLake,
  drawLea,
  drawLucas,
  drawMagazineRack,
  drawPapy,
  drawParkGround,
  drawPip,
  drawPlanks,
  drawRaccoon,
  drawReeds,
  drawShadowBlob,
  drawShop,
  drawSign,
  drawSky,
  drawSkyGradient,
  drawSofa,
  drawStationeryTable,
  drawStreet,
  drawTree,
  drawUprightCorrugatedEdge,
  drawWallpaper,
  drawWindowFrame,
  HEDGEHOG_SIZE,
  LEA_SIZE,
  LUCAS_SIZE,
  PAPY_SIZE,
  paint,
  RACCOON_SIZE,
  SELLERS,
  solidTop,
} from './paper-art';
import { createPaperBalls, emitPaperBall, PaperBalls } from './paper-balls';

export type MovementInput = {
  keyboard: Direction;
  joystick: Direction;
  // Set by whoever asks for a dash, and used up by the character.
  wantsDash: boolean;
  // Set by whoever asks to go through the door the character stands at, and used up the same way.
  wantsDoor: boolean;
  // Set by whoever asks to rub the patch of dust the character stands below, and used up the same way.
  wantsScrub: boolean;
  // Set by the bus map to ride to another stop, and used up the same way.
  travelTo: Travel | null;
};

// Going somewhere: through a door, or by bus.
export type Travel = Pick<SideExit, 'to' | 'arrival'>;

// The words painted in the scene, in the player's language.
export type SceneSigns = {
  shop: string;
  bookshop: string;
  arcade: string;
  // The name of the street's bus stop, and the line shown on the bus.
  busStop: string;
  busLine: string;
  // The name of the park's bus stop, on its sign.
  parkStop: string;
  latest: string;
  thisYear: string;
  older: string;
};

const PIP_Z = 1.25;
const PIP_HEIGHT = 1.75;
const LOOK_HEIGHT = 2;
const FIELD_OF_VIEW = 28;
// The width of the world the camera keeps in view, wider on a landscape screen.
const VIEW_WIDTH_WIDE = 11.5;
const VIEW_WIDTH_TALL = 8;
const MIN_CAMERA_DISTANCE = 17;
// A long pause in the tab must not teleport the character.
const MAX_FRAME_SECONDS = 0.05;

const TURN_SECONDS = 0.34;
// The speech bubble floats this far above the top of a character's head.
const BUBBLE_GAP = 0.12;

// The top of each character the player can talk to here, measured from its drawing, so that the
// speech bubble sits just above it whatever its size.
type SpeakerTops = Partial<Record<Interaction, { y: number; z: number }>>;
const WALK_BOUNCE = 0.14;
const BALL_INTERVAL_SECONDS = 0.05;
const FIRST_BALLS = 3;

function texture(canvas: HTMLCanvasElement): Texture {
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

// Overshoots a little before settling, like a sheet of card flipped by hand.
function easeBack(progress: number): number {
  const overshoot = 1.70158;
  return 1 + (overshoot + 1) * (progress - 1) ** 3 + overshoot * (progress - 1) ** 2;
}

// A flat cut-out standing on the ground. Its only shadow is the one on the ground below it.
function CutOut({ map, height, width }: { map: Texture; height: number; width?: number }) {
  const image = map.image as HTMLCanvasElement;
  const shownWidth = width ?? (height * image.width) / image.height;
  return (
    <mesh position={[0, height / 2, 0]}>
      <planeGeometry args={[shownWidth, height]} />
      <meshBasicMaterial map={map} alphaTest={0.5} side={DoubleSide} />
    </mesh>
  );
}

const WALL_Z = -1.6;
const WALL_HEIGHT = 4.2;
const FRONT_Z = 2.6;
const ROOM_DEPTH = FRONT_Z - WALL_Z;
const WALL_THICKNESS = 0.16;
// Paper drawn at this many pixels for one unit of the world, to keep every drawing to scale.
const PIXELS_PER_UNIT = 100;

const DOOR_Z = 0.7;
const DOOR_HEIGHT = 2.6;
const DOOR_WIDTH = 1.9;

const WINDOW = { x: 0.6, centerY: 2.75, width: 300, height: 200 };
const WINDOW_FRAME = 14;
const WINDOW_SILL = 16;
const WINDOW_MARGIN = 13;
// The sky shows this share of its picture at once, so that its clouds have room to drift.
const SKY_SHOWN = 0.45;

// A double window over the desk, onto a sky that will one day follow the time and the weather.
function SkyWindow({ x }: { x: number }) {
  const look = skyLook('day', 'fewClouds');
  const sky = useMemo(() => {
    const map = texture(drawSky(look));
    map.wrapS = RepeatWrapping;
    map.repeat.set(SKY_SHOWN, 1);
    return map;
  }, [look]);
  const frame = useMemo(
    () => texture(cutOut(WINDOW.width, WINDOW.height, drawWindowFrame, 9, 51)),
    [],
  );

  useFrame((_, delta) => {
    sky.offset.x = (sky.offset.x + delta * look.drift) % 1;
  });

  const frameHeight = (WINDOW.height + WINDOW_MARGIN * 2) / PIXELS_PER_UNIT;
  const openingWidth = (WINDOW.width - WINDOW_FRAME * 2) / PIXELS_PER_UNIT;
  const openingHeight = (WINDOW.height - WINDOW_SILL - WINDOW_FRAME * 2) / PIXELS_PER_UNIT;
  const openingCenterY = WINDOW.centerY + WINDOW_SILL / 2 / PIXELS_PER_UNIT;
  return (
    <>
      <mesh position={[x, openingCenterY, WALL_Z + 0.01]}>
        <planeGeometry args={[openingWidth, openingHeight]} />
        <meshBasicMaterial map={sky} />
      </mesh>
      {/* Light on the glass. */}
      <mesh position={[x, openingCenterY, WALL_Z + 0.02]} rotation={[0, 0, -0.5]}>
        <planeGeometry args={[0.18, openingHeight * 1.1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <group position={[x, WINDOW.centerY - frameHeight / 2, WALL_Z + 0.03]}>
        <CutOut map={frame} height={frameHeight} />
      </group>
    </>
  );
}

// A soft shadow on the floor under a piece of furniture.
function FloorShadow({ x, z, width, map }: { x: number; z: number; width: number; map: Texture }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, z + 0.15]}>
      <planeGeometry args={[width * 1.15, 0.7]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} />
    </mesh>
  );
}

// A piece of furniture: a cut-out standing in the room, with its shadow on the floor.
function Furniture({
  map,
  x,
  z,
  height,
  shadow,
}: {
  map: Texture;
  x: number;
  z: number;
  height: number;
  shadow: Texture;
}) {
  const image = map.image as HTMLCanvasElement;
  return (
    <>
      <group position={[x, 0, z]}>
        <CutOut map={map} height={height} />
      </group>
      <FloorShadow x={x} z={z} width={(height * image.width) / image.height} map={shadow} />
    </>
  );
}

type RoomTextures = { wall: Texture; floor: Texture; door: Texture };

// A room as a box of card open towards the camera: wallpaper behind, a floor below, side walls of
// thick cardboard, and the door painted flat on one of them.
function RoomShell({
  walls,
  doorSide,
  textures,
}: {
  walls: { left: number; right: number };
  doorSide: 'left' | 'right';
  textures: RoomTextures;
}) {
  const edges = useMemo(
    () => ({
      front: texture(drawCorrugatedEdge()),
      upright: texture(drawUprightCorrugatedEdge(112)),
    }),
    [],
  );
  const width = walls.right - walls.left;
  const centerX = (walls.left + walls.right) / 2;
  const doorSign = doorSide === 'right' ? 1 : -1;
  return (
    <>
      <mesh position={[centerX, WALL_HEIGHT / 2, WALL_Z]}>
        <planeGeometry args={[width, WALL_HEIGHT]} />
        <meshBasicMaterial map={textures.wall} />
      </mesh>
      {[-1, 1].map((side) => (
        // A wall of thick cardboard: wallpaper inside, its corrugated cut edge facing the camera.
        <mesh
          key={side}
          position={[
            (side > 0 ? walls.right : walls.left) + (side * WALL_THICKNESS) / 2,
            WALL_HEIGHT / 2,
            WALL_Z + ROOM_DEPTH / 2,
          ]}
        >
          <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_DEPTH]} />
          {[0, 1, 2, 3, 4, 5].map((face) => (
            <meshBasicMaterial
              key={face}
              attach={`material-${face}`}
              {...(face === (side > 0 ? 1 : 0)
                ? { map: textures.wall, color: '#d8c7ab' }
                : face === 4
                  ? { map: edges.upright }
                  : { color: '#b88b55' })}
            />
          ))}
        </mesh>
      ))}
      <mesh
        position={[
          (doorSide === 'right' ? walls.right : walls.left) - doorSign * 0.01,
          DOOR_HEIGHT / 2,
          DOOR_Z,
        ]}
        rotation={[0, -doorSign * (Math.PI / 2), 0]}
      >
        <planeGeometry args={[DOOR_WIDTH, DOOR_HEIGHT]} />
        <meshBasicMaterial map={textures.door} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, WALL_Z + ROOM_DEPTH / 2]}>
        <planeGeometry args={[width, ROOM_DEPTH]} />
        <meshBasicMaterial map={textures.floor} />
      </mesh>
      <mesh position={[centerX, -0.18, FRONT_Z]}>
        <boxGeometry args={[width + 0.3, 0.36, 0.14]} />
        <meshBasicMaterial map={edges.front} />
      </mesh>
    </>
  );
}

function doorTexture(seed: number): Texture {
  return texture(
    paint(
      Math.round(DOOR_WIDTH * PIXELS_PER_UNIT),
      Math.round(DOOR_HEIGHT * PIXELS_PER_UNIT),
      drawDoor,
      seed,
    ),
  );
}

// The bedroom: the bed against the left wall, the desk under the window, the bookcase and a plant,
// and the door out in the right wall.
function Bedroom() {
  const textures = useMemo(
    () => ({
      room: { wall: texture(drawWallpaper()), floor: texture(drawPlanks()), door: doorTexture(46) },
      shadow: texture(drawShadowBlob()),
      bed: texture(cutOut(320, 140, drawBed, 9, 41)),
      bookcase: texture(cutOut(170, 230, drawBookcase, 9, 42)),
      plant: texture(cutOut(240, 330, drawBigPlant, 9, 45)),
      desk: texture(cutOut(230, 128, drawDesk, 9, 43)),
      chair: texture(cutOut(95, 150, drawChair, 8, 44)),
    }),
    [],
  );
  const { bed, desk, chair, bookcase, plant } = BEDROOM_FURNITURE;
  return (
    <>
      <RoomShell walls={BEDROOM_WALLS} doorSide="right" textures={textures.room} />
      <SkyWindow x={WINDOW.x} />
      <Furniture
        map={textures.bookcase}
        x={bookcase.x}
        z={-1.3}
        height={2.51}
        shadow={textures.shadow}
      />
      <Furniture map={textures.plant} x={plant.x} z={-1.05} height={3.1} shadow={textures.shadow} />
      <Furniture map={textures.bed} x={bed.x} z={-0.7} height={1.5} shadow={textures.shadow} />
      <Furniture map={textures.desk} x={desk.x} z={-1.15} height={1.42} shadow={textures.shadow} />
      <Furniture map={textures.chair} x={chair.x} z={-0.45} height={1.4} shadow={textures.shadow} />
    </>
  );
}

const SELLER_HEIGHT = 2.8;
const SELLER_Z = -1;

// Records where the top of each character's drawing is, for its speech bubble.
function SpeakerTopsOf({
  speakerTops,
  speakers,
}: {
  speakerTops: RefObject<SpeakerTops>;
  speakers: { interaction: Interaction; map: Texture; height: number; z: number }[];
}) {
  useEffect(() => {
    for (const { interaction, map, height, z } of speakers) {
      speakerTops.current[interaction] = {
        y: height * (1 - solidTop(map.image as HTMLCanvasElement)),
        z,
      };
    }
  }, [speakerTops, speakers]);
  return null;
}

// The Card Den: shelves of boosters along the back, and a counter for each raccoon, with the
// theme she sells on a sign above her.
function Shop({ signs, speakerTops }: { signs: SceneSigns; speakerTops: RefObject<SpeakerTops> }) {
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
        texture(
          cutOut(RACCOON_SIZE.width, RACCOON_SIZE.height, drawRaccoon(SELLERS[stock].look), 9, 70),
        ),
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
          map: textures.sellers[index],
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
          <Furniture
            map={textures.sellers[index]}
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

const BOOK_WALL = { margin: 0.35, height: 2.95, centerY: 1.95 };
const BOOKSELLER_HEIGHT = 3;
const BOOKSELLER_Z = -0.5;
const BOOK_WALL_WIDTH = BOOKSHOP_WALLS.right - BOOKSHOP_WALLS.left - BOOK_WALL.margin * 2;

// The Page Nook: books from floor to ceiling, a rack of magazines, a table of notebooks and pens,
// and Mamie Noisette in front of her pile of books, with the binders she sells on the shelves behind.
function Bookshop({ speakerTops }: { speakerTops: RefObject<SpeakerTops> }) {
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
      <Furniture
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

const LEA_HEIGHT = 3.5;
const LEA_Z = -0.6;
const DUST_SIZE = { width: 0.95, height: 0.75 };

// Léa's flat: a shelf, a sofa under pictures, a window, and Léa at her desk. During her quest,
// patches of dust cover the wall, fading with each rub.
function Flat({
  speakerTops,
  stains,
}: {
  speakerTops: RefObject<SpeakerTops>;
  stains: readonly Stain[];
}) {
  const { shelf, sofa } = FLAT_FURNITURE;
  const textures = useMemo(
    () => ({
      room: {
        wall: texture(drawWallpaper('#f3e4ee', 'rgb(190 120 160 / 14%)')),
        floor: texture(drawPlanks()),
        door: doorTexture(91),
      },
      shadow: texture(drawShadowBlob()),
      lea: texture(cutOut(LEA_SIZE.width, LEA_SIZE.height, drawLea, 9, 92)),
      shelf: texture(cutOut(170, 230, drawBookcase, 9, 93)),
      sofa: texture(cutOut(300, 150, drawSofa, 9, 94)),
      frames: ['#78ae6c', '#9a7bd6'].map((color, index) =>
        texture(cutOut(90, 70, drawFrame(color), 6, 95 + index)),
      ),
      dust: texture(paint(120, 95, drawDust, 97)),
    }),
    [],
  );
  return (
    <>
      <RoomShell walls={FLAT_WALLS} doorSide="left" textures={textures.room} />
      <SkyWindow x={FLAT_WINDOW_X} />
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[{ interaction: 'grandma', map: textures.lea, height: LEA_HEIGHT, z: LEA_Z }]}
      />
      {/* Pictures high on the wall, above Léa's head. */}
      {textures.frames.map((map, index) => (
        <group
          key={map.id}
          position={[LEA_X - 1.6 + index * 0.95, 3.25 + index * 0.15, WALL_Z + 0.02]}
        >
          <CutOut map={map} height={0.7} />
        </group>
      ))}
      {stains.map(({ id, x, height, scrubsLeft }) => (
        <mesh key={id} position={[x, height, WALL_Z + 0.05]}>
          <planeGeometry args={[DUST_SIZE.width, DUST_SIZE.height]} />
          <meshBasicMaterial
            map={textures.dust}
            transparent
            depthWrite={false}
            opacity={0.35 + (0.65 * scrubsLeft) / SCRUBS_PER_STAIN}
          />
        </mesh>
      ))}
      <Furniture map={textures.shelf} x={shelf.x} z={-1.3} height={2.51} shadow={textures.shadow} />
      <Furniture map={textures.sofa} x={sofa.x} z={-1} height={1.45} shadow={textures.shadow} />
      <Furniture
        map={textures.lea}
        x={LEA_X}
        z={LEA_Z}
        height={LEA_HEIGHT}
        shadow={textures.shadow}
      />
    </>
  );
}

const MACHINES_Z = -1.1;
const NEON_STRIPS = [
  { y: 3.7, color: '#ff4fa3' },
  { y: 3.55, color: '#4fd8ff' },
];

// The arcade: neon strips along a dark wall, a carpet of bright shapes, and a row of machines, of
// which only the basketball one can be played.
function Arcade() {
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

const STREET_FRONT_Z = 3;
// The clouds drift across the whole street, from one end of this span to the other, around its
// middle.
const CLOUD_SPAN = 84;
const CLOUD_SPEED = 25;
const CLOUDS = [
  { x: -36, y: 5.8, size: 1.3 },
  { x: -22, y: 6.6, size: 1.6 },
  { x: -8, y: 5.6, size: 1.2 },
  { x: 6, y: 6.9, size: 1.5 },
  { x: 20, y: 6, size: 1.3 },
  { x: 34, y: 6.8, size: 1.1 },
];
const BUILDINGS_Z = -1.4;
const HILL_ROWS = [
  { z: -7, color: '#9cc6a6', hatch: '#6e9e7a', bumps: 7, height: 3.6, seed: 1 },
  { z: -5.5, color: '#78ae6c', hatch: '#4e8448', bumps: 8, height: 2.8, seed: 2 },
  { z: -4, color: '#579552', hatch: '#3b7238', bumps: 9, height: 1.8, seed: 3 },
];

// The street: a wide sky, rows of hills, our house, the shop and the bookshop.
function Town({ signs }: { signs: SceneSigns }) {
  const look = skyLook('day', 'fewClouds');
  const fontsReady = useFontsReady();
  const textures = useMemo(
    () => ({
      street: texture(drawStreet()),
      edge: texture(drawCorrugatedEdge()),
      shadow: texture(drawShadowBlob()),
      house: texture(cutOut(420, 380, drawHouse, 9, 61)),
      flats: texture(cutOut(440, 420, drawFlats, 9, 65)),
      hills: HILL_ROWS.map(({ color, hatch, bumps, seed, height }) =>
        texture(
          cutOut(1600, Math.round(height * 100), drawHills(color, hatch, bumps, seed), 8, seed),
        ),
      ),
    }),
    [],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const shop = useMemo(
    () => texture(cutOut(480, 380, drawShop(signs.shop), 9, 62)),
    [fontsReady, signs.shop],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const bookshop = useMemo(
    () => texture(cutOut(480, 380, drawBookshop(signs.bookshop), 9, 64)),
    [fontsReady, signs.bookshop],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const arcade = useMemo(
    () => texture(cutOut(500, 400, drawArcade(signs.arcade), 9, 66)),
    [fontsReady, signs.arcade],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const busTextures = useMemo(
    () => ({
      shelter: texture(cutOut(360, 320, drawBusShelter(signs.busStop), 9, 67)),
      bus: texture(cutOut(560, 250, drawBus(signs.busLine), 9, 68)),
    }),
    [fontsReady, signs.busStop, signs.busLine],
  );
  const idlingBus = useRef<Group>(null);
  const sky = useMemo(() => texture(drawSkyGradient(look)), [look]);
  const cloud = useMemo(() => texture(cutOut(300, 150, drawCloud(look.cloud), 9, 63)), [look]);
  const clouds = useRef<(Group | null)[]>([]);

  // The clouds drift along, and come back round from the other side. The bus shakes a little,
  // its engine running while it waits.
  useFrame(({ clock }, delta) => {
    if (idlingBus.current) {
      idlingBus.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 18)) * 0.012;
    }
    for (const group of clouds.current) {
      if (group) {
        group.position.x += delta * look.drift * CLOUD_SPEED;
        if (group.position.x > CLOUD_SPAN / 2) {
          group.position.x -= CLOUD_SPAN;
        }
      }
    }
  });

  const {
    flats,
    house,
    shop: shopPlace,
    bookshop: bookshopPlace,
    arcade: arcadePlace,
    busStop,
    bus,
  } = TOWN_BUILDINGS;
  const streetWidth = TOWN_ENDS.right - TOWN_ENDS.left + 20;
  const streetCenter = (TOWN_ENDS.left + TOWN_ENDS.right) / 2;
  return (
    <>
      {/* Wider than the street, as far away it fills more of the view at both ends. */}
      <mesh position={[streetCenter, 7, -10]}>
        <planeGeometry args={[streetWidth + 70, 26]} />
        <meshBasicMaterial map={sky} />
      </mesh>
      <group position={[streetCenter, 0, 0]}>
        {CLOUDS.slice(0, look.cloudCount + 2).map(({ x, y, size }, index) => (
          <group
            key={x}
            ref={(group) => {
              clouds.current[index] = group;
            }}
            position={[x, y, -8]}
          >
            <CutOut map={cloud} height={size} />
          </group>
        ))}
      </group>
      {HILL_ROWS.map(({ z, height }, index) => (
        <group key={z} position={[streetCenter, -0.15, z]}>
          <CutOut
            map={textures.hills[index]}
            height={(height * 100 + 24) / 100}
            width={streetWidth + 30}
          />
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[streetCenter, 0, -1]}>
        <planeGeometry args={[streetWidth, 8]} />
        <meshBasicMaterial map={textures.street} />
      </mesh>
      <mesh position={[streetCenter, -0.18, STREET_FRONT_Z]}>
        <boxGeometry args={[streetWidth, 0.36, 0.14]} />
        <meshBasicMaterial map={textures.edge} />
      </mesh>
      <Furniture
        map={textures.flats}
        x={flats.x}
        z={BUILDINGS_Z}
        height={4.5}
        shadow={textures.shadow}
      />
      <Furniture
        map={textures.house}
        x={house.x}
        z={BUILDINGS_Z}
        height={4.06}
        shadow={textures.shadow}
      />
      <Furniture
        map={shop}
        x={shopPlace.x}
        z={BUILDINGS_Z}
        height={4.06}
        shadow={textures.shadow}
      />
      <Furniture
        map={busTextures.shelter}
        x={busStop.x}
        z={-0.7}
        height={3}
        shadow={textures.shadow}
      />
      <group ref={idlingBus}>
        <Furniture map={busTextures.bus} x={bus.x} z={-0.2} height={2.6} shadow={textures.shadow} />
      </group>
      <Furniture
        map={arcade}
        x={arcadePlace.x}
        z={BUILDINGS_Z}
        height={4.2}
        shadow={textures.shadow}
      />
      <Furniture
        map={bookshop}
        x={bookshopPlace.x}
        z={BUILDINGS_Z}
        height={4.06}
        shadow={textures.shadow}
      />
    </>
  );
}

const PARK_TREES = [
  { x: -9.2, z: -3, height: 4.2, seed: 1 },
  { x: -4.6, z: -2.6, height: 3.6, seed: 2 },
  { x: 1.8, z: -2.8, height: 4, seed: 3 },
  { x: 3.6, z: -3.4, height: 3.4, seed: 4 },
  { x: 12.2, z: -3.6, height: 4.4, seed: 5 },
];
const PAPY_HEIGHT = 2.9;
const LUCAS_HEIGHT = 2.6;
const PARK_PEOPLE_Z = -0.5;

// The Linden Park: lawns and trees under the sky, the bus stop on the left, Papy Caillou by his
// bench, and Lucas fishing at the edge of the lake.
function Park({ signs, speakerTops }: { signs: SceneSigns; speakerTops: RefObject<SpeakerTops> }) {
  const look = skyLook('day', 'fewClouds');
  const fontsReady = useFontsReady();
  const { busStop, bench, papy, lake, lucas } = PARK_SPOTS;
  const textures = useMemo(
    () => ({
      sky: texture(drawSkyGradient(look)),
      cloud: texture(cutOut(300, 150, drawCloud(look.cloud), 9, 63)),
      ground: texture(drawParkGround()),
      lake: texture(drawLake()),
      edge: texture(drawCorrugatedEdge()),
      shadow: texture(drawShadowBlob()),
      hills: HILL_ROWS.map(({ color, hatch, bumps, seed, height }) =>
        texture(
          cutOut(1600, Math.round(height * 100), drawHills(color, hatch, bumps, seed), 8, seed),
        ),
      ),
      trees: PARK_TREES.map(({ seed }) => texture(cutOut(240, 320, drawTree(seed), 9, 110 + seed))),
      bench: texture(cutOut(260, 150, drawBench, 8, 116)),
      reeds: texture(cutOut(220, 110, drawReeds, 6, 117)),
      papy: texture(cutOut(PAPY_SIZE.width, PAPY_SIZE.height, drawPapy, 9, 118)),
      lucas: texture(cutOut(LUCAS_SIZE.width, LUCAS_SIZE.height, drawLucas, 9, 119)),
    }),
    [look],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const shelter = useMemo(
    () => texture(cutOut(360, 320, drawBusShelter(signs.parkStop), 9, 120)),
    [fontsReady, signs.parkStop],
  );
  const width = PARK_ENDS.right - PARK_ENDS.left + 20;
  const center = (PARK_ENDS.left + PARK_ENDS.right) / 2;
  const lakeWidth = lake.right - lake.left;
  return (
    <>
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[
          { interaction: 'grandpa', map: textures.papy, height: PAPY_HEIGHT, z: PARK_PEOPLE_Z },
          { interaction: 'boy', map: textures.lucas, height: LUCAS_HEIGHT, z: PARK_PEOPLE_Z },
        ]}
      />
      <mesh position={[center, 7, -10]}>
        <planeGeometry args={[width + 70, 26]} />
        <meshBasicMaterial map={textures.sky} />
      </mesh>
      {[
        [-12, 6.2, 1.4],
        [2, 6.8, 1.6],
        [16, 5.9, 1.2],
      ].map(([cloudX, cloudY, size]) => (
        <group key={cloudX} position={[center + cloudX, cloudY, -8]}>
          <CutOut map={textures.cloud} height={size} />
        </group>
      ))}
      {HILL_ROWS.map(({ z, height }, index) => (
        <group key={z} position={[center, -0.15, z]}>
          <CutOut
            map={textures.hills[index]}
            height={(height * 100 + 24) / 100}
            width={width + 30}
          />
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center, 0, -1]}>
        <planeGeometry args={[width, 8]} />
        <meshBasicMaterial map={textures.ground} />
      </mesh>
      {/* The lake, lying behind the path, a little above the lawn so that it covers it. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(lake.left + lake.right) / 2, 0.01, -2.4]}>
        <planeGeometry args={[lakeWidth, 4.4]} />
        <meshBasicMaterial map={textures.lake} />
      </mesh>
      <mesh position={[center, -0.18, STREET_FRONT_Z]}>
        <boxGeometry args={[width, 0.36, 0.14]} />
        <meshBasicMaterial map={textures.edge} />
      </mesh>
      {PARK_TREES.map(({ x, z, height }, index) => (
        <Furniture
          key={x}
          map={textures.trees[index]}
          x={x}
          z={z}
          height={height}
          shadow={textures.shadow}
        />
      ))}
      <Furniture map={shelter} x={busStop.x} z={-0.7} height={3} shadow={textures.shadow} />
      <Furniture map={textures.bench} x={bench.x} z={-1.1} height={1.4} shadow={textures.shadow} />
      <Furniture
        map={textures.papy}
        // The drawing leaves room for the cane on its right, so it moves right to stay centred.
        x={papy.x + 0.25}
        z={PARK_PEOPLE_Z}
        height={PAPY_HEIGHT}
        shadow={textures.shadow}
      />
      <group position={[lake.left + 0.6, 0, -0.3]}>
        <CutOut map={textures.reeds} height={1.1} />
      </group>
      <group position={[lake.right - 0.8, 0, -0.3]}>
        <CutOut map={textures.reeds} height={1.2} />
      </group>
      <Furniture
        // The drawing leaves room for the rod on its right, so it moves right to stay centred.
        map={textures.lucas}
        x={lucas.x + 0.7}
        z={PARK_PEOPLE_Z}
        height={LUCAS_HEIGHT}
        shadow={textures.shadow}
      />
    </>
  );
}

// The drawings with text wait for the game's fonts, or they would be drawn in a fallback font.
function useFontsReady(): boolean {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    Promise.all(
      ['48px "Bagel Fat One"', '20px "Patrick Hand"'].map((font) => document.fonts.load(font)),
    ).then(() => setIsReady(true));
  }, []);
  return isReady;
}

function Pip({
  input,
  room,
  arrival,
  bubble,
  speakerTops,
  stains,
  onInteractionChange,
  onExit,
  onScrub,
}: {
  input: RefObject<MovementInput>;
  room: SideRoom;
  arrival: { x: number; facing: Facing };
  bubble: RefObject<HTMLElement | null>;
  speakerTops: RefObject<SpeakerTops>;
  // The patches of dust on this place's walls, during Léa's quest.
  stains: readonly Stain[];
  onInteractionChange: (interaction: Interaction | null) => void;
  onExit: (travel: Travel) => void;
  onScrub: (id: number) => void;
}) {
  const pip = useMemo(() => texture(cutOut(240, 300, drawPip, 10, 21)), []);
  const blob = useMemo(() => texture(drawShadowBlob()), []);
  const root = useRef<Group>(null);
  const flipper = useRef<Group>(null);
  const bouncer = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const walker = useRef<Walker>({ x: arrival.x, velocity: 0, facing: arrival.facing });
  // Undefined until the first frame, which always tells the game what can be done here.
  const interaction = useRef<Interaction | null | undefined>(undefined);
  const hasPlacedCamera = useRef(false);
  const bubbleSpot = useMemo(() => new Vector3(), []);
  const dash = useRef<DashState>(NO_DASH);
  const turn = useRef({
    from: arrival.facing > 0 ? 0 : Math.PI,
    to: arrival.facing > 0 ? 0 : Math.PI,
    elapsed: TURN_SECONDS,
  });
  const walk = useRef({ phase: 0, time: 0, sinceBall: 0 });
  const balls = useRef(createPaperBalls());
  const { camera, size } = useThree();

  useFrame((_, frameDelta) => {
    const delta = Math.min(frameDelta, MAX_FRAME_SECONDS);
    const { keyboard, joystick } = input.current;
    const pushed = keyboard.x !== 0 || keyboard.z !== 0 ? keyboard : joystick;
    const wasDashing = dash.current.remaining > 0;
    dash.current = tickDash(dash.current, input.current.wantsDash, delta);
    input.current.wantsDash = false;
    const isDashing = dash.current.remaining > 0;

    const previous = walker.current;
    walker.current = stepWalker(previous, sidePush(pushed ?? STILL), isDashing, delta, room.bounds);
    const { x, velocity, facing } = walker.current;

    // During Léa's quest, a patch of dust overhead comes before anything else.
    const stain = stainAlong(stains, x);
    const reached = stain ? 'scrub' : interactionAlong(room, x);
    if (reached !== interaction.current) {
      interaction.current = reached;
      onInteractionChange(reached);
    }
    const exit = input.current.wantsDoor ? exitAlong(room, x) : null;
    input.current.wantsDoor = false;
    if (input.current.wantsScrub && stain) {
      onScrub(stain.id);
      for (let ball = 0; ball < 4; ball++) {
        emitPaperBall(balls.current, stain.x, PIP_Z - 0.4, ball % 2 === 0 ? 1 : -1);
      }
    }
    input.current.wantsScrub = false;
    const travel = exit ?? input.current.travelTo;
    input.current.travelTo = null;
    if (travel) {
      onExit(travel);
    }

    // Turning round flips the cut-out like a card.
    if (facing !== previous.facing) {
      turn.current = {
        from: flipper.current?.rotation.y ?? 0,
        to: facing > 0 ? 0 : Math.PI,
        elapsed: 0,
      };
    }
    turn.current.elapsed = Math.min(turn.current.elapsed + delta, TURN_SECONDS);
    const turnProgress = easeBack(turn.current.elapsed / TURN_SECONDS);

    const isWalking = Math.abs(velocity) > WALKING_SPEED;
    walk.current.time += delta;
    if (isWalking) {
      walk.current.phase += delta * 13;
    }
    const bounce = isWalking ? Math.abs(Math.sin(walk.current.phase)) * WALK_BOUNCE : 0;

    if (isDashing) {
      walk.current.sinceBall += delta;
      const count = wasDashing
        ? Math.floor(walk.current.sinceBall / BALL_INTERVAL_SECONDS)
        : FIRST_BALLS;
      if (count > 0) {
        walk.current.sinceBall = 0;
      }
      for (let ball = 0; ball < count; ball++) {
        emitPaperBall(balls.current, x - facing * 0.45, PIP_Z, facing);
      }
    }

    if (root.current && flipper.current && bouncer.current) {
      root.current.position.x = x;
      flipper.current.rotation.y =
        turn.current.from + (turn.current.to - turn.current.from) * turnProgress;
      bouncer.current.position.y = bounce;
      bouncer.current.scale.y = isWalking
        ? 1 - Math.abs(Math.cos(walk.current.phase)) * 0.05
        : 1 + Math.sin(walk.current.time * 2.4) * 0.016;
      bouncer.current.rotation.z = isWalking ? Math.sin(walk.current.phase) * 0.05 : 0;
      // Leaning into a dash.
      bouncer.current.rotation.z += isDashing ? -0.12 : 0;
    }
    if (shadow.current) {
      shadow.current.position.x = x;
      shadow.current.scale.set(1.5 * (1 - bounce * 0.8), 0.7 * (1 - bounce * 0.8), 1);
    }

    // The camera follows from afar, far enough to keep the stage's width in view.
    const aspect = size.width / size.height;
    const halfAngle = Math.tan(((FIELD_OF_VIEW / 2) * Math.PI) / 180);
    const viewWidth = aspect < 1 ? VIEW_WIDTH_TALL : VIEW_WIDTH_WIDE;
    const distance = Math.max(MIN_CAMERA_DISTANCE, viewWidth / 2 / (halfAngle * aspect));
    // On arriving somewhere, the camera starts where it belongs rather than sliding there.
    const target = cameraTarget(room.bounds, x, viewWidth);
    const cameraX = hasPlacedCamera.current
      ? camera.position.x + (target - camera.position.x) * Math.min(1, delta * 3)
      : target;
    hasPlacedCamera.current = true;
    camera.position.set(cameraX, LOOK_HEIGHT + distance * 0.1, distance);
    camera.lookAt(cameraX, LOOK_HEIGHT, 0);
    camera.updateMatrixWorld();

    // The speech bubble floats just above the head of the character the player can talk to.
    const speaker = speakerAlong(room, x);
    const head = speaker && speakerTops.current[speaker.interaction];
    if (speaker && head && bubble.current) {
      bubbleSpot.set(speaker.x, head.y + BUBBLE_GAP, head.z).project(camera);
      const left = ((bubbleSpot.x + 1) / 2) * size.width;
      const top = ((1 - bubbleSpot.y) / 2) * size.height;
      bubble.current.style.transform = `translate(${left}px, ${top}px) translate(-50%, -100%)`;
    }
  });

  return (
    <>
      <group ref={root} position={[0, 0, PIP_Z]}>
        <group ref={flipper}>
          <group ref={bouncer} position={[0, -0.06, 0]}>
            <CutOut map={pip} height={PIP_HEIGHT} />
          </group>
        </group>
      </group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, PIP_Z]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={blob} transparent depthWrite={false} />
      </mesh>
      <PaperBalls balls={balls} />
    </>
  );
}

type Props = {
  input: RefObject<MovementInput>;
  webglUnavailable: string;
  signs: SceneSigns;
  // The speech bubble offering what the player can do, which the scene moves over its place.
  bubble: RefObject<HTMLElement | null>;
  stains: readonly Stain[];
  onInteractionChange: (interaction: Interaction | null) => void;
  onScrub: (id: number) => void;
  // Told whenever the character goes through a door, with the place it arrives in.
  onPlaceChange: (place: SidePlaceId) => void;
};

// Matches the duration-300 class on the overlay.
const FADE_MILLISECONDS = 300;

// The paper world, seen from the side. Every visit starts afresh, so that the character arrives
// at the door it came through.
export function PaperScene({
  input,
  webglUnavailable,
  signs,
  bubble,
  stains,
  onInteractionChange,
  onScrub,
  onPlaceChange,
}: Props) {
  const [visit, setVisit] = useState<{
    number: number;
    place: SidePlaceId;
    arrival: { x: number; facing: Facing };
  }>({ number: 0, place: 'bedroom', arrival: { x: BEDROOM.start, facing: 1 } });
  const [isFading, setIsFading] = useState(false);
  const speakerTops = useRef<SpeakerTops>({});
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(fadeTimer.current), []);

  const goThrough = (exit: Travel) => {
    if (isFading) {
      return;
    }
    setIsFading(true);
    onInteractionChange(null);
    fadeTimer.current = setTimeout(() => {
      setVisit(({ number }) => ({ number: number + 1, place: exit.to, arrival: exit.arrival }));
      setIsFading(false);
      onPlaceChange(exit.to);
    }, FADE_MILLISECONDS);
  };

  return (
    <>
      <Canvas
        camera={{
          fov: FIELD_OF_VIEW,
          near: 0.1,
          far: 200,
          position: [0, 3.7, MIN_CAMERA_DISTANCE],
        }}
        dpr={[1, 2]}
        // The drawings keep their own colours, without the tone mapping meant for lit 3D scenes.
        flat
        fallback={<p className="p-4 text-center">{webglUnavailable}</p>}
      >
        <ambientLight intensity={1.6} color="#fff4e4" />
        <directionalLight position={[-4, 8, 10]} intensity={1.2} />
        <group key={visit.number}>
          {visit.place === 'bedroom' && <Bedroom />}
          {visit.place === 'town' && <Town signs={signs} />}
          {visit.place === 'shop' && <Shop signs={signs} speakerTops={speakerTops} />}
          {visit.place === 'bookshop' && <Bookshop speakerTops={speakerTops} />}
          {visit.place === 'flat' && <Flat speakerTops={speakerTops} stains={stains} />}
          {visit.place === 'arcade' && <Arcade />}
          {visit.place === 'park' && <Park signs={signs} speakerTops={speakerTops} />}
          <Pip
            input={input}
            room={SIDE_PLACES[visit.place]}
            arrival={visit.arrival}
            bubble={bubble}
            speakerTops={speakerTops}
            stains={visit.place === 'flat' ? stains : []}
            onInteractionChange={onInteractionChange}
            onExit={goThrough}
            onScrub={onScrub}
          />
        </group>
      </Canvas>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-ui-ink transition-opacity duration-300 ${
          isFading ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
}
