import { describe, expect, it } from "vitest";

import { toProductDetail, toProductListPage } from "./mappers";

describe("toProductDetail", () => {
  it("T3: mappe le produit", () => {
    expect(
      toProductDetail({
        id: "00000000-0000-4000-8000-000000000001",
        name: "Mug",
        price: { amount: "1234.50", currency: "EUR" },
      }),
    ).toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      name: "Mug",
      amount: "1234.50",
      currency: "EUR",
    });
  });
});

describe("toProductListPage", () => {
  it("T4: mappe 2 produits et le nextCursor", () => {
    const page = toProductListPage({
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Mug",
          price: { amount: "12.50", currency: "EUR" },
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          name: "Chaise",
          price: { amount: "99.00", currency: "USD" },
        },
      ],
      nextCursor: "abc",
    });
    expect(page).toEqual({
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Mug",
          amount: "12.50",
          currency: "EUR",
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          name: "Chaise",
          amount: "99.00",
          currency: "USD",
        },
      ],
      nextCursor: "abc",
    });
  });
});
