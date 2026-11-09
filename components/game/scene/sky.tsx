// The sky, outside and through windows: its colours and clouds following the game's clock and
// weather, and the light laid over the world at dawn, dusk and night.

import { useFrame } from '@react-three/fiber';
import { createContext, useContext, useMemo, useRef, useState } from 'react';
import {
  Color,
  Float32BufferAttribute,
  type Mesh,
  type MeshBasicMaterial,
  MultiplyBlending,
  PlaneGeometry,
  RepeatWrapping,
  type Texture,
  Vector3,
} from 'three';
import { exactMinuteOfDay, type Weather } from '@/game/world/clock';
import { mixColors, skyAt, skyLook, worldTintAt } from '@/game/world/sky';
import { drawWindowClouds, drawWindowFrame } from '../art/bedroom';
import { cutOut } from '../art/core';
import { drawCloud, drawStarField } from '../art/street';
import {
  CutOut,
  PIXELS_PER_UNIT,
  SKY_SHOWN,
  texture,
  WALL_Z,
  WINDOW,
  WINDOW_FRAME,
  WINDOW_MARGIN,
  WINDOW_SILL,
} from './stage';

// The game's clock as this player sees it, moved on by their sleeps, and the weather of the moment:
// the sky, the light and the lamps follow them smoothly, frame by frame.
export type SkyClock = { offset: number; weather: Weather };
export const SkyClockContext = createContext<SkyClock>({ offset: 0, weather: 'fewClouds' });
// How fast the sky and the light catch up with a change of weather, in shares of the way per
// second: a few seconds, rather than all at once. The time of day itself moves on continuously.
const WEATHER_EASING = 0.35;

// The share of the way to go this frame: eased, or all of it when the clock has just jumped on,
// after a night's sleep, behind the sleep screen.
export function useEasing() {
  const { offset } = useContext(SkyClockContext);
  const lastOffset = useRef(offset);
  return (delta: number, speed = 1) => {
    if (lastOffset.current !== offset) {
      lastOffset.current = offset;
      return 1;
    }
    return Math.min(1, delta * WEATHER_EASING * speed);
  };
}

export function nowMinute(offset: number): number {
  return exactMinuteOfDay(Date.now(), offset);
}

type LiveSky = {
  top: Color;
  horizon: Color;
  cloud: Color;
  stars: number;
  drift: number;
  cloudCount: number;
};

// The sky of this very moment, kept up to date every frame and eased towards a new weather.
export function useLiveSky(): LiveSky {
  const { offset, weather } = useContext(SkyClockContext);
  const live = useRef<LiveSky | null>(null);
  if (!live.current) {
    const sky = skyAt(nowMinute(offset), weather);
    const look = skyLook('day', weather);
    live.current = {
      top: new Color(sky.top),
      horizon: new Color(sky.horizon),
      cloud: new Color(sky.cloud),
      stars: sky.stars,
      drift: look.drift,
      cloudCount: look.cloudCount,
    };
  }
  const target = useMemo(
    () => ({ top: new Color(), horizon: new Color(), cloud: new Color() }),
    [],
  );
  const easing = useEasing();
  useFrame((_, delta) => {
    const current = live.current;
    if (!current) {
      return;
    }
    const sky = skyAt(nowMinute(offset), weather);
    const look = skyLook('day', weather);
    const share = easing(delta);
    current.top.lerp(target.top.set(sky.top), share);
    current.horizon.lerp(target.horizon.set(sky.horizon), share);
    current.cloud.lerp(target.cloud.set(sky.cloud), share);
    current.stars += (sky.stars - current.stars) * share;
    current.drift += (look.drift - current.drift) * share;
    current.cloudCount += (look.cloudCount - current.cloudCount) * share;
  });
  return live.current;
}

