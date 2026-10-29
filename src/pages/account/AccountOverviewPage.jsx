import { useRef, useState } from 'react';
import {
  deleteAvatar,
  getPreferences,
  updatePreferences,
  updateProfile,
  uploadAvatar,
} from '../../api/account';
import { useAuth } from '../../state/AuthContext';
import { useToast } from '../../state/ToastContext';
import { useResource } from '../../hooks/useResource';
import { FormField } from '../../components/ui/FormField';
import { ErrorState } from '../../components/ui/States';
import { LoyaltyCard } from '../../components/account/LoyaltyCard';
import { SIZE_OPTIONS } from '../../lib/catalogQuery';
import { PHONE_PATTERN } from '../../lib/validation';

const NAME_MIN = 2;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// #189 (FR-010): toggles shown for each stored preference, newest first.
const TOGGLES = [
  ['order_updates_email', 'Email me when my order status changes'],
  ['sale_alerts', 'Tell me when a wishlist item goes on sale'],
  ['back_in_stock_alerts', 'Tell me when a wishlist item is back in stock'],
  ['newsletter', 'Send me news and offers by email'],
  ['push_notifications', 'Send me browser notifications'],
];

/** #189: profile picture, upload or remove, with a client-side size/type check first. */
function AvatarEditor({ avatarUrl, onChange }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (event) => {
    const file = event.target.files?.[0];
    const clear = () => {
      if (inputRef.current) inputRef.current.value = '';
    };
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error('Choose a JPEG, PNG or WebP photo.');
      clear();
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('That photo is larger than 5 MB.');
      clear();
      return;
    }
    setBusy(true);
    try {
      const { avatar_url: url } = await uploadAvatar(file);
      onChange(url);
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
      clear();
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteAvatar();
      onChange(null);
      toast.success('Profile picture removed');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="avatar-editor">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="avatar-editor__image" />
      ) : (
        <span className="avatar-editor__placeholder" aria-hidden="true" />
      )}
      <div className="avatar-editor__actions">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {avatarUrl ? 'Change photo' : 'Add a photo'}
        </button>
        {avatarUrl && (
          <button type="button" className="btn btn--link" disabled={busy} onClick={remove}>
            Remove
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Upload a profile picture"
          className="visually-hidden"
          onChange={pick}
        />
      </div>
    </div>
  );
}

/** #189 (FR-010): shopping preferences, saved one change at a time. */
function PreferencesForm() {
  const toast = useToast();
  const { data: preferences, setData, error, reload } = useResource(getPreferences, []);
  const [savingKey, setSavingKey] = useState(null);

  const save = async (key, value) => {
    setSavingKey(key);
    try {
      const saved = await updatePreferences({ [key]: value });
      setData(saved);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingKey(null);
    }
  };

  if (error) {
    return <ErrorState error={error} title="Could not load your preferences" onRetry={reload} />;
  }
  if (!preferences) return null;

  return (
    <div className="preferences">
      <fieldset>
        <legend className="visually-hidden">Notifications</legend>
        {TOGGLES.map(([key, label]) => (
          <label key={key} className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(preferences[key])}
              disabled={savingKey === key}
              onChange={(e) => save(key, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <FormField
        as="select"
        label="Preferred payment method"
        value={preferences.preferred_payment}
        disabled={savingKey === 'preferred_payment'}
        onChange={(e) => save('preferred_payment', e.target.value)}
      >
        <option value="card">Card</option>
        <option value="cod">Cash on delivery</option>
      </FormField>
      <FormField
        as="select"
        label="Usual size"
        value={preferences.preferred_size || ''}
        disabled={savingKey === 'preferred_size'}
        onChange={(e) => save('preferred_size', e.target.value || null)}
      >
        <option value="">No preference</option>
        {SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </FormField>
    </div>
  );
}

export default function AccountOverviewPage() {
  const { customer, updateCustomer } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
  });
  const [avatarUrl, setAvatarUrl] = useState(customer?.avatar_url || null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    const found = {};
    if (values.name.trim().length < NAME_MIN) found.name = 'Enter your name.';
    if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())) {
      found.phone = 'Enter a phone number such as +94 77 123 4567.';
    }
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const updated = await updateProfile({ name: values.name.trim(), phone: values.phone.trim() });
      updateCustomer({ ...customer, ...updated });
      toast.success('Your details are saved');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const onAvatarChange = (url) => {
    setAvatarUrl(url);
    updateCustomer({ ...customer, avatar_url: url });
  };

  return (
    <div className="account-overview">
      <section aria-labelledby="details-heading">
        <h2 id="details-heading">Your details</h2>
        <AvatarEditor avatarUrl={avatarUrl} onChange={onAvatarChange} />
        <form onSubmit={save} noValidate className="narrow-form">
          <FormField
            label="Full name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            error={errors.name}
          />
          <FormField
            label="Email"
            value={customer?.email || ''}
            readOnly
            hint="Contact the shop to change your email."
          />
          <FormField
            label="Mobile number"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
            error={errors.phone}
          />
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save details'}
          </button>
        </form>
      </section>
      <section aria-labelledby="preferences-heading">
        <h2 id="preferences-heading">Shopping preferences</h2>
        <PreferencesForm />
      </section>
      <LoyaltyCard />
    </div>
  );
}
