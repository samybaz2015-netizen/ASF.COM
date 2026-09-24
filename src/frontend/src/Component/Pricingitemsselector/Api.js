import { fetchDataWithRetries } from "../../function/FunctionApi";

export async function fetchItems(filters) {
  const params = new URLSearchParams();
  if (filters.branchId)        params.set("branchId",   filters.branchId);
  if (filters.search)          params.set("search",      filters.search);
  if (filters.itemNumber)      params.set("itemNumber",  filters.itemNumber);
  if (filters.uom)             params.set("uom",         filters.uom);
  if (filters.minPrice)        params.set("minPrice",    filters.minPrice);
  if (filters.maxPrice)        params.set("maxPrice",    filters.maxPrice);
  if (filters.isActive !== "") params.set("isActive",    filters.isActive);
  params.set("pageIndex", filters.pageIndex);
  params.set("pageSize",  filters.pageSize);

  let result = null;
  await fetchDataWithRetries(
    `PricingItems?${params.toString()}`,
    (data) => { result = data; }
  );
  if (!result) throw new Error("فشل في جلب البيانات");
  return result;
}