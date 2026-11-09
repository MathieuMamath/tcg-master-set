import { useId } from 'react';

// The small icons of the top bar, drawn like the things they stand for: paper and gold, each
// with its own shading.

// A small booster like the ones in the bag: crimped at both ends, striped, with a star.
export function BoosterIcon() {
  const id = useId();
  return (
    <svg aria-hidden="true" viewBox="0 0 16 22" className="h-5.5 w-4 shrink-0 -rotate-6">
      <defs>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5e4ba8" />
          <stop offset="0.5" stopColor="#3c8fb4" />
          <stop offset="1" stopColor="#7e63be" />
        </linearGradient>
        <clipPath id={`${id}-outline`}>
          <path d="M0 1.5 2 0 4 1.5 6 0 8 1.5 10 0 12 1.5 14 0 16 1.5V20.5L14 22 12 20.5 10 22 8 20.5 6 22 4 20.5 2 22 0 20.5Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-outline)`}>
        <rect width="16" height="22" fill={`url(#${id}-paper)`} />
        <path
          d="M-8 15 4 -3M-4 22 12 -2M2 26 18 2M10 26 22 8"
          stroke="#fff"
          strokeOpacity="0.2"
          strokeWidth="2.5"
        />
        <rect width="16" height="3.5" fill="#000" fillOpacity="0.25" />
        <rect y="18.5" width="16" height="3.5" fill="#000" fillOpacity="0.25" />
      </g>
      <path
        d="M8 6.8 9.2 9.4 12 9.7 9.9 11.6 10.5 14.4 8 13 5.5 14.4 6.1 11.6 4 9.7 6.8 9.4Z"
        fill="var(--ui-accent)"
        stroke="var(--ui-paper)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// A gold coin with a raised rim, a star stamped in the middle and a glint of light.
export function CoinIcon() {
  const id = useId();
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4.5 shrink-0">
      <defs>
        <radialGradient id={`${id}-gold`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fbe08a" />
          <stop offset="0.55" stopColor="#f3c14b" />
          <stop offset="1" stopColor="#d99a22" />
        </radialGradient>
      </defs>
      <circle cx="10" cy="10.6" r="9" fill="#9a6c14" />
      <circle cx="10" cy="9.6" r="9" fill="#b8861f" />
      <circle cx="10" cy="9.6" r="7.2" fill={`url(#${id}-gold)`} />
      <circle cx="10" cy="9.6" r="5.6" fill="none" stroke="#c99322" strokeWidth="0.8" />
      <path
        d="M10 5.9 11.1 8.3 13.6 8.5 11.7 10.2 12.3 12.7 10 11.4 7.7 12.7 8.3 10.2 6.4 8.5 8.9 8.3Z"
        fill="#c99322"
      />
      <path
        d="M5.2 7.2A5.6 5.6 0 0 1 8.4 4.4"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.75"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// A binder like the ones the bookshop sells: striped paper, a dark spine with its rings, and a
// label on the cover.
export function BinderIcon() {
  const id = useId();
  return (
    <svg aria-hidden="true" viewBox="0 0 18 22" className="h-5.5 w-4.5 shrink-0 rotate-3">
      <defs>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f8f68" />
          <stop offset="0.5" stopColor="#4fbf8f" />
          <stop offset="1" stopColor="#1f8f68" />
        </linearGradient>
        <clipPath id={`${id}-cover`}>
          <rect x="1" y="0.5" width="16.5" height="20.5" rx="2" />
        </clipPath>
      </defs>
      <rect x="1.6" y="1.4" width="16.4" height="20.6" rx="2" fill="#2c2a35" fillOpacity="0.25" />
      <g clipPath={`url(#${id}-cover)`}>
        <rect width="18" height="22" fill={`url(#${id}-paper)`} />
        <path
          d="M2 24 18 6M8 26 22 10M-4 18 14 -2"
          stroke="#fff"
          strokeOpacity="0.2"
          strokeWidth="2.5"
        />
        <rect width="5" height="22" fill="#2c2a35" fillOpacity="0.6" />
      </g>
      {[5.5, 15].map((y) => (
        <rect
          key={y}
          x="2"
          y={y}
          width="3"
          height="1.8"
          rx="0.9"
          fill="#fbf6ea"
          fillOpacity="0.85"
        />
      ))}
      <rect x="7.5" y="7" width="7.5" height="5" rx="1" fill="#fbf6ea" />
      <path
        d="M8.8 9.5h5"
        stroke="#2c2a35"
        strokeOpacity="0.4"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}
