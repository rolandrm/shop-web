import { cleanup, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import rootEn from "../../../../messages/en.json";
import catalogEn from "../messages/en.json";
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
            { id: "1", name: "Mug", amount: "1234.50", currency: "EUR" },
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
});
