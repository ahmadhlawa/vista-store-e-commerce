// ─────────────────────────────────────────────────────────────
// TEST STORE — centralized configuration + mock data + services
// Replace service bodies with FastAPI calls; UI stays untouched.
// ─────────────────────────────────────────────────────────────

import type { Article, CartItem, CartTotals, Category, Coupon, DeliveryOption, Order, OrderDraft, Product, ProductQuery, ProductVariant, SearchSuggestion, StaticPage, StoreSettings, Tone, TrackResult } from "./types/commerce";
import { isCartItem } from "./storage/cartStorage";
import { readArray, writeArray } from "./storage/safeStorage";

export const config: StoreSettings = {
  brand: { latin: "TEST", ar: "تست", tagline: "مستلزمات الريزن والشمع" },
  currency: "₪",
  phone: "00970000000000",
  whatsapp: "00970000000000",
  instagram: "[INSTAGRAM URL]",
  facebook: "[FACEBOOK URL]",
  tiktok: "[TIKTOK URL]",
  youtube: "[YOUTUBE URL]",
  location: "[LOCATION]",
  email: "info@example.com",
  freeShippingOver: 750,
  shippingFlat: 20,
  announcement: "توصيل مجاني للطلبات فوق ٧٥٠ شيكل",
  hours: "السبت – الخميس · ٩:٠٠ – ١٩:٠٠",
};

const G: Record<Tone, [string, string]> = {
  teal: ["#e8f0ef", "#c9dcd8"], sand: ["#f1ece5", "#ddd2c2"], rose: ["#f3e9ea", "#e2cdd0"],
  cream: ["#f6efe4", "#e8d8bd"], lilac: ["#eceaf2", "#d3cfe2"], steel: ["#eaeced", "#cfd5d8"],
  olive: ["#eef1e9", "#d5ddca"], clay: ["#f2e8e2", "#dfc9bb"], mint: ["#e9f2ec", "#c8ddd0"],
  stone: ["#eeece8", "#d6d1c7"],
};
const grad = (k: Tone, dir?: number): string => "linear-gradient(" + (dir || 145) + "deg," + G[k][0] + " 0%," + G[k][1] + " 100%)";

// ── Categories (19, with subcategories) ──────────────────────
export const categories: Category[] = [
  { id: 1,  slug: "resin",            name: "إيبوكسي ريزن",              tone: "teal",  featured: true,  subs: ["ريزن سريع الجفاف", "ريزن للسماكات العالية", "مصلّبات ومواد مساعدة"] },
  { id: 2,  slug: "candle-making",    name: "صناعة الشمع",               tone: "cream", featured: true,  subs: ["شمع صويا", "شمع نحل", "فتائل"] },
  { id: 3,  slug: "fragrances",       name: "صناعة المعطرات",            tone: "lilac", featured: true,  subs: ["قواعد المعطرات", "زجاجات ومضخات"] },
  { id: 4,  slug: "terrazzo",         name: "تيرازو وكونكريت",           tone: "steel", featured: true,  subs: ["مساحيق التيرازو", "أحجار ورقائق"] },
  { id: 5,  slug: "shaping-paste",    name: "معجون التشكيل",             tone: "stone", featured: true,  subs: [] },
  { id: 6,  slug: "clock-boards",     name: "أخشاب ومستلزمات الساعات",   tone: "sand",  featured: true,  subs: ["قواعد ساعات", "مكائن ومؤشرات"] },
  { id: 7,  slug: "candle-containers", name: "أكواب الشمع",              tone: "mint",  featured: true,  subs: ["أوعية زجاج", "أوعية معدنية", "أوعية خشب", "أوعية فخار"] },
  { id: 8,  slug: "starter-kits",     name: "بكجات المبتدئين",           tone: "olive", featured: true,  subs: [] },
  { id: 9,  slug: "vintage",          name: "تحف وإكسسوارات",            tone: "clay",  featured: true,  subs: [] },
  { id: 10, slug: "journaling",       name: "دفاتر ومستلزمات الجورنال",  tone: "rose",  featured: true,  subs: [] },
  { id: 11, slug: "fragrance-oils",   name: "زيوت عطرية",                tone: "lilac", featured: true,  subs: ["عطور شرقية", "عطور منعشة"] },
  { id: 12, slug: "pigments",         name: "صبغات وملونات",             tone: "rose",  featured: true,  subs: ["ألوان ميتاليك", "مايكا", "ملونات الشمع"] },
  { id: 13, slug: "polymer-clay",     name: "صلصال حراري",               tone: "clay",  featured: true,  subs: [] },
  { id: 14, slug: "cutting-machines", name: "طابعات وماكنات القص",       tone: "steel", featured: true,  subs: ["ماكنات قص", "مكابس حرارية"] },
  { id: 15, slug: "silicone-molds",   name: "قوالب سيليكون",             tone: "sand",  featured: true,  subs: ["قوالب شمع", "قوالب ريزن", "قوالب رمضان"] },
  { id: 16, slug: "tools",            name: "مستلزمات وأدوات عمل",       tone: "steel", featured: true,  subs: [] },
  { id: 17, slug: "packaging",        name: "منتجات تغليف",              tone: "stone", featured: true,  subs: ["علب PVC", "أكياس", "ورق تغليف", "ستيكرز"] },
  { id: 18, slug: "fillings",         name: "ورد مجفف وأحجار زينة",      tone: "olive", featured: true,  subs: ["أحجار زينة", "ورد مجفف"] },
  { id: 19, slug: "saving-packages",  name: "بكجات توفيرية",             tone: "mint",  featured: false, subs: [] },
];

