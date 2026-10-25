import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerProfilePage } from '../pages/CustomerProfilePage';
import { LoyaltyCard } from '../components/profile/LoyaltyCard';
import { AddressBook } from '../components/profile/AddressBook';
import userApi from '../api/user.api';

// Mock userApi
vi.mock('../api/user.api', () => ({
  default: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    getAddresses: vi.fn(),
    addAddress: vi.fn(),
    updateAddress: vi.fn(),
    setDefaultAddress: vi.fn(),
    deleteAddress: vi.fn(),
  },
  FALLBACK_PROFILE: {
    id: 'usr-1',
    first_name: 'Kasun',
    last_name: 'Kalhara',
    email: 'kasun@dickwella.lk',
    phone: '077 123 4567',
    marketing_opt_in: true,
    loyalty: {
      tier: 'gold',
      points: 450,
      total_spent: 45000,
      spend_to_next: 55000,
      accrual_rate: '1.5 pts per LKR 100',
    },
    addresses: [
      {
        id: 'addr-1',
        recipient_name: 'Kasun Kalhara',
        address_line1: '45 Beach Road',
        address_line2: '',
        city: 'Dickwella',
        district: 'Matara',
        postal_code: '81100',
        phone: '077 123 4567',
        is_default: true,
      },
    ],
  },
}));

// Mock ToastContext
vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    toast: {
      success: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  }),
}));

