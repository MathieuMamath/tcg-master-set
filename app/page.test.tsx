import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import HomePage from './page';

test('the home page shows the game title', () => {
  expect(renderToStaticMarkup(<HomePage />)).toMatch(/<h1[^>]*>TCG Master Set<\/h1>/);
});
