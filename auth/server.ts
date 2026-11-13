import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { username } from 'better-auth/plugins';
import { getDb } from '@/db/client';
import * as schema from '@/db/schema';
import { recordEvent } from '@/player/events';
import {
  RESET_IDENTIFIER_PREFIX,
  RESET_TOKEN_MINUTES,
  recordPasswordReset,
  sendResetPasswordEmail,
} from './password-reset';
import {
  isValidUsername,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from './rules';

const SESSION_DAYS = 30;
const SECONDS_PER_DAY = 24 * 60 * 60;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Copy .env.example to .env.local.`);
  }
  return value;
}

async function logAccountEvent(
  userId: string,
  type: 'player.signed_up' | 'player.signed_in',
): Promise<void> {
  try {
    await recordEvent(getDb(), userId, type, {});
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'The event log failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
  }
}

function createAuth() {
  return betterAuth({
    baseURL: requiredEnv('APP_URL'),
    secret: requiredEnv('AUTH_SECRET'),
    trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',').filter(Boolean),
    database: drizzleAdapter(getDb(), { provider: 'pg', schema, usePlural: true }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      // A forgotten password is reset by email: see `password-reset.ts`.
      sendResetPassword: sendResetPasswordEmail,
      onPasswordReset: recordPasswordReset,
      resetPasswordTokenExpiresIn: RESET_TOKEN_MINUTES * 60,
      // A reset is what a player does when someone else may know the password, so every open
      // session ends, theirs included.
      revokeSessionsOnPasswordReset: true,
    },
    // Reset tokens are stored hashed, so that a leaked table hands out no working link.
    verification: {
      storeIdentifier: { default: 'plain', overrides: { [RESET_IDENTIFIER_PREFIX]: 'hashed' } },
    },
    session: { expiresIn: SESSION_DAYS * SECONDS_PER_DAY },
    // Players only hand over an email, a username and a password, so nothing else is kept.
    advanced: { ipAddress: { disableIpTracking: true } },
    // Signing up and in are logged for the game's statistics. A failure to log never stops a
    // player from playing.
    databaseHooks: {
      user: {
        create: { after: (user) => logAccountEvent(user.id, 'player.signed_up') },
      },
      session: {
        create: { after: (session) => logAccountEvent(session.userId, 'player.signed_in') },
      },
    },
    plugins: [
      username({
        minUsernameLength: USERNAME_MIN_LENGTH,
        maxUsernameLength: USERNAME_MAX_LENGTH,
        usernameValidator: isValidUsername,
      }),
      nextCookies(),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;

// Kept on globalThis so hot reloads in development reuse the same instance.
const cache = globalThis as typeof globalThis & { auth?: Auth };

// Created on first use, so the production build needs neither a database nor any secret.
export function getAuth(): Auth {
  cache.auth ??= createAuth();
  return cache.auth;
}
