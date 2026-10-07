import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import { type Currency, productsSearchParams } from "../model/products";

function hrefFor(currency?: Currency, cursor?: string): string {
  const qs = productsSearchParams({ currency, cursor });
  return qs ? `/products?${qs}` : "/products";
}

export function ProductPagination({
  currency,
  cursor,
  nextCursor,
}: {
  currency?: Currency;
  cursor?: string;
  nextCursor: string | null;
}) {
  const t = useTranslations("catalog");
  if (!nextCursor && !cursor) return null;
  return (
    <div className="flex gap-4">
      {cursor ? <Link href={hrefFor(currency)}>{t("firstPage")}</Link> : null}
      {nextCursor ? (
        <Link href={hrefFor(currency, nextCursor)}>{t("nextPage")}</Link>
      ) : null}
    </div>
  );
}
