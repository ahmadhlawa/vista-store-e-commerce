import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ContactPage } from "../components/Pages.jsx";
import { storefrontService } from "../services/storefront.js";
import { whatsappHref } from "../utils/format.js";

export default function ContactRoutePage() {
  const shell = useOutletContext();
  const [form, setForm] = useState({ name: "", phone: "", msg: "" });
  const [error, setError] = useState("");
  const [lead, setLead] = useState("");

  useEffect(() => {
    let cancelled = false;
    storefrontService
      .page("contact")
      .then((page) => !cancelled && setLead(page.lead || page.body[0] || ""))
      .catch(() => !cancelled && setLead(""));
    return () => {
      cancelled = true;
    };
  }, []);

  // There is no contact endpoint in this MVP; instead of pretending the message
  // was sent, the form composes a WhatsApp message the customer actually sends.
  const submitContact = (event) => {
    event.preventDefault();
    if (!form.msg.trim()) {
      setError("اكتب رسالتك أولاً");
      return;
    }
    if (!shell.whatsapp) {
      setError("رقم الواتساب غير مضبوط في إعدادات المتجر");
      return;
    }
    setError("");
    const text = `الاسم: ${form.name || "-"}\nالهاتف: ${form.phone || "-"}\n\n${form.msg}`;
    window.open(whatsappHref(shell.whatsapp, text), "_blank", "noopener");
  };

  const contactRows = [
    { label: "الهاتف", value: shell.phone },
    { label: "واتساب", value: shell.whatsapp },
    { label: "الموقع", value: shell.location },
    { label: "ساعات العمل", value: shell.hours },
  ].filter((row) => row.value);

  const v = {
    ...shell,
    contactLead: lead || `فريق الدعم متاح ${shell.hours || "خلال ساعات العمل"}.`,
    contact: form,
    contactError: error,
    setContactName: (event) => setForm((current) => ({ ...current, name: event.target.value })),
    setContactPhone: (event) => setForm((current) => ({ ...current, phone: event.target.value })),
    setContactMsg: (event) => setForm((current) => ({ ...current, msg: event.target.value })),
    submitContact,
    contactRows,
  };

  return <ContactPage v={v} />;
}
