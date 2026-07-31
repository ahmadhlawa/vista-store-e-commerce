// Builds the shared slice of the view-model that the design components consume.
// The presentational components stay untouched: they still receive one flat `v`.
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore, DEFAULT_FILTERS } from "../app/StoreProvider.jsx";
import { checkoutService } from "../services/checkout.js";
import { footerLinks, navLinks, trustFeatures, trustGlyphs } from "../store.js";
import { discountPercent, makeMoney, whatsappHref } from "../utils/format.js";

export function useShellView() {
  const store = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    settings, categories, cart, bump, toast, overlays, setOverlays, closeAll,
    navOpenCat, setNavOpenCat, announce, setAnnounce, scrolled, query, suggestions,
    suggestTried, runSuggest, recentSearches, rememberSearch, filters, setFilters,
    coupon, setCoupon, addToCart, setLineQty, removeLine, deliveryAreas, sideBanners,
  } = store;

  const money = useMemo(() => makeMoney(settings.currency), [settings.currency]);

  const open = useCallback(
    (patch) => setOverlays((current) => ({ ...current, ...patch })),
    [setOverlays],
  );

  // ── product decorator ──────────────────────────────────────────────────────
  const deco = useCallback(
    (product) => {
      if (!product) return null;
      const hasSale = product.sale != null;
      const effective = hasSale ? product.sale : product.price;
      const soldOut = !product.inStock;
      return {
        ...product,
        href: `/product/${product.slug}`,
        go: closeAll,
        hasSale,
        priceText: money(effective),
        oldText: money(product.price),
        discountText: hasSale ? `خصم ${discountPercent(product.sale, product.price)}٪` : "",
        savedText: hasSale ? money(product.price - product.sale) : "",
        hasRating: false,
        ratingText: "",
        reviewsText: "",
        reviewsFull: "",
        soldOut,
        add: () => {
          if (!soldOut) addToCart(product, 1, null);
        },
        quick: () => open({ quick: product }),
        wish: (event) => {
          event.preventDefault();
          event.stopPropagation();
          store.showToast("قائمة المفضلة غير مفعّلة في هذه النسخة");
        },
        btnBg: soldOut ? "#F4F1EC" : "#ffffff",
        btnColor: soldOut ? "#A39C90" : "#1F4E4A",
        btnBorder: soldOut ? "#E9E3DA" : "#1F4E4A",
        btnCursor: soldOut ? "not-allowed" : "pointer",
        btnLabel: soldOut ? "غير متوفر" : "أضف إلى العربة",
        btnIcon: soldOut ? "✕" : "+",
      };
    },
    [addToCart, closeAll, money, open, store],
  );

  // ── navigation ─────────────────────────────────────────────────────────────
  const categoryList = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        href: `/category/${category.slug}`,
        countText: `${category.count} منتجاً`,
        children: (category.children.length
          ? category.children.map((child) => ({
              label: child.name,
              href: `/category/${child.slug}`,
            }))
          : [{ label: `كل منتجات ${category.name}`, href: `/category/${category.slug}` }]),
        open: navOpenCat === category.slug,
        rotate: navOpenCat === category.slug ? "180deg" : "0deg",
        expand: () => setNavOpenCat(navOpenCat === category.slug ? null : category.slug),
      })),
    [categories, navOpenCat, setNavOpenCat],
  );

  const decoratedNav = useMemo(
    () =>
      navLinks.map((link) => {
        const active = link.href === "/" ? location.pathname === "/" : location.pathname.startsWith(link.href);
        return {
          ...link,
          active: active ? 1 : 0,
          weight: active ? 800 : 600,
          color: active ? "#1F4E4A" : "#4A453E",
        };
      }),
    [location.pathname],
  );

  // ── cart ───────────────────────────────────────────────────────────────────
  const count = cart.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = cart.reduce((sum, line) => sum + line.unit * line.qty, 0);
  const discount = coupon.applied ? coupon.discount : 0;
  const total = Math.max(0, subtotal - discount);

  const cartRows = useMemo(
    () =>
      cart.map((line) => ({
        ...line,
        href: `/product/${line.slug}`,
        unitText: money(line.unit),
        lineText: money(line.unit * line.qty),
        varText: line.variation ? `الخيار: ${line.variation}` : "الخيار الافتراضي",
        inc: () => setLineQty(line.key, 1),
        dec: () => setLineQty(line.key, -1),
        remove: () => removeLine(line.key),
      })),
    [cart, money, removeLine, setLineQty],
  );

  const applyCoupon = useCallback(async () => {
    const code = coupon.input.trim();
    if (!code) return;
    try {
      const result = await checkoutService.validateCoupon(code, subtotal);
      setCoupon((current) => ({
        ...current,
        applied: result.code,
        label: result.label,
        discount: result.discount,
        message: `تم تطبيق ${result.label}`,
        ok: true,
      }));
    } catch (error) {
      setCoupon((current) => ({
        ...current,
        applied: "",
        label: "",
        discount: 0,
        message: error.message || "الكود غير صالح أو منتهي الصلاحية",
        ok: false,
      }));
    }
  }, [coupon.input, setCoupon, subtotal]);

  // ── search ─────────────────────────────────────────────────────────────────
  const submitSearch = useCallback(
    (event) => {
      event.preventDefault();
      const term = query.trim();
      if (!term) return;
      rememberSearch(term);
      closeAll();
      navigate(`/search?q=${encodeURIComponent(term)}`);
    },
    [closeAll, navigate, query, rememberSearch],
  );

  // ── filters (shared by the listing page and the mobile filter drawer) ──────
  const filterCats = useMemo(
    () =>
      categories.map((category) => ({
        name: category.name,
        count: category.count,
        checked: filters.cats.includes(category.slug),
        toggle: () =>
          setFilters((current) => ({
            ...current,
            cats: current.cats.includes(category.slug)
              ? current.cats.filter((slug) => slug !== category.slug)
              : [...current.cats, category.slug],
          })),
      })),
    [categories, filters.cats, setFilters],
  );

  const waHref = whatsappHref(
    settings.whatsapp,
    `مرحباً، لدي استفسار عن منتج في ${settings.storeName}`,
  );

  const quickProduct = overlays.quick ? deco(overlays.quick) : null;

  return {
    // shell
    ready: store.ready,
    announce: announce && !!settings.announcement,
    announceText: settings.announcement,
    hideAnnounce: () => setAnnounce(false),
    hdrShadow: scrolled ? "0 6px 22px rgba(30,27,24,.09)" : "0 0 0 rgba(0,0,0,0)",
    storeName: settings.storeName,
    storeTagline: settings.tagline,
    storeDescription: settings.seoDescription || settings.tagline,
    logoUrl: settings.logoUrl,
    year: new Date().getFullYear(),
    socialLinks: [
      { label: "IG", title: "إنستغرام", href: settings.instagram },
      { label: "FB", title: "فيسبوك", href: settings.facebook },
      { label: "TT", title: "تيك توك", href: settings.tiktok },
      { label: "YT", title: "يوتيوب", href: settings.youtube },
      { label: "WA", title: "واتساب", href: waHref },
    ].filter((link) => link.href && link.href !== "#"),
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    hours: settings.hours,
    location: settings.address,
    instagram: settings.instagram || "#",
    facebook: settings.facebook || "#",
    waHref,
    categories: categoryList,
    megaCats: categoryList.slice(0, 8),
    sideBanners,
    navLinks: decoratedNav,
    trustFeatures: trustFeatures.map((feature) => ({
      ...feature,
      glyph: trustGlyphs[feature.icon] || "✦",
    })),
    footerCols: Object.keys(footerLinks).map((key) => ({
      title: footerLinks[key].title,
      items: footerLinks[key].items.map(([label, href]) => ({ label, href })),
    })),
    instaTiles: categoryList.slice(0, 10).map((category) => ({ bg: category.bg })),

    // header actions
    mega: overlays.mega,
    megaBg: overlays.mega ? "#163A37" : "#1F4E4A",
    megaColor: "#fff",
    toggleMega: () => open({ mega: !overlays.mega }),
    openNav: () => open({ navOpen: true }),
    openCart: () => open({ cartOpen: true }),
    openSearch: () => open({ searchOpen: true }),
    openFilters: () => open({ filtersOpen: true }),
    closeAll,
    closeAllH: closeAll,
    searchRef: (element) => {
      if (element && document.activeElement !== element) setTimeout(() => element.focus(), 60);
    },
    navOpen: overlays.navOpen,
    cartOpen: overlays.cartOpen,
    searchOpen: overlays.searchOpen,
    filtersOpen: overlays.filtersOpen,
    anyOverlay:
      overlays.cartOpen ||
      overlays.navOpen ||
      overlays.filtersOpen ||
      overlays.searchOpen ||
      !!overlays.quick,

    // search
    q: query,
    onQ: (event) => runSuggest(event.target.value),
    submitSearch,
    focusSearch: () => open({ searchFocused: true }),
    showSug: overlays.searchFocused && (query.trim().length >= 2 || recentSearches.length > 0),
    sugProducts: suggestions.products.map(deco),
    sugCats: suggestions.cats.map((category) => ({
      ...category,
      href: `/category/${category.slug}`,
    })),
    sugEmpty: suggestTried && !suggestions.products.length && !suggestions.cats.length,
    showRecent: query.trim().length < 2 && recentSearches.length > 0,
    recentSearches: recentSearches.map((text) => ({
      text,
      run: () => {
        rememberSearch(text);
        closeAll();
        navigate(`/search?q=${encodeURIComponent(text)}`);
      },
    })),

    // cart
    cartCount: count,
    cartTotalText: money(subtotal),
    bump,
    badgeAnim: bump ? "pulse .4s ease" : "none",
    cartRows,
    cartEmpty: cart.length === 0,
    cartHasItems: cart.length > 0,
    cartLineText: count === 0 ? "لا توجد منتجات في العربة" : `${count} منتجاً في عربتك`,
    subtotalText: money(subtotal),
    discountText: money(discount),
    hasDiscount: discount > 0,
    couponLabel: coupon.label,
    shippingText: "يُحتسب عند إتمام الطلب",
    totalText: money(total),
    freeShipHint: "تُحسب رسوم التوصيل حسب المنطقة في صفحة إتمام الطلب",
    coupon: coupon.input,
    onCoupon: (event) =>
      setCoupon((current) => ({ ...current, input: event.target.value })),
    applyCoupon,
    couponMsg: coupon.message,
    couponMsgColor: coupon.ok ? "#2E7D5B" : "#C0392B",

    // filters (listing page + mobile drawer)
    filtersState: filters,
    filterCats,
    fMax: filters.maxPrice,
    fMaxText: money(filters.maxPrice),
    onMax: (event) =>
      setFilters((current) => ({ ...current, maxPrice: Number(event.target.value) })),
    fOffers: filters.onlyOffers,
    toggleOffers: () =>
      setFilters((current) => ({ ...current, onlyOffers: !current.onlyOffers })),
    fStock: filters.inStock,
    toggleStock: () => setFilters((current) => ({ ...current, inStock: !current.inStock })),
    sort: filters.sort,
    onSort: (event) => setFilters((current) => ({ ...current, sort: event.target.value })),
    resetFilters: () => setFilters(DEFAULT_FILTERS),

    // quick view
    quick: quickProduct || {},
    quickOpen: !!overlays.quick,

    // misc
    areas: deliveryAreas.map((area) => ({
      ...area,
      priceText: money(area.price),
      optionLabel: `${area.name} — ${money(area.price)}${area.eta ? ` · ${area.eta}` : ""}`,
    })),
    toast,
    money,
    deco,
  };
}
