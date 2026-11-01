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
function centredModel(scene: Object3D, color?: string): Object3D {
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
  });

  const wrapper = new Object3D();
  wrapper.add(model);
  return wrapper;
}

function Model({
  item: { model, x, z, height, quarterTurns = 0, sizeFactor = 1, color },
  groundHeight,
}: {
  item: PlaceItem;
  groundHeight: number;
}) {
  const gltf = useLoader(GLTFLoader, modelUrl(model));
  const object = useMemo(() => centredModel(gltf.scene, color), [gltf, color]);

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
export type ShopSigns = Record<ShopkeeperStock, string>;

const SIGN_WIDTH = 1.6;
const SIGN_HEIGHT = 0.34;
const SIGN_FONT = '"Fredoka Variable", sans-serif';

// A lit panel on the wall behind a counter, with what its shopkeeper sells.
function ShopSign({ station: { x, neon }, text }: { station: Station; text: string }) {
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
      context.fillStyle = neon;
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
  }, [fontIsReady, neon, text]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[x, 1.68, SHOP_WALL_Z + 0.03]}>
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
        <ShopSign key={station.stock} station={station} text={signs[station.stock]} />
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

function Npc({
  npc: { model, x, z, heading },
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
    <primitive object={gltf.scene} position={[x, groundHeight, z]} rotation={[0, heading, 0]} />
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
    </>
  );
}
