import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../renderApp';
import { returnEligibility } from '../../lib/returns';
import { ORDER_REFRESH_MS } from '../../lib/format';
import * as authApi from '../../api/auth';
import * as cartApi from '../../api/cart';
import * as catalogApi from '../../api/catalog';
import * as wishlistApi from '../../api/wishlist';
import * as accountApi from '../../api/account';
import * as ordersApi from '../../api/orders';
import * as returnsApi from '../../api/returns';

vi.mock('../../api/auth');
vi.mock('../../api/cart');
vi.mock('../../api/wishlist');
vi.mock('../../api/catalog');
vi.mock('../../api/account');
vi.mock('../../api/orders');
vi.mock('../../api/returns', async (importOriginal) => ({
  ...(await importOriginal()),
  requestReturn: vi.fn(),
  listMyReturns: vi.fn(),
}));
vi.mock('../../components/chat/ChatWidget', () => ({ default: () => null }));

const CUSTOMER = { id: 4, name: 'Nimal Perera', email: 'nimal@example.lk', phone: '+94771234567' };
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

const ITEM = {
  id: 91,
  variant_id: 43,
  quantity: 1,
  subtotal: 3400,
  product_title: 'Festival Sarong Set',
  product_slug: 'sarong',
  size: 'S',
  color: 'Natural',
  is_final_sale: false,
};

const ORDER = {
  id: 3,
  invoice_number: 'DFC-2026-0003',
  status: 'delivered',
  order_date: daysAgo(5),
  delivery_date: daysAgo(2),
  shipping_option: 'standard',
  shipping_cost: 450,
  total_amount: 3850,
  tracking_number: 'KOOMBIYO-123',
  shipping_address: { line1: '12 Main Street', city: 'Dickwella', postal_code: '81200' },
  items: [ITEM, { ...ITEM, id: 92, product_title: 'Clearance Shawl', is_final_sale: true }],
};

const TRACKING = {
  current_status: 'delivered',
  estimated_delivery: '2026-10-30',
  milestones: [
    { key: 'placed', title: 'Order Placed', status: 'completed', timestamp: daysAgo(5) },
    { key: 'delivered', title: 'Delivered', status: 'current', timestamp: daysAgo(2) },
  ],
};

beforeEach(() => {
  authApi.restoreSession.mockResolvedValue(CUSTOMER);
  authApi.logout.mockResolvedValue();
  cartApi.getCart.mockResolvedValue([]);
  cartApi.mergeGuestCart.mockResolvedValue({});
  wishlistApi.getWishlist.mockResolvedValue([]);
  catalogApi.listCategories.mockResolvedValue([]);
  accountApi.getLoyalty.mockResolvedValue({
    tier: 'gold',
    current_points: 1250,
    lifetime_points: 4000,
    benefits: ['Earn 1.5 points per LKR 100'],
  });
  returnsApi.listMyReturns.mockResolvedValue({ returns: [] });
});

describe('returnEligibility (SRS business rules)', () => {
  const now = new Date('2026-11-30T00:00:00Z');
  const delivered = (days) => ({
    status: 'delivered',
    delivery_date: new Date(now.getTime() - days * 86400000).toISOString(),
  });

  it.each([
    [delivered(30), {}, [], true, null],
    [delivered(31), {}, [], false, 'Return window closed'],
    [{ status: 'shipped' }, {}, [], false, null],
    [delivered(1), { is_final_sale: true }, [], false, 'Final sale'],
    [delivered(1), { id: 5 }, [{ order_item_id: 5 }], false, 'Return requested'],
  ])('should decide eligibility for case %#', (order, item, existing, eligible, reason) => {
    expect(returnEligibility(order, { id: 1, ...item }, existing, now)).toEqual({
      eligible,
      reason,
    });
  });
});

