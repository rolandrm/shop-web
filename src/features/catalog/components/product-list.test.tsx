import { cleanup, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import { formatMoney } from "@/shared/lib/money";
import rootEn from "../../../../messages/en.json";
import rootFr from "../../../../messages/fr.json";
import catalogEn from "../messages/en.json";
import catalogFr from "../messages/fr.json";
import { toProductListPage } from "../server/mappers";
import { ProductList } from "./product-list";

afterEach(cleanup);

const normalize = (text: string | null | undefined) =>
  (text ?? "").replace(/[  ]/g, " ");

describe("ProductList", () => {
  it("renders the name and the formatted price of each product", () => {
    render(
      <NextIntlClientProvider
        locale="en"
        messages={{ ...rootEn, catalog: catalogEn }}
      >
        <ProductList
          items={[
            {
              id: "00000000-0000-4000-8000-000000000001",
              name: "Mug",
              amount: "1234.50",
              currency: "EUR",
            },
          ]}
        />
      </NextIntlClientProvider>,
    );
    const item = screen.getByRole("listitem");
    expect(within(item).getByText("Mug")).toBeTruthy();
    expect(item.textContent?.replace(/[  ]/g, " ")).toContain(
      "€1,234.50",
    );
  });

  it("links each product name to its own page", () => {
    const first = "00000000-0000-4000-8000-000000000000";
    const second = "00000000-0000-4000-8000-000000000001";
    render(
      <NextIntlClientProvider
        locale="fr"
        messages={{ ...rootFr, catalog: catalogFr }}
      >
        <ProductList
          items={[
            { id: first, name: "Produit 1", amount: "10.00", currency: "EUR" },
            { id: second, name: "Produit 2", amount: "20.00", currency: "EUR" },
          ]}
        />
      </NextIntlClientProvider>,
    );
    const firstHref = screen
      .getByRole("link", { name: "Produit 1" })
      .getAttribute("href");
    const secondHref = screen
      .getByRole("link", { name: "Produit 2" })
      .getAttribute("href");
    expect(firstHref).toBe(`/fr/products/${first}`);
    expect(secondHref).toBe(`/fr/products/${second}`);
    expect(firstHref).not.toBe(secondHref);
  });

  it("stock T10: shows the stock state in each row", () => {
    const tasseId = "00000000-0000-4000-8000-000000000002";
    render(
      <NextIntlClientProvider
        locale="fr"
        messages={{ ...rootFr, catalog: catalogFr }}
      >
        <ProductList
          items={[
            {
              id: "00000000-0000-4000-8000-000000000001",
              name: "Mug",
              amount: "10.00",
              currency: "EUR",
              inStock: true,
            },
            {
              id: tasseId,
              name: "Tasse",
              amount: "20.00",
              currency: "EUR",
              inStock: false,
            },
          ]}
        />
      </NextIntlClientProvider>,
    );
    const [mug, tasse] = screen.getAllByRole("listitem");
    expect(within(mug).getByText("En stock")).toBeTruthy();
    expect(within(tasse).getByText("Rupture de stock")).toBeTruthy();
    expect(
      within(tasse).getByRole("link", { name: "Tasse" }).getAttribute("href"),
    ).toBe(`/fr/products/${tasseId}`);
    expect(normalize(tasse.textContent)).toContain(
      normalize(formatMoney("20.00", "EUR", "fr")),
    );
  });

  it("stock T12: never shows the quantity", () => {
    const page = toProductListPage({
      items: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          name: "Mug",
          price: { amount: "10.00", currency: "EUR" },
          stock: 42,
        },
      ],
      nextCursor: null,
    });
    const { container } = render(
      <NextIntlClientProvider
        locale="fr"
        messages={{ ...rootFr, catalog: catalogFr }}
      >
        <ProductList items={page.items} />
      </NextIntlClientProvider>,
    );
    expect(container.textContent).toContain("En stock");
    expect(container.textContent).not.toContain("42");
  });

  it("stock T19: shows no stock state without inStock", () => {
    render(
      <NextIntlClientProvider
        locale="fr"
        messages={{ ...rootFr, catalog: catalogFr }}
      >
        <ProductList
          items={[
            {
              id: "00000000-0000-4000-8000-000000000001",
              name: "Mug",
              amount: "10.00",
              currency: "EUR",
            },
            {
              id: "00000000-0000-4000-8000-000000000002",
              name: "Tasse",
              amount: "20.00",
              currency: "EUR",
            },
          ]}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("link", { name: "Mug" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Tasse" })).toBeTruthy();
    const text = normalize(document.body.textContent);
    expect(text).toContain(normalize(formatMoney("10.00", "EUR", "fr")));
    expect(text).toContain(normalize(formatMoney("20.00", "EUR", "fr")));
    expect(screen.queryByText("En stock")).toBeNull();
    expect(screen.queryByText("Rupture de stock")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
