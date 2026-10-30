import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../renderApp';
import * as redirect from '../../lib/redirect';
import { getGuestOrderToken } from '../../lib/session';
import * as authApi from '../../api/auth';
import * as cartApi from '../../api/cart';
import * as catalogApi from '../../api/catalog';
import * as wishlistApi from '../../api/wishlist';
import * as checkoutApi from '../../api/checkout';
import * as accountApi from '../../api/account';
import * as ordersApi from '../../api/orders';

vi.mock('../../api/auth');
vi.mock('../../api/cart');
vi.mock('../../api/wishlist');
vi.mock('../../api/catalog');
vi.mock('../../api/account');
vi.mock('../../api/orders');
vi.mock('../../api/checkout', async (importOriginal) => ({
  ...(await importOriginal()),
  initiateCheckout: vi.fn(),
  createCheckoutSession: vi.fn(),
  confirmCheckoutSession: vi.fn(),
  releaseReservation: vi.fn(),
  validatePromoCode: vi.fn(),
}));
vi.mock('../../lib/redirect', () => ({ leaveFor: vi.fn() }));
vi.mock('../../components/chat/ChatWidget', () => ({ default: () => null }));

const CART = [
  {
    id: 1,
    variant_id: 43,
    quantity: 2,
    unit_price: 3400,
    line_total: 6800,
    available_stock: 8,
    size: 'M',
    color: 'Natural',
    product: { name: 'Festival Sarong Set', slug: 'sarong' },
  },
];

const ORDER = {
  order_id: 31,
  reservation_id: 'res_31',
  expires_in: 900,
  guest_order_token: 'g'.repeat(32),
  breakdown: { subtotal: 6800, shipping_fee: 450, discount_amount: 0, total_amount: 7250 },
  items: [{ variantId: 43, title: 'Festival Sarong Set', quantity: 2, subtotal: 6800, size: 'M' }],
};

const MOCK_SESSION = {
  provider: 'mock',
  sessionId: 'mock_cs_31_1',
  url: 'http://localhost:5173/checkout/test-gateway?order=31&session_id=mock_cs_31_1',
  amount: 7250,
};

const fillAddress = async () => {
  await userEvent.type(screen.getByLabelText('Street address'), '12 Main Street');
  await userEvent.type(screen.getByLabelText('Town or city'), 'Dickwella');
  await userEvent.type(screen.getByLabelText('Postal code'), '81200');
  await userEvent.selectOptions(screen.getByLabelText('District'), 'Matara');
};

const setup = ({ customer = null, cart = CART, addresses = [], loyalty = null } = {}) => {
  authApi.restoreSession.mockResolvedValue(customer);
  cartApi.getCart.mockResolvedValue(cart);
  cartApi.mergeGuestCart.mockResolvedValue({});
  cartApi.removeCartItem.mockResolvedValue({});
  wishlistApi.getWishlist.mockResolvedValue([]);
  catalogApi.listCategories.mockResolvedValue([]);
  accountApi.listAddresses.mockResolvedValue(addresses);
  accountApi.addAddress.mockResolvedValue({});
  accountApi.getLoyalty.mockResolvedValue(loyalty);
  checkoutApi.initiateCheckout.mockResolvedValue(ORDER);
  checkoutApi.createCheckoutSession.mockResolvedValue(MOCK_SESSION);
  checkoutApi.confirmCheckoutSession.mockResolvedValue({ orderId: 31, status: 'processing' });
  checkoutApi.releaseReservation.mockResolvedValue({});
  return renderApp('/checkout');
};

