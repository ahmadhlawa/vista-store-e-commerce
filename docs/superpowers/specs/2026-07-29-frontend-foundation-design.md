# Frontend Foundation Design

## Decision

Incrementally migrate the imported RTL storefront to strict TypeScript with React Router while retaining its existing components, markup, styling, and interaction model. The approved requirements supply the product decisions; unknown paths render an intentional Arabic Not Found view.

## Architecture

- `app/App.tsx` owns existing presentation state and composes the storefront shell.
- `app/router.tsx` defines BrowserRouter routes, including all legacy routes and dynamic slugs.
- Domain contracts live in `types/`; mock records in `data/mockStore.ts`; small services expose async interfaces suitable for a later FastAPI replacement.
- `storage/` owns defensive local persistence for cart, viewed products, and searches.
- Existing visual components stay in `components/` and receive typed view models.

## Routing

Legacy hash routes become path routes: `/`, `/shop`, `/category/:slug`, `/offers`, `/search`, `/product/:slug`, `/cart`, `/checkout`, `/login`, `/register`, `/account`, `/track-order`, `/blog`, `/blog/:slug`, `/about`, `/privacy-policy`, `/return-policy`, `/terms`, `/contact`, and `/tools/:tool`.

## Safety and Verification

TypeScript runs with `strict: true`. Storage never throws for unavailable storage or malformed JSON. Vitest and React Testing Library cover routes, storage parsing, data contracts, and absence of hash routing. The migration does not add HTTP calls, server work, client branding, or visual redesign.
