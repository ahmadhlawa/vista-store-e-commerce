import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { catalogService } from "../services/catalog.js";
import { storefrontService, FALLBACK_SETTINGS, normalizeSettings } from "../services/storefront.js";
import { cartStorage, lineKey, searchStorage, viewedStorage } from "../storage/cartStorage.js";

const StoreContext = createContext(null);

export const DEFAULT_FILTERS = {
  cats: [],
  maxPrice: 400,
  onlyOffers: false,
  inStock: false,
  sort: "featured",
};

const EMPTY_OVERLAYS = {
  cartOpen: false,
  navOpen: false,
  searchOpen: false,
  filtersOpen: false,
  mega: false,
  quick: null,
  searchFocused: false,
};

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside <StoreProvider>");
  return context;
}

export function StoreProvider({ children }) {
  const [settings, setSettings] = useState(() => normalizeSettings(FALLBACK_SETTINGS));
  const [categories, setCategories] = useState([]);
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [sideBanners, setSideBanners] = useState([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [cart, setCart] = useState(() => cartStorage.load());
  const [bump, setBump] = useState(0);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [overlays, setOverlays] = useState(EMPTY_OVERLAYS);
  const [navOpenCat, setNavOpenCat] = useState(null);
  const [announce, setAnnounce] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState({ products: [], cats: [] });
  const [suggestTried, setSuggestTried] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => searchStorage.load());
  const suggestTimer = useRef(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [viewed, setViewed] = useState(() => viewedStorage.load());

  // Coupon and checkout form state live here because the cart drawer, the cart
  // page and the checkout page all read and write them.
  const [coupon, setCoupon] = useState({
    input: "",
    applied: "",
    label: "",
    message: "",
    ok: false,
    discount: 0,
  });
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    phone: "",
    email: "",
    areaId: null,
    address: "",
    notes: "",
    payment: "cash_on_delivery",
    terms: false,
  });

  // ── bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled([
        storefrontService.settings(),
        catalogService.categories(),
        storefrontService.deliveryAreas(),
        storefrontService.banners("home_side"),
      ]);
      if (cancelled) return;
      const [settingsResult, categoriesResult, areasResult, bannersResult] = results;
      if (settingsResult.status === "fulfilled") setSettings(settingsResult.value);
      if (categoriesResult.status === "fulfilled") setCategories(categoriesResult.value);
      if (areasResult.status === "fulfilled") setDeliveryAreas(areasResult.value);
      if (bannersResult.status === "fulfilled") setSideBanners(bannersResult.value);

      const failure = results.find((result) => result.status === "rejected");
      // A failed bootstrap must not blank the storefront: defaults stay in place
      // and the shell renders with an explicit message.
      setLoadError(failure ? failure.reason : null);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Store colours become CSS custom properties, so a client instance restyles
  // itself from the admin area.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", settings.primaryColor);
    root.style.setProperty("--brand-secondary", settings.secondaryColor);
    root.style.setProperty("--brand-accent", settings.accentColor);
  }, [settings.primaryColor, settings.secondaryColor, settings.accentColor]);

  useEffect(() => {
    if (settings.seoTitle) document.title = settings.seoTitle;
  }, [settings.seoTitle]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeAll = useCallback(() => {
    setOverlays(EMPTY_OVERLAYS);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAll]);

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(suggestTimer.current);
    },
    [],
  );

  // ── toast ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }, []);

  // ── cart ───────────────────────────────────────────────────────────────────
  const persistCart = useCallback((next) => {
    cartStorage.save(next);
    setCart(next);
  }, []);

  const addToCart = useCallback(
    (product, qty = 1, variant = null) => {
      if (!product) return;
      const unit = product.sale ?? product.price;
      const key = lineKey(product.id, variant?.id);
      const next = cart.slice();
      const index = next.findIndex((line) => line.key === key);
      if (index > -1) {
        next[index] = { ...next[index], qty: next[index].qty + qty };
      } else {
        next.push({
          key,
          productId: product.id,
          variantId: variant?.id ?? null,
          slug: product.slug,
          name: product.name,
          unit,
          bg: product.bg,
          variation: variant?.title || "",
          qty,
        });
      }
      persistCart(next);
      setBump((value) => value + 1);
      const label = product.name.length > 34 ? `${product.name.slice(0, 34)}…` : product.name;
      showToast(`تمت إضافة «${label}» إلى العربة`);
    },
    [cart, persistCart, showToast],
  );

  const setLineQty = useCallback(
    (key, delta) => {
      persistCart(
        cart.map((line) =>
          line.key === key ? { ...line, qty: Math.max(1, line.qty + delta) } : line,
        ),
      );
    },
    [cart, persistCart],
  );

  const removeLine = useCallback(
    (key) => persistCart(cart.filter((line) => line.key !== key)),
    [cart, persistCart],
  );

  const clearCart = useCallback(() => persistCart([]), [persistCart]);

  // ── search suggestions ─────────────────────────────────────────────────────
  const runSuggest = useCallback(
    (value) => {
      clearTimeout(suggestTimer.current);
      setQuery(value);
      setSuggestTried(false);
      if (value.trim().length < 2) {
        setSuggestions({ products: [], cats: [] });
        return;
      }
      suggestTimer.current = setTimeout(async () => {
        try {
          const result = await catalogService.list({ q: value.trim(), page_size: 6 });
          const needle = value.trim();
          setSuggestions({
            products: result.items,
            cats: categories.filter((category) => category.name.includes(needle)).slice(0, 3),
          });
        } catch {
          setSuggestions({ products: [], cats: [] });
        } finally {
          setSuggestTried(true);
        }
      }, 260);
    },
    [categories],
  );

  const rememberSearch = useCallback((term) => {
    setRecentSearches(searchStorage.push(term));
  }, []);

  const rememberViewed = useCallback((slug) => {
    setViewed(viewedStorage.push(slug));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      loadError,
      settings,
      categories,
      deliveryAreas,
      sideBanners,
      cart,
      bump,
      addToCart,
      setLineQty,
      removeLine,
      clearCart,
      toast,
      showToast,
      overlays,
      setOverlays,
      closeAll,
      navOpenCat,
      setNavOpenCat,
      announce,
      setAnnounce,
      scrolled,
      query,
      setQuery,
      suggestions,
      suggestTried,
      runSuggest,
      recentSearches,
      rememberSearch,
      filters,
      setFilters,
      viewed,
      rememberViewed,
      coupon,
      setCoupon,
      checkoutForm,
      setCheckoutForm,
    }),
    [
      ready, loadError, settings, categories, deliveryAreas, sideBanners, cart, bump,
      addToCart, setLineQty, removeLine, clearCart, toast, showToast, overlays, closeAll,
      navOpenCat, announce, scrolled, query, suggestions, suggestTried, runSuggest,
      recentSearches, rememberSearch, filters, viewed, rememberViewed, coupon, checkoutForm,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
