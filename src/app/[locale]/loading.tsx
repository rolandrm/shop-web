"use client";

import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("common");
  return (
    <div role="status" className="p-8">
      {t("loading")}
    </div>
  );
}
