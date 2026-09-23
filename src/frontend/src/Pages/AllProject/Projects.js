import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Url } from "../../function/FunctionApi";
import Swal from "sweetalert2";
import "./Projects.css";
import Loading from "./Loading";
import CompletedUi from "./ProjectsCards";
import axiosInstance from "../../api/apiClient";
import types from "../../util/ProjectsType";

const Projects = ({ userData }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    faultNumber: "",
    office: "",
    branchName: "",
    workOrderType: "",
    situation: "",     
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(3);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        PageIndex: page,
        PageSize: pageSize,
        BranchName: filters.branchName || userData?.branchName || "",
      };

      if (filters.faultNumber)   params.FaultNumber   = filters.faultNumber;
      if (filters.office)        params.Office        = filters.office;
      if (filters.workOrderType) params.WorkOrderType = filters.workOrderType;

      // تحويل situation لـ isArchived
      if (filters.situation === "تحت التنفيذ") params.IsArchived = true;
      if (filters.situation === "تم التنفيذ")  params.IsArchived = false;

      const response = await axios.get(
        `${Url}OrdersinHome/all-projects-inHome`,
        { params }
      );

      const d = response.data?.data;
      if (!d) { setProjects([]); return; }

      const constructions   = (d.constructions?.data       || []).map(p => ({ ...p, type: "الإنشاءات" }));
      const emergencies     = (d.emergencies?.data         || []).map(p => ({ ...p, type: "الطوارئ" }));
      const maintenances    = (d.maintenances?.data        || []).map(p => ({ ...p, type: "الصيانة" }));
      const rehabilitations = (d.rehabilitationWorks?.data || []).map(p => ({ ...p, type: "أعمال التأهيل" }));
      const privateProjects = (d.privateProjects?.data     || []).map(p => ({ ...p, type: "المشاريع الخاصة" }));

      // فلترة situation client-side لو الـ API مش بيدعمها
      let merged = [...constructions, ...emergencies, ...maintenances, ...rehabilitations, ...privateProjects];

      if (filters.situation === "تحت التنفيذ") merged = merged.filter(p => p.isArchived === true);
      if (filters.situation === "تم التنفيذ")  merged = merged.filter(p => p.isArchived === false);

      setProjects(merged);

      const maxTotalPages = Math.max(
        d.constructions?.totalPages       || 1,
        d.emergencies?.totalPages         || 1,
        d.maintenances?.totalPages        || 1,
        d.rehabilitationWorks?.totalPages || 1,
        d.privateProjects?.totalPages     || 1,
      );

      const totalCountAll =
        (d.constructions?.totalCount       || 0) +
        (d.emergencies?.totalCount         || 0) +
        (d.maintenances?.totalCount        || 0) +
        (d.rehabilitationWorks?.totalCount || 0) +
        (d.privateProjects?.totalCount     || 0);

      setTotalPages(maxTotalPages);
      setTotalCount(totalCountAll);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, userData]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

   const handleDelete = async (projectId, projectType) => {
    console.log(projectType);
    const getProjectTypeRoute = (orderType) => {
      switch (orderType) {
        case types.construction:
          return "construction";
        case types.emergency:
          return "emergency";
        case types.maintenance:
          return "maintenance";
        default:
          return "rehabilitationworks";
      }
    };

    const projectTypeRoute = getProjectTypeRoute(projectType);

    const result = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: "لا يمكنك التراجع عن هذا!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذف!",
      cancelButtonText: "لا، تراجع!",
    });

    if (result.isConfirmed) {
      try {
        const apiUrl = `Search/delete-by-orderidWithType?orderId=${projectId}&type=${projectTypeRoute}`;
        await axiosInstance.delete(`/${apiUrl}`);

        Swal.fire({
          position: "center",
          icon: "success",
          title: "تم  تقديم طلب حذف سيتم المراجعه من خلال الادارة .",
          showConfirmButton: false,
          timer: 1500,
        });
        // fetchProjects();
        // window.location.reload();
      } catch (err) {
        Swal.fire({
          position: "center",
          icon: "error",
          title: "حدث خطأ أثناء حذف الطلب.",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    }
  };


  if (loading) return <Loading />;
  if (error)   return <div>Error: {error}</div>;

  return (
    <div className="latest-projects-container min-h-screen projects-page" dir="rtl">
      <CompletedUi
        filteredProjects={projects}
        allCount={totalCount}
        handleDelete={handleDelete}
        filters={filters}
        setFilters={handleFiltersChange}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={(size) => { setPageSize(size); setPage(1); }}
        totalPages={totalPages}
        userData={userData}
      />
    </div>
  );
};

export default Projects;