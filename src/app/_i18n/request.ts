import { loadCatalogMessages } from "@/features/catalog";
import { createRequestConfig } from "@/shared/i18n/request";

export default createRequestConfig(async (locale) => ({
  catalog: await loadCatalogMessages(locale),
}));
