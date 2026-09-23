import { useCallback, useEffect, useState } from "react";
import { privateProjectApi } from "../api/privateProjectApi";

const initialFilters = {
  BranchName: "",
  ProjectName: "",
  ProjectPlace: "",
  Customer: "",
  Consultant: "",
  District: "",
  Contractor: "",
  ProjectValue: "",
  StationNumber: "",
  TimeOfProject: "",
  SafetyViolationsExist: "",
  WorkDescription: "",
  IsArchived: "",
  OrderDate: "",
  Coordinates: "",
};

export const usePrivateProjects = () => {
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState(initialFilters);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [totalCount, setTotalCount] = useState(0);

  const fetchProjects = useCallback(async (currentFilters = filters) => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          params[key] = value;
        }
      });

      const response = await privateProjectApi.getAll(params);

      const data =
        response?.data?.items ||
        response?.data?.data ||
        response?.data ||
        [];

      const result = Array.isArray(data) ? data : [];

      setProjects(result);

      const count =
        response?.data?.totalCount ??
        response?.data?.total ??
        response?.totalCount ??
        result.length;

      setTotalCount(count);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "حدث خطأ أثناء تحميل المشاريع"
      );

      setProjects([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const updateFilter = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    fetchProjects(initialFilters);
  };

  const applyFilters = () => {
    fetchProjects(filters);
  };

  const deleteProject = async (id) => {
    try {
      setDeleting(true);

      await privateProjectApi.delete(id);

      setProjects((prev) =>
        prev.filter((project) => {
          const projectId =
            project.id ||
            project.Id ||
            project.privateProjectId ||
            project.PrivateProjectId;

          return String(projectId) !== String(id);
        })
      );

      setTotalCount((prev) => Math.max(0, prev - 1));

      return true;
    } catch (err) {
      console.error(err);

      throw new Error(
        err?.response?.data?.message ||
          err?.message ||
          "فشل حذف المشروع"
      );
    } finally {
      setDeleting(false);
    }
  };

  return {
    projects,
    filters,
    loading,
    deleting,
    error,
    totalCount,
    updateFilter,
    resetFilters,
    applyFilters,
    fetchProjects,
    deleteProject,
  };
};