import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import rootFr from "../../../../messages/fr.json";
import catalogFr from "../messages/fr.json";
import { ProductDetailError } from "./product-detail-error";

afterEach(cleanup);

function renderError(code: string) {
  render(
    <NextIntlClientProvider
      locale="fr"
      messages={{ ...rootFr, catalog: catalogFr }}
    >
      <ProductDetailError code={code} />
    </NextIntlClientProvider>,
  );
}

describe("ProductDetailError", () => {
  it("renders the translated message of a known code", () => {
    renderError("BACKEND_TIMEOUT");
    expect(screen.getByRole("alert").textContent).toContain(
      rootFr.errors.BACKEND_TIMEOUT,
    );
    expect(
      screen
        .getByRole("link", { name: "Retour au catalogue" })
        .getAttribute("href"),
    ).toBe("/fr/products");
  });

  it("falls back to the generic message for an unknown code", () => {
    renderError("UNKNOWN_CODE");
    expect(screen.getByRole("alert").textContent).toContain(
      rootFr.errors.generic,
    );
    expect(
      screen
        .getByRole("link", { name: "Retour au catalogue" })
        .getAttribute("href"),
    ).toBe("/fr/products");
  });
});
