import { describe, expect, it } from "vitest";

import {
  productDetailResponseSchema,
  productIdSchema,
  productListResponseSchema,
  productsSearchParamsSchema,
} from "./products";

describe("productIdSchema", () => {
  it("T1: accepte un UUID", () => {
    expect(
      productIdSchema.safeParse("00000000-0000-4000-8000-000000000001").success,
    ).toBe(true);
  });

  it.each([["pas-un-uuid"], [""], ["../products"], [["a", "b"]]])(
    "T1: refuse %j",
    (input) => {
      expect(productIdSchema.safeParse(input).success).toBe(false);
    },
  );
});

describe("productDetailResponseSchema", () => {
  const valid = {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Mug",
    price: { amount: "1234.50", currency: "EUR" },
  };

  it("T2: accepte un corps conforme", () => {
    expect(productDetailResponseSchema.safeParse(valid).success).toBe(true);
  });

  it("T2: refuse un prix \"12.5\"", () => {
    expect(
      productDetailResponseSchema.safeParse({
        ...valid,
        price: { amount: "12.5", currency: "EUR" },
      }).success,
    ).toBe(false);
  });

  it("T2: refuse un corps sans name", () => {
    expect(
      productDetailResponseSchema.safeParse({ id: valid.id, price: valid.price })
        .success,
    ).toBe(false);
  });
});

describe("productsSearchParamsSchema", () => {
  it("T1: conserve les paramètres valides", () => {
    expect(
      productsSearchParamsSchema.parse({ currency: "EUR", cursor: "abc" }),
    ).toEqual({ currency: "EUR", cursor: "abc" });
  });

  it.each([
    [{ currency: "JPY" }],
    [{ currency: "eur" }],
    [{ cursor: "$$" }],
    [{ currency: ["EUR", "USD"] }],
    [{}],
  ])("T1: %j donne {}", (input) => {
    expect(productsSearchParamsSchema.parse(input)).toEqual({});
  });

  it("T1: un champ invalide n'invalide pas l'autre", () => {
    expect(
      productsSearchParamsSchema.parse({ currency: "JPY", cursor: "abc" }),
    ).toEqual({ cursor: "abc" });
  });
});

describe("productListResponseSchema", () => {
  const valid = {
    items: [
      {
        id: "7d2b9e0c-1c1e-4a39-9a55-2f3f4a1b6c10",
        name: "Mug",
        price: { amount: "12.50", currency: "EUR" },
      },
    ],
    nextCursor: "abc",
  };

  it("T2: accepte un corps conforme", () => {
    expect(productListResponseSchema.safeParse(valid).success).toBe(true);
  });

  it("T2: refuse un prix \"12.5\"", () => {
    const body = {
      ...valid,
      items: [{ ...valid.items[0], price: { amount: "12.5", currency: "EUR" } }],
    };
    expect(productListResponseSchema.safeParse(body).success).toBe(false);
  });

  it("T2: refuse un corps sans nextCursor", () => {
    expect(
      productListResponseSchema.safeParse({ items: valid.items }).success,
    ).toBe(false);
  });
});
