import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { routing } from '@/i18n/routing';
import '../globals.css';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const NAME = 'TCG Master Set';
const OPEN_GRAPH_LOCALES: Record<string, string> = { en: 'en_US', fr: 'fr_FR' };

// What browsers, and the apps a link is shared in, show of the game: its name, what it is about,
// and the picture from `opengraph-image.tsx`. Links are made whole from the address the game is
// served from, as the apps need them.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const description = t('description');

  return {
    metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
    title: NAME,
    applicationName: NAME,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((other) => [other, `/${other}`])),
    },
    openGraph: {
      type: 'website',
      siteName: NAME,
      title: NAME,
      description,
      url: `/${locale}`,
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: routing.locales
        .filter((other) => other !== locale)
        .map((other) => OPEN_GRAPH_LOCALES[other] ?? other),
    },
    twitter: { card: 'summary_large_image', title: NAME, description },
  };
}

// The colour of the browser's bar on phones, and of the stripe beside a link's preview in Discord.
export const viewport: Viewport = { themeColor: '#c8a574' };

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
