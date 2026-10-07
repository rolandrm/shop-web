import { cleanup, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import rootFr from "../../../../messages/fr.json";
import catalogFr from "../messages/fr.json";
import { CurrencyFilter } from "./currency-filter";

afterEach(cleanup);

function renderFilter(currency?: "EUR" | "USD" | "GBP") {
  render(
    <NextIntlClientProvider
      locale="fr"
      messages={{ ...rootFr, catalog: catalogFr }}
    >
      <CurrencyFilter currency={currency} />
    </NextIntlClientProvider>,
  );
  return screen.getByRole("navigation", { name: catalogFr.filterLabel });
}

describe("CurrencyFilter", () => {
  it("links to each currency and marks the active one", () => {
    const nav = renderFilter("USD");
    const links = within(nav).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/fr/products",
      "/fr/products?currency=EUR",
      "/fr/products?currency=USD",
      "/fr/products?currency=GBP",
    ]);
    for (const link of links) {
      expect(link.getAttribute("href")).not.toContain("cursor");
    }
    const current = links.filter((l) => l.getAttribute("aria-current"));
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent).toBe("USD");
    expect(current[0]?.getAttribute("aria-current")).toBe("page");
  });

  it("marks all currencies as active without a currency", () => {
    const nav = renderFilter();
    const current = within(nav)
      .getAllByRole("link")
      .filter((l) => l.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent).toBe(catalogFr.allCurrencies);
  });
});
