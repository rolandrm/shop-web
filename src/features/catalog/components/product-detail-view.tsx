import { useLocale } from "next-intl";
import { formatMoney } from "@/shared/lib/money";
import type { ProductDetail } from "../model/products";
import { BackToCatalogLink } from "./back-to-catalog-link";

export function ProductDetailView({ product }: { product: ProductDetail }) {
  const locale = useLocale();
  return (
    <div className="flex flex-col items-start gap-4">
      <h1>{product.name}</h1>
      <p>{formatMoney(product.amount, product.currency, locale)}</p>
      <BackToCatalogLink />
    </div>
  );
}
