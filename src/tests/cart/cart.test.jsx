import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../renderApp';
import * as authApi from '../../api/auth';
import * as cartApi from '../../api/cart';
import * as catalogApi from '../../api/catalog';
import * as wishlistApi from '../../api/wishlist';

vi.mock('../../api/auth');
vi.mock('../../api/cart');
vi.mock('../../api/wishlist');
vi.mock('../../api/catalog');
vi.mock('../../components/chat/ChatWidget', () => ({ default: () => null }));

const line = (overrides = {}) => ({
  id: 1,
  variant_id: 43,
  quantity: 2,
  unit_price: 4500,
  line_total: 9000,
  available_stock: 8,
  size: 'M',
  color: 'Indigo',
  product: {
    id: 7,
    name: 'Indigo Batik Shirt',
    slug: 'indigo-batik-shirt',
    primary_image: 'https://img/1.jpg',
  },
  ...overrides,
});

const openBag = async () => {
  await userEvent.click(await screen.findByRole('button', { name: /Shopping bag/ }));
  return screen.findByRole('dialog', { name: /Your bag/ });
};

describe('Cart drawer', () => {
  beforeEach(() => {
    authApi.restoreSession.mockResolvedValue(null);
    wishlistApi.getWishlist.mockResolvedValue([]);
    catalogApi.listCategories.mockResolvedValue([]);
    catalogApi.listProducts.mockResolvedValue({ products: [], pagination: {} });
  });

  it('should list server lines with variant, unit price and line total', async () => {
    cartApi.getCart.mockResolvedValue([line()]);
    renderApp('/');

    const dialog = await openBag();

    expect(within(dialog).getByRole('link', { name: 'Indigo Batik Shirt' })).toHaveAttribute(
      'href',
      '/products/indigo-batik-shirt'
    );
    expect(within(dialog).getByText(/M, Indigo/)).toBeInTheDocument();
    expect(within(dialog).getAllByText('LKR 9,000')).toHaveLength(2);
    expect(
      within(dialog).getByText('Add LKR 1,000 more for free islandwide delivery.')
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '90');
  });

  it('should behave as a modal: focus inside, Escape closes, focus returns', async () => {
    cartApi.getCart.mockResolvedValue([line()]);
    renderApp('/');
    const bagButton = await screen.findByRole('button', { name: /Shopping bag/ });

    await userEvent.click(bagButton);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('button', { name: 'Close bag' })).toHaveFocus();

    await userEvent.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(bagButton).toHaveFocus();
  });

  it('should change quantity, remove at zero and remove explicitly', async () => {
    cartApi.getCart.mockResolvedValue([line({ quantity: 1, line_total: 4500 })]);
    cartApi.updateCartItem.mockResolvedValue({});
    cartApi.removeCartItem.mockResolvedValue({});
    renderApp('/');
    const dialog = await openBag();

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Increase quantity of indigo batik shirt' })
    );
    await waitFor(() => expect(cartApi.updateCartItem).toHaveBeenCalledWith(1, 2));
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Remove Indigo Batik Shirt' })
    );
    await waitFor(() => expect(cartApi.removeCartItem).toHaveBeenCalledWith(1));
  });

  it('should explain a stock conflict on increase', async () => {
    cartApi.getCart.mockResolvedValue([line({ available_stock: 3 })]);
    cartApi.updateCartItem.mockRejectedValue(
      Object.assign(new Error('INSUFFICIENT_STOCK'), { status: 409 })
    );
    renderApp('/');
    const dialog = await openBag();

    await userEvent.click(within(dialog).getByRole('button', { name: /Increase quantity/ }));

    expect(await screen.findByText('Only 3 left.')).toBeInTheDocument();
  });

  it('should show other errors as given', async () => {
    cartApi.getCart.mockResolvedValue([line()]);
    cartApi.removeCartItem.mockRejectedValue(new Error('Cannot reach the shop right now.'));
    renderApp('/');
    const dialog = await openBag();

    await userEvent.click(within(dialog).getByRole('button', { name: /^Remove/ }));

    expect(await screen.findByText('Cannot reach the shop right now.')).toBeInTheDocument();
  });

  it('should block checkout while a line exceeds stock', async () => {
    cartApi.getCart.mockResolvedValue([
      line({ quantity: 3, available_stock: 1 }),
      line({ id: 2, available_stock: 0, quantity: 1, product: { name: 'Sarong' } }),
    ]);
    renderApp('/');
    const dialog = await openBag();

    expect(
      within(dialog).getByText('Only 1 left. Lower the quantity to check out.')
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Now sold out. Remove it to check out.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Check out' })).toBeDisabled();
  });

  it('should go to checkout and close the drawer', async () => {
    cartApi.getCart.mockResolvedValue([line({ quantity: 3, line_total: 13500 })]);
    const { router } = renderApp('/');
    const dialog = await openBag();

    expect(
      within(dialog).getByText('Your order qualifies for free islandwide delivery.')
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('link', { name: 'Check out' }));

    expect(router.state.location.pathname).toBe('/checkout');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('should close from the backdrop', async () => {
    cartApi.getCart.mockResolvedValue([line()]);
    renderApp('/');
    await openBag();

    await userEvent.click(screen.getAllByRole('button', { name: 'Close bag' })[0]);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should show an empty bag with a way back to the shop', async () => {
    cartApi.getCart.mockResolvedValue([]);
    renderApp('/');
    const dialog = await openBag();

    expect(within(dialog).getByRole('heading', { name: 'Your bag is empty' })).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Start shopping' })).toHaveAttribute(
      'href',
      '/shop'
    );
  });

  it('should offer a retry when the bag fails to load', async () => {
    cartApi.getCart.mockRejectedValueOnce(new Error('down')).mockResolvedValue([line()]);
    renderApp('/');
    const dialog = await openBag();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Try again' }));

    expect(
      await within(dialog).findByRole('link', { name: 'Indigo Batik Shirt' })
    ).toBeInTheDocument();
  });

  it('should show the same bag on the /cart page', async () => {
    cartApi.getCart.mockResolvedValue([
      line({ product: { name: 'No slug item' }, size: null, color: null }),
    ]);
    renderApp('/cart');

    expect(await screen.findByRole('heading', { level: 1, name: 'Your bag' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'No slug item' })).toHaveAttribute(
      'href',
      '/shop'
    );
  });
});
