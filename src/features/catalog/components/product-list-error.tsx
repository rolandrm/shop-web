import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import { type Currency, productsSearchParams } from "../model/products";

export function ProductListError({
  code,
  currency,
}: {
  code: string;
  currency?: Currency;
}) {
  const t = useTranslations();
  const qs = productsSearchParams({ currency });
  const key = `errors.${code}`;
  return (
    <div role="alert" className="flex flex-col items-start gap-4">
      <p>{t.has(key) ? t(key) : t("errors.generic")}</p>
      <Link href={qs ? `/products?${qs}` : "/products"}>
        {t("catalog.firstPage")}
      </Link>
    </div>
  );
}
