import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import { formatMoney } from "@/shared/lib/money";
import rootEn from "../../../../messages/en.json";
import rootFr from "../../../../messages/fr.json";
import catalogEn from "../messages/en.json";
import catalogFr from "../messages/fr.json";
import type { ProductDetail } from "../model/products";
import { ProductDetailView } from "./product-detail-view";

afterEach(cleanup);

const mug: ProductDetail = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Mug",
  amount: "1234.50",
  currency: "EUR",
};

const normalize = (text: string | null | undefined) =>
  (text ?? "").replace(/[  ]/g, " ");

describe("ProductDetailView", () => {
  it("renders a single h1 with the name and the price in en", () => {
    render(
      <NextIntlClientProvider
        locale="en"
        messages={{ ...rootEn, catalog: catalogEn }}
      >
        <ProductDetailView product={mug} />
      </NextIntlClientProvider>,
    );
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toContain("Mug");
    expect(normalize(document.body.textContent)).toContain("€1,234.50");
  });

  it("renders the price formatted by formatMoney in fr", () => {
    const { container } = render(
      <NextIntlClientProvider
        locale="fr"
        messages={{ ...rootFr, catalog: catalogFr }}
      >
        <ProductDetailView product={mug} />
      </NextIntlClientProvider>,
    );
    expect(normalize(container.textContent)).toContain(
      normalize(formatMoney("1234.50", "EUR", "fr")),
    );
  });
});
