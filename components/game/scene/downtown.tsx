// The big city's street, its towers, and Maison Éventail, Ramen Yuzu and the dojo between them.

import { type RefObject, useMemo } from 'react';
import {
  DOWNTOWN_BACK_TOWERS,
  DOWNTOWN_ENDS,
  DOWNTOWN_SPOTS,
  DOWNTOWN_TOWERS,
} from '@/game/world/side-rooms';
import { drawCorrugatedEdge, drawShadowBlob } from '../art/bedroom';
import { drawBoutiqueFront } from '../art/boutique';
import { drawBusShelter } from '../art/bus';
import { cutOut } from '../art/core';
import { drawDojo } from '../art/dojo';
import { drawBureauTower, drawPavement, drawTower } from '../art/downtown';
import { BRUTUS_SIZE, drawBrutus } from '../art/office';
import { drawPhotographer, PHOTOGRAPHER_SIZE } from '../art/photos';
import { drawRamenShop } from '../art/ramen';
import { HidingProps, Lamps } from './outdoors';
import { LiveCloud, SkyGradient, useSkyTextures } from './sky';
import {
  blinker,
  Character,
  CutOut,
  DioramaTable,
  Furniture,
  PIXELS_PER_UNIT,
  type SceneSigns,
  type SpeakerTops,
  SpeakerTopsOf,
  STREET_FRONT_Z,
  texture,
  useFontsReady,
} from './stage';

const DOWNTOWN_LAMPS = [-7.2, -2, 4.4, 9.2, 14.2, 19.2, 25.8, 30.4, 38];

const DOWNTOWN_TOWERS_Z = -1.6;
const DOWNTOWN_BACK_TOWERS_Z = -5;

