import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import sx from "../../sx.js";
import { adminApi } from "../../api/adminApi.js";
import { orderStatusLabels } from "../../store.js";
import { formatDateTime } from "../../utils/format.js";
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
  textarea,
  useFeedback,
} from "../ui.jsx";

const STATUS_TONE = {
  pending: "warn",
  confirmed: "good",
  processing: "neutral",
  ready: "neutral",
  shipped: "neutral",
  delivered: "good",
  cancelled: "bad",
};

export function OrdersPage() {
  const navigate = useNavigate();
  const feedback = useFeedback();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.listOrders({
        page,
        page_size: 20,
        status: status || undefined,
        q: query || undefined,
      });
      setRows(result.items);
      setPages(result.pages);
    } catch (error) {
      feedback.error(error.message || "تعذّر تحميل الطلبات.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="الطلبات" description="متابعة الطلبات وتحديث حالتها." />
      {feedback.node}
      <div style={{ ...card, ...sx`display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px` }}>
        <input
          type="search"
          value={query}
          onChange={(event) => { setPage(1); setQuery(event.target.value); }}
          placeholder="رقم الطلب أو اسم العميل أو الهاتف…"
          style={{ ...input, ...sx`flex:1;min-width:220px` }}
        />
        <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }} style={{ ...input, ...sx`width:auto` }}>
          <option value="">كل الحالات</option>
          {Object.entries(orderStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div style={card}>
        {loading ? (
          <Spinner />
        ) : (
          <Table
            rows={rows}
            empty="لا توجد طلبات مطابقة."
            columns={[
              {
                key: "order_number",
                title: "رقم الطلب",
                render: (row) => <Link to={`/admin/orders/${row.id}`} style={sx`font-weight:700`}>{row.order_number}</Link>,
              },
              { key: "customer_name", title: "العميل" },
              { key: "customer_phone", title: "الهاتف" },
              { key: "delivery_area_name", title: "المنطقة", render: (row) => row.delivery_area_name || "—" },
              { key: "items_count", title: "الأصناف" },
              { key: "total", title: "الإجمالي", render: (row) => Math.round(row.total) },
              {
                key: "status",
                title: "الحالة",
                render: (row) => <Badge tone={STATUS_TONE[row.status]}>{orderStatusLabels[row.status]}</Badge>,
              },
              { key: "created_at", title: "التاريخ", render: (row) => formatDateTime(row.created_at) },
              {
                key: "actions",
                title: "",
                render: (row) => (
                  <Button variant="ghost" style={sx`min-height:36px;padding:0 12px;font-size:13px`} onClick={() => navigate(`/admin/orders/${row.id}`)}>عرض</Button>
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

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const feedback = useFeedback();
  const [order, setOrder] = useState(null);
  const [notes, setNotes] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    try {
      const row = await adminApi.getOrder(orderId);
      setOrder(row);
      setNotes(row.admin_notes || "");
      setNextStatus(row.status);
    } catch (error) {
      feedback.error(error.message || "تعذّر تحميل الطلب.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const applyStatus = async () => {
    setBusy(true);
    try {
      setOrder(await adminApi.updateOrderStatus(orderId, nextStatus, note || null));
      setNote("");
      feedback.success("تم تحديث حالة الطلب.");
    } catch (error) {
      feedback.error(error.message || "تعذّر تحديث الحالة.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  const saveNotes = async () => {
    try {
      setOrder(await adminApi.updateOrderNotes(orderId, notes));
      feedback.success("تم حفظ الملاحظات.");
    } catch (error) {
      feedback.error(error.message || "تعذّر حفظ الملاحظات.");
    }
  };

  if (!order) return <Spinner />;

  return (
    <>
      <PageHeader
        title={`الطلب ${order.order_number}`}
        description={`${order.customer_name} · ${formatDateTime(order.created_at)}`}
        actions={<Button variant="ghost" onClick={() => navigate("/admin/orders")}>رجوع</Button>}
      />
      {feedback.node}

      <div style={sx`display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-bottom:16px`}>
        <div style={{ ...card, ...sx`display:flex;flex-direction:column;gap:8px` }}>
          <h2 style={sx`margin:0 0 6px;font-size:16px;font-weight:800`}>بيانات العميل</h2>
          <span style={sx`font-size:14px`}>الاسم: {order.customer_name}</span>
          <span style={sx`font-size:14px`}>الهاتف: {order.customer_phone}</span>
          {order.customer_email && <span style={sx`font-size:14px`}>البريد: {order.customer_email}</span>}
          <span style={sx`font-size:14px;line-height:1.8`}>العنوان: {order.address}</span>
          <span style={sx`font-size:14px`}>المنطقة: {order.delivery_area_name || "—"}</span>
          {order.customer_notes && <span style={sx`font-size:14px;color:#7C766D`}>ملاحظات العميل: {order.customer_notes}</span>}
        </div>

        <div style={{ ...card, ...sx`display:flex;flex-direction:column;gap:10px` }}>
          <h2 style={sx`margin:0 0 6px;font-size:16px;font-weight:800`}>الحالة</h2>
          <Badge tone={STATUS_TONE[order.status]}>{orderStatusLabels[order.status]}</Badge>
          <Field title="تغيير الحالة">
            <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} style={input}>
              {Object.entries(orderStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field title="ملاحظة على التغيير (اختياري)">
            <input value={note} onChange={(event) => setNote(event.target.value)} style={input} />
          </Field>
          <Button
            disabled={busy || nextStatus === order.status}
            onClick={() => (nextStatus === "cancelled" ? setConfirming(true) : applyStatus())}
          >
            {busy ? "جارٍ التحديث…" : "تحديث الحالة"}
          </Button>
        </div>
      </div>

      <div style={{ ...card, ...sx`margin-bottom:16px` }}>
        <h2 style={sx`margin:0 0 12px;font-size:16px;font-weight:800`}>الأصناف</h2>
        <Table
          rows={order.items}
          columns={[
            { key: "product_name", title: "المنتج" },
            { key: "variant_description", title: "الخيار", render: (row) => row.variant_description || "—" },
            { key: "sku", title: "SKU", render: (row) => row.sku || "—" },
            { key: "unit_price", title: "سعر القطعة" },
            { key: "quantity", title: "الكمية" },
            { key: "line_total", title: "الإجمالي" },
          ]}
        />
        <div style={sx`display:flex;flex-direction:column;gap:6px;margin-top:14px;max-width:320px;margin-inline-start:auto`}>
          <div style={sx`display:flex;justify-content:space-between;font-size:14px`}><span>المجموع الفرعي</span><strong>{order.subtotal}</strong></div>
          {order.discount > 0 && <div style={sx`display:flex;justify-content:space-between;font-size:14px;color:#1F6B4A`}><span>الخصم {order.coupon_code && `(${order.coupon_code})`}</span><strong>−{order.discount}</strong></div>}
          <div style={sx`display:flex;justify-content:space-between;font-size:14px`}><span>التوصيل</span><strong>{order.delivery_fee}</strong></div>
          <div style={sx`display:flex;justify-content:space-between;font-size:17px;font-weight:800;border-top:1px solid #EFEBE4;padding-top:8px`}><span>الإجمالي</span><strong style={sx`color:#1F4E4A`}>{order.total}</strong></div>
        </div>
      </div>

      <div style={{ ...card, ...sx`margin-bottom:16px` }}>
        <h2 style={sx`margin:0 0 12px;font-size:16px;font-weight:800`}>ملاحظات داخلية</h2>
        <p style={sx`margin:0 0 10px;font-size:12.5px;color:#9C958A`}>لا تظهر هذه الملاحظات للعميل.</p>
        <textarea rows="4" value={notes} onChange={(event) => setNotes(event.target.value)} style={textarea} />
        <div style={sx`margin-top:10px`}><Button onClick={saveNotes}>حفظ الملاحظات</Button></div>
      </div>

      <div style={{ ...card, ...sx`margin-bottom:30px` }}>
        <h2 style={sx`margin:0 0 12px;font-size:16px;font-weight:800`}>سجل الحالات</h2>
        <Table
          rows={order.status_history}
          columns={[
            { key: "created_at", title: "التاريخ", render: (row) => formatDateTime(row.created_at) },
            { key: "old_status", title: "من", render: (row) => (row.old_status ? orderStatusLabels[row.old_status] : "—") },
            { key: "new_status", title: "إلى", render: (row) => orderStatusLabels[row.new_status] },
            { key: "note", title: "ملاحظة", render: (row) => row.note || "—" },
          ]}
        />
      </div>

      {confirming && (
        <ConfirmDialog
          title="تأكيد إلغاء الطلب"
          message="سيُعاد المخزون المحجوز لهذا الطلب، ولا يمكن إعادة تفعيل الطلب بعد الإلغاء."
          confirmLabel="إلغاء الطلب"
          onConfirm={applyStatus}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
