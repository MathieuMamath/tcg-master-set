'use client';

import { useLocale, useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { authClient } from '@/auth/client';
import { type AuthErrorKey, authErrorKey } from '@/auth/rules';
import { Link } from '@/i18n/navigation';
import { AUTH_BUTTON_CLASS, AUTH_FOOTER_CLASS, AuthCard, AuthError } from './auth-card';
import { Field } from './fields';

// Asks for a reset link. The answer is the same whether the address has an account or not, so
// that the page can't be used to find out who plays.
export function ForgotPasswordForm({ minutes }: { minutes: number }) {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email')).trim();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await authClient.requestPasswordReset({
        email,
        // Names the reset page in this page's language, for the email's link and its words.
        redirectTo: `/${locale}/reset-password`,
      });
      if (result.error) {
        setError(authErrorKey(result.error.code, result.error.status));
      } else {
        setSentTo(email);
      }
    } catch {
      setError('unavailable');
    }
    setIsSubmitting(false);
  };

  return (
    <AuthCard title={t('forgotTitle')} intro={sentTo === null ? t('forgotIntro') : undefined}>
      {sentTo === null ? (
        <form method="post" onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          <Field label={t('email')} name="email" type="email" autoComplete="email" />
          {error && <AuthError>{t(`errors.${error}`)}</AuthError>}
          <button type="submit" disabled={isSubmitting} className={AUTH_BUTTON_CLASS}>
            {t('forgotAction')}
          </button>
        </form>
      ) : (
        <p role="status" className="mt-4">
          {t('forgotSent', { email: sentTo, minutes })}
        </p>
      )}
      <p className={AUTH_FOOTER_CLASS}>
        <Link href="/login" className="font-semibold underline">
          {t('backToLogin')}
        </Link>
      </p>
    </AuthCard>
  );
}
