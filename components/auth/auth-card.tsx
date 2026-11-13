import { useTranslations } from 'next-intl';

// The game's name over every account page, with its booster pack, as on the emails' banner.
function Brand() {
  const t = useTranslations('Home');
  return (
    <p className="flex items-center gap-3 text-ui-ink">
      {/* biome-ignore lint/performance/noImgElement: the favicon itself, a small SVG. */}
      <img
        src="/icon.svg"
        alt=""
        width={56}
        height={56}
        className="size-12 -rotate-6 drop-shadow-[2px_3px_0_var(--ui-shadow)] sm:size-14"
      />
      <span className="font-display text-3xl sm:text-4xl">{t('title')}</span>
    </p>
  );
}

// The sheet of paper every account page sits on, with a strip of tape in the corner, under the
// game's name.
export function AuthCard({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-12 font-game">
      <Brand />
      <div className="ui-pop-in w-full max-w-md ui-sheet px-6 pt-7 pb-6 text-ui-ink sm:px-8">
        <span aria-hidden="true" className="ui-paper-grain absolute inset-0 rounded-[0.8rem]" />
        <span
          aria-hidden="true"
          className="absolute -top-3 right-8 h-6 w-20 rotate-6 bg-(--ui-tape)"
        />
        <div className="relative">
          {/* Read by screen readers only: the game's name above and the line below say enough. */}
          <h1 className="sr-only">{title}</h1>
          {intro && <p className="opacity-80">{intro}</p>}
          {children}
        </div>
      </div>
    </main>
  );
}

export const AUTH_BUTTON_CLASS =
  'cursor-pointer ui-chunky-button bg-ui-accent px-5 py-2.5 text-lg font-semibold outline-offset-4 focus-visible:outline-2 focus-visible:outline-ui-ink disabled:cursor-wait disabled:opacity-60';

// The line under a form, set apart by a dashed rule, with the way to another page.
export const AUTH_FOOTER_CLASS =
  'mt-6 border-t-2 border-dashed border-ui-accent-dark/40 pt-4 text-center';

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-xl border-2 border-ui-ink bg-ui-danger px-3 py-2 font-medium text-white"
    >
      {children}
    </p>
  );
}
