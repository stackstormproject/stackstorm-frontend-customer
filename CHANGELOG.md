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

### Changed

- `lint`, `format:check` and `test:coverage` now run the real tools; they previously printed
  a success message without checking anything (#109)
- The access token is no longer stored in localStorage (#110)

### Removed

- Hard-coded fallback products, fake "saved locally" successes and the client-only cart (#110)
- Chat replies that invented order statuses and agents while offline (#111)

### Security

- No tokens in web storage; open-redirect-safe `?next=`; CSP restricting scripts to the site
  and Stripe; security headers kept on every nginx location (#110, #114, #120)
