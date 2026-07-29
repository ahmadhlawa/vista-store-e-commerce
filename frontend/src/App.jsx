import React from "react";
import * as S from "./store.js";
import sx from "./sx.js";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import { HomeTop, HomeBottom, TrustStrip } from "./components/Home.jsx";
import ListingPage from "./components/Listing.jsx";
import { ProductPage, ViewedSection } from "./components/Product.jsx";
import { CartPage, CheckoutPage } from "./components/CartCheckout.jsx";
import { AuthPage, AccountPage, TrackPage, BlogPage, ArticlePage, StaticPage, ContactPage, CalculatorPage } from "./components/Pages.jsx";
import Overlays from "./components/Overlays.jsx";

const CUR = " ₪";
const money = (n) => Math.round(n) + CUR;

export default class App extends React.Component {
  S = S;

  state = {
    ready: false, route: { name: "home", param: "" }, scrolled: false, announce: true,
    cart: [], cartOpen: false, navOpen: false, navOpenCat: null, searchOpen: false, filtersOpen: false, mega: false,
    q: "", sug: { products: [], cats: [] }, sugTried: false, recent: [], searchFocused: false,
    hero: 0, heroPaused: false, bump: 0,
    listItems: [], listLoading: true, shown: 8,
    fCats: [], fMax: 400, fOffers: false, fStock: false, sort: "featured",
    product: null, pImg: 0, pQty: 1, pVar: "", pTab: "desc", related: [], viewedIds: [],
    quick: null, qQty: 1, toast: null,
    coupon: "", couponApplied: "", couponMsg: "", couponOk: false,
    ck: { name: "", phone: "", city: 1, address: "", notes: "", payment: "cod", terms: false },
    ckErrors: {}, placing: false, order: null,
    auth: { name: "", id: "", pass: "" }, authTab: "login", authError: "",
    contact: { name: "", phone: "", msg: "" }, news: "",
    trackId: "", trackRes: null, trackLoading: false,
    calc: { shape: "round", dia: 20, side: 20, height: 2, layers: 1 },
    homeKits: [], homeNew: [], homeBest: [], homeTab: "new", sc: [[], []],
    article: null, page: null,
  };

  rows = {};

  componentDidMount() {
    this.onHash = this.onHash.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onKey = this.onKey.bind(this);
    window.addEventListener("hashchange", this.onHash);
    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("keydown", this.onKey);
    let viewedIds = [], recent = [];
    try { viewedIds = JSON.parse(localStorage.getItem("test_store_viewed") || "[]"); } catch (e) {}
    try { recent = JSON.parse(localStorage.getItem("test_store_searches") || "[]"); } catch (e) {}
    this.setState({ ready: true, cart: S.cartService.load(), viewedIds, recent }, () => this.onHash());
    this.timer = setInterval(() => {
      if (this.state.route.name === "home" && !this.state.heroPaused && !document.hidden) {
        this.setState((s) => ({ hero: (s.hero + 1) % S.heroSlides.length }));
      }
    }, 6500);
  }

  componentWillUnmount() {
    clearInterval(this.timer); clearTimeout(this.sugTimer); clearTimeout(this.toastTimer);
    window.removeEventListener("hashchange", this.onHash);
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("keydown", this.onKey);
  }

  onScroll() {
    const s = window.scrollY > 40;
    if (s !== this.state.scrolled) this.setState({ scrolled: s });
  }

  onKey(e) {
    if (e.key === "Escape") this.closeAll();
  }

  closeAll = () => {
    this.setState({ cartOpen: false, navOpen: false, searchOpen: false, filtersOpen: false, mega: false, quick: null, searchFocused: false });
    if (this.lastFocus && this.lastFocus.focus) { try { this.lastFocus.focus(); } catch (e) {} this.lastFocus = null; }
  };
  closeAllH = () => { this.setState({ cartOpen: false, navOpen: false, searchOpen: false, filtersOpen: false, mega: false, quick: null, searchFocused: false }); };
  remember() { this.lastFocus = document.activeElement; }

