// The scrap of paper every account page sits on, with its title and a line under it.
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
    <main className="flex flex-1 items-center justify-center p-4 font-game">
      <div className="ui-pop-in w-full max-w-md ui-scrap p-6 text-ui-ink">
        <h1 className="font-display text-3xl">{title}</h1>
        {intro && <p className="mt-1 opacity-80">{intro}</p>}
        {children}
      </div>
    </main>
  );
}

export const AUTH_BUTTON_CLASS =
  'cursor-pointer ui-paper-button bg-ui-accent px-5 py-2 text-lg font-semibold disabled:cursor-wait disabled:opacity-60';

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-lg border-2 border-ui-ink bg-ui-danger p-2 font-medium text-white"
    >
      {children}
    </p>
  );
}
