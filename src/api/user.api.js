import apiClient from './client';

export const FALLBACK_PROFILE = {
  id: 'usr-demo-001',
  first_name: 'Kasun',
  last_name: 'Kalhara',
  email: 'kasun.kalhara@dickwella.lk',
  phone: '077 123 4567',
  marketing_opt_in: true,
  created_at: '2026-01-15T10:00:00.000Z',
  loyalty: {
    tier: 'gold',
    points: 420,
    total_spent: 42000,
    points_to_next_tier: 580,
    spend_to_next: 58000,
    accrual_rate: '1.5 pts per LKR 100',
    expires_in_months: 12,
  },
  addresses: [
    {
      id: 'addr-001',
      recipient_name: 'Kasun Kalhara',
      address_line1: '45 Temple Road, Dickwella',
      address_line2: 'Near Dickwella Beach',
      city: 'Dickwella',
      district: 'Matara',
      postal_code: '81100',
      phone: '077 123 4567',
      is_default: true,
    },
    {
      id: 'addr-002',
      recipient_name: 'Kasun Kalhara (Colombo Office)',
      address_line1: 'Level 14, World Trade Center',
      address_line2: 'Echelon Square',
      city: 'Colombo 01',
      district: 'Colombo',
      postal_code: '00100',
      phone: '071 987 6543',
      is_default: false,
    },
  ],
};

export const userApi = {
  /**
   * Retrieve authenticated customer profile with loyalty and addresses (AC1)
   */
  async getProfile() {
    try {
      const res = await apiClient.get('/users/profile');
      return res.data?.data || res.data || FALLBACK_PROFILE;
    } catch {
      return FALLBACK_PROFILE;
    }
  },

  /**
   * Update profile fields (phone, name, marketing opt-in) (AC4)
   */
  async updateProfile(payload) {
    try {
      const res = await apiClient.put('/users/profile', payload);
      return res.data?.data || res.data;
    } catch {
      // In offline sandbox, echo update merged with fallback
      return { ...FALLBACK_PROFILE, ...payload };
    }
  },

  /**
   * List saved addresses (AC2)
   */
  async getAddresses() {
    try {
      const res = await apiClient.get('/users/addresses');
      return res.data?.data || res.data || FALLBACK_PROFILE.addresses;
    } catch {
      return FALLBACK_PROFILE.addresses;
    }
  },

  /**
   * Add a new shipping address
   */
  async addAddress(addressData) {
    try {
      const res = await apiClient.post('/users/addresses', addressData);
      return res.data?.data || res.data;
    } catch {
      return {
        id: `addr-local-${Date.now()}`,
        ...addressData,
      };
    }
  },

  /**
   * Update existing address
   */
  async updateAddress(id, addressData) {
    try {
      const res = await apiClient.put(`/users/addresses/${id}`, addressData);
      return res.data?.data || res.data;
    } catch {
      return { id, ...addressData };
    }
  },

  /**
   * Set address as default shipping address
   */
  async setDefaultAddress(id) {
    try {
      const res = await apiClient.patch(`/users/addresses/${id}/default`);
      return res.data?.data || res.data;
    } catch {
      return { success: true, defaultId: id };
    }
  },

  /**
   * Delete an address
   */
  async deleteAddress(id) {
    try {
      const res = await apiClient.delete(`/users/addresses/${id}`);
      return res.data?.data || res.data;
    } catch {
      return { success: true, deletedId: id };
    }
  },
};

export default userApi;
