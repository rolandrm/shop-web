import { useTranslations } from "next-intl";
import { BackToCatalogLink } from "./back-to-catalog-link";

export function ProductDetailError({ code }: { code: string }) {
  const t = useTranslations();
  const key = `errors.${code}`;
  return (
    <div role="alert" className="flex flex-col items-start gap-4">
      <p>{t.has(key) ? t(key) : t("errors.generic")}</p>
      <BackToCatalogLink />
    </div>
  );
}