describe('Account overview', () => {
  it('should save profile changes and show loyalty (FR011, FR027)', async () => {
    accountApi.updateProfile.mockResolvedValue({ name: 'Nimal P', phone: '' });
    renderApp('/account');

    expect(await screen.findByRole('heading', { name: 'Hello, Nimal' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Gold member' })).toBeInTheDocument();
    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('readonly');

    const name = screen.getByLabelText('Full name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Nimal P');
    await userEvent.clear(screen.getByLabelText('Mobile number'));
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }));

    expect(accountApi.updateProfile).toHaveBeenCalledWith({ name: 'Nimal P', phone: '' });
    expect(await screen.findByText('Your details are saved')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hello, Nimal' })).toBeInTheDocument();
  });

  it('should validate the profile and report save errors', async () => {
    accountApi.updateProfile.mockRejectedValue(new Error('Invalid phone number format'));
    renderApp('/account');
    await screen.findByLabelText('Full name');

    await userEvent.clear(screen.getByLabelText('Full name'));
    await userEvent.clear(screen.getByLabelText('Mobile number'));
    await userEvent.type(screen.getByLabelText('Mobile number'), '12');
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }));
    expect(screen.getByText('Enter your name.')).toBeInTheDocument();
    expect(accountApi.updateProfile).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Full name'), 'Nimal');
    await userEvent.clear(screen.getByLabelText('Mobile number'));
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }));
    expect(await screen.findByText('Invalid phone number format')).toBeInTheDocument();
  });

  it('should retry loyalty after an error', async () => {
    accountApi.getLoyalty.mockRejectedValueOnce(new Error('down')).mockResolvedValue({
      tier: 'silver',
      current_points: 0,
      lifetime_points: 0,
    });
    renderApp('/account');

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Silver member' })).toBeInTheDocument();
  });

  it('should sign out and go home', async () => {
    const { router } = renderApp('/account');

    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(authApi.logout).toHaveBeenCalled();
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(await screen.findByText('You are signed out.')).toBeInTheDocument();
  });

  it('should still sign out locally when the server call fails', async () => {
    authApi.logout.mockRejectedValue(new Error('offline'));
    const { router } = renderApp('/account');

    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });
});

