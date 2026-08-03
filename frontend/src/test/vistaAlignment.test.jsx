import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { categoryFixture, renderApp, storefrontRoutes, stubApi } from "./utils.jsx";

/** A root category with children, so the drawer's nesting has something to expand. */
const parentCategory = {
  ...categoryFixture,
  id: 7,
  name: "مطبوعات المناسبات",
  slug: "event-print",
  children: [
    { id: 8, name: "بنرات", slug: "banners", product_count: 4 },
    { id: 9, name: "ستاندات", slug: "stands", product_count: 2 },
  ],
};

const heroSlides = [
  {
    id: 1,
    title: "إعلان الأول",
    subtitle: "",
    description: "",
    button_label: "",
    button_url: "/shop",
    image_url: "/media/preview/one.png",
    sort_order: 0,
  },
  {
    id: 2,
    title: "إعلان الثاني",
    subtitle: "",
    description: "",
    button_label: "",
    button_url: "/shop",
    image_url: "/media/preview/two.png",
    sort_order: 1,
  },
];

/** A banner in every hero-side placement the old layout used to render. */
const banners = [
  { id: 1, placement: "home_main", title: "بانر رئيسي", subtitle: "", link_url: "/shop", image_url: null, sort_order: 0 },
  { id: 2, placement: "home_side", title: "بانر جانبي", subtitle: "", link_url: "/shop", image_url: null, sort_order: 1 },
];

const rail = () => document.querySelector(".vs-catbar");
const drawer = () => screen.queryByRole("dialog", { name: "تصنيفات المنتجات" });

