export { CatalogLink } from "./components/catalog-link";
export { CurrencyFilter } from "./components/currency-filter";
export { ProductList } from "./components/product-list";
export { ProductListEmpty } from "./components/product-list-empty";
export { ProductListError } from "./components/product-list-error";
export { ProductPagination } from "./components/product-pagination";
export type {
  Currency,
  ProductListItem,
  ProductListPage,
} from "./model/products";

export async function loadCatalogMessages(
  locale: string,
): Promise<Record<string, unknown>> {
  return (await import(`./messages/${locale}.json`)).default;
}
