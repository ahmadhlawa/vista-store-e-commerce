import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import sx from "../../sx.js";
import { adminApi } from "../../api/adminApi.js";
import { invoiceStatusLabels, paymentMethodLabels } from "../../store.js";
import { formatDate, formatDateTime } from "../../utils/format.js";
import {
  Badge,
  Button,
  ConfirmDialog,
  Field,
  PageHeader,
  Pagination,
  Spinner,
  Table,
  card,
  input,
  useFeedback,
} from "../ui.jsx";

const STATUS_TONE = { issued: "good", cancelled: "bad" };

const amount = (value, symbol) => `${Number(value || 0).toFixed(2)} ${symbol || ""}`.trim();

export function InvoicesPage() {
  const navigate = useNavigate();
  const feedback = useFeedback();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.listInvoices({
        page,
        page_size: 20,
        status: status || undefined,
        q: query || undefined,
        issued_from: from || undefined,
        issued_to: to || undefined,
      });
      setRows(result.items);
      setPages(result.pages);
    } catch (error) {
      feedback.error(error.message || "تعذّر تحميل الفواتير.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, query, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = (setter) => (event) => {
    setPage(1);
    setter(event.target.value);
  };

  return (
    <>
      <PageHeader
        title="الفواتير"
        description="تصدر الفاتورة تلقائياً عند تأكيد الطلب. لا يمكن تعديل فاتورة صادرة أو حذفها."
      />
      {feedback.node}

      <div style={{ ...card, ...sx`display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px` }}>
        <input
          type="search"
          value={query}
          onChange={reset(setQuery)}
          placeholder="رقم الفاتورة أو رقم الطلب أو العميل…"
          aria-label="بحث في الفواتير"
          style={{ ...input, ...sx`flex:1;min-width:220px` }}
        />
        <select value={status} onChange={reset(setStatus)} aria-label="حالة الفاتورة" style={{ ...input, ...sx`width:auto` }}>
          <option value="">كل الحالات</option>
          {Object.entries(invoiceStatusLabels).map(([value, labelText]) => (
            <option key={value} value={value}>{labelText}</option>
          ))}
        </select>
        <input type="date" value={from} onChange={reset(setFrom)} aria-label="من تاريخ" style={{ ...input, ...sx`width:auto` }} />
        <input type="date" value={to} onChange={reset(setTo)} aria-label="إلى تاريخ" style={{ ...input, ...sx`width:auto` }} />
      </div>

      <div style={card}>
        {loading ? (
          <Spinner />
        ) : (
          <Table
            rows={rows}
            empty="لا توجد فواتير بعد. تصدر أول فاتورة عند تأكيد أول طلب."
            columns={[
              {
                key: "invoice_number",
                title: "رقم الفاتورة",
                render: (row) => (
                  <Link to={`/admin/invoices/${row.invoice_number}`} style={sx`font-weight:700`}>
                    {row.invoice_number}
                  </Link>
                ),
              },
              {
                key: "order_number",
                title: "رقم الطلب",
                render: (row) => (
                  <Link to={`/admin/orders/${row.order_id}`}>{row.order_number}</Link>
                ),
              },
              { key: "customer_name", title: "العميل" },
              { key: "issued_at", title: "تاريخ الإصدار", render: (row) => formatDateTime(row.issued_at) },
              {
                key: "grand_total",
                title: "الإجمالي",
                render: (row) => amount(row.grand_total, row.currency_symbol),
              },
              {
                key: "payment_method",
                title: "طريقة الدفع",
                render: (row) => paymentMethodLabels[row.payment_method] || row.payment_method,
              },
              {
                key: "status",
                title: "الحالة",
                render: (row) => (
                  <Badge tone={STATUS_TONE[row.status]}>{invoiceStatusLabels[row.status]}</Badge>
                ),
              },
              {
                key: "actions",
                title: "",
                render: (row) => (
                  <Button
                    variant="ghost"
                    style={sx`min-height:36px;padding:0 12px;font-size:13px`}
                    onClick={() => navigate(`/admin/invoices/${row.invoice_number}`)}
                  >
                    عرض
                  </Button>
                ),
              },
            ]}
          />
        )}
      </div>
      <Pagination page={page} pages={pages} onChange={setPage} />
    </>
  );
}