const catBg: Record<string, string> = {};
categories.forEach((c) => { catBg[c.slug] = grad(c.tone); });
export { catBg };

// ── Products: [name, price, sale|null, rating, reviews, flags] ─
type ProductRow = [string, number, number | null, number, number, { isNew?: number; featured?: number }];
const CATALOG: Record<string, ProductRow[]> = {
  resin: [
    ["ريزن إيبوكسي شفاف سريع الجفاف — ١ كغم", 145, 119, 4.8, 64, { isNew: 1, featured: 1 }],
    ["ريزن إيبوكسي للسماكات العالية — ١.٥ كغم", 265, 229, 4.9, 88, { featured: 1 }],
    ["ريزن مقاوم للاصفرار UV — ٥٠٠ غم", 89, null, 4.6, 41, {}],
    ["مصلّب إضافي للريزن — ٥٠٠ مل", 62, null, 4.4, 17, {}],
  ],
  "candle-making": [
    ["شمع صويا طبيعي — ٢ كغم", 98, 84, 4.8, 76, { featured: 1 }],
    ["شمع نحل مصفّى — ١ كغم", 124, 99, 4.9, 58, { isNew: 1 }],
    ["فتائل قطنية مشمّعة — ١٠٠ فتيلة", 32, null, 4.6, 44, {}],
    ["شمع جل شفاف — ١ كغم", 76, null, 4.5, 23, {}],
  ],
  fragrances: [
    ["قاعدة معطر جو كحولية — ١ لتر", 68, 55, 4.7, 39, { featured: 1 }],
    ["زجاجات معطر بمضخة — ٦ حبات", 54, null, 4.5, 21, {}],
    ["مثبّت عطري مركّز — ٢٥٠ مل", 47, null, 4.6, 18, { isNew: 1 }],
  ],
  terrazzo: [
    ["مسحوق ماستر تيرازو أبيض — ٥ كغم", 110, 95, 4.7, 52, { featured: 1 }],
    ["رقائق تيرازو ملونة — ١ كغم", 42, null, 4.5, 27, {}],
    ["مسحوق كونكريت رمادي — ٥ كغم", 96, null, 4.6, 31, {}],
  ],
  "shaping-paste": [
    ["معجون التشكيل الحرفي — ١ كغم", 88, 72, 4.8, 34, { isNew: 1, featured: 1 }],
    ["معجون تشكيل خفيف الوزن — ٥٠٠ غم", 52, null, 4.5, 16, {}],
  ],
  "clock-boards": [
    ["قاعدة ساعة خشبية دائرية — قطر ٥٧ سم", 40, null, 4.6, 29, { featured: 1 }],
    ["خشبة القمر المضيء — قطر ٣٧ سم مع إضاءة", 60, 49, 4.8, 47, { isNew: 1 }],
    ["قاعدة خشبية مع مرآة بيضاوية — صغير", 26, null, 4.4, 13, {}],
    ["ماكينة ساعة صامتة مع مؤشرات", 18, null, 4.5, 22, {}],
  ],
  "candle-containers": [
    ["أوعية زجاجية مضلعة — ٦ حبات", 87, null, 4.4, 26, {}],
    ["أوعية معدنية بغطاء ذهبي — ٦ حبات", 96, 78, 4.7, 35, { featured: 1 }],
    ["أوعية فخارية مطفية — ٤ حبات", 74, null, 4.5, 19, {}],
    ["قواعد خشبية للشموع — ٦ حبات", 45, null, 4.3, 11, {}],
  ],
  "starter-kits": [
    ["بكج صناعة قطع ديكور من الريزن", 140, 119, 4.9, 96, { featured: 1, isNew: 1 }],
    ["بكج صناعة كوسترات الريزن", 130, null, 4.8, 82, { featured: 1 }],
    ["بكج صناعة مجوهرات الريزن", 140, 115, 4.8, 61, {}],
    ["بكج صناعة شمع الديكور", 120, null, 4.7, 54, { featured: 1 }],
    ["بكج صناعة فواحات الشموع", 100, 85, 4.6, 43, {}],
    ["بكج صناعة شمعة جوز الهند", 100, null, 4.7, 38, {}],
    ["بكج صناعة شمع الجل", 120, null, 4.5, 27, { isNew: 1 }],
    ["بكج صناعة شمعة الرمل", 85, null, 4.6, 31, {}],
  ],
  vintage: [
    ["ستاند إضاءة خشب دائري", 15, null, 4.5, 24, { isNew: 1 }],
    ["صينية تقديم نحاسية صغيرة", 68, 55, 4.6, 17, {}],
    ["حافظة مجوهرات مرآوية", 92, null, 4.7, 12, { featured: 1 }],
  ],
  journaling: [
    ["دفتر جورنال بغلاف قماشي", 38, null, 4.7, 41, { featured: 1 }],
    ["طقم ستيكرز جورنال — ٥٠ ورقة", 24, 19, 4.6, 33, {}],
    ["ورق كرافت مزخرف — ٣٠ ورقة", 28, null, 4.4, 15, {}],
  ],
  "fragrance-oils": [
    ["زيت عطري — فانيلا وخشب الصندل", 46, null, 4.7, 63, { featured: 1 }],
    ["زيت عطري — عود ومسك أبيض", 52, 43, 4.8, 71, {}],
    ["زيت عطري — ياسمين شامي", 44, null, 4.5, 33, {}],
    ["زيت عطري — قهوة وكراميل", 44, null, 4.6, 28, { isNew: 1 }],
  ],
  pigments: [
    ["مجموعة أصباغ ميكا لامعة — ١٢ لون", 115, 89, 4.9, 121, { featured: 1 }],
    ["ألوان ميتاليك معجون — ٦ درجات", 68, null, 4.7, 46, {}],
    ["ملونات شمع سائلة — ٨ درجات", 54, 45, 4.6, 38, { isNew: 1 }],
    ["بودرة فسفورية تتوهج في الظلام", 54, null, 4.7, 51, {}],
  ],
  "polymer-clay": [
    ["صلصال حراري ملون — ٢٤ لون", 78, 64, 4.7, 44, { featured: 1 }],
    ["صلصال حراري أبيض — ٥٠٠ غم", 42, null, 4.5, 19, {}],
    ["أدوات تشكيل الصلصال — ١٢ قطعة", 36, null, 4.6, 25, {}],
  ],
  "cutting-machines": [
    ["مكبس حراري يدوي — ١١.٥×٦.٥", 130, null, 4.6, 22, { featured: 1 }],
    ["ماكينة قص ورق حرفية", 320, 279, 4.7, 18, { isNew: 1 }],
    ["شفرات قص بديلة — ٥ قطع", 28, null, 4.4, 14, {}],
  ],
  "silicone-molds": [
    ["قالب سيليكون كوستر مستطيل سادة", 10, null, 4.7, 53, { featured: 1 }],
    ["قالب سيليكون إطار صورة شكل قلب", 15, null, 4.6, 29, { isNew: 1 }],
    ["قالب سيليكون صندوق هدايا", 10, null, 4.5, 34, {}],
    ["قالب سيليكون مكعب شفاف ١٠ سم مع دعامات", 20, 16, 4.8, 48, { featured: 1 }],
    ["قالب سيليكون وعاء زهرة اللوتس", 6, null, 4.6, 26, {}],
    ["قالب سيليكون كوستر بيضاوي مفرغ", 6, null, 4.5, 22, {}],
    ["قالب سيليكون أطباق تقديم بيضاوي", 96, 78, 4.8, 34, {}],
    ["قالب حروف عربية بارزة", 68, 52, 4.3, 22, {}],
  ],
  tools: [
    ["مسدس حراري احترافي ٢٠٠٠ واط", 189, 155, 4.6, 39, {}],
    ["ميزان رقمي دقيق ٠.٠١ غم", 96, null, 4.8, 57, { featured: 1 }],
    ["طقم أدوات خلط وتشكيل — ١٤ قطعة", 74, 61, 4.5, 48, { isNew: 1 }],
    ["بكج أدوات الحرق على الخشب", 180, null, 4.7, 26, { isNew: 1 }],
  ],
  packaging: [
    ["علب PVC شفافة — ٥٠ علبة", 46, null, 4.5, 31, {}],
    ["أكياس أورجانزا — ١٠٠ كيس", 34, 27, 4.6, 24, { featured: 1 }],
    ["ورق تغليف مزخرف — ٢٥ ورقة", 29, null, 4.4, 16, {}],
    ["ستيكرز شكر مخصصة — ١٠٠ ستيكر", 38, null, 4.7, 42, {}],
  ],
  fillings: [
    ["ورد مجفف طبيعي — علبة مشكّلة", 32, null, 4.7, 37, { featured: 1 }],
    ["أحجار زينة ملونة — ٥٠٠ غم", 26, 21, 4.5, 23, {}],
    ["ورق ذهب للتزيين — ١٠٠ ورقة", 39, 31, 4.5, 38, { isNew: 1 }],
  ],
  "saving-packages": [
    ["بكج توفيري — قوالب متنوعة ×١٠", 85, 69, 4.7, 45, { featured: 1 }],
    ["بكج توفيري — ألوان وأدوات", 145, 118, 4.6, 32, {}],
  ],
};

