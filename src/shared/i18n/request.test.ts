// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";
import { createRequestConfig } from "./request";

// Sous Vitest, `next-intl/server` résout vers la variante « Client Component »
// qui refuse `getRequestConfig` ; en exécution réelle, il renvoie sa fonction.
vi.mock("next-intl/server", () => ({
  getRequestConfig: <T>(config: T) => config,
}));

const loader = async () => ({ catalog: { empty: "stub" } });

describe("createRequestConfig", () => {
  it("merges root messages with the feature messages", async () => {
    const config = await createRequestConfig(loader)({
      requestLocale: Promise.resolve("en"),
    });
    expect(config.locale).toBe("en");
    expect(config.messages).toMatchObject({
      common: en.common,
      errors: en.errors,
      catalog: { empty: "stub" },
    });
  });

  it("falls back to the default locale for an unknown locale", async () => {
    const config = await createRequestConfig(loader)({
      requestLocale: Promise.resolve("de"),
    });
    expect(config.locale).toBe("fr");
    expect(config.messages).toMatchObject({ common: fr.common });
  });
});
