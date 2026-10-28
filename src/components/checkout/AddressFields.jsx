import { FormField } from '../ui/FormField';

export const EMPTY_ADDRESS = { line1: '', line2: '', city: '', district: '', postalCode: '' };

export const SRI_LANKA_DISTRICTS = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
];

/** Controlled address inputs shared by checkout and the address book. */
export function AddressFields({ value, errors = {}, onChange }) {
  const set = (field) => (event) => onChange({ ...value, [field]: event.target.value });
  return (
    <>
      <FormField
        label="Street address"
        autoComplete="address-line1"
        value={value.line1}
        onChange={set('line1')}
        error={errors.line1}
      />
      <FormField
        label="Apartment, landmark (optional)"
        autoComplete="address-line2"
        value={value.line2}
        onChange={set('line2')}
      />
      <div className="form-row">
        <FormField
          label="Town or city"
          autoComplete="address-level2"
          value={value.city}
          onChange={set('city')}
          error={errors.city}
        />
        <FormField
          label="Postal code"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          value={value.postalCode}
          onChange={set('postalCode')}
          error={errors.postalCode}
        />
      </div>
      <FormField as="select" label="District" value={value.district} onChange={set('district')}>
        <option value="">Choose a district</option>
        {SRI_LANKA_DISTRICTS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </FormField>
    </>
  );
}

/** Saved address (API shape) -> form shape */
export const fromSavedAddress = (saved) => ({
  line1: saved.address_line1 || '',
  line2: saved.address_line2 || '',
  city: saved.city || '',
  district: saved.state || '',
  postalCode: saved.postal_code || '',
});

/** Form shape -> checkout API shape */
export const toCheckoutAddress = (address) => ({
  line1: address.line1.trim(),
  line2: address.line2?.trim() || undefined,
  city: address.city.trim(),
  district: address.district || undefined,
  postal_code: address.postalCode.trim(),
  country: 'Sri Lanka',
});

export const formatAddressLines = (address) =>
  [
    address?.line1 || address?.address_line1,
    address?.line2 || address?.address_line2,
    [address?.city, address?.postal_code || address?.postalCode].filter(Boolean).join(' '),
    address?.district || address?.state,
  ].filter(Boolean);
