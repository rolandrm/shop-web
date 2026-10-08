import { cleanup, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import rootEn from "../../../../messages/en.json";
import rootFr from "../../../../messages/fr.json";
import catalogEn from "../messages/en.json";
import catalogFr from "../messages/fr.json";
import { ProductList } from "./product-list";

afterEach(cleanup);

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
});
