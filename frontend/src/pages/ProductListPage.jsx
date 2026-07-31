import { useEffect, useState } from "react";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";
import ListingPage from "../components/Listing.jsx";
import { catalogService } from "../services/catalog.js";

const PAGE_SIZE = 12;

/**
 * One listing implementation behind /shop, /category/:slug, /offers, /packages,
 * /molds and /search. `mode` decides the fixed part of the query and the copy.
 */
export default function ProductListPage({ mode = "shop" }) {
  const shell = useOutletContext();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const term = searchParams.get("q") || "";

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(null);

  const filters = shell.filtersState;
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    setPage(1);
  }, [mode, params.slug, term, filterKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const query = {
      page,
      page_size: PAGE_SIZE,
      sort: filters.sort,
      max_price: filters.maxPrice,
      in_stock: filters.inStock || undefined,
      on_sale: mode === "offers" ? true : filters.onlyOffers || undefined,
    };
    if (mode === "category") query.category = params.slug;
    else if (filters.cats.length === 1) query.category = filters.cats[0];
    if (mode === "search" && term) query.q = term;

    const fetcher =
      mode === "packages"
        ? catalogService.packages(query)
        : mode === "molds"
          ? catalogService.molds(query)
          : catalogService.list(query);

    fetcher
      .then((result) => {
        if (cancelled) return;
        setItems((current) => (page === 1 ? result.items : [...current, ...result.items]));
        setTotal(result.total);
        setPages(result.pages);
      })
      .catch((cause) => {
        if (cancelled) return;
        setItems([]);
        setTotal(0);
        setError(cause.message || "تعذّر تحميل المنتجات.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, params.slug, term, page, filterKey]);

  useEffect(() => {
    let cancelled = false;
    if (mode !== "category" || !params.slug) {
      setCategory(null);
      return undefined;
    }
    catalogService
      .category(params.slug)
      .then((value) => !cancelled && setCategory(value))
      .catch(() => !cancelled && setCategory(null));
    return () => {
      cancelled = true;
    };
  }, [mode, params.slug]);

  const titles = {
    shop: "كل المنتجات",
    category: category?.name || "القسم",
    offers: "العروض",
    packages: "البكجات",
    molds: "قوالب سيليكون",
    search: "نتائج البحث",
  };
  const subtitles = {
    shop: "تصفّح كل ما يوفّره المتجر",
    category: category?.description || `تصفّح كل منتجات ${category?.name || "القسم"}`,
    offers: "منتجات مختارة بأسعار مخفّضة",
    packages: "أطقم كاملة جاهزة للاستخدام",
    molds: "قوالب للريزن والشمع والتيرازو",
    search: `بحثت عن: «${term}»`,
  };

  const v = {
    ...shell,
    listTitle: titles[mode],
    listSubtitle: subtitles[mode],
    listItems: items.map(shell.deco),
    listLoading: loading && items.length === 0,
    listError: error,
    listEmpty: !loading && !error && items.length === 0,
    skeletons: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ i })),
    resultCount: `${total} منتجاً`,
    resultNum: total,
    hasMore: page < pages,
    remainingCount: Math.max(0, total - items.length),
    loadMore: () => setPage((current) => current + 1),
  };

  return <ListingPage v={v} />;
}
