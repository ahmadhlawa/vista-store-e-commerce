import { Link } from "react-router-dom";
import AddToCartButton from "../../AddToCartButton.jsx";
import Media from "../shell/Media.jsx";
import { productBadges } from "../../../utils/productView.js";
import { useProductActions } from "../../../hooks/useStorefront.js";
import { EyeIcon, PlusIcon } from "../shell/icons.jsx";

/**
 * The catalogue card. Takes a view built by `productView`, so a card never
 * reaches into the raw API shape and every surface shows the same states.
 *
 * The primary button is the product's own action: a direct add for a simple
 * product, "choose an option" for one that needs a variant, and disabled when
 * the product is sold out.
 */
export default function ProductCard({ view, eager = false }) {
  const { openQuick, primaryAction } = useProductActions();
  if (!view) return null;

  const badges = productBadges(view);

  return (
    <article className="vs-card">
      <div className="vs-card__media">
        <Link to={view.href} className="vs-card__link" tabIndex={-1} aria-hidden="true">
          <Media
            ratio="var(--vs-ar-product)"
            src={view.imageUrl}
            fallback={view.bg}
            alt=""
            imgClass="vs-card__img"
            eager={eager}
          />
        </Link>

        {badges.length > 0 && (
          <div className="vs-card__badges">
            {badges.map((badge) => (
              <span key={badge.key} className={`vs-badge vs-badge--${badge.tone}`}>
                {badge.label}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          className="vs-card__quick"
          onClick={() => openQuick(view)}
          aria-label={`نظرة سريعة على ${view.name}`}
        >
          <EyeIcon size={16} />
          <span className="vs-card__quick-label">نظرة سريعة</span>
        </button>

        {view.soldOut && (
          <div className="vs-card__veil">
            <span>غير متوفر حالياً</span>
          </div>
        )}
      </div>

      <div className="vs-card__body">
        {view.categoryName && <span className="vs-card__cat">{view.categoryName}</span>}
        <Link to={view.href} className="vs-card__title vs-clamp-2">
          {view.name}
        </Link>

        <div className="vs-price">
          <span className="vs-price__now">{view.priceText}</span>
          {view.hasSale && <span className="vs-price__was">{view.oldText}</span>}
        </div>

        <AddToCartButton
          onAdd={primaryAction(view)}
          label={view.actionLabel}
          icon={view.canAddDirectly ? <PlusIcon size={15} /> : null}
          disabled={view.soldOut}
          className="vs-btn vs-btn--outline vs-btn--block vs-card__cta"
        />
      </div>
    </article>
  );
}
