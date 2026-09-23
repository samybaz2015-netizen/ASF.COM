import { useState, useMemo, useCallback } from "react";
import { FILTER_CONFIG } from "../utils/Ordersconfig";

const emptyFilters = () => Object.fromEntries(FILTER_CONFIG.map((f) => [f.key, ""]));

export function useOrdersFilters() {
  const [filters, setFilters] = useState(emptyFilters);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(emptyFilters());
    setSearchQuery("");
  }, []);

  const activeFiltersCount = useMemo(
    () => Object.values(filters).filter((v) => v !== "").length + (searchQuery ? 1 : 0),
    [filters, searchQuery]
  );

  return {
    filters,
    searchQuery,
    setSearchQuery,
    handleFilterChange,
    clearFilters,
    activeFiltersCount,
  };
}