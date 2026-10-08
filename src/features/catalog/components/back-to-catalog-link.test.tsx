import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import rootFr from "../../../../messages/fr.json";
import catalogFr from "../messages/fr.json";
import { BackToCatalogLink } from "./back-to-catalog-link";

afterEach(cleanup);

describe("BackToCatalogLink", () => {
  it("links to the catalog with the translated name", () => {
    render(
      <NextIntlClientProvider
        locale="fr"
        messages={{ ...rootFr, catalog: catalogFr }}
      >
        <BackToCatalogLink />
      </NextIntlClientProvider>,
    );
    expect(
      screen
        .getByRole("link", { name: catalogFr.backToCatalog })
        .getAttribute("href"),
    ).toBe("/fr/products");
  });
});
