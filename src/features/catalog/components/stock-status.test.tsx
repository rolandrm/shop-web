import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import rootEn from "../../../../messages/en.json";
import rootFr from "../../../../messages/fr.json";
import catalogEn from "../messages/en.json";
import catalogFr from "../messages/fr.json";
import { StockStatus } from "./stock-status";

afterEach(cleanup);

function renderStatus(locale: "fr" | "en", inStock?: boolean) {
  const messages =
    locale === "fr"
      ? { ...rootFr, catalog: catalogFr }
      : { ...rootEn, catalog: catalogEn };
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <StockStatus inStock={inStock} />
    </NextIntlClientProvider>,
  );
}

describe("StockStatus", () => {
  it("stock T8: shows the fr texts", () => {
    renderStatus("fr", true);
    expect(screen.getByText(catalogFr.inStock)).toBeTruthy();
    expect(catalogFr.inStock).toBe("En stock");
    cleanup();
    renderStatus("fr", false);
    expect(screen.getByText(catalogFr.outOfStock)).toBeTruthy();
    expect(catalogFr.outOfStock).toBe("Rupture de stock");
  });

  it("stock T9: shows the en texts", () => {
    renderStatus("en", true);
    expect(screen.getByText("In stock")).toBeTruthy();
    cleanup();
    renderStatus("en", false);
    expect(screen.getByText("Out of stock")).toBeTruthy();
  });

  it("stock T18: renders nothing when inStock is undefined", () => {
    const { container } = renderStatus("fr", undefined);
    expect(container.textContent).toBe("");
    expect(screen.queryByText("En stock")).toBeNull();
    expect(screen.queryByText("Rupture de stock")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
