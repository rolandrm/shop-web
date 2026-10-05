import { useTranslations } from "next-intl";

export function ProductListEmpty() {
  const t = useTranslations("catalog");
  return <p>{t("empty")}</p>;
}
