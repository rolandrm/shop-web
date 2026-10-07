import "server-only";

import type { ProductListPage } from "../model/products";
import type { ProductListResponse } from "../schemas/products";

export function toProductListPage(response: ProductListResponse): ProductListPage {
  return {
    items: response.items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.price.amount,
      currency: item.price.currency,
    })),
    nextCursor: response.nextCursor,
  };
}
