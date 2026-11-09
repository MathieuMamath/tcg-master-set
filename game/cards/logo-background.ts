// Darker than this and a pixel belongs to the logo, including its yellows and pale blues.
const MIN_BACKGROUND_LIGHTNESS = 170;

// Some logos have an opaque white background. Only light pixels connected to the image's edge are
// cleared, so that white inside the logo stays. Changes the RGBA pixels in place.
export function clearEdgeBackground(pixels: Uint8ClampedArray, width: number, height: number) {
  const isBackground = (pixel: number) => {
    const offset = pixel * 4;
    const lightness = Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
    return pixels[offset + 3] === 0 || lightness >= MIN_BACKGROUND_LIGHTNESS;
  };

  const seen = new Uint8Array(width * height);
  const toVisit: number[] = [];
  for (let column = 0; column < width; column++) {
    toVisit.push(column, (height - 1) * width + column);
  }
  for (let row = 0; row < height; row++) {
    toVisit.push(row * width, row * width + width - 1);
  }

  while (toVisit.length > 0) {
    const pixel = toVisit.pop() as number;
    if (seen[pixel] || !isBackground(pixel)) {
      continue;
    }
    seen[pixel] = 1;
    pixels[pixel * 4 + 3] = 0;

    const column = pixel % width;
    if (column > 0) {
      toVisit.push(pixel - 1);
    }
    if (column < width - 1) {
      toVisit.push(pixel + 1);
    }
    if (pixel >= width) {
      toVisit.push(pixel - width);
    }
    if (pixel < width * (height - 1)) {
      toVisit.push(pixel + width);
    }
  }
}
