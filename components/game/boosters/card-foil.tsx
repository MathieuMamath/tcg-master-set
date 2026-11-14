import type { Foil } from '@/game/cards/foil';

// The light a special card catches, laid over its picture: a holo's or a reverse's foil with a
// glare, or a passing shine for the other versions. The foil follows `--foil-x`, `--foil-y` and
// `--foil-on` from the card it sits in, set by `TiltCard` or drifting under `ui-foil-idle`.
export function CardFoil({ foil }: { foil: Foil | null }) {
  if (foil === null) {
    return null;
  }
  if (foil === 'shine') {
    return (
      <span
        aria-hidden="true"
        className="ui-shine pointer-events-none absolute inset-0 rounded-[4.5%/3.2%]"
      />
    );
  }
  return (
    <>
      <span
        aria-hidden="true"
        className={`ui-foil rounded-[4.5%/3.2%] ${foil === 'holo' ? 'ui-foil-holo' : 'ui-foil-reverse'}`}
      />
      <span aria-hidden="true" className="ui-foil-glare rounded-[4.5%/3.2%]" />
    </>
  );
}