describe("category rail", () => {
  it("renders one rail item per active category, straight from the API", async () => {
    stubApi({ ...storefrontRoutes, "/api/v1/categories": [categoryFixture, parentCategory] });
    renderApp("/");

    await waitFor(() => expect(rail().querySelectorAll(".vs-catbar__item")).toHaveLength(2));

    const items = within(rail()).getAllByRole("link");
    expect(items[0]).toHaveAttribute("href", `/category/${categoryFixture.slug}`);
    expect(items[1]).toHaveAttribute("href", "/category/event-print");
    // Every item is labelled and carries a tooltip; none shows permanent text.
    items.forEach((item) => {
      expect(item).toHaveAccessibleName();
      expect(item).toHaveAttribute("title");
    });
    expect(rail()).toHaveAccessibleName();
  });

  it("marks the category of the current route as active", async () => {
    stubApi({ ...storefrontRoutes, "/api/v1/categories": [categoryFixture, parentCategory] });
    renderApp("/category/event-print");

    await waitFor(() => expect(rail().querySelectorAll(".vs-catbar__item")).toHaveLength(2));
    const active = within(rail()).getByRole("link", { name: parentCategory.name });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(
      within(rail()).getByRole("link", { name: categoryFixture.name }),
    ).not.toHaveAttribute("aria-current");
  });

  it("opens and closes the drawer from the rail trigger", async () => {
    stubApi({ ...storefrontRoutes, "/api/v1/categories": [parentCategory] });
    renderApp("/");

    await waitFor(() => expect(rail()).not.toBeNull());
    const trigger = within(rail()).getByRole("button", { name: "تصنيفات المنتجات" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(drawer()).toBeNull();

    await userEvent.click(trigger);
    expect(drawer()).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // The same trigger closes it again — one overlay, one state.
    await userEvent.click(trigger);
    await waitFor(() => expect(drawer()).toBeNull());
  });

  it("expands a category's children inside the drawer", async () => {
    stubApi({ ...storefrontRoutes, "/api/v1/categories": [parentCategory] });
    renderApp("/");

    await waitFor(() => expect(rail()).not.toBeNull());
    await userEvent.click(within(rail()).getByRole("button", { name: "تصنيفات المنتجات" }));

    const panel = drawer();
    expect(within(panel).queryByRole("link", { name: "بنرات" })).not.toBeInTheDocument();

    const toggle = within(panel).getByRole("button", {
      name: `الأقسام الفرعية لـ ${parentCategory.name}`,
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(within(panel).getByRole("link", { name: "بنرات" })).toHaveAttribute(
      "href",
      "/category/banners",
    );
    expect(within(panel).getByRole("link", { name: "ستاندات" })).toBeInTheDocument();
  });

  it("keeps the rail out of the admin workspace", async () => {
    stubApi(storefrontRoutes);
    renderApp("/admin");

    await waitFor(() => expect(document.querySelector(".vs-public")).toBeNull());
    expect(document.querySelector(".vs-catbar")).toBeNull();
    expect(screen.queryByRole("dialog", { name: "تصنيفات المنتجات" })).toBeNull();
  });
});

describe("homepage hero", () => {
  const heroRoutes = {
    ...storefrontRoutes,
    "/api/v1/hero-slides": heroSlides,
    "/api/v1/banners": banners,
    "/api/v1/home-sections": [],
  };

  it("shows exactly one advertising image at a time", async () => {
    stubApi(heroRoutes);
    renderApp("/");

    await waitFor(() => expect(document.querySelectorAll(".vs-hero__slide")).toHaveLength(2));
    expect(document.querySelectorAll('.vs-hero__slide[data-active="true"]')).toHaveLength(1);
    expect(document.querySelector('.vs-hero__slide[data-active="true"] img')).toHaveAttribute(
      "src",
      "/media/preview/one.png",
    );
  });

  it("renders no promotional cards beside the hero", async () => {
    stubApi(heroRoutes);
    renderApp("/");

    await waitFor(() => expect(document.querySelector(".vs-hero")).not.toBeNull());
    // Both banners exist in the payload; neither may appear as a hero-side tile.
    expect(document.querySelector(".vs-promocol")).toBeNull();
    expect(document.querySelectorAll(".vs-promo")).toHaveLength(0);
    expect(screen.queryByText("بانر جانبي")).not.toBeInTheDocument();
  });

  it("moves between slides from its own controls", async () => {
    stubApi(heroRoutes);
    renderApp("/");

    await waitFor(() => expect(document.querySelector(".vs-hero")).not.toBeNull());
    const active = () =>
      [...document.querySelectorAll(".vs-hero__slide")].findIndex(
        (slide) => slide.dataset.active === "true",
      );
    expect(active()).toBe(0);

    await userEvent.click(screen.getByRole("button", { name: "الشريحة التالية" }));
    expect(active()).toBe(1);

    await userEvent.click(screen.getByRole("button", { name: "الشريحة السابقة" }));
    expect(active()).toBe(0);

    // Dots are real buttons and report which slide is showing.
    const dot = screen.getByRole("tab", { name: "الشريحة 2" });
    await userEvent.click(dot);
    expect(dot).toHaveAttribute("aria-current", "true");
    expect(active()).toBe(1);
  });

  it("does not autoplay when the visitor has asked for reduced motion", async () => {
    window.__mediaMatches = (query) => query.includes("prefers-reduced-motion");
    stubApi(heroRoutes);
    renderApp("/");

    await waitFor(() => expect(document.querySelector(".vs-hero")).not.toBeNull());
    const active = () =>
      [...document.querySelectorAll(".vs-hero__slide")].findIndex(
        (slide) => slide.dataset.active === "true",
      );
    expect(active()).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(active()).toBe(0);
  });
});

describe("homepage category grid", () => {
  it("puts each category's title over its own artwork and links the whole card", async () => {
    stubApi({
      ...storefrontRoutes,
      "/api/v1/categories": [categoryFixture, parentCategory],
      "/api/v1/home-sections": [
        {
          id: 1,
          section_key: "categories",
          section_type: "categories",
          title: "تسوّق حسب القسم",
          description: "",
          sort_order: 0,
          config: {},
        },
      ],
    });
    renderApp("/");

    expect(await screen.findByRole("heading", { name: "تسوّق حسب القسم" })).toBeInTheDocument();
    const cards = document.querySelectorAll(".vs-cat");
    expect(cards).toHaveLength(2);

    // The title is over the image, and readable without any interaction.
    const first = cards[0];
    expect(first.tagName).toBe("A");
    expect(first).toHaveAttribute("href", `/category/${categoryFixture.slug}`);
    expect(within(first).getByText(categoryFixture.name)).toBeInTheDocument();
    expect(first.querySelector(".vs-cat__center")).toContainElement(
      within(first).getByText(categoryFixture.name),
    );
    // No white text panel under the artwork any more.
    expect(first.querySelector(".vs-cat__text")).toBeNull();
  });
});