const VARIATIONS: Record<string, ProductVariant | undefined> = {
  resin: { label: "الحجم", options: ["٥٠٠ غم", "١ كغم", "١.٥ كغم"] },
  pigments: { label: "اللون", options: ["ذهبي", "فضي", "نحاسي", "أزرق ملكي"] },
  "candle-making": { label: "الوزن", options: ["١ كغم", "٢ كغم", "٥ كغم"] },
  "silicone-molds": { label: "المقاس", options: ["صغير", "وسط", "كبير"] },
};

let _id = 0;
export const products: Product[] = [];
Object.keys(CATALOG).forEach((slug) => {
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return;
  CATALOG[slug].forEach((row, idx) => {
    const [name, price, sale, rating, reviews, flags] = row;
    _id += 1;
    const dirs = [145, 215, 120, 35];
    products.push({
      id: _id,
      slug: slug + "-" + _id,
      name, category: slug, categoryName: cat.name,
      price, sale,
      sku: slug.slice(0, 3).toUpperCase() + "-" + (1000 + _id),
      rating, reviews,
      stock: _id % 17 === 0 ? 0 : _id % 11 === 0 ? 3 : 25,
      isNew: !!flags.isNew, featured: !!flags.featured, bestSeller: reviews > 45,
      bg: grad(cat.tone, dirs[idx % 4]),
      gallery: dirs.map((d) => grad(cat.tone, d)),
      variation: VARIATIONS[slug] ?? null,
      sub: cat.subs.length ? cat.subs[idx % cat.subs.length] : "",
      short: "منتج حرفي مختار بعناية، مناسب للمشاريع اليدوية والاستخدام التجاري الخفيف. يُشحن بتغليف محكم يحمي المحتوى، ومعه ورقة إرشادات بالعربية.",
      specs: [["البلد المنشأ", "مستورد"], ["مدة الصلاحية", "٢٤ شهراً"], ["التغليف", "علبة محكمة مع ورقة إرشادات"], ["الاستخدام", "حرفي ومنزلي"]],
    });
  });
});

