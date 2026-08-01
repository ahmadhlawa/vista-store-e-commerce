import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { NotFoundPage, StaticPageView } from "../components/Pages.jsx";
import { storefrontService } from "../services/storefront.js";
import sx from "../sx.js";

/** Renders a published StaticPage. `slug` may come from the route or be fixed. */
export default function StaticContentPage({ slug: fixedSlug }) {
  const shell = useOutletContext();
  const params = useParams();
  const slug = fixedSlug || params.slug;

  const [page, setPage] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    storefrontService
      .page(slug)
      .then((value) => {
        if (cancelled) return;
        setPage(value);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("missing"));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === "loading") {
    return (
      <section style={sx`max-width:820px;margin:0 auto;padding:60px var(--pad);text-align:center;color:#7C766D;font-size:14px`}>
        جارٍ التحميل…
      </section>
    );
  }
  if (status === "missing" || !page) return <NotFoundPage />;

  return <StaticPageView v={{ ...shell, page }} />;
}
