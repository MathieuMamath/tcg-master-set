import { and, count, eq, gt } from 'drizzle-orm';
import { hasLocale, type Locale } from 'next-intl';
import { getDb } from '@/db/client';
import { verifications } from '@/db/schema';
import { sendEmail } from '@/email';
import { passwordResetEmail } from '@/email/password-reset';
import { routing } from '@/i18n/routing';
import { recordEvent } from '@/player/events';

// How a forgotten password is reset by email:
// 1. The forgot-password page asks Better Auth for a reset, naming its own language's reset page.
//    Better Auth answers the same whether the address has an account or not, and for an account
//    stores a token and calls `sendResetPasswordEmail`.
// 2. The email links straight to `/<locale>/reset-password?token=…`, rather than through Better
//    Auth's own redirect.
// 3. The reset page checks the token with `isResetTokenUsable` before showing its form, so that
//    an old link says so before the player types a password. Better Auth then sets the password,
//    uses the token up, calls `recordPasswordReset`, and signs the account out everywhere.

// A link lives a quarter of an hour, rather than Better Auth's hour.
export const RESET_TOKEN_MINUTES = 15;

// Better Auth's prefix for reset tokens in `verifications`.
export const RESET_IDENTIFIER_PREFIX = 'reset-password:';

// Better Auth's own rate limit counts by address, which the game doesn't keep, so an account gets
// at most this many reset emails an hour, however many times its address is typed in.
export const RESET_EMAILS_PER_HOUR = 3;

// The language of the reset page the request named, `/fr/reset-password` for instance.
export function resetLocale(betterAuthUrl: string): Locale {
  const callback = new URL(betterAuthUrl).searchParams.get('callbackURL') ?? '';
  const locale = callback.split('/')[1];
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

export function resetPageUrl(appUrl: string, locale: Locale, token: string): string {
  const url = new URL(`/${locale}/reset-password`, appUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

function logFailure(message: string, error: unknown) {
  // Logged as text: the full error object carries the database client's internals, and the
  // provider's answer could quote the address.
  console.error(message, String(error instanceof Error ? (error.cause ?? error) : error));
}

// Links asked for this account within the last hour, the one just made included. Reset tokens
// are the only rows of `verifications` that hold a player's id, and their identifier is hashed
// whole, prefix included, so they are found by that id alone.
async function recentResets(userId: string): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const [row] = await getDb()
    .select({ value: count() })
    .from(verifications)
    .where(and(eq(verifications.value, userId), gt(verifications.createdAt, since)));
  return row?.value ?? 0;
}

// `emailAndPassword.sendResetPassword`. Left to run on its own rather than awaited: Better Auth
// waits for it only when the address has an account, so a slow call to the provider would tell
// from the answer's time whether it has one. The game runs as a long-lived server, so the email
// still leaves. A failure is logged, never shown, since showing it would say the account exists.
export async function sendResetPasswordEmail({
  user,
  url,
  token,
}: {
  user: { id: string; email: string };
  url: string;
  token: string;
}): Promise<void> {
  void (async () => {
    try {
      if ((await recentResets(user.id)) > RESET_EMAILS_PER_HOUR) {
        return;
      }
      const appUrl = process.env.APP_URL ?? new URL(url).origin;
      const locale = resetLocale(url);
      await sendEmail(
        passwordResetEmail({
          to: user.email,
          url: resetPageUrl(appUrl, locale, token),
          locale,
          minutes: RESET_TOKEN_MINUTES,
        }),
      );
    } catch (error) {
      logFailure('The password reset email failed:', error);
    }
  })();
}

// `emailAndPassword.onPasswordReset`, once the new password is saved. It logs rather than throws:
// the password has changed by then, and a throw would turn a reset that worked into an error.
export async function recordPasswordReset({ user }: { user: { id: string } }): Promise<void> {
  try {
    await recordEvent(getDb(), user.id, 'player.password_reset', {});
  } catch (error) {
    logFailure('The event log failed:', error);
  }
}

// Whether a reset link still works, checked through Better Auth, which stores tokens hashed. Only
// a hint for the page: the reset itself checks the token again.
export async function isResetTokenUsable(token: string): Promise<boolean> {
  const { getAuth } = await import('./server');
  const context = await getAuth().$context;
  const row = await context.internalAdapter.findVerificationValue(
    `${RESET_IDENTIFIER_PREFIX}${token}`,
  );
  return row !== null && row !== undefined && row.expiresAt > new Date();
}
