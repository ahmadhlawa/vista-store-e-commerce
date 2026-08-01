import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { HomeBottom, HomeTop, TrustStrip } from "../components/Home.jsx";
import { catalogService } from "../services/catalog.js";
import { storefrontService } from "../services/storefront.js";

const SECTION = {
  FEATURED: "featured_products",
  NEW: "new_products",
  BEST: "bestsellers",
  PACKAGES: "packages",
  MOLDS: "silicone_molds",
  CATEGORIES: "categories",
  PROMO: "promo_banner",
  TEXT: "custom_text",
};

const SHOWCASE_BACKGROUNDS = [
  "linear-gradient(150deg,#1f4e4a,#3d7d75)",
  "linear-gradient(150deg,#4a3527,#8a6237)",
];

const emptyPage = { items: [], total: 0 };

/** The homepage is composed from the admin-managed home sections. */
export default function HomePage() {
  const shell = useOutletContext();
  const [heroSlides, setHeroSlides] = useState([]);
  const [sections, setSections] = useState({ sections: [], byType: {} });
  const [packages, setPackages] = useState(emptyPage);
  const [molds, setMolds] = useState(emptyPage);
  const [featured, setFeatured] = useState(emptyPage);
  const [newest, setNewest] = useState(emptyPage);
  const [best, setBest] = useState(emptyPage);
  const [articles, setArticles] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [tab, setTab] = useState("new");
  const timer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled([
        storefrontService.heroSlides(),
        storefrontService.homeSections(),
        catalogService.packages({ page_size: 8 }),
        catalogService.molds({ page_size: 4 }),
        catalogService.featured(8),
        catalogService.newest(8),
        catalogService.bestsellers(8),
        storefrontService.articles({ page_size: 4 }),
      ]);
      if (cancelled) return;
      const value = (index, fallback) =>
        results[index].status === "fulfilled" ? results[index].value : fallback;
      setHeroSlides(value(0, []));
      setSections(value(1, { sections: [], byType: {} }));
      setPackages(value(2, emptyPage));
      setMolds(value(3, emptyPage));
      setFeatured(value(4, emptyPage));
      setNewest(value(5, emptyPage));
      setBest(value(6, emptyPage));
      setArticles(value(7, { items: [] }).items);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (heroSlides.length < 2) return undefined;
    timer.current = setInterval(() => {
      if (!heroPaused && !document.hidden) {
        setHeroIndex((index) => (index + 1) % heroSlides.length);
      }
    }, 6500);
    return () => clearInterval(timer.current);
  }, [heroPaused, heroSlides.length]);

  const visible = (type) => !!sections.byType[type];
  const titleOf = (type, fallback) => sections.byType[type]?.title || fallback;
  const descOf = (type, fallback) => sections.byType[type]?.description || fallback;

  const showcases = useMemo(() => {
    const blocks = [];
    if (visible(SECTION.MOLDS) && molds.items.length) {
      blocks.push({
        key: "molds",
        title: titleOf(SECTION.MOLDS, "قوالب سيليكون"),
        bannerTitle: titleOf(SECTION.MOLDS, "قوالب سيليكون"),
        bannerDesc: descOf(SECTION.MOLDS, ""),
        bannerCta: "تصفّح كل القوالب",
        href: "/molds",
        bg: SHOWCASE_BACKGROUNDS[0],
        items: molds.items.map(shell.deco),
      });
    }
    if (visible(SECTION.FEATURED) && featured.items.length) {
      blocks.push({
        key: "featured",
        title: titleOf(SECTION.FEATURED, "منتجات مختارة"),
        bannerTitle: titleOf(SECTION.FEATURED, "منتجات مختارة"),
        bannerDesc: descOf(SECTION.FEATURED, ""),
        bannerCta: "تصفّح المنتجات",
        href: "/shop",
        bg: SHOWCASE_BACKGROUNDS[1],
        items: featured.items.slice(0, 4).map(shell.deco),
      });
    }
    return blocks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [molds, featured, sections, shell.deco]);

  const homeTabs = [];
  if (visible(SECTION.NEW)) homeTabs.push({ key: "new", label: titleOf(SECTION.NEW, "منتجات جديدة") });
  if (visible(SECTION.BEST)) homeTabs.push({ key: "best", label: titleOf(SECTION.BEST, "الأكثر مبيعاً") });
  const activeTab = homeTabs.some((entry) => entry.key === tab) ? tab : homeTabs[0]?.key;

  const textSection = sections.byType[SECTION.TEXT];

  const v = {
    ...shell,
    showHero: heroSlides.length > 0,
    heroSlides: heroSlides.map((slide, index) => ({
      ...slide,
      opacity: index === heroIndex ? 1 : 0,
      events: index === heroIndex ? "auto" : "none",
    })),
    heroDots: heroSlides.map((slide, index) => ({
      go: () => setHeroIndex(index),
      label: `الشريحة ${index + 1}`,
      w: index === heroIndex ? "30px" : "8px",
      bg: index === heroIndex ? "#C9A24B" : "rgba(255,255,255,.5)",
    })),
    heroPrev: () => setHeroIndex((index) => (index + heroSlides.length - 1) % heroSlides.length),
    heroNext: () => setHeroIndex((index) => (index + 1) % heroSlides.length),
    pauseHero: () => setHeroPaused(true),
    resumeHero: () => setHeroPaused(false),

    showCategories: visible(SECTION.CATEGORIES) && shell.categories.length > 0,
    categoriesTitle: titleOf(SECTION.CATEGORIES, "أقسام منتجاتنا"),
    categoriesEyebrow: descOf(SECTION.CATEGORIES, "تسوّق حسب القسم"),
    homeCategories: shell.categories.slice(
      0,
      sections.byType[SECTION.CATEGORIES]?.config?.limit || 12,
    ),

    showPackages: visible(SECTION.PACKAGES) && packages.items.length > 0,
    packagesTitle: titleOf(SECTION.PACKAGES, "البكجات"),
    packagesEyebrow: descOf(SECTION.PACKAGES, "ابدأ من هنا"),
    homeKits: packages.items.map((product) => ({
      ...shell.deco(product),
      contents: product.packageItems.slice(0, 6),
    })),

    promoTiles: visible(SECTION.PROMO)
      ? shell.sideBanners.slice(0, 2).map((banner) => ({
          id: banner.id,
          href: banner.href,
          eyebrow: banner.desc,
          title: banner.title,
          cta: banner.cta,
          bg: banner.bg,
        }))
      : [],

    showcases,

    homeTabs: homeTabs.map((entry) => ({
      ...entry,
      active: entry.key === activeTab ? 1 : 0,
      weight: entry.key === activeTab ? 800 : 600,
      color: entry.key === activeTab ? "#1E1B18" : "#9C958A",
      pick: () => setTab(entry.key),
    })),
    homeTabItems: (activeTab === "best" ? best.items : newest.items).map(shell.deco),
    homeTabHref: activeTab === "best" ? "/shop?sort=featured" : "/shop?sort=newest",

    articles: articles.map((article) => ({ ...article, href: `/blog/${article.slug}` })),
    cta: textSection
      ? {
          title: textSection.title || "تواصل معنا",
          desc: textSection.description || textSection.config?.body || "",
        }
      : null,
  };

  return (
    <>
      <HomeTop v={v} />
      <TrustStrip v={v} />
      <HomeBottom v={v} />
    </>
  );
}
