/*
 * Illustrations for the home banners, drawn in code from the shop's own crafts so the page
 * needs no stock photos: a wax-resist batik shirt, a saree on the loom and a festival sarong.
 * All decorative (aria-hidden); motion lives in home.css and stops for reduced motion.
 */

const INDIGO = '#1d3461';
const NAVY = '#0a192f';
const GOLD = '#d4af37';
const COTTON = '#f3ecdc';
const MADDER = '#a8322d';

export function BatikShirtArt() {
  return (
    <svg viewBox="0 0 400 320" className="banner-art banner-art--batik" aria-hidden="true">
      <defs>
        <pattern id="art-batik" width="48" height="48" patternUnits="userSpaceOnUse">
          <rect width="48" height="48" fill={INDIGO} />
          <circle cx="24" cy="24" r="13" fill="none" stroke={COTTON} strokeWidth="2.5" />
          <circle cx="24" cy="24" r="5" fill={GOLD} />
          <path
            d="M0 0q12 10 0 24M48 24q-12 10 0 24"
            fill="none"
            stroke={COTTON}
            strokeWidth="1.5"
          />
          <path d="M24 0v6M24 42v6M0 24h6M42 24h6" stroke={GOLD} strokeWidth="2" />
        </pattern>
        <pattern id="art-crackle" width="90" height="90" patternUnits="userSpaceOnUse">
          <path
            d="M5 20l18 9 6 21 25 4M60 0l-4 22 20 15M30 70l22-8 10 28"
            fill="none"
            stroke={COTTON}
            strokeOpacity="0.18"
            strokeWidth="1"
          />
        </pattern>
        <radialGradient id="art-fade">
          <stop offset="0.4" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id="art-fade-mask">
          <rect width="400" height="320" fill="url(#art-fade)" />
        </mask>
      </defs>
      <rect width="400" height="320" fill="url(#art-crackle)" mask="url(#art-fade-mask)" />
      <g className="banner-art__float">
        <path
          d="M140 48l38-18h44l38 18 62 40-26 48-36-18v162H140V118l-36 18-26-48z"
          fill="url(#art-batik)"
          stroke={GOLD}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M178 30q22 26 44 0" fill="none" stroke={GOLD} strokeWidth="3" />
        <path
          d="M200 52v226"
          stroke={COTTON}
          strokeOpacity="0.5"
          strokeDasharray="2 14"
          strokeWidth="4"
        />
      </g>
    </svg>
  );
}

export function SareeLoomArt() {
  const warps = Array.from({ length: 15 }, (_, i) => 70 + i * 18);
  return (
    <svg viewBox="0 0 400 320" className="banner-art banner-art--saree" aria-hidden="true">
      <g stroke={COTTON} strokeOpacity="0.35" strokeWidth="2">
        {warps.map((x) => (
          <line key={x} x1={x} y1="20" x2={x} y2="300" />
        ))}
      </g>
      <rect x="60" y="24" width="276" height="10" rx="3" fill={GOLD} />
      <rect x="60" y="286" width="276" height="10" rx="3" fill={GOLD} />
      <g className="banner-art__weave">
        <path
          d="M64 120c60-26 210-26 268 0v120c-58-26-208-26-268 0z"
          fill={MADDER}
          stroke={GOLD}
          strokeWidth="3"
        />
        <path d="M64 136c60-26 210-26 268 0" fill="none" stroke={GOLD} strokeWidth="6" />
        <path d="M64 224c60-26 210-26 268 0" fill="none" stroke={GOLD} strokeWidth="6" />
        <g fill={GOLD} opacity="0.8">
          {[110, 160, 210, 260, 300].map((x) => (
            <path key={x} d={`M${x} 172l8 10-8 10-8-10z`} />
          ))}
        </g>
      </g>
      <g className="banner-art__shuttle">
        <path
          d="M20 90c14-12 56-12 70 0-14 12-56 12-70 0z"
          fill={GOLD}
          stroke={NAVY}
          strokeWidth="2"
        />
        <path d="M38 90h34" stroke={NAVY} strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function FestivalSarongArt() {
  return (
    <svg viewBox="0 0 400 320" className="banner-art banner-art--festival" aria-hidden="true">
      <defs>
        <pattern id="art-checks" width="36" height="36" patternUnits="userSpaceOnUse">
          <rect width="36" height="36" fill={COTTON} />
          <rect width="36" height="12" fill={INDIGO} opacity="0.85" />
          <rect width="12" height="36" fill={MADDER} opacity="0.55" />
          <rect x="22" width="3" height="36" fill={GOLD} />
        </pattern>
      </defs>
      {[90, 200, 310].map((x, i) => (
        <g key={x} className="banner-art__lantern" style={{ animationDelay: `${i * -1.3}s` }}>
          <line x1={x} y1="0" x2={x} y2="38" stroke={GOLD} strokeWidth="2" />
          <path d={`M${x} 38l22 26-22 26-22-26z`} fill={GOLD} />
          <path d={`M${x} 48l12 16-12 16-12-16z`} fill={MADDER} />
          <path
            d={`M${x - 8} 90l-4 22M${x + 8} 90l4 22M${x} 90v26`}
            stroke={GOLD}
            strokeWidth="2"
          />
        </g>
      ))}
      <g className="banner-art__float">
        <path
          d="M110 150h180l14 150H96z"
          fill="url(#art-checks)"
          stroke={NAVY}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M104 172h192" stroke={GOLD} strokeWidth="5" />
        <path d="M200 150l-26 40 26 22 26-22z" fill={INDIGO} stroke={GOLD} strokeWidth="2" />
      </g>
    </svg>
  );
}
