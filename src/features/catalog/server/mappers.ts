import "server-only";

import {
  isInStock,
  type ProductDetail,
  type ProductListPage,
} from "../model/products";
import type {
  ProductDetailResponse,
  ProductListResponse,
} from "../schemas/products";

function inStockOf(stock: number | undefined): boolean | undefined {
  return stock === undefined ? undefined : isInStock(stock);
}

export function toProductDetail(response: ProductDetailResponse): ProductDetail {
  return {
    id: response.id,
    name: response.name,
    amount: response.price.amount,
    currency: response.price.currency,
    inStock: inStockOf(response.stock),
  };
}

export function toProductListPage(response: ProductListResponse): ProductListPage {
  return {
    items: response.items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.price.amount,
      currency: item.price.currency,
      inStock: inStockOf(item.stock),
    })),
    nextCursor: response.nextCursor,
  };
}