/**
 * Print rules for the invoice sheet.
 *
 * Printing is done by the browser — "Print" or "Save as PDF" — because the client's
 * cPanel is an unknown quantity and a server-side PDF renderer may simply not run there.
 *
 * `visibility` rather than `display` on the wrapper: it collapses the admin chrome
 * without taking the sheet out of the document, which is what keeps the page break and
 * the RTL table layout intact. Anything marked `.no-print` inside the sheet — buttons,
 * internal notes, audit metadata — is removed outright.
 */
const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 14mm; }
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; box-shadow: none !important; }
  #invoice-sheet, #invoice-sheet * { visibility: visible !important; }
  #invoice-sheet {
    position: absolute !important;
    inset-block-start: 0 !important;
    inset-inline-start: 0 !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    font-size: 12px !important;
  }
  #invoice-sheet .no-print { display: none !important; }
  #invoice-sheet table { page-break-inside: auto; }
  #invoice-sheet tr { page-break-inside: avoid; page-break-after: auto; }
  #invoice-sheet thead { display: table-header-group; }
  #invoice-sheet .invoice-watermark { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

const sheetCell = sx`padding:9px 10px;border-bottom:1px solid #E7E2D9;text-align:start;font-size:13px`;
const sheetHead = sx`padding:9px 10px;border-bottom:2px solid #1F4E4A;text-align:start;font-size:12.5px;font-weight:800;color:#1F4E4A;white-space:nowrap`;

