'use client';

import { type RefObject, useCallback, useEffect, useRef } from 'react';

const GRAVITY = 260;

type Spark = {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  size: number;
  age: number;
  life: number;
  color: string;
};

type Emission = {
  x: number;
  y: number;
  count: number;
  colors: readonly string[];
  speed: number;
  // In radians, around straight up. A full circle by default.
  spread?: number;
};

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function drawSpark(context: CanvasRenderingContext2D, { x, y, size, color }: Spark, alpha: number) {
  context.globalAlpha = alpha;
  context.fillStyle = color;
  // A four-pointed star, thin enough to look like a glint.
  context.beginPath();
  context.moveTo(x, y - size);
  context.lineTo(x + size * 0.25, y - size * 0.25);
  context.lineTo(x + size, y);
  context.lineTo(x + size * 0.25, y + size * 0.25);
  context.lineTo(x, y + size);
  context.lineTo(x - size * 0.25, y + size * 0.25);
  context.lineTo(x - size, y);
  context.lineTo(x - size * 0.25, y - size * 0.25);
  context.closePath();
  context.fill();
}

// A canvas of glints over the whole screen. It only draws while some are still in the air, and
// stays empty for a player who avoids motion.
export function useSparks(): {
  canvas: RefObject<HTMLCanvasElement | null>;
  emit: (emission: Emission) => void;
} {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  const frame = useRef(0);

  const draw = useCallback(function draw(now: number, previous: number) {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) {
      frame.current = 0;
      return;
    }
    const seconds = Math.min((now - previous) / 1000, 0.05);
    const scale = window.devicePixelRatio || 1;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    context.globalCompositeOperation = 'lighter';

    sparks.current = sparks.current.filter((spark) => {
      spark.age += seconds;
      spark.x += spark.speedX * seconds;
      spark.y += spark.speedY * seconds;
      spark.speedY += GRAVITY * seconds;
      spark.speedX *= 1 - seconds;
      const left = 1 - spark.age / spark.life;
      if (left > 0) {
        drawSpark(context, spark, left);
      }
      return left > 0;
    });

    frame.current =
      sparks.current.length > 0 ? requestAnimationFrame((next) => draw(next, now)) : 0;
  }, []);

  const emit = useCallback(
    ({ x, y, count, colors, speed, spread = Math.PI * 2 }: Emission) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
      for (let index = 0; index < count; index += 1) {
        const angle = -Math.PI / 2 + randomBetween(-spread / 2, spread / 2);
        const pace = randomBetween(speed * 0.3, speed);
        sparks.current.push({
          x,
          y,
          speedX: Math.cos(angle) * pace,
          speedY: Math.sin(angle) * pace,
          size: randomBetween(3, 9),
          age: 0,
          life: randomBetween(0.5, 1.3),
          color: colors[index % colors.length],
        });
      }
      if (!frame.current) {
        const start = performance.now();
        frame.current = requestAnimationFrame((next) => draw(next, start));
      }
    },
    [draw],
  );

  useEffect(() => {
    const resize = () => {
      const scale = window.devicePixelRatio || 1;
      if (canvas.current) {
        canvas.current.width = window.innerWidth * scale;
        canvas.current.height = window.innerHeight * scale;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, []);

  return { canvas, emit };
}

export function SparksCanvas({ canvas }: { canvas: RefObject<HTMLCanvasElement | null> }) {
  return <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-30 size-full" />;
}
