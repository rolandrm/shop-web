import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import rootFr from "../../../../messages/fr.json";
import { loadCatalogMessages } from "../index";
import catalogFr from "../messages/fr.json";
import { ProductListEmpty } from "./product-list-empty";

afterEach(cleanup);

describe("ProductListEmpty", () => {
  it("renders the empty message", () => {
    render(
      <NextIntlClientProvider
        locale="fr"
        messages={{ ...rootFr, catalog: catalogFr }}
      >
        <ProductListEmpty />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(catalogFr.empty)).toBeTruthy();
  });
});

describe("loadCatalogMessages", () => {
  it("returns the content of the fr messages file", async () => {
    const messages = await loadCatalogMessages("fr");
    expect(messages).toEqual(catalogFr);
    expect(messages.empty).toBe(catalogFr.empty);
  });
});
