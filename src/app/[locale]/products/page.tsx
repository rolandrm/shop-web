import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  CurrencyFilter,
  ProductList,
  ProductListEmpty,
  ProductListError,
  ProductPagination,
} from "@/features/catalog";
import {
  getProductListPage,
  productsSearchParamsSchema,
} from "@/features/catalog/server";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  return { title: t("title") };
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  const { currency, cursor } = productsSearchParamsSchema.parse(
    await searchParams,
  );
  const result = await getProductListPage({ currency, cursor, locale });

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <CurrencyFilter currency={currency} />
      {!result.ok ? (
        <ProductListError code={result.error.code} currency={currency} />
      ) : result.value.items.length === 0 ? (
        <ProductListEmpty />
      ) : (
        <>
          <ProductList items={result.value.items} />
          <ProductPagination
            currency={currency}
            cursor={cursor}
            nextCursor={result.value.nextCursor}
          />
        </>
      )}
    </main>
  );
}
