import { type RefObject, useMemo } from 'react';
import { PARK_ENDS, PARK_SPOTS } from '@/game/world/side-rooms';
import { drawCorrugatedEdge, drawShadowBlob } from '../art/bedroom';
import { drawBusShelter } from '../art/bus';
import { cutOut } from '../art/core';
import { drawEasel, drawPainter, PAINTER_SIZE } from '../art/painter';
import {
  drawBench,
  drawLake,
  drawLucas,
  drawPapy,
  drawParkGround,
  drawPine,
  drawReeds,
  drawTree,
  drawTuft,
  LUCAS_SIZE,
  PAPY_SIZE,
} from '../art/park';
import {
  drawFlowerBeds,
  drawFountain,
  drawGardener,
  drawSortingBins,
  GARDENER_SIZE,
} from '../art/park-games';
import { drawHills } from '../art/street';
import { HILL_ROWS, HidingProps, Lamps, Swaying, SwayingTree } from './outdoors';
import { LiveCloud, SkyGradient, useSkyTextures } from './sky';
import {
  blinker,
  Character,
  CutOut,
  DioramaTable,
  Furniture,
  type SceneSigns,
  type SpeakerTops,
  SpeakerTopsOf,
  STREET_FRONT_Z,
  texture,
  useFontsReady,
} from './stage';

const PARK_LAMPS = [-16.6, -6.2, 4.4, 9.1];
// Trees that overlap never share a depth, or the two drawings fight over the same spot and flicker.
// A wood of round trees and pines along the back of the lawn, the pines mostly further back, and
// more beyond the lake.
const PARK_TREES = [
  { x: -19.8, z: -3.4, height: 5, kind: 'pine', seed: 14 },
  { x: -17.2, z: -3.2, height: 4.2, kind: 'round', seed: 15 },
  { x: -14.4, z: -3.6, height: 4.8, kind: 'pine', seed: 16 },
  { x: -12.2, z: -3, height: 3.8, kind: 'round', seed: 17 },
  { x: -10.4, z: -3.6, height: 5.2, kind: 'pine', seed: 6 },
  { x: -9.2, z: -3, height: 4.2, kind: 'round', seed: 1 },
  { x: -7.8, z: -3.4, height: 4.6, kind: 'pine', seed: 7 },
  { x: -6.2, z: -3.1, height: 3.4, kind: 'round', seed: 8 },
  { x: -4.6, z: -2.6, height: 3.6, kind: 'round', seed: 2 },
  { x: -3.1, z: -3.5, height: 5, kind: 'pine', seed: 9 },
  { x: -1.2, z: -3.2, height: 4.4, kind: 'round', seed: 10 },
  { x: 0.4, z: -3.6, height: 4.8, kind: 'pine', seed: 11 },
  { x: 1.8, z: -2.8, height: 4, kind: 'round', seed: 3 },
  { x: 2.7, z: -3.8, height: 5.4, kind: 'pine', seed: 12 },
  { x: 3.6, z: -3.4, height: 3.4, kind: 'round', seed: 4 },
  { x: 4.6, z: -3.9, height: 4.4, kind: 'pine', seed: 13 },
  // Beyond the lake, on the first hill, their trunks hidden behind it.
  { x: 6.3, z: -4.3, height: 5.6, kind: 'pine', seed: 15 },
  { x: 7.9, z: -4.7, height: 4.8, kind: 'round', seed: 16 },
  { x: 9.4, z: -4.5, height: 6, kind: 'pine', seed: 17 },
  { x: 11, z: -4.85, height: 5.2, kind: 'pine', seed: 18 },
  { x: 12.2, z: -3.6, height: 4.4, kind: 'round', seed: 5 },
  { x: 13.6, z: -3.2, height: 5, kind: 'pine', seed: 14 },
] as const;
// Tufts of grass on the lawn: at the foot of the trees and the bench, never on the lake, and
// along the front edge, in front of Pip.
const PARK_TUFTS = [
  { x: -19.4, z: -1, height: 0.8 },
  { x: -13.6, z: -0.9, height: 0.75 },
  { x: -18.6, z: 2.6, height: 0.8 },
  { x: -14.8, z: 2.7, height: 0.75 },
  { x: -11.6, z: 2.62, height: 0.85 },
  { x: -9.6, z: -1, height: 0.8 },
  { x: -5.2, z: -0.9, height: 0.9 },
  { x: -4.1, z: -1, height: 0.7 },
  { x: 1.2, z: -0.9, height: 0.85 },
  { x: 2.6, z: -1, height: 0.75 },
  { x: 12.9, z: -1, height: 0.8 },
  { x: -9.2, z: 2.6, height: 0.85 },
  { x: -6.8, z: 2.75, height: 0.72 },
  { x: -3.6, z: 2.68, height: 0.95 },
  { x: -2.8, z: 2.6, height: 0.78 },
  { x: 0.4, z: 2.75, height: 0.85 },
  { x: 3.2, z: 2.68, height: 0.72 },
  { x: 5.6, z: 2.6, height: 0.95 },
  { x: 8.3, z: 2.75, height: 0.78 },
  { x: 9.1, z: 2.68, height: 0.85 },
  { x: 11.8, z: 2.6, height: 0.72 },
];
const PAPY_HEIGHT = 2.9;
const LUCAS_HEIGHT = 2.6;
const PARK_PEOPLE_Z = -0.5;
const GARDENER_HEIGHT = 2.5;
const PAINTER_HEIGHT = 2.6;

