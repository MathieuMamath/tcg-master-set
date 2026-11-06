import { ImageResponse } from 'next/og';
import { KRAFT, loadBrandAssets } from '@/components/brand/assets';

// The icon a phone shows for the game on its home screen: the booster pack on kraft.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  const { booster } = await loadBrandAssets();
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: KRAFT,
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: drawn into a PNG, not shown on a page. */}
      <img src={booster} width={150} height={150} alt="" />
    </div>,
    size,
  );
}
