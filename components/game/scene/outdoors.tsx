// What the outside places share: street lamps, trees and grass swaying in the wind, the hills, and
// the kitten's hiding places.

import { useFrame } from '@react-three/fiber';
import { type ReactNode, useContext, useMemo, useRef } from 'react';
import { AdditiveBlending, type Group, type MeshBasicMaterial, type Texture } from 'three';
import { HIDING_SPOTS, type SidePlaceId } from '@/game/world/side-rooms';
import { lampLightAt } from '@/game/world/sky';
import { drawShadowBlob } from '../art/bedroom';
import { cutOut } from '../art/core';
import { drawHidingProp, HIDING_PROP_SIZE } from '../art/hiding-spots';
import { drawLampGlow, drawStreetLamp, LAMP_DRAWINGS, type LampStyle } from '../art/park';
import { GLOW_ORDER, nowMinute, SkyClockContext, useEasing } from './sky';
import { CutOut, FloorShadow, Furniture, texture } from './stage';

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
  const { offset, weather } = useContext(SkyClockContext);
  const drawing = LAMP_DRAWINGS[style];
  const width = (height * drawing.width) / drawing.height;
  const lightX = x - width / 2 + width * drawing.lightX;
  const lightY = height * (1 - drawing.lightY);
  const halo = useRef<MeshBasicMaterial>(null);
  const pool = useRef<MeshBasicMaterial>(null);
  const easing = useEasing();
  useFrame((_, delta) => {
    const lamps = lampLightAt(nowMinute(offset), weather);
    const share = easing(delta, 2);
    for (const material of [halo.current, pool.current]) {
      if (material) {
        const goal = material === pool.current ? lamps * 0.55 : lamps;
        material.opacity += (goal - material.opacity) * share;
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

export const HILL_ROWS = [
  { z: -7, color: '#9cc6a6', hatch: '#6e9e7a', bumps: 7, height: 3.6, seed: 1 },
  { z: -5.5, color: '#78ae6c', hatch: '#4e8448', bumps: 8, height: 2.8, seed: 2 },
  { z: -4, color: '#579552', hatch: '#3b7238', bumps: 9, height: 1.8, seed: 3 },
];

const WIND_SWAY = 0.025;

// The street lamps along each place outside, between the buildings and the path, so that Pip
// walks in front of them: cast-iron lanterns in the village and the park, slim poles in the city.
const LAMP_Z = -0.25;
const LAMP_HEIGHTS: Record<LampStyle, number> = { classic: 3.3, modern: 4.2 };
export function Lamps({ style, xs }: { style: LampStyle; xs: readonly number[] }) {
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
export function Swaying({
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
export function SwayingTree({
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

// The places where Mme Ronron's kitten can hide, along a place: drawn there every day, whether or
// not he hides behind one.
export function HidingProps({ place, shadow }: { place: SidePlaceId; shadow: Texture }) {
  const textures = useMemo(
    () =>
      Object.fromEntries(
        (['crates', 'bush', 'flowers', 'log'] as const).map((look, index) => [
          look,
          texture(
            cutOut(
              HIDING_PROP_SIZE.width,
              HIDING_PROP_SIZE.height,
              drawHidingProp(look),
              7,
              250 + index,
            ),
          ),
        ]),
      ) as Record<(typeof HIDING_SPOTS)[number]['look'], Texture>,
    [],
  );
  return (
    <>
      {HIDING_SPOTS.filter((spot) => spot.place === place).map(({ id, x, look }) => (
        <Furniture key={id} map={textures[look]} x={x} z={-0.35} height={1.05} shadow={shadow} />
      ))}
    </>
  );
}