// The Linden Park: lawns and trees under the sky, Pépin's garden on the far left, the bus stop,
// Papy Caillou by his bench, Pinceau at his easel, and Lucas fishing at the edge of the lake.
export function Park({
  signs,
  speakerTops,
}: {
  signs: SceneSigns;
  speakerTops: RefObject<SpeakerTops>;
}) {
  const fontsReady = useFontsReady();
  const {
    busStop,
    bench,
    papy,
    lake,
    lucas,
    fountain,
    flowerBeds,
    gardener,
    bins,
    painter,
    easel,
  } = PARK_SPOTS;
  const staticTextures = useMemo(
    () => ({
      ground: texture(drawParkGround()),
      lake: texture(drawLake()),
      edge: texture(drawCorrugatedEdge()),
      shadow: texture(drawShadowBlob()),
      hills: HILL_ROWS.map(({ color, hatch, bumps, seed, height }) =>
        texture(
          cutOut(1600, Math.round(height * 100), drawHills(color, hatch, bumps, seed), 8, seed),
        ),
      ),
      trees: PARK_TREES.map(({ kind, seed }) =>
        texture(cutOut(240, 320, kind === 'pine' ? drawPine(seed) : drawTree(seed), 9, 110 + seed)),
      ),
      bench: texture(cutOut(260, 150, drawBench, 8, 116)),
      reeds: texture(cutOut(220, 110, drawReeds, 6, 117)),
      tufts: [1, 2, 3, 4].map((seed) =>
        texture(cutOut(160, 140, drawTuft(seed * 11), 7, 190 + seed)),
      ),
      papy: texture(cutOut(PAPY_SIZE.width, PAPY_SIZE.height, drawPapy, 9, 118)),
      lucas: blinker(LUCAS_SIZE.width, LUCAS_SIZE.height, drawLucas, 9, 119),
      gardener: blinker(GARDENER_SIZE.width, GARDENER_SIZE.height, drawGardener, 9, 230),
      flowerBeds: texture(cutOut(380, 150, drawFlowerBeds, 7, 231)),
      fountain: texture(cutOut(160, 220, drawFountain, 7, 232)),
      bins: texture(cutOut(150, 110, drawSortingBins, 7, 233)),
      painter: blinker(PAINTER_SIZE.width, PAINTER_SIZE.height, drawPainter, 9, 234),
      easel: texture(cutOut(240, 360, drawEasel, 8, 235)),
    }),
    [],
  );
  const skyTextures = useSkyTextures();
  const textures = staticTextures;
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const shelter = useMemo(
    () => texture(cutOut(360, 320, drawBusShelter(signs.parkStop), 9, 120)),
    [fontsReady, signs.parkStop],
  );
  const width = PARK_ENDS.right - PARK_ENDS.left + 20;
  const center = (PARK_ENDS.left + PARK_ENDS.right) / 2;
  const lakeWidth = lake.right - lake.left;
  return (
    <>
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[
          {
            interaction: 'gardener',
            map: textures.gardener.open,
            height: GARDENER_HEIGHT,
            z: PARK_PEOPLE_Z,
          },
          { interaction: 'grandpa', map: textures.papy, height: PAPY_HEIGHT, z: PARK_PEOPLE_Z },
          {
            interaction: 'painter',
            map: textures.painter.open,
            height: PAINTER_HEIGHT,
            z: PARK_PEOPLE_Z,
          },
          { interaction: 'boy', map: textures.lucas.open, height: LUCAS_HEIGHT, z: PARK_PEOPLE_Z },
        ]}
      />
      <SkyGradient
        position={[center, 7, -10]}
        width={width + 70}
        height={26}
        starsMap={skyTextures.stars}
      />
      {[
        [-12, 6.2, 1.4],
        [2, 6.8, 1.6],
        [16, 5.9, 1.2],
      ].map(([cloudX, cloudY, size], index) => (
        <group key={cloudX} position={[center + cloudX, cloudY, -8]}>
          <LiveCloud map={skyTextures.cloud} height={size} rank={index} />
        </group>
      ))}
      {HILL_ROWS.map(({ z, height }, index) => (
        <group key={z} position={[center, -0.15, z]}>
          <CutOut
            map={textures.hills[index]}
            height={(height * 100 + 24) / 100}
            width={width + 30}
          />
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center, 0, -1]}>
        <planeGeometry args={[width, 8]} />
        <meshBasicMaterial map={textures.ground} />
      </mesh>
      {/* The lake, lying behind the path, a little above the lawn so that it covers it. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(lake.left + lake.right) / 2, 0.01, -2.4]}>
        <planeGeometry args={[lakeWidth, 4.4]} />
        <meshBasicMaterial map={textures.lake} />
      </mesh>
      <DioramaTable center={center} width={width} />
      <mesh position={[center, -0.18, STREET_FRONT_Z]}>
        <boxGeometry args={[width, 0.36, 0.14]} />
        <meshBasicMaterial map={textures.edge} />
      </mesh>
      <Lamps style="classic" xs={PARK_LAMPS} />
      {PARK_TREES.map(({ x, z, height }, index) => (
        <SwayingTree
          key={x}
          map={textures.trees[index]}
          x={x}
          z={z}
          height={height}
          phase={index * 1.3}
          shadow={textures.shadow}
        />
      ))}
      {PARK_TUFTS.map(({ x, z, height }, index) => (
        <Swaying key={`${x}-${z}`} x={x} z={z} phase={index * 0.9}>
          <CutOut map={textures.tufts[index % 4]} height={height} />
        </Swaying>
      ))}
      {/* Pépin's garden: the fountain, the flower beds, Pépin, and the sorting bins. */}
      <Furniture
        map={textures.fountain}
        x={fountain.x}
        z={-1.2}
        height={1.9}
        shadow={textures.shadow}
      />
      <Furniture
        map={textures.flowerBeds}
        x={flowerBeds.x}
        z={-1}
        height={1.4}
        shadow={textures.shadow}
      />
      <Character
        map={textures.gardener.open}
        blinks={textures.gardener}
        // The drawing leaves room for the tail on its right, so it moves right to stay centred.
        x={gardener.x + 0.2}
        z={PARK_PEOPLE_Z}
        height={GARDENER_HEIGHT}
        shadow={textures.shadow}
      />
      <Furniture map={textures.bins} x={bins.x} z={-0.9} height={1} shadow={textures.shadow} />
      <Furniture map={shelter} x={busStop.x} z={-0.7} height={3} shadow={textures.shadow} />
      <Furniture map={textures.bench} x={bench.x} z={-1.1} height={1.4} shadow={textures.shadow} />
      <Character
        map={textures.papy}
        // The drawing leaves room for the cane on its right, so it moves right to stay centred.
        x={papy.x + 0.25}
        z={PARK_PEOPLE_Z}
        height={PAPY_HEIGHT}
        shadow={textures.shadow}
      />
      {/* Pinceau, painting the lake at his easel. */}
      <Character
        map={textures.painter.open}
        blinks={textures.painter}
        x={painter.x}
        z={PARK_PEOPLE_Z}
        height={PAINTER_HEIGHT}
        shadow={textures.shadow}
      />
      <Furniture map={textures.easel} x={easel.x} z={-0.7} height={2.2} shadow={textures.shadow} />
      <Swaying x={lake.left + 0.6} z={-0.3} phase={0.4}>
        <CutOut map={textures.reeds} height={1.1} />
      </Swaying>
      <Swaying x={lake.right - 0.8} z={-0.3} phase={2.1}>
        <CutOut map={textures.reeds} height={1.2} />
      </Swaying>
      <Character
        // The drawing leaves room for the rod on its right, so it moves right to stay centred.
        map={textures.lucas.open}
        blinks={textures.lucas}
        x={lucas.x + 0.7}
        z={PARK_PEOPLE_Z}
        height={LUCAS_HEIGHT}
        shadow={textures.shadow}
      />
      <HidingProps place="park" shadow={textures.shadow} />
    </>
  );
}
