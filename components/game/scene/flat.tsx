// Léa's flat, whose walls Pip dusts.

import { useFrame } from '@react-three/fiber';
import { type RefObject, useMemo, useRef } from 'react';
import type { Mesh, MeshBasicMaterial, Texture } from 'three';
import { SCRUBS_PER_STAIN, type Stain } from '@/game/quests/quests';
import { FLAT_FURNITURE, FLAT_WALLS, FLAT_WINDOW_X, LEA_X } from '@/game/world/side-rooms';
import { drawBookcase, drawPlanks, drawShadowBlob, drawWallpaper } from '../art/bedroom';
import { cutOut, paint } from '../art/core';
import { drawDust, drawFrame, drawLea, drawSofa, drawSweatDrop, LEA_SIZE } from '../art/lea';
import { SkyWindow } from './sky';
import {
  Character,
  CutOut,
  doorTexture,
  Furniture,
  RoomShell,
  type SpeakerTops,
  SpeakerTopsOf,
  texture,
  WALL_Z,
} from './stage';

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
export function Flat({
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
