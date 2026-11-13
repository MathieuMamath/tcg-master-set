import { ImageResponse } from 'next/og';
import { INK, KRAFT, loadBrandAssets, PAPER } from '@/components/brand/assets';
import en from '@/messages/en.json';

// The banner at the top of the game's emails: the booster pack and the game's name, written in
// its own font on a scrap taped to kraft. Mail apps can't load the game's fonts, so the name
// comes as a picture; drawn at twice the size `email/layout.ts` shows it at, for sharp screens.
const WIDTH = 1120;
const HEIGHT = 280;

export async function GET() {
  const { booster, fonts } = await loadBrandAssets();
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
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 36,
          padding: '28px 56px',
          background: PAPER,
          transform: 'rotate(-1.5deg)',
          boxShadow: '8px 10px 0 rgba(44,42,53,0.28)',
        }}
      >
        {/* A strip of tape holding the scrap. */}
        <div
          style={{
            position: 'absolute',
            top: -18,
            left: 250,
            width: 150,
            height: 40,
            background: 'rgba(238,224,160,0.85)',
            transform: 'rotate(-4deg)',
          }}
        />
        {/* biome-ignore lint/performance/noImgElement: drawn into a PNG, not shown on a page. */}
        <img src={booster} width={150} height={150} alt="" />
        <div style={{ fontFamily: 'Bagel Fat One', fontSize: 76, color: INK }}>{en.Home.title}</div>
      </div>
    </div>,
    {
      width: WIDTH,
      height: HEIGHT,
      fonts,
      // The picture never changes between versions of the same banner.
      headers: { 'Cache-Control': 'public, max-age=86400' },
    },
  );
}
