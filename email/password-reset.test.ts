import { expect, test } from 'vitest';
import { passwordResetEmail } from './password-reset';

const url = 'https://game.example.com/fr/reset-password?token=abc&x="<b>"';

test('is written in the language it was asked from', () => {
  const fr = passwordResetEmail({ to: 'a@example.com', url, locale: 'fr', minutes: 15 });
  const en = passwordResetEmail({ to: 'a@example.com', url, locale: 'en', minutes: 15 });
  expect(fr.subject).toContain('mot de passe');
  expect(en.subject).toContain('password');
  expect(fr.html).toContain('lang="fr"');
});

test('carries the link, how long it lives, and nothing about the account', () => {
  const email = passwordResetEmail({ to: 'a@example.com', url, locale: 'en', minutes: 15 });
  expect(email.to).toBe('a@example.com');
  expect(email.text).toContain(url);
  expect(email.text).toContain('15 minutes');
  expect(email.text).not.toContain('a@example.com');
  expect(email.html).not.toContain('a@example.com');
});

test('escapes the link in the html', () => {
  const email = passwordResetEmail({ to: 'a@example.com', url, locale: 'en', minutes: 15 });
  expect(email.html).toContain('&amp;x=&quot;&lt;b&gt;&quot;');
  expect(email.html).not.toContain('"<b>"');
});
