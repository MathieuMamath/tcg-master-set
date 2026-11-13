'use client';

import { useId, useState } from 'react';

const INPUT_CLASS =
  'w-full rounded-sm border-2 border-ui-ink/30 bg-white px-3 py-2 text-lg text-ui-ink outline-none focus:border-ui-ink focus:bg-ui-accent/20';

export function Field({
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
export function PasswordField({
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
