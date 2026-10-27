import { useState } from 'react';
import {
  listAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from '../../api/account';
import { useResource } from '../../hooks/useResource';
import { useToast } from '../../state/ToastContext';
import { validateAddress, hasErrors } from '../../lib/validation';
import {
  AddressFields,
  EMPTY_ADDRESS,
  fromSavedAddress,
  formatAddressLines,
} from '../../components/checkout/AddressFields';
import { LoadingState, ErrorState } from '../../components/ui/States';

function AddressForm({ initial, onCancel, onSave, submitLabel }) {
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const found = validateAddress(value);
    setErrors(found);
    if (hasErrors(found)) return;
    setSaving(true);
    try {
      await onSave(value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="narrow-form address-form">
      <AddressFields value={value} errors={errors} onChange={setValue} />
      <div className="dialog__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

/** FR011 address book: add, edit, choose default, delete. */
export default function AddressesPage() {
  const addresses = useResource(listAddresses, []);
  const toast = useToast();
  const [editing, setEditing] = useState(null); // 'new' | address id
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const run = async (action, message) => {
    try {
      await action();
      toast.success(message);
      setEditing(null);
      setConfirmingDelete(null);
      addresses.reload();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (addresses.loading) return <LoadingState label="Loading addresses" />;
  if (addresses.error) return <ErrorState error={addresses.error} onRetry={addresses.reload} />;
  const list = addresses.data || [];

  return (
    <section aria-labelledby="addresses-heading">
      <div className="section-head">
        <h2 id="addresses-heading">Addresses</h2>
        {editing !== 'new' && (
          <button type="button" className="btn btn--secondary" onClick={() => setEditing('new')}>
            Add an address
          </button>
        )}
      </div>

      {editing === 'new' && (
        <AddressForm
          initial={EMPTY_ADDRESS}
          submitLabel="Save address"
          onCancel={() => setEditing(null)}
          onSave={(value) => run(() => addAddress(value), 'Address saved')}
        />
      )}

      {!list.length && editing !== 'new' && <p>You have no saved addresses yet.</p>}

      <ul className="address-list">
        {list.map((address) => (
          <li key={address.id} className="address-card">
            {editing === address.id ? (
              <AddressForm
                initial={fromSavedAddress(address)}
                submitLabel="Save changes"
                onCancel={() => setEditing(null)}
                onSave={(value) =>
                  run(
                    () => updateAddress(address.id, { ...value, isDefault: address.is_default }),
                    'Address updated'
                  )
                }
              />
            ) : (
              <>
                <address>
                  {formatAddressLines(address).map((lineText) => (
                    <span key={lineText}>{lineText}</span>
                  ))}
                </address>
                {address.is_default && <p className="address-card__default">Default address</p>}
                <div className="address-card__actions">
                  <button
                    type="button"
                    className="btn--link"
                    onClick={() => setEditing(address.id)}
                  >
                    Edit
                  </button>
                  {!address.is_default && (
                    <button
                      type="button"
                      className="btn--link"
                      onClick={() =>
                        run(() => setDefaultAddress(address.id), 'Default address changed')
                      }
                    >
                      Make default
                    </button>
                  )}
                  {confirmingDelete === address.id ? (
                    <span className="confirm-inline" role="group" aria-label="Confirm delete">
                      Delete this address?{' '}
                      <button
                        type="button"
                        className="btn--link"
                        onClick={() => run(() => deleteAddress(address.id), 'Address deleted')}
                      >
                        Yes, delete
                      </button>{' '}
                      <button
                        type="button"
                        className="btn--link"
                        onClick={() => setConfirmingDelete(null)}
                      >
                        Keep it
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn--link"
                      onClick={() => setConfirmingDelete(address.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
