import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  FreeShippingMeter,
  FREE_SHIPPING_THRESHOLD,
} from '../components/checkout/FreeShippingMeter';
import { AddressStep, PHONE_REGEX, POSTAL_CODE_REGEX } from '../components/checkout/AddressStep';
import { ShippingStep } from '../components/checkout/ShippingStep';
import { CheckoutStepper } from '../components/checkout/CheckoutStepper';

describe('STORM-FE-011: Multi-Step Checkout Stepper, Address Book & Free Shipping Suite', () => {
  describe('Sri Lankan Validation Regex Rules', () => {
    it('validates 5-digit Sri Lankan postal codes and rejects invalid formats', () => {
      // Valid Sri Lankan postal codes
      expect(POSTAL_CODE_REGEX.test('81100')).toBe(true); // Dickwella
      expect(POSTAL_CODE_REGEX.test('81000')).toBe(true); // Matara
      expect(POSTAL_CODE_REGEX.test('00100')).toBe(true); // Colombo 01
      expect(POSTAL_CODE_REGEX.test('20000')).toBe(true); // Kandy
      expect(POSTAL_CODE_REGEX.test('80000')).toBe(true); // Galle

      // Invalid formats
      expect(POSTAL_CODE_REGEX.test('8110')).toBe(false); // 4 digits
      expect(POSTAL_CODE_REGEX.test('811000')).toBe(false); // 6 digits
      expect(POSTAL_CODE_REGEX.test('8110A')).toBe(false); // Alphanumeric
      expect(POSTAL_CODE_REGEX.test('SW1A 1AA')).toBe(false); // UK format
    });

    it('validates Sri Lankan mobile phone numbers (+94 / 07XXXXXXXX)', () => {
      // Valid numbers
      expect(PHONE_REGEX.test('0771234567')).toBe(true);
      expect(PHONE_REGEX.test('+94771234567')).toBe(true);
      expect(PHONE_REGEX.test('+94 771234567')).toBe(true);
      expect(PHONE_REGEX.test('0719876543')).toBe(true);
      expect(PHONE_REGEX.test('0755555555')).toBe(true);

      // Invalid numbers
      expect(PHONE_REGEX.test('123456')).toBe(false);
      expect(PHONE_REGEX.test('0112345678')).toBe(false); // Landline
      expect(PHONE_REGEX.test('+12025550143')).toBe(false); // US format
    });
  });

  describe('FreeShippingMeter Calculation Logic (AC3)', () => {
    it('calculates remaining amount accurately when subtotal is below LKR 10,000 threshold', () => {
      const subtotal = 7500;
      render(<FreeShippingMeter subtotal={subtotal} />);

      const meter = screen.getByTestId('free-shipping-meter');
      expect(meter).toBeInTheDocument();

      // Remaining should be 10000 - 7500 = 2500
      const remainingElem = screen.getByTestId('free-shipping-remaining');
      expect(remainingElem).toHaveTextContent('LKR 2,500.00');

      const progress = screen.getByTestId('free-shipping-progress');
      expect(progress).toHaveStyle('width: 75%');
    });

    it('displays unlocked free delivery notice when subtotal reaches or exceeds LKR 10,000', () => {
      const subtotal = 12500;
      render(<FreeShippingMeter subtotal={subtotal} />);

      const meter = screen.getByTestId('free-shipping-meter');
      expect(meter).toHaveClass('free-shipping-meter--unlocked');

      const message = screen.getByTestId('free-shipping-message');
      expect(message).toHaveTextContent(/unlocked FREE Delivery/i);

      const progress = screen.getByTestId('free-shipping-progress');
      expect(progress).toHaveStyle('width: 100%');
    });
  });

  describe('CheckoutStepper Component (AC1)', () => {
    it('renders 3-step navigation and highlights active and completed steps', () => {
      const onStepClickMock = vi.fn();
      render(<CheckoutStepper currentStep={2} onStepClick={onStepClickMock} />);

      const stepper = screen.getByTestId('checkout-stepper');
      expect(stepper).toBeInTheDocument();

      const step1 = screen.getByTestId('step-indicator-1');
      const step2 = screen.getByTestId('step-indicator-2');
      const step3 = screen.getByTestId('step-indicator-3');

      expect(step1).toHaveClass('checkout-stepper__item--completed');
      expect(step2).toHaveClass('checkout-stepper__item--active');
      expect(step3).toHaveClass('checkout-stepper__item--upcoming');

      // Click completed step 1
      const step1Btn = step1.querySelector('button');
      fireEvent.click(step1Btn);
      expect(onStepClickMock).toHaveBeenCalledWith(1);
    });
  });

  describe('AddressStep Form Validation & Submission (AC2 & AC4)', () => {
    it('renders guest checkout badge and enforces required field validation on submit', async () => {
      const submitMock = vi.fn();
      render(<AddressStep onSubmitAddress={submitMock} isGuest={true} />);

      expect(screen.getByTestId('guest-checkout-badge')).toBeInTheDocument();

      // Clear input fields and submit empty
      const nameInput = screen.getByTestId('input-fullname');
      fireEvent.change(nameInput, { target: { value: '' } });

      const submitBtn = screen.getByTestId('proceed-to-shipping-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('error-fullname')).toHaveTextContent(/Full name is required/i);
      });
      expect(submitMock).not.toHaveBeenCalled();
    });

    it('rejects invalid postal code and accepts valid Sri Lankan address', async () => {
      const submitMock = vi.fn();
      render(<AddressStep onSubmitAddress={submitMock} isGuest={true} />);

      // Enter invalid postal code
      const postalInput = screen.getByTestId('input-postalcode');
      fireEvent.change(postalInput, { target: { value: '811' } });
      fireEvent.blur(postalInput);

      expect(screen.getByTestId('error-postalcode')).toHaveTextContent(
        /5-digit Sri Lankan postal code/i
      );

      // Fix inputs with valid Sri Lankan address
      fireEvent.change(screen.getByTestId('input-fullname'), { target: { value: 'Kamal Perera' } });
      fireEvent.change(screen.getByTestId('input-email'), {
        target: { value: 'kamal@example.com' },
      });
      fireEvent.change(screen.getByTestId('input-phone'), { target: { value: '0771234567' } });
      fireEvent.change(screen.getByTestId('input-line1'), { target: { value: '12 Beach Road' } });
      fireEvent.change(screen.getByTestId('input-city'), { target: { value: 'Dickwella' } });
      fireEvent.change(postalInput, { target: { value: '81100' } });

      const submitBtn = screen.getByTestId('proceed-to-shipping-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(submitMock).toHaveBeenCalledTimes(1);
        expect(submitMock).toHaveBeenCalledWith(
          expect.objectContaining({
            fullName: 'Kamal Perera',
            email: 'kamal@example.com',
            phone: '0771234567',
            city: 'Dickwella',
            postalCode: '81100',
            country: 'Sri Lanka',
          })
        );
      });
    });
  });

  describe('ShippingStep Dynamic Fee Logic (AC3)', () => {
    it('applies LKR 450 standard courier fee when subtotal is below LKR 10,000', () => {
      const submitMock = vi.fn();
      render(
        <ShippingStep
          subtotal={5000}
          selectedAddress={{
            fullName: 'Kamal',
            phone: '0771234567',
            line1: 'Beach Rd',
            city: 'Dickwella',
            postalCode: '81100',
          }}
          onSubmitShipping={submitMock}
        />
      );

      const standardCost = screen.getByTestId('shipping-cost-standard');
      expect(standardCost).toHaveTextContent('LKR 450.00');

      const continueBtn = screen.getByTestId('proceed-to-payment-btn');
      fireEvent.click(continueBtn);

      expect(submitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'standard',
          cost: 450,
        })
      );
    });

    it('switches standard courier fee to FREE when subtotal is >= LKR 10,000', () => {
      const submitMock = vi.fn();
      render(
        <ShippingStep
          subtotal={12000}
          selectedAddress={{
            fullName: 'Kamal',
            phone: '0771234567',
            line1: 'Beach Rd',
            city: 'Dickwella',
            postalCode: '81100',
          }}
          onSubmitShipping={submitMock}
        />
      );

      const standardCost = screen.getByTestId('shipping-cost-standard');
      expect(standardCost).toHaveTextContent('FREE');

      const continueBtn = screen.getByTestId('proceed-to-payment-btn');
      fireEvent.click(continueBtn);

      expect(submitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'standard',
          cost: 0,
        })
      );
    });
  });
});
