import { useState } from 'react';
import { RETURN_REASONS, requestReturn } from '../../api/returns';
import { getProduct } from '../../api/catalog';
import { useResource } from '../../hooks/useResource';
import { useDialog } from '../../hooks/useDialog';
import { availableOf } from '../../lib/stock';
import { sortSizes } from '../../lib/catalogQuery';
import { FormField } from '../ui/FormField';

/** FR023 / UC-005: request a refund or a size exchange for one order line. */
export function ReturnDialog({ item, onClose, onRequested }) {
  const ref = useDialog(true, onClose);
  const [type, setType] = useState('return');
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [details, setDetails] = useState('');
  const [exchangeVariantId, setExchangeVariantId] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const product = useResource(
    () => (item.product_slug ? getProduct(item.product_slug) : Promise.resolve(null)),
    [item.product_slug]
  );
  const exchangeOptions = (product.data?.variants || []).filter(
    (v) => v.id !== item.variant_id && availableOf(v) > 0
  );
  const orderedOptions = sortSizes(exchangeOptions.map((v) => v.size)).flatMap((size) =>
    exchangeOptions.filter((v) => v.size === size)
  );

  const submit = async (event) => {
    event.preventDefault();
    if (type === 'exchange' && !exchangeVariantId) {
      setError('Choose the size you want instead.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await requestReturn({
        orderItemId: item.id,
        type,
        reason: details.trim() ? `${reason}: ${details.trim()}` : reason,
        exchangeVariantId: Number(exchangeVariantId) || undefined,
      });
      onRequested(type);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="drawer-layer">
      <div className="drawer-backdrop" aria-hidden="true" />
      <div
        ref={ref}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-title"
      >
        <h2 id="return-title">Return or exchange</h2>
        <p className="muted">
          {item.product_title} ({[item.size, item.color].filter(Boolean).join(', ')})
        </p>
        <form onSubmit={submit} noValidate>
          <fieldset className="option-group">
            <legend>What would you like?</legend>
            <label className="choice">
              <input
                type="radio"
                name="type"
                checked={type === 'return'}
                onChange={() => setType('return')}
              />
              <span>Refund to my card</span>
            </label>
            <label className="choice">
              <input
                type="radio"
                name="type"
                checked={type === 'exchange'}
                onChange={() => setType('exchange')}
              />
              <span>Exchange for another size</span>
            </label>
          </fieldset>
          {type === 'exchange' && (
            <FormField
              as="select"
              label="New size"
              value={exchangeVariantId}
              onChange={(e) => setExchangeVariantId(e.target.value)}
              hint={
                product.data && !orderedOptions.length
                  ? 'No other sizes are in stock right now.'
                  : undefined
              }
            >
              <option value="">Choose a size</option>
              {orderedOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {[v.size, v.color].filter(Boolean).join(', ')}
                </option>
              ))}
            </FormField>
          )}
          <FormField
            as="select"
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {RETURN_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </FormField>
          <FormField
            as="textarea"
            label="Anything else we should know? (optional)"
            value={details}
            maxLength={500}
            onChange={(e) => setDetails(e.target.value)}
          />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
