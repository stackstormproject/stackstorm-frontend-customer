import logoIcon from '../../assets/logo-icon.png';

/**
 * The shop's mark. Decorative; the link around it carries the accessible name.
 */
export function BrandMark({ size = 40 }) {
  return (
    <img
      className="brand-mark"
      src={logoIcon}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
    />
  );
}
