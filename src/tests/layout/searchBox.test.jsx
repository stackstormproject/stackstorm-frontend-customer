import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { SearchBox } from '../../components/layout/SearchBox';
import * as catalogApi from '../../api/catalog';

vi.mock('../../api/catalog');

const renderBox = (url = '/') => {
  const router = createMemoryRouter(
    [
      { path: '/', element: <SearchBox /> },
      { path: '/shop', element: <SearchBox /> },
      { path: '/shop/:slug', element: <div>category page</div> },
      { path: '/products/:slug', element: <div>product page</div> },
    ],
    { initialEntries: [url] }
  );
  render(<RouterProvider router={router} />);
  return { router };
};

const suggestion = (overrides = {}) => ({
  products: [],
  categories: [],
  brands: [],
  ...overrides,
});

describe('SearchBox (#191, FR001)', () => {
  it('should do nothing below the minimum character count', async () => {
    catalogApi.suggestProducts.mockResolvedValue(suggestion());
    renderBox();

    await userEvent.type(screen.getByRole('combobox', { name: 'Search products' }), 'b');

    await waitFor(() => expect(catalogApi.suggestProducts).not.toHaveBeenCalled());
  });

  it('should debounce and show matching products, categories and brands', async () => {
    catalogApi.suggestProducts.mockResolvedValue(
      suggestion({
        products: [
          {
            id: 1,
            slug: 'batik-shirt',
            name: 'Batik Shirt',
            price: '4500.00',
            primary_image: null,
          },
        ],
        categories: [{ name: 'Batik', slug: 'batik' }],
        brands: [{ name: 'Dickwella Atelier', slug: 'dickwella-atelier' }],
      })
    );
    renderBox();

    await userEvent.type(screen.getByRole('combobox', { name: 'Search products' }), 'batik');

    await waitFor(() =>
      expect(catalogApi.suggestProducts).toHaveBeenCalledWith('batik', expect.any(Object))
    );
    expect(await screen.findByRole('option', { name: /Batik Shirt/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Batik.*Category/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Dickwella Atelier.*Brand/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'See all results for "batik"' })).toBeInTheDocument();
  });

  it('should move through suggestions with the arrow keys and open the highlighted one on Enter', async () => {
    catalogApi.suggestProducts.mockResolvedValue(
      suggestion({
        products: [{ id: 1, slug: 'batik-shirt', name: 'Batik Shirt', price: '4500.00' }],
        categories: [{ name: 'Batik', slug: 'batik' }],
      })
    );
    const { router } = renderBox();
    const input = screen.getByRole('combobox', { name: 'Search products' });

    await userEvent.type(input, 'batik');
    await screen.findByRole('option', { name: /Batik Shirt/ });

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /Batik Shirt/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await userEvent.keyboard('{ArrowUp}');
    // wraps back to the last option ("See all results...")
    expect(screen.getByRole('option', { name: 'See all results for "batik"' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(router.state.location.pathname).toBe('/products/batik-shirt'));
  });

  it('should close the list on Escape', async () => {
    catalogApi.suggestProducts.mockResolvedValue(
      suggestion({ products: [{ id: 1, slug: 'x', name: 'X', price: '1.00' }] })
    );
    renderBox();
    const input = screen.getByRole('combobox', { name: 'Search products' });

    await userEvent.type(input, 'batik');
    await screen.findByRole('option', { name: /X/ });
    await userEvent.keyboard('{Escape}');

    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('should fall back to a full shop search when suggestions fail', async () => {
    catalogApi.suggestProducts.mockRejectedValue(new Error('down'));
    const { router } = renderBox();

    await userEvent.type(screen.getByRole('combobox', { name: 'Search products' }), 'batik{enter}');

    await waitFor(() => expect(router.state.location.pathname).toBe('/shop'));
    expect(router.state.location.search).toBe('?search=batik');
  });

  it('should search an empty query on submit', async () => {
    catalogApi.suggestProducts.mockResolvedValue(suggestion());
    const { router } = renderBox();

    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(router.state.location.pathname).toBe('/shop');
  });
});
