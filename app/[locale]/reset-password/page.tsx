import { isResetTokenUsable } from '@/auth/password-reset';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

type Props = {
  searchParams: Promise<{ token?: string | string[] }>;
};

// Reached from the link of a reset email. The token is checked first, so that an old link says
// so before the player types a new password. Signed-in players may use it too: the link proves
// the mailbox, whoever holds the browser.
export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const usable = typeof token === 'string' && (await isResetTokenUsable(token)) ? token : null;

  return <ResetPasswordForm token={usable} />;
}
