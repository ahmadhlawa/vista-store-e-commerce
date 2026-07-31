import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { CheckoutPage } from "../components/CartCheckout.jsx";
import { useStore } from "../app/StoreProvider.jsx";
import { checkoutService } from "../services/checkout.js";
import { orderTokenStorage } from "../storage/authStorage.js";
import { paymentMethods } from "../store.js";

function validate(form) {
  const errors = {};
  if (!form.name || form.name.trim().length < 3) errors.name = "الرجاء إدخال الاسم الكامل";
  if (!/^\+?\d{7,15}$/.test(String(form.phone).replace(/[\s-()]/g, ""))) {
    errors.phone = "رقم هاتف غير صالح — مثال 0591234567";
  }
  if (!form.areaId) errors.area = "اختر منطقة التوصيل";
  if (!form.address || form.address.trim().length < 6) errors.address = "الرجاء إدخال عنوان واضح";
  if (!form.terms) errors.terms = "يجب الموافقة على الشروط قبل إتمام الطلب";
  return errors;
}

export default function CheckoutRoutePage() {
  const shell = useOutletContext();
  const store = useStore();
  const navigate = useNavigate();
  const { checkoutForm: form, setCheckoutForm, cart, coupon } = store;

  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [priced, setPriced] = useState(null);
  const [pricingNote, setPricingNote] = useState("");

  // Every displayed number is recomputed by the server, so a stale cart or a
  // tampered price can never become an order total.
  useEffect(() => {
    let cancelled = false;
    if (!cart.length) {
      setPriced(null);
      return undefined;
    }
    checkoutService
      .price(cart, { couponCode: coupon.applied || null, deliveryAreaId: form.areaId })
      .then((result) => {
        if (cancelled) return;
        setPriced(result);
        setPricingNote("جميع المبالغ محسوبة من الخادم عند إتمام الطلب.");
        setSubmitError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setPriced(null);
        setSubmitError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [cart, coupon.applied, form.areaId]);

  const update = (patch) => setCheckoutForm((current) => ({ ...current, ...patch }));

  const placeOrder = async (event) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setPlacing(true);
    setSubmitError(null);
    try {
      const order = await checkoutService.placeOrder(cart, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim(),
        deliveryAreaId: form.areaId,
        couponCode: coupon.applied || null,
        paymentMethod: form.payment,
        notes: form.notes.trim() || null,
      });
      orderTokenStorage.save(order.order_number, order.public_token);
      store.clearCart();
      store.setCoupon({
        input: "",
        applied: "",
        label: "",
        message: "",
        ok: false,
        discount: 0,
      });
      navigate(`/order-success/${order.order_number}`, { replace: true });
    } catch (error) {
      setSubmitError(error.message || "تعذّر إتمام الطلب. حاول مرة أخرى.");
    } finally {
      setPlacing(false);
    }
  };

  const totals = priced || { subtotal: 0, discount: 0, shipping: 0, total: 0, areaName: "" };

  const v = {
    ...shell,
    checkoutEmpty: cart.length === 0,
    ck: form,
    err: {
      name: errors.name,
      phone: errors.phone,
      address: errors.address,
      area: errors.area,
      terms: errors.terms,
      nameBorder: errors.name ? "#C0392B" : "#E1DACE",
      phoneBorder: errors.phone ? "#C0392B" : "#E1DACE",
      addressBorder: errors.address ? "#C0392B" : "#E1DACE",
      areaBorder: errors.area ? "#C0392B" : "#E1DACE",
    },
    setName: (event) => update({ name: event.target.value }),
    setPhone: (event) => update({ phone: event.target.value }),
    setEmail: (event) => update({ email: event.target.value }),
    setArea: (event) => update({ areaId: event.target.value ? Number(event.target.value) : null }),
    setAddress: (event) => update({ address: event.target.value }),
    setNotes: (event) => update({ notes: event.target.value }),
    setTerms: () => update({ terms: !form.terms }),
    payments: paymentMethods.map((method) => ({
      ...method,
      checked: form.payment === method.key,
      border: form.payment === method.key ? "#1F4E4A" : "#E9E3DA",
      bg: form.payment === method.key ? "#F3F7F6" : "#fff",
      pick: () => update({ payment: method.key }),
    })),
    placeOrder,
    placing,
    placingOpacity: placing ? 0.75 : 1,
    placeLabel: placing ? "جارٍ إرسال الطلب…" : `تأكيد الطلب — ${shell.money(totals.total)}`,
    submitError,
    areaName: totals.areaName || "",
    ckSubtotalText: shell.money(totals.subtotal),
    ckDiscountText: shell.money(totals.discount),
    ckHasDiscount: totals.discount > 0,
    ckShippingText: totals.shipping ? shell.money(totals.shipping) : "مجاني",
    ckTotalText: shell.money(totals.total),
    pricingNote,
  };

  return <CheckoutPage v={v} />;
}
