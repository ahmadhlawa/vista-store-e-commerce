import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { authStorage } from "../storage/authStorage.js";
import { page, renderApp, stubApi } from "./utils.jsx";

const manager = { id: 1, email: "owner@example.com", full_name: "مالك المتجر", role: "super_admin" };
const admin = { ...manager, role: "admin" };
const product = { id: 7, name: "راتنج شفاف", sku: "RES-1000", price: "12.50" };
const dashboard = { products_total: 0, products_active: 0, categories_total: 0, coupons_active: 0, orders_total: 0, orders_pending: 0, revenue_total: 0, low_stock_products: 0, recent_orders: [] };

describe("manual order workspace", () => {
  it("keeps the manager-only manual-order navigation and route unavailable to a normal admin", async () => {
    authStorage.save("admin-token", admin);
    stubApi({ "/api/v1/auth/me": admin, "/api/v1/admin/dashboard": dashboard });

    renderApp("/admin/orders/manual");

    expect(await screen.findByRole("heading", { name: "لوحة التحكم" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "طلب يدوي جديد" })).not.toBeInTheDocument();
  });

  it("lets a manager save a mixed manual order with customer, source, totals, notes, and completion", async () => {
    authStorage.save("manager-token", manager);
    const calls = stubApi({
      "/api/v1/auth/me": manager,
      "/api/v1/admin/products": page([product]),
      "POST /api/v1/admin/orders/manual": { id: 18, order_number: "ORD-18" },
    });
    renderApp("/admin/orders/manual");

    expect(await screen.findByRole("heading", { name: "طلب يدوي جديد" })).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("المصدر"), "phone");
    await userEvent.type(screen.getByLabelText("اسم العميل"), "سارة أحمد");
    await userEvent.type(screen.getByLabelText("الهاتف"), "0591234567");
    await userEvent.type(screen.getByLabelText("العنوان"), "رام الله، شارع الإرسال 10");
    await userEvent.selectOptions(screen.getByLabelText("إضافة منتج من الكتالوج"), "7");
    await userEvent.click(screen.getByRole("button", { name: "إضافة المنتج" }));
    await userEvent.click(screen.getByRole("button", { name: "إضافة صنف يدوي" }));
    await userEvent.type(screen.getByLabelText("اسم الصنف اليدوي 2"), "تغليف هدية");
    await userEvent.type(screen.getByLabelText("سعر الصنف اليدوي 2"), "2.50");
    await userEvent.clear(screen.getByLabelText("الخصم"));
    await userEvent.type(screen.getByLabelText("الخصم"), "1.00");
    await userEvent.type(screen.getByLabelText("ملاحظات العميل"), "اتصال قبل التوصيل");
    await userEvent.type(screen.getByLabelText("ملاحظات داخلية"), "دخلها المدير");
    await userEvent.click(screen.getByLabelText("إتمام الطلب وإصدار فاتورة"));
    await userEvent.clear(screen.getByLabelText("المبلغ المدفوع"));
    await userEvent.type(screen.getByLabelText("المبلغ المدفوع"), "5.00");
    await userEvent.type(screen.getByLabelText("تفاصيل الدفع"), "تحويل بنكي");
    await userEvent.click(screen.getByRole("button", { name: "حفظ الطلب اليدوي" }));

    const created = calls.find((call) => call.method === "POST" && call.path === "/api/v1/admin/orders/manual");
    expect(JSON.parse(created.body)).toMatchObject({
      source: "phone", customer_name: "سارة أحمد", customer_phone: "0591234567", discount: "1.00",
      customer_notes: "اتصال قبل التوصيل", admin_notes: "دخلها المدير",
      items: [
        { kind: "catalog", product_id: 7, quantity: 1, unit_price: "12.50" },
        { kind: "manual", name: "تغليف هدية", quantity: 1, unit_price: "2.50" },
      ],
      completion: { paid_amount: "5.00", payment_details: "تحويل بنكي" },
    });
  }, 15000);

  it("requires a manager reason before reopening a completed order and shows the replaced-invoice warning", async () => {
    authStorage.save("manager-token", manager);
    const completed = { id: 8, order_number: "ORD-8", source: "website", status: "completed", is_locked: true, customer_name: "سارة أحمد", customer_phone: "0591234567", address: "رام الله", payment_method: "cash_on_delivery", payment_status: "paid", discount: "0.00", delivery_fee: "0.00", items: [], created_at: "2026-08-04T10:00:00Z", active_invoice: { id: 2, invoice_number: "INV-8", status: "active", issued_at: "2026-08-04T10:00:00Z" }, invoices: [{ id: 2, invoice_number: "INV-8", status: "active", issued_at: "2026-08-04T10:00:00Z" }], activities: [] };
    const reopened = { ...completed, status: "preparing", is_locked: false, active_invoice: null, invoices: [{ ...completed.invoices[0], status: "replaced" }] };
    const calls = stubApi({ "/api/v1/auth/me": manager, "/api/v1/admin/orders/8": completed, "POST /api/v1/admin/orders/8/reopen": reopened });
    renderApp("/admin/orders/8");

    expect(await screen.findByText(/سيتم استبدال الفاتورة النشطة INV-8/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "INV-8" })).toHaveAttribute("href", "/admin/invoices/INV-8");
    await userEvent.type(screen.getByLabelText("سبب إعادة الفتح"), "تصحيح عنوان التوصيل");
    await userEvent.click(screen.getByRole("button", { name: "إعادة فتح الطلب" }));

    const request = calls.find((call) => call.method === "POST" && call.path === "/api/v1/admin/orders/8/reopen");
    expect(JSON.parse(request.body)).toEqual({ reason: "تصحيح عنوان التوصيل" });
  });
});
