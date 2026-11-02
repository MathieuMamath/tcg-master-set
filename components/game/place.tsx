'use client';

import { useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimationClip,
  AnimationMixer,
  Box3,
  CanvasTexture,
  type Group,
  type Mesh,
  MeshStandardMaterial,
  Object3D,
  Shape,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DESK_TOP } from '@/game/bedroom';
import type { Rect } from '@/game/collision';
import {
  LIBRARY_BOOKCASE_Z,
  LIBRARY_BOOKCASES,
  LIBRARY_COUNTER_TOP,
  LIBRARY_COUNTER_Z,
} from '@/game/library';
import { BOY_POSITION, GRANDPA_TABLE, LAKE, PARK_FROM_TOWN } from '@/game/park';
import {
  SHOP_BOOKCASE_Z,
  SHOP_BOOKCASES,
  SHOP_COUNTER_TOP,
  SHOP_COUNTER_Z,
  SHOP_DEPTH,
  SHOP_LEFT_WALL_X,
  SHOP_RACK_BASE_TOP,
  SHOP_RACKS,
  SHOP_STATIONS,
  SHOP_WALL_Z,
  SHOP_WIDTH,
} from '@/game/shop';
import type { ShopkeeperStock } from '@/game/shop-dialogue';
import { APARTMENT_X, LIBRARY_FRONT_Z, LIBRARY_X, PARK_SIGN } from '@/game/town';
import {
  type ExitMarker as ExitMarkerData,
  MODEL_NAMES,
  modelScale,
  NPC_MODELS,
  type Npc as NpcData,
  type Place as PlaceData,
  type PlaceItem,
} from '@/game/world';

const BINDER_COLORS = ['#e4572e', '#2e86ab', '#f3a712', '#7b5ea7', '#3bb273', '#d7263d'];
// The tops of the bookcase's three shelves, read from its model.
const SHELF_HEIGHTS = [0.13, 0.37, 0.61].map((height) => 0.075 + height * 1.5);
const BOOSTER_BOX_COLORS = ['#7b5ea7', '#2e86ab', '#e4572e'];
const BOOKCASES = [1.0, 1.68];
const BOOKCASE_Z = -2.05;

const MARKER_COLOR = '#ffc83d';
const MARKER_BOB_HEIGHT = 0.06;

function modelUrl(model: PlaceItem['model']): string {
  return `/models/${model}.glb`;
}

function npcUrl(model: NpcData['model']): string {
  return `/models/characters/${model}.glb`;
}

// Loaded ahead of time, so walking through a door never waits for the next place.
for (const model of MODEL_NAMES) {
  useLoader.preload(GLTFLoader, modelUrl(model));
}
for (const model of NPC_MODELS) {
  useLoader.preload(GLTFLoader, npcUrl(model));
}

// Models have different origins, so each is centred on its footprint and rests on height 0.
function centredModel(scene: Object3D, color?: string, tint?: string): Object3D {
  const model = scene.clone(true);
  const bounds = new Box3().setFromObject(model);
  const center = bounds.getCenter(new Vector3());

  model.position.set(-center.x, -bounds.min.y, -center.z);
  model.traverse((node) => {
    node.castShadow = (node as Mesh).isMesh === true;
    node.receiveShadow = (node as Mesh).isMesh === true;
    if (color && (node as Mesh).isMesh) {
      const mesh = node as Mesh;
      mesh.material = new MeshStandardMaterial({ color, roughness: 0.8 });
    }
    if (tint && (node as Mesh).isMesh) {
      const mesh = node as Mesh;
      // A copy, since the clone still shares its material with the model's other copies.
      const material = (mesh.material as MeshStandardMaterial).clone();
      material.color.set(tint);
      mesh.material = material;
    }
  });

  const wrapper = new Object3D();
  wrapper.add(model);
  return wrapper;
}

function Model({
  item: { model, x, z, height, quarterTurns = 0, sizeFactor = 1, color, tint },
  groundHeight,
}: {
  item: PlaceItem;
  groundHeight: number;
}) {
  const gltf = useLoader(GLTFLoader, modelUrl(model));
  const object = useMemo(() => centredModel(gltf.scene, color, tint), [gltf, color, tint]);

  return (
    <primitive
      object={object}
      position={[x, height ?? groundHeight, z]}
      rotation={[0, (quarterTurns * Math.PI) / 2, 0]}
      scale={modelScale(model) * sizeFactor}
    />
  );
}

