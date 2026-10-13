// @vitest-environment node
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  createRequestLog,
  invalidProductsHandler,
  makeProducts,
  productsErrorHandler,
  productsHandler,
  productsWithoutStockHandler,
  rawStockProductsHandler,
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

  it("stock T6: inStock vaut true puis false", async () => {
    server.use(
      productsHandler({
        items: makeProducts(2, [
          { name: "Mug", stock: 12 },
          { name: "Tasse", stock: 0 },
        ]),
        nextCursor: null,
      }),
    );
    const result = await getProductListPage({ locale: "fr" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items.map((i) => [i.name, i.inStock])).toEqual([
        ["Mug", true],
        ["Tasse", false],
      ]);
    }
  });

  it("stock T7: stock -1 renvoie INVALID_BACKEND_RESPONSE sans lever", async () => {
    server.use(rawStockProductsHandler(-1));
    expect(await getProductListPage({ locale: "fr" })).toEqual({
      ok: false,
      error: { code: "INVALID_BACKEND_RESPONSE", status: 502 },
    });
  });

  it("stock T17: produits sans stock, inStock undefined", async () => {
    server.use(productsWithoutStockHandler(2));
    const result = await getProductListPage({ locale: "fr" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(2);
      for (const item of result.value.items) {
        expect(item.name).toBeTruthy();
        expect(item.amount).toMatch(/^\d+\.\d{2}$/);
        expect(item.inStock).toBeUndefined();
      }
    }
  });

  it("une requête sans handler n'aboutit pas à un succès (onUnhandledFrame actif)", async () => {
    const result = await getProductListPage({ locale: "fr" });
    expect(result.ok).toBe(false);
  });
});
