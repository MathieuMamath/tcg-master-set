'use client';

import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { type RefObject, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  type AnimationAction,
  AnimationClip,
  AnimationMixer,
  type Group,
  MathUtils,
  type Mesh,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BEDROOM, BEDROOM_START } from '@/game/bedroom';
import {
  type CharacterState,
  cameraDistanceFactor,
  cameraFocusRadius,
  type Direction,
  type FocusPoint,
  faceTowards,
  followFocus,
  STILL,
} from '@/game/movement';
import { PLACES } from '@/game/places';
import {
  type Arrival,
  type Exit,
  exitAt,
  type Interaction,
  interactionAt,
  npcInReach,
  type Place as PlaceData,
  stepInPlace,
} from '@/game/world';
import { Place, type ShopSigns } from './place';

export type MovementInput = {
  keyboard: Direction;
  joystick: Direction;
};

const CHARACTER_MODEL = '/models/characters/character-male-a.glb';
const CAMERA_OFFSET = { x: 0, y: 5.6, z: 6.4 };
const CAMERA_LOOK_HEIGHT = 0.3;
const ANIMATION_FADE_SECONDS = 0.15;
// Matches the duration-300 class on the overlay.
const PLACE_FADE_MILLISECONDS = 300;
// A long pause in the tab must not teleport the character.
const MAX_FRAME_SECONDS = 0.1;
// During a conversation the camera moves closer, framing the two characters above the dialog.
const TALK_CAMERA_DISTANCE = 0.6;
const TALK_FOCUS_TOWARDS_CAMERA = 0.75;
const TALK_CAMERA_SPEED = 4;

type InputProps = {
  input: RefObject<MovementInput>;
};

type CharacterProps = InputProps & {
  place: PlaceData;
  arrival: Arrival;
  onExit: (exit: Exit) => void;
  onInteractionChange: (interaction: Interaction | null) => void;
  isTalking: boolean;
};

function Character({
  input,
  place,
  arrival,
  onExit,
  onInteractionChange,
  isTalking,
}: CharacterProps) {
  const gltf = useLoader(GLTFLoader, CHARACTER_MODEL);
  const root = useRef<Group>(null);
  const state = useRef<CharacterState>({ ...arrival, isMoving: false });
  const focus = useRef<FocusPoint>(place.cameraStart);
  const hasLeft = useRef(false);
  const interaction = useRef<Interaction | null>(null);
  const closeUp = useRef(0);
  const camera = useThree((three) => three.camera);
  const viewport = useThree((three) => three.viewport);

  const { mixer, idle, walk } = useMemo(() => {
    const mixer = new AnimationMixer(gltf.scene);
    const action = (name: string): AnimationAction => {
      const clip = AnimationClip.findByName(gltf.animations, name);
      if (!clip) {
        throw new Error(`Animation "${name}" is missing from ${CHARACTER_MODEL}`);
      }
      return mixer.clipAction(clip);
    };
    gltf.scene.traverse((node) => {
      node.castShadow = (node as Mesh).isMesh === true;
    });
    return { mixer, idle: action('idle'), walk: action('walk') };
  }, [gltf]);

  useEffect(() => {
    idle.play();
    return () => {
      mixer.stopAllAction();
    };
  }, [idle, mixer]);

  useEffect(() => () => onInteractionChange(null), [onInteractionChange]);

  useFrame((_, frameSeconds) => {
    const delta = Math.min(frameSeconds, MAX_FRAME_SECONDS);
    const { keyboard, joystick } = input.current;
    const pushed = joystick.x !== 0 || joystick.z !== 0 ? joystick : keyboard;
    const direction = hasLeft.current ? STILL : pushed;
    const wasMoving = state.current.isMoving;

    const npc = npcInReach(place, state.current);
    state.current =
      isTalking && npc
        ? faceTowards(state.current, npc, delta)
        : stepInPlace(place, state.current, direction, delta);
    const { x, z, heading, isMoving } = state.current;

    const exit = exitAt(place, state.current);
    if (exit && !hasLeft.current) {
      hasLeft.current = true;
      onExit(exit);
    }

    const available = interactionAt(place, state.current);
    if (available !== interaction.current) {
      interaction.current = available;
      onInteractionChange(available);
    }

    if (isMoving !== wasMoving) {
      const [from, to] = isMoving ? [idle, walk] : [walk, idle];
      to.reset().play();
      from.crossFadeTo(to, ANIMATION_FADE_SECONDS, false);
    }
    mixer.update(delta);

    root.current?.position.set(x, place.groundHeight, z);
    root.current?.rotation.set(0, heading, 0);

    focus.current = followFocus(
      focus.current,
      { x, z },
      cameraFocusRadius(viewport.aspect, place.fitsOnScreen),
    );
    const distance = cameraDistanceFactor(viewport.aspect);
    closeUp.current = MathUtils.damp(closeUp.current, isTalking ? 1 : 0, TALK_CAMERA_SPEED, delta);
    const talkFocus = npc ?? focus.current;
    const lookX = MathUtils.lerp(focus.current.x, (talkFocus.x + x) / 2, closeUp.current);
    const lookZ = MathUtils.lerp(
      focus.current.z,
      (talkFocus.z + z) / 2 + TALK_FOCUS_TOWARDS_CAMERA,
      closeUp.current,
    );
    const zoom = distance * MathUtils.lerp(1, TALK_CAMERA_DISTANCE, closeUp.current);
    camera.position.set(
      lookX + CAMERA_OFFSET.x * zoom,
      CAMERA_OFFSET.y * zoom,
      lookZ + CAMERA_OFFSET.z * zoom,
    );
    camera.lookAt(lookX, CAMERA_LOOK_HEIGHT, lookZ);
  });

  return <primitive ref={root} object={gltf.scene} />;
}

type SceneProps = InputProps & {
  webglUnavailable: string;
  onInteractionChange: (interaction: Interaction | null) => void;
  isTalking: boolean;
  shopSigns: ShopSigns;
};

export function Scene({
  input,
  webglUnavailable,
  onInteractionChange,
  isTalking,
  shopSigns,
}: SceneProps) {
  const [visit, setVisit] = useState({ number: 0, place: BEDROOM, arrival: BEDROOM_START });
  const [isFading, setIsFading] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(fadeTimer.current), []);

  const leaveThrough = (exit: Exit) => {
    setIsFading(true);
    fadeTimer.current = setTimeout(() => {
      setVisit(({ number }) => ({
        number: number + 1,
        place: PLACES[exit.to],
        arrival: exit.arrival,
      }));
      setIsFading(false);
    }, PLACE_FADE_MILLISECONDS);
  };

  return (
    <>
      <Canvas
        shadows
        camera={{ fov: 45, position: [CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z] }}
        dpr={[1, 2]}
        fallback={<p className="p-4 text-center">{webglUnavailable}</p>}
      >
        <ambientLight intensity={0.9} />
        <directionalLight
          castShadow
          position={[3, 7, 4]}
          intensity={1.8}
          shadow-mapSize={[2048, 2048]}
          shadow-normalBias={0.03}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <Suspense fallback={null}>
          <group key={visit.number}>
            <Place place={visit.place} signs={shopSigns} />
            <Character
              input={input}
              place={visit.place}
              arrival={visit.arrival}
              onExit={leaveThrough}
              onInteractionChange={onInteractionChange}
              isTalking={isTalking}
            />
          </group>
        </Suspense>
      </Canvas>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-300 ${
          isFading ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
}
