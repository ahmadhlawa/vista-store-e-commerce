import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { page, renderApp, respond, storefrontRoutes, stubApi } from "./utils.jsx";
import { authStorage } from "../storage/authStorage.js";
import { cartStorage } from "../storage/cartStorage.js";

const ADMIN = {
  id: 1,
  email: "owner@example.com",
  full_name: "مالك المتجر",
  role: "super_admin",
  is_active: true,
  created_at: "2026-08-01T00:00:00Z",
  last_login_at: null,
};

const signedIn = () => authStorage.save("valid-token", ADMIN);

const INVOICE_ROW = {
  id: 5,
  invoice_number: "INV-000001",
  order_id: 3,
  order_number: "ORD-260801-1234",
  customer_name: "سارة أحمد",
  customer_phone: "0591234567",
  issued_at: "2026-08-01T10:00:00Z",
  grand_total: 220,
  currency_symbol: "₪",
  payment_method: "cash_on_delivery",
  status: "issued",
};

const INVOICE = {
  ...INVOICE_ROW,
  customer_email: "sara@example.com",
  customer_notes: "اتصلوا قبل التوصيل",
  store_name: "متجر فيستا",
  store_phone: "0590000000",
  store_whatsapp: null,
  store_email: null,
  store_address: "رام الله",
  store_logo_url: null,
  legal_business_name: null,
  registration_number: null,
  tax_number: null,
  delivery_address: "رام الله، شارع الإرسال، بناية ٥",
  delivery_area_name: "رام الله",
  currency_code: "ILS",
  subtotal: 200,
  discount: 0,
  coupon_code: null,
  delivery_fee: 20,
  tax_enabled: false,
  tax_rate: 0,
  prices_include_tax: false,
  tax_amount: 0,
  cancelled_at: null,
  cancellation_reason: null,
  cancelled_by_admin_id: null,
  items: [
    {
      id: 1,
      product_name: "ريزن شفاف",
      sku: "RES-1000",
      variant_description: "١ كغم",
      unit_price: 100,
      quantity: 2,
      line_total: 200,
    },
  ],
};

const CANCELLED = {
  ...INVOICE,
  status: "cancelled",
  cancelled_at: "2026-08-02T09:00:00Z",
  cancellation_reason: "نفدت الكمية",
  cancelled_by_admin_id: 1,
};

const ORDER = {
  id: 3,
  order_number: "ORD-260801-1234",
  status: "confirmed",
  customer_name: "سارة أحمد",
  customer_phone: "0591234567",
  customer_email: null,
  address: "رام الله، شارع الإرسال، بناية ٥",
  delivery_area_id: 1,
  delivery_area_name: "رام الله",
  delivery_fee: 20,
  subtotal: 200,
  discount: 0,
  total: 220,
  coupon_code: null,
  payment_method: "cash_on_delivery",
  customer_notes: null,
  admin_notes: null,
  created_at: "2026-08-01T09:00:00Z",
  updated_at: "2026-08-01T10:00:00Z",
  items: [],
  status_history: [],
  invoice: {
    id: 5,
    invoice_number: "INV-000001",
    status: "issued",
    issued_at: "2026-08-01T10:00:00Z",
    grand_total: 220,
  },
};

describe("admin invoice list", () => {
  it("lists invoices with every column the screen promises", async () => {
    signedIn();
    stubApi({
      "/api/v1/auth/me": ADMIN,
      "/api/v1/admin/invoices": page([INVOICE_ROW]),
    });
    renderApp("/admin/invoices");

    expect(await screen.findByRole("heading", { name: "الفواتير" })).toBeInTheDocument();
    const table = await screen.findByRole("table");
    const row = within(table);

    expect(row.getByRole("link", { name: "INV-000001" })).toBeInTheDocument();
    expect(row.getByRole("link", { name: "ORD-260801-1234" })).toBeInTheDocument();
    expect(row.getByText("سارة أحمد")).toBeInTheDocument();
    expect(row.getByText("220.00 ₪")).toBeInTheDocument();
    expect(row.getByText("الدفع عند الاستلام")).toBeInTheDocument();
    expect(row.getByText("صادرة")).toBeInTheDocument();
    expect(row.getByRole("button", { name: "عرض" })).toBeInTheDocument();
  });

  it("passes the search term and filters through to the API", async () => {
    signedIn();
    const calls = stubApi({
      "/api/v1/auth/me": ADMIN,
      "/api/v1/admin/invoices": page([INVOICE_ROW]),
    });
    renderApp("/admin/invoices");

    await screen.findByRole("table");
    await userEvent.type(screen.getByLabelText("بحث في الفواتير"), "INV-1");
    await userEvent.selectOptions(screen.getByLabelText("حالة الفاتورة"), "cancelled");

    await waitFor(() => {
      const last = calls.filter((call) => call.path.includes("/admin/invoices")).at(-1);
      expect(last.path).toContain("q=INV-1");
      expect(last.path).toContain("status=cancelled");
    });
  });

  it("explains the empty state instead of showing a bare table", async () => {
    signedIn();
    stubApi({ "/api/v1/auth/me": ADMIN, "/api/v1/admin/invoices": page([]) });
    renderApp("/admin/invoices");

    expect(await screen.findByText(/تصدر أول فاتورة عند تأكيد أول طلب/)).toBeInTheDocument();
  });

  it("keeps the invoice screens behind authentication", async () => {
    stubApi({});
    renderApp("/admin/invoices");

    expect(await screen.findByRole("heading", { name: "تسجيل دخول الإدارة" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "الفواتير" })).not.toBeInTheDocument();
  });
});

