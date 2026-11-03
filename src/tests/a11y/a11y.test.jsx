import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { renderApp } from '../renderApp';
import * as authApi from '../../api/auth';
import * as cartApi from '../../api/cart';
import * as catalogApi from '../../api/catalog';
import * as wishlistApi from '../../api/wishlist';
import * as accountApi from '../../api/account';

vi.mock('../../api/auth');
vi.mock('../../api/cart');
vi.mock('../../api/wishlist');
vi.mock('../../api/catalog');
vi.mock('../../api/account');
vi.mock('../../components/chat/ChatWidget', () => ({ default: () => null }));

// NFR008: WCAG 2.1 AA. axe-core checks names, roles, labels, landmarks and ARIA usage.
// Colour contrast cannot be computed in jsdom; it is covered by the manual audit.
const AXE_OPTIONS = { rules: { 'color-contrast': { enabled: false } } };

const PRODUCT = {
  id: 7,
  name: 'Indigo Batik Shirt',
  slug: 'indigo-batik-shirt',
  price: '6200.00',
  primary_image: 'https://img/1.jpg',
  category: { name: 'Batik Shirts', slug: 'men-batik-shirts' },
  images: [{ imageUrl: 'https://img/1.jpg' }, { imageUrl: 'https://img/2.jpg' }],
  variants: [
    { id: 1, size: 'M', color: 'Indigo', available_stock: 3, additionalPrice: '0' },
    { id: 2, size: 'S', color: 'Indigo', available_stock: 0, additionalPrice: '0' },
  ],
};

const LINE = {
  id: 1,
  variant_id: 1,
  quantity: 1,
  unit_price: 6200,
  line_total: 6200,
  available_stock: 3,
  size: 'M',
  product: { name: 'Indigo Batik Shirt', slug: 'indigo-batik-shirt' },
};

beforeEach(() => {
  authApi.restoreSession.mockResolvedValue(null);
  cartApi.getCart.mockResolvedValue([LINE]);
  wishlistApi.getWishlist.mockResolvedValue([]);
  catalogApi.listCategories.mockResolvedValue([{ id: 1, name: 'Men', slug: 'men', children: [] }]);
  catalogApi.listProducts.mockResolvedValue({
    products: [PRODUCT],
    pagination: { total: 1, totalPages: 2 },
  });
  catalogApi.getProduct.mockResolvedValue(PRODUCT);
  catalogApi.listReviews.mockResolvedValue({
    stats: { review_count: 0 },
    reviews: [],
    pagination: {},
  });
  accountApi.listAddresses.mockResolvedValue([]);
});

describe('Accessibility (axe-core)', () => {
  it.each([
    ['home', '/', 'Handloom and batik from Dickwella'],
    ['catalog', '/shop', 'All products'],
    ['product', '/products/indigo-batik-shirt', 'Indigo Batik Shirt'],
    ['sign in', '/sign-in', 'Welcome back'],
    ['register', '/register', 'Create your account'],
    ['forgot password', '/forgot-password', 'Reset your password'],
    ['reset password', `/reset-password?token=${'a'.repeat(64)}`, 'Choose a new password'],
    ['checkout', '/checkout', 'Checkout'],
    ['help', '/help/returns', 'Returns and exchanges'],
    ['about', '/about', 'About Dickwella Fashion Corner'],
  ])('should have no violations on the %s page', async (_name, url, heading) => {
    const { container } = renderApp(url);
    await screen.findByRole('heading', { level: 1, name: heading });
    await screen.findAllByRole('navigation');

    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('should have no violations with the bag drawer open', async () => {
    const { container } = renderApp('/');
    await userEvent.click(await screen.findByRole('button', { name: /Shopping bag, 1 item/ }));
    await screen.findByRole('dialog', { name: /Your bag/ });
    await screen.findByRole('button', { name: /Remove/ });

    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('should have no violations on a form showing errors', async () => {
    const { container } = renderApp('/register');
    await userEvent.click(await screen.findByRole('button', { name: 'Create account' }));

    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });
});
