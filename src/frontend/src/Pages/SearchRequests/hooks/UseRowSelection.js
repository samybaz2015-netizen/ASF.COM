import { useState, useCallback, useEffect } from "react";

export function useRowSelection(rows) {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setSelected([]);
  }, [rows]);

  const toggle = useCallback((index) => {
    setSelected((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => (prev.length === rows.length ? [] : rows.map((_, i) => i)));
  }, [rows]);

  return { selected, toggle, toggleAll, setSelected };
}