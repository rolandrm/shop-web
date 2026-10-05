"use client";

import { useTranslations } from "next-intl";

export default function ProductsError({ reset }: { reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <div role="alert" className="flex flex-col items-start gap-4 p-8">
      <p>{t("generic")}</p>
      <button type="button" onClick={reset}>
        {t("retry")}
      </button>
    </div>
  );
}
