// The village street, from Léa's block to the bus stop, with its stands and the big city far behind.

import { useFrame } from '@react-three/fiber';
import { type RefObject, useMemo, useRef } from 'react';
import type { Group } from 'three';
import { TOWN_BUILDINGS, TOWN_ENDS } from '@/game/world/side-rooms';
import { drawArcade } from '../art/arcade';
import { drawCorrugatedEdge, drawShadowBlob } from '../art/bedroom';
import { drawBookshop } from '../art/bookshop';
import { drawBus, drawBusShelter } from '../art/bus';
import { cutOut } from '../art/core';
import { drawDalgonaAwning, drawDalgonaCart, drawGaspard, GASPARD_SIZE } from '../art/dalgona';
import { drawSkyline } from '../art/downtown';
import { drawFlats } from '../art/lea';
import { drawPine, drawTree, drawTuft } from '../art/park';
import { drawPostBooth, drawPostCounter, drawPostman, POSTMAN_SIZE } from '../art/post';
import {
  BERENICE_SIZE,
  drawBalloon,
  drawBerenice,
  drawRaffleBooth,
  drawRaffleCounter,
} from '../art/raffle';
import { drawRonron, RONRON_SIZE } from '../art/ronron';
import { drawHills, drawHouse, drawShop, drawStreet } from '../art/street';
import { HILL_ROWS, HidingProps, Lamps, Swaying, SwayingTree } from './outdoors';
import { LiveCloud, SkyGradient, useLiveSky, useSkyTextures } from './sky';
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

// The clouds drift across the whole street, from one end of this span to the other, around its
// middle.
const CLOUD_SPAN = 84;
const CLOUD_SPEED = 25;
const CLOUDS = [
  { x: -36, y: 5.8, size: 1.65 },
  { x: -22, y: 6.6, size: 2.03 },
  { x: -8, y: 5.6, size: 1.52 },
  { x: 6, y: 6.9, size: 1.91 },
  { x: 20, y: 6, size: 1.65 },
  { x: 34, y: 6.8, size: 1.4 },
];
const BUILDINGS_Z = -1.4;
// Downtown seen from the village, between the sky and the farthest hills.
const SKYLINE = { x: -2, z: -9, width: 26, height: 5.4 };
const BERENICE_HEIGHT = 3.05;
// The booth stands behind Bérénice, and her counter in front, hiding her feet.
const RAFFLE_Z = { booth: -1.1, balloons: -1.15, berenice: -0.85, counter: -0.45 };
const RAFFLE_BOOTH_HEIGHT = 4;
// Where the balloons are tied: the tops of the booth's posts, either side of its middle.
const BALLOONS = [
  { color: '#e8645a', post: -1, offset: -0.12, lean: 0.12, height: 1.6 },
  { color: '#f3c14b', post: -1, offset: 0, lean: -0.05, height: 1.85 },
  { color: '#9a7bd6', post: -1, offset: 0.1, lean: -0.18, height: 1.5 },
  { color: '#3a86c8', post: 1, offset: -0.05, lean: 0.1, height: 1.75 },
  { color: '#5b9c4e', post: 1, offset: 0.1, lean: -0.12, height: 1.55 },
] as const;
const BALLOON_POST = { side: 1.32, y: 3.25 };
// Each balloon a little behind the last, so that overlapping ones never fight for the same
// depth and flicker.
const BALLOON_GAP_Z = 0.03;