// ── Starter-kit contents (revealed on hover) ─────────────────
const KIT_SETS: Record<"resin" | "candle", Array<[string, Tone]>> = {
  resin: [["ريزن + مصلّب", "teal"], ["قوالب سيليكون", "sand"], ["أصباغ ميكا", "rose"], ["أدوات خلط", "steel"], ["ورق ذهب", "cream"], ["دليل عربي", "stone"]],
  candle: [["شمع صويا", "cream"], ["فتائل مشمّعة", "sand"], ["زيت عطري", "lilac"], ["أوعية زجاج", "mint"], ["ملونات شمع", "rose"], ["دليل عربي", "stone"]],
};
export function kitContentsFor(name: string): Array<{ label: string; bg: string }> {
  const set = /شمع|فواح|جوز|رمل|جل/.test(name) ? KIT_SETS.candle : KIT_SETS.resin;
  return set.map(([label, tone]) => ({ label, bg: grad(tone) }));
}

// ── Homepage promo banners (admin-manageable) ────────────────
export const promoBanners = {
  main: { title: "أكبر تشكيلة قوالب سيليكون في فلسطين", subtitle: "تشكيلة ٢٠٢٦", desc: "أكثر من ٢٠٠ قالب للريزن والشمع والتيرازو بأسعار الجملة.", cta: "تصفّح كل القوالب", href: "#/category/silicone-molds", bg: "linear-gradient(115deg,#1f4e4a 0%,#2f6f68 55%,#c9a24b 145%)" },
  side: [
    { title: "منتجات جديدة", desc: "وصل حديثاً هذا الأسبوع", cta: "شاهد الجديد", href: "#/shop", bg: "linear-gradient(120deg,#3a2a22,#7a5233)" },
    { title: "منتجات متوفرة من جديد", desc: "عادت الأصناف الأكثر طلباً", cta: "تصفّح الأصناف", href: "#/offers", bg: "linear-gradient(120deg,#2b2f3a,#5b6478)" },
  ],
};

