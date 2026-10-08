import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ProductDetailError,
  ProductDetailView,
  productDetailTitle,
} from "@/features/catalog";
import { getProductDetail, productIdSchema } from "@/features/catalog/server";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  if (!productIdSchema.safeParse(id).success) {
    return { title: t("productTitle") };
  }
  const result = await getProductDetail({ id, locale });
  return {
    title: productDetailTitle(
      result.ok ? result.value : undefined,
      t("productTitle"),
    ),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (!productIdSchema.safeParse(id).success) {
    notFound();
  }
  const result = await getProductDetail({ id, locale });
  if (!result.ok && result.error.status === 404) {
    notFound();
  }
  const t = await getTranslations("catalog");

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      {result.ok ? (
        <ProductDetailView product={result.value} />
      ) : (
        <>
          <h1 className="text-3xl font-semibold">{t("productTitle")}</h1>
          <ProductDetailError code={result.error.code} />
        </>
      )}
    </main>
  );
}
