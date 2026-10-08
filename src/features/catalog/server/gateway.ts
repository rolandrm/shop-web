import "server-only";

import { backendRequest, type BackendError } from "@/shared/api/backend-client";
import type { Result } from "@/shared/lib/result";

import type { Currency } from "../model/products";
import {
  productDetailResponseSchema,
  productListResponseSchema,
  type ProductDetailResponse,
  type ProductListResponse,
} from "../schemas/products";

const PAGE_SIZE = 20;

export function listProducts({
  currency,
  cursor,
  locale,
}: {
  currency?: Currency;
  cursor?: string;
  locale: string;
}): Promise<Result<ProductListResponse, BackendError>> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (currency) params.set("currency", currency);
  if (cursor) params.set("cursor", cursor);

  return backendRequest(`/v1/products?${params.toString()}`, {
    schema: productListResponseSchema,
    locale,
  });
}

export function getProduct({
  id,
  locale,
  timeoutMs,
}: {
  id: string;
  locale: string;
  timeoutMs?: number;
}): Promise<Result<ProductDetailResponse, BackendError>> {
  return backendRequest(`/v1/products/${encodeURIComponent(id)}`, {
    schema: productDetailResponseSchema,
    locale,
    timeoutMs,
  });
}
