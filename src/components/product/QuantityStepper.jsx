/** Accessible - n + control bounded by [min, max]. */
export function QuantityStepper({ value, min = 1, max, onChange, label = 'Quantity', disabled }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Decrease ${label.toLowerCase()}`}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
      >
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        aria-label={`Increase ${label.toLowerCase()}`}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
      >
        +
      </button>
    </div>
  );
}
