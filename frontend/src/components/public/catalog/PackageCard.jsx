import { Link } from "react-router-dom";
import AddToCartButton from "../../AddToCartButton.jsx";
import Media from "../shell/Media.jsx";
import { useProductActions } from "../../../hooks/useStorefront.js";
import { ArrowForward, BoxIcon } from "../shell/icons.jsx";

/**
 * Packages are a different product, so they get a different card: a wide cover,
 * a package mark, what is inside, and one action. The contents list is revealed
 * on hover where a pointer exists and is simply always shown on touch.
 */
export default function PackageCard({ view, eager = false }) {
  const { primaryAction, openQuick } = useProductActions();
  if (!view) return null;

  const items = view.packageItems || [];

  return (
    <article className="vs-pkg">
      <div className="vs-pkg__media">
        <Link to={view.href} tabIndex={-1} aria-hidden="true">
          <Media
            ratio="var(--vs-ar-package)"
            src={view.imageUrl}
            fallback={view.bg}
            alt=""
            imgClass="vs-card__img"
            eager={eager}
          />
        </Link>
        <div className="vs-pkg__badges">
          <span className="vs-badge vs-badge--package">بكج</span>
          {view.hasSale && <span className="vs-badge vs-badge--sale">{view.discountText}</span>}
        </div>
        {view.soldOut && (
          <div className="vs-card__veil">
            <span>غير متوفر حالياً</span>
          </div>
        )}
      </div>

      <div className="vs-pkg__body">
        <Link to={view.href} className="vs-pkg__title vs-clamp-2">
          {view.name}
        </Link>

        {view.packageCount > 0 && (
          <span className="vs-pkg__count">
            <BoxIcon size={15} />
            {view.packageCount === 1 ? "يحتوي على عنصر واحد" : `يحتوي على ${view.packageCount} عناصر`}
          </span>
        )}

        {items.length > 0 && (
          <div className="vs-pkg__contents">
            <ul>
              {items.slice(0, 5).map((item) => (
                <li key={item.id}>
                  {item.label}
                  {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!items.length && view.short && <p className="vs-pkg__short vs-clamp-2">{view.short}</p>}

        <div className="vs-price">
          <span className="vs-price__now">{view.priceText}</span>
          {view.hasSale && <span className="vs-price__was">{view.oldText}</span>}
        </div>

        <div className="vs-pkg__foot">
          <AddToCartButton
            onAdd={primaryAction(view)}
            label={view.actionLabel}
            disabled={view.soldOut}
            className="vs-btn vs-btn--primary vs-pkg__cta"
          />
          <button
            type="button"
            className="vs-btn vs-btn--quiet"
            onClick={() => openQuick(view)}
            aria-label={`تفاصيل ${view.name}`}
          >
            التفاصيل <ArrowForward size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
