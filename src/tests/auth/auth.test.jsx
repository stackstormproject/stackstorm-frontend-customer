import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../renderApp';
import { describeAuthError, safeNext } from '../../lib/authErrors';
import * as authApi from '../../api/auth';
import * as cartApi from '../../api/cart';
import * as catalogApi from '../../api/catalog';
import * as wishlistApi from '../../api/wishlist';

vi.mock('../../api/auth');
vi.mock('../../api/cart');
vi.mock('../../api/wishlist');
vi.mock('../../api/catalog');
vi.mock('../../components/chat/ChatWidget', () => ({ default: () => null }));

const apiError = (code, status, details) =>
  Object.assign(new Error('Server says no'), { code, status, details });

describe('describeAuthError', () => {
  it.each([
    ['INVALID_CREDENTIALS', 401, /do not match/],
    ['ACCOUNT_LOCKED', 423, /locked for 15 minutes/],
    ['RATE_LIMITED', 429, /Too many attempts/],
    ['WHATEVER', 500, /Server says no/],
  ])('should explain %s', (code, status, message) => {
    expect(describeAuthError(apiError(code, status)).form).toMatch(message);
  });

  it('should map a duplicate email to the email field', () => {
    expect(describeAuthError(apiError('DUPLICATE_ENTRY', 409))).toEqual({
      form: null,
      fields: { email: 'An account with this email already exists.' },
    });
  });

  it('should map server validation details to fields, first message wins', () => {
    const result = describeAuthError(
      apiError('VALIDATION_ERROR', 400, [
        { field: 'password', message: 'Password needs a digit' },
        { field: 'password', message: 'second' },
      ])
    );

    expect(result).toEqual({ form: null, fields: { password: 'Password needs a digit' } });
    expect(describeAuthError(apiError('VALIDATION_ERROR', 400)).form).toBe('Server says no');
    expect(describeAuthError(undefined).form).toMatch(/Something went wrong/);
  });

  it('should only allow same-site return paths', () => {
    expect(safeNext('/checkout')).toBe('/checkout');
    expect(safeNext('//evil.example')).toBe('/account');
    expect(safeNext('https://evil.example')).toBe('/account');
    expect(safeNext(null)).toBe('/account');
  });
});

describe('Sign in and register pages (FR035)', () => {
  beforeEach(() => {
    authApi.restoreSession.mockResolvedValue(null);
    cartApi.getCart.mockResolvedValue([]);
    cartApi.mergeGuestCart.mockResolvedValue({});
    wishlistApi.getWishlist.mockResolvedValue([]);
    catalogApi.listCategories.mockResolvedValue([]);
  });

  it('should validate before calling the API', async () => {
    renderApp('/sign-in');

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Enter a valid email address.'
    );
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('should sign in, merge the guest cart and return to the next page', async () => {
    authApi.login.mockResolvedValue({ id: 4, name: 'Nimal Perera' });
    const { router } = renderApp('/sign-in?next=%2Fcheckout');

    await userEvent.type(screen.getByLabelText('Email'), ' nimal@example.lk ');
    await userEvent.type(screen.getByLabelText('Password'), 'Shopper123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(authApi.login).toHaveBeenCalledWith({
      email: 'nimal@example.lk',
      password: 'Shopper123',
    });
    expect(await screen.findByText('Welcome back, Nimal')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/checkout');
    expect(cartApi.mergeGuestCart).toHaveBeenCalled();
  });

  it('should show a lockout message from the server', async () => {
    authApi.login.mockRejectedValue(apiError('ACCOUNT_LOCKED', 423));
    renderApp('/sign-in');

    await userEvent.type(screen.getByLabelText('Email'), 'a@b.lk');
    await userEvent.type(screen.getByLabelText('Password'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/locked for 15 minutes/);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  it('should show and hide the password', async () => {
    renderApp('/sign-in');

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('should send a signed-in customer straight on', async () => {
    authApi.restoreSession.mockResolvedValue({ id: 4 });
    const { router } = renderApp('/sign-in');

    await screen.findByRole('link', { name: 'Account' });
    expect(router.state.location.pathname).toBe('/account');
  });

  it('should list every unmet password rule on register', async () => {
    renderApp('/register');

    await userEvent.type(screen.getByLabelText('Full name'), 'Nimal');
    await userEvent.type(screen.getByLabelText('Email'), 'nimal@example.lk');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
      expect.stringContaining('Password needs 8-72 characters, an uppercase letter, a number.')
    );
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('should register and continue', async () => {
    authApi.register.mockResolvedValue({ id: 5, name: 'Nimal' });
    const { router } = renderApp('/register?next=%2Fshop');

    await userEvent.type(screen.getByLabelText('Full name'), ' Nimal Perera ');
    await userEvent.type(screen.getByLabelText('Email'), 'nimal@example.lk');
    await userEvent.type(screen.getByLabelText('Password'), 'Shopper123');
    await userEvent.type(screen.getByLabelText('Mobile number (optional)'), '+94 77 123 4567');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Nimal Perera',
      email: 'nimal@example.lk',
      password: 'Shopper123',
      phone: '+94 77 123 4567',
    });
    expect(await screen.findByText(/Silver loyalty tier/)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/shop');
  });

  it('should put a duplicate email error on the email field', async () => {
    authApi.register.mockRejectedValue(apiError('DUPLICATE_ENTRY', 409));
    renderApp('/register');

    await userEvent.type(screen.getByLabelText('Full name'), 'Nimal');
    await userEvent.type(screen.getByLabelText('Email'), 'taken@example.lk');
    await userEvent.type(screen.getByLabelText('Password'), 'Shopper123');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByText('An account with this email already exists.')
    ).toBeInTheDocument();
  });

  it('should link between sign in and register keeping the destination', () => {
    renderApp('/sign-in?next=%2Fcheckout');

    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/register?next=%2Fcheckout'
    );
  });

  it('should keep the destination when linking back to sign in', () => {
    renderApp('/register?next=%2Fcheckout');

    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in?next=%2Fcheckout'
    );
  });
});
