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
