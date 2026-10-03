// @vitest-environment node
import { http, HttpResponse, delay } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { backendRequest } from "./backend-client";

const BASE = "http://backend.test";
const schema = z.object({ id: z.string(), name: z.string() });

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("backendRequest", () => {
  it("T3: 200 conforme renvoie les données validées", async () => {
    server.use(
      http.get(`${BASE}/products/1`, () =>
        HttpResponse.json({ id: "1", name: "Chaise", extra: true }),
      ),
    );
    const result = await backendRequest("/products/1", { schema, locale: "fr" });
    expect(result).toEqual({ ok: true, value: { id: "1", name: "Chaise" } });
  });

  it("T4: 200 non conforme renvoie INVALID_BACKEND_RESPONSE / 502", async () => {
    server.use(
      http.get(`${BASE}/products/1`, () => HttpResponse.json({ id: 1 })),
    );
    const result = await backendRequest("/products/1", { schema, locale: "fr" });
    expect(result).toEqual({
      ok: false,
      error: { code: "INVALID_BACKEND_RESPONSE", status: 502 },
    });
  });

  it("T5: réponse plus lente que le délai renvoie BACKEND_TIMEOUT / 504", async () => {
    server.use(
      http.get(`${BASE}/products/1`, async () => {
        await delay(500);
        return HttpResponse.json({ id: "1", name: "Chaise" });
      }),
    );
    const result = await backendRequest("/products/1", {
      schema,
      locale: "fr",
      timeoutMs: 50,
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "BACKEND_TIMEOUT", status: 504 },
    });
  });

  it("T6: 404 avec code renvoie le code du backend sans lever d'exception", async () => {
    server.use(
      http.get(`${BASE}/products/9`, () =>
        HttpResponse.json(
          { code: "PRODUCT_NOT_FOUND", message: "secret detail" },
          { status: 404 },
        ),
      ),
    );
    const result = await backendRequest("/products/9", { schema, locale: "fr" });
    expect(result).toEqual({
      ok: false,
      error: { code: "PRODUCT_NOT_FOUND", status: 404 },
    });
  });

  it("réponse d'erreur sans code renvoie BACKEND_ERROR avec le statut du backend", async () => {
    server.use(
      http.get(`${BASE}/products/1`, () =>
        HttpResponse.text("boom", { status: 500 }),
      ),
    );
    const result = await backendRequest("/products/1", { schema, locale: "fr" });
    expect(result).toEqual({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 500 },
    });
  });

  it("T7: transmet Accept-Language et X-Request-Id", async () => {
    let received: Headers | undefined;
    server.use(
      http.get(`${BASE}/products/1`, ({ request }) => {
        received = request.headers;
        return HttpResponse.json({ id: "1", name: "Chaise" });
      }),
    );
    await backendRequest("/products/1", { schema, locale: "en" });
    expect(received?.get("accept-language")).toBe("en");
    expect(received?.get("x-request-id")).toBeTruthy();
  });

  it("erreur réseau renvoie BACKEND_UNAVAILABLE / 503", async () => {
    server.use(http.get(`${BASE}/products/1`, () => HttpResponse.error()));
    const result = await backendRequest("/products/1", { schema, locale: "fr" });
    expect(result).toEqual({
      ok: false,
      error: { code: "BACKEND_UNAVAILABLE", status: 503 },
    });
  });
});
