import { delay, http, HttpResponse } from "msw";

const PRODUCTS_URL = "*/v1/products";

type MockProduct = {
  id: string;
  name: string;
  price: { amount: string; currency: "EUR" | "USD" | "GBP" };
};

/** Requêtes reçues par un handler, pour les inspecter dans les tests. */
export type RequestLog = { requests: Request[] };

export function createRequestLog(): RequestLog {
  return { requests: [] };
}

export function makeProducts(count: number): MockProduct[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    name: `Produit ${index + 1}`,
    price: { amount: `${index + 1}.00`, currency: "EUR" },
  }));
}

export function productsHandler(
  {
    count = 20,
    nextCursor = "abc",
  }: { count?: number; nextCursor?: string | null } = {},
  log?: RequestLog,
) {
  return http.get(PRODUCTS_URL, ({ request }) => {
    log?.requests.push(request.clone());
    return HttpResponse.json({ items: makeProducts(count), nextCursor });
  });
}

export function emptyProductsHandler(log?: RequestLog) {
  return http.get(PRODUCTS_URL, ({ request }) => {
    log?.requests.push(request.clone());
    return HttpResponse.json({ items: [], nextCursor: null });
  });
}

export function productsErrorHandler(
  status: number,
  code: string,
  log?: RequestLog,
) {
  return http.get(PRODUCTS_URL, ({ request }) => {
    log?.requests.push(request.clone());
    return HttpResponse.json(
      { statusCode: status, code, message: "texte du backend" },
      { status },
    );
  });
}

export function invalidProductsHandler(log?: RequestLog) {
  return http.get(PRODUCTS_URL, ({ request }) => {
    log?.requests.push(request.clone());
    return HttpResponse.json({
      items: [
        {
          id: "00000000-0000-4000-8000-000000000000",
          name: "Mug",
          price: { amount: "12.5", currency: "EUR" },
        },
      ],
      nextCursor: null,
    });
  });
}

export function slowProductsHandler(delayMs: number, log?: RequestLog) {
  return http.get(PRODUCTS_URL, async ({ request }) => {
    log?.requests.push(request.clone());
    await delay(delayMs);
    return HttpResponse.json({ items: makeProducts(1), nextCursor: null });
  });
}