// An arrow floating above the ground, pointing to the way out.
function ExitMarker({
  marker: { x, z, quarterTurns },
  groundHeight,
}: {
  marker: ExitMarkerData;
  groundHeight: number;
}) {
  const arrow = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (arrow.current) {
      arrow.current.position.y =
        groundHeight + 0.12 + Math.sin(clock.elapsedTime * 3) * MARKER_BOB_HEIGHT;
    }
  });

  return (
    <group
      ref={arrow}
      position={[x, groundHeight + 0.12, z]}
      rotation={[0, (quarterTurns * Math.PI) / 2, 0]}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.3]}>
        <coneGeometry args={[0.2, 0.42, 3]} />
        <meshStandardMaterial
          color={MARKER_COLOR}
          emissive={MARKER_COLOR}
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

// Plain coloured spines on the shelves, ready to become the player's real binders.
function Binders() {
  return BOOKCASES.flatMap((bookcaseX, bookcase) =>
    SHELF_HEIGHTS.flatMap((shelfHeight, shelf) =>
      [-2, -1, 0, 1, 2].map((slot) => {
        const color = BINDER_COLORS[(bookcase * 5 + shelf * 2 + slot + 2) % BINDER_COLORS.length];
        return (
          <mesh
            key={`${bookcaseX}-${shelfHeight}-${slot}`}
            castShadow
            position={[bookcaseX + slot * 0.095, shelfHeight + 0.15, BOOKCASE_Z]}
          >
            <boxGeometry args={[0.08, 0.3, 0.26]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
      }),
    ),
  );
}

// A small stack of sealed boxes on the desk, in plain colours.
function BoosterBoxes() {
  return BOOSTER_BOX_COLORS.map((color, level) => (
    <mesh
      key={color}
      castShadow
      position={[0.38, DESK_TOP + 0.045 + level * 0.09, -2.03]}
      rotation={[0, level * 0.25, 0]}
    >
      <boxGeometry args={[0.2, 0.09, 0.14]} />
      <meshStandardMaterial color={color} />
    </mesh>
  ));
}

// Original wall art: simple shapes, with no third-party artwork.
function Poster({
  x,
  color,
  accent,
  z = -2.25,
}: {
  x: number;
  color: string;
  accent: string;
  z?: number;
}) {
  return (
    <group position={[x, 1.25, z]}>
      <mesh position={[0, 0, 0.005]}>
        <boxGeometry args={[0.52, 0.72, 0.01]} />
        <meshStandardMaterial color="#f7f3e8" />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[0.46, 0.66]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.04, 0.014]}>
        <circleGeometry args={[0.15, 24]} />
        <meshStandardMaterial color={accent} />
      </mesh>
      <mesh position={[0, -0.21, 0.014]}>
        <planeGeometry args={[0.32, 0.06]} />
        <meshStandardMaterial color={accent} />
      </mesh>
    </group>
  );
}

const SHOP_BOX_COLORS = ['#7b5ea7', '#2e86ab', '#e4572e', '#3bb273', '#f3a712'];

// Rows of plain sealed boxes on the shelves, in plain colours.
function ShopShelves() {
  return SHOP_BOOKCASES.flatMap((bookcaseX, bookcase) =>
    SHELF_HEIGHTS.flatMap((shelfHeight, shelf) =>
      [-1, 0, 1].map((slot) => (
        <mesh
          key={`${bookcaseX}-${shelfHeight}-${slot}`}
          castShadow
          position={[bookcaseX + slot * 0.16, shelfHeight + 0.11, SHOP_BOOKCASE_Z]}
        >
          <boxGeometry args={[0.14, 0.22, 0.2]} />
          <meshStandardMaterial
            color={SHOP_BOX_COLORS[(bookcase + shelf * 2 + slot + 1) % SHOP_BOX_COLORS.length]}
          />
        </mesh>
      )),
    ),
  );
}

