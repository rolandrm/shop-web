import "server-only";

import type { ProductDetail, ProductListPage } from "../model/products";
import type {
  ProductDetailResponse,
  ProductListResponse,
} from "../schemas/products";

export function toProductDetail(response: ProductDetailResponse): ProductDetail {
  return {
    id: response.id,
    name: response.name,
    amount: response.price.amount,
    currency: response.price.currency,
  };
}

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
