import { useTranslations } from "next-intl";
import { BackToCatalogLink } from "./back-to-catalog-link";

export function ProductNotFound() {
  const t = useTranslations("catalog");
  return (
    <div className="flex flex-col items-start gap-4">
      <h1>{t("productNotFound")}</h1>
      <BackToCatalogLink />
    </div>
  );
}
