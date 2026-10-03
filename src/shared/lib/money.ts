/**
 * Formate un montant décimal fourni sous forme de chaîne, sans le convertir
 * en `number` : `Intl.NumberFormat` lit la chaîne décimale directement.
 */
export function formatMoney(
  amount: string,
  currency: string,
  locale: string,
): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });
  return formatter.format(amount as Intl.StringNumericLiteral);
}
