const SWIRLS = [
  { d: 'M330 90C560 70 660 300 590 500S300 800 110 700', width: 70, opacity: 0.35 },
  { d: 'M60 620C-10 400 120 150 340 130S640 300 610 470', width: 46, opacity: 0.4 },
  { d: 'M600 300C640 520 470 780 250 790S20 640 50 470', width: 54, opacity: 0.3 },
  { d: 'M120 480C100 290 260 190 400 220S590 400 520 560', width: 42, opacity: 0.75 },
  { d: 'M540 440C560 610 390 720 250 680S80 500 150 370', width: 42, opacity: 0.75 },
  { d: 'M210 270C320 190 480 240 530 340', width: 18, opacity: 0.8 },
  { d: 'M450 660C340 730 180 680 130 570', width: 18, opacity: 0.8 },
];

export function CardBack() {
  return (
    <svg
      viewBox="0 0 660 912"
      aria-hidden="true"
      className="block size-full rounded-[4.5%/3.2%]"
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="card-back-sky" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#7fa8dc" />
          <stop offset="55%" stopColor="#2f62ae" />
          <stop offset="100%" stopColor="#123a7d" />
        </radialGradient>
        <linearGradient id="card-back-red" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0642c" />
          <stop offset="100%" stopColor="#b82a12" />
        </linearGradient>
        <linearGradient id="card-back-white" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d9d9d4" />
          <stop offset="100%" stopColor="#a3a39e" />
        </linearGradient>
        <filter id="card-back-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
        <filter id="card-back-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <clipPath id="card-back-panel">
          <rect x="24" y="34" width="600" height="846" rx="10" />
        </clipPath>
      </defs>

      <rect width="660" height="912" fill="#1b2a63" />
      <g clipPath="url(#card-back-panel)">
        <rect x="24" y="34" width="600" height="846" fill="url(#card-back-sky)" />
        <g fill="none" stroke="#f2f6ff" strokeLinecap="round" filter="url(#card-back-blur)">
          {SWIRLS.map(({ d, width, opacity }) => (
            <path key={d} d={d} strokeWidth={width} opacity={opacity} />
          ))}
        </g>
        <circle cx="330" cy="456" r="178" fill="#f2f6ff" filter="url(#card-back-glow)" />
      </g>

      <g transform="rotate(14 330 456)">
        <circle cx="330" cy="456" r="152" fill="url(#card-back-white)" />
        <path d="M178 456a152 152 0 0 1 304 0Z" fill="url(#card-back-red)" />
        <ellipse cx="395" cy="375" rx="26" ry="14" fill="#fff" opacity="0.6" />
        <ellipse cx="385" cy="535" rx="26" ry="18" fill="#fff" opacity="0.55" />
        <rect x="178" y="444" width="304" height="24" fill="#f7f7f4" />
        <path d="M178 444h304M178 468h304" stroke="#17171c" strokeWidth="4" />
        <circle cx="264" cy="456" r="48" fill="#17171c" />
        <circle cx="264" cy="456" r="30" fill="#b8d6ea" stroke="#f7f7f4" strokeWidth="5" />
        <circle cx="258" cy="449" r="9" fill="#fff" opacity="0.8" />
      </g>
    </svg>
  );
}