// Balloons tied to the stand, swaying on their strings in the breeze, each at its own pace.
function Balloons({ x, z }: { x: number; z: number }) {
  const maps = useMemo(
    () =>
      BALLOONS.map(({ color }, index) =>
        texture(cutOut(70, 230, drawBalloon(color), 5, 130 + index)),
      ),
    [],
  );
  const strings = useRef<(Group | null)[]>([]);
  useFrame(({ clock }) => {
    for (const [index, group] of strings.current.entries()) {
      if (group) {
        const time = clock.elapsedTime * (0.8 + index * 0.13) + index * 1.7;
        group.rotation.z = BALLOONS[index].lean + Math.sin(time) * 0.07;
        group.position.y = BALLOON_POST.y + Math.sin(time * 1.3) * 0.03;
      }
    }
  });
  return (
    <>
      {BALLOONS.map(({ post, offset, height }, index) => (
        <group
          // biome-ignore lint/suspicious/noArrayIndexKey: the balloons never change.
          key={index}
          ref={(group) => {
            strings.current[index] = group;
          }}
          position={[
            x + post * BALLOON_POST.side + offset,
            BALLOON_POST.y,
            z - index * BALLOON_GAP_Z,
          ]}
        >
          <CutOut map={maps[index]} height={height} />
        </group>
      ))}
    </>
  );
}

const GASPARD_HEIGHT = 3.3;
// The awning stands behind Gaspard, and his cart in front, hiding his legs.
const DALGONA_Z = { awning: -1.1, gaspard: -0.85, cart: -0.45 };
const POST_Z = { booth: -1.1, postman: -0.85, counter: -0.45 };
const POSTMAN_HEIGHT = 3.1;
const RONRON_HEIGHT = 2.5;
const RONRON_Z = -0.6;

