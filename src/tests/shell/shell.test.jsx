import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../renderApp';
import { routes } from '../../routes';
import { RequireAuth } from '../../components/layout/RequireAuth';
import { Layout } from '../../components/layout/Layout';
import { useResource } from '../../hooks/useResource';
import { ErrorState, EmptyState } from '../../components/ui/States';
import { FormField } from '../../components/ui/FormField';
import * as authApi from '../../api/auth';
import * as cartApi from '../../api/cart';
import * as catalogApi from '../../api/catalog';
import * as wishlistApi from '../../api/wishlist';

vi.mock('../../api/auth');
vi.mock('../../api/cart');
vi.mock('../../api/wishlist');
vi.mock('../../api/catalog');
vi.mock('../../components/chat/ChatWidget', () => ({ default: () => null }));

const CATEGORIES = [
  { id: 1, name: 'Men', slug: 'men', parentId: null },
  { id: 11, name: 'Batik Shirts', slug: 'men-batik-shirts', parentId: 1 },
  { id: 2, name: 'Women', slug: 'women', parentId: null },
];

describe('App shell', () => {
  beforeEach(() => {
    authApi.restoreSession.mockRejectedValue(new Error('no session'));
    cartApi.getCart.mockResolvedValue([
      { id: 1, quantity: 2, line_total: 100, available_stock: 9 },
    ]);
    wishlistApi.getWishlist.mockResolvedValue([]);
    catalogApi.listCategories.mockResolvedValue(CATEGORIES);
    catalogApi.listProducts.mockResolvedValue({ products: [], pagination: { total: 0 } });
  });

  it('should render the home page with top-level categories only', async () => {
    renderApp('/');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Handloom and batik/);
    const nav = await screen.findByRole('navigation', { name: 'Shop by category' });
    await waitFor(() => expect(nav).toHaveTextContent('Men'));
    expect(nav).not.toHaveTextContent('Batik Shirts');
    // #187: a Home link on every page.
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    // #183: no "New in" link and no stripe between the header and the banner.
    expect(nav).not.toHaveTextContent('New in');
    expect(nav.closest('header').querySelector('.warp-stripe')).toBeNull();
  });

  it('should show the server cart count on the bag button', async () => {
    renderApp('/');

    expect(
      await screen.findByRole('button', { name: 'Shopping bag, 2 items' })
    ).toBeInTheDocument();
  });

  it('should send a search to the shop URL', async () => {
    const { router } = renderApp('/');

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Search products' }),
      'batik{enter}'
    );

    expect(router.state.location.pathname).toBe('/shop');
    expect(router.state.location.search).toBe('?search=batik');
  });

  it('should send an empty search to the shop', async () => {
    const { router } = renderApp('/');

    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(router.state.location.pathname).toBe('/shop');
  });

  it('should show Sign in for guests and the first name for customers', async () => {
    authApi.restoreSession.mockResolvedValue({ id: 4, name: 'Nimal Perera' });
    renderApp('/');

    expect(await screen.findByRole('link', { name: 'Nimal' })).toHaveAttribute('href', '/account');
  });

  it('should render help topics from the business rules', () => {
    renderApp('/help/returns');

    expect(screen.getByRole('heading', { name: 'Returns and exchanges' })).toBeInTheDocument();
    expect(screen.getByText(/within 30 days of delivery/)).toBeInTheDocument();
  });

  it('should show not found for unknown help topics and unknown URLs', () => {
    renderApp('/help/nonsense');
    expect(screen.getByRole('heading', { name: 'This page does not exist' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/');
  });

  it('should show not found for an unknown URL', () => {
    renderApp('/no/such/page');
    expect(screen.getByRole('link', { name: 'Browse the shop' })).toHaveAttribute('href', '/shop');
  });

  it('should provide a skip link to the main content', () => {
    renderApp('/');
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  });
});

describe('RequireAuth', () => {
  const guarded = [
    {
      element: <Layout />,
      children: [
        {
          path: 'account',
          element: (
            <RequireAuth>
              <p>Secret account</p>
            </RequireAuth>
          ),
        },
        { path: 'sign-in', element: <p>Sign in page</p> },
      ],
    },
  ];

  beforeEach(() => {
    cartApi.getCart.mockResolvedValue([]);
    wishlistApi.getWishlist.mockResolvedValue([]);
    catalogApi.listCategories.mockResolvedValue([]);
  });

  it('should redirect guests to sign in with a return address', async () => {
    authApi.restoreSession.mockRejectedValue(new Error('x'));
    const { router } = renderApp('/account?tab=1', { routes: guarded });

    await screen.findByText('Sign in page');
    expect(router.state.location.search).toBe(`?next=${encodeURIComponent('/account?tab=1')}`);
  });

  it('should show the page to customers', async () => {
    authApi.restoreSession.mockResolvedValue({ id: 1 });
    renderApp('/account', { routes: guarded });

    expect(await screen.findByText('Secret account')).toBeInTheDocument();
  });

  it('should wait while the session is checked', () => {
    authApi.restoreSession.mockReturnValue(new Promise(() => {}));
    renderApp('/account', { routes: guarded });

    expect(screen.getByRole('status')).toHaveTextContent('Checking your session');
  });
});

describe('useResource', () => {
  it('should ignore a response that arrives after the inputs changed', async () => {
    let resolveFirst;
    const first = new Promise((r) => {
      resolveFirst = r;
    });
    const loader = vi.fn((key) => (key === 'a' ? first : Promise.resolve('b-data')));
    const { result, rerender } = renderHook(({ k }) => useResource(() => loader(k), [k]), {
      initialProps: { k: 'a' },
    });

    rerender({ k: 'b' });
    await waitFor(() => expect(result.current.data).toBe('b-data'));
    await act(async () => resolveFirst('a-data'));

    expect(result.current.data).toBe('b-data');
  });

  it('should report a loader that throws synchronously', async () => {
    const { result } = renderHook(() =>
      useResource(() => {
        throw new Error('sync');
      }, [])
    );

    await waitFor(() => expect(result.current.error?.message).toBe('sync'));
  });

  it('should expose errors, reload and local updates', async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue([1]);
    const { result } = renderHook(() => useResource(loader, []));

    await waitFor(() => expect(result.current.error?.message).toBe('down'));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.data).toEqual([1]));
    act(() => result.current.setData((d) => [...d, 2]));
    expect(result.current.data).toEqual([1, 2]);
    act(() => result.current.setData([9]));
    expect(result.current.data).toEqual([9]);
  });

  describe('with refreshEvery (#183)', () => {
    afterEach(() => {
      vi.useRealTimers();
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    });
    const flush = () => act(async () => {});

    it('should fetch again in the background without showing the loading state', async () => {
      vi.useFakeTimers();
      const loader = vi
        .fn()
        .mockResolvedValueOnce('placed')
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValue('shipped');
      const { result } = renderHook(() => useResource(loader, [], { refreshEvery: 1000 }));
      await flush();
      expect(result.current.data).toBe('placed');

      await act(async () => vi.advanceTimersByTime(1000));
      expect(result.current).toMatchObject({ data: 'placed', error: null, loading: false });
      await act(async () => vi.advanceTimersByTime(1000));
      expect(result.current.data).toBe('shipped');
      expect(loader).toHaveBeenCalledTimes(3);
    });

    it('should wait while the tab is hidden and refresh when the shopper comes back', async () => {
      vi.useFakeTimers();
      const loader = vi.fn().mockResolvedValueOnce('placed').mockResolvedValue('delivered');
      const { result, unmount } = renderHook(() => useResource(loader, [], { refreshEvery: 1000 }));
      await flush();

      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      await act(async () => vi.advanceTimersByTime(5000));
      expect(loader).toHaveBeenCalledTimes(1);

      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      await act(async () => document.dispatchEvent(new Event('visibilitychange')));
      expect(result.current.data).toBe('delivered');

      unmount();
      await act(async () => vi.advanceTimersByTime(5000));
      expect(loader).toHaveBeenCalledTimes(2);
    });

    it('should drop a background answer that a full reload overtook', async () => {
      vi.useFakeTimers();
      let resolveSlow;
      const loader = vi
        .fn()
        .mockResolvedValueOnce('first')
        .mockReturnValueOnce(
          new Promise((r) => {
            resolveSlow = r;
          })
        )
        .mockResolvedValue('reloaded');
      const { result } = renderHook(() => useResource(loader, [], { refreshEvery: 1000 }));
      await flush();

      await act(async () => vi.advanceTimersByTime(1000));
      act(() => result.current.reload());
      await flush();
      await act(async () => resolveSlow('stale'));
      expect(result.current.data).toBe('reloaded');
    });
  });
});

