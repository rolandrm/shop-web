import { useTranslations } from "next-intl";

export default function ProductsLoading() {
  const t = useTranslations("common");
  return (
    <p role="status" className="p-8">
      {t("loading")}
    </p>
  );
}