describe('Orders (FR009, FR010)', () => {
  it('should list orders and page through them', async () => {
    ordersApi.listMyOrders.mockResolvedValue({
      orders: [{ ...ORDER, items_count: 2 }],
      pagination: { total_pages: 2 },
    });
    renderApp('/account/orders');

    const link = await screen.findByRole('link', { name: /DFC-2026-0003/ });
    expect(link).toHaveAttribute('href', '/account/orders/3');
    expect(within(link).getByText('Delivered')).toBeInTheDocument();
    expect(within(link).getByText('2 items')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(ordersApi.listMyOrders).toHaveBeenLastCalledWith(2));
  });

  it('should invite a first purchase when there are no orders', async () => {
    ordersApi.listMyOrders.mockResolvedValue({ orders: [], pagination: {} });
    renderApp('/account/orders');

    expect(await screen.findByRole('heading', { name: 'No orders yet' })).toBeInTheDocument();
  });

  it('should retry the order list after an error', async () => {
    ordersApi.listMyOrders.mockRejectedValueOnce(new Error('down')).mockResolvedValue({
      orders: [{ ...ORDER, items_count: 1 }],
      pagination: {},
    });
    renderApp('/account/orders');

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('1 item')).toBeInTheDocument();
  });

  it('should show order detail with tracking and per-item return eligibility', async () => {
    ordersApi.getOrder.mockResolvedValue(ORDER);
    ordersApi.trackOrder.mockResolvedValue(TRACKING);
    renderApp('/account/orders/3');

    expect(await screen.findByRole('heading', { name: 'Order DFC-2026-0003' })).toBeInTheDocument();
    expect(
      screen.getByText('Delivered', { selector: '.timeline__title' }).closest('li')
    ).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('KOOMBIYO-123')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Return or exchange' })).toHaveLength(1);
    expect(screen.getByText('Final sale')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Write a review' })[0]).toHaveAttribute(
      'href',
      '/products/sarong#reviews-heading'
    );
  });

  it('should show a status the shop changed without a reload (#183)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    ordersApi.getOrder
      .mockResolvedValueOnce({ ...ORDER, status: 'processing' })
      .mockResolvedValue({ ...ORDER, status: 'shipped' });
    ordersApi.trackOrder.mockResolvedValue(TRACKING);
    renderApp('/account/orders/3');

    expect(await screen.findByText(/· Being prepared/)).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTimeAsync(ORDER_REFRESH_MS));
    expect(await screen.findByText(/· On its way/)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('should explain an unpaid order and show expected delivery for open orders', async () => {
    ordersApi.getOrder.mockResolvedValue({
      ...ORDER,
      status: 'payment_pending',
      tracking_number: null,
    });
    ordersApi.trackOrder.mockResolvedValue({ ...TRACKING, current_status: 'payment_pending' });
    renderApp('/account/orders/3');

    expect(await screen.findByText(/was not paid/)).toBeInTheDocument();
    expect(screen.getByText(/Expected by/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Return or exchange' })).not.toBeInTheDocument();
  });

  it('should show a cancelled order and a collection order', async () => {
    ordersApi.getOrder.mockResolvedValue({
      ...ORDER,
      status: 'cancelled',
      shipping_option: 'pickup',
    });
    ordersApi.trackOrder.mockResolvedValue({ ...TRACKING, current_status: 'cancelled' });
    returnsApi.listMyReturns.mockRejectedValue(new Error('returns down'));
    renderApp('/account/orders/3');

    expect(await screen.findByText('This order was cancelled.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Collection' })).toBeInTheDocument();
  });

  it('should show not found for an order the customer does not own', async () => {
    ordersApi.getOrder.mockRejectedValue(Object.assign(new Error('nf'), { status: 404 }));
    ordersApi.trackOrder.mockResolvedValue(TRACKING);
    renderApp('/account/orders/999');

    expect(
      await screen.findByRole('heading', { name: 'This page does not exist' })
    ).toBeInTheDocument();
  });

  it('should retry order detail after an error', async () => {
    ordersApi.getOrder.mockRejectedValueOnce(new Error('down')).mockResolvedValue(ORDER);
    ordersApi.trackOrder.mockResolvedValue(TRACKING);
    renderApp('/account/orders/3');

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Order DFC-2026-0003' })).toBeInTheDocument();
  });
});

describe('Return and exchange (FR023, UC-005)', () => {
  const openDialog = async () => {
    ordersApi.getOrder.mockResolvedValue(ORDER);
    ordersApi.trackOrder.mockResolvedValue(TRACKING);
    catalogApi.getProduct.mockResolvedValue({
      variants: [
        { id: 43, size: 'S', color: 'Natural', available_stock: 5 },
        { id: 45, size: 'L', color: 'Natural', available_stock: 2 },
        { id: 44, size: 'M', color: 'Natural', available_stock: 3 },
        { id: 46, size: 'XL', color: 'Natural', available_stock: 0 },
      ],
    });
    renderApp('/account/orders/3');
    await userEvent.click(await screen.findByRole('button', { name: 'Return or exchange' }));
    return screen.getByRole('dialog', { name: 'Return or exchange' });
  };

  it('should request a refund with the reason and details', async () => {
    returnsApi.requestReturn.mockResolvedValue({ id: 1 });
    const dialog = await openDialog();

    await userEvent.selectOptions(within(dialog).getByLabelText('Reason'), 'Arrived damaged');
    await userEvent.type(within(dialog).getByLabelText(/Anything else/), 'Torn seam');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send request' }));

    expect(returnsApi.requestReturn).toHaveBeenCalledWith({
      orderItemId: 91,
      type: 'return',
      reason: 'Arrived damaged: Torn seam',
      exchangeVariantId: undefined,
    });
    expect(
      await screen.findByText('Return requested. Follow its progress under Returns.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should offer only other in-stock sizes for an exchange, in size order', async () => {
    returnsApi.requestReturn.mockResolvedValue({ id: 2 });
    const dialog = await openDialog();

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Exchange for another size' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send request' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'Choose the size you want instead.'
    );

    const select = await within(dialog).findByLabelText('New size');
    await waitFor(() => expect(within(select).getAllByRole('option')).toHaveLength(3));
    expect(
      within(select)
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual(['Choose a size', 'M, Natural', 'L, Natural']);
    await userEvent.selectOptions(select, '44');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send request' }));

    expect(returnsApi.requestReturn).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'exchange', exchangeVariantId: 44, reason: 'Wrong size' })
    );
    expect(
      await screen.findByText('Exchange requested. Follow its progress under Returns.')
    ).toBeInTheDocument();
  });

  it('should show the server rule that refused the request', async () => {
    returnsApi.requestReturn.mockRejectedValue(new Error('The 30-day return window has closed'));
    const dialog = await openDialog();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Send request' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      '30-day return window has closed'
    );
  });

  it('should close on cancel and on Escape', async () => {
    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Return or exchange' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should say when no other size is in stock', async () => {
    ordersApi.getOrder.mockResolvedValue(ORDER);
    ordersApi.trackOrder.mockResolvedValue(TRACKING);
    catalogApi.getProduct.mockResolvedValue({
      variants: [{ id: 43, size: 'S', available_stock: 1 }],
    });
    renderApp('/account/orders/3');
    await userEvent.click(await screen.findByRole('button', { name: 'Return or exchange' }));

    await userEvent.click(screen.getByRole('radio', { name: 'Exchange for another size' }));

    expect(await screen.findByText('No other sizes are in stock right now.')).toBeInTheDocument();
  });
});

describe('Returns list', () => {
  it('should list requests with their status and refund', async () => {
    returnsApi.listMyReturns.mockResolvedValue({
      returns: [
        {
          id: 1,
          product_title: 'Sarong',
          type: 'return',
          status: 'approved',
          refund_amount: 3400,
          reason: 'Wrong size',
          created_at: '2026-10-27',
        },
        {
          id: 2,
          product_title: 'Shirt',
          type: 'exchange',
          status: 'mystery',
          refund_amount: 0,
          reason: 'x',
          created_at: '2026-10-27',
        },
      ],
    });
    renderApp('/account/returns');

    expect(await screen.findByText('Approved: send the item back')).toBeInTheDocument();
    expect(screen.getByText('LKR 3,400')).toBeInTheDocument();
    expect(screen.getByText('mystery')).toBeInTheDocument();
  });

  it('should explain how to start a return when there are none', async () => {
    renderApp('/account/returns');

    expect(await screen.findByRole('heading', { name: 'No returns' })).toBeInTheDocument();
  });

  it('should retry after an error', async () => {
    returnsApi.listMyReturns
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValue({ returns: [] });
    renderApp('/account/returns');

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'No returns' })).toBeInTheDocument();
  });
});

