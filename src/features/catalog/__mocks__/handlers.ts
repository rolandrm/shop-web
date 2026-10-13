import { delay, http, HttpResponse } from "msw";

const PRODUCTS_URL = "*/v1/products";

type MockProduct = {
  id: string;
  name: string;
  price: { amount: string; currency: "EUR" | "USD" | "GBP" };
  stock?: number;
};

/** Requêtes reçues par un handler, pour les inspecter dans les tests. */
export type RequestLog = { requests: Request[] };

export function createRequestLog(): RequestLog {
  return { requests: [] };
}

/**
 * Produits générés, `stock: 5` par défaut. `overrides[i]` surcharge le produit
 * `i` (dont `name` et `stock`).
 */
export function makeProducts(
  count: number,
  overrides: Partial<MockProduct>[] = [],
): MockProduct[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    name: `Produit ${index + 1}`,
    price: { amount: `${index + 1}.00`, currency: "EUR" },
    stock: 5,
    ...overrides[index],
  }));
}

export function productsHandler(
  {
    count = 20,
    nextCursor = "abc",
    items,
  }: {
    count?: number;
    nextCursor?: string | null;
    items?: MockProduct[];
  } = {},
  log?: RequestLog,
) {
  return http.get(PRODUCTS_URL, ({ request }) => {
    log?.requests.push(request.clone());
    return HttpResponse.json({
      items: items ?? makeProducts(count),
      nextCursor,
    });
  });
}

/** Liste d'un shop-api antérieur à 1.2.0 : aucun produit n'a de `stock`. */
export function productsWithoutStockHandler(count = 2, log?: RequestLog) {
  return http.get(PRODUCTS_URL, ({ request }) => {
    log?.requests.push(request.clone());
    const items = makeProducts(count).map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
    }));
    return HttpResponse.json({ items, nextCursor: null });
  });
}

/** Liste dont le premier produit porte une valeur de `stock` arbitraire. */
export function rawStockProductsHandler(stock: unknown, log?: RequestLog) {
  return http.get(PRODUCTS_URL, ({ request }) => {
    log?.requests.push(request.clone());
    return HttpResponse.json({
      items: [{ ...makeProducts(1)[0], stock }],
      nextCursor: null,
    });
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

const PRODUCT_URL = "*/v1/products/:id";

const DEFAULT_PRODUCT: MockProduct = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Mug",
  price: { amount: "1234.50", currency: "EUR" },
};

export function productHandler(
  product: MockProduct = DEFAULT_PRODUCT,
  log?: RequestLog,
) {
  return http.get(PRODUCT_URL, ({ request }) => {
    log?.requests.push(request.clone());
    return HttpResponse.json(product);
  });
}

/** Fiche dont `stock` est une valeur arbitraire (`-1`, `null`, …). */
export function rawStockProductHandler(stock: unknown, log?: RequestLog) {
  return http.get(PRODUCT_URL, ({ request }) => {
    log?.requests.push(request.clone());
    return HttpResponse.json({ ...DEFAULT_PRODUCT, stock });
  });
}

export function productErrorHandler(
  status: number,
  code: string,
  log?: RequestLog,
) {
  return http.get(PRODUCT_URL, ({ request }) => {
    log?.requests.push(request.clone());
    return HttpResponse.json(
      {
        statusCode: status,
        code,
        message: "texte du backend",
        details: [{ path: "id", message: "texte du backend" }],
      },
      { status },
    );
  });
}

export function invalidProductHandler(log?: RequestLog) {
  return http.get(PRODUCT_URL, ({ request }) => {
    log?.requests.push(request.clone());
    return HttpResponse.json({
      ...DEFAULT_PRODUCT,
      price: { amount: "12.5", currency: "EUR" },
    });
  });
}

export function slowProductHandler(delayMs: number, log?: RequestLog) {
  return http.get(PRODUCT_URL, async ({ request }) => {
    log?.requests.push(request.clone());
    await delay(delayMs);
    return HttpResponse.json(DEFAULT_PRODUCT);
  });
}

export function slowProductsHandler(delayMs: number, log?: RequestLog) {
  return http.get(PRODUCTS_URL, async ({ request }) => {
    log?.requests.push(request.clone());
    await delay(delayMs);
    return HttpResponse.json({ items: makeProducts(1), nextCursor: null });
  });
}
