import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import {
  CURRENCIES,
  type Currency,
  productsSearchParams,
} from "../model/products";

function hrefFor(currency?: Currency): string {
  const qs = productsSearchParams({ currency });
  return qs ? `/products?${qs}` : "/products";
}

export function CurrencyFilter({ currency }: { currency?: Currency }) {
  const t = useTranslations("catalog");
  return (
    <nav aria-label={t("filterLabel")}>
      <ul className="flex gap-4">
        <li>
          <Link
            href={hrefFor()}
            aria-current={currency === undefined ? "page" : undefined}
          >
            {t("allCurrencies")}
          </Link>
        </li>
        {CURRENCIES.map((code) => (
          <li key={code}>
            <Link
              href={hrefFor(code)}
              aria-current={currency === code ? "page" : undefined}
            >
              {code}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
