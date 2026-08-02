import { Link, NavLink } from "react-router-dom";
import { OVERLAY, useStore } from "../../../app/StoreProvider.jsx";
import { useCartCountPulse } from "../../../hooks/useCartCountPulse.js";
import { useMoney } from "../../../hooks/useStorefront.js";
import { navLinks } from "../../../store.js";
import SearchBox from "../search/SearchBox.jsx";
import CategoryMega from "../navigation/CategoryMega.jsx";
import CategoryRail from "../navigation/CategoryRail.jsx";
import { CartIcon, MenuIcon, PhoneIcon, SearchIcon, UserIcon } from "./icons.jsx";

function StoreMark({ settings }) {
  return (
    <Link to="/" className="vs-logo" aria-label={`${settings.storeName} — الصفحة الرئيسية`}>
      {settings.logoUrl ? (
        <img className="vs-logo__img" src={settings.logoUrl} alt={settings.storeName} />
      ) : (
        <span className="vs-logo__name">{settings.storeName}</span>
      )}
      {settings.tagline && <span className="vs-logo__tag">{settings.tagline}</span>}
    </Link>
  );
}

export default function Header() {
  const store = useStore();
  const money = useMoney();
  const { settings, cart, scrolled, overlay, openOverlay, closeAll } = store;

  const count = cart.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = cart.reduce((sum, line) => sum + line.unit * line.qty, 0);
  const pulse = useCartCountPulse(count);
  const megaOpen = overlay === OVERLAY.CATEGORIES;

  return (
    <>
      {store.announce && settings.announcement && (
        <div className="vs-announce">
          <div className="vs-container vs-announce__row">
            <span>{settings.announcement}</span>
            <button
              type="button"
              className="vs-announce__close"
              onClick={() => store.setAnnounce(false)}
              aria-label="إغلاق شريط الإعلان"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <header className="vs-header" data-scrolled={scrolled}>
        <div className="vs-header__main">
          <div className="vs-container vs-header__row">
            <button
              type="button"
              className="vs-iconbtn vs-mob"
              onClick={() => openOverlay(OVERLAY.MENU)}
              aria-label="فتح القائمة"
              aria-expanded={overlay === OVERLAY.MENU}
            >
              <MenuIcon size={20} />
            </button>

            <StoreMark settings={settings} />

            <div className="vs-desk vs-header__search">
              <SearchBox />
            </div>

            {settings.phone && (
              <div className="vs-hcontact vs-desk">
                <span className="vs-hcontact__icon">
                  <PhoneIcon size={17} />
                </span>
                <span className="vs-hcontact__text">
                  <a className="vs-hcontact__num" href={`tel:${settings.phone}`}>
                    {settings.phone}
                  </a>
                  {settings.hours && <span className="vs-hcontact__hours">{settings.hours}</span>}
                </span>
              </div>
            )}

            <div className="vs-hactions">
              <button
                type="button"
                className="vs-iconbtn vs-mob"
                onClick={() => openOverlay(OVERLAY.SEARCH)}
                aria-label="بحث"
                aria-expanded={overlay === OVERLAY.SEARCH}
              >
                <SearchIcon size={19} />
              </button>

              <Link to="/track-order" className="vs-iconbtn vs-desk" aria-label="تتبّع الطلب">
                <UserIcon size={18} />
              </Link>

              <button
                type="button"
                className="vs-cartbtn"
                onClick={() => openOverlay(OVERLAY.CART)}
                aria-label="عربة التسوّق"
                aria-expanded={overlay === OVERLAY.CART}
              >
                <CartIcon size={19} />
                <span className="vs-desk vs-cartbtn__total">{money(subtotal)}</span>
                <span
                  key={pulse}
                  className="vs-cartbtn__badge"
                  data-motion="transform"
                  style={{ animation: pulse ? "vs-pulse .42s ease" : "none" }}
                >
                  {count}
                </span>
              </button>
            </div>
          </div>
        </div>

        <nav className="vs-nav" aria-label="التنقّل الرئيسي">
          <div className="vs-container vs-nav__row">
            <button
              type="button"
              className="vs-nav__cats"
              onClick={() => (megaOpen ? closeAll() : openOverlay(OVERLAY.CATEGORIES))}
              aria-expanded={megaOpen}
              aria-controls="vs-mega"
            >
              <MenuIcon size={15} />
              كل الأقسام
            </button>

            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                end={link.href === "/"}
                className="vs-nav__link"
              >
                {link.label}
              </NavLink>
            ))}

            {settings.hours && (
              <span className="vs-nav__hours">
                <span aria-hidden="true">✦</span>
                {settings.hours}
              </span>
            )}
          </div>

          {megaOpen && <CategoryMega onClose={closeAll} />}
        </nav>
      </header>

      <CategoryRail />
    </>
  );
}
