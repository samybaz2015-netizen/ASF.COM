import React, { useState, useCallback } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import useExportToExcel from "../../hooks/ExportExcel";
import { useExcelExport } from "./hooks/ExportExcel";
import usePrintProjectsHandler from "../../hooks/usePrintProjectsHandler";
import useFetchAllForPrint from "../../hooks/Usefetchallforprint";

import Modal from "./components/ModelPrintExport.js";
import ExportPrintButtons from "./components/ExportPrintrBtns.js";
import DataViewerModal from "../../Component/DataViewerModal/DataViewerModal";

import { useOrdersFilters } from "./hooks/UseOrdersFilters.js";
import { useOrdersData } from "./hooks/UseOrdersData";
import { useDynamicFilterOptions } from "./hooks/UseDynamicFilterOptions";
import { useRowSelection } from "./hooks/UseRowSelection";

import SearchBar from "./components/SearchBar";
import FilterPanel, { FilterToggle, ClearFiltersButton } from "./components/FilterPanel";
import ColumnPicker from "./components/ColumnPicker";
import RequestsTable from "./components/RequestsTable";
import Pagination from "./components/Pagination";
import TotalsSummary from "./components/TotalsSummary";
import LoadingOverlay from "./components/LoadingOverlay";
import RequestDetailsModal from "./components/RequestDetailsModal";

import { TABLE_COLUMNS, DEFAULT_VISIBLE_COLUMNS } from "./utils/Formatters";
import { useNavigate } from "react-router-dom";
import AdminProjectTypeModal from "./AdminProjects/components/AdminProjectTypeModal.jsx";
import Swal from "sweetalert2";
import { Url } from "../../util/Apiconfig.js";
import axiosInstance from "../../api/apiClient.js";

const SearchRequests = () => {
  const { filters, searchQuery, setSearchQuery, handleFilterChange, clearFilters, activeFiltersCount } =
    useOrdersFilters();

  const {
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
    totalPages,
  } = useOrdersData(filters, searchQuery);

  const dynamicOptions = useDynamicFilterOptions(allDataCache);
  const { selected: selectedRequests, toggle: handleCheckboxChange, toggleAll: handleSelectAll } =
    useRowSelection(apiData);
  const navigate = useNavigate();

    const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

    const handleSelectProjectType = (type) => {
      setIsAddProjectOpen(false);
      navigate(`/admin-projects/${type}`);
    };

  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDataViewerOpen, setIsDataViewerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrint, setIsPrint] = useState(false);

  const { exportToExcel: exportAllToExcel, isExporting } = useExcelExport();
  const handleExportRow = useCallback(
  async (request) => {
    if (!request) return;

    await exportAllToExcel(
      [request],
      `طلب_${request.contractNumber || request.id || "project"}_${new Date()
        .toLocaleDateString("ar-EG")
        .replace(/\//g, "-")}.xlsx`
    );
  },
  [exportAllToExcel]
);
  const { fetchAll, isFetching, buildPrintHTML } = useFetchAllForPrint(buildParams);
  const { handlePrint } = usePrintProjectsHandler(selectedRequests, apiData);
  const { exportToExcel } = useExportToExcel(apiData, selectedRequests);
    
  const visibleColumns = TABLE_COLUMNS.filter((c) => visibleColumnKeys.includes(c.key));

  const handlePrintAll = useCallback(async () => {
    const allData = await fetchAll();
    if (!allData || allData.length === 0) {
      alert("لا توجد بيانات للطباعة");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح بالـ popups لإتمام الطباعة.");
      return;
    }
    printWindow.document.write(buildPrintHTML(allData));
    printWindow.document.close();
    setIsModalOpen(false);
  }, [fetchAll, buildPrintHTML]);

  const handleExportAll = useCallback(async () => {
    const allData = await fetchAll();
    if (!allData || allData.length === 0) {
      alert("لا توجد بيانات للتصدير");
      return;
    }
    await exportAllToExcel(allData, `طلبات_${new Date().toLocaleDateString("ar-EG").replace(/\//g, "-")}.xlsx`);
    setIsModalOpen(false);
  }, [fetchAll, exportAllToExcel]);

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setIsDataViewerOpen(true);
  };


  const deleteEndpointMap = {
  // الصيانة
  "الصيانة": "Maintenance",
  Maintenance: "Maintenance",

  // المشاريع الخاصة
  "المشاريع الخاصة": "PrivateProject",
  PrivateProject: "PrivateProject",

  // التأهيل
  "اعمال التاهيل": "RehabilitationWorks",
  "أعمال التأهيل": "RehabilitationWorks",
  "التأهيل": "RehabilitationWorks",
  RehabilitationWorks: "RehabilitationWorks",

  // الإنشاءات
  "الانشاءات": "Construction",
  "الإنشاءات": "Construction",
  Construction: "Construction",

  // الطوارئ
  "الطوارئ": "Emergency",
  Emergency: "Emergency",
};

  const handleDelete = async (id, projectType) => {
    const endpointName = deleteEndpointMap[projectType];

    if (!endpointName) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: `نوع المشروع غير مدعوم للحذف: ${projectType}`,
      });
      return;
    }

    const result = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: "سيتم حذف المشروع نهائيًا.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء",
    });

    if (!result.isConfirmed) return;

    try {
      await axiosInstance.delete(`${Url}${endpointName}/${id}`);

      await Swal.fire({
        icon: "success",
        title: "تم الحذف",
        text: "تم حذف المشروع بنجاح.",
        timer: 1500,
        showConfirmButton: false,
      });

      // إعادة جلب البيانات
      window.location.reload();

    } catch (error) {
      console.error("Delete error:", error);

      Swal.fire({
        icon: "error",
        title: "فشل الحذف",
        text:
          error.response?.data?.message ||
          "حدث خطأ أثناء حذف المشروع.",
      });
    }
  };

  const userData = JSON.parse(
  localStorage.getItem("userData") || "null"
);

