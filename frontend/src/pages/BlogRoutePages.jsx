import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { ArticlePage, BlogPage, NotFoundPage } from "../components/Pages.jsx";
import { storefrontService } from "../services/storefront.js";
import sx from "../sx.js";

export function BlogListPage() {
  const shell = useOutletContext();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    storefrontService
      .articles({ page_size: 24 })
      .then((result) => !cancelled && setArticles(result.items))
      .catch(() => !cancelled && setArticles([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const v = {
    ...shell,
    loading,
    empty: !loading && articles.length === 0,
    articles: articles.map((article) => ({ ...article, href: `/blog/${article.slug}` })),
  };
  return <BlogPage v={v} />;
}

export function ArticleDetailPage() {
  const shell = useOutletContext();
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    storefrontService
      .article(slug)
      .then((value) => {
        if (cancelled) return;
        setArticle(value);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("missing"));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === "loading") {
    return (
      <section style={sx`max-width:760px;margin:0 auto;padding:60px var(--pad);text-align:center;color:#7C766D;font-size:14px`}>
        جارٍ تحميل المقال…
      </section>
    );
  }
  if (status === "missing" || !article) return <NotFoundPage />;

  const v = {
    ...shell,
    art: article,
    paragraphs: String(article.content || "")
      .split(/\n{2,}/)
      .map((text) => text.trim())
      .filter(Boolean),
  };
  return <ArticlePage v={v} />;
}