describe("admin invoice detail", () => {
  it("renders the printable sheet with identity, items and totals", async () => {
    signedIn();
    stubApi({ "/api/v1/auth/me": ADMIN, "/api/v1/admin/invoices/INV-000001": INVOICE });
    renderApp("/admin/invoices/INV-000001");

    expect(await screen.findByRole("heading", { name: /INV-000001/ })).toBeInTheDocument();

    const sheet = document.getElementById("invoice-sheet");
    expect(sheet).toBeTruthy();
    const inside = within(sheet);

    expect(inside.getByText("متجر فيستا")).toBeInTheDocument();
    expect(inside.getByText("فاتورة")).toBeInTheDocument();
    expect(inside.getByText("سارة أحمد")).toBeInTheDocument();
    expect(inside.getByText("رام الله، شارع الإرسال، بناية ٥")).toBeInTheDocument();
    expect(inside.getByText("ريزن شفاف")).toBeInTheDocument();
    expect(inside.getByText("RES-1000")).toBeInTheDocument();
    expect(inside.getByText("الإجمالي المستحق")).toBeInTheDocument();
    expect(inside.getByText("220.00 ₪")).toBeInTheDocument();
    expect(inside.getByText("الدفع عند الاستلام")).toBeInTheDocument();
    expect(inside.getByText("اتصلوا قبل التوصيل")).toBeInTheDocument();
  });

  it("prints through the browser when asked", async () => {
    signedIn();
    stubApi({ "/api/v1/auth/me": ADMIN, "/api/v1/admin/invoices/INV-000001": INVOICE });
    const print = vi.fn();
    window.print = print;
    renderApp("/admin/invoices/INV-000001");

    await userEvent.click(await screen.findByRole("button", { name: "طباعة الفاتورة" }));
    expect(print).toHaveBeenCalledTimes(1);
  });

  it("ships print rules that hide the admin chrome and keep only the sheet", async () => {
    signedIn();
    stubApi({ "/api/v1/auth/me": ADMIN, "/api/v1/admin/invoices/INV-000001": INVOICE });
    renderApp("/admin/invoices/INV-000001");
    await screen.findByRole("heading", { name: /INV-000001/ });

    const css = Array.from(document.querySelectorAll("style"))
      .map((node) => node.textContent)
      .join("\n");

    expect(css).toContain("@media print");
    expect(css).toContain("size: A4");
    expect(css).toContain("#invoice-sheet");
    expect(css).toContain(".no-print");
    expect(css).toContain("display: table-header-group");
  });

  it("keeps the closing totals block whole across a page break", async () => {
    signedIn();
    stubApi({ "/api/v1/auth/me": ADMIN, "/api/v1/admin/invoices/INV-000001": INVOICE });
    renderApp("/admin/invoices/INV-000001");
    await screen.findByRole("heading", { name: /INV-000001/ });

    const sheet = document.getElementById("invoice-sheet");
    const summary = sheet.querySelector(".invoice-summary");

    // Totals, notes and the cancellation notice are one element, so they move together.
    expect(summary).toBeTruthy();
    expect(summary.textContent).toContain("المجموع الفرعي");
    expect(summary.textContent).toContain("الإجمالي المستحق");
    expect(summary.textContent).toContain("اتصلوا قبل التوصيل");
    // The item table is outside it, and is the only thing allowed to span pages.
    expect(summary.querySelector("table")).toBeNull();
    expect(sheet.querySelector(".invoice-items table")).toBeTruthy();

    const css = Array.from(document.querySelectorAll("style"))
      .map((node) => node.textContent)
      .join("\n");

    // The rule that fixes the 12-line case: the block never splits internally.
    expect(css).toMatch(
      /\.invoice-summary\s*\{[^}]*page-break-inside:\s*avoid[^}]*break-inside:\s*avoid/s,
    );
    // Item rows may continue onto the next page; the sheet must not clip them away.
    expect(css).toMatch(/#invoice-sheet table\s*\{[^}]*break-inside:\s*auto/s);
    expect(css).toMatch(/#invoice-sheet\s*\{[^}]*overflow:\s*visible\s*!important/s);
  });

  it("keeps the cancelled watermark on every printed page", async () => {
    signedIn();
    stubApi({ "/api/v1/auth/me": ADMIN, "/api/v1/admin/invoices/INV-000001": CANCELLED });
    renderApp("/admin/invoices/INV-000001");
    await screen.findByRole("heading", { name: /INV-000001/ });

    const css = Array.from(document.querySelectorAll("style"))
      .map((node) => node.textContent)
      .join("\n");

    // Pinned to the page box rather than the sheet, so page two is marked too, and the
    // colour survives the browser's "background graphics" default.
    expect(css).toMatch(
      /\.invoice-watermark\s*\{[^}]*position:\s*fixed[^}]*print-color-adjust:\s*exact/s,
    );
    expect(document.querySelector("#invoice-sheet .invoice-watermark")).toBeTruthy();
  });

  it("keeps internal notes, cost prices and audit data off the printable sheet", async () => {
    signedIn();
    stubApi({ "/api/v1/auth/me": ADMIN, "/api/v1/admin/invoices/INV-000001": INVOICE });
    renderApp("/admin/invoices/INV-000001");
    await screen.findByRole("heading", { name: /INV-000001/ });

    const sheet = document.getElementById("invoice-sheet");
    expect(sheet.textContent).not.toContain("ملاحظات داخلية");
    expect(sheet.textContent).not.toContain("سعر التكلفة");
    expect(sheet.querySelector("nav")).toBeNull();
    // Buttons live outside the sheet entirely, so nothing can print them.
    expect(sheet.querySelectorAll("button").length).toBe(0);
  });

  it("shows a cancelled watermark and the cancellation reason", async () => {
    signedIn();
    stubApi({ "/api/v1/auth/me": ADMIN, "/api/v1/admin/invoices/INV-000001": CANCELLED });
    renderApp("/admin/invoices/INV-000001");

    await screen.findByRole("heading", { name: /INV-000001/ });
    // "ملغاة" is deliberately in two places: the diagonal watermark and the status line.
    const sheet = within(document.getElementById("invoice-sheet"));
    expect(sheet.getAllByText("ملغاة")).toHaveLength(2);
    expect(
      document.querySelector("#invoice-sheet .invoice-watermark").textContent,
    ).toBe("ملغاة");
    expect(sheet.getByText(/نفدت الكمية/)).toBeInTheDocument();

    // A cancelled invoice offers no second cancellation.
    expect(screen.queryByRole("button", { name: /إلغاء الفاتورة والطلب/ })).not.toBeInTheDocument();
  });

  it("cancels through the API after confirmation", async () => {
    signedIn();
    const calls = stubApi({
      "/api/v1/auth/me": ADMIN,
      "POST /api/v1/admin/invoices/INV-000001/cancel": CANCELLED,
      "/api/v1/admin/invoices/INV-000001": INVOICE,
    });
    renderApp("/admin/invoices/INV-000001");

    await userEvent.click(await screen.findByRole("button", { name: "إلغاء الفاتورة والطلب" }));
    await userEvent.click(await screen.findByRole("button", { name: "إلغاء الفاتورة" }));

    await waitFor(() =>
      expect(calls.some((call) => call.method === "POST" && call.path.endsWith("/cancel"))).toBe(true),
    );
    expect(await screen.findByText(/تم إلغاء الفاتورة/)).toBeInTheDocument();
  });

  it("reports a missing invoice instead of rendering an empty sheet", async () => {
    signedIn();
    stubApi({
      "/api/v1/auth/me": ADMIN,
      "/api/v1/admin/invoices/INV-000999": respond(404, {
        error: { code: "invoice_not_found", message: "الفاتورة غير موجودة." },
      }),
    });
    renderApp("/admin/invoices/INV-000999");

    expect(await screen.findByRole("heading", { name: "الفاتورة غير موجودة" })).toBeInTheDocument();
    expect(document.getElementById("invoice-sheet")).toBeNull();
  });
});

