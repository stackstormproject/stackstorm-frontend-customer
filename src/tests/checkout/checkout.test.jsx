import { act, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../renderApp';
import { useCountdown } from '../../hooks/useCountdown';
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
  createPaymentIntent: vi.fn(),
  confirmPayment: vi.fn(),
  releaseReservation: vi.fn(),
}));
vi.mock('../../components/chat/ChatWidget', () => ({ default: () => null }));

const confirmCardPayment = vi.fn();
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => children,
  CardElement: () => <div data-testid="card-element" />,
  useStripe: () => ({ confirmCardPayment }),
  useElements: () => ({ getElement: () => ({}) }),
}));

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

const MOCK_INTENT = {
  provider: 'mock',
  paymentIntentId: 'mock_pi_31',
  amount: 7250,
  clientSecret: 'x',
};

const fillAddress = async () => {
  await userEvent.type(screen.getByLabelText('Street address'), '12 Main Street');
  await userEvent.type(screen.getByLabelText('Town or city'), 'Dickwella');
  await userEvent.type(screen.getByLabelText('Postal code'), '81200');
  await userEvent.selectOptions(screen.getByLabelText('District'), 'Matara');
};

const setup = ({ customer = null, cart = CART, addresses = [] } = {}) => {
  authApi.restoreSession.mockResolvedValue(customer);
  cartApi.getCart.mockResolvedValue(cart);
  cartApi.mergeGuestCart.mockResolvedValue({});
  cartApi.removeCartItem.mockResolvedValue({});
  wishlistApi.getWishlist.mockResolvedValue([]);
  catalogApi.listCategories.mockResolvedValue([]);
  accountApi.listAddresses.mockResolvedValue(addresses);
  accountApi.addAddress.mockResolvedValue({});
  checkoutApi.initiateCheckout.mockResolvedValue(ORDER);
  checkoutApi.createPaymentIntent.mockResolvedValue(MOCK_INTENT);
  checkoutApi.confirmPayment.mockResolvedValue({ orderId: 31, status: 'processing' });
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

  it('should place and pay a guest order end to end', async () => {
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
    });
    expect(await screen.findByRole('heading', { name: 'Payment' })).toHaveFocus();
    expect(getGuestOrderToken(31)).toBe('g'.repeat(32));
    expect(screen.getByText('15:00')).toBeInTheDocument();
    expect(screen.getByText(/Test mode/)).toBeInTheDocument();
    expect(screen.getByText('Delivery')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Place test order for LKR 7,250' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/orders/31/confirmation'));
    expect(checkoutApi.confirmPayment).toHaveBeenCalledWith(31, 'mock_pi_31');
    expect(cartApi.removeCartItem).toHaveBeenCalledWith(1);
    expect(await screen.findByRole('heading', { name: /order is placed/ })).toBeInTheDocument();
    expect(screen.getByText(/saved guest@example.lk as the contact/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Create an account to track orders' })
    ).toBeInTheDocument();
  });

  it('should show a failed payment confirmation and let the shopper retry', async () => {
    setup();
    checkoutApi.confirmPayment
      .mockRejectedValueOnce(Object.assign(new Error('Payment not completed'), { status: 402 }))
      .mockResolvedValue({});
    await screen.findByRole('heading', { name: 'Checkout' });
    await userEvent.type(screen.getByLabelText('Email for your receipt'), 'g@x.lk');
    await fillAddress();
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    await userEvent.click(await screen.findByRole('button', { name: /Place test order/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Payment not completed');
    expect(screen.getByRole('button', { name: /Place test order/ })).toBeEnabled();
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

    await screen.findByRole('heading', { name: 'Payment' });
    expect(accountApi.addAddress).toHaveBeenCalledWith(
      expect.objectContaining({ line1: '12 Main Street', postalCode: '81200' })
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

    await screen.findByRole('heading', { name: 'Payment' });
    expect(accountApi.addAddress).not.toHaveBeenCalled();
  });

  it('should report when a saved address cannot be stored', async () => {
    setup({ customer: { id: 4, email: 'n@x.lk' } });
    accountApi.addAddress.mockRejectedValue(new Error('x'));
    await screen.findByRole('heading', { name: 'Checkout' });
    await fillAddress();
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    expect(
      await screen.findByText('Your address could not be saved for next time.')
    ).toBeInTheDocument();
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

  it('should release the hold when the shopper changes details', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Checkout' });
    await userEvent.type(screen.getByLabelText('Email for your receipt'), 'g@x.lk');
    await fillAddress();
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Change details' }));

    expect(checkoutApi.releaseReservation).toHaveBeenCalledWith('res_31');
    expect(screen.getByRole('button', { name: 'Continue to payment' })).toBeInTheDocument();
  });

  it('should release the hold and explain when the 15 minutes run out', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setup();
    checkoutApi.initiateCheckout.mockResolvedValue({ ...ORDER, expires_in: 3 });
    await screen.findByRole('heading', { name: 'Checkout' });
    await userEvent.type(screen.getByLabelText('Email for your receipt'), 'g@x.lk');
    await fillAddress();
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));
    expect(await screen.findByText('Less than 2 minutes left to pay.')).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(4000));

    expect(checkoutApi.releaseReservation).toHaveBeenCalledWith('res_31');
    expect(screen.getByRole('alert')).toHaveTextContent(/hold ended/);
    vi.useRealTimers();
  });

  describe('with Stripe', () => {
    const startStripe = async () => {
      setup();
      checkoutApi.createPaymentIntent.mockResolvedValue({
        provider: 'stripe',
        clientSecret: 'pi_9_secret',
        paymentIntentId: 'pi_9',
        amount: 7250,
      });
      await screen.findByRole('heading', { name: 'Checkout' });
      await userEvent.type(screen.getByLabelText('Email for your receipt'), 'g@x.lk');
      await fillAddress();
      await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));
      await screen.findByTestId('card-element');
    };

    it('should confirm the card with Stripe, then with our server', async () => {
      confirmCardPayment.mockResolvedValue({ paymentIntent: { id: 'pi_9' } });
      await startStripe();

      await userEvent.click(screen.getByRole('button', { name: 'Pay LKR 7,250' }));

      expect(confirmCardPayment).toHaveBeenCalledWith('pi_9_secret', expect.any(Object));
      await waitFor(() => expect(checkoutApi.confirmPayment).toHaveBeenCalledWith(31, 'pi_9'));
    });

    it('should show a card decline from Stripe', async () => {
      confirmCardPayment.mockResolvedValue({ error: { message: 'Your card was declined.' } });
      await startStripe();

      await userEvent.click(screen.getByRole('button', { name: 'Pay LKR 7,250' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Your card was declined.');
      expect(checkoutApi.confirmPayment).not.toHaveBeenCalled();
    });

    it('should show a server verification failure', async () => {
      confirmCardPayment.mockResolvedValue({ paymentIntent: { id: 'pi_9' } });
      await startStripe();
      checkoutApi.confirmPayment.mockRejectedValue(
        new Error('Payment not completed (status: processing)')
      );

      await userEvent.click(screen.getByRole('button', { name: 'Pay LKR 7,250' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Payment not completed');
    });
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

describe('useCountdown', () => {
  it('should count down, fire once at zero and handle no deadline', async () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    const deadline = Date.now() + 2000;
    const { result } = renderHook(() => useCountdown(deadline, onExpire));

    expect(result.current).toBe(2);
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(result.current).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);

    const idle = renderHook(() => useCountdown(null, onExpire));
    expect(idle.result.current).toBe(0);
    vi.useRealTimers();
  });
});
