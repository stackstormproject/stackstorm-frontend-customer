import { http } from '../lib/http';

/** GET /users/me (FR011) */
export const getProfile = () => http.get('/users/me');

export const updateProfile = ({ name, phone }) => http.patch('/users/me', { name, phone });

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