  // ── routing ────────────────────────────────────────────────
  onHash() {
    const raw = (location.hash || "#/").replace(/^#/, "");
    const parts = raw.split("/").filter(Boolean);
    const name = parts[0] || "home";
    const param = parts[1] || "";
    const route = { name: name === "" ? "home" : name, param: parts[0] === "tools" ? (parts[1] || "calculator") : param };
    this.setState({ route, mega: false, navOpen: false, cartOpen: false, quick: null, searchOpen: false, order: name === "checkout" ? this.state.order : null }, () => {
      window.scrollTo({ top: 0, behavior: "auto" });
      this.loadRoute(route);
    });
  }

  async loadRoute(r) {
    if (r.name === "home") {
      const blocks = S.showcaseBlocks;
      const [kits, nw, best, sc0, sc1] = await Promise.all([
        S.productsService.list({ cats: ["starter-kits"] }), S.productsService.newest(8), S.productsService.best(8),
        S.productsService.byCategory(blocks[0].catSlug, 4), S.productsService.byCategory(blocks[1].catSlug, 4),
      ]);
      this.setState({ homeKits: kits.slice(0, 8), homeNew: nw, homeBest: best.slice(0, 8), sc: [sc0, sc1] });
    } else if (["shop", "category", "offers", "search"].includes(r.name)) {
      const fCats = r.name === "category" ? [r.param] : [];
      this.setState({ fCats, fOffers: r.name === "offers", shown: 8, listLoading: true }, () => this.runQuery());
    } else if (r.name === "product") {
      this.setState({ listLoading: true });
      const p = await S.productsService.bySlug(r.param);
      if (!p) { this.setState({ product: null }); return; }
      const related = await S.productsService.related(p, 4);
      const viewedIds = [p.id].concat((this.state.viewedIds || []).filter((i) => i !== p.id)).slice(0, 8);
      try { localStorage.setItem("test_store_viewed", JSON.stringify(viewedIds)); } catch (e) {}
      this.setState({ product: p, related, pImg: 0, pQty: 1, pTab: "desc", pVar: p.variation ? p.variation.options[0] : "", viewedIds });
    } else if (r.name === "blog" && r.param) {
      this.setState({ article: await S.contentService.article(r.param) });
    } else if (["about", "privacy-policy", "return-policy", "terms"].includes(r.name)) {
      this.setState({ page: await S.contentService.page(r.name) });
    }
  }

  async runQuery() {
    const s = this.state;
    const items = await S.productsService.list({
      cats: s.fCats, maxPrice: s.fMax, onlyOffers: s.fOffers, inStock: s.fStock, sort: s.sort,
      q: s.route.name === "search" ? s.q : "",
    });
    this.setState({ listItems: items, listLoading: false });
  }

  refresh = () => { this.setState({ listLoading: true, shown: 8 }, () => this.runQuery()); };

  // ── cart ───────────────────────────────────────────────────
  persist(cart) { S.cartService.save(cart); }

  add = (p, qty, variation) => {
    const unit = p.sale || p.price;
    const key = p.id + "|" + (variation || "");
    const cart = this.state.cart.slice();
    const i = cart.findIndex((x) => x.key === key);
    if (i > -1) cart[i] = Object.assign({}, cart[i], { qty: cart[i].qty + (qty || 1) });
    else cart.push({ key, id: p.id, slug: p.slug, name: p.name, unit, bg: p.bg, variation: variation || "", qty: qty || 1 });
    this.persist(cart);
    this.setState((st) => ({ cart, bump: st.bump + 1 }));
    this.toast("تمت إضافة «" + (p.name.length > 34 ? p.name.slice(0, 34) + "…" : p.name) + "» إلى العربة");
  };

  setQty(key, delta) {
    let cart = this.state.cart.map((x) => (x.key === key ? Object.assign({}, x, { qty: Math.max(1, x.qty + delta) }) : x));
    this.persist(cart); this.setState({ cart });
  }
  removeItem(key) {
    const cart = this.state.cart.filter((x) => x.key !== key);
    this.persist(cart); this.setState({ cart });
  }
  toast(msg) {
    clearTimeout(this.toastTimer);
    this.setState({ toast: msg });
    this.toastTimer = setTimeout(() => this.setState({ toast: null }), 3600);
  }

  totals() {
    const area = (S.deliveryAreas.find((a) => a.id === Number(this.state.ck.city)) || {}).price;
    return S.cartService.totals(this.state.cart, this.state.couponApplied, area);
  }

  // ── search ─────────────────────────────────────────────────
  onQ = (e) => {
    const q = e.target.value;
    this.setState({ q, sugTried: false });
    clearTimeout(this.sugTimer);
    this.sugTimer = setTimeout(async () => {
      const sug = await S.searchService.suggest(q);
      this.setState({ sug, sugTried: q.trim().length >= 2 });
      if (this.state.route.name === "search") this.runQuery();
    }, 260);
  };

  submitSearch = (e) => {
    e.preventDefault();
    const q = this.state.q.trim();
    if (!q) return;
    const recent = [q].concat(this.state.recent.filter((r) => r !== q)).slice(0, 5);
    try { localStorage.setItem("test_store_searches", JSON.stringify(recent)); } catch (er) {}
    this.setState({ recent, searchOpen: false, searchFocused: false }, () => {
      location.hash = "#/search";
      this.setState({ listLoading: true }, () => this.runQuery());
    });
  };

  // ── checkout ───────────────────────────────────────────────
  validate() {
    const c = this.state.ck, e = {};
    if (!c.name || c.name.trim().length < 3) e.name = "الرجاء إدخال الاسم الكامل";
    if (!/^0?5\d{8}$|^\d{9,10}$/.test(String(c.phone).replace(/[\s-]/g, ""))) e.phone = "رقم هاتف غير صالح — مثال 0591234567";
    if (!c.address || c.address.trim().length < 6) e.address = "الرجاء إدخال عنوان واضح";
    if (!c.terms) e.terms = "يجب الموافقة على الشروط قبل إتمام الطلب";
    return e;
  }

  placeOrder = async (e) => {
    e.preventDefault();
    const errs = this.validate();
    this.setState({ ckErrors: errs });
    if (Object.keys(errs).length) return;
    this.setState({ placing: true });
    const res = await S.ordersService.place({ customer: this.state.ck, items: this.state.cart, totals: this.totals() });
    this.persist([]);
    this.setState({ placing: false, order: res, cart: [], couponApplied: "", coupon: "", couponMsg: "" });
  };

  applyCoupon = () => {
    const code = this.state.coupon.trim().toUpperCase();
    if (S.coupons[code]) this.setState({ couponApplied: code, couponMsg: "تم تطبيق " + S.coupons[code].label, couponOk: true });
    else this.setState({ couponApplied: "", couponMsg: "الكود غير صالح أو منتهي الصلاحية", couponOk: false });
  };

  doTrack = async (e) => {
    e.preventDefault();
    this.setState({ trackLoading: true, trackRes: null });
    const res = await S.ordersService.track(this.state.trackId);
    this.setState({ trackLoading: false, trackRes: res });
  };

  // ── decorate ───────────────────────────────────────────────
  deco = (p) => {
    if (!p) return null;
    const sale = !!p.sale, eff = sale ? p.sale : p.price, out = p.stock === 0;
    return {
      ...p,
      href: "#/product/" + p.slug,
      go: () => this.closeAllH(),
      hasSale: sale, priceText: money(eff), oldText: money(p.price),
      discountText: sale ? "خصم " + Math.round((1 - p.sale / p.price) * 100) + "٪" : "",
      savedText: sale ? money(p.price - p.sale) : "",
      ratingText: p.rating.toFixed(1), reviewsText: "(" + p.reviews + ")",
      reviewsFull: p.reviews + " تقييماً",
      soldOut: out,
      add: () => { if (!out) this.add(p, 1, p.variation ? p.variation.options[0] : ""); },
      quick: () => { this.remember(); this.setState({ quick: p, qQty: 1 }); },
      wish: (e) => { e.preventDefault(); e.stopPropagation(); this.toast("أُضيف «" + p.name.slice(0, 24) + "…» إلى المفضلة"); },
      btnBg: out ? "#F4F1EC" : "#ffffff",
      btnColor: out ? "#A39C90" : "#1F4E4A",
      btnBorder: out ? "#E9E3DA" : "#1F4E4A",
      btnCursor: out ? "not-allowed" : "pointer",
      btnHover: out ? "" : "background:#1F4E4A;color:#ffffff",
      btnLabel: out ? "غير متوفر" : "أضف إلى العربة",
      btnIcon: out ? "✕" : "+",
    };
  };

  renderVals() {
    const s = this.state;
    const cfg = S.config;
    const cats = S.categories;
    const t = this.totals();
    const count = s.cart.reduce((a, i) => a + i.qty, 0);
    const dec = this.deco;
    const countOf = (slug) => S.products.filter((p) => p.category === slug).length;
    const childrenOf = (c) => (c.subs && c.subs.length ? c.subs : ["كل منتجات " + c.name]).map((label) => ({ label, href: "#/category/" + c.slug }));
    const catBg = S.catBg;
    const catList = cats.map((c) => ({
      ...c, href: "#/category/" + c.slug, bg: catBg[c.slug], count: countOf(c.slug), countText: countOf(c.slug) + " منتجاً",
      children: childrenOf(c),
      open: s.navOpenCat === c.slug, rotate: s.navOpenCat === c.slug ? "180deg" : "0deg",
      expand: () => this.setState({ navOpenCat: s.navOpenCat === c.slug ? null : c.slug }),
    }));

    const r = s.route;
    const isListing = ["shop", "category", "offers", "search"].includes(r.name);
    const curCat = r.name === "category" ? cats.find((c) => c.slug === r.param) : null;
    const listTitle = r.name === "category" ? (curCat ? curCat.name : "القسم") : r.name === "offers" ? "العروض" : r.name === "search" ? "نتائج البحث" : "كل المنتجات";
    const visible = s.listItems.slice(0, s.shown);
    const pd = this.deco(s.product);
    if (pd) {
      pd.catHref = "#/category/" + pd.category;
      pd.activeImg = pd.gallery[s.pImg] || pd.bg;
      pd.thumbs = pd.gallery.map((g, i) => ({ bg: g, border: i === s.pImg ? "#1F4E4A" : "#E9E3DA", label: "صورة " + (i + 1), pick: () => this.setState({ pImg: i }) }));
      pd.stockText = pd.soldOut ? "غير متوفر" : pd.stock < 5 ? "متبقٍ " + pd.stock + " قطع فقط" : "متوفر في المخزون";
      pd.stockColor = pd.soldOut ? "#C0392B" : pd.stock < 5 ? "#B8860B" : "#2E7D5B";
      pd.hasVariation = !!pd.variation;
      pd.varLabel = pd.variation ? pd.variation.label : "";
      pd.varOptions = pd.variation ? pd.variation.options.map((o) => ({
        label: o, border: s.pVar === o ? "#1F4E4A" : "#E1DACE", bg: s.pVar === o ? "#1F4E4A" : "#fff", color: s.pVar === o ? "#fff" : "#4A453E",
        pick: () => this.setState({ pVar: o }),
      })) : [];
      pd.specs = pd.specs.map((x) => ({ k: x[0], v: x[1] }));
      pd.mainBtnBg = pd.soldOut ? "#B7B1A7" : "#1F4E4A";
      pd.mainBtnHover = pd.soldOut ? "" : "background:#163A37";
      pd.mainBtnLabel = pd.soldOut ? "غير متوفر حالياً" : "أضف إلى العربة — " + money((pd.sale || pd.price) * s.pQty);
      pd.reviewList = [
        { initial: "س", name: "سارة م.", stars: "★★★★★", date: "قبل ٦ أيام", text: "جودة ممتازة والتغليف كان محكماً. النتيجة صافية تماماً من أول محاولة والدعم ساعدني في اختيار الكمية." },
        { initial: "خ", name: "خالد ع.", stars: "★★★★☆", date: "قبل أسبوعين", text: "المنتج ممتاز، التوصيل تأخر يوماً واحداً عن الموعد لكن خدمة العملاء تابعت الموضوع باستمرار." },
      ];
    }

    const artList = S.articles.map((a) => ({ ...a, href: "#/blog/" + a.slug }));
    const sc = (i) => {
      const b = S.showcaseBlocks[i];
      if (!b) return { items: [] };
      return { ...b, href: "#/category/" + b.catSlug, items: (s.sc[i] || []).map(this.deco) };
    };
    const c = s.calc;
    const vol = (c.shape === "round" ? Math.PI * Math.pow(Number(c.dia) / 2, 2) : Math.pow(Number(c.side), 2)) * Number(c.height) * Number(c.layers || 1);
    const grams = vol * 1.1 * 1.1;
    const wa = "https://wa.me/" + String(cfg.whatsapp).replace(/\D/g, "") + "?text=" + encodeURIComponent("مرحباً، لدي استفسار عن منتج في متجر TEST");

    const areas = S.deliveryAreas.map((a) => ({ ...a, priceText: money(a.price), optionLabel: a.name + " — " + money(a.price) + " · " + a.eta }));

    return {
      // shell
      ready: s.ready, announce: s.announce, announceText: cfg.announcement,
      hideAnnounce: () => this.setState({ announce: false }),
      hdrShadow: s.scrolled ? "0 6px 22px rgba(30,27,24,.09)" : "0 0 0 rgba(0,0,0,0)",
      phone: cfg.phone, whatsapp: cfg.whatsapp, hours: cfg.hours, location: cfg.location,
      instagram: cfg.instagram, facebook: cfg.facebook, waHref: wa,
      categories: catList, megaCats: catList.slice(0, 8),
      sideBanners: S.promoBanners.side,
      navLinks: S.navLinks.map((l) => ({ ...l, active: l.href === "#/" + (r.name === "home" ? "" : r.name) ? 1 : 0, weight: l.href === "#/" + (r.name === "home" ? "" : r.name) ? 800 : 600, color: l.href === "#/" + (r.name === "home" ? "" : r.name) ? "#1F4E4A" : "#4A453E" })),
      trustFeatures: S.trustFeatures.map((f) => ({ ...f, glyph: { truck: "⛟", wallet: "₪", refresh: "↺", headset: "☏" }[f.icon] || "✦" })),
      footerCols: Object.keys(S.footerLinks).map((k) => ({ title: S.footerLinks[k].title, items: S.footerLinks[k].items.map((i) => ({ label: i[0], href: i[1] })) })),
      instaTiles: Object.keys(catBg).map((k) => ({ bg: catBg[k] })),

      // header actions
      mega: s.mega, megaBg: s.mega ? "#163A37" : "#1F4E4A", megaColor: "#fff",
      toggleMega: () => this.setState({ mega: !s.mega }),
      openNav: () => { this.remember(); this.setState({ navOpen: true }); },
      openCart: () => { this.remember(); this.setState({ cartOpen: true, toast: null }); },
      openSearch: () => { this.remember(); this.setState({ searchOpen: true }); },
      openFilters: () => { this.remember(); this.setState({ filtersOpen: true }); },
      closeAll: this.closeAll, closeAllH: this.closeAllH,
      searchRef: (el) => { if (el && !this._focused) { this._focused = true; setTimeout(() => el.focus(), 60); } if (!el) this._focused = false; },
      navOpen: s.navOpen, cartOpen: s.cartOpen, searchOpen: s.searchOpen, filtersOpen: s.filtersOpen,
      anyOverlay: s.cartOpen || s.navOpen || s.filtersOpen || !!s.quick || s.searchOpen,
      cartCount: count, cartTotalText: money(t.subtotal),
      bump: s.bump, badgeAnim: s.bump ? "pulse .4s ease" : "none",

      // search
      q: s.q, onQ: this.onQ, submitSearch: this.submitSearch,
      focusSearch: () => this.setState({ searchFocused: true }),
      showSug: s.searchFocused && (s.q.trim().length >= 2 || s.recent.length > 0),
      sugProducts: (s.sug.products || []).map(dec),
      sugCats: (s.sug.cats || []).map((c) => ({ ...c, href: "#/category/" + c.slug })),
      sugEmpty: s.sugTried && !(s.sug.products || []).length && !(s.sug.cats || []).length,
      showRecent: s.q.trim().length < 2 && s.recent.length > 0,
      recentSearches: s.recent.map((text) => ({ text, run: () => this.setState({ q: text }, () => { location.hash = "#/search"; this.setState({ listLoading: true }, () => this.runQuery()); }) })),

      // routes
      isHome: r.name === "home", isListing, isProduct: r.name === "product" && !!pd,
      isCart: r.name === "cart", isCheckout: r.name === "checkout",
      isAuth: r.name === "login" || r.name === "register", isAccount: r.name === "account",
      isTrack: r.name === "track-order", isBlog: r.name === "blog" && !r.param,
      isArticle: r.name === "blog" && !!s.article, isStatic: ["about", "privacy-policy", "return-policy", "terms"].includes(r.name) && !!s.page,
      isContact: r.name === "contact", isCalc: r.name === "tools",

      // hero
      heroSlides: S.heroSlides.map((h, i) => ({ ...h, opacity: i === s.hero ? 1 : 0, events: i === s.hero ? "auto" : "none" })),
      heroDots: S.heroSlides.map((h, i) => ({ go: () => this.setState({ hero: i }), label: "الشريحة " + (i + 1), w: i === s.hero ? "30px" : "8px", bg: i === s.hero ? "#C9A24B" : "rgba(255,255,255,.5)" })),
      heroPrev: () => this.setState((st) => ({ hero: (st.hero + S.heroSlides.length - 1) % S.heroSlides.length })),
      heroNext: () => this.setState((st) => ({ hero: (st.hero + 1) % S.heroSlides.length })),
      pauseHero: () => this.setState({ heroPaused: true }), resumeHero: () => this.setState({ heroPaused: false }),

      // home data
      homeKits: s.homeKits.map((p) => ({ ...dec(p), contents: S.kitContentsFor(p.name) })),
      homeNew: s.homeNew.map(dec), homeBest: s.homeBest.map(dec),
      homeTabs: [["new", "منتجات جديدة"], ["best", "الأكثر مبيعاً"]].map(([k, label]) => ({
        label, active: s.homeTab === k ? 1 : 0, weight: s.homeTab === k ? 800 : 600,
        color: s.homeTab === k ? "#1E1B18" : "#9C958A", pick: () => this.setState({ homeTab: k }),
      })),
      homeTabItems: (s.homeTab === "new" ? s.homeNew : s.homeBest).map(dec),
      homeTabHref: s.homeTab === "new" ? "#/shop" : "#/offers",
      sc1Items: sc(0).items, sc2Items: sc(1).items,
      articles: artList,

      // listing
      listTitle,
      listSubtitle: r.name === "search" ? "بحثت عن: «" + s.q + "»" : curCat ? curCat.desc || "تصفّح كل منتجات " + curCat.name : r.name === "offers" ? "منتجات مختارة بأسعار مخفّضة لفترة محدودة" : "تصفّح كل مستلزمات الريزن والشموع",
      listItems: visible.map(dec), listLoading: s.listLoading,
      listEmpty: !s.listLoading && s.listItems.length === 0,
      skeletons: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ i })),
      resultCount: s.listItems.length + " منتجاً", resultNum: s.listItems.length,
      hasMore: !s.listLoading && s.listItems.length > s.shown,
      remainingCount: Math.max(0, s.listItems.length - s.shown),
      loadMore: () => this.setState({ shown: s.shown + 8 }),
      sort: s.sort, onSort: (e) => this.setState({ sort: e.target.value }, this.refresh),
      fMax: s.fMax, fMaxText: money(s.fMax), onMax: (e) => this.setState({ fMax: Number(e.target.value) }, this.refresh),
      fOffers: s.fOffers, toggleOffers: () => this.setState({ fOffers: !s.fOffers }, this.refresh),
      fStock: s.fStock, toggleStock: () => this.setState({ fStock: !s.fStock }, this.refresh),
      filterCats: cats.map((c) => ({ name: c.name, count: countOf(c.slug), checked: s.fCats.includes(c.slug), toggle: () => this.setState({ fCats: s.fCats.includes(c.slug) ? s.fCats.filter((x) => x !== c.slug) : s.fCats.concat(c.slug) }, this.refresh) })),
      resetFilters: () => this.setState({ fCats: [], fMax: 400, fOffers: false, fStock: false, sort: "featured" }, this.refresh),

