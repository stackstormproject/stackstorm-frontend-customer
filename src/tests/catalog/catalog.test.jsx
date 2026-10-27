import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../renderApp';
import {
  filtersFromUrl,
  withParam,
  activeFilterCount,
  sortSizes,
  flattenCategories,
} from '../../lib/catalogQuery';
import * as authApi from '../../api/auth';
import * as cartApi from '../../api/cart';
import * as catalogApi from '../../api/catalog';
import * as wishlistApi from '../../api/wishlist';

vi.mock('../../api/auth');
vi.mock('../../api/cart');
vi.mock('../../api/wishlist');
vi.mock('../../api/catalog', async (importOriginal) => ({
  ...(await importOriginal()),
  listProducts: vi.fn(),
  listCategories: vi.fn(),
}));
vi.mock('../../components/chat/ChatWidget', () => ({ default: () => null }));

const TREE = [
  {
    id: 1,
    name: 'Men',
    slug: 'men',
    parentId: null,
    children: [
      { id: 11, name: 'Batik Shirts', slug: 'men-batik-shirts', parentId: 1, children: [] },
    ],
  },
  { id: 2, name: 'Women', slug: 'women', parentId: null, children: [] },
];

const product = (id, overrides = {}) => ({
  id,
  name: `Batik Shirt ${id}`,
  slug: `batik-shirt-${id}`,
  price: '4500.00',
  primary_image: `https://img/${id}.jpg`,
  variants: [
    { id: id * 10, size: 'M', available_stock: 3 },
    { id: id * 10 + 1, size: 'S', available_stock: 0 },
  ],
  ...overrides,
});

const page = (products, pagination = {}) => ({
  products,
  pagination: { total: products.length, page: 1, totalPages: 1, ...pagination },
});

describe('catalogQuery', () => {
  it('should read filters from the URL with a safe page number', () => {
    const params = new URLSearchParams('size=M&price=3000-6000&page=-2&search=batik');

    expect(filtersFromUrl('men', params)).toEqual({
      category: 'men',
      search: 'batik',
      size: 'M',
      minPrice: 3000,
      maxPrice: 6000,
      sort: 'newest',
      page: 1,
    });
  });

  it('should reset to page 1 when a filter changes and drop empty or default values', () => {
    const base = new URLSearchParams('page=3&size=M');

    expect(withParam(base, 'size', 'L').toString()).toBe('size=L');
    expect(withParam(base, 'size', '').toString()).toBe('');
    expect(withParam(base, 'page', 4).toString()).toBe('page=4&size=M');
    expect(withParam(new URLSearchParams('sort=price_asc'), 'sort', 'newest').toString()).toBe('');
  });

  it('should count active filters', () => {
    expect(activeFilterCount(new URLSearchParams('size=M&price=x&sort=price_asc'))).toBe(2);
  });

  it('should order sizes as worn and remove duplicates', () => {
    expect(sortSizes(['XL', 'S', 'Custom', 'M', 'S', null])).toEqual(['S', 'M', 'XL', 'Custom']);
  });

  it('should flatten the category tree', () => {
    expect(flattenCategories(TREE).map((c) => c.slug)).toEqual([
      'men',
      'men-batik-shirts',
      'women',
    ]);
    expect(flattenCategories()).toEqual([]);
  });
});

