# StackStorm customer storefront

[![Frontend CI](https://github.com/stackstormproject/stackstorm-frontend-customer/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/stackstormproject/stackstorm-frontend-customer/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/stackstormproject/stackstorm-frontend-customer/branch/develop/graph/badge.svg)](https://codecov.io/gh/stackstormproject/stackstorm-frontend-customer)

The online shop for **Dickwella Fashion Corner**, a handloom and batik clothing shop in
Dickwella, Matara. Part of the StackStorm project (SENG 34213, University of Kelaniya):
[GitHub organisation](https://github.com/stackstormproject) ·
[backend](https://github.com/stackstormproject/backend) ·
[admin app](https://github.com/stackstormproject/stackstorm-frontend-admin) ·
[infra](https://github.com/stackstormproject/infra) ·
[documents](https://github.com/stackstormproject/documents)

**Live staging:** _add the staging URL here after the first deploy_

## What it does

| Area      | Pages                                                                                         | SRS                                     |
| --------- | --------------------------------------------------------------------------------------------- | --------------------------------------- |
| Discovery | Home, `/shop`, `/shop/:category`, search, filters in the URL                                  | FR001, FR002                            |
| Product   | `/products/:slug`: gallery, sizes and colours, live stock, reviews                            | FR003, FR004, FR008                     |
| Bag       | Drawer and `/cart`, stored on the server, merged on sign-in                                   | FR006                                   |
| Checkout  | `/checkout`: guest or customer, 15-minute stock hold, Stripe payment                          | FR013, FR014, FR016                     |
| Account   | `/account`: profile, orders and tracking, returns and exchanges, addresses, wishlist, loyalty | FR005, FR009-FR011, FR023, FR027, FR035 |
| Support   | Live chat with offline FAQ                                                                    | FR032, FR033                            |

## Prerequisites

- Node.js 20 or newer (CI uses 24) and npm
- The [backend](https://github.com/stackstormproject/backend) running with PostgreSQL and Redis
  (the [infra](https://github.com/stackstormproject/infra) `docker-compose.yml` starts both)

## Run it on a fresh machine

```bash
# 1. Backend (in another terminal) - see the backend README for details
git clone https://github.com/stackstormproject/infra.git && cd infra && docker compose up -d && cd ..
git clone https://github.com/stackstormproject/backend.git && cd backend
cp .env.example .env            # set JWT_SECRET to any long random string
npm ci && npx sequelize-cli db:migrate && npm run db:seed && npm run dev

# 2. Storefront
git clone https://github.com/stackstormproject/stackstorm-frontend-customer.git
cd stackstorm-frontend-customer
cp .env.example .env            # defaults work locally
npm ci
npm run dev                     # http://localhost:5173 (proxies /api and /socket.io to :5000)
```

"Continue to payment" sends the shopper to the hosted payment page (Stripe Checkout) and Stripe
sends them back to `/checkout/complete`, which verifies the payment and opens the order
confirmation. Without a Stripe key on the backend, a clearly labelled **test payment gateway**
inside this app stands in for Stripe and no money moves. With a Stripe test key on the backend,
pay with card `4242 4242 4242 4242`, any future date, any CVC.

## Environment variables

| Variable              | Default                 | Purpose                                                    |
| --------------------- | ----------------------- | ---------------------------------------------------------- |
| `VITE_API_BASE_URL`   | `/api/v1`               | API path; nginx and the dev server proxy it to the backend |
| `VITE_SOCKET_URL`     | page origin             | Live-chat Socket.IO origin                                 |
| `VITE_DEV_API_TARGET` | `http://localhost:5000` | Dev proxy target (dev server only)                         |

Vite inlines these at **build** time. Never put secrets in them; `.env` is git-ignored.

## Scripts

| Command                 | Does                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run dev`           | Dev server with API proxy                                         |
| `npm run lint`          | ESLint (Airbnb + hooks + jsx-a11y), zero warnings allowed         |
| `npm run format:check`  | Prettier check                                                    |
| `npm run test:coverage` | Vitest unit and integration tests with coverage (fails under 80%) |
| `npm run test:e2e`      | Playwright critical flows; set `E2E_BASE_URL` for staging         |
| `npm run verify`        | Everything CI runs: lint, format, tests with coverage, build      |
| `npm run build`         | Production bundle in `dist/`                                      |

## How it is built

- React 19, React Router 7 (every page has a URL), plain CSS on the team design tokens
  (`src/styles/tokens.css`)
- `src/lib/http.js`: one Axios client; unwraps `{ success, data }`, turns every backend error
  shape into `ApiError { status, code, message }`, refreshes an expired session once
- `src/lib/session.js`: the access token lives **in memory only**; the refresh token is an
  httpOnly cookie set by the backend. Guest carts use `X-Session-Token`, guest orders
  `X-Guest-Token`
- `src/state/*`: Auth, Cart (the server is the source of truth), Wishlist, Toasts
- `src/api/*`: one module per backend area; contract tests in `src/tests/api`
- Checkout never sends prices: the server prices the order, holds stock for 15 minutes
  (ADR-004), and verifies the Stripe Checkout session before marking the order paid

## Tests

- `src/tests/**`: 242 Vitest + Testing Library tests, about 98% line coverage, including
  axe-core accessibility checks of the main pages
- `e2e/**`: Playwright guest checkout, customer purchase and tracking, guest-bag merge,
  catalog, responsive checks. Runs nightly against staging (`.github/workflows/e2e.yml`)

## Docker

```bash
docker build -t stackstorm-customer .
docker run --rm stackstorm-customer nginx -t     # validate the nginx config
```

nginx serves the bundle, proxies `/api` and `/socket.io` to the `backend` service, sends
security headers (CSP with no third-party scripts) and never caches
`index.html`.
