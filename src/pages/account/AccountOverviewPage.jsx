import { useState } from 'react';
import { updateProfile } from '../../api/account';
import { useAuth } from '../../state/AuthContext';
import { useToast } from '../../state/ToastContext';
import { FormField } from '../../components/ui/FormField';
import { LoyaltyCard } from '../../components/account/LoyaltyCard';
import { PHONE_PATTERN } from '../../lib/validation';

const NAME_MIN = 2;

export default function AccountOverviewPage() {
  const { customer, updateCustomer } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
  });
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

  return (
    <div className="account-overview">
      <section aria-labelledby="details-heading">
        <h2 id="details-heading">Your details</h2>
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
      <LoyaltyCard />
    </div>
  );
}
