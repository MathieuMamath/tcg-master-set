'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useRef } from 'react';
import type { Mesh, MeshStandardMaterial } from 'three';

const PUFF_COUNT = 14;
const PUFF_SECONDS = 0.5;
const START_SIZE = 0.1;
const GROWTH = 0.16;
const RISE = 0.2;
const OPACITY = 0.6;

export type SmokePuffs = {
  puffs: { x: number; y: number; z: number; age: number }[];
  next: number;
};

export function createSmoke(): SmokePuffs {
  return {
    puffs: Array.from({ length: PUFF_COUNT }, () => ({ x: 0, y: 0, z: 0, age: PUFF_SECONDS })),
    next: 0,
  };
}

// Takes over the oldest puff, since they all last as long as each other.
export function emitPuff(smoke: SmokePuffs, x: number, y: number, z: number) {
  smoke.puffs[smoke.next] = {
    x: x + (Math.random() - 0.5) * 0.18,
    y,
    z: z + (Math.random() - 0.5) * 0.18,
    age: 0,
  };
  smoke.next = (smoke.next + 1) % PUFF_COUNT;
}

export function DashSmoke({ smoke }: { smoke: RefObject<SmokePuffs> }) {
  const meshes = useRef<(Mesh | null)[]>([]);

  useFrame((_, delta) => {
    smoke.current.puffs.forEach((puff, index) => {
      const mesh = meshes.current[index];
      if (!mesh) {
        return;
      }
      puff.age = Math.min(puff.age + delta, PUFF_SECONDS);
      const progress = puff.age / PUFF_SECONDS;
      mesh.visible = progress < 1;
      mesh.position.set(puff.x, puff.y + RISE * progress, puff.z);
      mesh.scale.setScalar(START_SIZE + GROWTH * progress);
      (mesh.material as MeshStandardMaterial).opacity = OPACITY * (1 - progress);
    });
  });

  return smoke.current.puffs.map((_, index) => (
    <mesh
      // The puffs are a fixed pool, so their position identifies them.
      // biome-ignore lint/suspicious/noArrayIndexKey: see above.
      key={index}
      ref={(mesh) => {
        meshes.current[index] = mesh;
      }}
      visible={false}
    >
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial color="#e8e6ef" transparent depthWrite={false} roughness={1} />
    </mesh>
  ));
}
