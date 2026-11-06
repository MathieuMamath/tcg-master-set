import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// What the generated icons and link previews are drawn with, read from the repository when they
// are built: the booster pack of the favicon, and the game's own fonts.
export const KRAFT = '#c8a574';
export const PAPER = '#fbf6ea';
export const INK = '#2c2a35';

const fontFile = (family: string, file: string) =>
  readFile(join(process.cwd(), 'node_modules/@fontsource', family, 'files', file));

export async function loadBrandAssets() {
  const [booster, display, hand] = await Promise.all([
    readFile(join(process.cwd(), 'app/icon.svg')),
    fontFile('bagel-fat-one', 'bagel-fat-one-latin-400-normal.woff'),
    fontFile('patrick-hand', 'patrick-hand-latin-400-normal.woff'),
  ]);
  return {
    booster: `data:image/svg+xml;base64,${booster.toString('base64')}`,
    fonts: [
      { name: 'Bagel Fat One', data: display, style: 'normal' as const, weight: 400 as const },
      { name: 'Patrick Hand', data: hand, style: 'normal' as const, weight: 400 as const },
    ],
  };
}