describe('Catalog page (FR001, FR002, FR003)', () => {
  beforeEach(() => {
    authApi.restoreSession.mockRejectedValue(new Error('guest'));
    cartApi.getCart.mockResolvedValue([]);
    wishlistApi.getWishlist.mockResolvedValue([]);
    catalogApi.listCategories.mockResolvedValue(TREE);
  });

  it('should list products with price, stock label and ordered sizes', async () => {
    catalogApi.listProducts.mockResolvedValue(page([product(1), product(2, { variants: [] })]));
    renderApp('/shop');

    const cards = await screen.findAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText('LKR 4,500')).toBeInTheDocument();
    expect(within(cards[0]).getByText('Only 3 left')).toBeInTheDocument();
    expect(within(cards[0]).getByText('S, M')).toBeInTheDocument();
    expect(within(cards[1]).getByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 products');
  });

  it('should load the category from the path and show its sub-categories', async () => {
    catalogApi.listProducts.mockResolvedValue(page([product(1)]));
    renderApp('/shop/men-batik-shirts');

    expect(
      await screen.findByRole('heading', { name: 'Batik Shirts', level: 1 })
    ).toBeInTheDocument();
    expect(catalogApi.listProducts).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'men-batik-shirts' })
    );
    expect(screen.getByRole('link', { name: 'All men' })).toHaveAttribute('href', '/shop/men');
    expect(screen.getByRole('link', { name: 'Batik Shirts' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('should write size, price and sort to the URL and refetch', async () => {
    catalogApi.listProducts.mockResolvedValue(page([product(1)]));
    const { router } = renderApp('/shop?page=2');
    await screen.findAllByRole('article');

    await userEvent.click(screen.getByRole('button', { name: 'M' }));
    await userEvent.click(screen.getByRole('radio', { name: 'LKR 3,000 to 6,000' }));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'price_desc');

    expect(router.state.location.search).toBe('?size=M&price=3000-6000&sort=price_desc');
    await waitFor(() =>
      expect(catalogApi.listProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          size: 'M',
          minPrice: 3000,
          maxPrice: 6000,
          sort: 'price_desc',
          page: 1,
        })
      )
    );
    expect(screen.getByRole('button', { name: 'M' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'M' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Any price' }));
    expect(router.state.location.search).toBe('?sort=price_desc');
  });

  it('should show search results with a title', async () => {
    catalogApi.listProducts.mockResolvedValue(page([product(1)]));
    renderApp('/shop?search=batik');

    expect(await screen.findByRole('heading', { name: 'Results for "batik"' })).toBeInTheDocument();
  });

  it('should page through results', async () => {
    catalogApi.listProducts.mockResolvedValue(page([product(1)], { total: 30, totalPages: 3 }));
    const { router } = renderApp('/shop');
    await screen.findAllByRole('article');

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(router.state.location.search).toBe('?page=2');
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(router.state.location.search).toBe('?page=1');
  });

  it('should offer to clear filters when nothing matches', async () => {
    catalogApi.listProducts.mockResolvedValue(page([]));
    const { router } = renderApp('/shop?size=XL');

    await screen.findByRole('heading', { name: 'No products match' });
    await userEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[1]);

    expect(router.state.location.search).toBe('');
  });

  it('should link to all products when an unfiltered category is empty', async () => {
    catalogApi.listProducts.mockResolvedValue(page([]));
    renderApp('/shop/women');

    expect(await screen.findByRole('link', { name: 'See all products' })).toHaveAttribute(
      'href',
      '/shop'
    );
  });

  it('should show an error with retry when the API fails', async () => {
    catalogApi.listProducts.mockRejectedValueOnce(new Error('Cannot reach the shop right now.'));
    catalogApi.listProducts.mockResolvedValue(page([product(1)]));
    renderApp('/shop');

    await screen.findByText('Cannot reach the shop right now.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findAllByRole('article')).toHaveLength(1);
  });

  it('should swap a broken product image for a placeholder', async () => {
    catalogApi.listProducts.mockResolvedValue(page([product(1)]));
    const { container } = renderApp('/shop');
    await screen.findAllByRole('article');

    const img = container.querySelector('.product-card__media img');
    fireEvent.error(img);

    expect(img.getAttribute('src')).toMatch(/^data:image\/svg/);
  });
});

describe('Home page', () => {
  beforeEach(() => {
    authApi.restoreSession.mockRejectedValue(new Error('guest'));
    cartApi.getCart.mockResolvedValue([]);
    wishlistApi.getWishlist.mockResolvedValue([]);
    catalogApi.listCategories.mockResolvedValue(TREE);
  });

  it('should feature the four newest products', async () => {
    catalogApi.listProducts.mockResolvedValue(page([1, 2, 3, 4, 5].map((id) => product(id))));
    renderApp('/');

    expect(await screen.findAllByRole('article')).toHaveLength(4);
    expect(catalogApi.listProducts).toHaveBeenCalledWith({ sort: 'newest' });
  });

  it('should show a retry when new arrivals fail to load', async () => {
    catalogApi.listProducts.mockRejectedValue(new Error('down'));
    renderApp('/');

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('WishlistButton', () => {
  beforeEach(() => {
    cartApi.getCart.mockResolvedValue([]);
    cartApi.mergeGuestCart.mockResolvedValue({});
    catalogApi.listCategories.mockResolvedValue(TREE);
    catalogApi.listProducts.mockResolvedValue(page([product(1)]));
  });

  it('should send guests to sign in and come back', async () => {
    authApi.restoreSession.mockRejectedValue(new Error('guest'));
    wishlistApi.getWishlist.mockResolvedValue([]);
    const { router } = renderApp('/shop?size=M');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Save Batik Shirt 1 to wishlist' })
    );

    expect(router.state.location.pathname).toBe('/sign-in');
    expect(router.state.location.search).toBe(`?next=${encodeURIComponent('/shop?size=M')}`);
  });

  it('should save and unsave for a customer', async () => {
    authApi.restoreSession.mockResolvedValue({ id: 4 });
    wishlistApi.getWishlist.mockResolvedValueOnce([]).mockResolvedValue([{ id: 1 }]);
    wishlistApi.toggleWishlist.mockResolvedValue({ wishlisted: true });
    renderApp('/shop');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Save Batik Shirt 1 to wishlist' })
    );

    expect(await screen.findByText('Saved Batik Shirt 1')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove Batik Shirt 1 from wishlist' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('should report a removal and errors', async () => {
    authApi.restoreSession.mockResolvedValue({ id: 4 });
    wishlistApi.getWishlist.mockResolvedValue([{ id: 1 }]);
    wishlistApi.toggleWishlist
      .mockResolvedValueOnce({ wishlisted: false })
      .mockRejectedValueOnce(new Error('Product 1 not found'));
    renderApp('/shop');
    const button = await screen.findByRole('button', {
      name: 'Remove Batik Shirt 1 from wishlist',
    });

    await userEvent.click(button);
    expect(await screen.findByText('Removed Batik Shirt 1 from your wishlist')).toBeInTheDocument();
    await userEvent.click(button);
    expect(await screen.findByText('Product 1 not found')).toBeInTheDocument();
  });
});
