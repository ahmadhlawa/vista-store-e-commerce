import { useEffect, useState } from "react";
import sx from "../../sx.js";
import { adminApi } from "../../api/adminApi.js";
import { Button, Field, PageHeader, Spinner, card, input, textarea, useFeedback } from "../ui.jsx";

const GROUPS = [
  {
    title: "هوية المتجر",
    fields: [
      ["store_name", "اسم المتجر"],
      ["store_tagline", "الوصف المختصر"],
      ["logo_url", "رابط الشعار"],
      ["favicon_url", "رابط أيقونة المتصفح"],
      ["announcement", "شريط الإعلان أعلى الموقع"],
    ],
  },
  {
    title: "بيانات التواصل",
    fields: [
      ["phone", "الهاتف"],
      ["whatsapp", "واتساب"],
      ["email", "البريد الإلكتروني"],
      ["address", "العنوان"],
      ["location_url", "رابط الموقع على الخريطة"],
      ["working_hours", "ساعات العمل"],
      ["order_notifications_email", "بريد إشعارات الطلبات (داخلي)"],
    ],
  },
  {
    title: "روابط التواصل الاجتماعي",
    fields: [
      ["instagram_url", "إنستغرام"],
      ["facebook_url", "فيسبوك"],
      ["tiktok_url", "تيك توك"],
      ["youtube_url", "يوتيوب"],
    ],
  },
  {
    title: "العملة",
    fields: [
      ["currency_code", "رمز العملة (ILS)"],
      ["currency_symbol", "رمز العرض (₪)"],
    ],
  },
  {
    title: "الألوان",
    colors: true,
    fields: [
      ["primary_color", "اللون الأساسي"],
      ["secondary_color", "اللون الثانوي"],
      ["accent_color", "لون التمييز"],
    ],
  },
  {
    title: "تحسين محركات البحث",
    fields: [["seo_title", "عنوان SEO"]],
    textareas: [["seo_description", "وصف SEO"]],
  },
];

const EDITABLE = GROUPS.flatMap((group) => [
  ...(group.fields || []).map(([key]) => key),
  ...(group.textareas || []).map(([key]) => key),
]);

export default function SettingsPage() {
  const feedback = useFeedback();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi
      .getSettings()
      .then((row) => {
        const values = {};
        EDITABLE.forEach((key) => {
          values[key] = row[key] ?? "";
        });
        values.maintenance_mode = !!row.maintenance_mode;
        setForm(values);
      })
      .catch((error) => feedback.error(error.message || "تعذّر تحميل الإعدادات."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { maintenance_mode: !!form.maintenance_mode };
      EDITABLE.forEach((key) => {
        const value = typeof form[key] === "string" ? form[key].trim() : form[key];
        payload[key] = value === "" ? null : value;
      });
      // These three are required strings on the server; never send null.
      ["store_name", "currency_code", "currency_symbol"].forEach((key) => {
        if (!payload[key]) delete payload[key];
      });
      await adminApi.updateSettings(payload);
      feedback.success("تم حفظ الإعدادات. أعد تحميل المتجر لرؤية التغييرات.");
    } catch (error) {
      feedback.error(error.message || "تعذّر حفظ الإعدادات.");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <Spinner />;

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <>
      <PageHeader
        title="إعدادات المتجر"
        description="هوية المتجر وبيانات التواصل والألوان والعملة — تنعكس مباشرة على الواجهة."
        actions={<Button onClick={save} disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ"}</Button>}
      />
      {feedback.node}

      {GROUPS.map((group) => (
        <div key={group.title} style={{ ...card, ...sx`margin-bottom:16px` }}>
          <h2 style={sx`margin:0 0 14px;font-size:16px;font-weight:800`}>{group.title}</h2>
          <div style={sx`display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px`}>
            {(group.fields || []).map(([key, title]) => (
              <Field key={key} title={title}>
                <input
                  type={group.colors ? "color" : "text"}
                  value={form[key] ?? ""}
                  onChange={(event) => update(key, event.target.value)}
                  style={input}
                />
              </Field>
            ))}
          </div>
          {(group.textareas || []).map(([key, title]) => (
            <Field key={key} title={title}>
              <textarea rows="3" value={form[key] ?? ""} onChange={(event) => update(key, event.target.value)} style={textarea} />
            </Field>
          ))}
        </div>
      ))}

      <div style={{ ...card, ...sx`margin-bottom:30px` }}>
        <label style={sx`display:flex;align-items:center;gap:10px;font-size:14px;font-weight:700;cursor:pointer`}>
          <input
            type="checkbox"
            checked={!!form.maintenance_mode}
            onChange={(event) => update("maintenance_mode", event.target.checked)}
            style={sx`width:18px;height:18px;accent-color:#1F4E4A`}
          />
          وضع الصيانة
        </label>
        <p style={sx`margin:8px 0 0;font-size:12.5px;color:#9C958A`}>يُعلن هذا الحقل عبر واجهة المتجر ليستخدمه المطوّر لاحقاً؛ لا يوقف المتجر تلقائياً في هذه النسخة.</p>
      </div>

      <div style={sx`margin-bottom:30px`}>
        <Button onClick={save} disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}</Button>
      </div>
    </>
  );
}
