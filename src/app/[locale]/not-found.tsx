import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("errors");
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">{t("notFound")}</h1>
    </main>
  );
}
