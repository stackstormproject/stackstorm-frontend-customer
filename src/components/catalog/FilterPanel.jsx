import { Link } from 'react-router-dom';
import { SIZE_OPTIONS, PRICE_BANDS } from '../../lib/catalogQuery';

/**
 * FR002 filters. Each control writes to the URL through `onChange(key, value)`.
 * Sub-categories of the current top-level category are listed as links.
 */
export function FilterPanel({ id, isOpen, category, categories, params, onChange, onClear }) {
  const current = (categories || []).find((c) => c.slug === category);
  const parent = current?.parentId ? categories.find((c) => c.id === current.parentId) : current;
  const children = parent ? categories.filter((c) => c.parentId === parent.id) : [];

  return (
    <aside id={id} className={`filters ${isOpen ? 'is-open' : ''}`} aria-label="Filters">
      {parent && children.length > 0 && (
        <fieldset className="filters__group">
          <legend>{parent.name}</legend>
          <ul className="filters__links">
            <li>
              <Link
                to={`/shop/${parent.slug}`}
                aria-current={category === parent.slug ? 'page' : undefined}
              >
                All {parent.name.toLowerCase()}
              </Link>
            </li>
            {children.map((child) => (
              <li key={child.id}>
                <Link
                  to={`/shop/${child.slug}`}
                  aria-current={category === child.slug ? 'page' : undefined}
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <fieldset className="filters__group">
        <legend>Size</legend>
        <div className="chips">
          {SIZE_OPTIONS.map((size) => {
            const selected = params.get('size') === size;
            return (
              <button
                key={size}
                type="button"
                className={`chip ${selected ? 'is-selected' : ''}`}
                aria-pressed={selected}
                onClick={() => onChange('size', selected ? '' : size)}
              >
                {size}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="filters__group">
        <legend>Price</legend>
        {PRICE_BANDS.map((band) => (
          <label key={band.value} className="radio">
            <input
              type="radio"
              name="price"
              value={band.value}
              checked={params.get('price') === band.value}
              onChange={() => onChange('price', band.value)}
            />
            {band.label}
          </label>
        ))}
        <label className="radio">
          <input
            type="radio"
            name="price"
            value=""
            checked={!params.get('price')}
            onChange={() => onChange('price', '')}
          />
          Any price
        </label>
      </fieldset>

      <button type="button" className="btn--link" onClick={onClear}>
        Clear filters
      </button>
    </aside>
  );
}
