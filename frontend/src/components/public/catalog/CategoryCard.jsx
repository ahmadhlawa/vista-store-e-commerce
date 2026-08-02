import { Link } from "react-router-dom";
import Media from "../shell/Media.jsx";
import { ArrowForward } from "../shell/icons.jsx";

/**
 * Image-led category tile. The whole card is one link, the title and the count
 * are always visible, and hover only enriches what is already readable.
 */
export default function CategoryCard({ category, compact = false, eager = false }) {
  if (!category) return null;
  return (
    <Link
      to={category.href}
      className={`vs-cat${compact ? " vs-cat--compact" : ""}`}
      aria-label={`${category.name} — ${category.countText}`}
    >
      <Media
        ratio="var(--vs-ar-category)"
        src={category.imageUrl}
        fallback={category.bg}
        alt=""
        imgClass="vs-cat__img"
        eager={eager}
      />
      <span className="vs-cat__veil" />
      <span className="vs-cat__text">
        <span className="vs-cat__name">{category.name}</span>
        <span className="vs-cat__count">{category.countText}</span>
        {!compact && (
          <span className="vs-cat__go">
            تصفّح القسم <ArrowForward size={15} />
          </span>
        )}
      </span>
    </Link>
  );
}
