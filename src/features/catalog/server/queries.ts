import "server-only";

import type { BackendError } from "@/shared/api/backend-client";
import { err, ok, type Result } from "@/shared/lib/result";

import type { Currency, ProductListPage } from "../model/products";
import { listProducts } from "./gateway";
import { toProductListPage } from "./mappers";

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
