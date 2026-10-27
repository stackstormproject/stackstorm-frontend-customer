import { formatPrice, formatDate, formatOrderStatus, formatCountdown } from '../../lib/format';
import { availableOf, stockStatus, productAvailability, variantPrice } from '../../lib/stock';
import {
  passwordProblems,
  validateLogin,
  validateRegistration,
  validateAddress,
  validateEmail,
  hasErrors,
} from '../../lib/validation';

describe('format', () => {
  it('should format rupees with the LKR code', () => {
    expect(formatPrice(4500)).toBe('LKR 4,500');
    expect(formatPrice('7250.00')).toBe('LKR 7,250');
  });

  it('should render a dash for missing amounts', () => {
    expect(formatPrice(undefined)).toBe('—');
    expect(formatPrice('abc')).toBe('—');
  });

  it('should format dates and reject invalid ones', () => {
    expect(formatDate('2026-10-27T06:00:00Z')).toBe('27 Oct 2026');
    expect(formatDate('nope')).toBe('—');
  });

  it('should label order statuses in customer language', () => {
    expect(formatOrderStatus('payment_pending')).toBe('Awaiting payment');
    expect(formatOrderStatus('mystery')).toBe('mystery');
    expect(formatOrderStatus()).toBe('Unknown');
  });

  it('should format the reservation countdown', () => {
    expect(formatCountdown(900)).toBe('15:00');
    expect(formatCountdown(61.9)).toBe('01:01');
    expect(formatCountdown(-5)).toBe('00:00');
  });
});

describe('stock (FR003)', () => {
  it('should prefer the server-computed available stock', () => {
    expect(availableOf({ available_stock: 3, stockQuantity: 99 })).toBe(3);
  });

  it('should compute stock minus active holds', () => {
    expect(availableOf({ stockQuantity: 5, reservedQuantity: 2 })).toBe(3);
    expect(availableOf({ stock_quantity: 1, reserved_quantity: 4 })).toBe(0);
    expect(availableOf(null)).toBe(0);
  });

  it.each([
    [0, 'out', 'Out of stock'],
    [1, 'low', 'Only 1 left'],
    [5, 'low', 'Only 5 left'],
    [6, 'ok', 'In stock'],
  ])('should label %i units as %s', (units, tone, label) => {
    expect(stockStatus(units)).toEqual({ tone, label });
  });

  it('should sum availability across variants', () => {
    expect(
      productAvailability({ variants: [{ available_stock: 2 }, { available_stock: 3 }] })
    ).toBe(5);
    expect(productAvailability({})).toBe(0);
  });

  it('should add the variant surcharge to the product price', () => {
    expect(variantPrice({ price: '4500.00' }, { additionalPrice: '250.00' })).toBe(4750);
    expect(variantPrice({ price: 100 }, null)).toBe(100);
  });
});

describe('validation', () => {
  it('should list every unmet password rule', () => {
    expect(passwordProblems('abc')).toEqual(['8-72 characters', 'an uppercase letter', 'a number']);
    expect(passwordProblems('Shopper123')).toEqual([]);
    expect(passwordProblems()).toHaveLength(4);
  });

  it('should validate login fields', () => {
    expect(validateLogin({ email: 'x', password: '' })).toEqual({
      email: expect.any(String),
      password: expect.any(String),
    });
    expect(validateLogin({ email: 'a@b.lk', password: 'p' })).toEqual({});
  });

  it('should validate registration including the optional phone', () => {
    expect(
      validateRegistration({ name: 'A', email: 'bad', password: 'short', phone: '12' })
    ).toMatchObject({
      name: expect.any(String),
      email: expect.any(String),
      phone: expect.any(String),
    });
    expect(
      validateRegistration({ name: 'Nimal', email: 'n@x.lk', password: 'Shopper123', phone: '' })
    ).toEqual({});
  });

  it('should require a 5-digit Sri Lankan postal code', () => {
    expect(validateAddress({ line1: 'x', city: 'y', postalCode: '8120' })).toHaveProperty(
      'postalCode'
    );
    expect(validateAddress({ line1: 'x', city: 'y', postalCode: '81200' })).toEqual({});
    expect(validateAddress({})).toMatchObject({
      line1: expect.any(String),
      city: expect.any(String),
    });
  });

  it('should validate a standalone email and detect errors', () => {
    expect(validateEmail('a@b.lk')).toBeNull();
    expect(validateEmail('a@')).toEqual(expect.any(String));
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ a: 'x' })).toBe(true);
  });
});
