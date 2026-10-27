import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StripePaymentForm } from '../components/checkout/StripePaymentForm';
import { OrderSuccessPage } from '../pages/OrderSuccessPage';

// Mock Stripe React bindings for deterministic shift-left testing
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => <div data-testid="mock-stripe-elements">{children}</div>,
  CardElement: () => (
    <div data-testid="mock-card-element">
      <input aria-label="Card details" />
    </div>
  ),
  useStripe: () => ({
    confirmCardPayment: vi.fn().mockResolvedValue({
      paymentIntent: {
        id: 'pi_test_live_123',
        status: 'succeeded',
        charges: {
          data: [
            {
              id: 'ch_test_live_123',
              payment_method_details: {
                card: { brand: 'visa', last4: '4242' },
              },
            },
          ],
        },
      },
    }),
  }),
  useElements: () => ({
    getElement: vi.fn().mockReturnValue({}),
  }),
}));

describe('STORM-FE-012: Stripe Elements Card Payment & Order Success Suite', () => {
  describe('StripePaymentForm Component (AC1 & AC2)', () => {
    it('mounts Stripe Elements container and renders Cardholder input and CardElement', () => {
      render(
        <StripePaymentForm
          amount={5950}
          clientSecret="pi_123_secret_abc"
          customerInfo={{ fullName: 'Kasun Kalhara', email: 'kasun@example.com' }}
        />
      );

      expect(screen.getByTestId('stripe-payment-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('mock-stripe-elements')).toBeInTheDocument();
      expect(screen.getByTestId('mock-card-element')).toBeInTheDocument();

      const nameInput = screen.getByTestId('input-cardholder-name');
      expect(nameInput).toHaveValue('Kasun Kalhara');

      const submitBtn = screen.getByTestId('submit-payment-btn');
      expect(submitBtn).toBeInTheDocument();
      expect(submitBtn).toHaveTextContent(/Pay LKR 5,950.00/i);
    });

    it('requires cardholder name and displays error message if left blank', async () => {
      render(
        <StripePaymentForm
          amount={5950}
          clientSecret="pi_123_secret_abc"
          customerInfo={{ fullName: '' }}
        />
      );

      const submitBtn = screen.getByTestId('submit-payment-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('payment-error-alert')).toHaveTextContent(
          /Please enter the name on the card/i
        );
      });
    });

    it('submits payment, triggers processing spinner, and calls onPaymentSuccess', async () => {
      const successMock = vi.fn();
      render(
        <StripePaymentForm
          amount={7500}
          clientSecret="pi_mock_123"
          customerInfo={{ fullName: 'Kamal Perera', email: 'kamal@example.com' }}
          onPaymentSuccess={successMock}
        />
      );

      const submitBtn = screen.getByTestId('submit-payment-btn');
      fireEvent.click(submitBtn);

      // Verify processing state
      expect(submitBtn).toBeDisabled();

      await waitFor(() => {
        expect(successMock).toHaveBeenCalledTimes(1);
        expect(successMock).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'succeeded',
          })
        );
      });
    });
  });

  describe('OrderSuccessPage Component (AC3 & AC4)', () => {
    const mockOrder = {
      id: 'ord-8899',
      order_number: 'DFC-20261005-7744',
      subtotal: 11000,
      shippingFee: 0,
      discount: 1000,
      total_amount: 10000,
      items: [
        {
          id: 1,
          title: 'Ceylon Handloom Batik Sarong',
          size: 'Free Size',
          color: 'Navy & Gold',
          price: 5500,
          quantity: 2,
        },
      ],
      shippingAddress: {
        fullName: 'Kasun Kalhara',
        phone: '0771234567',
        email: 'kasun@example.com',
        line1: '12 Beach Road',
        city: 'Dickwella',
        district: 'Matara',
        postalCode: '81100',
      },
      payment: {
        method: 'Stripe Card',
        brand: 'Visa',
        last4: '4242',
        status: 'PAID IN FULL',
      },
    };

    it('renders order confirmation badge, reference number, and PAID IN FULL status', () => {
      render(<OrderSuccessPage order={mockOrder} />);

      expect(screen.getByTestId('order-success-page')).toBeInTheDocument();
      expect(screen.getByTestId('order-confirmation-badge')).toBeInTheDocument();
      expect(screen.getByTestId('order-number-display')).toHaveTextContent('DFC-20261005-7744');
      expect(screen.getByTestId('paid-status-badge')).toHaveTextContent(/PAID IN FULL/i);
    });

    it('renders purchased items table, delivery address, and triggers print dialog', () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
      const continueMock = vi.fn();

      render(<OrderSuccessPage order={mockOrder} onContinueShopping={continueMock} />);

      expect(screen.getByTestId('order-items-list')).toBeInTheDocument();
      expect(screen.getByText('Ceylon Handloom Batik Sarong')).toBeInTheDocument();
      expect(screen.getByTestId('delivery-address-snapshot')).toHaveTextContent('12 Beach Road');

      const printBtn = screen.getByTestId('print-invoice-btn');
      fireEvent.click(printBtn);
      expect(printSpy).toHaveBeenCalledTimes(1);

      const continueBtn = screen.getByTestId('continue-shopping-btn');
      fireEvent.click(continueBtn);
      expect(continueMock).toHaveBeenCalledTimes(1);

      printSpy.mockRestore();
    });
  });
});
