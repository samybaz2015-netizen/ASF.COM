import { useState, useEffect, useCallback } from "react";
import { getBranches } from "../services/branchService";

export const useBranches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل الأفرع");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return { branches, loading, error, refetch: fetchBranches };
};