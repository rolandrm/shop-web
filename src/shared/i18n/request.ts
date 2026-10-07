import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export function createRequestConfig(
  loadFeatureMessages: (locale: string) => Promise<Record<string, unknown>>,
) {
  return getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = hasLocale(routing.locales, requested)
      ? requested
      : routing.defaultLocale;

    const rootMessages = (await import(`../../../messages/${locale}.json`))
      .default;

    return {
      locale,
      messages: { ...rootMessages, ...(await loadFeatureMessages(locale)) },
    };
  });
}
