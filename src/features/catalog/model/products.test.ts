import { describe, expect, it } from "vitest";

import {
  isInStock,
  productDetailTitle,
  productsSearchParams,
} from "./products";

describe("isInStock", () => {
  it("stock T3: 0 est en rupture, 1 et le maximum sont en stock", () => {
    expect(isInStock(0)).toBe(false);
    expect(isInStock(1)).toBe(true);
    expect(isInStock(2147483647)).toBe(true);
  });
});

describe("productDetailTitle", () => {
  it("T19: nom du produit, sinon repli", () => {
    const mug = {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Mug",
      amount: "1234.50",
      currency: "EUR" as const,
    };
    expect(productDetailTitle(mug, "Produit")).toBe("Mug");
    expect(productDetailTitle(undefined, "Produit")).toBe("Produit");
  });
});

describe("productsSearchParams", () => {
  it.each([
    [{}, ""],
    [{ currency: "EUR" as const }, "currency=EUR"],
    [{ cursor: "abc" }, "cursor=abc"],
    [{ currency: "EUR" as const, cursor: "abc" }, "currency=EUR&cursor=abc"],
  ])("T3: %j -> %j", (input, expected) => {
    expect(productsSearchParams(input)).toBe(expected);
  });
});
