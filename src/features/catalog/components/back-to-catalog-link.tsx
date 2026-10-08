import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";

export function BackToCatalogLink() {
  const t = useTranslations("catalog");
  return <Link href="/products">{t("backToCatalog")}</Link>;
}
