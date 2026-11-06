import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { version } from './package.json';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // The game's version, shown discreetly in a corner of the screen. The release job bumps it in
  // package.json after each merge, and that push deploys again with the new number.
  env: { APP_VERSION: version },
  // The production image runs the standalone server, with only the files it needs.
  output: 'standalone',
  // Read at runtime by components/brand/assets.ts to draw the icons and link previews, through
  // paths the build cannot follow on its own.
  outputFileTracingIncludes: {
    '/**': [
      './app/icon.svg',
      './node_modules/@fontsource/bagel-fat-one/files/bagel-fat-one-latin-400-normal.woff',
      './node_modules/@fontsource/patrick-hand/files/patrick-hand-latin-400-normal.woff',
    ],
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default withNextIntl(nextConfig);
