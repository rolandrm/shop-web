import { useTranslations } from "next-intl";

export function StockStatus({ inStock }: { inStock?: boolean }) {
  const t = useTranslations("catalog");
  if (inStock === undefined) {
    return null;
  }
  return <span>{inStock ? t("inStock") : t("outOfStock")}</span>;
}