      // pdp
      pd, related: s.related.map(dec), pQty: s.pQty,
      qtyUp: () => this.setState({ pQty: s.pQty + 1 }), qtyDown: () => this.setState({ pQty: Math.max(1, s.pQty - 1) }),
      addFromPdp: () => { if (s.product && s.product.stock > 0) this.add(s.product, s.pQty, s.pVar); },
      pdpTabs: [["desc", "الوصف"], ["specs", "المواصفات"], ["reviews", "التقييمات"], ["shipping", "الشحن والإرجاع"]].map(([k, label]) => ({
        label, active: s.pTab === k ? 1 : 0, weight: s.pTab === k ? 800 : 600, color: s.pTab === k ? "#1F4E4A" : "#7C766D", pick: () => this.setState({ pTab: k }),
      })),
      tabDesc: s.pTab === "desc", tabSpecs: s.pTab === "specs", tabReviews: s.pTab === "reviews", tabShipping: s.pTab === "shipping",
      areas,
      viewed: (s.viewedIds || []).map((id) => S.products.find((p) => p.id === id)).filter(Boolean).filter((p) => !s.product || p.id !== s.product.id).map(dec),
      showViewed: (r.name === "product" || r.name === "cart") && (s.viewedIds || []).length > 1,

      // cart
      cartRows: s.cart.map((i) => ({
        ...i, href: "#/product/" + i.slug, unitText: money(i.unit), lineText: money(i.unit * i.qty),
        varText: i.variation ? "الخيار: " + i.variation : "الخيار الافتراضي",
        inc: () => this.setQty(i.key, 1), dec: () => this.setQty(i.key, -1), remove: () => this.removeItem(i.key),
      })),
      cartEmpty: s.cart.length === 0, cartHasItems: s.cart.length > 0,
      cartLineText: count === 0 ? "لا توجد منتجات في العربة" : count + " منتجاً في عربتك",
      subtotalText: money(t.subtotal), discountText: money(t.discount), hasDiscount: t.discount > 0,
      couponLabel: t.coupon ? t.coupon.label : "",
      shippingText: t.shipping === 0 ? "مجاني" : money(t.shipping), totalText: money(t.total),
      freeShipHint: t.subtotal >= cfg.freeShippingOver ? "مبروك — حصلت على توصيل مجاني" : "أضف " + money(cfg.freeShippingOver - t.subtotal) + " للحصول على توصيل مجاني",
      coupon: s.coupon, onCoupon: (e) => this.setState({ coupon: e.target.value }),
      applyCoupon: this.applyCoupon, couponMsg: s.couponMsg, couponMsgColor: s.couponOk ? "#2E7D5B" : "#C0392B",

