// Store identity, homepage composition and editorial content.
import { publicApi } from "../api/publicApi.js";
import { backgroundFor } from "../utils/placeholder.js";
import { formatDate, readingTime } from "../utils/format.js";

export const FALLBACK_SETTINGS = {
  store_name: "Store",
  currency_symbol: "₪",
  primary_color: "#1F4E4A",
  secondary_color: "#C9A24B",
  accent_color: "#2E7D5B",
  maintenance_mode: false,
};

export function normalizeSettings(raw) {
  const settings = { ...FALLBACK_SETTINGS, ...(raw || {}) };
  return {
    raw: settings,
    // The storefront is Arabic and RTL, so the Arabic name wins wherever the owner has
    // set one; the latin name stays the fallback.
    storeName: settings.store_name_ar || settings.store_name,
    storeNameLatin: settings.store_name,
    tagline: settings.store_tagline || "",
    logoUrl: settings.logo_url || null,
    faviconUrl: settings.favicon_url || null,
    phone: settings.phone || "",
    whatsapp: settings.whatsapp || "",
    email: settings.email || "",
    address: settings.address || "",
    locationUrl: settings.location_url || "",
    hours: settings.working_hours || "",
    announcement: settings.announcement || "",
    instagram: settings.instagram_url || "",
    facebook: settings.facebook_url || "",
    tiktok: settings.tiktok_url || "",
    youtube: settings.youtube_url || "",
    currency: settings.currency_symbol || "₪",
    currencyCode: settings.currency_code || "ILS",
    primaryColor: settings.primary_color,
    secondaryColor: settings.secondary_color,
    accentColor: settings.accent_color,
    seoTitle: settings.seo_title || settings.store_name,
    seoDescription: settings.seo_description || "",
    maintenanceMode: !!settings.maintenance_mode,
    // Blank until the owner supplies real account details. The checkout shows nothing
    // rather than inventing transfer instructions.
    manualPaymentInstructions: settings.manual_payment_instructions || "",
  };
}

export function normalizeHeroSlide(raw, index) {
  return {
    id: raw.id,
    title: raw.title,
    subtitle: raw.subtitle || "",
    desc: raw.description || "",
    cta: raw.button_label || "",
    href: raw.button_url || "/shop",
    bg: raw.image_url
      ? `linear-gradient(115deg,rgba(20,20,20,.55),rgba(20,20,20,.15)),url("${raw.image_url}") center/cover no-repeat`
      : ["linear-gradient(115deg,#1f4e4a 0%,#2f6f68 55%,#c9a24b 140%)",
         "linear-gradient(115deg,#3a2a22 0%,#7a5233 60%,#e8d8bd 150%)",
         "linear-gradient(115deg,#2b2f3a 0%,#4c5468 55%,#d3cfe2 150%)"][index % 3],
  };
}

export function normalizeBanner(raw, index) {
  return {
    id: raw.id,
    title: raw.title,
    desc: raw.subtitle || "",
    cta: raw.subtitle ? "اكتشف المزيد" : "تصفّح",
    href: raw.link_url || "/shop",
    placement: raw.placement,
    bg: raw.image_url
      ? `linear-gradient(120deg,rgba(20,20,20,.55),rgba(20,20,20,.2)),url("${raw.image_url}") center/cover no-repeat`
      : ["linear-gradient(120deg,#3a2a22,#7a5233)", "linear-gradient(120deg,#2b2f3a,#5b6478)"][
          index % 2
        ],
  };
}

export function normalizeArticle(raw) {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt || "",
    content: raw.content || "",
    cat: raw.category_label || "",
    author: raw.author_name || "",
    date: formatDate(raw.published_at),
    read: readingTime(raw.content || raw.excerpt),
    bg: backgroundFor(raw.featured_image_url, raw.slug),
    seoTitle: raw.seo_title || raw.title,
    seoDescription: raw.seo_description || raw.excerpt || "",
  };
}

export function normalizePage(raw) {
  const paragraphs = String(raw?.content || "")
    .split(/\n{2,}/)
    .map((text) => text.trim())
    .filter(Boolean);
  return {
    title: raw?.title || "",
    slug: raw?.slug || "",
    lead: raw?.lead || "",
    body: paragraphs.length ? paragraphs : [String(raw?.content || "").trim()].filter(Boolean),
  };
}

export function normalizeDeliveryArea(raw) {
  return {
    id: raw.id,
    name: raw.name,
    price: Number(raw.delivery_fee) || 0,
    freeOver: raw.free_delivery_threshold == null ? null : Number(raw.free_delivery_threshold),
    minOrder: raw.min_order_amount == null ? null : Number(raw.min_order_amount),
    eta: raw.estimated_days || "",
  };
}

export function normalizeHomeSections(rows) {
  const sections = (rows || []).map((row) => ({
    id: row.id,
    key: row.section_key,
    type: row.section_type,
    title: row.title || "",
    description: row.description || "",
    sortOrder: row.sort_order,
    config: row.config || {},
  }));
  const byType = {};
  sections.forEach((section) => {
    if (!byType[section.type]) byType[section.type] = section;
  });
  return { sections, byType };
}

export const storefrontService = {
  async settings() {
    return normalizeSettings(await publicApi.settings());
  },
  async heroSlides() {
    const rows = await publicApi.heroSlides();
    return rows.map(normalizeHeroSlide);
  },
  async banners(placement) {
    const rows = await publicApi.banners(placement);
    return rows.map(normalizeBanner);
  },
  async homeSections() {
    return normalizeHomeSections(await publicApi.homeSections());
  },
  async deliveryAreas() {
    const rows = await publicApi.deliveryAreas();
    return rows.map(normalizeDeliveryArea);
  },
  async articles(params) {
    const response = await publicApi.articles(params);
    return {
      items: (response?.items || []).map(normalizeArticle),
      total: response?.total ?? 0,
    };
  },
  async article(slug) {
    return normalizeArticle(await publicApi.article(slug));
  },
  async page(slug) {
    return normalizePage(await publicApi.page(slug));
  },
};