describe('Checkout (UC-003)', () => {
  it('should send an empty bag back to the shop', async () => {
    setup({ cart: [] });

    expect(await screen.findByRole('heading', { name: 'Your bag is empty' })).toBeInTheDocument();
  });

  it('should validate guest email and address before creating an order', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Checkout' });

    await userEvent.type(screen.getByLabelText('Postal code'), '812');
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    expect(screen.getByLabelText('Email for your receipt')).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText('Postal codes in Sri Lanka have 5 digits, e.g. 81200.')
    ).toBeInTheDocument();
    expect(checkoutApi.initiateCheckout).not.toHaveBeenCalled();
  });

  it('should show an estimate first, free for collection', async () => {
    setup();
    const summary = await screen.findByRole('complementary', { name: 'Order summary' });

    expect(within(summary).getByText('Delivery (estimate)')).toBeInTheDocument();
    expect(within(summary).getByText('LKR 7,250')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: /Collect from the Dickwella shop/ }));
    expect(within(summary).getByText('Free')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Billing address' })).toBeInTheDocument();
  });

  it('should place a guest order, pay on the gateway page and land on the confirmation', async () => {
    const { router } = setup();
    ordersApi.getOrder.mockResolvedValue({
      id: 31,
      invoice_number: 'DFC-2026-0031',
      status: 'processing',
      order_date: '2026-10-27',
      guest_email: 'guest@example.lk',
      shipping_option: 'standard',
      shipping_address: { line1: '12 Main Street', city: 'Dickwella', postal_code: '81200' },
      shipping_cost: 450,
      total_amount: 7250,
      items: [
        {
          id: 9,
          variant_id: 43,
          product_title: 'Festival Sarong Set',
          quantity: 2,
          subtotal: 6800,
          product_slug: 'sarong',
        },
      ],
    });
    await screen.findByRole('heading', { name: 'Checkout' });

    await userEvent.type(screen.getByLabelText('Email for your receipt'), 'guest@example.lk');
    await fillAddress();
    await userEvent.type(screen.getByLabelText('Delivery note (optional)'), 'Call on arrival');
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    expect(checkoutApi.initiateCheckout).toHaveBeenCalledWith({
      items: CART,
      shippingAddress: {
        line1: '12 Main Street',
        line2: undefined,
        city: 'Dickwella',
        district: 'Matara',
        postal_code: '81200',
        country: 'Sri Lanka',
      },
      shippingMethod: 'standard',
      guestEmail: 'guest@example.lk',
      notes: 'Call on arrival',
      promoCode: undefined,
      redeemPoints: 0,
    });
    expect(getGuestOrderToken(31)).toBe('g'.repeat(32));
    expect(checkoutApi.createCheckoutSession).toHaveBeenCalledWith(31);

    // The test gateway stands in for Stripe's hosted page
    expect(
      await screen.findByRole('heading', { name: 'Test payment gateway' })
    ).toBeInTheDocument();
    expect(router.state.location.search).toContain('session_id=mock_cs_31_1');
    await userEvent.click(screen.getByRole('button', { name: 'Pay LKR 7,250' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/orders/31/confirmation'), {
      timeout: 3000,
    });
    expect(checkoutApi.confirmCheckoutSession).toHaveBeenCalledWith(31, 'mock_cs_31_1');
    expect(cartApi.removeCartItem).toHaveBeenCalledWith(1);
    expect(await screen.findByRole('heading', { name: /order is placed/ })).toBeInTheDocument();
    expect(screen.getByText(/saved guest@example.lk as the contact/)).toBeInTheDocument();
  });

  it('should send the shopper to Stripe Checkout when Stripe is set up', async () => {
    setup();
    checkoutApi.createCheckoutSession.mockResolvedValue({
      provider: 'stripe',
      sessionId: 'cs_test_1',
      url: 'https://checkout.stripe.com/c/pay/cs_test_1',
      amount: 7250,
    });
    await screen.findByRole('heading', { name: 'Checkout' });
    await userEvent.type(screen.getByLabelText('Email for your receipt'), 'g@x.lk');
    await fillAddress();

    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    await waitFor(() =>
      expect(redirect.leaveFor).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test_1')
    );
    expect(screen.getByRole('status')).toHaveTextContent('Taking you to the secure payment page');
  });

  it('should use the default saved address and sign-in email for a customer', async () => {
    setup({
      customer: { id: 4, name: 'Nimal', email: 'nimal@example.lk' },
      addresses: [
        {
          id: 1,
          address_line1: '1 Old Road',
          city: 'Galle',
          postal_code: '80000',
          is_default: false,
        },
        {
          id: 2,
          address_line1: '12 Main Street',
          city: 'Dickwella',
          postal_code: '81200',
          state: 'Matara',
          is_default: true,
        },
      ],
    });

    expect(await screen.findByText('nimal@example.lk')).toBeInTheDocument();
    expect(await screen.findByRole('radio', { name: /12 Main Street/ })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    expect(checkoutApi.initiateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        guestEmail: undefined,
        shippingAddress: expect.objectContaining({ line1: '12 Main Street', district: 'Matara' }),
      })
    );
  });

  it('should save a new address for a customer who asks', async () => {
    setup({
      customer: { id: 4, email: 'n@x.lk' },
      addresses: [{ id: 1, address_line1: '1 Old Road', city: 'Galle', postal_code: '80000' }],
    });
    await userEvent.click(await screen.findByRole('radio', { name: 'Use a new address' }));
    await fillAddress();

    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    await screen.findByRole('heading', { name: 'Test payment gateway' });
    expect(accountApi.addAddress).toHaveBeenCalledWith(
      expect.objectContaining({ line1: '12 Main Street', postalCode: '81200' })
    );
  });

  it('should apply a promo code and send it with the order (#201)', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Checkout' });
    checkoutApi.validatePromoCode.mockResolvedValue({
      promoCodeId: 9,
      code: 'WELCOME10',
      discountAmount: 680,
    });

    await userEvent.type(screen.getByLabelText('Promo code (optional)'), 'welcome10');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(checkoutApi.validatePromoCode).toHaveBeenCalledWith('WELCOME10', 6800);
    expect(await screen.findByText(/WELCOME10/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Email for your receipt'), 'guest@example.lk');
    await fillAddress();
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    expect(checkoutApi.initiateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ promoCode: 'WELCOME10' })
    );
  });

  it('should show an invalid promo code error and not block checkout', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Checkout' });
    checkoutApi.validatePromoCode.mockRejectedValue(
      Object.assign(new Error('This promo code is not valid'), { status: 400 })
    );

    await userEvent.type(screen.getByLabelText('Promo code (optional)'), 'BADCODE');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('This promo code is not valid')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('should let a signed-in customer redeem loyalty points as a checkout discount', async () => {
    setup({
      customer: { id: 4, email: 'n@x.lk' },
      loyalty: { current_points: 500, tier: 'silver' },
    });
    await screen.findByRole('heading', { name: 'Checkout' });
    await fillAddress();

    await userEvent.click(
      screen.getByRole('checkbox', { name: /Redeem loyalty points — you have 500 points/ })
    );
    const pointsInput = screen.getByLabelText('Points to redeem');
    expect(pointsInput).toHaveValue(500);

    await userEvent.clear(pointsInput);
    await userEvent.type(pointsInput, '200');
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    expect(checkoutApi.initiateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ redeemPoints: 200 })
    );
  });

  it('should not save the address when unticked, and survive a save failure', async () => {
    setup({ customer: { id: 4, email: 'n@x.lk' } });
    await screen.findByRole('heading', { name: 'Checkout' });
    await fillAddress();
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Save this address for next time' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    await screen.findByRole('heading', { name: 'Test payment gateway' });
    expect(accountApi.addAddress).not.toHaveBeenCalled();
  });

  it('should still go to payment when a saved address cannot be stored', async () => {
    setup({ customer: { id: 4, email: 'n@x.lk' } });
    accountApi.addAddress.mockRejectedValue(new Error('x'));
    await screen.findByRole('heading', { name: 'Checkout' });
    await fillAddress();
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    expect(
      await screen.findByRole('heading', { name: 'Test payment gateway' })
    ).toBeInTheDocument();
    expect(accountApi.addAddress).toHaveBeenCalled();
  });

  it('should flag an incomplete saved address', async () => {
    setup({
      customer: { id: 4, email: 'n@x.lk' },
      addresses: [{ id: 1, address_line1: '', city: 'Galle', postal_code: '1' }],
    });
    await screen.findByRole('radio', { name: /Galle/ });

    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    expect(screen.getByText(/saved address is incomplete/)).toBeInTheDocument();
  });

  it('should refresh the bag and explain when stock ran out during checkout', async () => {
    setup();
    checkoutApi.initiateCheckout.mockRejectedValue(
      Object.assign(new Error('INSUFFICIENT_STOCK'), { status: 409 })
    );
    await screen.findByRole('heading', { name: 'Checkout' });
    await userEvent.type(screen.getByLabelText('Email for your receipt'), 'g@x.lk');
    await fillAddress();

    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /sold out while you were checking out/
    );
    expect(cartApi.getCart.mock.calls.length).toBeGreaterThan(1);
  });

  it('should show other order errors as given', async () => {
    setup();
    checkoutApi.initiateCheckout.mockRejectedValue(new Error('Cannot reach the shop right now.'));
    await screen.findByRole('heading', { name: 'Checkout' });
    await userEvent.type(screen.getByLabelText('Email for your receipt'), 'g@x.lk');
    await fillAddress();

    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the shop right now.');
  });

  it('should refuse to start while the bag has unavailable quantities', async () => {
    setup({ cart: [{ ...CART[0], available_stock: 1 }] });
    await screen.findByRole('heading', { name: 'Checkout' });
    await userEvent.type(screen.getByLabelText('Email for your receipt'), 'g@x.lk');
    await fillAddress();

    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/no longer available in that quantity/);
    expect(checkoutApi.initiateCheckout).not.toHaveBeenCalled();
  });

  it('should explain when the payment page cannot be opened', async () => {
    setup();
    checkoutApi.createCheckoutSession.mockRejectedValue(new Error('Payments are not configured'));
    await screen.findByRole('heading', { name: 'Checkout' });
    await userEvent.type(screen.getByLabelText('Email for your receipt'), 'g@x.lk');
    await fillAddress();

    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Payments are not configured');
    expect(screen.getByRole('button', { name: 'Continue to payment' })).toBeEnabled();
  });
});