      // checkout
      ck: s.ck, err: {
        name: s.ckErrors.name, phone: s.ckErrors.phone, address: s.ckErrors.address, terms: s.ckErrors.terms,
        nameBorder: s.ckErrors.name ? "#C0392B" : "#E1DACE", phoneBorder: s.ckErrors.phone ? "#C0392B" : "#E1DACE", addressBorder: s.ckErrors.address ? "#C0392B" : "#E1DACE",
      },
      setName: (e) => this.setState({ ck: { ...s.ck, name: e.target.value } }),
      setPhone: (e) => this.setState({ ck: { ...s.ck, phone: e.target.value } }),
      setCity: (e) => this.setState({ ck: { ...s.ck, city: Number(e.target.value) } }),
      setAddress: (e) => this.setState({ ck: { ...s.ck, address: e.target.value } }),
      setNotes: (e) => this.setState({ ck: { ...s.ck, notes: e.target.value } }),
      setTerms: () => this.setState({ ck: { ...s.ck, terms: !s.ck.terms } }),
      payments: [
        { key: "cod", label: "الدفع عند الاستلام", desc: "ادفع نقداً للمندوب عند التسليم" },
        { key: "card", label: "بطاقة ائتمان", desc: "يتم التحويل لصفحة الدفع الآمنة عند الربط" },
        { key: "transfer", label: "تحويل بنكي", desc: "نرسل تفاصيل الحساب بعد تأكيد الطلب" },
      ].map((p) => ({ ...p, checked: s.ck.payment === p.key, border: s.ck.payment === p.key ? "#1F4E4A" : "#E9E3DA", bg: s.ck.payment === p.key ? "#F3F7F6" : "#fff", pick: () => this.setState({ ck: { ...s.ck, payment: p.key } }) })),
      placeOrder: this.placeOrder, placing: s.placing, placingOpacity: s.placing ? 0.75 : 1,
      placeLabel: s.placing ? "جارٍ إرسال الطلب…" : "تأكيد الطلب — " + money(t.total),
      areaName: (areas.find((a) => a.id === Number(s.ck.city)) || { name: "" }).name,
      orderDone: !!s.order, checkoutForm: !s.order,
      orderId: s.order ? s.order.id : "", orderEta: s.order ? s.order.eta : "",

