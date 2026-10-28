import { Layout } from './components/layout/Layout';
import HomePage from './pages/HomePage';
import HelpPage from './pages/HelpPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * URL map. Every page has a real address, so back/forward, refresh and shared links work.
 * Feature tickets add their routes here.
 */
export const routes = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'help/:topic', element: <HelpPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
