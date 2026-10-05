import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import rootFr from "../../../../messages/fr.json";
import catalogFr from "../messages/fr.json";
import { CatalogLink } from "./catalog-link";

afterEach(cleanup);

describe("CatalogLink", () => {
  it("links to the products page", () => {
    render(
      <NextIntlClientProvider
        locale="fr"
        messages={{ ...rootFr, catalog: catalogFr }}
      >
        <CatalogLink />
      </NextIntlClientProvider>,
    );
    expect(
      screen
        .getByRole("link", { name: catalogFr.viewCatalog })
        .getAttribute("href"),
    ).toBe("/fr/products");
  });
});