// Downtown: a modern pavement under towers so tall that they rise out of sight, with a farther row
// fading into the haze behind them.
export function Downtown({
  signs,
  speakerTops,
}: {
  signs: SceneSigns;
  speakerTops: RefObject<SpeakerTops>;
}) {
  const fontsReady = useFontsReady();
  const { busStop } = DOWNTOWN_SPOTS;
  const staticTextures = useMemo(
    () => ({
      pavement: texture(drawPavement()),
      edge: texture(drawCorrugatedEdge()),
      shadow: texture(drawShadowBlob()),
      towers: DOWNTOWN_TOWERS.map(({ width, height, look: towerLook }, index) =>
        texture(
          cutOut(
            Math.round(width * PIXELS_PER_UNIT),
            Math.round(height * PIXELS_PER_UNIT),
            drawTower(towerLook),
            9,
            140 + index,
          ),
        ),
      ),
      backTowers: DOWNTOWN_BACK_TOWERS.map(({ width, height, look: towerLook }, index) =>
        texture(
          cutOut(
            Math.round(width * PIXELS_PER_UNIT),
            Math.round(height * PIXELS_PER_UNIT),
            drawTower(towerLook, true),
            8,
            150 + index,
          ),
        ),
      ),
    }),
    [],
  );
  const skyTextures = useSkyTextures();
  const textures = staticTextures;
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const shelter = useMemo(
    () => texture(cutOut(360, 320, drawBusShelter(signs.downtownStop), 9, 160)),
    [fontsReady, signs.downtownStop],
  );
  const { bureau } = DOWNTOWN_SPOTS;
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const bureauTower = useMemo(
    () =>
      texture(
        cutOut(
          Math.round(bureau.width * PIXELS_PER_UNIT),
          Math.round(bureau.height * PIXELS_PER_UNIT),
          drawBureauTower(signs.bureau),
          9,
          161,
        ),
      ),
    [fontsReady, signs.bureau, bureau.width, bureau.height],
  );
  const brutus = useMemo(
    () => texture(cutOut(BRUTUS_SIZE.width, BRUTUS_SIZE.height, drawBrutus, 9, 162)),
    [],
  );
  const photographer = useMemo(
    () => blinker(PHOTOGRAPHER_SIZE.width, PHOTOGRAPHER_SIZE.height, drawPhotographer, 9, 163),
    [],
  );
  const { ramen } = DOWNTOWN_SPOTS;
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const ramenShop = useMemo(
    () =>
      texture(
        cutOut(
          Math.round(ramen.width * PIXELS_PER_UNIT),
          Math.round(ramen.height * PIXELS_PER_UNIT),
          drawRamenShop(signs.ramen),
          9,
          163,
        ),
      ),
    [fontsReady, signs.ramen, ramen.width, ramen.height],
  );
  const { boutique } = DOWNTOWN_SPOTS;
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const boutiqueFront = useMemo(
    () =>
      texture(
        cutOut(
          Math.round(boutique.width * PIXELS_PER_UNIT),
          Math.round(boutique.height * PIXELS_PER_UNIT),
          drawBoutiqueFront(signs.boutique),
          9,
          238,
        ),
      ),
    [fontsReady, signs.boutique, boutique.width, boutique.height],
  );
  const { dojo } = DOWNTOWN_SPOTS;
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const dojoFront = useMemo(
    () =>
      texture(
        cutOut(
          Math.round(dojo.width * PIXELS_PER_UNIT),
          Math.round(dojo.height * PIXELS_PER_UNIT),
          drawDojo(signs.dojo),
          9,
          164,
        ),
      ),
    [fontsReady, signs.dojo, dojo.width, dojo.height],
  );
  const width = DOWNTOWN_ENDS.right - DOWNTOWN_ENDS.left + 20;
  const center = (DOWNTOWN_ENDS.left + DOWNTOWN_ENDS.right) / 2;
  return (
    <>
      <SkyGradient
        position={[center, 7, -10]}
        width={width + 70}
        height={40}
        starsMap={skyTextures.stars}
      />
      {[
        [-14, 8.5, 1.4],
        [6, 9.4, 1.7],
        [20, 7.8, 1.2],
      ].map(([cloudX, cloudY, size], index) => (
        <group key={cloudX} position={[center + cloudX, cloudY, -8]}>
          <LiveCloud map={skyTextures.cloud} height={size} rank={index} />
        </group>
      ))}
      {DOWNTOWN_BACK_TOWERS.map(({ x, height }, index) => (
        <group key={x} position={[x, 0, DOWNTOWN_BACK_TOWERS_Z]}>
          <CutOut map={textures.backTowers[index]} height={height} />
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center, 0, -1]}>
        <planeGeometry args={[width, 8]} />
        <meshBasicMaterial map={textures.pavement} />
      </mesh>
      <DioramaTable center={center} width={width} />
      <mesh position={[center, -0.18, STREET_FRONT_Z]}>
        <boxGeometry args={[width, 0.36, 0.14]} />
        <meshBasicMaterial map={textures.edge} />
      </mesh>
      {DOWNTOWN_TOWERS.map(({ x, height }, index) => (
        <Furniture
          key={x}
          map={textures.towers[index]}
          x={x}
          z={DOWNTOWN_TOWERS_Z}
          height={height}
          shadow={textures.shadow}
        />
      ))}
      <Lamps style="modern" xs={DOWNTOWN_LAMPS} />
      <Furniture map={shelter} x={busStop.x} z={-0.7} height={3} shadow={textures.shadow} />
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[
          { interaction: 'brutus', map: brutus, height: BRUTUS_HEIGHT, z: -0.6 },
          {
            interaction: 'photographer',
            map: photographer.open,
            height: PHOTOGRAPHER_HEIGHT,
            z: -0.6,
          },
        ]}
      />
      <Furniture
        map={bureauTower}
        x={bureau.x}
        z={DOWNTOWN_TOWERS_Z}
        height={bureau.height}
        shadow={textures.shadow}
      />
      {/* Ramen Yuzu, low between two towers. */}
      <Furniture
        map={ramenShop}
        x={ramen.x}
        z={DOWNTOWN_TOWERS_Z + 0.2}
        height={ramen.height}
        shadow={textures.shadow}
      />
      {/* Maison Éventail, between the bureau and Flash. */}
      <Furniture
        map={boutiqueFront}
        x={boutique.x}
        z={DOWNTOWN_TOWERS_Z + 0.2}
        height={boutique.height}
        shadow={textures.shadow}
      />
      {/* The dojo, past the last tower. */}
      <Furniture
        map={dojoFront}
        x={dojo.x}
        z={DOWNTOWN_TOWERS_Z + 0.2}
        height={dojo.height}
        shadow={textures.shadow}
      />
      {/* Brutus, by the bureau's door. His dark glasses hide his eyes, so he never blinks. */}
      <Character
        map={brutus}
        x={bureau.brutusX}
        z={-0.6}
        height={BRUTUS_HEIGHT}
        shadow={textures.shadow}
      />
      {/* Flash, photographing the sky. */}
      <Character
        map={photographer.open}
        blinks={photographer}
        x={DOWNTOWN_SPOTS.photographer.x}
        z={-0.6}
        height={PHOTOGRAPHER_HEIGHT}
        shadow={textures.shadow}
      />
      <HidingProps place="downtown" shadow={textures.shadow} />
    </>
  );
}

const BRUTUS_HEIGHT = 2.9;
const PHOTOGRAPHER_HEIGHT = 2.7;
