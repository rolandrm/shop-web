import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import rootFr from "../../../../messages/fr.json";
import catalogFr from "../messages/fr.json";
import { ProductPagination } from "./product-pagination";

afterEach(cleanup);

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider
      locale="fr"
      messages={{ ...rootFr, catalog: catalogFr }}
    >
      {ui}
    </NextIntlClientProvider>
  );
}

describe("ProductPagination", () => {
  it("renders next and first page links", () => {
    render(
      wrap(
        <ProductPagination currency="EUR" cursor="abc" nextCursor="def" />,
      ),
    );
    expect(
      screen
        .getByRole("link", { name: catalogFr.nextPage })
        .getAttribute("href"),
    ).toBe("/fr/products?currency=EUR&cursor=def");
    expect(
      screen
        .getByRole("link", { name: catalogFr.firstPage })
        .getAttribute("href"),
    ).toBe("/fr/products?currency=EUR");
  });

  it("renders no link without next cursor nor cursor", () => {
    render(wrap(<ProductPagination nextCursor={null} />));
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
