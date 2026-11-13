import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import type { Locale } from 'next-intl';
import { RESET_TOKEN_MINUTES } from '@/auth/password-reset';
import { getPlayer } from '@/auth/session';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { canSendEmail } from '@/email';
import { redirect } from '@/i18n/navigation';

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;

  // Decided on each request, from the server's variables, never once at build time.
  await connection();
  // Without a way to send the link, there is nothing to offer.
  if (!canSendEmail()) {
    notFound();
  }
  if (await getPlayer()) {
    redirect({ href: '/', locale });
  }

  return (
    <>
      <LocaleSwitcher />
      <ForgotPasswordForm minutes={RESET_TOKEN_MINUTES} />
    </>
  );
}
