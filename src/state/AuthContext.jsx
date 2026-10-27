import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { onAccessTokenChange } from '../lib/session';

const AuthContext = createContext(null);

/**
 * status: 'checking' while the refresh cookie is tried on load, then 'guest' or 'customer'.
 * The access token itself stays inside lib/session; components only see the customer.
 */
export function AuthProvider({ children, restore = authApi.restoreSession }) {
  const [customer, setCustomer] = useState(null);
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let active = true;
    restore()
      .then((restored) => {
        if (!active) return;
        setCustomer(restored);
        setStatus(restored ? 'customer' : 'guest');
      })
      .catch(() => active && setStatus('guest'));
    return () => {
      active = false;
    };
  }, [restore]);

  // If a refresh fails mid-session (expired or revoked), the shopper becomes a guest.
  useEffect(
    () =>
      onAccessTokenChange((token) => {
        if (!token) {
          setCustomer(null);
          setStatus((current) => (current === 'checking' ? current : 'guest'));
        }
      }),
    []
  );

  const signIn = useCallback(async (credentials) => {
    const signedIn = await authApi.login(credentials);
    setCustomer(signedIn);
    setStatus('customer');
    return signedIn;
  }, []);

  const signUp = useCallback(async (details) => {
    const created = await authApi.register(details);
    setCustomer(created);
    setStatus('customer');
    return created;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setCustomer(null);
      setStatus('guest');
    }
  }, []);

  const value = useMemo(
    () => ({
      customer,
      status,
      isSignedIn: status === 'customer',
      signIn,
      signUp,
      signOut,
      updateCustomer: setCustomer,
    }),
    [customer, status, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
};