// A rack of plain coloured packs on its stand, leaning back towards the shop's wall.
function PackRack({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, SHOP_RACK_BASE_TOP, z]} rotation={[-0.25, 0, 0]}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[0.56, 0.8, 0.04]} />
        <meshStandardMaterial color="#4b3f8f" />
      </mesh>
      {[0, 1, 2].flatMap((row) =>
        [-1, 0, 1].map((column) => (
          <mesh key={`${row}-${column}`} position={[column * 0.17, 0.15 + row * 0.25, 0.03]}>
            <boxGeometry args={[0.14, 0.21, 0.02]} />
            <meshStandardMaterial
              color={SHOP_BOX_COLORS[(row * 2 + column + 1) % SHOP_BOX_COLORS.length]}
              emissive={SHOP_BOX_COLORS[(row * 2 + column + 1) % SHOP_BOX_COLORS.length]}
              emissiveIntensity={0.25}
            />
          </mesh>
        )),
      )}
    </group>
  );
}

function NeonBar({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
    </mesh>
  );
}

type Station = (typeof SHOP_STATIONS)[number];
export type ShopSigns = Record<ShopkeeperStock | 'library' | 'grandma' | 'park', string>;

const SIGN_WIDTH = 1.6;
const SIGN_HEIGHT = 0.34;
const SIGN_FONT = '"Fredoka Variable", sans-serif';

// A lit panel on a wall, saying what is sold there.
function TextSign({
  position,
  color,
  text,
}: {
  position: [number, number, number];
  color: string;
  text: string;
}) {
  const [fontIsReady, setFontIsReady] = useState(false);

  useEffect(() => {
    document.fonts.load(`600 72px ${SIGN_FONT}`).then(() => setFontIsReady(true));
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: fontIsReady exists to draw it again.
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 218;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = color;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#1b1730';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      let size = 120;
      do {
        context.font = `600 ${size}px ${SIGN_FONT}`;
        size -= 4;
      } while (context.measureText(text).width > canvas.width - 80 && size > 24);
      context.fillText(text, canvas.width / 2, canvas.height / 2 + 6);
    }
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  }, [fontIsReady, color, text]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={position}>
      <planeGeometry args={[SIGN_WIDTH, SIGN_HEIGHT]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

const STAR = (() => {
  const shape = new Shape();
  for (let point = 0; point < 10; point++) {
    const radius = point % 2 === 0 ? 0.2 : 0.09;
    const angle = (point * Math.PI) / 5 + Math.PI / 2;
    const [x, y] = [Math.cos(angle) * radius, Math.sin(angle) * radius];
    if (point === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  return shape;
})();

function NeonMaterial({ color }: { color: string }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />;
}

// A star for what's new, a calendar for this year, an hourglass for the past.
function StockIcon({ stock, color }: { stock: ShopkeeperStock; color: string }) {
  if (stock === 'latest') {
    return (
      <mesh castShadow position={[0, 0, -0.03]}>
        <extrudeGeometry args={[STAR, { depth: 0.06, bevelEnabled: false }]} />
        <NeonMaterial color={color} />
      </mesh>
    );
  }
  if (stock === 'thisYear') {
    return (
      <group>
        <mesh castShadow>
          <boxGeometry args={[0.32, 0.32, 0.05]} />
          <meshStandardMaterial color="#fcfcfc" />
        </mesh>
        <mesh position={[0, 0.11, 0.03]}>
          <boxGeometry args={[0.32, 0.1, 0.01]} />
          <NeonMaterial color={color} />
        </mesh>
        {[-0.08, 0, 0.08].flatMap((column) =>
          [-0.03, -0.1].map((row) => (
            <mesh key={`${column}-${row}`} position={[column, row, 0.03]}>
              <boxGeometry args={[0.05, 0.05, 0.01]} />
              <meshStandardMaterial color="#1b1730" />
            </mesh>
          )),
        )}
      </group>
    );
  }
  return (
    <group>
      <mesh castShadow position={[0, 0.1, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.13, 0.2, 16]} />
        <NeonMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, -0.1, 0]}>
        <coneGeometry args={[0.13, 0.2, 16]} />
        <NeonMaterial color={color} />
      </mesh>
      {[0.21, -0.21].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.03, 16]} />
          <meshStandardMaterial color="#1b1730" />
        </mesh>
      ))}
    </group>
  );
}

function SpinningIcon({ station: { x, stock, neon } }: { station: Station }) {
  const icon = useRef<Group>(null);

  useFrame((_, delta) => {
    if (icon.current) {
      icon.current.rotation.y += delta * 0.9;
    }
  });

  return (
    <group ref={icon} position={[x + 0.42, SHOP_COUNTER_TOP + 0.3, SHOP_COUNTER_Z]}>
      <StockIcon stock={stock} color={neon} />
    </group>
  );
}

