import { swatchFor } from '../../lib/colours';

/** FR-002 colour filter (#191): in-stock colours from the server, as named swatches. */
export function ColourFilter({ colours, selected, onChange }) {
  if (!colours?.length) return null;
  return (
    <fieldset className="filters__group">
      <legend>Colour</legend>
      <div className="swatches">
        {colours.map(({ name, count }) => {
          const active = selected === name;
          const swatch = swatchFor(name);
          return (
            <button
              key={name}
              type="button"
              className={`swatch-chip ${active ? 'is-selected' : ''}`}
              aria-pressed={active}
              title={`${name} (${count})`}
              onClick={() => onChange(active ? '' : name)}
            >
              <span
                className={`swatch-chip__dot ${swatch ? '' : 'swatch-chip__dot--unknown'}`}
                style={swatch ? { background: swatch } : undefined}
                aria-hidden="true"
              />
              {name}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
