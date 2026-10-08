import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import rootFr from "../../../../messages/fr.json";
import catalogFr from "../messages/fr.json";
import { ProductNotFound } from "./product-not-found";

afterEach(cleanup);

describe("ProductNotFound", () => {
  it("renders the message in an h1 and a link back to the catalog", () => {
    render(
      <NextIntlClientProvider
        locale="fr"
        messages={{ ...rootFr, catalog: catalogFr }}
      >
        <ProductNotFound />
      </NextIntlClientProvider>,
    );
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe(catalogFr.productNotFound);
    expect(
      screen
        .getByRole("link", { name: "Retour au catalogue" })
        .getAttribute("href"),
    ).toBe("/fr/products");
  });
});
