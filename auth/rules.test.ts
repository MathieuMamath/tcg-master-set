import { describe, expect, test } from 'vitest';
import { authErrorKey, isValidPassword, isValidUsername } from './rules';

describe('isValidUsername', () => {
  test.each(['Ash', 'player_1', 'a.b-c', 'x'.repeat(20)])('accepts %s', (username) => {
    expect(isValidUsername(username)).toBe(true);
  });

  test.each(['', 'ab', 'x'.repeat(21), 'two words', '<script>', 'émile'])(
    'refuses "%s"',
    (username) => {
      expect(isValidUsername(username)).toBe(false);
    },
  );
});

describe('isValidPassword', () => {
  test('enforces the length limits', () => {
    expect(isValidPassword('x'.repeat(9))).toBe(false);
    expect(isValidPassword('x'.repeat(10))).toBe(true);
    expect(isValidPassword('x'.repeat(128))).toBe(true);
    expect(isValidPassword('x'.repeat(129))).toBe(false);
  });
});

describe('authErrorKey', () => {
  test.each([
    ['INVALID_EMAIL_OR_PASSWORD', 'invalidCredentials'],
    ['USER_ALREADY_EXISTS', 'emailTaken'],
    ['USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', 'emailTaken'],
    ['USERNAME_IS_ALREADY_TAKEN', 'usernameTaken'],
    ['INVALID_EMAIL', 'invalidEmail'],
    ['USERNAME_TOO_SHORT', 'invalidUsername'],
    ['PASSWORD_TOO_SHORT', 'invalidPassword'],
  ])('maps %s', (code, key) => {
    expect(authErrorKey(code, 400)).toBe(key);
  });

  test('reports rate limiting whatever the code', () => {
    expect(authErrorKey(undefined, 429)).toBe('tooManyAttempts');
  });

  test('never exposes an unknown error', () => {
    expect(authErrorKey('SOMETHING_INTERNAL', 500)).toBe('unavailable');
    expect(authErrorKey(undefined, undefined)).toBe('unavailable');
  });
});
