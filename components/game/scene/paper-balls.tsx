'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useMemo, useRef } from 'react';
import { IcosahedronGeometry, type Mesh, type MeshLambertMaterial } from 'three';

const BALL_COUNT = 18;
const BALL_SECONDS = 0.9;
const GRAVITY = 14;
const BOUNCE = 0.45;
const FADE_FROM = 0.6;

type Ball = {
  x: number;
  y: number;
  z: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  size: number;
  spin: number;
  age: number;
};

export type PaperBallPool = { balls: Ball[]; next: number };

export function createPaperBalls(): PaperBallPool {
  return {
    balls: Array.from({ length: BALL_COUNT }, () => ({
      x: 0,
      y: 0,
      z: 0,
      velocityX: 0,
      velocityY: 0,
      velocityZ: 0,
      size: 0.1,
      spin: 0,
      age: BALL_SECONDS,
    })),
    next: 0,
  };
}

// Kicked up behind the feet and away from the way the character dashes. Takes over the oldest ball,
// since they all last as long as each other.
export function emitPaperBall(pool: PaperBallPool, x: number, z: number, facing: number) {
  pool.balls[pool.next] = {
    x,
    y: 0.15,
    z: z + (Math.random() - 0.5) * 0.4,
    velocityX: -facing * (1.2 + Math.random() * 1.6),
    velocityY: 2 + Math.random() * 2,
    velocityZ: (Math.random() - 0.5) * 1.2,
    size: 0.08 + Math.random() * 0.07,
    spin: (Math.random() - 0.5) * 18,
    age: 0,
  };
  pool.next = (pool.next + 1) % BALL_COUNT;
}

// A ball of crumpled paper: a rough sphere whose corners are pushed in and out at random.
function crumpledBall(seed: number): IcosahedronGeometry {
  const geometry = new IcosahedronGeometry(1, 1);
  const positions = geometry.attributes.position;
  let state = seed;
  const random = () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
  const dents = new Map<string, number>();
  for (let index = 0; index < positions.count; index++) {
    const key = [positions.getX(index), positions.getY(index), positions.getZ(index)]
      .map((value) => value.toFixed(3))
      .join();
    // The same corner appears on several faces, which must stay joined.
    const dent = dents.get(key) ?? 0.72 + random() * 0.45;
    dents.set(key, dent);
    positions.setXYZ(
      index,
      positions.getX(index) * dent,
      positions.getY(index) * dent,
      positions.getZ(index) * dent,
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function PaperBalls({ balls }: { balls: RefObject<PaperBallPool> }) {
  const meshes = useRef<(Mesh | null)[]>([]);
  const geometries = useMemo(() => [11, 23, 37].map(crumpledBall), []);

  useFrame((_, delta) => {
    balls.current.balls.forEach((ball, index) => {
      const mesh = meshes.current[index];
      if (!mesh) {
        return;
      }
      ball.age = Math.min(ball.age + delta, BALL_SECONDS);
      const progress = ball.age / BALL_SECONDS;
      mesh.visible = progress < 1;
      if (!mesh.visible) {
        return;
      }
      ball.velocityY -= GRAVITY * delta;
      ball.x += ball.velocityX * delta;
      ball.y += ball.velocityY * delta;
      ball.z += ball.velocityZ * delta;
      // Bounces on the floor, losing speed each time, and rolls a little further.
      if (ball.y < ball.size) {
        ball.y = ball.size;
        ball.velocityY = Math.abs(ball.velocityY) * BOUNCE;
        ball.velocityX *= 0.7;
        ball.spin *= 0.7;
      }
      mesh.position.set(ball.x, ball.y, ball.z);
      mesh.rotation.z += ball.spin * delta;
      mesh.rotation.x += ball.spin * 0.6 * delta;
      mesh.scale.setScalar(ball.size);
      (mesh.material as MeshLambertMaterial).opacity =
        progress < FADE_FROM ? 1 : 1 - (progress - FADE_FROM) / (1 - FADE_FROM);
    });
  });

  return balls.current.balls.map((_, index) => (
    <mesh
      // The balls are a fixed pool, so their position identifies them.
      // biome-ignore lint/suspicious/noArrayIndexKey: see above.
      key={index}
      ref={(mesh) => {
        meshes.current[index] = mesh;
      }}
      geometry={geometries[index % geometries.length]}
      visible={false}
    >
      <meshLambertMaterial color="#fbf6ea" flatShading transparent />
    </mesh>
  ));
}