export const showcaseBlocks = [
  { catSlug: "silicone-molds", title: "قوالب سيليكون", bannerTitle: "أكبر تشكيلة قوالب سيليكون", bannerCta: "تصفّح كل القوالب", bg: "linear-gradient(150deg,#1f4e4a,#3d7d75)" },
  { catSlug: "clock-boards", title: "أخشاب ومستلزمات ساعات الريزن", bannerTitle: "منتجات صناعة ساعات وجداريات الريزن", bannerCta: "تصفّح المنتجات", bg: "linear-gradient(150deg,#4a3527,#8a6237)" },
];

export const heroSlides = [
  { id: 1, title: "كل مستلزمات الريزن والشمع في مكان واحد", subtitle: "تشكيلة جديدة", desc: "ريزن، قوالب، أصباغ وأدوات بجودة احترافية وأسعار الجملة.", cta: "تسوّق الآن", href: "#/shop", bg: "linear-gradient(115deg,#1f4e4a 0%,#2f6f68 55%,#c9a24b 140%)" },
  { id: 2, title: "بكجات المبتدئين بخصم يصل ٢٠٪", subtitle: "عرض هذا الأسبوع", desc: "ابدأ مشروعك الحرفي بطقم كامل جاهز للاستخدام.", cta: "شاهد البكجات", href: "#/category/starter-kits", bg: "linear-gradient(115deg,#3a2a22 0%,#7a5233 60%,#e8d8bd 150%)" },
  { id: 3, title: "شموع صويا وزيوت عطرية أصلية", subtitle: "وصل حديثاً", desc: "شمع طبيعي، فتائل مشمّعة، وزيوت مركزة تدوم طويلاً.", cta: "اكتشف القسم", href: "#/category/candle-making", bg: "linear-gradient(115deg,#2b2f3a 0%,#4c5468 55%,#d3cfe2 150%)" },
];