      // auth
      auth: s.auth, isRegister: s.authTab === "register", authError: s.authError,
      authErrBorder: s.authError ? "#C0392B" : "#E1DACE",
      authCta: s.authTab === "login" ? "تسجيل الدخول" : "إنشاء الحساب",
      loginTabBg: s.authTab === "login" ? "#fff" : "transparent", loginTabColor: s.authTab === "login" ? "#1F4E4A" : "#7C766D",
      regTabBg: s.authTab === "register" ? "#fff" : "transparent", regTabColor: s.authTab === "register" ? "#1F4E4A" : "#7C766D",
      tabLogin: () => this.setState({ authTab: "login", authError: "" }), tabRegister: () => this.setState({ authTab: "register", authError: "" }),
      setAuthName: (e) => this.setState({ auth: { ...s.auth, name: e.target.value } }),
      setAuthId: (e) => this.setState({ auth: { ...s.auth, id: e.target.value } }),
      setAuthPass: (e) => this.setState({ auth: { ...s.auth, pass: e.target.value } }),
      submitAuth: (e) => {
        e.preventDefault();
        if (!s.auth.id.trim() || s.auth.pass.length < 6) { this.setState({ authError: "أدخل رقم هاتف صحيح وكلمة مرور من ٦ أحرف على الأقل" }); return; }
        this.setState({ authError: "" });
        this.toast(s.authTab === "login" ? "تم تسجيل الدخول (واجهة تجريبية)" : "تم إنشاء الحساب (واجهة تجريبية)");
        location.hash = "#/account";
      },

