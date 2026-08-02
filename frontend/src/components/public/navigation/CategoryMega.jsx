import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useCategoryNav } from "../../../hooks/useStorefront.js";
import Media from "../shell/Media.jsx";
import { ArrowForward, BoxIcon } from "../shell/icons.jsx";

/**
 * Desktop category panel. A popover rather than a dialog: it hangs off the nav
 * band, the header stays lit above the page dimmer, and Escape hands focus back
 * to the trigger. Content is entirely API-driven.
 */
export default function CategoryMega({ onClose }) {
  const categories = useCategoryNav();
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.querySelector("a")?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="vs-mega" id="vs-mega" ref={ref}>
      <div className="vs-container vs-mega__grid">
        {categories.slice(0, 8).map((category) => (
          <div key={category.slug}>
            <Link to={category.href} className="vs-mega__cat" onClick={onClose}>
              <Media
                className="vs-mega__thumb"
                src={category.imageUrl}
                fallback={category.bg}
                alt=""
              />
              <span>
                <span className="vs-mega__name">{category.name}</span>
                <br />
                <span className="vs-mega__count">{category.countText}</span>
              </span>
            </Link>
            {category.children.length > 0 && (
              <div className="vs-mega__sub">
                {category.children.map((child) => (
                  <Link
                    key={child.slug}
                    to={child.href}
                    className="vs-mega__sublink"
                    onClick={onClose}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        <Link to="/packages" className="vs-mega__promo" onClick={onClose}>
          <span className="vs-mega__promo-eyebrow">
            <BoxIcon size={16} /> جاهز للطلب
          </span>
          <span className="vs-mega__promo-title">
            البكجات
            <br />
            الكاملة
          </span>
          <span className="vs-mega__promo-cta">
            كل ما تحتاجه في طلب واحد <ArrowForward size={15} />
          </span>
        </Link>
      </div>
    </div>
  );
}
