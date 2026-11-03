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

const INPUT_CLASS =
  'w-full rounded-sm border-2 border-ui-ink/30 bg-white px-3 py-2 text-lg text-ui-ink outline-none focus:border-ui-ink focus:bg-ui-accent/20';

function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block font-semibold">{label}</span>
      <input className={INPUT_CLASS} required {...input} />
      {hint && <span className="mt-1 block text-sm opacity-70">{hint}</span>}
    </label>
  );
}

type Props = {
  mode: 'signup' | 'login';
};

export function AuthForm({ mode }: Props) {
  const t = useTranslations('Auth');
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === 'signup';

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    const username = String(form.get('username') ?? '');

    if (isSignup && !isValidUsername(username)) {
      setError('invalidUsername');
      return;
    }
    if (isSignup && !isValidPassword(password)) {
      setError('invalidPassword');
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
    <main className="flex flex-1 items-center justify-center p-4 font-game">
      <div className="ui-pop-in w-full max-w-md ui-scrap p-6 text-ui-ink">
        <h1 className="font-display text-3xl">{t(isSignup ? 'signupTitle' : 'loginTitle')}</h1>
        <p className="mt-1 opacity-80">{t(isSignup ? 'signupIntro' : 'loginIntro')}</p>
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
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
          <Field
            label={t('password')}
            hint={isSignup ? t('passwordHint', { min: PASSWORD_MIN_LENGTH }) : undefined}
            name="password"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            minLength={isSignup ? PASSWORD_MIN_LENGTH : undefined}
            maxLength={PASSWORD_MAX_LENGTH}
          />
          {error && (
            <p
              role="alert"
              className="rounded-lg border-2 border-ui-ink bg-ui-danger p-2 font-medium text-white"
            >
              {t(`errors.${error}`)}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer ui-paper-button bg-ui-accent px-5 py-2 text-lg font-semibold disabled:cursor-wait disabled:opacity-60"
          >
            {t(isSignup ? 'signupAction' : 'loginAction')}
          </button>
        </form>
        <p className="mt-5 text-center">
          {t(isSignup ? 'hasAccount' : 'noAccount')}{' '}
          <Link href={isSignup ? '/login' : '/signup'} className="font-semibold underline">
            {t(isSignup ? 'goToLogin' : 'goToSignup')}
          </Link>
        </p>
      </div>
    </main>
  );
}
