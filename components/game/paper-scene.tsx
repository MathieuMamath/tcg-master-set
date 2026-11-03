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
} from 'three';
import { type DashState, NO_DASH, tickDash } from '@/game/dash';
import { type Direction, STILL } from '@/game/movement';
import {
  BEDROOM,
  BEDROOM_FURNITURE,
  BEDROOM_WALLS,
  exitAlong,
  interactionAlong,
  SIDE_PLACES,
  type SideExit,
  type SidePlaceId,
  type SideRoom,
  TOWN_BUILDINGS,
  TOWN_ENDS,
} from '@/game/side-rooms';
import { type Facing, sidePush, stepWalker, WALKING_SPEED, type Walker } from '@/game/side-walk';
import { skyLook } from '@/game/sky';
import type { Interaction } from '@/game/world';
import {
  cutOut,
  drawBed,
  drawBigPlant,
  drawBookcase,
  drawChair,
  drawCloud,
  drawCorrugatedEdge,
  drawDesk,
  drawDoor,
  drawHills,
  drawHouse,
  drawPip,
  drawPlanks,
  drawShadowBlob,
  drawShop,
  drawSky,
  drawSkyGradient,
  drawStreet,
  drawUprightCorrugatedEdge,
  drawWallpaper,
  drawWindowFrame,
  paint,
} from './paper-art';
import { createPaperBalls, emitPaperBall, PaperBalls } from './paper-balls';

export type MovementInput = {
  keyboard: Direction;
  joystick: Direction;
  // Set by whoever asks for a dash, and used up by the character.
  wantsDash: boolean;
  // Set by whoever asks to go through the door the character stands at, and used up the same way.
  wantsDoor: boolean;
};

export type TownSigns = { shop: string; closed: string };

const PIP_Z = 1.25;
const PIP_HEIGHT = 1.75;
const LOOK_HEIGHT = 2;
const CAMERA_FOLLOW = 0.55;
const FIELD_OF_VIEW = 28;
// The width of the world the camera keeps in view, wider on a landscape screen.
const VIEW_WIDTH_WIDE = 11.5;
const VIEW_WIDTH_TALL = 8;
const MIN_CAMERA_DISTANCE = 17;
// A long pause in the tab must not teleport the character.
const MAX_FRAME_SECONDS = 0.05;

