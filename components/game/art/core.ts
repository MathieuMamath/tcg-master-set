// Drawings for the paper world, made on canvases in the browser and used as textures. Everything is
// drawn by code, so that the repository holds no images.
//
// Shared tools for the paper drawings: canvases, paper grain, painted shapes with their cut-out
// rim, and the colours and shapes several characters and places share.

export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const drawing = canvas.getContext('2d');
  if (!drawing) {
    throw new Error('The browser gave no 2D canvas');
  }
  return drawing;
}

// Paper fibres: a light noise on every drawn pixel.
export function addGrain(canvas: HTMLCanvasElement, strength: number, seed: number) {
  const drawing = context(canvas);
  const random = seededRandom(seed);
  const image = drawing.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] === 0) {
      continue;
    }
    const noise = (random() - 0.5) * strength;
    pixels[index] += noise;
    pixels[index + 1] += noise;
    pixels[index + 2] += noise;
  }
  drawing.putImageData(image, 0, 0);
}

export function ellipse(
  drawing: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
) {
  drawing.beginPath();
  drawing.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  drawing.fill();
}

export function roundedRect(
  drawing: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  drawing.beginPath();
  drawing.roundRect(x, y, width, height, radius);
}

// Draws something on its own canvas, with paper grain but no margin round it.
export function paint(
  width: number,
  height: number,
  draw: (drawing: CanvasRenderingContext2D, width: number, height: number) => void,
  seed = 1,
): HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  draw(context(canvas), width, height);
  addGrain(canvas, 14, seed);
  return canvas;
}

// Draws something, then puts a white paper margin all round its outline, as if cut out with
// scissors.
export function cutOut(
  width: number,
  height: number,
  draw: (drawing: CanvasRenderingContext2D, width: number, height: number) => void,
  border = 10,
  seed = 1,
): HTMLCanvasElement {
  const padding = border + 4;
  const art = createCanvas(width + padding * 2, height + padding * 2);
  const artDrawing = context(art);
  artDrawing.translate(padding, padding);
  draw(artDrawing, width, height);

  const silhouette = createCanvas(art.width, art.height);
  const silhouetteDrawing = context(silhouette);
  silhouetteDrawing.drawImage(art, 0, 0);
  silhouetteDrawing.globalCompositeOperation = 'source-in';
  silhouetteDrawing.fillStyle = '#fffdf6';
  silhouetteDrawing.fillRect(0, 0, silhouette.width, silhouette.height);

  const result = createCanvas(art.width, art.height);
  const resultDrawing = context(result);
  const steps = 28;
  for (let step = 0; step < steps; step++) {
    const angle = (step / steps) * Math.PI * 2;
    resultDrawing.drawImage(silhouette, Math.cos(angle) * border, Math.sin(angle) * border);
  }
  resultDrawing.drawImage(art, 0, 0);
  addGrain(result, 14, seed);
  return result;
}

// Characters with eyes that can be seen blink now and then: each is drawn twice, eyes open and
// shut, and the scene swaps the two.
export type Eyes = 'open' | 'shut';

// A round black eye with a glint, or, shut, a curved lid.
export function drawEye(
  x: CanvasRenderingContext2D,
  eyeX: number,
  eyeY: number,
  eyes: Eyes,
  { color = '#2c2a35', width = 10 }: { color?: string; width?: number } = {},
) {
  if (eyes === 'shut') {
    x.strokeStyle = color;
    x.lineWidth = 5;
    x.lineCap = 'round';
    x.beginPath();
    x.arc(eyeX, eyeY - 4, 10, 0.2 * Math.PI, 0.8 * Math.PI);
    x.stroke();
    return;
  }
  x.fillStyle = color;
  ellipse(x, eyeX, eyeY, width, 14);
  x.fillStyle = '#ffffff';
  ellipse(x, eyeX + 3, eyeY - 5, 3.4, 4.4);
}

export const WOOD = '#a8743f';
export const WOOD_DARK = '#7f5530';
export const WOOD_LIGHT = '#c4935c';

// Shared by the park's characters: a round body seen from the front, with a pale belly.
export function roundBody(
  x: CanvasRenderingContext2D,
  cx: number,
  bottom: number,
  colors: { body: string; belly: string; feet: string },
) {
  x.fillStyle = colors.feet;
  ellipse(x, cx - 38, bottom - 8, 26, 11);
  ellipse(x, cx + 38, bottom - 8, 26, 11);
  x.fillStyle = colors.body;
  ellipse(x, cx, bottom - 104, 90, 100);
  x.save();
  x.beginPath();
  x.ellipse(cx, bottom - 104, 90, 100, 0, 0, Math.PI * 2);
  x.clip();
  x.fillStyle = colors.belly;
  ellipse(x, cx, bottom - 44, 60, 70);
  x.restore();
}

// A pointed ear with a rounded tip, from its base on the head, its tip, and its other base.
export function drawRoundedEar(
  x: CanvasRenderingContext2D,
  [base, tip, otherBase]: { x: number; y: number }[],
  color: string,
) {
  const near = (from: { x: number; y: number }, share: number) => ({
    x: tip.x + (from.x - tip.x) * share,
    y: tip.y + (from.y - tip.y) * share,
  });
  const before = near(base, 0.18);
  const after = near(otherBase, 0.18);
  x.fillStyle = color;
  x.beginPath();
  x.moveTo(base.x, base.y);
  x.lineTo(before.x, before.y);
  x.quadraticCurveTo(tip.x, tip.y, after.x, after.y);
  x.lineTo(otherBase.x, otherBase.y);
  x.closePath();
  x.fill();
}

// A paper cut-out pasted onto a scenery at its place, scaled to a height.
export function pasteCutOut(
  x: CanvasRenderingContext2D,
  piece: HTMLCanvasElement,
  left: number,
  bottom: number,
  height: number,
) {
  const width = (piece.width / piece.height) * height;
  x.drawImage(piece, left - width / 2, bottom - height, width, height);
}
