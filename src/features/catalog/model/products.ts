export const CURRENCIES = ["EUR", "USD", "GBP"] as const;

export type Currency = (typeof CURRENCIES)[number];

export type ProductListItem = {
  id: string;
  name: string;
  amount: string;
  currency: Currency;
};

export type ProductListPage = {
  items: ProductListItem[];
  nextCursor: string | null;
};

export type ProductDetail = {
  id: string;
  name: string;
  amount: string;
  currency: Currency;
};

/** Titre du document : le nom du produit affiché, sinon le repli. */
export function productDetailTitle(
  product: ProductDetail | undefined,
  fallback: string,
): string {
  return product ? product.name : fallback;
}

/**
 * Paramètres d'URL de la page produits, sans clé vide, encodés par
 * `URLSearchParams`. Renvoie une chaîne vide si aucun paramètre n'est présent.
 */
export function productsSearchParams({
  currency,
  cursor,
}: {
  currency?: Currency;
  cursor?: string;
}): string {
  const params = new URLSearchParams();
  if (currency) params.set("currency", currency);
  if (cursor) params.set("cursor", cursor);
  return params.toString();
}
