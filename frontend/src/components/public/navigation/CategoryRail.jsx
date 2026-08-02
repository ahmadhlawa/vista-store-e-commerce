import { NavLink } from "react-router-dom";
import { useCategoryNav } from "../../../hooks/useStorefront.js";

/**
 * Mobile-only horizontal category strip under the header. It gives the phone
 * layout the same one-tap route into the catalogue that desktop gets from the
 * nav band, without stealing sticky height.
 */
export default function CategoryRail() {
  const categories = useCategoryNav();
  if (!categories.length) return null;

  return (
    <nav className="vs-catrail" aria-label="الأقسام">
      <div className="vs-container vs-catrail__row">
        <NavLink to="/shop" end className="vs-chip vs-catrail__chip">
          كل المنتجات
        </NavLink>
        {categories.map((category) => (
          <NavLink key={category.slug} to={category.href} className="vs-chip vs-catrail__chip">
            {category.name}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