describe('STORM-FE-014: Customer Profile Hub, Multi-Address Management & Loyalty Card', () => {
  const mockCustomer = {
    id: 'usr-123',
    first_name: 'Kasun',
    last_name: 'Kalhara',
    email: 'kasun@dickwella.lk',
    phone: '077 123 4567',
    marketing_opt_in: true,
    loyalty: {
      tier: 'gold',
      points: 450,
      total_spent: 45000,
      spend_to_next: 55000,
      accrual_rate: '1.5 pts per LKR 100',
    },
    addresses: [
      {
        id: 'addr-1',
        recipient_name: 'Kasun Kalhara (Home)',
        address_line1: '45 Beach Road',
        address_line2: 'Villa 2',
        city: 'Dickwella',
        district: 'Matara',
        postal_code: '81100',
        phone: '077 123 4567',
        is_default: true,
      },
      {
        id: 'addr-2',
        recipient_name: 'Kasun Kalhara (Colombo)',
        address_line1: '12 Galle Road',
        address_line2: '',
        city: 'Kollupitiya',
        district: 'Colombo',
        postal_code: '00300',
        phone: '071 987 6543',
        is_default: false,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC1 & AC4: CustomerProfilePage Personal Details & Header', () => {
    it('renders customer avatar, full name, email, loyalty tier chip, and quick stats', () => {
      render(<CustomerProfilePage initialProfile={mockCustomer} />);

      expect(screen.getByTestId('customer-profile-page')).toBeInTheDocument();
      expect(screen.getByTestId('customer-avatar')).toHaveTextContent('KK');
      expect(screen.getByTestId('customer-profile-name')).toHaveTextContent('Kasun Kalhara');
      expect(screen.getByTestId('header-tier-badge')).toHaveTextContent(/GOLD/i);
      expect(screen.getByTestId('stat-loyalty-points')).toHaveTextContent('450');
      expect(screen.getByTestId('stat-saved-addresses')).toHaveTextContent('2');
    });

    it('submits updated personal details and invokes updateProfile API', async () => {
      userApi.updateProfile.mockResolvedValueOnce({
        first_name: 'Kasun',
        last_name: 'Perera',
        phone: '077 999 8888',
        marketing_opt_in: false,
      });

      const handleProfileUpdated = vi.fn();
      render(
        <CustomerProfilePage
          initialProfile={mockCustomer}
          onProfileUpdated={handleProfileUpdated}
        />
      );

      const lastNameInput = screen.getByTestId('input-profile-last-name');
      const phoneInput = screen.getByTestId('input-profile-phone');
      const saveBtn = screen.getByTestId('save-profile-btn');

      fireEvent.change(lastNameInput, { target: { value: 'Perera' } });
      fireEvent.change(phoneInput, { target: { value: '077 999 8888' } });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(userApi.updateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            last_name: 'Perera',
            phone: '077 999 8888',
          })
        );
        expect(handleProfileUpdated).toHaveBeenCalled();
      });
    });
  });

  describe('AC2: AddressBook Multi-Address Management', () => {
    it('displays saved addresses with default badge on active address', () => {
      render(<AddressBook addresses={mockCustomer.addresses} />);

      expect(screen.getByTestId('address-cards-grid')).toBeInTheDocument();
      expect(screen.getByTestId('badge-default-address')).toBeInTheDocument();
      expect(screen.getByText('Kasun Kalhara (Home)')).toBeInTheDocument();
      expect(screen.getByText('Kasun Kalhara (Colombo)')).toBeInTheDocument();
    });

    it('sets a non-default address as default when clicking Set as Default', async () => {
      userApi.setDefaultAddress.mockResolvedValueOnce({ success: true });
      const handleAddressesChange = vi.fn();

      render(
        <AddressBook
          addresses={mockCustomer.addresses}
          onAddressesChange={handleAddressesChange}
        />
      );

      const setDefaultBtn = screen.getByTestId('set-default-btn-addr-2');
      fireEvent.click(setDefaultBtn);

      await waitFor(() => {
        expect(userApi.setDefaultAddress).toHaveBeenCalledWith('addr-2');
        expect(handleAddressesChange).toHaveBeenCalled();
      });
    });

    it('opens add address modal and adds a new address', async () => {
      userApi.addAddress.mockResolvedValueOnce({ id: 'addr-new-3' });
      const handleAddressesChange = vi.fn();

      render(
        <AddressBook
          addresses={mockCustomer.addresses}
          onAddressesChange={handleAddressesChange}
        />
      );

      const addBtn = screen.getByTestId('add-address-btn');
      fireEvent.click(addBtn);

      expect(screen.getByTestId('address-modal')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('input-address-recipient'), {
        target: { value: 'S. Thanoogithan' },
      });
      fireEvent.change(screen.getByTestId('input-address-line1'), {
        target: { value: '10 Temple Junction' },
      });
      fireEvent.change(screen.getByTestId('input-address-city'), {
        target: { value: 'Matara' },
      });
      fireEvent.change(screen.getByTestId('input-address-phone'), {
        target: { value: '077 555 4444' },
      });

      fireEvent.click(screen.getByTestId('submit-address-btn'));

      await waitFor(() => {
        expect(userApi.addAddress).toHaveBeenCalled();
        expect(handleAddressesChange).toHaveBeenCalled();
        expect(screen.queryByTestId('address-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('AC3 & Failure Recovery: LoyaltyCard & Undefined Points Safety', () => {
    it('renders tier badge, points balance, and progress bar toward next tier', () => {
      render(<LoyaltyCard loyalty={mockCustomer.loyalty} />);

      expect(screen.getByTestId('loyalty-card')).toBeInTheDocument();
      expect(screen.getByTestId('loyalty-tier-badge')).toHaveTextContent(/GOLD TIER/i);
      expect(screen.getByTestId('loyalty-points-balance')).toHaveTextContent('450');
      expect(screen.getByTestId('loyalty-next-tier-label')).toHaveTextContent(/LKR 55,000 to Platinum/i);
      expect(screen.getByTestId('loyalty-policy-note')).toHaveTextContent(/12 months/i);
    });

    it('defensively handles undefined loyalty object without throwing TypeError (Failure Recovery Matrix)', () => {
      // Must not throw "Cannot read properties of undefined (reading 'points')"
      render(<LoyaltyCard loyalty={undefined} />);

      expect(screen.getByTestId('loyalty-card')).toBeInTheDocument();
      expect(screen.getByTestId('loyalty-tier-badge')).toHaveTextContent(/SILVER TIER/i);
      expect(screen.getByTestId('loyalty-points-balance')).toHaveTextContent('0');
      expect(screen.getByTestId('loyalty-progress-bar')).toBeInTheDocument();
    });
  });

  describe('Customer Logout Action', () => {
    it('renders Sign Out button and triggers onLogout callback when clicked', () => {
      const handleLogout = vi.fn();
      render(<CustomerProfilePage initialProfile={mockCustomer} onLogout={handleLogout} />);

      const logoutBtn = screen.getByTestId('profile-logout-btn');
      expect(logoutBtn).toBeInTheDocument();
      expect(logoutBtn).toHaveTextContent(/Sign Out/i);

      fireEvent.click(logoutBtn);
      expect(handleLogout).toHaveBeenCalledTimes(1);
    });
  });
});
