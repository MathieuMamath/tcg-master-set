'use client';

import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { authClient } from '@/auth/client';
import {
  type AuthErrorKey,
  authErrorKey,
  isValidPassword,
  isValidUsername,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '@/auth/rules';
import { Link } from '@/i18n/navigation';
import { AUTH_BUTTON_CLASS, AuthCard, AuthError } from './auth-card';
import { Field, PasswordField } from './fields';

type Props = {
  mode: 'signup' | 'login';
  // Only once the game can send emails, in production.
  canResetPassword?: boolean;
};

export function AuthForm({ mode, canResetPassword = false }: Props) {
  const t = useTranslations('Auth');
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const isSignup = mode === 'signup';
  // Told as soon as the confirmation strays from the password, not only once it is sent.
  const isConfirmOff = passwordConfirm !== '' && !password.startsWith(passwordConfirm);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    const passwordConfirm = String(form.get('passwordConfirm') ?? '');
    const username = String(form.get('username') ?? '');

    if (isSignup && !isValidUsername(username)) {
      setError('invalidUsername');
      return;
    }
    if (isSignup && !isValidPassword(password)) {
      setError('invalidPassword');
      return;
    }
    if (isSignup && password !== passwordConfirm) {
      setError('passwordMismatch');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = isSignup
        ? await authClient.signUp.email({ email, password, username, name: username })
        : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(authErrorKey(result.error.code, result.error.status));
        setIsSubmitting(false);
        return;
      }
      // A full load, so that the server sees the new session cookie straight away.
      window.location.assign(window.location.pathname.replace(/\/(login|signup)$/, ''));
    } catch {
      setError('unavailable');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title={t(isSignup ? 'signupTitle' : 'loginTitle')}
      intro={t(isSignup ? 'signupIntro' : 'loginIntro')}
    >
      <form method="post" onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
        {isSignup && (
          <Field
            label={t('username')}
            hint={t('usernameHint', { min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH })}
            name="username"
            autoComplete="username"
            minLength={USERNAME_MIN_LENGTH}
            maxLength={USERNAME_MAX_LENGTH}
          />
        )}
        <Field label={t('email')} name="email" type="email" autoComplete="email" />
        <PasswordField
          label={t('password')}
          hint={isSignup ? t('passwordHint', { min: PASSWORD_MIN_LENGTH }) : undefined}
          showLabel={t('showPassword')}
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          minLength={isSignup ? PASSWORD_MIN_LENGTH : undefined}
          maxLength={PASSWORD_MAX_LENGTH}
        />
        {isSignup && (
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
        )}
        {!isSignup && canResetPassword && (
          <Link href="/forgot-password" className="-mt-2 self-end text-sm font-semibold underline">
            {t('forgotPassword')}
          </Link>
        )}
        {error && <AuthError>{t(`errors.${error}`)}</AuthError>}
        <button type="submit" disabled={isSubmitting} className={AUTH_BUTTON_CLASS}>
          {t(isSignup ? 'signupAction' : 'loginAction')}
        </button>
      </form>
      <p className="mt-5 text-center">
        {t(isSignup ? 'hasAccount' : 'noAccount')}{' '}
        <Link href={isSignup ? '/login' : '/signup'} className="font-semibold underline">
          {t(isSignup ? 'goToLogin' : 'goToSignup')}
        </Link>
      </p>
    </AuthCard>
  );
}
