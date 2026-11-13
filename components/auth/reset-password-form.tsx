'use client';

import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { authClient } from '@/auth/client';
import {
  type AuthErrorKey,
  authErrorKey,
  isValidPassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/auth/rules';
import { Link } from '@/i18n/navigation';
import { AUTH_BUTTON_CLASS, AuthCard, AuthError } from './auth-card';
import { PasswordField } from './fields';

type Props = {
  // Missing when the link no longer works, which the page checked before showing the form.
  token: string | null;
};

// Sets a new password from the link of a reset email, asked twice like on signing up.
export function ResetPasswordForm({ token }: Props) {
  const t = useTranslations('Auth');
  const [error, setError] = useState<AuthErrorKey | null>(token === null ? 'invalidToken' : null);
  const [isDone, setIsDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const isConfirmOff = passwordConfirm !== '' && !password.startsWith(passwordConfirm);
  const isExpired = error === 'invalidToken';

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (token === null) {
      return;
    }
    if (!isValidPassword(password)) {
      setError('invalidPassword');
      return;
    }
    if (password !== passwordConfirm) {
      setError('passwordMismatch');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError(authErrorKey(result.error.code, result.error.status));
      } else {
        setIsDone(true);
      }
    } catch {
      setError('unavailable');
    }
    setIsSubmitting(false);
  };

  if (isDone || isExpired) {
    return (
      <AuthCard title={t(isDone ? 'resetDoneTitle' : 'resetExpiredTitle')}>
        {isDone ? (
          <p role="status" className="mt-4">
            {t('resetDone')}
          </p>
        ) : (
          <div className="mt-4">
            <AuthError>{t('resetExpired')}</AuthError>
          </div>
        )}
        <p className="mt-5 text-center">
          <Link
            href={isDone ? '/login' : '/forgot-password'}
            className={`inline-block ${AUTH_BUTTON_CLASS}`}
          >
            {t(isDone ? 'goToLogin' : 'askAgain')}
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t('resetTitle')} intro={t('resetIntro')}>
      <form method="post" onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
        <PasswordField
          label={t('newPassword')}
          hint={t('passwordHint', { min: PASSWORD_MIN_LENGTH })}
          showLabel={t('showPassword')}
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
        />
        <PasswordField
          label={t('passwordConfirm')}
          error={isConfirmOff ? t('passwordMismatch') : undefined}
          showLabel={t('showPassword')}
          name="passwordConfirm"
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
        />
        {error && <AuthError>{t(`errors.${error}`)}</AuthError>}
        <button type="submit" disabled={isSubmitting} className={AUTH_BUTTON_CLASS}>
          {t('resetAction')}
        </button>
      </form>
    </AuthCard>
  );
}
