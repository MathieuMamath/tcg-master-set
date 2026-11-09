// The administrative office's floor, where Mme Hulotte and Bastien work.

import { useFrame } from '@react-three/fiber';
import { type RefObject, useContext, useMemo, useRef } from 'react';
import { Color, type MeshBasicMaterial, type Texture } from 'three';
import { ARCHIVIST_X, BUREAU_FURNITURE, BUREAU_WALLS, HULOTTE_X } from '@/game/world/side-rooms';
import { lampLightAt, mixColors, worldTintAt } from '@/game/world/sky';
import { drawShadowBlob } from '../art/bedroom';
import { cutOut, paint } from '../art/core';
import {
  ARCHIVIST_SIZE,
  drawArchivist,
  drawDashboard,
  drawElevator,
  drawHulotte,
  drawModernDesk,
  drawModernSofa,
  drawOfficeFloor,
  drawOfficeWall,
  drawPanoramaCity,
  drawPanoramaFrame,
  drawPanoramaLights,
  drawTallPlant,
  HULOTTE_SIZE,
} from '../art/office';
import { drawStarField } from '../art/street';
import { nowMinute, SkyClockContext, SkyGradient, useEasing } from './sky';
import {
  blinker,
  Character,
  DOOR_HEIGHT,
  DOOR_WIDTH,
  Furniture,
  PIXELS_PER_UNIT,
  RoomShell,
  type SpeakerTops,
  SpeakerTopsOf,
  texture,
  WALL_Z,
} from './stage';

const HULOTTE_HEIGHT = 2.8;
const ARCHIVIST_HEIGHT = 2.6;
const HULOTTE_Z = -0.9;

// The office's window onto the big city: the live sky behind the towers, the towers darkening with
// the evening and the night as outside, their windows lighting up after dusk, and the window's frame
// over it all.
function CityWindow({
  x,
  width,
  textures,
}: {
  x: number;
  width: number;
  textures: { city: Texture; lights: Texture; frame: Texture; stars: Texture };
}) {
  const { offset, weather } = useContext(SkyClockContext);
  const city = useRef<MeshBasicMaterial>(null);
  const lights = useRef<MeshBasicMaterial>(null);
  const target = useMemo(() => new Color(), []);
  const easing = useEasing();
  useFrame((_, delta) => {
    const minute = nowMinute(offset);
    const tint = worldTintAt(minute, weather);
    const share = easing(delta);
    city.current?.color.lerp(target.set(mixColors('#ffffff', tint.color, tint.strength)), share);
    if (lights.current) {
      const goal = lampLightAt(minute, weather);
      lights.current.opacity += (goal - lights.current.opacity) * share;
      lights.current.visible = lights.current.opacity > 0.01;
    }
  });
  const height = 2.6;
  const y = 2.1;
  return (
    <>
      <SkyGradient
        position={[x, y, WALL_Z + 0.004]}
        width={width}
        height={height}
        starsMap={textures.stars}
      />
      <mesh position={[x, y, WALL_Z + 0.012]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial ref={city} map={textures.city} transparent depthWrite={false} />
      </mesh>
      <mesh position={[x, y, WALL_Z + 0.014]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          ref={lights}
          map={textures.lights}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[x, y, WALL_Z + 0.016]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={textures.frame} transparent depthWrite={false} />
      </mesh>
    </>
  );
}

// The administrative office, high in its tower: white walls and a polished floor, a window onto the
// big city with a sofa before it, a wall screen of dashboards, plants, and Mme Hulotte behind her
// white desk.
export function Bureau({ speakerTops }: { speakerTops: RefObject<SpeakerTops> }) {
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
            (drawing, width, height) => drawElevator(drawing, width, height, 'up'),
            163,
          ),
        ),
      },
      shadow: texture(drawShadowBlob()),
      view: {
        city: texture(paint(Math.round(view.width * PIXELS_PER_UNIT), 260, drawPanoramaCity, 164)),
        lights: texture(
          paint(Math.round(view.width * PIXELS_PER_UNIT), 260, drawPanoramaLights, 177),
        ),
        frame: texture(
          paint(Math.round(view.width * PIXELS_PER_UNIT), 260, drawPanoramaFrame, 178),
        ),
        stars: texture(drawStarField()),
      },
      screen: texture(paint(Math.round(screen.width * PIXELS_PER_UNIT), 130, drawDashboard, 165)),
      desk: texture(cutOut(320, 200, drawModernDesk, 9, 166)),
      plant: texture(cutOut(140, 300, drawTallPlant, 8, 168)),
      sofa: texture(cutOut(340, 150, drawModernSofa, 9, 169)),
      hulotte: blinker(HULOTTE_SIZE.width, HULOTTE_SIZE.height, drawHulotte, 9, 167),
      archivist: blinker(ARCHIVIST_SIZE.width, ARCHIVIST_SIZE.height, drawArchivist, 9, 179),
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
          {
            interaction: 'archivist',
            map: textures.archivist.open,
            height: ARCHIVIST_HEIGHT,
            z: HULOTTE_Z,
          },
        ]}
      />
      {/* The window, floor to ceiling, onto the city under the live sky, and the wall screen. */}
      <CityWindow x={view.x} width={view.width} textures={textures.view} />
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
      {/* Bastien, the archivist, by the wall screen. */}
      <Character
        map={textures.archivist.open}
        blinks={textures.archivist}
        x={ARCHIVIST_X}
        z={HULOTTE_Z}
        height={ARCHIVIST_HEIGHT}
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