function TotalRow({ label, value, strong = false, tone }) {
  return (
    <div
      style={sx`display:flex;justify-content:space-between;gap:20px;padding:${strong ? "9px 0 0" : "4px 0"};font-size:${strong ? "15px" : "13px"};font-weight:${strong ? 800 : 500};${strong ? "border-top:1px solid #1F4E4A;margin-top:6px;" : ""}${tone ? `color:${tone};` : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Identity({ invoice }) {
  const lines = [
    invoice.legal_business_name,
    invoice.store_address,
    invoice.store_phone && `هاتف: ${invoice.store_phone}`,
    invoice.store_whatsapp && `واتساب: ${invoice.store_whatsapp}`,
    invoice.store_email,
    invoice.registration_number && `رقم التسجيل: ${invoice.registration_number}`,
    invoice.tax_number && `الرقم الضريبي: ${invoice.tax_number}`,
  ].filter(Boolean);

  return (
    <div style={sx`display:flex;flex-direction:column;gap:3px`}>
      <div style={sx`display:flex;align-items:center;gap:10px`}>
        {invoice.store_logo_url && (
          <img src={invoice.store_logo_url} alt="" style={sx`height:46px;width:auto;object-fit:contain`} />
        )}
        <strong style={sx`font-size:19px;color:#1F4E4A`}>{invoice.store_name}</strong>
      </div>
      {lines.map((line) => (
        <span key={line} style={sx`font-size:12px;color:#5A554C;line-height:1.7`}>{line}</span>
      ))}
    </div>
  );
}

export function InvoiceDetailPage() {
  const { invoiceNumber } = useParams();
  const navigate = useNavigate();
  const feedback = useFeedback();
  const [invoice, setInvoice] = useState(null);
  const [missing, setMissing] = useState(false);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setInvoice(await adminApi.getInvoice(invoiceNumber));
    } catch (error) {
      setMissing(true);
      feedback.error(error.message || "تعذّر تحميل الفاتورة.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceNumber]);

  useEffect(() => {
    load();
  }, [load]);

  // "Print invoice" from the order screen links here with ?print=1 and opens the dialog
  // once the sheet has actually rendered — printing an empty page helps nobody.
  const [searchParams, setSearchParams] = useSearchParams();
  const wantsPrint = searchParams.get("print") === "1";
  useEffect(() => {
    if (!invoice || !wantsPrint) return;
    setSearchParams({}, { replace: true });
    if (typeof window.print === "function") window.print();
  }, [invoice, wantsPrint, setSearchParams]);

  const cancel = async () => {
    setBusy(true);
    try {
      setInvoice(await adminApi.cancelInvoice(invoiceNumber, reason || null));
      feedback.success("تم إلغاء الفاتورة والطلب المرتبط بها.");
      setReason("");
    } catch (error) {
      feedback.error(error.message || "تعذّر إلغاء الفاتورة.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  if (missing) {
    return (
      <>
        <PageHeader title="الفاتورة غير موجودة" actions={<Button variant="ghost" onClick={() => navigate("/admin/invoices")}>رجوع</Button>} />
        {feedback.node}
      </>
    );
  }
  if (!invoice) return <Spinner />;

  const symbol = invoice.currency_symbol;
  const cancelled = invoice.status === "cancelled";

  return (
    <>
      <style>{PRINT_CSS}</style>

      <PageHeader
        title={`الفاتورة ${invoice.invoice_number}`}
        description={`الطلب ${invoice.order_number} · ${formatDateTime(invoice.issued_at)}`}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate("/admin/invoices")}>رجوع</Button>
            <Button variant="ghost" onClick={() => navigate(`/admin/orders/${invoice.order_id}`)}>عرض الطلب</Button>
            <Button onClick={() => window.print()}>طباعة الفاتورة</Button>
          </>
        }
      />
      {feedback.node}

      {/* The printable sheet. Everything outside it is admin chrome and prints nothing. */}
      <div
        id="invoice-sheet"
        style={{
          ...card,
          ...sx`direction:rtl;position:relative;max-width:820px;margin:0 auto 18px;padding:26px;overflow:hidden`,
        }}
      >
        {cancelled && (
          <div
            className="invoice-watermark"
            aria-hidden="true"
            style={sx`position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2`}
          >
            <span style={sx`font-size:76px;font-weight:800;color:rgba(192,57,43,.16);transform:rotate(-24deg);letter-spacing:6px;white-space:nowrap`}>
              ملغاة
            </span>
          </div>
        )}

        <div style={sx`display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;border-bottom:2px solid #1F4E4A;padding-bottom:16px;margin-bottom:18px`}>
          <Identity invoice={invoice} />
          <div style={sx`display:flex;flex-direction:column;gap:4px;text-align:start;min-width:210px`}>
            <strong style={sx`font-size:20px`}>
              {invoice.tax_enabled ? "فاتورة ضريبية" : "فاتورة"}
            </strong>
            <span style={sx`font-size:13px`}>رقم الفاتورة: <strong>{invoice.invoice_number}</strong></span>
            <span style={sx`font-size:13px`}>رقم الطلب: <strong>{invoice.order_number}</strong></span>
            <span style={sx`font-size:13px`}>تاريخ الإصدار: {formatDate(invoice.issued_at)}</span>
            <span style={sx`font-size:13px`}>
              الحالة:{" "}
              <strong style={sx`color:${cancelled ? "#C0392B" : "#1F6B4A"}`}>
                {invoiceStatusLabels[invoice.status]}
              </strong>
            </span>
          </div>
        </div>

        <div style={sx`display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-bottom:18px`}>
          <div style={sx`display:flex;flex-direction:column;gap:3px`}>
            <strong style={sx`font-size:13px;color:#1F4E4A;margin-bottom:3px`}>بيانات العميل</strong>
            <span style={sx`font-size:13px`}>{invoice.customer_name}</span>
            <span style={sx`font-size:13px`}>{invoice.customer_phone}</span>
            {invoice.customer_email && <span style={sx`font-size:13px`}>{invoice.customer_email}</span>}
          </div>
          <div style={sx`display:flex;flex-direction:column;gap:3px`}>
            <strong style={sx`font-size:13px;color:#1F4E4A;margin-bottom:3px`}>عنوان التوصيل</strong>
            <span style={sx`font-size:13px;line-height:1.8`}>{invoice.delivery_address}</span>
            {invoice.delivery_area_name && (
              <span style={sx`font-size:13px`}>المنطقة: {invoice.delivery_area_name}</span>
            )}
          </div>
          <div style={sx`display:flex;flex-direction:column;gap:3px`}>
            <strong style={sx`font-size:13px;color:#1F4E4A;margin-bottom:3px`}>طريقة الدفع</strong>
            <span style={sx`font-size:13px`}>
              {paymentMethodLabels[invoice.payment_method] || invoice.payment_method}
            </span>
            <span style={sx`font-size:12px;color:#7C766D`}>العملة: {invoice.currency_code}</span>
          </div>
        </div>

        <div style={sx`overflow-x:auto`}>
          <table style={sx`width:100%;border-collapse:collapse;min-width:520px`}>
            <thead>
              <tr>
                <th style={sheetHead}>#</th>
                <th style={sheetHead}>المنتج</th>
                <th style={sheetHead}>الخيار</th>
                <th style={sheetHead}>SKU</th>
                <th style={sheetHead}>سعر القطعة</th>
                <th style={sheetHead}>الكمية</th>
                <th style={sheetHead}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id}>
                  <td style={sheetCell}>{index + 1}</td>
                  <td style={sheetCell}>{item.product_name}</td>
                  <td style={sheetCell}>{item.variant_description || "—"}</td>
                  <td style={sheetCell}>{item.sku || "—"}</td>
                  <td style={sheetCell}>{amount(item.unit_price, symbol)}</td>
                  <td style={sheetCell}>{item.quantity}</td>
                  <td style={sheetCell}>{amount(item.line_total, symbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={sx`display:flex;justify-content:flex-start;margin-top:16px`}>
          <div style={sx`width:min(320px,100%);margin-inline-start:auto`}>
            <TotalRow label="المجموع الفرعي" value={amount(invoice.subtotal, symbol)} />
            {invoice.discount > 0 && (
              <TotalRow
                label={`الخصم${invoice.coupon_code ? ` (${invoice.coupon_code})` : ""}`}
                value={`− ${amount(invoice.discount, symbol)}`}
                tone="#1F6B4A"
              />
            )}
            <TotalRow label="رسوم التوصيل" value={amount(invoice.delivery_fee, symbol)} />
            {invoice.tax_enabled && (
              <TotalRow
                label={`الضريبة (${Number(invoice.tax_rate)}٪${invoice.prices_include_tax ? " — شاملة" : ""})`}
                value={amount(invoice.tax_amount, symbol)}
              />
            )}
            <TotalRow label="الإجمالي المستحق" value={amount(invoice.grand_total, symbol)} strong />
          </div>
        </div>

        {invoice.customer_notes && (
          <div style={sx`margin-top:18px;padding-top:12px;border-top:1px solid #E7E2D9`}>
            <strong style={sx`font-size:12.5px;color:#1F4E4A`}>ملاحظات العميل</strong>
            <p style={sx`margin:5px 0 0;font-size:12.5px;line-height:1.8;color:#4A453E`}>
              {invoice.customer_notes}
            </p>
          </div>
        )}

        {cancelled && (
          <p style={sx`margin:16px 0 0;font-size:12.5px;color:#8C2F22;font-weight:700`}>
            أُلغيت هذه الفاتورة بتاريخ {formatDateTime(invoice.cancelled_at)}
            {invoice.cancellation_reason ? ` — ${invoice.cancellation_reason}` : ""}.
          </p>
        )}
      </div>

      {/* Admin-only controls. Outside the sheet, so they can never reach a printed page. */}
      {!cancelled && (
        <div style={{ ...card, ...sx`margin-bottom:30px;max-width:820px;margin-inline:auto` }}>
          <h2 style={sx`margin:0 0 6px;font-size:16px;font-weight:800`}>إلغاء الفاتورة</h2>
          <p style={sx`margin:0 0 12px;font-size:12.5px;color:#7C766D;line-height:1.8`}>
            إلغاء الفاتورة يلغي الطلب المرتبط بها ويعيد المخزون المحجوز. تبقى الفاتورة ورقمها
            محفوظين للأبد ولا يُعاد استخدام الرقم.
          </p>
          <Field title="سبب الإلغاء (اختياري)">
            <input value={reason} onChange={(event) => setReason(event.target.value)} style={input} />
          </Field>
          <div style={sx`margin-top:12px`}>
            <Button variant="danger" disabled={busy} onClick={() => setConfirming(true)}>
              {busy ? "جارٍ الإلغاء…" : "إلغاء الفاتورة والطلب"}
            </Button>
          </div>
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title="تأكيد إلغاء الفاتورة"
          message="سيُلغى الطلب المرتبط ويُعاد المخزون. تبقى الفاتورة محفوظة بحالة «ملغاة» ولا يمكن التراجع."
          confirmLabel="إلغاء الفاتورة"
          onConfirm={cancel}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