describe('UI states and fields', () => {
  it('should offer a retry on errors', async () => {
    const retry = vi.fn();
    render(<ErrorState error={new Error('Server down')} onRetry={retry} />);

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(retry).toHaveBeenCalled();
  });

  it('should render empty states and fallback error text', () => {
    render(
      <>
        <EmptyState title="Nothing here" />
        <ErrorState />
      </>
    );

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Please try again.')).toBeInTheDocument();
  });

  it('should link errors and hints to the control', () => {
    render(<FormField label="Postal code" hint="5 digits" error="Too short" />);

    const input = screen.getByLabelText('Postal code');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('5 digits Too short');
  });

  it('should keep the route table exported for the browser router', () => {
    expect(routes[0].children.some((r) => r.index)).toBe(true);
  });
});

describe('App', () => {
  it('should mount the router inside the providers', async () => {
    const { default: App } = await import('../../App');
    const { createMemoryRouter } = await import('react-router-dom');
    authApi.restoreSession.mockRejectedValue(new Error('guest'));
    cartApi.getCart.mockResolvedValue([]);
    catalogApi.listCategories.mockResolvedValue([]);
    const router = createMemoryRouter([{ path: '/', element: <p>Mounted</p> }]);

    render(<App router={router} />);

    expect(screen.getByText('Mounted')).toBeInTheDocument();
  });
});
