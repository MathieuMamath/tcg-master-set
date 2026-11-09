// What every place of the paper scene is built from: textures from the drawings, cut-outs, characters
// that breathe and blink, furniture and the shell of a room, and the speech bubbles' anchors.

import { useFrame } from '@react-three/fiber';
import { type Ref, type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import {
  CanvasTexture,
  DoubleSide,
  type Group,
  type MeshBasicMaterial,
  SRGBColorSpace,
  type Texture,
} from 'three';
import type { Direction } from '@/game/world/movement';
import type { SideExit } from '@/game/world/side-rooms';
import type { Interaction } from '@/game/world/world';
import {
  drawCorrugatedEdge,
  drawDoor,
  drawEdgeShadow,
  drawUprightCorrugatedEdge,
} from '../art/bedroom';
import { solidTop } from '../art/card-den';
import { cutOut, type Eyes, paint } from '../art/core';

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
  // On the plaque over the administrative office's door.
  bureau: string;
  // Painted on Gaspard's cart.
  dalgona: string;
  // On the board of Gustave's post counter.
  post: string;
  // On the board over Bérénice's stand.
  raffle: string;
  latest: string;
  thisYear: string;
  older: string;
  // On the boards over Ramen Yuzu's and the dojo's doors, downtown.
  ramen: string;
  dojo: string;
};

// A long pause in the tab must not teleport the character.
export const MAX_FRAME_SECONDS = 0.05;

// The top of each character the player can talk to here, measured from its drawing, so that the
// speech bubble sits just above it whatever its size.
export type SpeakerTops = Partial<Record<Interaction, { y: number; z: number }>>;
export function texture(canvas: HTMLCanvasElement): Texture {
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

// Outside, the diorama stands on a table of kraft, the same as the page behind the rooms, so that
// the sky never shows below its front edge. Being part of the scene, the table darkens at night
// with the rest of the world, and the edge casts a soft shadow on it.
const TABLE_COLOR = '#c8a574';
const TABLE_DEPTH = 20;
const EDGE_SHADOW_DEPTH = 0.9;

export function DioramaTable({ center, width }: { center: number; width: number }) {
  const shadow = useMemo(() => texture(drawEdgeShadow()), []);
  const top = -0.36;
  const z = STREET_FRONT_Z + 0.07;
  return (
    <>
      <mesh position={[center, top - TABLE_DEPTH / 2, z]}>
        <planeGeometry args={[width + 70, TABLE_DEPTH]} />
        <meshBasicMaterial color={TABLE_COLOR} toneMapped={false} />
      </mesh>
      <mesh position={[center, top - EDGE_SHADOW_DEPTH / 2, z + 0.01]}>
        <planeGeometry args={[width, EDGE_SHADOW_DEPTH]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}

// Overshoots a little before settling, like a sheet of card flipped by hand.
export function easeBack(progress: number): number {
  const overshoot = 1.70158;
  return 1 + (overshoot + 1) * (progress - 1) ** 3 + overshoot * (progress - 1) ** 2;
}

// A flat cut-out standing on the ground. Its only shadow is the one on the ground below it.
export function CutOut({
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

export function blinker(
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
export function useBlink(material: RefObject<MeshBasicMaterial | null>, look: Blinker | undefined) {
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

export function breathe(group: Group, time: number) {
  const breath = Math.sin(time * BREATH_SPEED);
  group.scale.set(1 - breath * BREATH_SWELL * 0.4, 1 + breath * BREATH_SWELL, 1);
  group.rotation.z = Math.sin(time * SWAY_SPEED) * SWAY_ANGLE;
}

// Someone standing in a place, alive: breathing, and blinking if their eyes can be seen. A pace
// above one makes them breathe faster, out of breath.
export function Character({
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

export const WALL_Z = -1.6;
const WALL_HEIGHT = 4.2;
const FRONT_Z = 2.6;
const ROOM_DEPTH = FRONT_Z - WALL_Z;
const WALL_THICKNESS = 0.16;
// Paper drawn at this many pixels for one unit of the world, to keep every drawing to scale.
export const PIXELS_PER_UNIT = 100;

const DOOR_Z = 0.7;
export const DOOR_HEIGHT = 2.6;
export const DOOR_WIDTH = 1.9;

export const WINDOW = { x: 0.6, centerY: 2.75, width: 300, height: 200 };
export const WINDOW_FRAME = 14;
export const WINDOW_SILL = 16;
export const WINDOW_MARGIN = 13;
// The sky shows this share of its picture at once, so that its clouds have room to drift.
export const SKY_SHOWN = 0.45;

// A soft shadow on the floor under a piece of furniture.
export function FloorShadow({
  x,
  z,
  width,
  map,
}: {
  x: number;
  z: number;
  width: number;
  map: Texture;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, z + 0.15]}>
      <planeGeometry args={[width * 1.15, 0.7]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} />
    </mesh>
  );
}

// A piece of furniture: a cut-out standing in the room, with its shadow on the floor.
export function Furniture({
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
export function RoomShell({
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

export function doorTexture(seed: number): Texture {
  return texture(
    paint(
      Math.round(DOOR_WIDTH * PIXELS_PER_UNIT),
      Math.round(DOOR_HEIGHT * PIXELS_PER_UNIT),
      drawDoor,
      seed,
    ),
  );
}

// Records where the top of each character's drawing is, for its speech bubble.
export function SpeakerTopsOf({
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

export const STREET_FRONT_Z = 3;
// The drawings with text wait for the game's fonts, or they would be drawn in a fallback font.
export function useFontsReady(): boolean {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    Promise.all(
      ['48px "Bagel Fat One"', '20px "Patrick Hand"'].map((font) => document.fonts.load(font)),
    ).then(() => setIsReady(true));
  }, []);
  return isReady;
}
