import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { page, productFixture, renderApp, storefrontRoutes, stubApi } from "./utils.jsx";
import { cartStorage } from "../storage/cartStorage.js";

const optionProduct = {
  ...productFixture,
  id: 2,
  name: "سكارف مطبوع",
  slug: "printed-scarf",
  price: 60,
  compare_at_price: null,
  has_options: true,
  options: [
    { id: 1, name: "المقاس", sort_order: 0, values: [{ id: 11, value: "صغير", sort_order: 0 }] },
  ],
  variants: [
    { id: 21, title: "صغير", sku: null, price_override: 70, stock_quantity: 3, is_active: true, option_value_ids: [11] },
    { id: 22, title: "كبير", sku: null, price_override: 90, stock_quantity: 2, is_active: true, option_value_ids: [11] },
  ],
};

const soldOutProduct = {
  ...productFixture,
  id: 3,
  name: "علبة هدية",
  slug: "gift-box",
  stock_quantity: 0,
  in_stock: false,
};

const packageProduct = {
  ...productFixture,
  id: 4,
  name: "باقة استقبال الزفاف",
  slug: "wedding-package",
  product_type: "package",
  price: 340,
  compare_at_price: 410,
  package_item_count: 3,
  package_items: [
    {
      id: 1,
      included_product_id: 1,
      included_product_name: "كرت دعوة",
      included_product_slug: "clear-resin",
      included_product_image_url: null,
      quantity: 2,
      display_note: null,
      sort_order: 0,
    },
  ],
};

const cardOf = async (name) => (await screen.findByText(name)).closest("article");

describe("product card behaviour", () => {
  it("adds a simple product straight to the cart and reveals the drawer", async () => {
    stubApi(storefrontRoutes);
    renderApp("/shop");

    const card = within(await cardOf(productFixture.name));
    await userEvent.click(card.getByRole("button", { name: /أضف إلى العربة/ }));

    await waitFor(() => expect(cartStorage.load()).toHaveLength(1));
    expect(cartStorage.load()[0].unit).toBe(100); // charged price, not compare-at

    // The drawer follows a beat later so the button's success state is seen.
    expect(await screen.findByRole("dialog", { name: "عربة التسوّق" })).toBeInTheDocument();
  });

  it("sends a product that needs an option to the quick view instead of the cart", async () => {
    stubApi({
      ...storefrontRoutes,
      "/api/v1/products/printed-scarf": optionProduct,
      "/api/v1/products": page([optionProduct]),
    });
    renderApp("/shop");

    const card = within(await cardOf(optionProduct.name));
    const button = await card.findByRole("button", { name: "اختر الخيارات" });
    expect(card.queryByRole("button", { name: /أضف إلى العربة/ })).not.toBeInTheDocument();

    await userEvent.click(button);

    const modal = await screen.findByRole("dialog", { name: "نظرة سريعة" });
    expect(within(modal).getByText("المقاس")).toBeInTheDocument();
    expect(cartStorage.load()).toHaveLength(0);
  });

  it("refuses to add from the quick view until an option is chosen", async () => {
    stubApi({
      ...storefrontRoutes,
      "/api/v1/products/printed-scarf": optionProduct,
      "/api/v1/products": page([optionProduct]),
    });
    renderApp("/shop");

    await userEvent.click(await screen.findByRole("button", { name: "اختر الخيارات" }));
    const modal = await screen.findByRole("dialog", { name: "نظرة سريعة" });

    await userEvent.click(await within(modal).findByRole("button", { name: "أضف إلى العربة" }));
    expect(await within(modal).findByRole("alert")).toHaveTextContent("اختر أحد الخيارات");
    expect(cartStorage.load()).toHaveLength(0);
    // A refused add must not claim success on the button.
    expect(within(modal).getByRole("button", { name: "أضف إلى العربة" })).not.toHaveTextContent(
      "تمت الإضافة",
    );

    // Choosing a variant switches the price to that variant's own price.
    await userEvent.click(within(modal).getByRole("button", { name: "كبير" }));
    expect(within(modal).getByText("90 ₪")).toBeInTheDocument();

    await userEvent.click(within(modal).getByRole("button", { name: "أضف إلى العربة" }));
    await waitFor(() => expect(cartStorage.load()).toHaveLength(1));
    const [line] = cartStorage.load();
    expect(line.variantId).toBe(22);
    expect(line.variation).toBe("كبير");
  });

  it("cannot add a sold-out product", async () => {
    stubApi({ ...storefrontRoutes, "/api/v1/products": page([soldOutProduct]) });
    renderApp("/shop");

    const card = within(await cardOf(soldOutProduct.name));
    expect(card.getByText("غير متوفر حالياً", { selector: "span" })).toBeInTheDocument();
    const button = card.getByRole("button", { name: "غير متوفر حالياً" });
    expect(button).toBeDisabled();

    await userEvent.click(button, { pointerEventsCheck: 0 });
    expect(cartStorage.load()).toHaveLength(0);
  });

  it("gives a package its own card, its item count and its own action", async () => {
    stubApi({ ...storefrontRoutes, "/api/v1/products": page([packageProduct]) });
    renderApp("/shop");

    const card = within(await cardOf(packageProduct.name));
    expect(card.getByText("بكج")).toBeInTheDocument();
    expect(card.getByText("يحتوي على 3 عناصر")).toBeInTheDocument();
    expect(card.getByText("340 ₪")).toBeInTheDocument();
    expect(card.getByText("410 ₪")).toBeInTheDocument();

    await userEvent.click(card.getByRole("button", { name: /أضف البكج إلى العربة/ }));
    await waitFor(() => expect(cartStorage.load()).toHaveLength(1));
    expect(cartStorage.load()[0].unit).toBe(340);
  });

  it("shows the discount on a sale product and keeps both prices legible", async () => {
    stubApi(storefrontRoutes);
    renderApp("/shop");

    const card = within(await cardOf(productFixture.name));
    expect(card.getByText("−23٪")).toBeInTheDocument();
    expect(card.getByText("100 ₪")).toBeInTheDocument();
    expect(card.getByText("130 ₪")).toBeInTheDocument();
  });

  it("opens the quick view from the card and links on to the full product page", async () => {
    stubApi({
      ...storefrontRoutes,
      "/api/v1/products/clear-resin": productFixture,
      "/api/v1/products/clear-resin/related": [],
    });
    renderApp("/shop");

    await userEvent.click(await screen.findByRole("button", { name: /نظرة سريعة على/ }));
    const modal = await screen.findByRole("dialog", { name: "نظرة سريعة" });

    expect(within(modal).getByText(productFixture.name)).toBeInTheDocument();
    expect(within(modal).getByRole("link", { name: /عرض التفاصيل الكاملة/ })).toHaveAttribute(
      "href",
      "/product/clear-resin",
    );

    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "نظرة سريعة" })).not.toBeInTheDocument(),
    );
  });

  it("keeps the add-to-cart acknowledgement when motion is reduced", async () => {
    window.__mediaMatches = (query) => query.includes("prefers-reduced-motion");
    stubApi(storefrontRoutes);
    renderApp("/shop");

    const card = within(await cardOf(productFixture.name));
    const button = card.getByRole("button", { name: /أضف إلى العربة/ });
    await userEvent.click(button);

    // The wording still changes; only the movement is dropped, and that is CSS.
    expect(button).toHaveTextContent("تمت الإضافة");
    await waitFor(() => expect(cartStorage.load()).toHaveLength(1));
  });
});
