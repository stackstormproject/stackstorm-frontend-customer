import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthModal } from '../components/auth/AuthModal';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import authApi from '../api/auth.api';

// Mock auth.api methods
vi.mock('../api/auth.api', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('STORM-FE-013: Customer Authentication Modal with Lockout Countdown & Password Visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DEV-177: AuthModal Tab Navigation & Accessibility', () => {
    it('does not render when isOpen is false', () => {
      render(<AuthModal isOpen={false} onClose={vi.fn()} />);
      expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
    });

    it('renders modal dialog and brand hero when isOpen is true', () => {
      render(<AuthModal isOpen={true} onClose={vi.fn()} />);

      const modal = screen.getByTestId('auth-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByText('Dickwella Fashion Corner')).toBeInTheDocument();
    });

    it('defaults to Sign In tab and switches smoothly to Create Account tab', () => {
      render(<AuthModal isOpen={true} onClose={vi.fn()} />);

      const loginTab = screen.getByTestId('tab-login');
      const registerTab = screen.getByTestId('tab-register');

      expect(loginTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();

      // Click Create Account tab
      fireEvent.click(registerTab);

      expect(registerTab).toHaveAttribute('aria-selected', 'true');
      expect(loginTab).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
      expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    });

    it('calls onClose when clicking close button or backdrop overlay', () => {
      const handleClose = vi.fn();
      render(<AuthModal isOpen={true} onClose={handleClose} />);

      const closeBtn = screen.getByTestId('close-auth-modal-btn');
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);

      const overlay = screen.getByTestId('auth-modal-overlay');
      fireEvent.click(overlay);
      expect(handleClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('DEV-178: Password Visibility Toggle & Complexity Validation', () => {
    it('toggles password visibility between password and text type without submitting form', () => {
      render(<LoginForm onSuccess={vi.fn()} />);

      const passwordInput = screen.getByTestId('input-login-password');
      const toggleBtn = screen.getByTestId('password-toggle-btn');

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(toggleBtn).toHaveAttribute('aria-label', 'Show password');
      expect(toggleBtn).toHaveAttribute('type', 'button'); // Crucial: prevents form submission

      // Click to show password
      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(toggleBtn).toHaveAttribute('aria-label', 'Hide password');

      // Click again to hide password
      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('validates password complexity live in RegisterForm', async () => {
      render(<RegisterForm onSuccess={vi.fn()} />);

      const passwordInput = screen.getByTestId('input-register-password');
      const criteriaWrap = screen.getByTestId('password-criteria-wrap');

      // Initially empty
      expect(criteriaWrap).toHaveTextContent(/At least 8 characters/i);
      expect(criteriaWrap).toHaveTextContent(/At least 1 uppercase letter/i);
      expect(criteriaWrap).toHaveTextContent(/At least 1 number/i);

      // Type partial password: short lowercase
      fireEvent.change(passwordInput, { target: { value: 'short' } });
      const items = criteriaWrap.querySelectorAll('.criterion-item');
      expect(items[0]).not.toHaveClass('criterion-item--met');
      expect(items[1]).not.toHaveClass('criterion-item--met');
      expect(items[2]).not.toHaveClass('criterion-item--met');

      // Type 8+ chars with uppercase and number
      fireEvent.change(passwordInput, { target: { value: 'Secret123' } });
      expect(items[0]).toHaveClass('criterion-item--met');
      expect(items[1]).toHaveClass('criterion-item--met');
      expect(items[2]).toHaveClass('criterion-item--met');
    });

    it('validates required fields and Sri Lankan phone format on registration submit', async () => {
      render(<RegisterForm onSuccess={vi.fn()} />);

      const submitBtn = screen.getByTestId('register-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('error-register-name')).toHaveTextContent(
          /Full name is required/i
        );
        expect(screen.getByTestId('error-register-email')).toHaveTextContent(
          /Email address is required/i
        );
        expect(screen.getByTestId('error-register-phone')).toHaveTextContent(
          /Phone number is required/i
        );
        expect(screen.getByTestId('error-register-password')).toHaveTextContent(
          /Password is required/i
        );
      });

      // Invalid phone
      const phoneInput = screen.getByTestId('input-register-phone');
      fireEvent.change(phoneInput, { target: { value: '12345' } });
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        expect(screen.getByTestId('error-register-phone')).toHaveTextContent(
          /valid Sri Lankan mobile number/i
        );
      });
    });
  });

  describe('DEV-179: Account Lockout Countdown & API Auth Flow', () => {
    it('disables login button and displays lockout banner on HTTP 423 Locked response', async () => {
      const lockoutError = {
        response: {
          status: 423,
          data: {
            success: false,
            message: 'Account locked due to 5 consecutive failed login attempts.',
            errors: [{ retryAfterSeconds: 900 }],
          },
          headers: {
            'retry-after': '900',
          },
        },
      };
      authApi.login.mockRejectedValueOnce(lockoutError);

      render(<LoginForm onSuccess={vi.fn()} />);

      const emailInput = screen.getByTestId('input-login-email');
      const passwordInput = screen.getByTestId('input-login-password');
      const submitBtn = screen.getByTestId('login-submit-btn');

      fireEvent.change(emailInput, { target: { value: 'test@dickwella.lk' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('lockout-countdown-banner')).toBeInTheDocument();
        expect(screen.getByTestId('lockout-clock')).toHaveTextContent('15:00');
        expect(submitBtn).toBeDisabled();
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
      });
    });

    it('successfully logs in and calls onSuccess callback', async () => {
      const mockUser = {
        id: 'cust-1',
        email: 'kamal@dickwella.lk',
        first_name: 'Kamal',
        last_name: 'Perera',
      };
      authApi.login.mockResolvedValueOnce({
        data: {
          success: true,
          user: mockUser,
          accessToken: 'jwt-token-xyz',
        },
      });

      const handleSuccess = vi.fn();
      render(<LoginForm onSuccess={handleSuccess} />);

      fireEvent.change(screen.getByTestId('input-login-email'), {
        target: { value: 'kamal@dickwella.lk' },
      });
      fireEvent.change(screen.getByTestId('input-login-password'), {
        target: { value: 'CorrectPass1' },
      });
      fireEvent.click(screen.getByTestId('login-submit-btn'));

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith(mockUser);
      });
    });
  });
});
