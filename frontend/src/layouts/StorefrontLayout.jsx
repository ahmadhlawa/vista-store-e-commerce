import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import sx from "../sx.js";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Overlays from "../components/Overlays.jsx";
import MaintenanceScreen from "../components/Maintenance.jsx";
import { TrustStrip } from "../components/Home.jsx";
import { useShellView } from "../hooks/useShellView.js";
import { useStore } from "../app/StoreProvider.jsx";

/**
 * The storefront chrome. Builds the shared view-model once and hands it to the
 * design components and, through the router outlet, to every page.
 */
export default function StorefrontLayout() {
  const location = useLocation();
  const store = useStore();
  const shell = useShellView();
  const [quickQty, setQuickQty] = useState(1);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    store.closeAll();
    // Only the path matters: re-running on every store change would fight the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (store.overlays.quick) setQuickQty(1);
  }, [store.overlays.quick]);

  const v = {
    ...shell,
    qQty: quickQty,
    qQtyUp: () => setQuickQty((value) => value + 1),
    qQtyDown: () => setQuickQty((value) => Math.max(1, value - 1)),
    addFromQuick: () => {
      if (store.overlays.quick) {
        store.addToCart(store.overlays.quick, quickQty, null);
        store.closeAll();
      }
    },
  };

  // Maintenance mode replaces the storefront in place — no redirect, so there is no
  // loop and no route to get stuck on. Gated on `ready` so the real setting decides,
  // not the pre-fetch default. /admin never renders this layout.
  if (store.ready && store.settings.maintenanceMode) {
    return <MaintenanceScreen settings={store.settings} />;
  }

  return (
    <div style={sx`direction:rtl;background:#FBF9F6;min-height:100vh;display:flex;flex-direction:column`}>
      <Header v={v} />
      <main style={sx`flex:1`}>
        {store.loadError && (
          <div
            role="alert"
            style={sx`max-width:1360px;margin:16px auto 0;padding:14px 18px;border:1px solid #E7CFC9;background:#FBF1EF;color:#8C2F22;border-radius:12px;font-size:13.5px`}
          >
            تعذّر تحميل بيانات المتجر من الخادم. تأكد من تشغيل واجهة FastAPI ثم أعد تحميل الصفحة.
          </div>
        )}
        <Outlet context={v} />
        {/* The homepage places the trust strip itself, between its two halves. */}
        {location.pathname !== "/" && <TrustStrip v={v} />}
      </main>
      <Footer v={v} />
      <Overlays v={v} />
    </div>
  );
}
