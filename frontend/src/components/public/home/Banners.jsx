import { Link } from "react-router-dom";
import Media from "../shell/Media.jsx";
import { ArrowForward } from "../shell/icons.jsx";

/** Compact promotional tile — used in the column beside the hero. */
export function PromoTile({ banner, eager = false }) {
  if (!banner) return null;
  return (
    <Link to={banner.href} className="vs-promo">
      <Media
        className="vs-promo__media"
        src={banner.imageUrl}
        fallback={banner.fallback}
        alt=""
        eager={eager}
      />
      <span className="vs-promo__veil" />
      {banner.desc && <span className="vs-promo__eyebrow">{banner.desc}</span>}
      <span className="vs-promo__title">{banner.title}</span>
      <span className="vs-promo__cta">
        {banner.cta} <ArrowForward size={15} />
      </span>
    </Link>
  );
}

/** Full-width editorial band between two product sections. */
export function StripBanner({ banner }) {
  if (!banner) return null;
  return (
    <Link to={banner.href} className="vs-strip">
      <Media className="vs-strip__media" src={banner.imageUrl} fallback={banner.fallback} alt="" />
      <span className="vs-strip__veil" />
      <span className="vs-strip__body">
        <span className="vs-strip__title">{banner.title}</span>
        {banner.desc && <span className="vs-strip__desc">{banner.desc}</span>}
        <span className="vs-promo__cta">
          {banner.cta} <ArrowForward size={15} />
        </span>
      </span>
    </Link>
  );
}
