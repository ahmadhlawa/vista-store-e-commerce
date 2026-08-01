// Presentation constants only.
//
// Every piece of commercial content (products, categories, prices, banners,
// articles, delivery areas, coupons, store identity) now comes from the API via
// src/services/*. What is left here is navigation structure and static copy that
// belongs to the storefront layout itself.

export const navLinks = [
  { label: "الرئيسية", href: "/" },
  { label: "أقسام منتجاتنا", href: "/shop" },
  { label: "بكجات", href: "/packages" },
  { label: "قوالب سيليكون", href: "/molds" },
  { label: "حاسبة نسب المواد", href: "/tools/calculator" },
  { label: "المدونة", href: "/blog" },
  { label: "تواصل معنا", href: "/contact" },
];

export const footerLinks = {
  links: {
    title: "روابط",
    items: [
      ["حاسبة نسب الريزن", "/tools/calculator"],
      ["سياسة التبديل والإرجاع", "/page/return-policy"],
      ["سياسة الشحن", "/page/shipping-policy"],
      ["سياسة الخصوصية", "/page/privacy-policy"],
      ["الشروط والأحكام", "/page/terms"],
      ["تواصل معنا", "/contact"],
    ],
  },
  shop: {
    title: "التسوّق",
    items: [
      ["كل المنتجات", "/shop"],
      ["العروض", "/offers"],
      ["بكجات", "/packages"],
      ["قوالب سيليكون", "/molds"],
      ["المدونة", "/blog"],
    ],
  },
  service: {
    title: "خدمة العملاء",
    items: [
      ["عربة التسوّق", "/cart"],
      ["إتمام الطلب", "/checkout"],
      ["من نحن", "/page/about"],
      ["الأسئلة الشائعة", "/contact"],
    ],
  },
};

export const trustFeatures = [
  { title: "توصيل لكل المناطق", desc: "خلال ١–٤ أيام عمل", icon: "truck" },
  { title: "دفع عند الاستلام", desc: "أو تحويل يدوي", icon: "wallet" },
  { title: "إرجاع خلال ١٤ يوماً", desc: "على المنتجات غير المستخدمة", icon: "refresh" },
  { title: "دعم فني حرفي", desc: "نساعدك في اختيار المواد", icon: "headset" },
];

export const trustGlyphs = { truck: "⛟", wallet: "₪", refresh: "↺", headset: "☏" };

export const paymentMethods = [
  {
    key: "cash_on_delivery",
    label: "الدفع عند الاستلام",
    desc: "ادفع نقداً للمندوب عند التسليم",
  },
  {
    key: "manual",
    label: "تحويل بنكي / يدوي",
    desc: "نرسل تفاصيل الحساب بعد تأكيد الطلب",
  },
];

export const paymentMethodLabels = {
  cash_on_delivery: "الدفع عند الاستلام",
  manual: "تحويل بنكي / يدوي",
};

export const invoiceStatusLabels = {
  issued: "صادرة",
  cancelled: "ملغاة",
};

export const orderStatusLabels = {
  pending: "بانتظار المراجعة",
  confirmed: "تم التأكيد",
  processing: "قيد التحضير",
  ready: "جاهز للشحن",
  shipped: "مع مندوب التوصيل",
  delivered: "تم التوصيل",
  cancelled: "ملغى",
};
