import type { Locale } from 'next-intl';
import { getPlayer } from '@/auth/session';
import { AuthForm } from '@/components/auth/auth-form';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { redirect } from '@/i18n/navigation';

type Props = {
  // The root layout has already rejected any unknown language.
  params: Promise<{ locale: Locale }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;

  if (await getPlayer()) {
    redirect({ href: '/', locale });
  }

  return (
    <>
      <LocaleSwitcher />
      <AuthForm mode="login" />
    </>
  );
}
