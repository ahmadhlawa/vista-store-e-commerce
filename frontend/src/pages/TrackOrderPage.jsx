import { useState } from "react";
import { checkoutService } from "../services/checkout.js";
import { orderTokenStorage } from "../storage/authStorage.js";
import { orderStatusLabels } from "../store.js";

// The confirmation token is stored in this browser when the order is placed, so
// tracking never exposes an order to somebody who only guessed its number.
const FLOW = ["pending", "confirmed", "processing", "ready", "shipped", "delivered"];

export default function TrackOrderPage() {
  const [value, setValue] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const track = async (event) => {
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

  return (
    <section className="vs-container vs-container--narrow vs-section">
      <h1 className="vs-page__title">تتبّع الطلب</h1>
      <p className="vs-page__lead">
        أدخل رقم الطلب الذي ظهر لك عند التأكيد. يعمل التتبّع على المتصفح الذي أنشأت منه الطلب.
      </p>

      <form className="vs-track__form" onSubmit={track}>
        <input
          className="vs-input"
          type="text"
          dir="ltr"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="ORD-260731-1234"
          aria-label="رقم الطلب"
          aria-describedby={error ? "vs-track-error" : undefined}
        />
        <button type="submit" className="vs-btn vs-btn--primary vs-btn--lg" disabled={loading}>
          {loading ? "جارٍ البحث…" : "تتبّع"}
        </button>
      </form>

      {error && (
        <p className="vs-field__error" id="vs-track-error" role="alert">
          {error}
        </p>
      )}

      {order && (
        <div className="vs-track__result">
          <h2 className="vs-track__title">الطلب {order.order_number}</h2>
          <p className="vs-track__status">
            الحالة الحالية: <strong>{orderStatusLabels[order.status] || order.status}</strong>
          </p>
          <ol className="vs-steps">
            {cancelled ? (
              <li className="vs-steps__item" data-state="cancelled">
                <span className="vs-steps__dot" aria-hidden="true">
                  ✕
                </span>
                {orderStatusLabels.cancelled}
              </li>
            ) : (
              FLOW.map((step, index) => (
                <li
                  key={step}
                  className="vs-steps__item"
                  data-state={index <= currentIndex ? "done" : "todo"}
                >
                  <span className="vs-steps__dot" aria-hidden="true">
                    {index <= currentIndex ? "✓" : "•"}
                  </span>
                  {orderStatusLabels[step]}
                </li>
              ))
            )}
          </ol>
        </div>
      )}
    </section>
  );
}
