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
vi.mock('../../api/catalog', async (importOriginal) => ({
  ...(await importOriginal()),
  getProduct: vi.fn(),
  listCategories: vi.fn(),
  listReviews: vi.fn(),
  createReview: vi.fn(),
}));
vi.mock('../../components/chat/ChatWidget', () => ({ default: () => null }));

const variant = (id, size, available, extra = {}) => ({
  id,
  size,
  color: 'Indigo',
  available_stock: available,
  additionalPrice: '0.00',
  ...extra,
});

const PRODUCT = {
  id: 7,
  name: 'Indigo Batik Shirt',
  slug: 'indigo-batik-shirt',
  price: '6200.00',
  brand: 'Dickwella Atelier',
  description: 'Hand-dyed cotton.',
  material: 'Cotton',
  care_instructions: 'Hand wash cold',
  is_final_sale: false,
  category: { id: 11, name: 'Batik Shirts', slug: 'men-batik-shirts' },
  images: [{ imageUrl: 'https://img/1.jpg' }, { imageUrl: 'https://img/2.jpg' }],
  variants: [
    variant(1, 'M', 12),
    variant(2, 'S', 0),
    variant(3, 'XL', 2, { additionalPrice: '250.00' }),
  ],
};

const NO_REVIEWS = { stats: { average_rating: 5, review_count: 0 }, reviews: [], pagination: {} };