      // contact / newsletter
      contact: s.contact,
      setContactName: (e) => this.setState({ contact: { ...s.contact, name: e.target.value } }),
      setContactPhone: (e) => this.setState({ contact: { ...s.contact, phone: e.target.value } }),
      setContactMsg: (e) => this.setState({ contact: { ...s.contact, msg: e.target.value } }),
      submitContact: (e) => { e.preventDefault(); this.setState({ contact: { name: "", phone: "", msg: "" } }); this.toast("تم إرسال رسالتك — سنرد خلال ساعتين"); },
      news: s.news, setNews: (e) => this.setState({ news: e.target.value }),
      submitNewsletter: (e) => { e.preventDefault(); if (!s.news.includes("@")) { this.toast("أدخل بريداً إلكترونياً صحيحاً"); return; } this.setState({ news: "" }); this.toast("تم الاشتراك — كود الخصم TEST10 في انتظارك"); },

      // track
      trackId: s.trackId, setTrackId: (e) => this.setState({ trackId: e.target.value }),
      doTrack: this.doTrack, trackLabel: s.trackLoading ? "جارٍ البحث…" : "تتبّع",
      trackError: s.trackRes && !s.trackRes.ok ? s.trackRes.error : "",
      trackOk: !!(s.trackRes && s.trackRes.ok), trackNum: s.trackRes && s.trackRes.ok ? s.trackRes.id : "",
      trackSteps: s.trackRes && s.trackRes.ok ? s.trackRes.steps.map(([title, time, done]) => ({ title, time, mark: done ? "✓" : "•", dotBg: done ? "#2E7D5B" : "#EDE8E0", dotColor: done ? "#fff" : "#A39C90", titleColor: done ? "#1E1B18" : "#9C958A" })) : [],

