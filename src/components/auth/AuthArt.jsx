/*
 * Background picture for the sign-in pages (#186), drawn in code like the home banners: the
 * shop's own goods (a folded batik stack, a handloom saree and a woven bag) on a gold podium,
 * with gold diamonds drifting around. Decorative only; the motion stops for reduced motion.
 */

const INDIGO = '#1d3461';
const NAVY = '#0a192f';
const GOLD = '#d4af37';
const GOLD_DARK = '#b8952b';
const COTTON = '#f3ecdc';
const MADDER = '#a8322d';

const DIAMONDS = [
  [40, 70, 12],
  [120, 30, 9],
  [300, 40, 14],
  [380, 110, 10],
  [70, 190, 8],
  [350, 220, 12],
  [200, 18, 7],
  [25, 300, 10],
  [395, 330, 8],
];

export function AuthArt() {
  return (
    <svg viewBox="0 0 420 440" className="auth-art" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="auth-batik" width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill={INDIGO} />
          <circle cx="14" cy="14" r="7" fill="none" stroke={COTTON} strokeWidth="1.6" />
          <circle cx="14" cy="14" r="2.6" fill={GOLD} />
        </pattern>
        <pattern id="auth-weave" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill={GOLD} />
          <path d="M0 6h12M6 0v12" stroke={GOLD_DARK} strokeWidth="2" />
        </pattern>
        <linearGradient id="auth-podium" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f0cf6a" />
          <stop offset="1" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>

      <g className="auth-art__diamonds">
        {DIAMONDS.map(([x, y, r], i) => (
          <path
            key={`${x}-${y}`}
            d={`M${x} ${y - r}l${r * 0.7} ${r}-${r * 0.7} ${r}-${r * 0.7}-${r}z`}
            fill={i % 3 === 0 ? COTTON : GOLD}
            opacity={i % 3 === 0 ? 0.8 : 0.95}
            style={{ animationDelay: `${i * -0.7}s` }}
          />
        ))}
      </g>

      {/* Podium */}
      <ellipse cx="210" cy="400" rx="190" ry="30" fill={GOLD_DARK} />
      <path d="M20 400v-34h380v34z" fill="url(#auth-podium)" />
      <ellipse cx="210" cy="366" rx="190" ry="30" fill="#f4dc8c" />
      <ellipse cx="250" cy="352" rx="130" ry="20" fill={GOLD_DARK} />
      <path d="M120 352v-26h260v26z" fill="url(#auth-podium)" />
      <ellipse cx="250" cy="326" rx="130" ry="20" fill="#f6e3a3" />

      {/* Folded batik shirts */}
      <g className="auth-art__float">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0 ${-i * 34})`}>
            <rect x="72" y="292" width="120" height="30" rx="5" fill="url(#auth-batik)" />
            <rect
              x="72"
              y="292"
              width="120"
              height="30"
              rx="5"
              fill="none"
              stroke={GOLD}
              strokeWidth="2"
            />
            <path d="M118 292l14 12 14-12" fill="none" stroke={COTTON} strokeWidth="2" />
          </g>
        ))}
      </g>

      {/* Saree on a stand */}
      <g className="auth-art__sway">
        <path d="M262 120h96" stroke={NAVY} strokeWidth="6" strokeLinecap="round" />
        <path d="M310 120v-14" stroke={NAVY} strokeWidth="4" />
        <circle cx="310" cy="102" r="5" fill={GOLD} />
        <path
          d="M268 124c-6 70 4 140-10 200h104c-14-60-4-130-10-200z"
          fill={MADDER}
          stroke={GOLD}
          strokeWidth="3"
        />
        <path d="M262 300h104" stroke={GOLD} strokeWidth="8" />
        <path d="M272 140c20 30 64 30 84 0" fill="none" stroke={GOLD} strokeWidth="3" />
        {[180, 220, 260].map((y) => (
          <path key={y} d={`M314 ${y}l7 9-7 9-7-9z`} fill={GOLD} />
        ))}
      </g>

      {/* Woven bag */}
      <g>
        <path d="M206 268c0-30 44-30 44 0" fill="none" stroke={NAVY} strokeWidth="5" />
        <path d="M192 268h72l-8 58h-56z" fill="url(#auth-weave)" stroke={NAVY} strokeWidth="3" />
      </g>
    </svg>
  );
}
