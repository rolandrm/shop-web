import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";

export function CatalogLink() {
  const t = useTranslations("catalog");
  return <Link href="/products">{t("viewCatalog")}</Link>;
}
