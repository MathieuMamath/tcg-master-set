'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  createContext,
  type ReactNode,
  type Ref,
  type RefObject,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  MultiplyBlending,
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
  BUREAU_FURNITURE,
  BUREAU_WALLS,
  DOWNTOWN_BACK_TOWERS,
  DOWNTOWN_ENDS,
  DOWNTOWN_SPOTS,
  DOWNTOWN_TOWERS,
  exitAlong,
  FLAT_FURNITURE,
  FLAT_WALLS,
  FLAT_WINDOW_X,
  HULOTTE_X,
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
import { mixColors, type SkyLook, skyLook, type WorldTint } from '@/game/sky';
import type { PlayerSpot } from '@/game/spot';
import type { Interaction } from '@/game/world';
import {
  BERENICE_SIZE,
  BRUTUS_SIZE,
  cutOut,
  drawArcade,
  drawArcadeCabinet,
  drawArcadeCarpet,
  drawArcadeDoor,
  drawBalloon,
  drawBasketballMachine,
  drawBed,
  drawBench,
  drawBerenice,
  drawBigPlant,
  drawBookcase,
  drawBookPile,
  drawBookshop,
  drawBookWall,
  drawBoosterShelves,
  drawBrutus,
  drawBureauTower,
  drawBus,
  drawBusShelter,
  drawChair,
  drawClawMachine,
  drawCloud,
  drawCorrugatedEdge,
  drawCounter,
  drawDalgonaAwning,
  drawDalgonaCart,
  drawDashboard,
  drawDesk,
  drawDoor,
  drawDust,
  drawFlats,
  drawFrame,
  drawGaspard,
  drawGlassDoor,
  drawHedgehog,
  drawHills,
  drawHouse,
  drawHulotte,
  drawLake,
  drawLampGlow,
  drawLea,
  drawLucas,
  drawMagazineRack,
  drawModernDesk,
  drawModernSofa,
  drawOfficeFloor,
  drawOfficeWall,
  drawPanorama,
  drawPapy,
  drawParkGround,
  drawPavement,
  drawPine,
  drawPip,
  drawPlanks,
  drawRaccoon,
  drawRaffleBooth,
  drawRaffleCounter,
  drawReeds,
  drawShadowBlob,
  drawShop,
  drawSign,
  drawSky,
  drawSkyGradient,
  drawSkyline,
  drawSofa,
  drawStationeryTable,
  drawStreet,
  drawStreetLamp,
  drawSweatDrop,
  drawTallPlant,
  drawTower,
  drawTree,
  drawTuft,
  drawUprightCorrugatedEdge,
  drawWallpaper,
  drawWindowFrame,
  type Eyes,
  GASPARD_SIZE,
  HEDGEHOG_SIZE,
  HULOTTE_SIZE,
  LAMP_DRAWINGS,
  type LampStyle,
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
  // The name of downtown's bus stop.
  downtownStop: string;
  // On the plaque over the statistics bureau's door.
  bureau: string;
  // Painted on Gaspard's cart.
  dalgona: string;
  // On the board over Bérénice's stand.
  raffle: string;
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
function CutOut({
  map,
  height,
  width,
  material,
}: {
  map: Texture;
  height: number;
  width?: number;
  material?: Ref<MeshBasicMaterial>;
}) {
  const image = map.image as HTMLCanvasElement;
  const shownWidth = width ?? (height * image.width) / image.height;
  return (
    <mesh position={[0, height / 2, 0]}>
      <planeGeometry args={[shownWidth, height]} />
      <meshBasicMaterial ref={material} map={map} alphaTest={0.5} side={DoubleSide} />
    </mesh>
  );
}

// A character drawn twice, eyes open and shut, so that it can blink.
type Blinker = { open: Texture; shut: Texture };

function blinker(
  width: number,
  height: number,
  draw: (drawing: CanvasRenderingContext2D, width: number, height: number, eyes: Eyes) => void,
  border: number,
  seed: number,
): Blinker {
  return {
    open: texture(cutOut(width, height, (art, w, h) => draw(art, w, h, 'open'), border, seed)),
    // The same seed gives the same grain, so that only the eyes change.
    shut: texture(cutOut(width, height, (art, w, h) => draw(art, w, h, 'shut'), border, seed)),
  };
}

const BLINK_SECONDS = 0.13;
// Now and then a blink comes twice, quickly.
const DOUBLE_BLINK_CHANCE = 0.2;
const DOUBLE_BLINK_GAP_SECONDS = 0.12;

function secondsUntilBlink() {
  return 2 + Math.random() * 4;
}

// Shuts the eyes for a moment every few seconds, each character on its own rhythm.
function useBlink(material: RefObject<MeshBasicMaterial | null>, look: Blinker | undefined) {
  const blink = useRef({ wait: secondsUntilBlink(), shut: 0, again: false });
  useFrame((_, delta) => {
    if (!look || !material.current) {
      return;
    }
    const state = blink.current;
    if (state.shut > 0) {
      state.shut -= delta;
      if (state.shut <= 0) {
        state.wait = state.again ? DOUBLE_BLINK_GAP_SECONDS : secondsUntilBlink();
        state.again = false;
      }
    } else {
      state.wait -= Math.min(delta, MAX_FRAME_SECONDS);
      if (state.wait <= 0) {
        state.shut = BLINK_SECONDS;
        state.again = state.wait > -1 && Math.random() < DOUBLE_BLINK_CHANCE;
      }
    }
    const map = state.shut > 0 ? look.shut : look.open;
    if (material.current.map !== map) {
      material.current.map = map;
    }
  });
}

// Breathing while standing still: the cut-out swells and settles from its feet, and sways a little.
const BREATH_SPEED = 2.4;
const BREATH_SWELL = 0.024;
const SWAY_SPEED = 1.1;
const SWAY_ANGLE = 0.012;

function breathe(group: Group, time: number) {
  const breath = Math.sin(time * BREATH_SPEED);
  group.scale.set(1 - breath * BREATH_SWELL * 0.4, 1 + breath * BREATH_SWELL, 1);
  group.rotation.z = Math.sin(time * SWAY_SPEED) * SWAY_ANGLE;
}

// Someone standing in a place, alive: breathing, and blinking if their eyes can be seen. A pace
// above one makes them breathe faster, out of breath.
function Character({
  map,
  blinks,
  x,
  z,
  height,
  shadow,
  pace = 1,
}: {
  map: Texture;
  blinks?: Blinker;
  x: number;
  z: number;
  height: number;
  shadow: Texture;
  pace?: number;
}) {
  const body = useRef<Group>(null);
  const material = useRef<MeshBasicMaterial>(null);
  // Each starts at a different point of its breath, so that they don't breathe together.
  const time = useRef(Math.random() * 20);
  useBlink(material, blinks);
  useFrame((_, delta) => {
    // Its own clock, so that a change of pace doesn't jump in the middle of a breath.
    time.current += Math.min(delta, MAX_FRAME_SECONDS) * pace;
    if (body.current) {
      breathe(body.current, time.current);
    }
  });
  const image = map.image as HTMLCanvasElement;
  return (
    <>
      <group position={[x, 0, z]}>
        <group ref={body}>
          <CutOut map={map} height={height} material={material} />
        </group>
      </group>
      <FloorShadow x={x} z={z} width={(height * image.width) / image.height} map={shadow} />
    </>
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

// The sky of the moment, by the game's time and weather, for every place that shows it.
const SkyContext = createContext<SkyLook>(skyLook('day', 'fewClouds'));

// Outside, the light of the moment: the tint laid over the world, and how bright the lamps shine.
export type OutdoorLight = { tint: WorldTint; lamps: number };
const LightContext = createContext<OutdoorLight>({
  tint: { color: '#ffffff', strength: 0 },
  lamps: 0,
});
// How fast the light moves to a new time of day, in shares of the way per second.
const LIGHT_EASING = 0.6;
// Drawn after the world and before the lamps' halos, so that the night darkens everything but them.
const VEIL_ORDER = 10;
const GLOW_ORDER = 11;

// The light of the time of day, laid over the whole view by multiplying its colours, just in front
// of the camera. It moves softly from one time of day to the next.
function LightVeil() {
  const { tint } = useContext(LightContext);
  const veil = useRef<Mesh>(null);
  const material = useRef<MeshBasicMaterial>(null);
  const target = useMemo(
    () => new Color(mixColors('#ffffff', tint.color, tint.strength)),
    [tint.color, tint.strength],
  );
  const ahead = useMemo(() => new Vector3(), []);
  useFrame(({ camera }, delta) => {
    if (!veil.current || !material.current) {
      return;
    }
    camera.getWorldDirection(ahead);
    veil.current.position.copy(camera.position).addScaledVector(ahead, 0.2);
    veil.current.quaternion.copy(camera.quaternion);
    material.current.color.lerp(target, Math.min(1, delta * LIGHT_EASING));
  });
  return (
    <mesh ref={veil} renderOrder={VEIL_ORDER} frustumCulled={false}>
      <planeGeometry args={[4, 4]} />
      <meshBasicMaterial
        ref={material}
        color={target}
        blending={MultiplyBlending}
        premultipliedAlpha
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// A street lamp, its glass lit up from dusk until dawn: a warm halo around it and a pool of light
// on the floor below, both drawn over the night's veil. It stands on the floor at x, z.
function StreetLamp({
  style,
  x,
  z,
  height,
  textures,
}: {
  style: LampStyle;
  x: number;
  z: number;
  height: number;
  textures: { lamp: Texture; glow: Texture; shadow: Texture };
}) {
  const { lamps } = useContext(LightContext);
  const drawing = LAMP_DRAWINGS[style];
  const width = (height * drawing.width) / drawing.height;
  const lightX = x - width / 2 + width * drawing.lightX;
  const lightY = height * (1 - drawing.lightY);
  const halo = useRef<MeshBasicMaterial>(null);
  const pool = useRef<MeshBasicMaterial>(null);
  useFrame((_, delta) => {
    for (const material of [halo.current, pool.current]) {
      if (material) {
        const goal = material === pool.current ? lamps * 0.55 : lamps;
        material.opacity += (goal - material.opacity) * Math.min(1, delta * LIGHT_EASING * 2);
        material.visible = material.opacity > 0.01;
      }
    }
  });
  return (
    <>
      <Furniture map={textures.lamp} x={x} z={z} height={height} shadow={textures.shadow} />
      <mesh position={[lightX, lightY, z + 0.05]} renderOrder={GLOW_ORDER}>
        <planeGeometry args={[2.6, 2.6]} />
        <meshBasicMaterial
          ref={halo}
          map={textures.glow}
          blending={AdditiveBlending}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[lightX, 0.02, z + 0.9]}
        renderOrder={GLOW_ORDER}
      >
        <planeGeometry args={[3.4, 2]} />
        <meshBasicMaterial
          ref={pool}
          map={textures.glow}
          blending={AdditiveBlending}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

// The lamps' drawings and their halo, drawn once for a place.
function useLampTextures(style: LampStyle) {
  return useMemo(() => {
    const { width, height } = LAMP_DRAWINGS[style];
    return {
      lamp: texture(
        cutOut(width, height, drawStreetLamp(style), 8, style === 'classic' ? 201 : 202),
      ),
      glow: texture(drawLampGlow()),
      shadow: texture(drawShadowBlob()),
    };
  }, [style]);
}

// A double window over the desk, onto the sky of the moment.
function SkyWindow({ x }: { x: number }) {
  const look = useContext(SkyContext);
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

const LEA_HEIGHT = 3.5;
const LEA_Z = -0.6;
// Until her walls are dusted, Léa breathes this much faster, and sweats.
const LEA_HURRIED_PACE = 2.6;
// Her temples, on either side of her head, from her feet.
const LEA_TEMPLES = { side: 0.74, y: 1.95 };
const SWEAT_DROP = { width: 0.22, fallSeconds: 1.3, fall: 0.45 };

// Drops of sweat that bead on a temple, slide down and fade, one side after the other.
function SweatDrops({ x, z, map }: { x: number; z: number; map: Texture }) {
  const drops = useRef<(Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    drops.current.forEach((drop, index) => {
      if (!drop) {
        return;
      }
      const cycle = (clock.elapsedTime / SWEAT_DROP.fallSeconds + index * 0.5) % 1;
      const side = index % 2 === 0 ? -1 : 1;
      // Swells for the first fifth, then slides down and away from the face.
      const swell = Math.min(1, cycle * 5);
      const slide = Math.max(0, cycle - 0.2) / 0.8;
      drop.position.set(
        x + side * (LEA_TEMPLES.side + slide * 0.12),
        LEA_TEMPLES.y - slide * slide * SWEAT_DROP.fall,
        z,
      );
      drop.scale.setScalar(0.4 + swell * 0.6);
      (drop.material as MeshBasicMaterial).opacity = 1 - slide * slide;
    });
  });
  const image = map.image as HTMLCanvasElement;
  const height = (SWEAT_DROP.width * image.height) / image.width;
  return (
    <>
      {[0, 1].map((index) => (
        <mesh
          key={index}
          ref={(drop) => {
            drops.current[index] = drop;
          }}
        >
          <planeGeometry args={[SWEAT_DROP.width, height]} />
          <meshBasicMaterial map={map} transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}
const DUST_SIZE = { width: 0.95, height: 0.75 };

// Léa's flat: a shelf, a sofa under pictures, a window, and Léa at her desk. During her quest,
// patches of dust cover the wall, fading with each rub.
function Flat({
  speakerTops,
  stains,
  isLeaCalm,
}: {
  speakerTops: RefObject<SpeakerTops>;
  stains: readonly Stain[];
  // Once her walls are dusted for the day.
  isLeaCalm: boolean;
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
      sweat: texture(cutOut(40, 58, drawSweatDrop, 5, 98)),
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
      <Character
        map={textures.lea}
        x={LEA_X}
        z={LEA_Z}
        height={LEA_HEIGHT}
        shadow={textures.shadow}
        pace={isLeaCalm ? 1 : LEA_HURRIED_PACE}
      />
      {!isLeaCalm && <SweatDrops x={LEA_X} z={LEA_Z + 0.05} map={textures.sweat} />}
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
  { x: -36, y: 5.8, size: 1.65 },
  { x: -22, y: 6.6, size: 2.03 },
  { x: -8, y: 5.6, size: 1.52 },
  { x: 6, y: 6.9, size: 1.91 },
  { x: 20, y: 6, size: 1.65 },
  { x: 34, y: 6.8, size: 1.4 },
];
const BUILDINGS_Z = -1.4;
// Downtown seen from the village, between the sky and the farthest hills.
const SKYLINE = { x: -2, z: -9, width: 26, height: 5.4 };
const HILL_ROWS = [
  { z: -7, color: '#9cc6a6', hatch: '#6e9e7a', bumps: 7, height: 3.6, seed: 1 },
  { z: -5.5, color: '#78ae6c', hatch: '#4e8448', bumps: 8, height: 2.8, seed: 2 },
  { z: -4, color: '#579552', hatch: '#3b7238', bumps: 9, height: 1.8, seed: 3 },
];

const BERENICE_HEIGHT = 3.05;
// The booth stands behind Bérénice, and her counter in front, hiding her feet.
const RAFFLE_Z = { booth: -1.1, balloons: -1.15, berenice: -0.85, counter: -0.45 };
const RAFFLE_BOOTH_HEIGHT = 4;
// Where the balloons are tied: the tops of the booth's posts, either side of its middle.
const BALLOONS = [
  { color: '#e8645a', post: -1, offset: -0.12, lean: 0.12, height: 1.6 },
  { color: '#f3c14b', post: -1, offset: 0, lean: -0.05, height: 1.85 },
  { color: '#9a7bd6', post: -1, offset: 0.1, lean: -0.18, height: 1.5 },
  { color: '#3a86c8', post: 1, offset: -0.05, lean: 0.1, height: 1.75 },
  { color: '#5b9c4e', post: 1, offset: 0.1, lean: -0.12, height: 1.55 },
] as const;
const BALLOON_POST = { side: 1.32, y: 3.25 };
// Each balloon a little behind the last, so that overlapping ones never fight for the same
// depth and flicker.
const BALLOON_GAP_Z = 0.03;

// Balloons tied to the stand, swaying on their strings in the breeze, each at its own pace.
function Balloons({ x, z }: { x: number; z: number }) {
  const maps = useMemo(
    () =>
      BALLOONS.map(({ color }, index) =>
        texture(cutOut(70, 230, drawBalloon(color), 5, 130 + index)),
      ),
    [],
  );
  const strings = useRef<(Group | null)[]>([]);
  useFrame(({ clock }) => {
    for (const [index, group] of strings.current.entries()) {
      if (group) {
        const time = clock.elapsedTime * (0.8 + index * 0.13) + index * 1.7;
        group.rotation.z = BALLOONS[index].lean + Math.sin(time) * 0.07;
        group.position.y = BALLOON_POST.y + Math.sin(time * 1.3) * 0.03;
      }
    }
  });
  return (
    <>
      {BALLOONS.map(({ post, offset, height }, index) => (
        <group
          // biome-ignore lint/suspicious/noArrayIndexKey: the balloons never change.
          key={index}
          ref={(group) => {
            strings.current[index] = group;
          }}
          position={[
            x + post * BALLOON_POST.side + offset,
            BALLOON_POST.y,
            z - index * BALLOON_GAP_Z,
          ]}
        >
          <CutOut map={maps[index]} height={height} />
        </group>
      ))}
    </>
  );
}

const GASPARD_HEIGHT = 3.3;
// The awning stands behind Gaspard, and his cart in front, hiding his legs.
const DALGONA_Z = { awning: -1.1, gaspard: -0.85, cart: -0.45 };

// The street: a wide sky, rows of hills, our house, Gaspard's stand, the shop and the bookshop.
// The village's greenery, as in the art direction's prototype: trees between and behind the
// buildings, in front of the hills, and tufts of grass with flowers along the street, some at the
// foot of the buildings and some at its front edge, in front of Pip.
const TOWN_TREES = [
  { x: -18.6, z: -2.9, height: 4.6, kind: 'pine', seed: 31 },
  { x: -17.1, z: -3.3, height: 3.7, kind: 'round', seed: 32 },
  { x: -9.6, z: -2.6, height: 3.9, kind: 'round', seed: 33 },
  { x: -8.1, z: -3.2, height: 4.8, kind: 'pine', seed: 34 },
  { x: 8.6, z: -2.7, height: 4.1, kind: 'round', seed: 35 },
  { x: 10.1, z: -3.3, height: 5, kind: 'pine', seed: 36 },
  { x: -1.6, z: -3, height: 4.7, kind: 'round', seed: 39 },
  { x: 16, z: -3.2, height: 5.4, kind: 'pine', seed: 40 },
  { x: 25.8, z: -2.8, height: 3.8, kind: 'round', seed: 37 },
  { x: 37.6, z: -3, height: 4.5, kind: 'pine', seed: 38 },
] as const;
const TOWN_TUFTS = [
  { x: -17.8, z: -1.0, height: 0.8 },
  { x: -16.2, z: -0.9, height: 0.7 },
  { x: -10.9, z: -1.0, height: 0.9 },
  { x: -9.9, z: -0.9, height: 0.8 },
  { x: 1.8, z: -1.0, height: 0.7 },
  { x: 7.8, z: -0.9, height: 0.9 },
  { x: 8.9, z: -1.0, height: 0.8 },
  { x: 10.6, z: -0.9, height: 0.7 },
  { x: 16.3, z: -1.0, height: 0.9 },
  { x: 25.0, z: -0.9, height: 0.8 },
  { x: 26.5, z: -1.0, height: 0.7 },
  { x: 37.2, z: -0.9, height: 0.9 },
  { x: -19.2, z: 2.6, height: 0.85 },
  { x: -18.4, z: 2.75, height: 0.72 },
  { x: -14.6, z: 2.68, height: 0.95 },
  { x: -12.8, z: 2.6, height: 0.78 },
  { x: -8.4, z: 2.75, height: 0.85 },
  { x: -7.6, z: 2.68, height: 0.72 },
  { x: -3.4, z: 2.6, height: 0.95 },
  { x: -2.5, z: 2.75, height: 0.78 },
  { x: 1.1, z: 2.68, height: 0.85 },
  { x: 3.3, z: 2.6, height: 0.72 },
  { x: 4.2, z: 2.75, height: 0.95 },
  { x: 8.6, z: 2.68, height: 0.78 },
  { x: 9.4, z: 2.6, height: 0.85 },
  { x: 12.6, z: 2.75, height: 0.72 },
  { x: 15.6, z: 2.68, height: 0.95 },
  { x: 16.4, z: 2.6, height: 0.78 },
  { x: 19.8, z: 2.75, height: 0.85 },
  { x: 20.8, z: 2.68, height: 0.72 },
  { x: 24.3, z: 2.6, height: 0.95 },
  { x: 25.9, z: 2.75, height: 0.78 },
  { x: 29.1, z: 2.68, height: 0.85 },
  { x: 31.4, z: 2.6, height: 0.72 },
  { x: 32.2, z: 2.75, height: 0.95 },
  { x: 35.4, z: 2.68, height: 0.78 },
  { x: 36.8, z: 2.6, height: 0.85 },
];
const WIND_SWAY = 0.025;

// The street lamps along each place outside, between the buildings and the path, so that Pip
// walks in front of them: cast-iron lanterns in the village and the park, slim poles in the city.
const LAMP_Z = -0.25;
const LAMP_HEIGHTS: Record<LampStyle, number> = { classic: 3.3, modern: 4.2 };
const TOWN_LAMPS = [-17.6, -9.4, 2.05, 9.4, 25.8];
const PARK_LAMPS = [-5.1, 2.7, 9.8];
const DOWNTOWN_LAMPS = [-7.2, -2, 4.4, 9.2, 14.2];

function Lamps({ style, xs }: { style: LampStyle; xs: readonly number[] }) {
  const textures = useLampTextures(style);
  return (
    <>
      {xs.map((x) => (
        <StreetLamp
          key={x}
          style={style}
          x={x}
          z={LAMP_Z}
          height={LAMP_HEIGHTS[style]}
          textures={textures}
        />
      ))}
    </>
  );
}

// Something rooted to the floor that sways a little in the wind, like the prototype's trees.
function Swaying({
  x,
  z,
  phase,
  children,
}: {
  x: number;
  z: number;
  phase: number;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.z = Math.sin(clock.elapsedTime * 1.1 + phase) * WIND_SWAY;
    }
  });
  return (
    <group ref={group} position={[x, 0, z]}>
      {children}
    </group>
  );
}

// A tree that sways in the wind, its shadow staying still on the floor.
function SwayingTree({
  map,
  x,
  z,
  height,
  phase,
  shadow,
}: {
  map: Texture;
  x: number;
  z: number;
  height: number;
  phase: number;
  shadow: Texture;
}) {
  const image = map.image as HTMLCanvasElement;
  return (
    <>
      <Swaying x={x} z={z} phase={phase}>
        <CutOut map={map} height={height} />
      </Swaying>
      <FloorShadow x={x} z={z} width={(height * image.width) / image.height} map={shadow} />
    </>
  );
}

function Town({ signs, speakerTops }: { signs: SceneSigns; speakerTops: RefObject<SpeakerTops> }) {
  const look = useContext(SkyContext);
  const fontsReady = useFontsReady();
  const textures = useMemo(
    () => ({
      street: texture(drawStreet()),
      edge: texture(drawCorrugatedEdge()),
      shadow: texture(drawShadowBlob()),
      house: texture(cutOut(420, 380, drawHouse, 9, 61)),
      flats: texture(cutOut(440, 420, drawFlats, 9, 65)),
      skyline: texture(
        cutOut(
          Math.round(SKYLINE.width * PIXELS_PER_UNIT),
          Math.round(SKYLINE.height * PIXELS_PER_UNIT),
          drawSkyline,
          6,
          170,
        ),
      ),
      awning: texture(cutOut(320, 380, drawDalgonaAwning, 8, 121)),
      gaspard: blinker(GASPARD_SIZE.width, GASPARD_SIZE.height, drawGaspard, 9, 122),
      berenice: blinker(BERENICE_SIZE.width, BERENICE_SIZE.height, drawBerenice, 9, 124),
      raffleCounter: texture(cutOut(340, 200, drawRaffleCounter, 8, 126)),
      trees: TOWN_TREES.map(({ kind, seed }) =>
        texture(cutOut(240, 320, kind === 'pine' ? drawPine(seed) : drawTree(seed), 9, 140 + seed)),
      ),
      tufts: [1, 2, 3, 4].map((seed) =>
        texture(cutOut(160, 140, drawTuft(seed * 7), 7, 180 + seed)),
      ),
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
  const cart = useMemo(
    () => texture(cutOut(320, 190, drawDalgonaCart(signs.dalgona), 8, 123)),
    [fontsReady, signs.dalgona],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const raffleBooth = useMemo(
    () => texture(cutOut(340, 420, drawRaffleBooth(signs.raffle), 8, 125)),
    [fontsReady, signs.raffle],
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
  const cloud = useMemo(() => texture(cutOut(300, 190, drawCloud(look.cloud), 9, 63)), [look]);
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
    dalgona,
    raffle,
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
      {/* Downtown, far behind the hills. */}
      <group position={[SKYLINE.x, -0.2, SKYLINE.z]}>
        <CutOut map={textures.skyline} height={SKYLINE.height} />
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
      <Lamps style="classic" xs={TOWN_LAMPS} />
      {TOWN_TREES.map(({ x, z, height }, index) => (
        <SwayingTree
          key={x}
          map={textures.trees[index]}
          x={x}
          z={z}
          height={height}
          phase={index * 1.3}
          shadow={textures.shadow}
        />
      ))}
      {TOWN_TUFTS.map(({ x, z, height }, index) => (
        <Swaying key={`${x}-${z}`} x={x} z={z} phase={index * 0.9}>
          <CutOut map={textures.tufts[index % 4]} height={height} />
        </Swaying>
      ))}
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
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[
          {
            interaction: 'gaspard',
            map: textures.gaspard.open,
            height: GASPARD_HEIGHT,
            z: DALGONA_Z.gaspard,
          },
          {
            interaction: 'berenice',
            map: textures.berenice.open,
            height: BERENICE_HEIGHT,
            z: RAFFLE_Z.berenice,
          },
        ]}
      />
      <Balloons x={raffle.x} z={RAFFLE_Z.balloons} />
      <Furniture
        map={raffleBooth}
        x={raffle.x}
        z={RAFFLE_Z.booth}
        height={RAFFLE_BOOTH_HEIGHT}
        shadow={textures.shadow}
      />
      <Character
        map={textures.berenice.open}
        blinks={textures.berenice}
        x={raffle.bereniceX}
        z={RAFFLE_Z.berenice}
        height={BERENICE_HEIGHT}
        shadow={textures.shadow}
      />
      <Furniture
        map={textures.raffleCounter}
        x={raffle.x}
        z={RAFFLE_Z.counter}
        height={1.7}
        shadow={textures.shadow}
      />
      <Furniture
        map={textures.awning}
        x={dalgona.x}
        z={DALGONA_Z.awning}
        height={3.9}
        shadow={textures.shadow}
      />
      <Character
        map={textures.gaspard.open}
        blinks={textures.gaspard}
        x={dalgona.gaspardX}
        z={DALGONA_Z.gaspard}
        height={GASPARD_HEIGHT}
        shadow={textures.shadow}
      />
      <Furniture
        map={cart}
        x={dalgona.x}
        z={DALGONA_Z.cart}
        height={1.6}
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

// Trees that overlap never share a depth, or the two drawings fight over the same spot and flicker.
// A wood of round trees and pines along the back of the lawn, the pines mostly further back, and
// more beyond the lake.
const PARK_TREES = [
  { x: -10.4, z: -3.6, height: 5.2, kind: 'pine', seed: 6 },
  { x: -9.2, z: -3, height: 4.2, kind: 'round', seed: 1 },
  { x: -7.8, z: -3.4, height: 4.6, kind: 'pine', seed: 7 },
  { x: -6.2, z: -3.1, height: 3.4, kind: 'round', seed: 8 },
  { x: -4.6, z: -2.6, height: 3.6, kind: 'round', seed: 2 },
  { x: -3.1, z: -3.5, height: 5, kind: 'pine', seed: 9 },
  { x: -1.2, z: -3.2, height: 4.4, kind: 'round', seed: 10 },
  { x: 0.4, z: -3.6, height: 4.8, kind: 'pine', seed: 11 },
  { x: 1.8, z: -2.8, height: 4, kind: 'round', seed: 3 },
  { x: 2.7, z: -3.8, height: 5.4, kind: 'pine', seed: 12 },
  { x: 3.6, z: -3.4, height: 3.4, kind: 'round', seed: 4 },
  { x: 4.6, z: -3.9, height: 4.4, kind: 'pine', seed: 13 },
  // Beyond the lake, on the first hill, their trunks hidden behind it.
  { x: 6.3, z: -4.3, height: 5.6, kind: 'pine', seed: 15 },
  { x: 7.9, z: -4.7, height: 4.8, kind: 'round', seed: 16 },
  { x: 9.4, z: -4.5, height: 6, kind: 'pine', seed: 17 },
  { x: 11, z: -4.85, height: 5.2, kind: 'pine', seed: 18 },
  { x: 12.2, z: -3.6, height: 4.4, kind: 'round', seed: 5 },
  { x: 13.6, z: -3.2, height: 5, kind: 'pine', seed: 14 },
] as const;
// Tufts of grass on the lawn: at the foot of the trees and the bench, never on the lake, and
// along the front edge, in front of Pip.
const PARK_TUFTS = [
  { x: -9.6, z: -1, height: 0.8 },
  { x: -5.2, z: -0.9, height: 0.9 },
  { x: -4.1, z: -1, height: 0.7 },
  { x: 1.2, z: -0.9, height: 0.85 },
  { x: 2.6, z: -1, height: 0.75 },
  { x: 12.9, z: -1, height: 0.8 },
  { x: -9.2, z: 2.6, height: 0.85 },
  { x: -6.8, z: 2.75, height: 0.72 },
  { x: -3.6, z: 2.68, height: 0.95 },
  { x: -2.8, z: 2.6, height: 0.78 },
  { x: 0.4, z: 2.75, height: 0.85 },
  { x: 3.2, z: 2.68, height: 0.72 },
  { x: 5.6, z: 2.6, height: 0.95 },
  { x: 8.3, z: 2.75, height: 0.78 },
  { x: 9.1, z: 2.68, height: 0.85 },
  { x: 11.8, z: 2.6, height: 0.72 },
];
const PAPY_HEIGHT = 2.9;
const LUCAS_HEIGHT = 2.6;
const PARK_PEOPLE_Z = -0.5;

// The Linden Park: lawns and trees under the sky, the bus stop on the left, Papy Caillou by his
// bench, and Lucas fishing at the edge of the lake.
function Park({ signs, speakerTops }: { signs: SceneSigns; speakerTops: RefObject<SpeakerTops> }) {
  const look = useContext(SkyContext);
  const fontsReady = useFontsReady();
  const { busStop, bench, papy, lake, lucas } = PARK_SPOTS;
  const staticTextures = useMemo(
    () => ({
      ground: texture(drawParkGround()),
      lake: texture(drawLake()),
      edge: texture(drawCorrugatedEdge()),
      shadow: texture(drawShadowBlob()),
      hills: HILL_ROWS.map(({ color, hatch, bumps, seed, height }) =>
        texture(
          cutOut(1600, Math.round(height * 100), drawHills(color, hatch, bumps, seed), 8, seed),
        ),
      ),
      trees: PARK_TREES.map(({ kind, seed }) =>
        texture(cutOut(240, 320, kind === 'pine' ? drawPine(seed) : drawTree(seed), 9, 110 + seed)),
      ),
      bench: texture(cutOut(260, 150, drawBench, 8, 116)),
      reeds: texture(cutOut(220, 110, drawReeds, 6, 117)),
      tufts: [1, 2, 3, 4].map((seed) =>
        texture(cutOut(160, 140, drawTuft(seed * 11), 7, 190 + seed)),
      ),
      papy: texture(cutOut(PAPY_SIZE.width, PAPY_SIZE.height, drawPapy, 9, 118)),
      lucas: blinker(LUCAS_SIZE.width, LUCAS_SIZE.height, drawLucas, 9, 119),
    }),
    [],
  );
  const skyTextures = useMemo(
    () => ({
      sky: texture(drawSkyGradient(look)),
      cloud: texture(cutOut(300, 190, drawCloud(look.cloud), 9, 63)),
    }),
    [look],
  );
  const textures = { ...staticTextures, ...skyTextures };
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
          { interaction: 'boy', map: textures.lucas.open, height: LUCAS_HEIGHT, z: PARK_PEOPLE_Z },
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
      <Lamps style="classic" xs={PARK_LAMPS} />
      {PARK_TREES.map(({ x, z, height }, index) => (
        <SwayingTree
          key={x}
          map={textures.trees[index]}
          x={x}
          z={z}
          height={height}
          phase={index * 1.3}
          shadow={textures.shadow}
        />
      ))}
      {PARK_TUFTS.map(({ x, z, height }, index) => (
        <Swaying key={`${x}-${z}`} x={x} z={z} phase={index * 0.9}>
          <CutOut map={textures.tufts[index % 4]} height={height} />
        </Swaying>
      ))}
      <Furniture map={shelter} x={busStop.x} z={-0.7} height={3} shadow={textures.shadow} />
      <Furniture map={textures.bench} x={bench.x} z={-1.1} height={1.4} shadow={textures.shadow} />
      <Character
        map={textures.papy}
        // The drawing leaves room for the cane on its right, so it moves right to stay centred.
        x={papy.x + 0.25}
        z={PARK_PEOPLE_Z}
        height={PAPY_HEIGHT}
        shadow={textures.shadow}
      />
      <Swaying x={lake.left + 0.6} z={-0.3} phase={0.4}>
        <CutOut map={textures.reeds} height={1.1} />
      </Swaying>
      <Swaying x={lake.right - 0.8} z={-0.3} phase={2.1}>
        <CutOut map={textures.reeds} height={1.2} />
      </Swaying>
      <Character
        // The drawing leaves room for the rod on its right, so it moves right to stay centred.
        map={textures.lucas.open}
        blinks={textures.lucas}
        x={lucas.x + 0.7}
        z={PARK_PEOPLE_Z}
        height={LUCAS_HEIGHT}
        shadow={textures.shadow}
      />
    </>
  );
}

const DOWNTOWN_TOWERS_Z = -1.6;
const DOWNTOWN_BACK_TOWERS_Z = -5;

// Downtown: a modern pavement under towers so tall that they rise out of sight, with a farther row
// fading into the haze behind them.
function Downtown({
  signs,
  speakerTops,
}: {
  signs: SceneSigns;
  speakerTops: RefObject<SpeakerTops>;
}) {
  const look = useContext(SkyContext);
  const fontsReady = useFontsReady();
  const { busStop } = DOWNTOWN_SPOTS;
  const staticTextures = useMemo(
    () => ({
      pavement: texture(drawPavement()),
      edge: texture(drawCorrugatedEdge()),
      shadow: texture(drawShadowBlob()),
      towers: DOWNTOWN_TOWERS.map(({ width, height, look: towerLook }, index) =>
        texture(
          cutOut(
            Math.round(width * PIXELS_PER_UNIT),
            Math.round(height * PIXELS_PER_UNIT),
            drawTower(towerLook),
            9,
            140 + index,
          ),
        ),
      ),
      backTowers: DOWNTOWN_BACK_TOWERS.map(({ width, height, look: towerLook }, index) =>
        texture(
          cutOut(
            Math.round(width * PIXELS_PER_UNIT),
            Math.round(height * PIXELS_PER_UNIT),
            drawTower(towerLook, true),
            8,
            150 + index,
          ),
        ),
      ),
    }),
    [],
  );
  const skyTextures = useMemo(
    () => ({
      sky: texture(drawSkyGradient(look)),
      cloud: texture(cutOut(300, 190, drawCloud(look.cloud), 9, 63)),
    }),
    [look],
  );
  const textures = { ...staticTextures, ...skyTextures };
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const shelter = useMemo(
    () => texture(cutOut(360, 320, drawBusShelter(signs.downtownStop), 9, 160)),
    [fontsReady, signs.downtownStop],
  );
  const { bureau } = DOWNTOWN_SPOTS;
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const bureauTower = useMemo(
    () =>
      texture(
        cutOut(
          Math.round(bureau.width * PIXELS_PER_UNIT),
          Math.round(bureau.height * PIXELS_PER_UNIT),
          drawBureauTower(signs.bureau),
          9,
          161,
        ),
      ),
    [fontsReady, signs.bureau, bureau.width, bureau.height],
  );
  const brutus = useMemo(
    () => texture(cutOut(BRUTUS_SIZE.width, BRUTUS_SIZE.height, drawBrutus, 9, 162)),
    [],
  );
  const width = DOWNTOWN_ENDS.right - DOWNTOWN_ENDS.left + 20;
  const center = (DOWNTOWN_ENDS.left + DOWNTOWN_ENDS.right) / 2;
  return (
    <>
      <mesh position={[center, 7, -10]}>
        <planeGeometry args={[width + 70, 40]} />
        <meshBasicMaterial map={textures.sky} />
      </mesh>
      {[
        [-14, 8.5, 1.4],
        [6, 9.4, 1.7],
        [20, 7.8, 1.2],
      ].map(([cloudX, cloudY, size]) => (
        <group key={cloudX} position={[center + cloudX, cloudY, -8]}>
          <CutOut map={textures.cloud} height={size} />
        </group>
      ))}
      {DOWNTOWN_BACK_TOWERS.map(({ x, height }, index) => (
        <group key={x} position={[x, 0, DOWNTOWN_BACK_TOWERS_Z]}>
          <CutOut map={textures.backTowers[index]} height={height} />
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center, 0, -1]}>
        <planeGeometry args={[width, 8]} />
        <meshBasicMaterial map={textures.pavement} />
      </mesh>
      <mesh position={[center, -0.18, STREET_FRONT_Z]}>
        <boxGeometry args={[width, 0.36, 0.14]} />
        <meshBasicMaterial map={textures.edge} />
      </mesh>
      {DOWNTOWN_TOWERS.map(({ x, height }, index) => (
        <Furniture
          key={x}
          map={textures.towers[index]}
          x={x}
          z={DOWNTOWN_TOWERS_Z}
          height={height}
          shadow={textures.shadow}
        />
      ))}
      <Lamps style="modern" xs={DOWNTOWN_LAMPS} />
      <Furniture map={shelter} x={busStop.x} z={-0.7} height={3} shadow={textures.shadow} />
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[{ interaction: 'brutus', map: brutus, height: BRUTUS_HEIGHT, z: -0.6 }]}
      />
      <Furniture
        map={bureauTower}
        x={bureau.x}
        z={DOWNTOWN_TOWERS_Z}
        height={bureau.height}
        shadow={textures.shadow}
      />
      {/* Brutus, by the bureau's door. His dark glasses hide his eyes, so he never blinks. */}
      <Character
        map={brutus}
        x={bureau.brutusX}
        z={-0.6}
        height={BRUTUS_HEIGHT}
        shadow={textures.shadow}
      />
    </>
  );
}

const BRUTUS_HEIGHT = 2.9;
const HULOTTE_HEIGHT = 2.8;
const HULOTTE_Z = -0.9;

// The statistics bureau, high in its tower: white walls and a polished floor, a window onto the
// big city with a sofa before it, a wall screen of dashboards, plants, and Mme Hulotte behind her
// white desk.
function Bureau({ speakerTops }: { speakerTops: RefObject<SpeakerTops> }) {
  const { window: view, sofa, plant, screen, desk, cornerPlant } = BUREAU_FURNITURE;
  const textures = useMemo(
    () => ({
      room: {
        wall: texture(drawOfficeWall()),
        floor: texture(drawOfficeFloor()),
        door: texture(
          paint(
            Math.round(DOOR_WIDTH * PIXELS_PER_UNIT),
            Math.round(DOOR_HEIGHT * PIXELS_PER_UNIT),
            drawGlassDoor,
            163,
          ),
        ),
      },
      shadow: texture(drawShadowBlob()),
      view: texture(paint(Math.round(view.width * PIXELS_PER_UNIT), 260, drawPanorama, 164)),
      screen: texture(paint(Math.round(screen.width * PIXELS_PER_UNIT), 130, drawDashboard, 165)),
      desk: texture(cutOut(320, 200, drawModernDesk, 9, 166)),
      plant: texture(cutOut(140, 300, drawTallPlant, 8, 168)),
      sofa: texture(cutOut(340, 150, drawModernSofa, 9, 169)),
      hulotte: blinker(HULOTTE_SIZE.width, HULOTTE_SIZE.height, drawHulotte, 9, 167),
    }),
    [],
  );
  return (
    <>
      <RoomShell walls={BUREAU_WALLS} doorSide="left" textures={textures.room} />
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[
          {
            interaction: 'hulotte',
            map: textures.hulotte.open,
            height: HULOTTE_HEIGHT,
            z: HULOTTE_Z,
          },
        ]}
      />
      {/* The window, floor to ceiling, and the wall screen. */}
      <mesh position={[view.x, 2.1, WALL_Z + 0.01]}>
        <planeGeometry args={[view.width, 2.6]} />
        <meshBasicMaterial map={textures.view} />
      </mesh>
      <mesh position={[screen.x, 2.55, WALL_Z + 0.02]}>
        <planeGeometry args={[screen.width, 1.3]} />
        <meshBasicMaterial map={textures.screen} />
      </mesh>
      <Furniture map={textures.plant} x={plant.x} z={-1.1} height={2} shadow={textures.shadow} />
      <Furniture map={textures.sofa} x={sofa.x} z={-1.2} height={1.25} shadow={textures.shadow} />
      <Furniture
        map={textures.plant}
        x={cornerPlant.x}
        z={-1.2}
        height={1.7}
        shadow={textures.shadow}
      />
      <Character
        map={textures.hulotte.open}
        blinks={textures.hulotte}
        x={HULOTTE_X}
        z={HULOTTE_Z}
        height={HULOTTE_HEIGHT}
        shadow={textures.shadow}
      />
      <Furniture map={textures.desk} x={desk.x} z={-0.5} height={1.7} shadow={textures.shadow} />
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
  spot,
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
  spot: RefObject<PlayerSpot | null>;
  onInteractionChange: (interaction: Interaction | null) => void;
  onExit: (travel: Travel) => void;
  onScrub: (id: number) => void;
}) {
  const pip = useMemo(() => blinker(240, 300, drawPip, 10, 21), []);
  const pipMaterial = useRef<MeshBasicMaterial>(null);
  useBlink(pipMaterial, pip);
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
    spot.current = { place: room.id, x, facing };

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
      if (isWalking) {
        bouncer.current.scale.set(1, 1 - Math.abs(Math.cos(walk.current.phase)) * 0.05, 1);
        bouncer.current.rotation.z = Math.sin(walk.current.phase) * 0.05;
      } else {
        breathe(bouncer.current, walk.current.time);
      }
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
            <CutOut map={pip.open} height={PIP_HEIGHT} material={pipMaterial} />
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
  // Léa is out of breath until her walls are dusted for the day.
  isLeaCalm: boolean;
  onInteractionChange: (interaction: Interaction | null) => void;
  onScrub: (id: number) => void;
  // Where the character starts: where it was left last time, or else the bedroom.
  startSpot: PlayerSpot | null;
  // Kept up to date with where the character stands, for saving it when the page is left.
  spot: RefObject<PlayerSpot | null>;
  // Told whenever the character arrives somewhere else, with where it stands there.
  onPlaceChange: (arrived: PlayerSpot) => void;
  // The sky of the moment, by the game's time and weather.
  sky: SkyLook;
  // Outside, the light of the moment.
  light: OutdoorLight;
};

// The places under the open sky, which the light of the time of day falls on.
const OUTSIDE_PLACES: ReadonlySet<SidePlaceId> = new Set(['town', 'park', 'downtown']);

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
  isLeaCalm,
  onInteractionChange,
  onScrub,
  startSpot,
  spot,
  onPlaceChange,
  sky,
  light,
}: Props) {
  const [visit, setVisit] = useState<{
    number: number;
    place: SidePlaceId;
    arrival: { x: number; facing: Facing };
  }>(() =>
    startSpot
      ? {
          number: 0,
          place: startSpot.place,
          arrival: { x: startSpot.x, facing: startSpot.facing },
        }
      : { number: 0, place: 'bedroom', arrival: { x: BEDROOM.start, facing: 1 } },
  );
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
      onPlaceChange({ place: exit.to, x: exit.arrival.x, facing: exit.arrival.facing });
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
        <SkyContext value={sky}>
          <LightContext value={light}>
            <group key={visit.number}>
              {visit.place === 'bedroom' && <Bedroom />}
              {visit.place === 'town' && <Town signs={signs} speakerTops={speakerTops} />}
              {visit.place === 'shop' && <Shop signs={signs} speakerTops={speakerTops} />}
              {visit.place === 'bookshop' && <Bookshop speakerTops={speakerTops} />}
              {visit.place === 'flat' && (
                <Flat speakerTops={speakerTops} stains={stains} isLeaCalm={isLeaCalm} />
              )}
              {visit.place === 'arcade' && <Arcade />}
              {visit.place === 'park' && <Park signs={signs} speakerTops={speakerTops} />}
              {visit.place === 'downtown' && <Downtown signs={signs} speakerTops={speakerTops} />}
              {visit.place === 'bureau' && <Bureau speakerTops={speakerTops} />}
              <Pip
                input={input}
                room={SIDE_PLACES[visit.place]}
                arrival={visit.arrival}
                bubble={bubble}
                speakerTops={speakerTops}
                stains={visit.place === 'flat' ? stains : []}
                spot={spot}
                onInteractionChange={onInteractionChange}
                onExit={goThrough}
                onScrub={onScrub}
              />
            </group>
            {OUTSIDE_PLACES.has(visit.place) && <LightVeil />}
          </LightContext>
        </SkyContext>
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
