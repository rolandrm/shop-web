import { useLocale } from "next-intl";
import { formatMoney } from "@/shared/lib/money";
import type { ProductListItem } from "../model/products";

export function ProductList({ items }: { items: ProductListItem[] }) {
  const locale = useLocale();
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id} className="flex justify-between gap-4">
          <span>{item.name}</span>
          <span>{formatMoney(item.amount, item.currency, locale)}</span>
        </li>
      ))}
    </ul>
  );
}
