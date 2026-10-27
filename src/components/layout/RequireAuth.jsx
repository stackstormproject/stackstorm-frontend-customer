import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';
import { LoadingState } from '../ui/States';

/** Sends guests to sign in and brings them back to the page they asked for. */
export function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'checking') return <LoadingState label="Checking your session" />;
  if (status !== 'customer') {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/sign-in?next=${next}`} replace />;
  }
  return children;
}
