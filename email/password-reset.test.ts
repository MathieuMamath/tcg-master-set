import { expect, test } from 'vitest';
import { passwordResetEmail } from './password-reset';

const url = 'https://game.example.com/fr/reset-password?token=abc&x="<b>"';
const email = (locale: 'en' | 'fr') =>
  passwordResetEmail({
    to: 'a@example.com',
    url,
    appUrl: 'https://game.example.com',
    locale,
    minutes: 15,
  });

test('is written in the language it was asked from', () => {
  expect(email('fr').subject).toContain('mot de passe');
  expect(email('en').subject).toContain('password');
  expect(email('fr').html).toContain('lang="fr"');
});

test('carries the link, how long it lives, and nothing about the account', () => {
  const { to, text, html } = email('en');
  expect(to).toBe('a@example.com');
  expect(text).toContain(url);
  expect(text).toContain('15 minutes');
  expect(text).not.toContain('a@example.com');
  expect(html).not.toContain('a@example.com');
});

test('shows the game banner from the game itself', () => {
  expect(email('en').html).toContain('src="https://game.example.com/email-header.png"');
});

test('escapes the link in the html, in the button and written out', () => {
  const { html } = email('en');
  expect(html?.match(/&amp;x=&quot;&lt;b&gt;&quot;/g)).toHaveLength(3);
  expect(html).not.toContain('"<b>"');
});
