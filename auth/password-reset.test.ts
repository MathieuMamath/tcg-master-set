import { expect, test } from 'vitest';
import { resetLocale, resetPageUrl } from './password-reset';

const betterAuthUrl = (callback: string) =>
  `https://game.example.com/api/auth/reset-password/token?callbackURL=${encodeURIComponent(callback)}`;

test('reads the language of the reset page the request named', () => {
  expect(resetLocale(betterAuthUrl('/fr/reset-password'))).toBe('fr');
  expect(resetLocale(betterAuthUrl('/en/reset-password'))).toBe('en');
});

test('falls back to the default language for anything else', () => {
  expect(resetLocale(betterAuthUrl('/de/reset-password'))).toBe('en');
  expect(resetLocale(betterAuthUrl(''))).toBe('en');
  expect(resetLocale('https://game.example.com/api/auth/reset-password/token')).toBe('en');
});

test('links straight to the game reset page, in that language', () => {
  expect(resetPageUrl('https://game.example.com', 'fr', 'a b')).toBe(
    'https://game.example.com/fr/reset-password?token=a+b',
  );
});