// The street: a wide sky, rows of hills, our house, Gaspard's stand, the shop and the bookshop.
// The village's greenery, as in the art direction's prototype: trees between and behind the
// buildings, in front of the hills, and tufts of grass with flowers along the street, some at the
// foot of the buildings and some at its front edge, in front of Pip.
const TOWN_TREES = [
  { x: -18.6, z: -2.9, height: 4.6, kind: 'pine', seed: 31 },
  { x: -17.1, z: -3.3, height: 3.7, kind: 'round', seed: 32 },
  { x: -9.6, z: -2.6, height: 3.9, kind: 'round', seed: 33 },
  { x: -8.1, z: -3.2, height: 4.8, kind: 'pine', seed: 34 },
  { x: 8.6, z: -2.7, height: 4.1, kind: 'round', seed: 35 },
  { x: 10.1, z: -3.3, height: 5, kind: 'pine', seed: 36 },
  { x: -1.6, z: -3, height: 4.7, kind: 'round', seed: 39 },
  { x: 16, z: -3.2, height: 5.4, kind: 'pine', seed: 40 },
  { x: 25.8, z: -2.8, height: 3.8, kind: 'round', seed: 37 },
  { x: 37.6, z: -3, height: 4.5, kind: 'pine', seed: 38 },
] as const;
const TOWN_TUFTS = [
  { x: -17.8, z: -1.0, height: 0.8 },
  { x: -16.2, z: -0.9, height: 0.7 },
  { x: -10.9, z: -1.0, height: 0.9 },
  { x: -9.9, z: -0.9, height: 0.8 },
  { x: 1.8, z: -1.0, height: 0.7 },
  { x: 7.8, z: -0.9, height: 0.9 },
  { x: 8.9, z: -1.0, height: 0.8 },
  { x: 10.6, z: -0.9, height: 0.7 },
  { x: 16.3, z: -1.0, height: 0.9 },
  { x: 25.0, z: -0.9, height: 0.8 },
  { x: 26.5, z: -1.0, height: 0.7 },
  { x: 37.2, z: -0.9, height: 0.9 },
  { x: -19.2, z: 2.6, height: 0.85 },
  { x: -18.4, z: 2.75, height: 0.72 },
  { x: -14.6, z: 2.68, height: 0.95 },
  { x: -12.8, z: 2.6, height: 0.78 },
  { x: -8.4, z: 2.75, height: 0.85 },
  { x: -7.6, z: 2.68, height: 0.72 },
  { x: -3.4, z: 2.6, height: 0.95 },
  { x: -2.5, z: 2.75, height: 0.78 },
  { x: 1.1, z: 2.68, height: 0.85 },
  { x: 3.3, z: 2.6, height: 0.72 },
  { x: 4.2, z: 2.75, height: 0.95 },
  { x: 8.6, z: 2.68, height: 0.78 },
  { x: 9.4, z: 2.6, height: 0.85 },
  { x: 12.6, z: 2.75, height: 0.72 },
  { x: 15.6, z: 2.68, height: 0.95 },
  { x: 16.4, z: 2.6, height: 0.78 },
  { x: 19.8, z: 2.75, height: 0.85 },
  { x: 20.8, z: 2.68, height: 0.72 },
  { x: 24.3, z: 2.6, height: 0.95 },
  { x: 25.9, z: 2.75, height: 0.78 },
  { x: 29.1, z: 2.68, height: 0.85 },
  { x: 31.4, z: 2.6, height: 0.72 },
  { x: 32.2, z: 2.75, height: 0.95 },
  { x: 35.4, z: 2.68, height: 0.78 },
  { x: 36.8, z: 2.6, height: 0.85 },
];
// Clear of the stands and doors: the one by the post stand stands between it and the bookshop.
const TOWN_LAMPS = [-18.9, -9.4, 2.05, 11.25, 25.8];
export function Town({
  signs,
  speakerTops,
}: {
  signs: SceneSigns;
  speakerTops: RefObject<SpeakerTops>;
}) {
  const fontsReady = useFontsReady();
  const textures = useMemo(
    () => ({
      street: texture(drawStreet()),
      edge: texture(drawCorrugatedEdge()),
      shadow: texture(drawShadowBlob()),
      house: texture(cutOut(420, 380, drawHouse, 9, 61)),
      flats: texture(cutOut(440, 420, drawFlats, 9, 65)),
      skyline: texture(
        cutOut(
          Math.round(SKYLINE.width * PIXELS_PER_UNIT),
          Math.round(SKYLINE.height * PIXELS_PER_UNIT),
          drawSkyline,
          6,
          170,
        ),
      ),
      awning: texture(cutOut(320, 380, drawDalgonaAwning, 8, 121)),
      gaspard: blinker(GASPARD_SIZE.width, GASPARD_SIZE.height, drawGaspard, 9, 122),
      postman: blinker(POSTMAN_SIZE.width, POSTMAN_SIZE.height, drawPostman, 9, 240),
      ronron: blinker(RONRON_SIZE.width, RONRON_SIZE.height, drawRonron, 9, 242),
      postBooth: texture(cutOut(340, 420, drawPostBooth, 8, 241)),
      berenice: blinker(BERENICE_SIZE.width, BERENICE_SIZE.height, drawBerenice, 9, 124),
      raffleCounter: texture(cutOut(340, 200, drawRaffleCounter, 8, 126)),
      trees: TOWN_TREES.map(({ kind, seed }) =>
        texture(cutOut(240, 320, kind === 'pine' ? drawPine(seed) : drawTree(seed), 9, 140 + seed)),
      ),
      tufts: [1, 2, 3, 4].map((seed) =>
        texture(cutOut(160, 140, drawTuft(seed * 7), 7, 180 + seed)),
      ),
      hills: HILL_ROWS.map(({ color, hatch, bumps, seed, height }) =>
        texture(
          cutOut(1600, Math.round(height * 100), drawHills(color, hatch, bumps, seed), 8, seed),
        ),
      ),
    }),
    [],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const shop = useMemo(
    () => texture(cutOut(480, 380, drawShop(signs.shop), 9, 62)),
    [fontsReady, signs.shop],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const bookshop = useMemo(
    () => texture(cutOut(480, 380, drawBookshop(signs.bookshop), 9, 64)),
    [fontsReady, signs.bookshop],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const cart = useMemo(
    () => texture(cutOut(320, 190, drawDalgonaCart(signs.dalgona), 8, 123)),
    [fontsReady, signs.dalgona],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const postCounter = useMemo(
    () => texture(cutOut(340, 190, drawPostCounter(signs.post), 8, 242)),
    [fontsReady, signs.post],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const raffleBooth = useMemo(
    () => texture(cutOut(340, 420, drawRaffleBooth(signs.raffle), 8, 125)),
    [fontsReady, signs.raffle],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const arcade = useMemo(
    () => texture(cutOut(500, 400, drawArcade(signs.arcade), 9, 66)),
    [fontsReady, signs.arcade],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady exists to draw the texts again.
  const busTextures = useMemo(
    () => ({
      shelter: texture(cutOut(360, 320, drawBusShelter(signs.busStop), 9, 67)),
      bus: texture(cutOut(560, 250, drawBus(signs.busLine), 9, 68)),
    }),
    [fontsReady, signs.busStop, signs.busLine],
  );
  const idlingBus = useRef<Group>(null);
  const skyTextures = useSkyTextures();
  const sky = useLiveSky();
  const clouds = useRef<(Group | null)[]>([]);

  // The clouds drift along, and come back round from the other side. The bus shakes a little,
  // its engine running while it waits.
  useFrame(({ clock }, delta) => {
    if (idlingBus.current) {
      idlingBus.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 18)) * 0.012;
    }
    for (const group of clouds.current) {
      if (group) {
        group.position.x += delta * sky.drift * CLOUD_SPEED;
        if (group.position.x > CLOUD_SPAN / 2) {
          group.position.x -= CLOUD_SPAN;
        }
      }
    }
  });

  const {
    flats,
    house,
    shop: shopPlace,
    bookshop: bookshopPlace,
    arcade: arcadePlace,
    busStop,
    bus,
    dalgona,
    post,
    raffle,
  } = TOWN_BUILDINGS;
  const streetWidth = TOWN_ENDS.right - TOWN_ENDS.left + 20;
  const streetCenter = (TOWN_ENDS.left + TOWN_ENDS.right) / 2;
  return (
    <>
      {/* Wider than the street, as far away it fills more of the view at both ends. */}
      <SkyGradient
        position={[streetCenter, 7, -10]}
        width={streetWidth + 70}
        height={26}
        starsMap={skyTextures.stars}
      />
      <group position={[streetCenter, 0, 0]}>
        {CLOUDS.map(({ x, y, size }, index) => (
          <group
            key={x}
            ref={(group) => {
              clouds.current[index] = group;
            }}
            position={[x, y, -8]}
          >
            <LiveCloud map={skyTextures.cloud} height={size} rank={index} />
          </group>
        ))}
      </group>
      {/* Downtown, far behind the hills. */}
      <group position={[SKYLINE.x, -0.2, SKYLINE.z]}>
        <CutOut map={textures.skyline} height={SKYLINE.height} />
      </group>
      {HILL_ROWS.map(({ z, height }, index) => (
        <group key={z} position={[streetCenter, -0.15, z]}>
          <CutOut
            map={textures.hills[index]}
            height={(height * 100 + 24) / 100}
            width={streetWidth + 30}
          />
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[streetCenter, 0, -1]}>
        <planeGeometry args={[streetWidth, 8]} />
        <meshBasicMaterial map={textures.street} />
      </mesh>
      <DioramaTable center={streetCenter} width={streetWidth} />
      <mesh position={[streetCenter, -0.18, STREET_FRONT_Z]}>
        <boxGeometry args={[streetWidth, 0.36, 0.14]} />
        <meshBasicMaterial map={textures.edge} />
      </mesh>
      <Lamps style="classic" xs={TOWN_LAMPS} />
      {TOWN_TREES.map(({ x, z, height }, index) => (
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
      {TOWN_TUFTS.map(({ x, z, height }, index) => (
        <Swaying key={`${x}-${z}`} x={x} z={z} phase={index * 0.9}>
          <CutOut map={textures.tufts[index % 4]} height={height} />
        </Swaying>
      ))}
      <Furniture
        map={textures.flats}
        x={flats.x}
        z={BUILDINGS_Z}
        height={4.5}
        shadow={textures.shadow}
      />
      <Furniture
        map={textures.house}
        x={house.x}
        z={BUILDINGS_Z}
        height={4.06}
        shadow={textures.shadow}
      />
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[
          {
            interaction: 'ronron',
            map: textures.ronron.open,
            height: RONRON_HEIGHT,
            z: RONRON_Z,
          },
          {
            interaction: 'gaspard',
            map: textures.gaspard.open,
            height: GASPARD_HEIGHT,
            z: DALGONA_Z.gaspard,
          },
          {
            interaction: 'postman',
            map: textures.postman.open,
            height: POSTMAN_HEIGHT,
            z: POST_Z.postman,
          },
          {
            interaction: 'berenice',
            map: textures.berenice.open,
            height: BERENICE_HEIGHT,
            z: RAFFLE_Z.berenice,
          },
        ]}
      />
      <Balloons x={raffle.x} z={RAFFLE_Z.balloons} />
      <Furniture
        map={raffleBooth}
        x={raffle.x}
        z={RAFFLE_Z.booth}
        height={RAFFLE_BOOTH_HEIGHT}
        shadow={textures.shadow}
      />
      <Character
        map={textures.berenice.open}
        blinks={textures.berenice}
        x={raffle.bereniceX}
        z={RAFFLE_Z.berenice}
        height={BERENICE_HEIGHT}
        shadow={textures.shadow}
      />
      <Furniture
        map={textures.raffleCounter}
        x={raffle.x}
        z={RAFFLE_Z.counter}
        height={1.7}
        shadow={textures.shadow}
      />
      <Furniture
        map={textures.awning}
        x={dalgona.x}
        z={DALGONA_Z.awning}
        height={3.9}
        shadow={textures.shadow}
      />
      <Character
        map={textures.gaspard.open}
        blinks={textures.gaspard}
        x={dalgona.gaspardX}
        z={DALGONA_Z.gaspard}
        height={GASPARD_HEIGHT}
        shadow={textures.shadow}
      />
      <Furniture
        map={cart}
        x={dalgona.x}
        z={DALGONA_Z.cart}
        height={1.6}
        shadow={textures.shadow}
      />
      {/* Gustave's post stand: its awning and pigeonholes, Gustave, and the counter before him. */}
      <Furniture
        map={textures.postBooth}
        x={post.x}
        z={POST_Z.booth}
        height={3.9}
        shadow={textures.shadow}
      />
      <Character
        map={textures.postman.open}
        blinks={textures.postman}
        x={post.postmanX}
        z={POST_Z.postman}
        height={POSTMAN_HEIGHT}
        shadow={textures.shadow}
      />
      <Furniture
        map={postCounter}
        x={post.x}
        z={POST_Z.counter}
        height={1.6}
        shadow={textures.shadow}
      />
      <Furniture
        map={shop}
        x={shopPlace.x}
        z={BUILDINGS_Z}
        height={4.06}
        shadow={textures.shadow}
      />
      <Furniture
        map={busTextures.shelter}
        x={busStop.x}
        z={-0.7}
        height={3}
        shadow={textures.shadow}
      />
      <group ref={idlingBus}>
        <Furniture map={busTextures.bus} x={bus.x} z={-0.2} height={2.6} shadow={textures.shadow} />
      </group>
      <Furniture
        map={arcade}
        x={arcadePlace.x}
        z={BUILDINGS_Z}
        height={4.2}
        shadow={textures.shadow}
      />
      <Furniture
        map={bookshop}
        x={bookshopPlace.x}
        z={BUILDINGS_Z}
        height={4.06}
        shadow={textures.shadow}
      />
      {/* Mme Ronron, on the pavement by her block, waiting for news of her kitten. */}
      <Character
        map={textures.ronron.open}
        blinks={textures.ronron}
        x={TOWN_BUILDINGS.ronron.x}
        z={RONRON_Z}
        height={RONRON_HEIGHT}
        shadow={textures.shadow}
      />
      <HidingProps place="town" shadow={textures.shadow} />
    </>
  );
}
