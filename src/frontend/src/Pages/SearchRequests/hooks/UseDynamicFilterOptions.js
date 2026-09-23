import { useMemo } from "react";
import { FILTER_CONFIG } from "../utils/Ordersconfig";

function extractOptions(data, dataKey) {
  const seen = new Set();
  const options = [];
  data.forEach((item) => {
    const val = item[dataKey];
    if (val && val !== "null" && !seen.has(val)) {
      seen.add(val);
      options.push(val);
    }
  });
  return options.sort((a, b) => a.localeCompare(b, "ar"));
}

export function useDynamicFilterOptions(allDataCache) {
  return useMemo(() => {
    const result = {};
    FILTER_CONFIG.forEach(({ key, type, dataKey }) => {
      if (type === "dynamic-select" && dataKey) {
        result[key] = extractOptions(allDataCache, dataKey);
      }
    });
    return result;
  }, [allDataCache]);
}