const ARTICLE_SOURCES: Array<Omit<Article, "bg">> = [
  { id: 1, slug: "candle-making-starter", title: "صناعة الشموع… كيف تبدأ رحلتك؟", excerpt: "دليل عملي يشرح المواد الأساسية، النسب الصحيحة، وأول خمس خطوات لصناعة شمعة ناجحة.", date: "١٢ تموز ٢٠٢٦", read: "٦ دقائق", cat: "صناعة الشموع", author: "فريق التحرير", tone: "cream" },
  { id: 2, slug: "resin-beginners", title: "دليل المبتدئين لصب الريزن بدون فقاعات", excerpt: "خمس خطوات عملية تضمن نتيجة صافية من المحاولة الأولى، من ضبط الحرارة إلى وقت الخلط.", date: "٤ تموز ٢٠٢٦", read: "٥ دقائق", cat: "إيبوكسي ريزن", author: "فريق التحرير", tone: "teal" },
  { id: 3, slug: "mold-care", title: "كيف تحافظ على قوالب السيليكون سنوات", excerpt: "التنظيف، التخزين، والأخطاء الشائعة التي تُتلف سطح القالب اللامع.", date: "٢٦ حزيران ٢٠٢٦", read: "٤ دقائق", cat: "قوالب سيليكون", author: "فريق التحرير", tone: "sand" },
  { id: 4, slug: "pigment-guide", title: "الفرق بين المايكا والأصباغ السائلة", excerpt: "متى تستخدم كل نوع، وكيف تحصل على تدرجات نظيفة دون ترسيب.", date: "١٨ حزيران ٢٠٢٦", read: "٧ دقائق", cat: "صبغات وملونات", author: "فريق التحرير", tone: "rose" },
];
export const articles: Article[] = ARTICLE_SOURCES.map((a) => ({ ...a, bg: grad(a.tone) }));

export const deliveryAreas: DeliveryOption[] = [
  { id: 1, name: "رام الله والبيرة", price: 20, eta: "١–٢ أيام عمل" },
  { id: 2, name: "نابلس", price: 25, eta: "٢–٣ أيام عمل" },
  { id: 3, name: "الخليل", price: 25, eta: "٢–٣ أيام عمل" },
  { id: 4, name: "القدس", price: 30, eta: "٢–٤ أيام عمل" },
  { id: 5, name: "غزة", price: 35, eta: "٣–٥ أيام عمل" },
];

export const coupons: Record<string, Coupon | undefined> = { TEST10: { type: "percent", value: 10, label: "خصم ١٠٪" }, SHIP0: { type: "shipping", value: 0, label: "توصيل مجاني" } };

export const navLinks = [
  { label: "الرئيسية", href: "#/" },
  { label: "أقسام منتجاتنا", href: "#/shop" },
  { label: "حاسبات نسب المواد", href: "#/tools/calculator" },
  { label: "المدونة", href: "#/blog" },
  { label: "موقع الشركة", href: "#/about" },
  { label: "تتبع الطلب", href: "#/track-order" },
  { label: "سياسة الخصوصية", href: "#/privacy-policy" },
];

export const trustFeatures = [
  { title: "توصيل لكل المناطق", desc: "خلال ١–٤ أيام عمل", icon: "truck" },
  { title: "دفع عند الاستلام", desc: "أو تحويل بنكي", icon: "wallet" },
  { title: "إرجاع خلال ١٤ يوماً", desc: "على المنتجات غير المستخدمة", icon: "refresh" },
  { title: "دعم فني حرفي", desc: "نساعدك في اختيار المواد", icon: "headset" },
];

export const footerLinks: Record<string, { title: string; items: Array<[string, string]> }> = {
  links: { title: "روابط", items: [["حاسبة نسب الريزن", "#/tools/calculator"], ["حاسبة نسب التيرازو", "#/tools/calculator"], ["سياسة التبديل والإرجاع", "#/return-policy"], ["سياسة الخصوصية", "#/privacy-policy"], ["تواصل معنا", "#/contact"], ["تتبع طلبك", "#/track-order"], ["الشروط والأحكام", "#/terms"]] },
  shop: { title: "التسوّق", items: [["كل المنتجات", "#/shop"], ["العروض", "#/offers"], ["بكجات المبتدئين", "#/category/starter-kits"], ["بكجات توفيرية", "#/category/saving-packages"], ["قوالب سيليكون", "#/category/silicone-molds"]] },
  service: { title: "خدمة العملاء", items: [["حسابي", "#/account"], ["تسجيل الدخول", "#/login"], ["عربة التسوّق", "#/cart"], ["الأسئلة الشائعة", "#/contact"], ["موقع الشركة", "#/about"]] },
};

