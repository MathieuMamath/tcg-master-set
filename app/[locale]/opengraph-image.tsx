import { ImageResponse } from 'next/og';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { INK, KRAFT, loadBrandAssets, PAPER } from '@/components/brand/assets';
import { routing } from '@/i18n/routing';

// The picture shown when a link to the game is shared, in WhatsApp or Discord for instance: a
// scrap of paper taped on kraft, with the booster pack, the game's name and what it is about.
export const alt = 'TCG Master Set';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Props = { params: Promise<{ locale: string }> };

export default async function OpenGraphImage({ params }: Props) {
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
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
        backgroundImage:
          'linear-gradient(112deg, rgba(110,75,40,0.08) 25%, transparent 25%, transparent 50%, rgba(110,75,40,0.08) 50%, rgba(110,75,40,0.08) 75%, transparent 75%)',
        backgroundSize: '22px 22px',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 56,
          padding: '64px 80px',
          background: PAPER,
          transform: 'rotate(-2deg)',
          boxShadow: '10px 14px 0 rgba(44,42,53,0.28)',
        }}
      >
        {/* A strip of tape holding the scrap. */}
        <div
          style={{
            position: 'absolute',
            top: -22,
            left: 420,
            width: 180,
            height: 48,
            background: 'rgba(238,224,160,0.85)',
            transform: 'rotate(-4deg)',
          }}
        />
        {/* biome-ignore lint/performance/noImgElement: drawn into a PNG, not shown on a page. */}
        <img src={booster} width={260} height={260} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 560 }}>
          <div style={{ fontFamily: 'Bagel Fat One', fontSize: 92, color: INK, lineHeight: 1 }}>
            TCG Master Set
          </div>
          <div
            style={{
              marginTop: 24,
              fontFamily: 'Patrick Hand',
              fontSize: 42,
              color: INK,
              opacity: 0.8,
              lineHeight: 1.2,
            }}
          >
            {t('tagline')}
          </div>
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}
