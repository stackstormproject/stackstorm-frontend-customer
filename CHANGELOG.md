# Changelog

All notable changes to the customer storefront. Format:
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/); versions follow
[Semantic Versioning](https://semver.org/). The version is set on the `release/*` branch.

## [Unreleased]

### Added

- URL routing for every page; shareable catalog filters (#111, #112)
- API client matching the backend contract with one error shape and single-flight session
  refresh (#110)
- Product page with colour and size matrix, per-size stock and surcharges, verified reviews (#113)
- Sign in and registration with server error mapping and safe `?next=` redirects (#114)
- Server-backed bag drawer and `/cart`, merged into the account on sign-in (#115)
- Checkout with the 15-minute stock hold, Stripe Elements or labelled test mode, server
  payment verification, and an order confirmation page (#116)
- Account area: profile, loyalty, orders with tracking, returns and exchanges, addresses,
  wishlist (#117)
- axe-core accessibility tests; collapsible filters and two-column grid on phones (#118)
- Playwright E2E suite and nightly staging workflow (#119)
- README for a fresh machine, CSP and cache headers, reproducible Docker build (#120)
- Storefront header with a delivery bar and shop mark, three animated home banners that
  pause on hover, focus or reduced motion, collection banners, and a navy footer with the
  shop's promises (#175)
- Home page sections chosen in the admin console (new arrivals, popular) with a fallback to
  the newest products, "Our brands" linking to each brand's products, and Add to bag / Buy
  now on every product card and product page (#176)
- Product gallery with the main photo and up to three more, arrows and a photo counter;
  "Order placed" page with next steps and a PDF invoice download, also on each paid order;
  return and exchange progress under the item it is for, and on the order list (#177)
- "Continue to payment" opens the hosted payment page (Stripe Checkout, or a labelled test
  gateway without a Stripe key) and returns to `/checkout/complete`, which verifies the
  payment and opens the order confirmation (#182)
- Order list and order pages fetch the status again every 30 seconds and when the shopper
  returns to the tab, so a status set in the admin console shows without a reload (#183)
- New sign in and register design with an illustrated background and a bordered form card;
  "Forgot password?" with `/forgot-password` and `/reset-password` pages; "Continue as guest"
  (#186)
- "Home" in the category bar on every page, "Back to home" on the order confirmation and
  "Go to the home page" on not-found pages; signing in, registering or continuing as a guest
  without a destination now lands on the home page (#187)
- "About us" page with the shop's story, promises and address, linked from the header and
  footer on every page (#192, FR-33)
- Header search is now a type-ahead combobox: product, category and brand suggestions as you
  type (debounced, min 2 characters), full keyboard navigation, and "See all results" to fall
  back to a normal search; a colour filter with named swatches and in-stock counts, and a
  brand filter, alongside the existing size and price filters (#191, FR-001, FR-002)
- Account: a profile picture (JPEG/PNG/WebP up to 5 MB, with a client-side check before
  upload), shopping preferences (order update emails, wishlist sale and back-in-stock
  alerts, newsletter, browser notifications, preferred payment method and usual size,
  each saved as it is changed), and a "Payment methods" page listing cards saved on the
  payment page with brand, last 4 digits and expiry, to set as default or remove (#193,
  FR-005, FR-010, FR-012, FR-34)
- A "Sale" section on the home page and a dedicated `/sale` page (reusing the catalogue's
  filters, grid and pagination), with a sale badge and struck-through pricing on product
  cards and the product detail page (#199)
- The home page hero now shows admin-managed banners by slot, falling back to the default
  slide for any slot admin hasn't filled in (#200)
- Checkout: a promo code can be applied and removed before paying, and a signed-in shopper
  can redeem their loyalty points for a discount, both re-priced and re-validated by the
  server at checkout (#201)
- The test payment gateway now shows a labelled Bank Card form (holder's name, card number,
  expiry, CVV) in front of PayHere's own gateway chrome, instead of a single "Pay" button
  (#202)

### Changed

- `lint`, `format:check` and `test:coverage` now run the real tools; they previously printed
  a success message without checking anything (#109)
- The access token is no longer stored in localStorage (#110)

### Removed

- Hard-coded fallback products, fake "saved locally" successes and the client-only cart (#110)
- Chat replies that invented order statuses and agents while offline (#111)
- In-page card form (Stripe Elements), the hold timer and `VITE_STRIPE_PUBLISHABLE_KEY` (#182)
- "New in" link in the category bar and footer, and the stripe between the header and the
  banner (#183)
- Loyalty-point redemption at checkout; the server no longer accepts it, so the "Redeem
  loyalty points" checkbox and points-to-redeem field were removed from the checkout form.
  The account page's points/tier summary is unaffected (#11)

### Security

- No tokens in web storage; open-redirect-safe `?next=`; CSP restricting scripts to the site;
  security headers kept on every nginx location (#110, #114, #120, #182)
