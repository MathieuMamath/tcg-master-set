'use client';

import { useTranslations } from 'next-intl';
import { type FormEvent, useId, useState } from 'react';
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

// A password field with an eye to show what was typed, so that a player can check it before
// sending. The eye is a toggle: its name stays the same and it says whether it is pressed.
function PasswordField({
  label,
  hint,
  error,
  showLabel,
  ...input
}: {
  label: string;
  hint?: string;
  error?: string;
  showLabel: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [isShown, setIsShown] = useState(false);
  const hintId = useId();
  return (
    <div>
      <label className="block">
        <span className="mb-1 block font-semibold">{label}</span>
        <span className="relative block">
          <input
            className={`${INPUT_CLASS} pr-12`}
            required
            type={isShown ? 'text' : 'password'}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby={hint || error ? hintId : undefined}
            aria-invalid={error ? true : undefined}
            {...input}
          />
          <button
            type="button"
            onClick={() => setIsShown((shown) => !shown)}
            aria-label={showLabel}
            aria-pressed={isShown}
            title={showLabel}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-sm text-ui-ink/60 outline-none hover:text-ui-ink focus-visible:text-ui-ink focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ui-stamp"
          >
            <EyeIcon isOpen={isShown} />
          </button>
        </span>
      </label>
      {(hint || error) && (
        <span
          id={hintId}
          className={`mt-1 block text-sm ${error ? 'font-semibold text-ui-danger' : 'opacity-70'}`}
        >
          {error ?? hint}
        </span>
      )}
    </div>
  );
}

// An eye drawn with a felt pen: open while the password shows, crossed out while it hides.
function EyeIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" fill={isOpen ? 'currentColor' : 'none'} />
      {!isOpen && <path d="M4 4l16 16" />}
    </svg>
  );
}

type Props = {
  mode: 'signup' | 'login';
};

export function AuthForm({ mode }: Props) {
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
