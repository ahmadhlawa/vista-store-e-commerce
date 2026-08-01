import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { OrderSuccessPage } from "../components/Pages.jsx";
import { checkoutService } from "../services/checkout.js";
import { orderTokenStorage } from "../storage/authStorage.js";
import { orderStatusLabels } from "../store.js";

export default function OrderSuccessRoutePage() {
  const shell = useOutletContext();
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    const token = orderTokenStorage.load(orderNumber);
    if (!token) {
      setStatus("missing");
      return undefined;
    }
    checkoutService
      .order(orderNumber, token)
      .then((value) => {
        if (cancelled) return;
        setOrder(value);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("missing"));
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  const v = {
    ...shell,
    loading: status === "loading",
    notFound: status === "missing",
    order,
    statusLabel: order ? orderStatusLabels[order.status] || order.status : "",
  };

  return <OrderSuccessPage v={v} />;
}