describe("order detail invoice panel", () => {
  it("links to the invoice and offers a print action", async () => {
    signedIn();
    stubApi({ "/api/v1/auth/me": ADMIN, "/api/v1/admin/orders/3": ORDER });
    renderApp("/admin/orders/3");

    await screen.findByRole("heading", { name: /ORD-260801-1234/ });
    expect(screen.getByRole("heading", { name: "الفاتورة" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "INV-000001" })).toBeInTheDocument();
    expect(screen.getByText("صادرة")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "عرض الفاتورة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "طباعة الفاتورة" })).toBeInTheDocument();
    expect(screen.getByText("الدفع عند الاستلام")).toBeInTheDocument();
  });

  it("says a pending order has no invoice yet", async () => {
    signedIn();
    stubApi({
      "/api/v1/auth/me": ADMIN,
      "/api/v1/admin/orders/3": { ...ORDER, status: "pending", invoice: null },
    });
    renderApp("/admin/orders/3");

    await screen.findByRole("heading", { name: /ORD-260801-1234/ });
    expect(screen.getByText(/تصدر الفاتورة تلقائياً عند تغيير الحالة/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "INV-000001" })).not.toBeInTheDocument();
  });
});

describe("storefront payment surface", () => {
  // The checkout form only renders with something in the cart.
  const withCart = () =>
    cartStorage.save([
      {
        key: "1|",
        productId: 1,
        variantId: null,
        slug: "clear-resin",
        name: "ريزن شفاف",
        unit: 100,
        bg: "",
        variation: "",
        qty: 1,
      },
    ]);

  const cartRoutes = {
    ...storefrontRoutes,
    "POST /api/v1/cart/price": {
      lines: [
        {
          product_id: 1,
          variant_id: null,
          product_name: "ريزن شفاف",
          slug: "clear-resin",
          variant_description: null,
          unit_price: 100,
          quantity: 1,
          line_total: 100,
          primary_image_url: null,
        },
      ],
      subtotal: 100,
      discount: 0,
      delivery_fee: 20,
      total: 120,
      coupon_code: null,
      delivery_area_name: "رام الله",
    },
  };

  it("offers only cash on delivery and manual transfer, with no card fields", async () => {
    withCart();
    stubApi(cartRoutes);
    renderApp("/checkout");

    const heading = await screen.findByText("طريقة الدفع");
    const panel = within(heading.parentElement);
    expect(panel.getByText("الدفع عند الاستلام")).toBeInTheDocument();
    expect(panel.getByText("تحويل بنكي / يدوي")).toBeInTheDocument();

    // Exactly two payment options, and none of them is a card.
    expect(document.querySelectorAll('input[name="pay"]').length).toBe(2);
    expect(screen.queryByLabelText(/رقم البطاقة/)).not.toBeInTheDocument();
    expect(screen.queryByText(/CVV/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/تاريخ الانتهاء/)).not.toBeInTheDocument();
    expect(screen.queryByText(/بطاقة ائتمان/)).not.toBeInTheDocument();
    expect(document.querySelector('input[autocomplete="cc-number"]')).toBeNull();
  });

  it("never claims a payment was taken", async () => {
    withCart();
    stubApi(cartRoutes);
    renderApp("/checkout");

    expect(
      await screen.findByText(/لا يتم تحصيل أي مبلغ الآن، ولا يطلب المتجر بيانات بطاقات بنكية/),
    ).toBeInTheDocument();
  });

  it("shows no transfer instructions while the owner has supplied none", async () => {
    withCart();
    stubApi(cartRoutes);
    renderApp("/checkout");

    await screen.findByText("طريقة الدفع");
    await userEvent.click(screen.getByText("تحويل بنكي / يدوي"));

    expect(screen.queryByText(/حساب رقم/)).not.toBeInTheDocument();
  });

  it("shows the owner's transfer instructions once they exist", async () => {
    withCart();
    stubApi({
      ...cartRoutes,
      "/api/v1/store/settings": {
        ...storefrontRoutes["/api/v1/store/settings"],
        manual_payment_instructions: "بنك فلسطين — حساب رقم 12345",
      },
    });
    renderApp("/checkout");

    await screen.findByText("طريقة الدفع");
    await userEvent.click(screen.getByText("تحويل بنكي / يدوي"));

    expect(await screen.findByText("بنك فلسطين — حساب رقم 12345")).toBeInTheDocument();
  });

  it("prefers the Arabic store name when the owner has set one", async () => {
    stubApi({
      ...storefrontRoutes,
      "/api/v1/store/settings": {
        ...storefrontRoutes["/api/v1/store/settings"],
        store_name: "Vista Store",
        store_name_ar: "متجر فيستا",
      },
    });
    renderApp("/");

    expect((await screen.findAllByText("متجر فيستا")).length).toBeGreaterThan(0);
  });
});
