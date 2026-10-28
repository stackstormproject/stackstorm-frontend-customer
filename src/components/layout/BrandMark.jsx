/**
 * The shop's mark: a loom shuttle crossing three warp threads, in gold on indigo.
 * Decorative; the link around it carries the accessible name.
 */
export function BrandMark({ size = 40 }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="40" height="40" rx="9" fill="#0a192f" />
      <path d="M12 6v28M20 6v28M28 6v28" stroke="#f3ecdc" strokeWidth="1.6" opacity="0.55" />
      <path
        d="M5 23c5-6 25-6 30 0-5 6-25 6-30 0Z"
        fill="#d4af37"
        stroke="#0a192f"
        strokeWidth="1.2"
      />
      <path d="M13 23h14" stroke="#0a192f" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
