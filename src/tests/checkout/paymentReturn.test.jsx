import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../renderApp';
import * as redirect from '../../lib/redirect';
import { paymentPageFor } from '../../api/checkout';
import * as authApi from '../../api/auth';
import * as cartApi from '../../api/cart';
import * as catalogApi from '../../api/catalog';
import * as wishlistApi from '../../api/wishlist';
import * as checkoutApi from '../../api/checkout';
import * as ordersApi from '../../api/orders';

vi.mock('../../api/auth');
vi.mock('../../api/cart');
vi.mock('../../api/wishlist');
vi.mock('../../api/catalog');
vi.mock('../../api/orders');
vi.mock('../../api/checkout', async (importOriginal) => ({
  ...(await importOriginal()),
  createCheckoutSession: vi.fn(),
  confirmCheckoutSession: vi.fn(),
}));
vi.mock('../../lib/redirect', () => ({ leaveFor: vi.fn() }));
vi.mock('../../components/chat/ChatWidget', () => ({ default: () => null }));

// Refs #182: coming back from the hosted payment page, and the test gateway.
const CART = [
  { id: 1, variant_id: 43, quantity: 1, line_total: 3400, available_stock: 5, product: {} },
  { id: 2, variant_id: 99, quantity: 1, line_total: 1000, available_stock: 5, product: {} },
];

beforeEach(() => {
  authApi.restoreSession.mockResolvedValue({ id: 4, name: 'Nimal' });
  cartApi.getCart.mockResolvedValue(CART);
  cartApi.mergeGuestCart.mockResolvedValue({});
  cartApi.removeCartItem.mockResolvedValue({});
  wishlistApi.getWishlist.mockResolvedValue([]);
  catalogApi.listCategories.mockResolvedValue([]);
  ordersApi.getOrder.mockResolvedValue({
    id: 31,
    invoice_number: 'DFC-2026-0031',
    status: 'processing',
    order_date: '2026-10-27',
    shipping_option: 'pickup',
    total_amount: 3400,
    items: [{ id: 9, variant_id: 43, product_title: 'Sarong', quantity: 1, subtotal: 3400 }],
  });
});

describe('paymentPageFor', () => {
  it('should open the test gateway in the app and Stripe outside it', () => {
    expect(paymentPageFor(5, { provider: 'mock', sessionId: 'mock_cs_5', amount: 100 })).toEqual({
      route: '/checkout/test-gateway?order=5&session_id=mock_cs_5&amount=100',
    });
    expect(paymentPageFor(5, { provider: 'stripe', url: 'https://checkout.stripe.com/x' })).toEqual(
      { href: 'https://checkout.stripe.com/x' }
    );
  });
});

describe('Back from the payment page', () => {
  it('should verify the payment, remove only the bought items and show the confirmation', async () => {
    checkoutApi.confirmCheckoutSession.mockResolvedValue({ status: 'processing' });
    const { router } = renderApp('/checkout/complete?order=31&session_id=cs_test_1');

    await waitFor(() => expect(router.state.location.pathname).toBe('/orders/31/confirmation'));
    expect(checkoutApi.confirmCheckoutSession).toHaveBeenCalledWith(31, 'cs_test_1');
    expect(checkoutApi.confirmCheckoutSession).toHaveBeenCalledTimes(1);
    expect(cartApi.removeCartItem).toHaveBeenCalledWith(1);
    expect(cartApi.removeCartItem).not.toHaveBeenCalledWith(2);
  });

  it('should still finish when the order cannot be read back', async () => {
    checkoutApi.confirmCheckoutSession.mockResolvedValue({ status: 'processing' });
    ordersApi.getOrder.mockRejectedValueOnce(new Error('down'));
    const { router } = renderApp('/checkout/complete?order=31&session_id=cs_test_1');

    await waitFor(() => expect(router.state.location.pathname).toBe('/orders/31/confirmation'));
    expect(cartApi.removeCartItem).toHaveBeenCalledTimes(2);
  });

  it('should explain a payment that did not go through and open the payment page again', async () => {
    checkoutApi.confirmCheckoutSession.mockRejectedValue(
      Object.assign(new Error('Payment not completed (status: unpaid)'), { status: 402 })
    );
    checkoutApi.createCheckoutSession.mockResolvedValue({
      provider: 'stripe',
      url: 'https://checkout.stripe.com/again',
    });
    renderApp('/checkout/complete?order=31&session_id=cs_test_1');

    expect(
      await screen.findByRole('heading', { name: 'Payment not completed' })
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('status: unpaid');
    await userEvent.click(screen.getByRole('button', { name: 'Try paying again' }));
    expect(redirect.leaveFor).toHaveBeenCalledWith('https://checkout.stripe.com/again');
  });

  it('should let the shopper try again after cancelling on the test gateway', async () => {
    checkoutApi.createCheckoutSession.mockResolvedValue({
      provider: 'mock',
      sessionId: 'mock_cs_31_2',
      amount: 3400,
    });
    const { router } = renderApp('/checkout/complete?order=31&cancelled=1');

    expect(await screen.findByRole('heading', { name: 'Payment cancelled' })).toBeInTheDocument();
    expect(checkoutApi.confirmCheckoutSession).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Try paying again' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/checkout/test-gateway'));
  });

  it('should say when the order can no longer be paid', async () => {
    checkoutApi.createCheckoutSession.mockRejectedValue(
      Object.assign(new Error('not awaiting payment'), { status: 409 })
    );
    renderApp('/checkout/complete?order=31&cancelled=1');

    await userEvent.click(await screen.findByRole('button', { name: 'Try paying again' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('can no longer be paid');
  });

  it('should show other errors when reopening the payment page fails', async () => {
    checkoutApi.createCheckoutSession.mockRejectedValue(new Error('Server is busy'));
    renderApp('/checkout/complete?order=31&cancelled=1');

    await userEvent.click(await screen.findByRole('button', { name: 'Try paying again' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Server is busy');
  });

  it('should explain a return address without an order', async () => {
    renderApp('/checkout/complete');

    expect(
      await screen.findByText('We could not tell which order this payment was for.')
    ).toBeInTheDocument();
  });
});

describe('Test payment gateway', () => {
  it('should be labelled as a test and go back to the shop on cancel', async () => {
    const { router } = renderApp(
      '/checkout/test-gateway?order=31&session_id=mock_cs_31_1&amount=3400'
    );

    expect(await screen.findByText('Test mode: no real payment is taken')).toBeInTheDocument();
    expect(screen.getByText('Pay LKR 3,400', { exact: false })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel and return to the shop' }));
    expect(router.state.location.search).toBe('?order=31&cancelled=1');
  });

  it('should not offer to pay without a session', async () => {
    renderApp('/checkout/test-gateway?order=31');

    expect(await screen.findByRole('button', { name: /^Pay/ })).toBeDisabled();
  });
});
