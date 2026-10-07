// @vitest-environment node
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  createRequestLog,
  invalidProductsHandler,
  productsErrorHandler,
  productsHandler,
} from "../__mocks__/handlers";
import { getProductListPage } from "./queries";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getProductListPage", () => {
  it("T5: 20 produits, un seul appel, limit=20 sans currency ni cursor", async () => {
    const log = createRequestLog();
    server.use(productsHandler({ count: 20, nextCursor: "abc" }, log));

    const result = await getProductListPage({ locale: "fr" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(20);
      expect(result.value.nextCursor).toBe("abc");
    }
    expect(log.requests).toHaveLength(1);
    const url = new URL(log.requests[0].url);
    expect(url.searchParams.get("limit")).toBe("20");
    expect(url.searchParams.has("currency")).toBe(false);
    expect(url.searchParams.has("cursor")).toBe(false);
    expect(log.requests[0].headers.get("Accept-Language")).toBe("fr");
  });

  it("T6: currency et cursor sont transmis", async () => {
    const log = createRequestLog();
    server.use(productsHandler({ count: 1 }, log));

    await getProductListPage({ locale: "fr", currency: "USD", cursor: "abc" });

    expect(log.requests).toHaveLength(1);
    const url = new URL(log.requests[0].url);
    expect(url.searchParams.get("limit")).toBe("20");
    expect(url.searchParams.get("currency")).toBe("USD");
    expect(url.searchParams.get("cursor")).toBe("abc");
  });

  it("T7: 500, 400 et corps non conforme renvoient une erreur sans lever", async () => {
    server.use(productsErrorHandler(500, "INTERNAL_ERROR"));
    expect(await getProductListPage({ locale: "fr" })).toEqual({
      ok: false,
      error: { code: "INTERNAL_ERROR", status: 500 },
    });

    server.use(productsErrorHandler(400, "VALIDATION_FAILED"));
    expect(await getProductListPage({ locale: "fr" })).toEqual({
      ok: false,
      error: { code: "VALIDATION_FAILED", status: 400 },
    });

    server.use(invalidProductsHandler());
    expect(await getProductListPage({ locale: "fr" })).toEqual({
      ok: false,
      error: { code: "INVALID_BACKEND_RESPONSE", status: 502 },
    });
  });

  it("une requête sans handler n'aboutit pas à un succès (onUnhandledFrame actif)", async () => {
    const result = await getProductListPage({ locale: "fr" });
    expect(result.ok).toBe(false);
  });
});
