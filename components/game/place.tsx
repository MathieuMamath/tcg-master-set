'use client';

import { useFrame, useLoader } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Box3, type Group, type Mesh, Object3D, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DESK_TOP } from '@/game/bedroom';
import {
  type ExitMarker as ExitMarkerData,
  MODEL_NAMES,
  modelScale,
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

// Loaded ahead of time, so walking through a door never waits for the next place.
for (const model of MODEL_NAMES) {
  useLoader.preload(GLTFLoader, modelUrl(model));
}

// Models have different origins, so each is centred on its footprint and rests on height 0.
function centredModel(scene: Object3D): Object3D {
  const model = scene.clone(true);
  const bounds = new Box3().setFromObject(model);
  const center = bounds.getCenter(new Vector3());

  model.position.set(-center.x, -bounds.min.y, -center.z);
  model.traverse((node) => {
    node.castShadow = (node as Mesh).isMesh === true;
    node.receiveShadow = (node as Mesh).isMesh === true;
  });

  const wrapper = new Object3D();
  wrapper.add(model);
  return wrapper;
}

function Model({
  item: { model, x, z, height, quarterTurns = 0, sizeFactor = 1 },
  groundHeight,
}: {
  item: PlaceItem;
  groundHeight: number;
}) {
  const gltf = useLoader(GLTFLoader, modelUrl(model));
  const object = useMemo(() => centredModel(gltf.scene), [gltf]);

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
function Poster({ x, color, accent }: { x: number; color: string; accent: string }) {
  return (
    <group position={[x, 1.25, -2.25]}>
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

export function Place({ place }: { place: PlaceData }) {
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
      {place.id === 'bedroom' && <BedroomDecoration />}
    </>
  );
}
