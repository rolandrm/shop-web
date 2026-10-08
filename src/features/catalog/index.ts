export { BackToCatalogLink } from "./components/back-to-catalog-link";
export { CatalogLink } from "./components/catalog-link";
export { CurrencyFilter } from "./components/currency-filter";
export { ProductDetailError } from "./components/product-detail-error";
export { ProductDetailView } from "./components/product-detail-view";
export { ProductList } from "./components/product-list";
export { ProductNotFound } from "./components/product-not-found";
export { ProductListEmpty } from "./components/product-list-empty";
export { ProductListError } from "./components/product-list-error";
export { ProductPagination } from "./components/product-pagination";
export type {
  Currency,
  ProductDetail,
  ProductListItem,
  ProductListPage,
} from "./model/products";
export { productDetailTitle } from "./model/products";

export async function loadCatalogMessages(
  locale: string,
): Promise<Record<string, unknown>> {
  return (await import(`./messages/${locale}.json`)).default;
}
