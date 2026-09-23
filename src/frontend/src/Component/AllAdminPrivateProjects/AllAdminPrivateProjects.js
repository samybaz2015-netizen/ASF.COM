import React, { useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  AlertCircle,
  Loader2,
} from "lucide-react";

import PrivateProjectsHeader from "./components/PrivateProjectsHeader";
import PrivateProjectFilters from "./components/PrivateProjectFilters";
import PrivateProjectColumns from "./components/PrivateProjectColumns";
import PrivateProjectTable, {
  columnsConfig,
} from "./components/PrivateProjectTable";
import PrivateProjectModal from "./components/PrivateProjectModal";
import PrivateProjectDetails from "./components/PrivateProjectDetails";
import Pagination from "./components/Pagination";

import { usePrivateProjects } from "./hooks/usePrivateProjects";
import { privateProjectApi } from "./api/privateProjectApi";

const AllAdminPrivateProjects = () => {
  const {
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
  } = usePrivateProjects();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [columns, setColumns] = useState(
    columnsConfig.map((column, index) => ({
      ...column,
      visible:
        index < 10,
    }))
  );

  const [modal, setModal] = useState({
    open: false,
    mode: "create",
    project: null,
  });

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [saving, setSaving] = useState(false);

  const visibleColumns = useMemo(
    () => columns.filter((column) => column.visible),
    [columns]
  );

  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * pageSize;

    return projects.slice(
      start,
      start + pageSize
    );
  }, [projects, page, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(projects.length / pageSize)
  );

  const toggleColumn = (key) => {
    setColumns((prev) =>
      prev.map((column) =>
        column.key === key
          ? {
              ...column,
              visible: !column.visible,
            }
          : column
      )
    );
  };

  const getProjectId = (project) =>
    project?.id ||
    project?.Id ||
    project?.privateProjectId ||
    project?.PrivateProjectId;

  const handleView = async (id) => {
    if (!id) return;

    try {
      setDetailsLoading(true);
      setDetailsOpen(true);

      const response =
        await privateProjectApi.getById(id);

      const project =
        response?.data?.data ||
        response?.data ||
        response;

      setSelectedProject(project);
    } catch (err) {
      console.error(err);

      setDetailsOpen(false);

      Swal.fire({
        icon: "error",
        title: "خطأ",
        text:
          err?.response?.data?.message ||
          "فشل تحميل تفاصيل المشروع",
        confirmButtonText: "حسناً",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEdit = async (id) => {
    if (!id) return;

    try {
      setDetailsLoading(true);

      const response =
        await privateProjectApi.getById(id);

      const project =
        response?.data?.data ||
        response?.data ||
        response;

      setModal({
        open: true,
        mode: "edit",
        project,
      });
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "خطأ",
        text:
          err?.response?.data?.message ||
          "فشل تحميل بيانات المشروع",
        confirmButtonText: "حسناً",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: "سيتم حذف المشروع نهائياً ولا يمكن التراجع عن هذا الإجراء.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذف المشروع",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteProject(id);

      await Swal.fire({
        icon: "success",
        title: "تم الحذف",
        text: "تم حذف المشروع بنجاح.",
        confirmButtonText: "حسناً",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "فشل الحذف",
        text: err.message,
        confirmButtonText: "حسناً",
      });
    }
  };

  const buildFormData = ({
    form,
    modelPhotos,
    sitePhotos,
    safetyPhotos,
  }) => {
    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        data.append(key, value);
      }
    });

    const appendPhotos = (field, files) => {
      files.forEach((file) => {
        if (file instanceof File) {
          data.append(field, file);
        }
      });
    };

    appendPhotos("ModelPhotos", modelPhotos);
    appendPhotos("SitePhotos", sitePhotos);
    appendPhotos(
      "SafetyWastePhotos",
      safetyPhotos
    );

    return data;
  };

  const handleSubmit = async (payload) => {
    try {
      setSaving(true);

      const formData = buildFormData(payload);

      if (modal.mode === "create") {
        await privateProjectApi.create(formData);

        await Swal.fire({
          icon: "success",
          title: "تمت الإضافة",
          text: "تم إنشاء المشروع بنجاح.",
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        const id = getProjectId(modal.project);

        if (id) {
          formData.append("Id", id);
          formData.append("PrivateProjectId", id);
        }

        await privateProjectApi.update(formData);

        await Swal.fire({
          icon: "success",
          title: "تم التعديل",
          text: "تم تحديث المشروع بنجاح.",
          timer: 1800,
          showConfirmButton: false,
        });
      }

      setModal({
        open: false,
        mode: "create",
        project: null,
      });

      await fetchProjects();
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "حدث خطأ",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "فشل حفظ المشروع",
        confirmButtonText: "حسناً",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 lg:p-8"
    >
      <PrivateProjectsHeader
        totalCount={totalCount || projects.length}
        loading={loading}
        onRefresh={() => fetchProjects()}
        onAdd={() =>
          setModal({
            open: true,
            mode: "create",
            project: null,
          })
        }
      />

      <PrivateProjectFilters
        filters={filters}
        onChange={updateFilter}
        onApply={() => {
          setPage(1);
          applyFilters();
        }}
        onReset={() => {
          setPage(1);
          resetFilters();
        }}
      />

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={18} />

          <span>{error}</span>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          النتائج:
          <span className="mx-1 font-bold text-slate-700">
            {projects.length.toLocaleString("ar-EG")}
          </span>
        </div>

        <PrivateProjectColumns
          columns={columns}
          onToggle={toggleColumn}
        />
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-lg">
              <Loader2
                size={18}
                className="animate-spin text-[#0F766E]"
              />

              جاري تحميل المشاريع...
            </div>
          </div>
        )}

        <PrivateProjectTable
          projects={paginatedProjects}
          visibleColumns={visibleColumns}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
      />

      <PrivateProjectModal
        open={modal.open}
        mode={modal.mode}
        project={modal.project}
        loading={saving}
        onClose={() =>
          setModal({
            open: false,
            mode: "create",
            project: null,
          })
        }
        onSubmit={handleSubmit}
      />

      {detailsOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
        >
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  تفاصيل المشروع
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  جميع بيانات المشروع والصور
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDetailsOpen(false);
                  setSelectedProject(null);
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {detailsLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <Loader2
                    size={30}
                    className="animate-spin text-[#0F766E]"
                  />
                </div>
              ) : (
                <PrivateProjectDetails
                  project={selectedProject}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAdminPrivateProjects;