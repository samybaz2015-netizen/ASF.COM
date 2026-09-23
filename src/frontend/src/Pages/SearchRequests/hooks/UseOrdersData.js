import { useState, useCallback, useEffect, useRef } from "react";
import { fetchOrders, buildOrdersParams } from "../services/OrdersService";
import { FILTER_CONFIG, PAGE_SIZE_OPTIONS } from "../utils/Ordersconfig";

export function useOrdersData(filters, searchQuery) {
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [apiData, setApiData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allDataCache, setAllDataCache] = useState([]);
  const debounceRef = useRef(null);

  const load = useCallback(
    async (pg) => {
      setLoading(true);
      setError(null);
      try {
        const params = buildOrdersParams(filters, FILTER_CONFIG, {
          pageIndex: pg,
          pageSize,
          searchQuery,
        });
        const { data, totalCount: total } = await fetchOrders(params);

        setApiData(data);
        setTotalCount(total);

        setAllDataCache((prev) => {
          const existingIds = new Set(prev.map((item) => `${item.id}-${item.type}`));
          const newItems = data.filter((item) => !existingIds.has(`${item.id}-${item.type}`));
          return newItems.length > 0 ? [...prev, ...newItems] : prev;
        });
      } catch {
        setError("فشل في تحميل البيانات، يرجى المحاولة لاحقاً.");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, pageSize, searchQuery]
  );

  // إعادة التحميل من الصفحة 1 لما الفلاتر أو البحث يتغيروا (مع debounce)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPageIndex(1);
      load(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQuery, pageSize]);

  // تحميل عادي لما رقم الصفحة يتغير
  useEffect(() => {
    load(pageIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex]);

  const buildParams = useCallback(
    (overridePage) =>
      buildOrdersParams(filters, FILTER_CONFIG, {
        pageIndex: overridePage ?? pageIndex,
        pageSize,
        searchQuery,
      }),
    [filters, pageIndex, pageSize, searchQuery]
  );

  return {
    apiData,
    totalCount,
    loading,
    error,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    allDataCache,
    buildParams,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}