export const pagesContent: Record<string, StaticPage | undefined> = {
  about: { title: "موقع الشركة", lead: "متجر حرفي متخصص في مستلزمات الريزن والشمع، نخدم الحرفيين وأصحاب المشاريع الصغيرة.", body: ["بدأنا كورشة صغيرة تصنع قطعاً بالطلب، ثم تحوّلنا إلى مورّد للمواد التي كنا نبحث عنها بأنفسنا ولا نجدها محلياً. اليوم نوفّر أكثر من ٢٠٠ منتجاً مختاراً بعناية.", "نختبر كل منتج داخل الورشة قبل إضافته للمتجر، ونكتب إرشادات استخدام بالعربية مع كل طلب. هدفنا أن تنجح محاولتك الأولى، لا أن نبيع فقط.", "نوفّر أسعار جملة لأصحاب المشاريع، وندعم العملاء فنياً في اختيار المواد المناسبة لكل مشروع."] },
  "privacy-policy": { title: "سياسة الخصوصية", lead: "نحفظ بياناتك بالحد الأدنى اللازم لتنفيذ الطلب.", body: ["نجمع الاسم ورقم الهاتف والعنوان لغرض التوصيل فقط، ولا نشارك هذه البيانات مع أي طرف ثالث خارج شركة الشحن.", "لا نحفظ بيانات بطاقات الدفع على خدماتنا؛ تُعالج المدفوعات عبر مزوّد خارجي معتمد.", "يمكنك طلب حذف بياناتك في أي وقت عبر صفحة تواصل معنا."] },
  "return-policy": { title: "سياسة التبديل والإرجاع", lead: "إرجاع خلال ١٤ يوماً على المنتجات غير المستخدمة وبتغليفها الأصلي.", body: ["يتم الشحن خلال ٢٤ ساعة من تأكيد الطلب في أيام العمل، والتوصيل خلال ١–٤ أيام حسب المنطقة.", "المنتجات السائلة المفتوحة لا تقبل الإرجاع لأسباب تتعلق بالسلامة، ويُستبدل المنتج التالف فوراً عند التوصيل.", "تكلفة إرجاع منتج سليم على العميل، أما المنتج الخاطئ أو التالف فنتحمّل تكلفة إرجاعه كاملة."] },
  terms: { title: "الشروط والأحكام", lead: "استخدامك للمتجر يعني موافقتك على الشروط التالية.", body: ["الأسعار المعروضة بالشيكل وتشمل الضريبة، وقد تتغيّر دون إشعار مسبق.", "توفّر المنتجات مرتبط بالمخزون الفعلي؛ في حال نفاد منتج بعد الطلب نتواصل معك لاختيار بديل أو استرجاع المبلغ.", "الصور توضيحية وقد تختلف درجة اللون قليلاً بين الدفعات الإنتاجية."] },
};

