import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("common");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold">{t("homeTitle")}</h1>
      <p>{t("homeIntro")}</p>
    </main>
  );
}
