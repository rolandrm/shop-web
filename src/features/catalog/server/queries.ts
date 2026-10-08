import "server-only";

import { cache } from "react";

import type { BackendError } from "@/shared/api/backend-client";
import { err, ok, type Result } from "@/shared/lib/result";

import type {
  Currency,
  ProductDetail,
  ProductListPage,
} from "../model/products";
import { getProduct, listProducts } from "./gateway";
import { toProductDetail, toProductListPage } from "./mappers";

export async function getProductListPage({
  currency,
  cursor,
  locale,
}: {
  currency?: Currency;
  cursor?: string;
  locale: string;
}): Promise<Result<ProductListPage, BackendError>> {
  const result = await listProducts({ currency, cursor, locale });
  if (!result.ok) return err(result.error);
  return ok(toProductListPage(result.value));
}

/**
 * Arguments positionnels primitifs : `cache()` les compare par valeur, ce qui
 * partage l'appel entre `generateMetadata` et la page.
 */
const getProductDetailCached = cache(
  async (
    id: string,
    locale: string,
    timeoutMs?: number,
  ): Promise<Result<ProductDetail, BackendError>> => {
    const result = await getProduct({ id, locale, timeoutMs });
    if (!result.ok) return err(result.error);
    return ok(toProductDetail(result.value));
  },
);

export function getProductDetail({
  id,
  locale,
  timeoutMs,
}: {
  id: string;
  locale: string;
  timeoutMs?: number;
}): Promise<Result<ProductDetail, BackendError>> {
  return getProductDetailCached(id, locale, timeoutMs);
}
