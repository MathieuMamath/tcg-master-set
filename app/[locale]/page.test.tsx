import { type Locale, NextIntlClientProvider } from 'next-intl';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import HomePage from './page';

function renderHome(locale: Locale, messages: typeof en) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HomePage />
    </NextIntlClientProvider>,
  );
}

test('the home page shows the game title', () => {
  expect(renderHome('en', en)).toMatch(/<h1[^>]*>TCG Master Set<\/h1>/);
});

test('the home page follows the selected language', () => {
  expect(renderHome('en', en)).toContain(en.Game.keyboardHint);
  expect(renderHome('fr', fr)).toContain(fr.Game.keyboardHint);
});
