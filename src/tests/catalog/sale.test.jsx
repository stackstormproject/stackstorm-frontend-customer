import { screen, waitFor, within } from '@testing-library/react';
import { renderApp } from '../renderApp';
import * as authApi from '../../api/auth';
import * as cartApi from '../../api/cart';
import * as catalogApi from '../../api/catalog';
import * as wishlistApi from '../../api/wishlist';

// Refs #199: a "Sale" section on the home page, a dedicated /sale page, and sale pricing
// shown on product cards and the product detail page.
vi.mock('../../api/auth');
vi.mock('../../api/cart');
vi.mock('../../api/wishlist');
vi.mock('../../api/catalog', async (importOriginal) => ({
  ...(await importOriginal()),
  listProducts: vi.fn(),
  listCategories: vi.fn(),
  listBrands: vi.fn(),
  getFacets: vi.fn(),
}));
vi.mock('../../components/chat/ChatWidget', () => ({ default: () => null }));

const onSaleProduct = (id) => ({
  id,
  name: `Batik Shirt ${id}`,
  slug: `batik-shirt-${id}`,
  price: '4500.00',
  is_on_sale: true,
  discount_percentage: 20,
  sale_price: '3600.00',
  primary_image: `https://img/${id}.jpg`,
  variants: [{ id: id * 10, size: 'M', available_stock: 3 }],
});

const page = (products, pagination = {}) => ({
  products,
  pagination: { total: products.length, page: 1, totalPages: 1, ...pagination },
});

beforeEach(() => {
  authApi.restoreSession.mockRejectedValue(new Error('guest'));
  cartApi.getCart.mockResolvedValue([]);
  wishlistApi.getWishlist.mockResolvedValue([]);
  catalogApi.listCategories.mockResolvedValue([]);
  catalogApi.listBrands.mockResolvedValue([]);
  catalogApi.getFacets.mockResolvedValue({ colors: [] });
});

describe('Sale section on the home page', () => {
  it('should show a "Sale" rail linking to /sale', async () => {
    catalogApi.listProducts.mockImplementation(async ({ section }) =>
      section === 'sale' ? page([onSaleProduct(1), onSaleProduct(2)]) : page([])
    );
    renderApp('/');

    const sale = await screen.findByRole('region', { name: 'Sale' });
    await waitFor(() => expect(within(sale).getAllByRole('article')).toHaveLength(2));
    expect(within(sale).getByRole('link', { name: 'Browse sale' })).toHaveAttribute(
      'href',
      '/sale'
    );
    expect(catalogApi.listProducts).toHaveBeenCalledWith({ section: 'sale', limit: 8 });
  });
});

describe('Sale page (/sale)', () => {
  it('should always request section=sale, even with other filters in the URL', async () => {
    catalogApi.listProducts.mockResolvedValue(page([onSaleProduct(1)]));
    renderApp('/sale?size=M');

    await screen.findAllByRole('article');
    expect(catalogApi.listProducts).toHaveBeenCalledWith(
      expect.objectContaining({ section: 'sale', size: 'M' })
    );
  });

  it('should show the sale badge and struck-through price on its cards', async () => {
    catalogApi.listProducts.mockResolvedValue(page([onSaleProduct(1)]));
    renderApp('/sale');

    const card = (await screen.findAllByRole('article'))[0];
    expect(within(card).getByText('Sale')).toBeInTheDocument();
    expect(within(card).getByText('LKR 3,600')).toBeInTheDocument();
    expect(within(card).getByText('LKR 4,500')).toBeInTheDocument();
  });
});
