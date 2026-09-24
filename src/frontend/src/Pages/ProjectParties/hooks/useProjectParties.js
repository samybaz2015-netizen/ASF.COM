import { useState, useEffect, useCallback } from "react";
import {
  getProjectParties,
  createProjectParty,
  updateProjectParty,
  deleteProjectParty,
} from "../services/projectPartyService";

export const useProjectParties = (typeFilter, branchId) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProjectParties({ type: typeFilter, branchId });
      setItems(data);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, branchId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (payload) => {
    await createProjectParty(payload);
    await fetchItems();
  };

  const editItem = async (id, payload) => {
    await updateProjectParty(id, payload);
    await fetchItems();
  };

  const removeItem = async (id) => {
    await deleteProjectParty(id);
    await fetchItems();
  };

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    addItem,
    editItem,
    removeItem,
  };
};