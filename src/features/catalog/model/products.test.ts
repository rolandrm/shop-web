import { describe, expect, it } from "vitest";

import { productsSearchParams } from "./products";

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
