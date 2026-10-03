import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { routing } from "@/shared/i18n/routing";
import "../globals.css";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: t("appName") };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
