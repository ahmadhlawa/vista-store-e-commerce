# Frontend architecture

React 18 with Vite 6 and React Router, written in **JavaScript/JSX**. There is no
TypeScript here and none should be added: an earlier TypeScript migration was abandoned
and must not be reused.

One single-page application serves two independent areas — the public storefront and the
admin workspace — which share nothing but the HTTP client and the browser-storage helpers.

## Directory map

```
src/
  main.jsx            mounts <App/> inside <BrowserRouter>
  App.jsx             the route table, nothing else
  api/                client.js, publicApi.js, adminApi.js
  app/StoreProvider.jsx   shared storefront state
  hooks/useShellView.js   builds the shared slice of the `v` view-model
  layouts/StorefrontLayout.jsx
  pages/              one route component per storefront route
  components/         the original presentational design components
  admin/              the admin workspace (own layout, own pages)
  services/           catalog.js, storefront.js, checkout.js — API to view-model
  storage/            safeStorage.js, cartStorage.js, authStorage.js
  utils/              A.jsx, format.js, placeholder.js
  store.js            navigation structure and static copy only
  test/               Vitest suites and helpers
```

## Routing

`App.jsx` is only a route table. `/admin/*` renders `AdminApp`; every other path renders
`StorefrontLayout` wrapped in `StoreProvider`.

Storefront routes:

```
/                       /shop                   /category/:slug
/offers                 /packages               /molds
/search?q=              /product/:slug          /cart
/checkout               /order-success/:orderNumber
/track-order            /blog                   /blog/:slug
/page/:slug             /about                  /privacy-policy
/return-policy          /terms                  /contact
/tools/calculator       *  → an intentional Not Found page
```

`/about`, `/privacy-policy`, `/return-policy` and `/terms` are direct links the original
storefront used; they resolve to the same `StaticPage` records as `/page/:slug`.

`/shop`, `/category/:slug`, `/offers`, `/packages`, `/molds` and `/search` are the same
`ProductListPage` under different `mode` props.

Because these are client-side routes, a production web server needs an SPA fallback or a
reload of `/product/x` returns 404. The Nginx template handles it with `try_files`.

## The `v` view-model

The presentational components in `src/components/` came from the original design and keep
their markup and styling. They consume **one flat object called `v`** — never the API
shape, never a store, never a context.

```
StoreProvider  →  useShellView()  →  shared slice of v
                                        │
                        page component merges its own slice
                                        │
                                     <Component v={v} />
```

This indirection is exactly what allowed the data source to be swapped from mock objects
to a live API without editing the design. Keep it: adding API calls or context reads
directly inside `src/components/` defeats the whole arrangement.

## State

`StoreProvider` holds what more than one storefront route needs: store settings,
categories, delivery areas, the cart, overlay visibility, search query and suggestions,
filters, the applied coupon, the checkout form and recently-viewed products. Anything used
by a single route stays local to that route.

Persistent state goes through `src/storage/`:

| Helper | Stores | Where |
| --- | --- | --- |
| `cartStorage` | cart lines | `localStorage` |
| `authStorage` | admin token and profile | `localStorage` |
| — | `public_token` of a placed order | `sessionStorage` |

`safeStorage.js` wraps all of it, so a browser with storage disabled or full degrades
instead of throwing.

Because the order token lives in `sessionStorage`, `/track-order` works only in the
browser session that placed the order. That is intentional: the order number alone must
not reveal an order.

## API access

`src/api/client.js` is the single HTTP entry point. Auth headers, the error shape and the
401 recovery path exist in exactly one place.

- Base URL is `VITE_API_BASE_URL`, defaulting to `/api/v1` so the dev proxy handles
  same-origin requests with no configuration.
- `api.get/post/patch/delete` take `{ auth: true }` to attach the bearer token. Public
  calls never send it.
- Failures are normalised into an `ApiError` carrying `status`, `code` and `fields`, taken
  from the backend's `{"error": {...}}` body. UI code branches on `code`, not on prose.
- An unreachable server becomes `code: "network_error"` rather than a raw `TypeError`.
- A 401 triggers the registered unauthorized handler, which clears the stored session and
  returns the admin area to the login screen.

`publicApi.js` and `adminApi.js` are thin named wrappers over the endpoints. `services/`
turns API payloads into the shapes pages need — pricing text, badges, filter state — so
pages stay declarative.

## Storefront details

- **`utils/A.jsx`** renders a router `<Link>` for internal paths and a plain `<a>` for
  `http(s):`, `tel:`, `mailto:` and anything with `target="_blank"`. It is not a global
  click interceptor and should not become one.
- **Store identity is data.** Name, tagline, contact details, social links, currency and
  brand colours come from `GET /store/settings`; the colours are applied as CSS custom
  properties. No client branding is hard-coded.
- **Images fall back to the design's tone gradients** (`utils/placeholder.js`), so a store
  with no uploaded media still looks finished.
- **Home page composition is admin-controlled**: which sections appear, in what order,
  with which titles, comes from `home_sections`.
- **Every commercial number is server-supplied.** The checkout page displays only the
  figures returned by `POST /cart/price`; it never computes a total locally.
- **RTL**: `index.html` sets `lang="ar" dir="rtl"`, and layout uses logical properties
  (`inset-inline-start`, `margin-inline`) rather than left/right.

## Admin workspace

`/admin/*` renders `AdminApp`, which has its own layout and no storefront chrome.

```
/admin/login                     standalone, no navigation
/admin                           dashboard
/admin/products                  list, search, type and status filters, pagination
/admin/products/:productId       full editor
/admin/categories                /admin/orders            /admin/orders/:orderId
/admin/coupons                   /admin/delivery          /admin/hero
/admin/banners                   /admin/home              /admin/articles
/admin/pages                     /admin/media             /admin/settings
/admin/admins                    super admin only
/admin/audit                     super admin only
```

Unknown `/admin/*` paths redirect to the dashboard rather than showing the storefront's
Not Found page.

- A route wrapper redirects unauthenticated visitors to `/admin/login`, preserving the
  intended path.
- Super-admin-only entries are hidden from the navigation **and** guarded by a route
  wrapper — and the API enforces the same rule independently. The frontend guard is
  convenience, not security.
- `ResourceScreen.jsx` is a small declarative CRUD engine: most admin screens are a field
  list plus an API binding, which is why the workspace is broad without being large.
- `ui.jsx` holds the shared primitives (`DataTable`, `Badge`, form inputs).

## Tests

`src/test/` runs under jsdom with Vitest and Testing Library. `fetch` is stubbed per test
via `stubApi`, so nothing reaches a real server, and `setup.js` installs an in-memory
`Storage` polyfill because this jsdom build does not expose a resettable one.

`storefront.test.jsx` covers the shell, home sections, listing, product detail, the
intentional not-found pages, cart persistence, checkout validation, a successful checkout
and API-unreachable behaviour. `admin.test.jsx` covers login, session restore and
expiry, route guarding, the product and order screens, super-admin navigation hiding, and
the API client's token and error handling.

Queries are scoped (`within`, `getByRole`) rather than global, because several Arabic
labels and money strings legitimately appear more than once on a page.

Current: **24 passed**.
