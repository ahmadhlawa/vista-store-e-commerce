import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { ProductPage, ViewedSection } from "../components/Product.jsx";
import { NotFoundPage } from "../components/Pages.jsx";
import { useStore } from "../app/StoreProvider.jsx";
import { catalogService } from "../services/catalog.js";
import sx from "../sx.js";

const TABS = [
  ["desc", "الوصف"],
  ["specs", "المواصفات"],
  ["shipping", "الشحن والإرجاع"],
];

export default function ProductDetailPage() {
  const shell = useOutletContext();
  const store = useStore();
  const { slug } = useParams();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [viewedProducts, setViewedProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [imageIndex, setImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState(null);
  const [tab, setTab] = useState("desc");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setImageIndex(0);
    setQty(1);
    setTab("desc");

    catalogService
      .bySlug(slug)
      .then((value) => {
        if (cancelled) return;
        setProduct(value);
        setVariantId(value.variants?.find((variant) => variant.is_active)?.id ?? null);
        setStatus("ready");
        store.rememberViewed(value.slug);
        return catalogService.related(slug, 4);
      })
      .then((rows) => !cancelled && rows && setRelated(rows))
      .catch((error) => {
        if (cancelled) return;
        setProduct(null);
        setStatus(error.status === 404 ? "missing" : "error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    const slugs = store.viewed.filter((item) => item !== slug).slice(0, 6);
    if (!slugs.length) {
      setViewedProducts([]);
      return undefined;
    }
    Promise.allSettled(slugs.map((item) => catalogService.bySlug(item))).then((results) => {
      if (cancelled) return;
      setViewedProducts(
        results.filter((result) => result.status === "fulfilled").map((result) => result.value),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [store.viewed, slug]);

  const selectedVariant = useMemo(
    () => (product?.variants || []).find((variant) => variant.id === variantId) || null,
    [product, variantId],
  );

  if (status === "loading") {
    return (
      <section style={sx`max-width:1360px;margin:0 auto;padding:60px var(--pad);text-align:center;color:#7C766D;font-size:14px`}>
        جارٍ تحميل المنتج…
      </section>
    );
  }
  if (status === "missing") return <NotFoundPage />;
  if (status === "error" || !product) {
    return (
      <section role="alert" style={sx`max-width:1360px;margin:0 auto;padding:60px var(--pad);text-align:center;color:#8C2F22;font-size:14px`}>
        تعذّر تحميل هذا المنتج. حاول مرة أخرى لاحقاً.
      </section>
    );
  }

  const base = shell.deco(product);
  const optionGroup = product.options[0] || null;
  const effectivePrice =
    selectedVariant?.price_override != null
      ? Number(selectedVariant.price_override)
      : (product.sale ?? product.price);
  const stock = selectedVariant ? selectedVariant.stock_quantity : product.stock;
  const soldOut = product.trackInventory ? stock <= 0 : false;

  const pd = {
    ...base,
    soldOut,
    catHref: `/category/${product.categorySlug}`,
    activeImg: product.gallery[imageIndex] || product.bg,
    thumbs: product.gallery.map((background, index) => ({
      bg: background,
      border: index === imageIndex ? "#1F4E4A" : "#E9E3DA",
      label: `صورة ${index + 1}`,
      pick: () => setImageIndex(index),
    })),
    stockText: soldOut
      ? "غير متوفر"
      : !product.trackInventory
        ? "متوفر"
        : stock < 5
          ? `متبقٍ ${stock} قطع فقط`
          : "متوفر في المخزون",
    stockColor: soldOut ? "#C0392B" : stock < 5 && product.trackInventory ? "#B8860B" : "#2E7D5B",
    hasVariation: !!optionGroup && product.variants.length > 0,
    varLabel: optionGroup?.name || "",
    varOptions: product.variants.map((variant) => {
      const active = variant.id === variantId;
      const disabled = !variant.is_active;
      return {
        id: variant.id,
        label: variant.title,
        disabled,
        cursor: disabled ? "not-allowed" : "pointer",
        border: active ? "#1F4E4A" : "#E1DACE",
        bg: active ? "#1F4E4A" : "#fff",
        color: active ? "#fff" : disabled ? "#B7B1A7" : "#4A453E",
        pick: () => !disabled && setVariantId(variant.id),
      };
    }),
    specs: product.specs.map(([k, value]) => ({ k, v: value })),
    descriptionParagraphs: [product.description]
      .filter(Boolean)
      .flatMap((text) => text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)),
    mainBtnBg: soldOut ? "#B7B1A7" : "#1F4E4A",
    mainBtnLabel: soldOut
      ? "غير متوفر حالياً"
      : `أضف إلى العربة — ${shell.money(effectivePrice * qty)}`,
  };

  const v = {
    ...shell,
    pd,
    related: related.map(shell.deco),
    viewed: viewedProducts.map(shell.deco),
    pQty: qty,
    qtyUp: () => setQty((value) => value + 1),
    qtyDown: () => setQty((value) => Math.max(1, value - 1)),
    addFromPdp: () => {
      if (!soldOut) store.addToCart(product, qty, selectedVariant);
    },
    pdpTabs: TABS.map(([key, label]) => ({
      key,
      label,
      active: tab === key ? 1 : 0,
      weight: tab === key ? 800 : 600,
      color: tab === key ? "#1F4E4A" : "#7C766D",
      pick: () => setTab(key),
    })),
    tabDesc: tab === "desc",
    tabSpecs: tab === "specs",
    tabShipping: tab === "shipping",
  };

  return (
    <>
      <ProductPage v={v} />
      <ViewedSection v={v} />
    </>
  );
}