function ShopDecoration({ signs }: { signs: ShopSigns }) {
  return (
    <>
      <ShopShelves />
      {SHOP_RACKS.map(({ x, z }) => (
        <PackRack key={`${x}-${z}`} x={x} z={z} />
      ))}
      {SHOP_STATIONS.map((station) => (
        <TextSign
          key={station.stock}
          position={[station.x, 1.68, SHOP_WALL_Z + 0.03]}
          color={station.neon}
          text={signs[station.stock]}
        />
      ))}
      {SHOP_STATIONS.map((station) => (
        <SpinningIcon key={station.stock} station={station} />
      ))}
      <NeonBar
        position={[0, 1.9, SHOP_WALL_Z + 0.02]}
        size={[SHOP_WIDTH, 0.03, 0.02]}
        color="#b57bff"
      />
      <NeonBar
        position={[SHOP_LEFT_WALL_X + 0.02, 1.9, 0]}
        size={[0.02, 0.03, SHOP_DEPTH]}
        color="#b57bff"
      />
      <Poster x={-1.2} color="#ff4fa3" accent="#fcfcfc" z={SHOP_WALL_Z} />
      <Poster x={1.2} color="#31e0d8" accent="#26547c" z={SHOP_WALL_Z} />
    </>
  );
}

// Rows of binder spines on every shelf, standing close together like books.
function LibraryShelves() {
  return LIBRARY_BOOKCASES.flatMap((bookcaseX, bookcase) =>
    SHELF_HEIGHTS.flatMap((shelfHeight, shelf) =>
      [-2, -1, 0, 1, 2].map((slot) => (
        <mesh
          key={`${bookcaseX}-${shelfHeight}-${slot}`}
          castShadow
          position={[bookcaseX + slot * 0.1, shelfHeight + 0.1, LIBRARY_BOOKCASE_Z]}
        >
          <boxGeometry args={[0.085, 0.2, 0.2]} />
          <meshStandardMaterial
            color={BINDER_COLORS[(bookcase * 2 + shelf * 3 + slot + 2) % BINDER_COLORS.length]}
          />
        </mesh>
      )),
    ),
  );
}

