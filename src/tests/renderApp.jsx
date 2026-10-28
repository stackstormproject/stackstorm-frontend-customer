import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AppProviders } from '../App';
import { routes as appRoutes } from '../routes';

/**
 * Renders the real route table inside the real providers at a URL.
 * API modules are mocked per test file with vi.mock.
 */
export function renderApp(url = '/', { routes = appRoutes } = {}) {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  const utils = render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
  return { ...utils, router };
}

export const apiError = (status, code, message) =>
  Object.assign(new Error(message), { status, code });