describe('Address book (FR011)', () => {
  const SAVED = [
    {
      id: 1,
      address_line1: '12 Main Street',
      city: 'Dickwella',
      postal_code: '81200',
      state: 'Matara',
      is_default: true,
    },
    {
      id: 2,
      address_line1: '5 Lake Road',
      city: 'Matara',
      postal_code: '81000',
      is_default: false,
    },
  ];

  beforeEach(() => {
    accountApi.listAddresses.mockResolvedValue(SAVED);
    accountApi.addAddress.mockResolvedValue({});
    accountApi.updateAddress.mockResolvedValue({});
    accountApi.setDefaultAddress.mockResolvedValue({});
    accountApi.deleteAddress.mockResolvedValue({});
  });

  it('should add a validated address', async () => {
    renderApp('/account/addresses');
    await userEvent.click(await screen.findByRole('button', { name: 'Add an address' }));

    await userEvent.click(screen.getByRole('button', { name: 'Save address' }));
    expect(screen.getByText('Enter the street address.')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Street address'), '9 Beach Road');
    await userEvent.type(screen.getByLabelText('Town or city'), 'Tangalle');
    await userEvent.type(screen.getByLabelText('Postal code'), '82200');
    await userEvent.click(screen.getByRole('button', { name: 'Save address' }));

    expect(accountApi.addAddress).toHaveBeenCalledWith(
      expect.objectContaining({ line1: '9 Beach Road', postalCode: '82200' })
    );
    expect(await screen.findByText('Address saved')).toBeInTheDocument();
  });

  it('should edit an address keeping its default flag', async () => {
    renderApp('/account/addresses');
    await userEvent.click((await screen.findAllByRole('button', { name: 'Edit' }))[0]);

    const street = screen.getByLabelText('Street address');
    expect(street).toHaveValue('12 Main Street');
    await userEvent.clear(street);
    await userEvent.type(street, '14 Main Street');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(accountApi.updateAddress).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ line1: '14 Main Street', isDefault: true })
    );
  });

  it('should make an address the default', async () => {
    renderApp('/account/addresses');

    await userEvent.click(await screen.findByRole('button', { name: 'Make default' }));

    expect(accountApi.setDefaultAddress).toHaveBeenCalledWith(2);
    expect(await screen.findByText('Default address changed')).toBeInTheDocument();
  });

  it('should ask before deleting and allow keeping it', async () => {
    renderApp('/account/addresses');
    const deletes = await screen.findAllByRole('button', { name: 'Delete' });

    await userEvent.click(deletes[1]);
    await userEvent.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(accountApi.deleteAddress).not.toHaveBeenCalled();

    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    expect(accountApi.deleteAddress).toHaveBeenCalledWith(2);
  });

  it('should show API errors and cancel editing', async () => {
    accountApi.setDefaultAddress.mockRejectedValue(new Error('Address not found'));
    renderApp('/account/addresses');

    await userEvent.click(await screen.findByRole('button', { name: 'Make default' }));
    expect(await screen.findByText('Address not found')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  it('should say when there are no addresses and retry after an error', async () => {
    accountApi.listAddresses.mockRejectedValueOnce(new Error('down')).mockResolvedValue([]);
    renderApp('/account/addresses');

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('You have no saved addresses yet.')).toBeInTheDocument();
  });
});

describe('Wishlist page (FR005)', () => {
  it('should show saved products', async () => {
    wishlistApi.getWishlist.mockResolvedValue([
      {
        id: 3,
        name: 'Silk Saree',
        slug: 'silk-saree',
        price: '14800.00',
        variants: [{ available_stock: 2 }],
      },
    ]);
    renderApp('/account/wishlist');

    expect(await screen.findByRole('link', { name: 'Silk Saree' })).toHaveAttribute(
      'href',
      '/products/silk-saree'
    );
  });

  it('should invite browsing when empty', async () => {
    renderApp('/account/wishlist');

    expect(await screen.findByRole('heading', { name: 'Nothing saved yet' })).toBeInTheDocument();
  });
});