const isAdmin =
  userData?.userType?.toLowerCase() === "admin";

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[1600px] space-y-4 px-3 py-4 font-sans lg:px-6">
      <LoadingOverlay show={isFetching || isExporting} />

      {/* رأس الصفحة */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
     البحث في الطلبات
          </h1>

          <p className="text-sm text-slate-400">
            إجمالي النتائج:{" "}
            <strong className="text-teal-700">{totalCount}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddProjectOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-900 hover:shadow-md"
        >
          <span className="text-lg leading-none">+</span>
          إضافة مشروع
        </button>
      </div>

      {/* شريط البحث والفلاتر */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onClear={() => setSearchQuery("")} />
        <FilterToggle open={showFilters} onToggle={() => setShowFilters((v) => !v)} count={activeFiltersCount} />
        <ColumnPicker visibleKeys={visibleColumnKeys} onChange={setVisibleColumnKeys} />
        {activeFiltersCount > 0 && <ClearFiltersButton onClick={clearFilters} />}
      </div>
     <TotalsSummary requests={apiData} />
      <FilterPanel open={showFilters} filters={filters} onChange={handleFilterChange} dynamicOptions={dynamicOptions} />

      {/* الجدول */}
      {loading ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
          <Skeleton count={10} height={42} />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
      ) : (
        <RequestsTable
          requests={apiData}
          columns={visibleColumns}
          selected={selectedRequests}
          onToggle={handleCheckboxChange}
          onToggleAll={handleSelectAll}
          onView={handleViewRequest}
          onDelete={handleDelete}
          onExportRow={handleExportRow}
          isAdmin={isAdmin}
        />
      )}

      <Pagination
        pageIndex={pageIndex}
        totalPages={totalPages}
        onPageChange={setPageIndex}
        pageSize={pageSize}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPageIndex(1);
        }}
      />

     

      <ExportPrintButtons selectedRequests={selectedRequests} setIsModalOpen={setIsModalOpen} setIsPrint={setIsPrint} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExport={handleExportAll}
        onPrint={handlePrintAll}
        isPrint={isPrint}
      />

      <RequestDetailsModal
        isOpen={isDataViewerOpen}
        onClose={() => setIsDataViewerOpen(false)}
        data={selectedRequest}
      />
      <AdminProjectTypeModal 
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        onSelect={handleSelectProjectType}
      />

    </div>
  );
};

export default SearchRequests;