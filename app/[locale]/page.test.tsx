import { type Locale, NextIntlClientProvider } from 'next-intl';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { HomeScreen } from '@/components/game/home-screen';
import { redirect } from '@/i18n/navigation';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import HomePage from './page';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/auth/client', () => ({ authClient: { signOut: vi.fn() } }));
vi.mock('@/cards/playable-sets', () => ({ loadPlayableSets: vi.fn().mockResolvedValue([]) }));
vi.mock('@/i18n/navigation', () => ({ redirect: vi.fn() }));

const PLAYER = { id: 'player-1', username: 'Placeholder' };

function renderHome(locale: Locale, messages: typeof en) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HomeScreen player={PLAYER} sets={[]} />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(redirect).mockClear();
});

test('the home screen shows the game title and the player', () => {
  const html = renderHome('en', en);

  expect(html).toMatch(/<h1[^>]*>TCG Master Set<\/h1>/);
  expect(html).toContain('Placeholder');
});

test('the home screen follows the selected language', () => {
  expect(renderHome('en', en)).toContain(en.Game.keyboardHint);
  expect(renderHome('fr', fr)).toContain(fr.Game.keyboardHint);
});

test('a visitor without an account is sent to sign up, in their language', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  await HomePage({ params: Promise.resolve({ locale: 'fr' }) });

  expect(redirect).toHaveBeenCalledWith({ href: '/signup', locale: 'fr' });
});

test('a signed-in player stays on the game', async () => {
  vi.mocked(getPlayer).mockResolvedValue(PLAYER);

  await HomePage({ params: Promise.resolve({ locale: 'en' }) });

  expect(redirect).not.toHaveBeenCalled();
});
