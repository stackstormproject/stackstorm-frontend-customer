import { http } from '../lib/http';

/** GET /users/me (FR011) */
export const getProfile = () => http.get('/users/me');

export const updateProfile = ({ name, phone }) => http.patch('/users/me', { name, phone });

/**
 * POST /users/me/avatar (multipart field "avatar"), JPEG/PNG/WebP up to 5 MB -> { avatar_url }
 * (#189, FR-010/FR-34).
 */
export const uploadAvatar = (file) => {
  const form = new FormData();
  form.append('avatar', file);
  return http.post('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** DELETE /users/me/avatar -> { avatar_url: null } (#189) */
export const deleteAvatar = () => http.delete('/users/me/avatar');

/** GET /users/me/preferences (#189, FR-010) */
export const getPreferences = () => http.get('/users/me/preferences');

/** PATCH /users/me/preferences with only the changed keys (#189, FR-010) */
export const updatePreferences = (changes) => http.patch('/users/me/preferences', changes);

/** GET /users/me/payment-methods (#190, FR-012) */
export const listPaymentMethods = () => http.get('/users/me/payment-methods');

export const setDefaultPaymentMethod = (id) =>
  http.patch(`/users/me/payment-methods/${id}/default`);

export const deletePaymentMethod = (id) => http.delete(`/users/me/payment-methods/${id}`);

export const listAddresses = () => http.get('/users/addresses');

/** The address book uses the same fields as the checkout form (see lib/address.js). */
const toAddressBody = (address) => ({
  address_line1: address.line1,
  address_line2: address.line2 || null,
  city: address.city,
  state: address.district || null,
  postal_code: address.postalCode,
  country: 'Sri Lanka',
  is_default: Boolean(address.isDefault),
});

export const addAddress = (address) => http.post('/users/addresses', toAddressBody(address));

export const updateAddress = (id, address) =>
  http.put(`/users/addresses/${id}`, toAddressBody(address));

export const setDefaultAddress = (id) => http.patch(`/users/addresses/${id}/default`);

export const deleteAddress = (id) => http.delete(`/users/addresses/${id}`);

/** GET /loyalty -> { tier, current_points, lifetime_points, benefits } (FR027) */
export const getLoyalty = () => http.get('/loyalty');

export const listLoyaltyTransactions = (page = 1) =>
  http.get('/loyalty/transactions', { params: { page } });
