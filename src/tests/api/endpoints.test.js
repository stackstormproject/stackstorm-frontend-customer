import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { http } from '../../lib/http';
import {
  setAccessToken,
  clearAccessToken,
  getAccessToken,
  rememberGuestOrder,
} from '../../lib/session';
import * as catalog from '../../api/catalog';
import * as auth from '../../api/auth';
import * as cart from '../../api/cart';
import * as checkout from '../../api/checkout';
import * as orders from '../../api/orders';
import * as account from '../../api/account';
import * as returns from '../../api/returns';
import * as wishlist from '../../api/wishlist';

// Contract tests: each call must hit the route, verb and body the backend actually serves.
describe('API contract', () => {
  let api;
  let raw;
  const ok = (data) => [200, { success: true, data }];

  beforeEach(() => {
    api = new MockAdapter(http);
    raw = new MockAdapter(axios);
    clearAccessToken();
    localStorage.clear();
  });

  afterEach(() => {
    api.restore();
    raw.restore();
  });

  const lastRequest = (verb) => api.history[verb].at(-1);

  describe('catalog', () => {
    it('should send only real filters with snake_case price keys', async () => {
      api.onGet('/products').reply(...ok({ products: [] }));

      await catalog.listProducts({
        category: 'men',
        minPrice: 1000,
        search: '',
        sort: 'price_asc',
      });

      expect(lastRequest('get').params).toEqual({
        category: 'men',
        min_price: 1000,
        sort: 'price_asc',
        page: 1,
        limit: catalog.PAGE_SIZE,
      });
    });

    it('should fetch a product by encoded slug, categories and reviews', async () => {
      api.onGet(/\/products\/.*/).reply(...ok({}));
      api.onGet('/categories').reply(...ok([]));

      await catalog.getProduct('batik shirt');
      await catalog.listReviews(4, 2);
      await catalog.listCategories();

      expect(api.history.get.map((r) => r.url)).toEqual([
        '/products/batik%20shirt',
        '/products/4/reviews',
        '/categories',
      ]);
    });

    it('should post a review rating and comment', async () => {
      api.onPost('/products/4/reviews').reply(201, { success: true, data: { id: 1 } });

      await catalog.createReview(4, { rating: 5, comment: 'Lovely' });

      expect(JSON.parse(lastRequest('post').data)).toEqual({ rating: 5, comment: 'Lovely' });
    });
  });

  describe('auth', () => {
    it('should store the access token on login and return the customer', async () => {
      api.onPost('/auth/login').reply(200, { customer: { id: 4 }, accessToken: 'tok' });

      await expect(auth.login({ email: 'a@b.lk', password: 'p' })).resolves.toEqual({ id: 4 });
      expect(getAccessToken()).toBe('tok');
    });

    it('should register with a null phone when none is given', async () => {
      api.onPost('/auth/register').reply(201, { customer: { id: 5 }, accessToken: 't2' });

      await auth.register({ name: 'N', email: 'n@x.lk', password: 'P4ssword' });

      expect(JSON.parse(lastRequest('post').data).phone).toBeNull();
    });

    it('should clear the token on logout even if the request fails', async () => {
      setAccessToken('tok');
      api.onPost('/auth/logout').networkError();

      await expect(auth.logout()).rejects.toBeTruthy();
      expect(getAccessToken()).toBeNull();
    });

    it('should restore the session from the refresh cookie', async () => {
      raw.onPost('/api/v1/auth/refresh').reply(200, { accessToken: 'r', customer: { id: 3 } });

      await expect(auth.restoreSession()).resolves.toEqual({ id: 3 });
    });

    it('should return null when the refresh response has no customer', async () => {
      raw.onPost('/api/v1/auth/refresh').reply(200, { accessToken: 'r' });

      await expect(auth.restoreSession()).resolves.toBeNull();
    });
  });

  describe('cart', () => {
    it('should identify a guest with X-Session-Token', async () => {
      api.onGet('/cart').reply(...ok({ items: [{ id: 1 }] }));

      await expect(cart.getCart()).resolves.toEqual([{ id: 1 }]);
      expect(lastRequest('get').headers['X-Session-Token']).toMatch(/^guest_/);
    });

    it('should rely on the bearer token for a customer', async () => {
      setAccessToken('tok');
      api.onGet('/cart').reply(...ok({}));

      await expect(cart.getCart()).resolves.toEqual([]);
      expect(lastRequest('get').headers['X-Session-Token']).toBeUndefined();
    });

    it('should use the real item routes and verbs', async () => {
      api.onPost('/cart/items').reply(201, {});
      api.onPatch('/cart/items/7').reply(200, {});
      api.onDelete('/cart/items/7').reply(200, {});
      api.onPost('/cart/merge').reply(200, {});

      await cart.addCartItem(3, 2);
      await cart.updateCartItem(7, 4);
      await cart.removeCartItem(7);
      await cart.mergeGuestCart('guest_abcdefghijklmnop');

      expect(JSON.parse(api.history.post[0].data)).toEqual({ variant_id: 3, quantity: 2 });
      expect(JSON.parse(api.history.patch[0].data)).toEqual({ quantity: 4 });
      expect(JSON.parse(api.history.post[1].data)).toEqual({
        session_token: 'guest_abcdefghijklmnop',
      });
    });
  });

  describe('checkout and payment', () => {
    it('should send only variant ids and quantities, never prices', async () => {
      api.onPost('/checkout/initiate').reply(201, { success: true, data: { order_id: 1 } });

      await checkout.initiateCheckout({
        items: [{ variant_id: 3, quantity: 2, unit_price: 1 }],
        shippingAddress: { line1: 'a', city: 'b', postal_code: '81200' },
        shippingMethod: 'standard',
        guestEmail: 'g@x.lk',
      });

      const body = JSON.parse(lastRequest('post').data);
      expect(body.items).toEqual([{ variant_id: 3, quantity: 2 }]);
      expect(body).toMatchObject({ shipping_method: 'standard', guest_email: 'g@x.lk' });
    });

    it('should release a reservation by id', async () => {
      api.onPost('/checkout/release/res_1').reply(200, {});

      await checkout.releaseReservation('res_1');

      expect(lastRequest('post').url).toBe('/checkout/release/res_1');
    });

    it('should send the guest order token when paying a guest order', async () => {
      rememberGuestOrder(10, 'gtok');
      api.onPost('/payments/create-intent').reply(...ok({ provider: 'mock' }));
      api.onPost('/payments/confirm').reply(...ok({ status: 'processing' }));

      await checkout.createPaymentIntent(10);
      await checkout.confirmPayment(10, 'pi_1');

      expect(api.history.post[0].headers['X-Guest-Token']).toBe('gtok');
      expect(JSON.parse(api.history.post[1].data)).toEqual({
        order_id: 10,
        payment_intent_id: 'pi_1',
      });
    });

    it('should not send a guest header for a customer order', async () => {
      api.onPost('/payments/create-intent').reply(...ok({}));

      await checkout.createPaymentIntent(11);

      expect(lastRequest('post').headers['X-Guest-Token']).toBeUndefined();
    });
  });

  describe('orders', () => {
    it('should list, read and track orders', async () => {
      rememberGuestOrder(5, 'g5');
      api.onGet(/\/orders.*/).reply(...ok({}));

      await orders.listMyOrders(2);
      await orders.getOrder(5);
      await orders.trackOrder(5);

      expect(api.history.get[0].params).toEqual({ page: 2 });
      expect(api.history.get[1].headers['X-Guest-Token']).toBe('g5');
      expect(api.history.get[2].url).toBe('/orders/5/track');
    });
  });

  describe('account', () => {
    it('should map address form fields to the backend names', async () => {
      api.onPost('/users/addresses').reply(201, {});

      await account.addAddress({
        line1: '12 Main St',
        city: 'Dickwella',
        district: 'Matara',
        postalCode: '81200',
      });

      expect(JSON.parse(lastRequest('post').data)).toEqual({
        address_line1: '12 Main St',
        address_line2: null,
        city: 'Dickwella',
        state: 'Matara',
        postal_code: '81200',
        country: 'Sri Lanka',
        is_default: false,
      });
    });

    it('should call every account route', async () => {
      api.onAny().reply(...ok({}));

      await account.getProfile();
      await account.updateProfile({ name: 'N', phone: '' });
      await account.listAddresses();
      await account.updateAddress(2, {
        line1: 'a',
        city: 'b',
        postalCode: '81200',
        isDefault: true,
      });
      await account.setDefaultAddress(2);
      await account.deleteAddress(2);
      await account.getLoyalty();
      await account.listLoyaltyTransactions(3);

      expect(api.history.patch.map((r) => r.url)).toEqual([
        '/users/me',
        '/users/addresses/2/default',
      ]);
      expect(api.history.put[0].url).toBe('/users/addresses/2');
      expect(api.history.delete[0].url).toBe('/users/addresses/2');
      expect(api.history.get.at(-1).params).toEqual({ page: 3 });
    });
  });

  describe('returns and wishlist', () => {
    it('should only send an exchange variant for exchanges', async () => {
      api.onPost('/returns').reply(201, {});

      await returns.requestReturn({
        orderItemId: 1,
        type: 'return',
        reason: 'Wrong size',
        exchangeVariantId: 9,
      });
      await returns.requestReturn({
        orderItemId: 1,
        type: 'exchange',
        reason: 'Wrong size',
        exchangeVariantId: 9,
      });

      expect(JSON.parse(api.history.post[0].data).exchange_variant_id).toBeUndefined();
      expect(JSON.parse(api.history.post[1].data).exchange_variant_id).toBe(9);
    });

    it('should list returns and use the wishlist routes', async () => {
      api.onAny().reply(...ok([]));

      await returns.listMyReturns();
      await wishlist.getWishlist();
      await wishlist.toggleWishlist(12);

      expect(api.history.get.map((r) => r.url)).toEqual(['/returns/my-returns', '/wishlist']);
      expect(JSON.parse(lastRequest('post').data)).toEqual({ product_id: 12 });
    });
  });
});
