import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { TrackPage } from "../components/Pages.jsx";
import { checkoutService } from "../services/checkout.js";
import { orderTokenStorage } from "../storage/authStorage.js";
import { orderStatusLabels } from "../store.js";

// The confirmation token is stored in this browser when the order is placed, so
// tracking never exposes an order to somebody who only guessed its number.
const FLOW = ["pending", "confirmed", "processing", "ready", "shipped", "delivered"];

export default function TrackOrderPage() {
  const shell = useOutletContext();
  const [value, setValue] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const doTrack = async (event) => {
    event.preventDefault();
    const orderNumber = value.trim().toUpperCase();
    if (!orderNumber) return;
    setLoading(true);
    setError("");
    setOrder(null);

    const token = orderTokenStorage.load(orderNumber);
    if (!token) {
      setLoading(false);
      setError("لم نجد هذا الطلب على هذا المتصفح. افتح رابط التأكيد أو تواصل معنا.");
      return;
    }
    try {
      setOrder(await checkoutService.order(orderNumber, token));
    } catch (cause) {
      setError(cause.message || "تعذّر العثور على الطلب.");
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = order ? FLOW.indexOf(order.status) : -1;
  const cancelled = order?.status === "cancelled";

  const v = {
    ...shell,
    trackId: value,
    setTrackId: (event) => setValue(event.target.value),
    doTrack,
    trackLabel: loading ? "جارٍ البحث…" : "تتبّع",
    trackError: error,
    trackOrder: order,
    trackStatusLabel: order ? orderStatusLabels[order.status] || order.status : "",
    trackSteps: cancelled
      ? [
          {
            title: orderStatusLabels.cancelled,
            mark: "✕",
            dotBg: "#C0392B",
            dotColor: "#fff",
            titleColor: "#1E1B18",
          },
        ]
      : FLOW.map((step, index) => {
          const done = index <= currentIndex;
          return {
            title: orderStatusLabels[step],
            mark: done ? "✓" : "•",
            dotBg: done ? "#2E7D5B" : "#EDE8E0",
            dotColor: done ? "#fff" : "#A39C90",
            titleColor: done ? "#1E1B18" : "#9C958A",
          };
        }),
  };

  return <TrackPage v={v} />;
}
