export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]+$/;

export function isValidUsername(username: string): boolean {
  return (
    username.length >= USERNAME_MIN_LENGTH &&
    username.length <= USERNAME_MAX_LENGTH &&
    USERNAME_PATTERN.test(username)
  );
}

export function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
}

export type AuthErrorKey =
  | 'invalidCredentials'
  | 'emailTaken'
  | 'usernameTaken'
  | 'invalidEmail'
  | 'invalidUsername'
  | 'invalidPassword'
  | 'tooManyAttempts'
  | 'unavailable';

// Better Auth's own messages are in English and not meant for players.
export function authErrorKey(code: string | undefined, status: number | undefined): AuthErrorKey {
  if (status === 429) {
    return 'tooManyAttempts';
  }

  switch (code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'invalidCredentials';
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return 'emailTaken';
    case 'USERNAME_IS_ALREADY_TAKEN':
      return 'usernameTaken';
    case 'INVALID_EMAIL':
      return 'invalidEmail';
    case 'INVALID_USERNAME':
    case 'USERNAME_TOO_SHORT':
    case 'USERNAME_TOO_LONG':
      return 'invalidUsername';
    case 'PASSWORD_TOO_SHORT':
    case 'PASSWORD_TOO_LONG':
      return 'invalidPassword';
    default:
      return 'unavailable';
  }
}
