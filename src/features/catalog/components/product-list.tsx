import { useLocale } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import { formatMoney } from "@/shared/lib/money";
import type { ProductListItem } from "../model/products";

export function ProductList({ items }: { items: ProductListItem[] }) {
  const locale = useLocale();
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id} className="flex justify-between gap-4">
          <Link href={`/products/${encodeURIComponent(item.id)}`}>
            {item.name}
          </Link>
          <span>{formatMoney(item.amount, item.currency, locale)}</span>
        </li>
      ))}
    </ul>
  );
}