describe('Order confirmation page', () => {
  beforeEach(() => {
    cartApi.getCart.mockResolvedValue([]);
    cartApi.mergeGuestCart.mockResolvedValue({});
    wishlistApi.getWishlist.mockResolvedValue([]);
    catalogApi.listCategories.mockResolvedValue([]);
  });

  it('should show a collection order to a customer with a tracking link', async () => {
    authApi.restoreSession.mockResolvedValue({ id: 4 });
    ordersApi.getOrder.mockResolvedValue({
      id: 7,
      invoice_number: 'DFC-2026-0007',
      status: 'processing',
      shipping_option: 'pickup',
      shipping_cost: 0,
      discount_amount: 100,
      total_amount: 3300,
      items: [{ id: 1, product_title: 'Shawl', quantity: 1, subtotal: 3400 }],
    });
    renderApp('/orders/7/confirmation');

    expect(await screen.findByText(/Collect from the shop/)).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Discount')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Track this order' })).toHaveAttribute(
      'href',
      '/account/orders/7'
    );
    expect(ordersApi.getOrder).toHaveBeenCalledWith('7');
  });

  it('should show not found for an order the visitor cannot see', async () => {
    authApi.restoreSession.mockResolvedValue(null);
    ordersApi.getOrder.mockRejectedValue(Object.assign(new Error('nope'), { status: 404 }));
    renderApp('/orders/99/confirmation');

    expect(
      await screen.findByRole('heading', { name: 'This page does not exist' })
    ).toBeInTheDocument();
  });

  it('should retry after a network error', async () => {
    authApi.restoreSession.mockResolvedValue(null);
    ordersApi.getOrder.mockRejectedValueOnce(new Error('down')).mockResolvedValue({
      id: 7,
      invoice_number: 'DFC-2026-0007',
      status: 'processing',
      items: [],
      shipping_address: {},
    });
    renderApp('/orders/7/confirmation');

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('DFC-2026-0007')).toBeInTheDocument();
  });
});
