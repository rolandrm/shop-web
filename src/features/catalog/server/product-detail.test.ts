// @vitest-environment node
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  createRequestLog,
  invalidProductHandler,
  productErrorHandler,
  productHandler,
  slowProductHandler,
} from "../__mocks__/handlers";
import { getProductDetail } from "./queries";

const ID = "00000000-0000-4000-8000-000000000001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getProductDetail", () => {
  it("T4: succès, un seul appel sur le bon chemin avec Accept-Language", async () => {
    const log = createRequestLog();
    server.use(productHandler(undefined, log));

    const result = await getProductDetail({ id: ID, locale: "fr" });

    expect(result).toEqual({
      ok: true,
      value: { id: ID, name: "Mug", amount: "1234.50", currency: "EUR" },
    });
    expect(log.requests).toHaveLength(1);
    expect(new URL(log.requests[0].url).pathname).toBe(`/v1/products/${ID}`);
    expect(log.requests[0].headers.get("Accept-Language")).toBe("fr");
  });

  it("T5: 404 renvoie PRODUCT_NOT_FOUND/404 sans lever", async () => {
    server.use(productErrorHandler(404, "PRODUCT_NOT_FOUND"));
    expect(await getProductDetail({ id: ID, locale: "fr" })).toEqual({
      ok: false,
      error: { code: "PRODUCT_NOT_FOUND", status: 404 },
    });
  });

  it("T6: 500, 400, corps non conforme et délai dépassé renvoient une erreur", async () => {
    server.use(productErrorHandler(500, "INTERNAL_ERROR"));
    expect(await getProductDetail({ id: ID, locale: "fr" })).toEqual({
      ok: false,
      error: { code: "INTERNAL_ERROR", status: 500 },
    });

    server.use(productErrorHandler(400, "VALIDATION_FAILED"));
    expect(await getProductDetail({ id: ID, locale: "fr" })).toEqual({
      ok: false,
      error: { code: "VALIDATION_FAILED", status: 400 },
    });

    server.use(invalidProductHandler());
    expect(await getProductDetail({ id: ID, locale: "fr" })).toEqual({
      ok: false,
      error: { code: "INVALID_BACKEND_RESPONSE", status: 502 },
    });

    server.use(slowProductHandler(300));
    expect(
      await getProductDetail({ id: ID, locale: "fr", timeoutMs: 50 }),
    ).toEqual({
      ok: false,
      error: { code: "BACKEND_TIMEOUT", status: 504 },
    });
  });

  it("une requête sans handler n'aboutit pas à un succès (onUnhandledFrame actif)", async () => {
    const result = await getProductDetail({ id: ID, locale: "fr" });
    expect(result.ok).toBe(false);
  });
});
