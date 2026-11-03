'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { type RefObject, useMemo, useRef } from 'react';
import {
  CanvasTexture,
  DoubleSide,
  type Group,
  type Mesh,
  SRGBColorSpace,
  type Texture,
} from 'three';
import { type DashState, NO_DASH, tickDash } from '@/game/dash';
import { type Direction, STILL } from '@/game/movement';
import { sidePush, stepWalker, WALKING_SPEED, type Walker } from '@/game/side-walk';
import { cutOut, drawCorrugatedEdge, drawFloor, drawPip, drawShadowBlob } from './paper-art';
import { createPaperBalls, emitPaperBall, PaperBalls } from './paper-balls';

export type MovementInput = {
  keyboard: Direction;
  joystick: Direction;
  // Set by whoever asks for a dash, and used up by the character.
  wantsDash: boolean;
};

// An empty stage for now: the town and its buildings come back one by one, in paper.
const STAGE = { minX: -10, maxX: 10 };
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
function CutOut({ map, height }: { map: Texture; height: number }) {
  const image = map.image as HTMLCanvasElement;
  const width = (height * image.width) / image.height;
  return (
    <mesh position={[0, height / 2, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={map} alphaTest={0.5} side={DoubleSide} />
    </mesh>
  );
}

function Stage() {
  const floor = useMemo(() => texture(drawFloor()), []);
  const edge = useMemo(() => texture(drawCorrugatedEdge()), []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]}>
        <planeGeometry args={[44, 10]} />
        <meshBasicMaterial map={floor} />
      </mesh>
      <mesh position={[0, -0.18, 3]}>
        <boxGeometry args={[44, 0.36, 0.14]} />
        <meshBasicMaterial map={edge} />
      </mesh>
    </>
  );
}

function Pip({ input }: { input: RefObject<MovementInput> }) {
  const pip = useMemo(() => texture(cutOut(240, 300, drawPip, 10, 21)), []);
  const blob = useMemo(() => texture(drawShadowBlob()), []);
  const root = useRef<Group>(null);
  const flipper = useRef<Group>(null);
  const bouncer = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const walker = useRef<Walker>({ x: 0, velocity: 0, facing: 1 });
  const dash = useRef<DashState>(NO_DASH);
  const turn = useRef({ from: 0, to: 0, elapsed: TURN_SECONDS });
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
    walker.current = stepWalker(previous, sidePush(pushed ?? STILL), isDashing, delta, STAGE);
    const { x, velocity, facing } = walker.current;

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
    const cameraX =
      camera.position.x + (x * CAMERA_FOLLOW - camera.position.x) * Math.min(1, delta * 3);
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
};

// The paper world, seen from the side.
export function PaperScene({ input, webglUnavailable }: Props) {
  return (
    <Canvas
      camera={{ fov: FIELD_OF_VIEW, near: 0.1, far: 200, position: [0, 3.7, MIN_CAMERA_DISTANCE] }}
      dpr={[1, 2]}
      // The drawings keep their own colours, without the tone mapping meant for lit 3D scenes.
      flat
      fallback={<p className="p-4 text-center">{webglUnavailable}</p>}
    >
      <ambientLight intensity={1.6} color="#fff4e4" />
      <directionalLight position={[-4, 8, 10]} intensity={1.2} />
      <Stage />
      <Pip input={input} />
    </Canvas>
  );
}