// A small stack of binders on the counter, to show what is on sale here.
function LibraryDecoration() {
  return (
    <>
      <LibraryShelves />
      {BINDER_COLORS.slice(0, 3).map((color, index) => (
        <mesh
          key={color}
          castShadow
          position={[0.42, LIBRARY_COUNTER_TOP + 0.03 + index * 0.06, LIBRARY_COUNTER_Z]}
          rotation={[0, index * 0.2, 0]}
        >
          <boxGeometry args={[0.28, 0.05, 0.34]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

// The sign above the library's door, since it shares its model with the shop.
function TownDecoration({ signs }: { signs: ShopSigns }) {
  return (
    <>
      <TextSign
        position={[LIBRARY_X, 1.72, LIBRARY_FRONT_Z]}
        color="#ead9bd"
        text={signs.library}
      />
      <TextSign
        position={[APARTMENT_X, 1.72, LIBRARY_FRONT_Z]}
        color="#f6dbe3"
        text={signs.grandma}
      />
      <TextSign position={[PARK_SIGN.x, 1.4, PARK_SIGN.z]} color="#bfe3a6" text={signs.park} />
      {[-0.6, 0.6].map((offset) => (
        <mesh key={offset} castShadow position={[PARK_SIGN.x + offset, 0.6, PARK_SIGN.z - 0.03]}>
          <boxGeometry args={[0.07, 1.2, 0.05]} />
          <meshStandardMaterial color="#7a5236" />
        </mesh>
      ))}
    </>
  );
}

// White hair and round glasses, added to a younger model to make her a grandmother.
function GrandmaLook({ x, z, groundHeight }: { x: number; z: number; groundHeight: number }) {
  return (
    <group position={[x, groundHeight, z]}>
      <mesh castShadow position={[0, 0.74, -0.05]}>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.94, -0.1]}>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.9} />
      </mesh>
      {[-0.08, 0.08].map((offset) => (
        <mesh key={offset} position={[offset, 0.6, 0.2]}>
          <torusGeometry args={[0.05, 0.012, 8, 16]} />
          <meshStandardMaterial color="#3a3a44" />
        </mesh>
      ))}
    </group>
  );
}

// White hair, a beard and round glasses, added to a younger model to make him a grandfather.
function GrandpaLook({ x, z, groundHeight }: { x: number; z: number; groundHeight: number }) {
  return (
    <group position={[x, groundHeight, z]}>
      <mesh castShadow position={[0, 0.74, -0.05]}>
        <sphereGeometry args={[0.19, 16, 12]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.46, 0.14]}>
        <sphereGeometry args={[0.12, 12, 10]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.9} />
      </mesh>
      {[-0.08, 0.08].map((offset) => (
        <mesh key={offset} position={[offset, 0.6, 0.2]}>
          <torusGeometry args={[0.05, 0.012, 8, 16]} />
          <meshStandardMaterial color="#3a3a44" />
        </mesh>
      ))}
    </group>
  );
}

// A cap on a smaller model to make him a child, and a fishing rod reaching over the lake.
function BoyLook({ groundHeight }: { groundHeight: number }) {
  return (
    <group position={[BOY_POSITION.x, groundHeight, BOY_POSITION.z]}>
      <mesh castShadow position={[0, 0.54, -0.01]}>
        <sphereGeometry args={[0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2e86ab" />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0.16]}>
        <boxGeometry args={[0.2, 0.02, 0.14]} />
        <meshStandardMaterial color="#2e86ab" />
      </mesh>
      <mesh castShadow position={[0.22, 0.42, -0.4]} rotation={[-0.9, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.014, 1.1, 6]} />
        <meshStandardMaterial color="#7a5236" />
      </mesh>
      <mesh position={[0.22, 0.42, -0.84]}>
        <cylinderGeometry args={[0.003, 0.003, 0.84, 4]} />
        <meshStandardMaterial color="#f7f3e8" />
      </mesh>
      <mesh position={[0.22, 0.04 - groundHeight, -0.84]}>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshStandardMaterial color="#e4572e" />
      </mesh>
    </group>
  );
}

function Npc({
  npc: { model, x, z, heading, sizeFactor = 1 },
  groundHeight,
}: {
  npc: NpcData;
  groundHeight: number;
}) {
  const gltf = useLoader(GLTFLoader, npcUrl(model));

  const mixer = useMemo(() => {
    gltf.scene.traverse((node) => {
      node.castShadow = (node as Mesh).isMesh === true;
    });
    return new AnimationMixer(gltf.scene);
  }, [gltf]);

  useEffect(() => {
    const clip = AnimationClip.findByName(gltf.animations, 'idle');
    if (!clip) {
      throw new Error(`Animation "idle" is missing from ${model}`);
    }
    mixer.clipAction(clip).play();
    return () => {
      mixer.stopAllAction();
    };
  }, [gltf, mixer, model]);

  useFrame((_, delta) => {
    mixer.update(delta);
  });

  return (
    <primitive
      object={gltf.scene}
      position={[x, groundHeight, z]}
      rotation={[0, heading, 0]}
      // Always set, since places share the loaded model and it would keep another's size.
      scale={sizeFactor}
    />
  );
}

function roundedRectangle({ minX, maxX, minZ, maxZ }: Rect, radius: number): Shape {
  const shape = new Shape();
  shape.moveTo(minX + radius, -maxZ);
  shape.lineTo(maxX - radius, -maxZ);
  shape.quadraticCurveTo(maxX, -maxZ, maxX, -maxZ + radius);
  shape.lineTo(maxX, -minZ - radius);
  shape.quadraticCurveTo(maxX, -minZ, maxX - radius, -minZ);
  shape.lineTo(minX + radius, -minZ);
  shape.quadraticCurveTo(minX, -minZ, minX, -minZ - radius);
  shape.lineTo(minX, -maxZ + radius);
  shape.quadraticCurveTo(minX, -maxZ, minX + radius, -maxZ);
  return shape;
}

const SHORE_WIDTH = 0.28;
const LAKE_SHAPE = roundedRectangle(LAKE, 1.1);
const SHORE_SHAPE = roundedRectangle(
  {
    minX: LAKE.minX - SHORE_WIDTH,
    maxX: LAKE.maxX + SHORE_WIDTH,
    minZ: LAKE.minZ - SHORE_WIDTH,
    maxZ: LAKE.maxZ + SHORE_WIDTH,
  },
  1.3,
);
const LILY_PADS = [
  [-3.6, -3, 0.34],
  [-3, -2.6, 0.22],
  [3.9, -5.6, 0.3],
  [0.8, -6, 0.24],
] as const;
const RIPPLES = [
  [-1.5, -4.2],
  [2.2, -3.4],
  [-3.2, -5.6],
] as const;
const RIPPLE_SECONDS = 4;

// Rings spreading slowly across the water, so that the lake doesn't look like a painted floor.
function Ripple({ x, z, delay }: { x: number; z: number; delay: number }) {
  const ring = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!ring.current) {
      return;
    }
    const progress = ((clock.elapsedTime + delay) % RIPPLE_SECONDS) / RIPPLE_SECONDS;
    ring.current.scale.setScalar(0.3 + progress * 1.4);
    (ring.current.material as MeshStandardMaterial).opacity = 0.45 * (1 - progress);
  });

  return (
    <mesh ref={ring} position={[x, 0.035, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.92, 1, 40]} />
      <meshStandardMaterial color="#e6f6ff" transparent depthWrite={false} />
    </mesh>
  );
}

// Plain shapes: no model in the game is a lawn or a lake.
function ParkDecoration() {
  return (
    <>
      <mesh receiveShadow position={[0, 0, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color="#8fc46b" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[-3, 0.008, PARK_FROM_TOWN.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 1.4]} />
        <meshStandardMaterial color="#d9c394" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[SHORE_SHAPE, 12]} />
        <meshStandardMaterial color="#d9c394" roughness={1} />
      </mesh>
      <mesh position={[0, 0.024, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[LAKE_SHAPE, 12]} />
        <meshStandardMaterial color="#4aa6d6" roughness={0.25} metalness={0.1} />
      </mesh>
      {LILY_PADS.map(([x, z, radius]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius, 16, 0.3, 5.7]} />
          <meshStandardMaterial color="#4f9d5b" />
        </mesh>
      ))}
      {RIPPLES.map(([x, z], index) => (
        <Ripple key={`${x}-${z}`} x={x} z={z} delay={(index * RIPPLE_SECONDS) / RIPPLES.length} />
      ))}
      {/* A game ready on the table, waiting for someone to play. */}
      {[-0.13, 0, 0.13].flatMap((x) =>
        [-0.1, 0.1].map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[GRANDPA_TABLE.x + x, 0.36, GRANDPA_TABLE.z + z]}
            rotation={[0, 0, 0]}
          >
            <boxGeometry args={[0.09, 0.01, 0.13]} />
            <meshStandardMaterial color="#3f5fb5" />
          </mesh>
        )),
      )}
    </>
  );
}

