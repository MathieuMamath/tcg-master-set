// Pip, walking, dashing and going through doors, with the camera that follows him.

import { useFrame, useThree } from '@react-three/fiber';
import { type RefObject, useMemo, useRef } from 'react';
import { type Group, type Mesh, type MeshBasicMaterial, Vector3 } from 'three';
import type { AvatarSpecies } from '@/game/avatar/species';
import { type Stain, stainAlong } from '@/game/quests/quests';
import { type DashState, NO_DASH, tickDash } from '@/game/world/dash';
import { STILL } from '@/game/world/movement';
import { exitAlong, interactionAlong, type SideRoom, speakerAlong } from '@/game/world/side-rooms';
import {
  cameraX as cameraTarget,
  type Facing,
  sidePush,
  stepWalker,
  WALKING_SPEED,
  type Walker,
} from '@/game/world/side-walk';
import type { PlayerSpot } from '@/game/world/spot';
import type { Interaction } from '@/game/world/world';
import { drawShadowBlob } from '../art/bedroom';
import { pipAs } from '../art/pip';
import { createPaperBalls, emitPaperBall, PaperBalls } from './paper-balls';
import {
  blinker,
  breathe,
  CutOut,
  easeBack,
  MAX_FRAME_SECONDS,
  type MovementInput,
  type SpeakerTops,
  type Travel,
  texture,
  useBlink,
} from './stage';

const PIP_Z = 1.25;
const PIP_HEIGHT = 1.75;
const LOOK_HEIGHT = 2;
export const FIELD_OF_VIEW = 28;
// The width of the world the camera keeps in view, wider on a landscape screen.
const VIEW_WIDTH_WIDE = 11.5;
const VIEW_WIDTH_TALL = 8;
export const MIN_CAMERA_DISTANCE = 17;
const TURN_SECONDS = 0.34;
// The speech bubble floats this far above the top of a character's head.
const BUBBLE_GAP = 0.12;

const WALK_BOUNCE = 0.14;
const BALL_INTERVAL_SECONDS = 0.05;
const FIRST_BALLS = 3;

export function Pip({
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
  species,
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
  // The animal the player walks about as.
  species: AvatarSpecies;
}) {
  const pip = useMemo(() => blinker(240, 300, pipAs(species), 10, 21), [species]);
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
