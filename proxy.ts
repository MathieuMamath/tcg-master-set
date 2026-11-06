import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next.js internals, files with an extension, and the home-screen
  // icon, generated at an address without one.
  matcher: '/((?!api|_next|_vercel|apple-icon|.*\\..*).*)',
};
