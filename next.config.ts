import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
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