const TURN_SECONDS = 0.34;
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
const ROOM_WIDTH = BEDROOM_WALLS.right - BEDROOM_WALLS.left;
const ROOM_CENTER_X = (BEDROOM_WALLS.left + BEDROOM_WALLS.right) / 2;
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
function BedroomWindow() {
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
      <mesh position={[WINDOW.x, openingCenterY, WALL_Z + 0.01]}>
        <planeGeometry args={[openingWidth, openingHeight]} />
        <meshBasicMaterial map={sky} />
      </mesh>
      {/* Light on the glass. */}
      <mesh position={[WINDOW.x, openingCenterY, WALL_Z + 0.02]} rotation={[0, 0, -0.5]}>
        <planeGeometry args={[0.18, openingHeight * 1.1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <group position={[WINDOW.x, WINDOW.centerY - frameHeight / 2, WALL_Z + 0.03]}>
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

// The bedroom, as a box of card open towards the camera: wallpaper behind, planks below.
function Bedroom() {
  const textures = useMemo(
    () => ({
      wall: texture(drawWallpaper()),
      floor: texture(drawPlanks()),
      edge: texture(drawCorrugatedEdge()),
      upright: texture(drawUprightCorrugatedEdge(112)),
      shadow: texture(drawShadowBlob()),
      bed: texture(cutOut(320, 140, drawBed, 9, 41)),
      bookcase: texture(cutOut(170, 230, drawBookcase, 9, 42)),
      plant: texture(cutOut(240, 330, drawBigPlant, 9, 45)),
      door: texture(
        paint(Math.round(DOOR_WIDTH * 100), Math.round(DOOR_HEIGHT * 100), drawDoor, 46),
      ),
      desk: texture(cutOut(230, 128, drawDesk, 9, 43)),
      chair: texture(cutOut(95, 150, drawChair, 8, 44)),
    }),
    [],
  );
  const { bed, desk, chair, bookcase, plant } = BEDROOM_FURNITURE;
  return (
    <>
      <mesh position={[ROOM_CENTER_X, WALL_HEIGHT / 2, WALL_Z]}>
        <planeGeometry args={[ROOM_WIDTH, WALL_HEIGHT]} />
        <meshBasicMaterial map={textures.wall} />
      </mesh>
      {[-1, 1].map((side) => (
        // A wall of thick cardboard: wallpaper inside, its corrugated cut edge facing the camera.
        <mesh
          key={side}
          position={[
            (side > 0 ? BEDROOM_WALLS.right : BEDROOM_WALLS.left) + (side * WALL_THICKNESS) / 2,
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
                  ? { map: textures.upright }
                  : { color: '#b88b55' })}
            />
          ))}
        </mesh>
      ))}
      <BedroomWindow />
      {/* The way out, on the right wall. It stays shut until the places outside are rebuilt. */}
      <mesh
        position={[BEDROOM_WALLS.right - 0.01, DOOR_HEIGHT / 2, DOOR_Z]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[DOOR_WIDTH, DOOR_HEIGHT]} />
        <meshBasicMaterial map={textures.door} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROOM_CENTER_X, 0, WALL_Z + ROOM_DEPTH / 2]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshBasicMaterial map={textures.floor} />
      </mesh>
      <mesh position={[ROOM_CENTER_X, -0.18, FRONT_Z]}>
        <boxGeometry args={[ROOM_WIDTH + 0.3, 0.36, 0.14]} />
        <meshBasicMaterial map={textures.edge} />
      </mesh>
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

const STREET_FRONT_Z = 3;
const CLOUD_SPAN = 50;
const CLOUD_SPEED = 25;
const CLOUDS = [
  { x: -14, y: 5.8, size: 1.3 },
  { x: -6, y: 6.6, size: 1.6 },
  { x: 2, y: 5.6, size: 1.2 },
  { x: 9, y: 6.9, size: 1.5 },
  { x: 17, y: 6, size: 1.3 },
  { x: 23, y: 6.8, size: 1.1 },
];
const BUILDINGS_Z = -1.4;
const HILL_ROWS = [
  { z: -7, color: '#9cc6a6', hatch: '#6e9e7a', bumps: 7, height: 3.6, seed: 1 },
  { z: -5.5, color: '#78ae6c', hatch: '#4e8448', bumps: 8, height: 2.8, seed: 2 },
  { z: -4, color: '#579552', hatch: '#3b7238', bumps: 9, height: 1.8, seed: 3 },
];

// The street: a wide sky, rows of hills, our house and the shop, which hasn't opened yet.
function Town({ signs }: { signs: TownSigns }) {
  const look = skyLook('day', 'fewClouds');
  const fontsReady = useFontsReady();
  const textures = useMemo(
    () => ({
      street: texture(drawStreet()),
      edge: texture(drawCorrugatedEdge()),
      shadow: texture(drawShadowBlob()),
      house: texture(cutOut(420, 380, drawHouse, 9, 61)),
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
    () => texture(cutOut(480, 380, drawShop(signs.shop, signs.closed), 9, 62)),
    [fontsReady, signs.shop, signs.closed],
  );
  const sky = useMemo(() => texture(drawSkyGradient(look)), [look]);
  const cloud = useMemo(() => texture(cutOut(300, 150, drawCloud(look.cloud), 9, 63)), [look]);
  const clouds = useRef<(Group | null)[]>([]);

  // The clouds drift along, and come back round from the other side.
  useFrame((_, delta) => {
    for (const group of clouds.current) {
      if (group) {
        group.position.x += delta * look.drift * CLOUD_SPEED;
        if (group.position.x > CLOUD_SPAN / 2) {
          group.position.x -= CLOUD_SPAN;
        }
      }
    }
  });

  const { house, shop: shopPlace } = TOWN_BUILDINGS;
  const streetWidth = TOWN_ENDS.right - TOWN_ENDS.left + 20;
  return (
    <>
      <mesh position={[0, 7, -10]}>
        <planeGeometry args={[80, 26]} />
        <meshBasicMaterial map={sky} />
      </mesh>
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
      {HILL_ROWS.map(({ z, height }, index) => (
        <group key={z} position={[0, -0.15, z]}>
          <CutOut map={textures.hills[index]} height={(height * 100 + 24) / 100} width={40} />
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]}>
        <planeGeometry args={[streetWidth, 8]} />
        <meshBasicMaterial map={textures.street} />
      </mesh>
      <mesh position={[0, -0.18, STREET_FRONT_Z]}>
        <boxGeometry args={[streetWidth, 0.36, 0.14]} />
        <meshBasicMaterial map={textures.edge} />
      </mesh>
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
  onInteractionChange,
  onExit,
}: {
  input: RefObject<MovementInput>;
  room: SideRoom;
  arrival: { x: number; facing: Facing };
  onInteractionChange: (interaction: Interaction | null) => void;
  onExit: (exit: SideExit) => void;
}) {
  const pip = useMemo(() => texture(cutOut(240, 300, drawPip, 10, 21)), []);
  const blob = useMemo(() => texture(drawShadowBlob()), []);
  const root = useRef<Group>(null);
  const flipper = useRef<Group>(null);
  const bouncer = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const walker = useRef<Walker>({ x: arrival.x, velocity: 0, facing: arrival.facing });
  const interaction = useRef<Interaction | null>(null);
  const hasPlacedCamera = useRef(false);
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

    const reached = interactionAlong(room, x);
    if (reached !== interaction.current) {
      interaction.current = reached;
      onInteractionChange(reached);
    }
    const exit = input.current.wantsDoor ? exitAlong(room, x) : null;
    input.current.wantsDoor = false;
    if (exit) {
      onExit(exit);
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
    const cameraX = hasPlacedCamera.current
      ? camera.position.x + (x * CAMERA_FOLLOW - camera.position.x) * Math.min(1, delta * 3)
      : x * CAMERA_FOLLOW;
    hasPlacedCamera.current = true;
    camera.position.set(cameraX, LOOK_HEIGHT + distance * 0.1, distance);
    camera.lookAt(cameraX, LOOK_HEIGHT, 0);
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
  townSigns: TownSigns;
  onInteractionChange: (interaction: Interaction | null) => void;
};

// Matches the duration-300 class on the overlay.
const FADE_MILLISECONDS = 300;

// The paper world, seen from the side. Every visit starts afresh, so that the character arrives
// at the door it came through.
export function PaperScene({ input, webglUnavailable, townSigns, onInteractionChange }: Props) {
  const [visit, setVisit] = useState<{
    number: number;
    place: SidePlaceId;
    arrival: { x: number; facing: Facing };
  }>({ number: 0, place: 'bedroom', arrival: { x: BEDROOM.start, facing: 1 } });
  const [isFading, setIsFading] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(fadeTimer.current), []);

  const goThrough = (exit: SideExit) => {
    if (isFading) {
      return;
    }
    setIsFading(true);
    onInteractionChange(null);
    fadeTimer.current = setTimeout(() => {
      setVisit(({ number }) => ({ number: number + 1, place: exit.to, arrival: exit.arrival }));
      setIsFading(false);
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
          {visit.place === 'bedroom' ? <Bedroom /> : <Town signs={townSigns} />}
          <Pip
            input={input}
            room={SIDE_PLACES[visit.place]}
            arrival={visit.arrival}
            onInteractionChange={onInteractionChange}
            onExit={goThrough}
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
