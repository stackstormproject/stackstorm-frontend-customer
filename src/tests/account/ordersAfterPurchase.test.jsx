import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, apiError } from '../renderApp';
import { returnSteps } from '../../lib/returns';
import { Gallery } from '../../components/product/Gallery';
import * as authApi from '../../api/auth';
import * as cartApi from '../../api/cart';
import * as catalogApi from '../../api/catalog';
import * as wishlistApi from '../../api/wishlist';
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
  listMyReturns: vi.fn(),
}));
vi.mock('../../components/chat/ChatWidget', () => ({ default: () => null }));

// Refs #177: invoice download, return progress per order, order placed page, photo gallery.
const ITEM = {
  id: 91,
  variant_id: 43,
  quantity: 1,
  subtotal: 3400,
  product_title: 'Festival Sarong Set',
  product_slug: 'sarong',
  size: 'S',
  is_final_sale: false,
};
const ORDER = {
  id: 3,
  invoice_number: 'DFC-2026-0003',
  status: 'delivered',
  order_date: '2026-10-20T05:00:00Z',
  delivery_date: new Date().toISOString(),
  shipping_option: 'standard',
  shipping_cost: 450,
  total_amount: 3850,
  shipping_address: { line1: '12 Main Street', city: 'Dickwella', postal_code: '81200' },
  items: [ITEM, { ...ITEM, id: 92, product_title: 'Linen Shirt' }],
};
const TRACKING = { current_status: 'delivered', milestones: [] };

beforeEach(() => {
  authApi.restoreSession.mockResolvedValue({ id: 4, name: 'Nimal Perera' });
  cartApi.getCart.mockResolvedValue([]);
  cartApi.mergeGuestCart.mockResolvedValue({});
  wishlistApi.getWishlist.mockResolvedValue([]);
  catalogApi.listCategories.mockResolvedValue([]);
  returnsApi.listMyReturns.mockResolvedValue({ returns: [] });
  ordersApi.getOrder.mockResolvedValue(ORDER);
  ordersApi.trackOrder.mockResolvedValue(TRACKING);
  URL.createObjectURL = vi.fn(() => 'blob:invoice');
  URL.revokeObjectURL = vi.fn();
});

describe('returnSteps', () => {
  it('should mark the current step of a return', () => {
    expect(returnSteps('requested').map((s) => s.state)).toEqual(['current', 'todo', 'todo']);
    expect(returnSteps('approved', 'exchange')).toEqual([
      { label: 'Requested', state: 'done' },
      { label: 'Approved, item on its way back', state: 'current' },
      { label: 'New size sent', state: 'todo' },
    ]);
    expect(returnSteps('completed').map((s) => s.state)).toEqual(['done', 'done', 'done']);
    expect(returnSteps('completed').at(-1).label).toBe('Refunded');
  });

  it('should end a rejected request at "Not accepted"', () => {
    expect(returnSteps('rejected')).toEqual([
      { label: 'Requested', state: 'done' },
      { label: 'Not accepted', state: 'rejected' },
    ]);
  });
});