describe('Product page (FR003, FR004)', () => {
  beforeEach(() => {
    authApi.restoreSession.mockRejectedValue(new Error('guest'));
    cartApi.getCart.mockResolvedValue([]);
    wishlistApi.getWishlist.mockResolvedValue([]);
    catalogApi.listCategories.mockResolvedValue([]);
    catalogApi.getProduct.mockResolvedValue(PRODUCT);
    catalogApi.listReviews.mockResolvedValue(NO_REVIEWS);
  });

  it('should show the product, details, breadcrumb and gallery', async () => {
    renderApp('/products/indigo-batik-shirt');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Indigo Batik Shirt' })
    ).toBeInTheDocument();
    expect(catalogApi.getProduct).toHaveBeenCalledWith('indigo-batik-shirt');
    expect(screen.getByRole('link', { name: 'Batik Shirts' })).toHaveAttribute(
      'href',
      '/shop/men-batik-shirts'
    );
    expect(screen.getByText('Hand wash cold')).toBeInTheDocument();
    expect(document.title).toBe('Indigo Batik Shirt | Dickwella Fashion Corner');

    await userEvent.click(screen.getByRole('button', { name: 'Show image 2 of 2' }));
    expect(screen.getByRole('img', { name: 'Indigo Batik Shirt' })).toHaveAttribute(
      'src',
      'https://img/2.jpg'
    );
  });

  it('should list sizes in order and disable sold-out sizes', async () => {
    renderApp('/products/indigo-batik-shirt');

    const sizes = within(await screen.findByRole('group', { name: 'Size' })).getAllByRole('button');
    expect(sizes.map((b) => b.textContent)).toEqual(['S', 'M', 'XL+250']);
    expect(screen.getByRole('button', { name: 'S, sold out' })).toBeDisabled();
  });

  it('should show the selected size price and stock and cap the quantity', async () => {
    renderApp('/products/indigo-batik-shirt');

    await userEvent.click(await screen.findByRole('button', { name: 'XL' }));

    expect(screen.getByText('LKR 6,450')).toBeInTheDocument();
    expect(screen.getByText('Only 2 left')).toBeInTheDocument();
    const increase = screen.getByRole('button', { name: 'Increase quantity' });
    await userEvent.click(increase);
    expect(increase).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled();
  });

  it('should ask for a size before adding to the bag', async () => {
    renderApp('/products/indigo-batik-shirt');

    await userEvent.click(await screen.findByRole('button', { name: 'Add to bag' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a size first.');
    expect(cartApi.addCartItem).not.toHaveBeenCalled();
  });

  it('should add the chosen variant and quantity to the server cart', async () => {
    cartApi.addCartItem.mockResolvedValue({});
    renderApp('/products/indigo-batik-shirt');

    await userEvent.click(await screen.findByRole('button', { name: 'M' }));
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add to bag' }));

    expect(cartApi.addCartItem).toHaveBeenCalledWith(1, 2);
    expect(await screen.findByText('Added Indigo Batik Shirt (M) to your bag')).toBeInTheDocument();
  });

  it('should explain a stock conflict from the server', async () => {
    cartApi.addCartItem.mockRejectedValue(
      Object.assign(new Error('INSUFFICIENT_STOCK'), { status: 409 })
    );
    renderApp('/products/indigo-batik-shirt');

    await userEvent.click(await screen.findByRole('button', { name: 'XL' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add to bag' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Only 2 left in XL');
  });

  it('should show other add-to-bag errors as given', async () => {
    cartApi.addCartItem.mockRejectedValue(new Error('Cannot reach the shop right now.'));
    renderApp('/products/indigo-batik-shirt');

    await userEvent.click(await screen.findByRole('button', { name: 'M' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add to bag' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the shop right now.');
  });

  it('should preselect the only size and switch colours', async () => {
    catalogApi.getProduct.mockResolvedValue({
      ...PRODUCT,
      images: [],
      primary_image: 'https://img/p.jpg',
      variants: [
        variant(1, 'Free Size', 0, { color: 'Red' }),
        variant(2, 'Free Size', 4, { color: 'Blue' }),
      ],
    });
    renderApp('/products/indigo-batik-shirt');

    expect(await screen.findByRole('button', { name: 'Blue' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByText('Only 4 left')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Red' }));
    expect(screen.getByRole('button', { name: 'Free Size, sold out' })).toBeDisabled();
  });

  it('should say when every size is sold out and flag final sale', async () => {
    catalogApi.getProduct.mockResolvedValue({
      ...PRODUCT,
      is_final_sale: true,
      variants: [variant(1, 'M', 0)],
    });
    renderApp('/products/indigo-batik-shirt');

    expect(await screen.findByText('Sold out in every size.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add to bag' })).not.toBeInTheDocument();
    expect(screen.getByText(/cannot be returned/)).toBeInTheDocument();
  });

  it('should show not found for an unknown product', async () => {
    catalogApi.getProduct.mockRejectedValue(Object.assign(new Error('Not found'), { status: 404 }));
    renderApp('/products/nope');

    expect(
      await screen.findByRole('heading', { name: 'This page does not exist' })
    ).toBeInTheDocument();
  });

  it('should offer a retry for other errors', async () => {
    catalogApi.getProduct.mockRejectedValueOnce(new Error('down')).mockResolvedValue(PRODUCT);
    renderApp('/products/indigo-batik-shirt');

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Indigo Batik Shirt'
    );
  });
});

describe('Reviews (FR008)', () => {
  beforeEach(() => {
    cartApi.getCart.mockResolvedValue([]);
    cartApi.mergeGuestCart.mockResolvedValue({});
    wishlistApi.getWishlist.mockResolvedValue([]);
    catalogApi.listCategories.mockResolvedValue([]);
    catalogApi.getProduct.mockResolvedValue(PRODUCT);
  });

  it('should not show a fake average when there are no reviews', async () => {
    authApi.restoreSession.mockRejectedValue(new Error('guest'));
    catalogApi.listReviews.mockResolvedValue(NO_REVIEWS);
    renderApp('/products/indigo-batik-shirt');

    expect(await screen.findByText('No reviews yet.')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /out of 5 stars/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in to review' })).toHaveAttribute(
      'href',
      `/sign-in?next=${encodeURIComponent('/products/indigo-batik-shirt')}`
    );
  });

  it('should list reviews with the average and verified badge, and page through them', async () => {
    authApi.restoreSession.mockRejectedValue(new Error('guest'));
    catalogApi.listReviews.mockResolvedValue({
      stats: { average_rating: 4.5, review_count: 12 },
      reviews: [
        {
          id: 1,
          rating: 5,
          comment: 'Beautiful dye',
          customer_name: 'Ama',
          is_verified_buyer: true,
          created_at: '2026-10-01',
        },
      ],
      pagination: { total_pages: 2 },
    });
    renderApp('/products/indigo-batik-shirt');

    expect(await screen.findByText('Beautiful dye')).toBeInTheDocument();
    expect(screen.getByText('4.5 from 12 reviews')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '4.5 out of 5 stars' })).toBeInTheDocument();
    expect(screen.getByText('Verified purchase')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(catalogApi.listReviews).toHaveBeenLastCalledWith(7, 2));
  });

  const openForm = async () => {
    authApi.restoreSession.mockResolvedValue({ id: 4 });
    catalogApi.listReviews.mockResolvedValue({
      stats: { average_rating: 4, review_count: 1 },
      reviews: [
        { id: 1, rating: 4, comment: null, customer_name: 'Ama', created_at: '2026-10-01' },
      ],
      pagination: {},
    });
    renderApp('/products/indigo-batik-shirt');
    await userEvent.click(await screen.findByRole('button', { name: 'Write a review' }));
  };

  it('should require a rating', async () => {
    await openForm();

    await userEvent.click(screen.getByRole('button', { name: 'Publish review' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a star rating.');
  });

  it('should publish a review and reload the list', async () => {
    catalogApi.createReview.mockResolvedValue({ id: 2 });
    await openForm();

    await userEvent.click(screen.getByRole('radio', { name: '5 stars' }));
    await userEvent.type(screen.getByLabelText('Your review (optional)'), '  Lovely fit ');
    await userEvent.click(screen.getByRole('button', { name: 'Publish review' }));

    expect(catalogApi.createReview).toHaveBeenCalledWith(7, { rating: 5, comment: 'Lovely fit' });
    expect(await screen.findByText('Thanks, your review is published')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish review' })).not.toBeInTheDocument();
  });

  it.each([
    [403, 'Only customers who bought this item can review it.'],
    [409, 'You have already reviewed this item.'],
    [500, 'Server exploded'],
  ])('should explain a %i from the server', async (status, message) => {
    catalogApi.createReview.mockRejectedValue(
      Object.assign(new Error('Server exploded'), { status })
    );
    await openForm();

    await userEvent.click(screen.getByRole('radio', { name: '3 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Publish review' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it('should retry loading reviews after an error', async () => {
    authApi.restoreSession.mockRejectedValue(new Error('guest'));
    catalogApi.listReviews.mockRejectedValueOnce(new Error('down')).mockResolvedValue(NO_REVIEWS);
    renderApp('/products/indigo-batik-shirt');

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('No reviews yet.')).toBeInTheDocument();
  });
});