// ── Arabic-aware search normalization ────────────────────────
export function normalizeAr(s: string): string {
  return String(s || "")
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ")
    .trim().toLowerCase();
}

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const productsService = {
  async list({ cats = [], maxPrice = null, onlyOffers = false, inStock = false, sort = "featured", q = "" }: ProductQuery = {}): Promise<Product[]> {
    await wait(110);
    let out = products.slice();
    if (cats.length) out = out.filter((p) => cats.includes(p.category));
    if (maxPrice) out = out.filter((p) => (p.sale || p.price) <= maxPrice);
    if (onlyOffers) out = out.filter((p) => !!p.sale);
    if (inStock) out = out.filter((p) => p.stock > 0);
    if (q) { const n = normalizeAr(q); out = out.filter((p) => normalizeAr(p.name).includes(n) || normalizeAr(p.categoryName).includes(n) || normalizeAr(p.sku).includes(n)); }
    const eff = (p: Product) => p.sale || p.price;
    if (sort === "price-asc") out.sort((a, b) => eff(a) - eff(b));
    else if (sort === "price-desc") out.sort((a, b) => eff(b) - eff(a));
    else if (sort === "rating") out.sort((a, b) => b.rating - a.rating);
    else if (sort === "newest") out.sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.id - a.id);
    else out.sort((a, b) => Number(b.featured) - Number(a.featured));
    return out;
  },
  async bySlug(slug: string): Promise<Product | null> { await wait(70); return products.find((p) => p.slug === slug) || null; },
  async related(p: Product, n = 4) { await wait(50); return products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, n); },
  async byCategory(slug: string, n = 4) { await wait(50); return products.filter((p) => p.category === slug).slice(0, n); },
  async featured(n = 8) { await wait(50); return products.filter((p) => p.featured).slice(0, n); },
  async newest(n = 8) { await wait(50); return products.filter((p) => p.isNew).concat(products.filter((p) => !p.isNew)).slice(0, n); },
  async best(n = 8) { await wait(50); return products.slice().sort((a, b) => b.reviews - a.reviews).slice(0, n); },
  async offers(n = 24) { await wait(50); return products.filter((p) => p.sale).slice(0, n); },
};

export const categoriesService = {
  async list() { await wait(30); return categories; },
  async featured() { await wait(30); return categories.filter((c) => c.featured); },
  async bySlug(slug: string): Promise<Category | null> { await wait(30); return categories.find((c) => c.slug === slug) || null; },
};

export const searchService = {
  async suggest(q: string): Promise<SearchSuggestion> {
    if (!q || q.trim().length < 2) return { products: [], cats: [] };
    await wait(80);
    const n = normalizeAr(q);
    return {
      products: products.filter((p) => normalizeAr(p.name).includes(n) || normalizeAr(p.sku).includes(n)).slice(0, 6),
      cats: categories.filter((c) => normalizeAr(c.name).includes(n)).slice(0, 3),
    };
  },
};

const CART_KEY = "test_store_cart_v1";
export const cartService = {
  load(): CartItem[] { return readArray(CART_KEY, isCartItem); },
  save(items: readonly CartItem[]): void { writeArray(CART_KEY, items); },
  totals(items: readonly CartItem[], couponCode: string, areaPrice: number | undefined): CartTotals {
    const subtotal = items.reduce((s, i) => s + i.unit * i.qty, 0);
    const c = coupons[String(couponCode || "").toUpperCase()];
    let discount = 0;
    let shipping = subtotal === 0 ? 0 : areaPrice != null ? areaPrice : config.shippingFlat;
    if (subtotal >= config.freeShippingOver) shipping = 0;
    if (c && c.type === "percent") discount = Math.round(subtotal * c.value / 100);
    if (c && c.type === "shipping") shipping = 0;
    return { subtotal, discount, shipping, total: Math.max(0, subtotal - discount + shipping), coupon: c || null };
  },
};

export const ordersService = {
  async place(payload: OrderDraft): Promise<Order> { await wait(650); return { ok: true, id: "TST-" + Math.floor(100000 + Math.random() * 899999), eta: "١–٣ أيام عمل", payload }; },
  async track(id: string): Promise<TrackResult> {
    await wait(450);
    if (!/^TST-\d{6}$/i.test(String(id).trim())) return { ok: false, error: "رقم الطلب غير صحيح. الصيغة الصحيحة مثل TST-123456" };
    return { ok: true, id: String(id).toUpperCase(), steps: [["تم استلام الطلب", "٢٦ تموز · ١٠:٤٢", true], ["قيد التحضير", "٢٦ تموز · ١٤:١٠", true], ["مع مندوب التوصيل", "٢٧ تموز · ٠٩:٣٠", true], ["تم التوصيل", "قيد الانتظار", false]] };
  },
};

export const contentService = {
  async articles() { await wait(30); return articles; },
  async article(slug: string): Promise<Article | null> { await wait(30); return articles.find((a) => a.slug === slug) || null; },
  async page(key: string): Promise<StaticPage | null> { await wait(30); return pagesContent[key] ?? null; },
};

export const settingsService = { async get() { await wait(20); return { config, navLinks, footerLinks, trustFeatures, deliveryAreas, promoBanners, showcaseBlocks }; } };