describe('Invoice download', () => {
  it('should download the invoice PDF from the order page', async () => {
    ordersApi.getInvoice.mockResolvedValue(new Blob(['%PDF-'], { type: 'application/pdf' }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderApp('/account/orders/3');

    await userEvent.click(await screen.findByRole('button', { name: 'Download invoice (PDF)' }));

    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(ordersApi.getInvoice).toHaveBeenCalledWith(3);
    expect(click.mock.contexts[0].download).toBe('DFC-2026-0003.pdf');
    click.mockRestore();
  });

  it('should explain when the invoice is not ready or fails', async () => {
    ordersApi.getInvoice
      .mockRejectedValueOnce(apiError(409, 'CONFLICT', 'unpaid'))
      .mockRejectedValueOnce(apiError(500, 'X', 'down'));
    renderApp('/account/orders/3');

    const button = await screen.findByRole('button', { name: 'Download invoice (PDF)' });
    await userEvent.click(button);
    expect(
      await screen.findByText('The invoice is ready once the payment has gone through.')
    ).toBeInTheDocument();
    await userEvent.click(button);
    expect(
      await screen.findByText('The invoice could not be downloaded. Try again in a moment.')
    ).toBeInTheDocument();
  });

  it('should not offer an invoice for an unpaid order', async () => {
    ordersApi.getOrder.mockResolvedValue({ ...ORDER, status: 'payment_pending' });
    renderApp('/account/orders/3');

    expect(await screen.findByRole('heading', { name: 'Order DFC-2026-0003' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Download invoice (PDF)' })
    ).not.toBeInTheDocument();
  });
});

describe('Returns on their order', () => {
  const RETURNS = [
    {
      id: 7,
      order_id: 3,
      order_item_id: 91,
      type: 'exchange',
      status: 'approved',
      reason: 'Wrong size',
      admin_note: 'Post it to Main Street',
      created_at: '2026-10-25T05:00:00Z',
    },
    {
      id: 8,
      order_id: 9,
      order_item_id: 99,
      type: 'return',
      status: 'completed',
      created_at: '2026-10-25T05:00:00Z',
    },
  ];

  it('should show the progress and the shop note under the returned item', async () => {
    returnsApi.listMyReturns.mockResolvedValue({ returns: RETURNS });
    renderApp('/account/orders/3');

    const progress = await screen.findByRole('list', { name: 'Exchange progress' });
    expect(within(progress).getByText('Approved, item on its way back')).toHaveAttribute(
      'aria-current',
      'step'
    );
    expect(screen.getByText('Note from the shop: Post it to Main Street')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Return or exchange' })).toHaveLength(1);
  });

  it('should flag orders with returns in the order list', async () => {
    returnsApi.listMyReturns.mockResolvedValue({ returns: RETURNS });
    ordersApi.listMyOrders.mockResolvedValue({
      orders: [
        { ...ORDER, items_count: 2 },
        { ...ORDER, id: 9, invoice_number: 'DFC-2026-0009', items_count: 1 },
        { ...ORDER, id: 10, invoice_number: 'DFC-2026-0010', items_count: 1 },
      ],
      pagination: {},
    });
    renderApp('/account/orders');

    expect(await screen.findByText('1 return in progress')).toBeInTheDocument();
    expect(screen.getByText('Return closed')).toBeInTheDocument();
    const third = screen.getByRole('link', { name: /DFC-2026-0010/ });
    expect(within(third).queryByText(/return/i)).not.toBeInTheDocument();
  });

  it('should still list orders when returns cannot load', async () => {
    returnsApi.listMyReturns.mockRejectedValue(new Error('down'));
    ordersApi.listMyOrders.mockResolvedValue({
      orders: [{ ...ORDER, items_count: 2 }],
      pagination: {},
    });
    renderApp('/account/orders');

    expect(await screen.findByRole('link', { name: /DFC-2026-0003/ })).toBeInTheDocument();
  });

  it('should link each return to its order', async () => {
    returnsApi.listMyReturns.mockResolvedValue({ returns: RETURNS });
    renderApp('/account/returns');

    expect((await screen.findAllByRole('link', { name: 'View order' }))[0]).toHaveAttribute(
      'href',
      '/account/orders/3'
    );
  });
});

describe('Order placed page', () => {
  it('should confirm the order with the next steps and an invoice', async () => {
    ordersApi.getOrder.mockResolvedValue({ ...ORDER, status: 'confirmed' });
    renderApp('/orders/3/confirmation');

    expect(
      await screen.findByRole('heading', { name: 'Thank you, your order is placed' })
    ).toBeInTheDocument();
    const next = screen.getByRole('list', { name: 'What happens next' });
    expect(within(next).getByText('Payment received')).toBeInTheDocument();
    expect(within(next).getByText('On its way')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download invoice (PDF)' })).toBeInTheDocument();
  });

  it('should say a collection order waits for payment', async () => {
    ordersApi.getOrder.mockResolvedValue({
      ...ORDER,
      status: 'payment_pending',
      shipping_option: 'pickup',
    });
    renderApp('/orders/3/confirmation');

    const next = await screen.findByRole('list', { name: 'What happens next' });
    expect(within(next).getByText('Waiting for payment')).toBeInTheDocument();
    expect(within(next).getByText('Ready to collect')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Download invoice (PDF)' })
    ).not.toBeInTheDocument();
  });
});

describe('Gallery', () => {
  const IMAGES = ['/a.jpg', '/b.jpg', '/c.jpg', '/d.jpg'];

  it('should show the main photo and move through all four with arrows and thumbnails', async () => {
    render(<Gallery images={IMAGES} name="Linen Saree" />);
    const main = () => screen.getByRole('img', { name: 'Linen Saree' });

    expect(main()).toHaveAttribute('src', '/a.jpg');
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Previous photo' }));
    expect(main()).toHaveAttribute('src', '/d.jpg');
    await userEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(main()).toHaveAttribute('src', '/a.jpg');
    await userEvent.click(screen.getByRole('button', { name: 'Show image 3 of 4' }));
    expect(main()).toHaveAttribute('src', '/c.jpg');
    expect(screen.getByText('3 / 4')).toBeInTheDocument();
  });

  it('should show a single photo without controls', () => {
    render(<Gallery images={['/a.jpg']} name="Shawl" />);

    expect(screen.queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument();
  });
});
