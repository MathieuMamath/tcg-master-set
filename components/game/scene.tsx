'use client';

import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { type RefObject, Suspense, useEffect, useMemo, useRef } from 'react';
import { type AnimationAction, AnimationClip, AnimationMixer, type Group, type Mesh } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  type CharacterState,
  cameraDistanceFactor,
  cameraFocusRadius,
  type Direction,
  type FocusPoint,
  followFocus,
} from '@/game/movement';
import { CHARACTER_START, FLOOR_HEIGHT, stepInRoom } from '@/game/room';
import { Room } from './room';

export type MovementInput = {
  keyboard: Direction;
  joystick: Direction;
};

const CHARACTER_MODEL = '/models/characters/character-male-a.glb';
const CAMERA_OFFSET = { x: 0, y: 5.6, z: 6.4 };
const CAMERA_LOOK_HEIGHT = 0.3;
const ANIMATION_FADE_SECONDS = 0.15;
// A long pause in the tab must not teleport the character.
const MAX_FRAME_SECONDS = 0.1;

type InputProps = {
  input: RefObject<MovementInput>;
};

function Character({ input }: InputProps) {
  const gltf = useLoader(GLTFLoader, CHARACTER_MODEL);
  const root = useRef<Group>(null);
  const state = useRef<CharacterState>(CHARACTER_START);
  const focus = useRef<FocusPoint>({ x: 0, z: 0 });
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

  useFrame((_, frameSeconds) => {
    const delta = Math.min(frameSeconds, MAX_FRAME_SECONDS);
    const { keyboard, joystick } = input.current;
    const direction = joystick.x !== 0 || joystick.z !== 0 ? joystick : keyboard;
    const wasMoving = state.current.isMoving;

    state.current = stepInRoom(state.current, direction, delta);
    const { x, z, heading, isMoving } = state.current;

    if (isMoving !== wasMoving) {
      const [from, to] = isMoving ? [idle, walk] : [walk, idle];
      to.reset().play();
      from.crossFadeTo(to, ANIMATION_FADE_SECONDS, false);
    }
    mixer.update(delta);

    root.current?.position.set(x, FLOOR_HEIGHT, z);
    root.current?.rotation.set(0, heading, 0);

    focus.current = followFocus(focus.current, { x, z }, cameraFocusRadius(viewport.aspect));
    const distance = cameraDistanceFactor(viewport.aspect);
    camera.position.set(
      focus.current.x + CAMERA_OFFSET.x * distance,
      CAMERA_OFFSET.y * distance,
      focus.current.z + CAMERA_OFFSET.z * distance,
    );
    camera.lookAt(focus.current.x, CAMERA_LOOK_HEIGHT, focus.current.z);
  });

  return <primitive ref={root} object={gltf.scene} />;
}

type SceneProps = InputProps & {
  webglUnavailable: string;
};

export function Scene({ input, webglUnavailable }: SceneProps) {
  return (
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
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <Suspense fallback={null}>
        <Room />
        <Character input={input} />
      </Suspense>
    </Canvas>
  );
}