      // blog / static
      art: s.article || {}, page: s.page ? { ...s.page, body: s.page.body.map((text) => ({ text })) } : { body: [] },

      // quick view
      quick: this.deco(s.quick) || {}, quickOpen: !!s.quick, qQty: s.qQty,
      qQtyUp: () => this.setState({ qQty: s.qQty + 1 }), qQtyDown: () => this.setState({ qQty: Math.max(1, s.qQty - 1) }),
      addFromQuick: () => { if (s.quick) { this.add(s.quick, s.qQty, s.quick.variation ? s.quick.variation.options[0] : ""); this.setState({ quick: null }); } },

      // calculator
      calc: s.calc, isRound: s.calc.shape === "round", isSquare: s.calc.shape === "square",
      roundBg: s.calc.shape === "round" ? "#fff" : "transparent", roundColor: s.calc.shape === "round" ? "#1F4E4A" : "#7C766D",
      squareBg: s.calc.shape === "square" ? "#fff" : "transparent", squareColor: s.calc.shape === "square" ? "#1F4E4A" : "#7C766D",
      calcRound: () => this.setState({ calc: { ...s.calc, shape: "round" } }), calcSquare: () => this.setState({ calc: { ...s.calc, shape: "square" } }),
      setDia: (e) => this.setState({ calc: { ...s.calc, dia: e.target.value } }),
      setSide: (e) => this.setState({ calc: { ...s.calc, side: e.target.value } }),
      setHeight: (e) => this.setState({ calc: { ...s.calc, height: e.target.value } }),
      setLayers: (e) => this.setState({ calc: { ...s.calc, layers: e.target.value } }),
      calcTotal: (grams > 0 ? Math.round(grams) : 0) + " غم",
      calcResin: Math.round(grams * 2 / 3) + " غم", calcHard: Math.round(grams / 3) + " غم",
      calcVol: Math.round(vol) + " سم³",

      toast: s.toast,
    };
  }

  render() {
    const v = this.renderVals();
    return (
      <div style={sx`direction:rtl;background:#FBF9F6;min-height:100vh;display:flex;flex-direction:column`}>
        <Header v={v} />
        <main style={sx`flex:1`}>
          {v.isHome && <HomeTop v={v} />}
          {v.isListing && <ListingPage v={v} />}
          {v.isProduct && <ProductPage v={v} />}
          {v.showViewed && <ViewedSection v={v} />}
          {v.isCart && <CartPage v={v} />}
          {v.isCheckout && <CheckoutPage v={v} />}
          {v.isAuth && <AuthPage v={v} />}
          {v.isAccount && <AccountPage v={v} />}
          {v.isTrack && <TrackPage v={v} />}
          {v.isBlog && <BlogPage v={v} />}
          {v.isArticle && <ArticlePage v={v} />}
          {v.isStatic && <StaticPage v={v} />}
          {v.isContact && <ContactPage v={v} />}
          {v.isCalc && <CalculatorPage v={v} />}
          <TrustStrip v={v} />
          {v.isHome && <HomeBottom v={v} />}
        </main>
        <Footer v={v} />
        <Overlays v={v} />
      </div>
    );
  }
}