function BedroomDecoration() {
  return (
    <>
      <Binders />
      <BoosterBoxes />
      <Poster x={-0.45} color="#26547c" accent="#ffd166" />
      <Poster x={0.35} color="#ef476f" accent="#fcfcfc" />
    </>
  );
}

export function Place({ place, signs }: { place: PlaceData; signs: ShopSigns }) {
  return (
    <>
      {place.items.map((item) => (
        <Model
          key={`${item.model}-${item.x}-${item.z}`}
          item={item}
          groundHeight={place.groundHeight}
        />
      ))}
      {place.exitMarkers.map((marker) => (
        <ExitMarker
          key={`${marker.x}-${marker.z}`}
          marker={marker}
          groundHeight={place.groundHeight}
        />
      ))}
      {place.npcs.map((npc) => (
        <Npc key={npc.model} npc={npc} groundHeight={place.groundHeight} />
      ))}
      {place.id === 'bedroom' && <BedroomDecoration />}
      {place.id === 'shop' && <ShopDecoration signs={signs} />}
      {place.id === 'library' && <LibraryDecoration />}
      {place.npcs
        .filter(({ stock }) => stock === 'grandma')
        .map(({ x, z }) => (
          <GrandmaLook key="grandma" x={x} z={z} groundHeight={place.groundHeight} />
        ))}
      {place.npcs
        .filter(({ stock }) => stock === 'grandpa')
        .map(({ x, z }) => (
          <GrandpaLook key="grandpa" x={x} z={z} groundHeight={place.groundHeight} />
        ))}
      {place.id === 'park' && (
        <>
          <ParkDecoration />
          <BoyLook groundHeight={place.groundHeight} />
        </>
      )}
      {place.id === 'town' && <TownDecoration signs={signs} />}
    </>
  );
}