// A plane coloured from top to bottom by the live sky, with its stars faded in over it at night.
export function SkyGradient({
  position,
  width,
  height,
  starsMap,
}: {
  position: [number, number, number];
  width: number;
  height: number;
  starsMap: Texture;
}) {
  const sky = useLiveSky();
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(width, height);
    plane.setAttribute('color', new Float32BufferAttribute(new Float32Array(12), 3));
    return plane;
  }, [width, height]);
  const stars = useRef<MeshBasicMaterial>(null);
  useFrame(() => {
    const colors = geometry.getAttribute('color');
    // The plane's two top corners take the top colour, and its two bottom ones the horizon.
    [sky.top, sky.top, sky.horizon, sky.horizon].forEach((color, corner) => {
      colors.setXYZ(corner, color.r, color.g, color.b);
    });
    colors.needsUpdate = true;
    if (stars.current) {
      stars.current.opacity = sky.stars;
      stars.current.visible = sky.stars > 0.01;
    }
  });
  return (
    <>
      <mesh position={position} geometry={geometry}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </mesh>
      <mesh position={[position[0], position[1], position[2] + 0.01]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          ref={stars}
          map={starsMap}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

// A cloud of the live sky: tinted with it, and faded in or out as the weather brings more clouds
// or fewer. `rank` orders the clouds, the first ones always shown.
export function LiveCloud({ map, height, rank }: { map: Texture; height: number; rank: number }) {
  const sky = useLiveSky();
  const material = useRef<MeshBasicMaterial>(null);
  const image = map.image as HTMLCanvasElement;
  const width = (height * image.width) / image.height;
  useFrame((_, delta) => {
    if (!material.current) {
      return;
    }
    material.current.color.copy(sky.cloud);
    const shown = rank < sky.cloudCount + 1.5 ? 1 : 0;
    material.current.opacity +=
      (shown - material.current.opacity) * Math.min(1, delta * WEATHER_EASING * 2);
    material.current.visible = material.current.opacity > 0.01;
  });
  return (
    <mesh position={[0, height / 2, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        ref={material}
        map={map}
        transparent
        alphaTest={0.02}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// The textures every outdoor sky shares: its stars, and a white cloud for the sky to tint.
export function useSkyTextures() {
  return useMemo(
    () => ({
      stars: texture(drawStarField()),
      cloud: texture(cutOut(300, 190, drawCloud('#ffffff'), 9, 63)),
    }),
    [],
  );
}

// Drawn after the world and before the lamps' halos, so that the night darkens everything but them.
const VEIL_ORDER = 10;
export const GLOW_ORDER = 11;

// The light of the time of day, laid over the whole view by multiplying its colours, just in front
// of the camera. It follows the clock minute by minute, and eases into a new weather.
export function LightVeil() {
  const { offset, weather } = useContext(SkyClockContext);
  const veil = useRef<Mesh>(null);
  const material = useRef<MeshBasicMaterial>(null);
  const tintOf = () => {
    const tint = worldTintAt(nowMinute(offset), weather);
    return mixColors('#ffffff', tint.color, tint.strength);
  };
  const [first] = useState(tintOf);
  const target = useMemo(() => new Color(), []);
  const ahead = useMemo(() => new Vector3(), []);
  const easing = useEasing();
  useFrame(({ camera }, delta) => {
    if (!veil.current || !material.current) {
      return;
    }
    camera.getWorldDirection(ahead);
    veil.current.position.copy(camera.position).addScaledVector(ahead, 0.2);
    veil.current.quaternion.copy(camera.quaternion);
    material.current.color.lerp(target.set(tintOf()), easing(delta));
  });
  return (
    <mesh ref={veil} renderOrder={VEIL_ORDER} frustumCulled={false}>
      <planeGeometry args={[4, 4]} />
      <meshBasicMaterial
        ref={material}
        color={first}
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

// A double window over the desk, onto the live sky, its clouds drifting by.
export function SkyWindow({ x }: { x: number }) {
  const sky = useLiveSky();
  const layers = useMemo(() => {
    const clouds = texture(drawWindowClouds());
    clouds.wrapS = RepeatWrapping;
    clouds.repeat.set(SKY_SHOWN, 1);
    return { clouds, stars: texture(drawStarField()) };
  }, []);
  const cloudMaterial = useRef<MeshBasicMaterial>(null);
  const frame = useMemo(
    () => texture(cutOut(WINDOW.width, WINDOW.height, drawWindowFrame, 9, 51)),
    [],
  );

  useFrame((_, delta) => {
    layers.clouds.offset.x = (layers.clouds.offset.x + delta * sky.drift) % 1;
    cloudMaterial.current?.color.copy(sky.cloud);
  });

  const frameHeight = (WINDOW.height + WINDOW_MARGIN * 2) / PIXELS_PER_UNIT;
  const openingWidth = (WINDOW.width - WINDOW_FRAME * 2) / PIXELS_PER_UNIT;
  const openingHeight = (WINDOW.height - WINDOW_SILL - WINDOW_FRAME * 2) / PIXELS_PER_UNIT;
  const openingCenterY = WINDOW.centerY + WINDOW_SILL / 2 / PIXELS_PER_UNIT;
  return (
    <>
      <SkyGradient
        position={[x, openingCenterY, WALL_Z + 0.005]}
        width={openingWidth}
        height={openingHeight}
        starsMap={layers.stars}
      />
      <mesh position={[x, openingCenterY, WALL_Z + 0.017]}>
        <planeGeometry args={[openingWidth, openingHeight]} />
        <meshBasicMaterial
          ref={cloudMaterial}
          map={layers.clouds}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
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
