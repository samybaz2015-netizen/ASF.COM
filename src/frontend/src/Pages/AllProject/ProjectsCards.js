import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Url } from "../../function/FunctionApi";
import {
  faEye,
  faTrashCan,
  faThLarge,
  faBars,
  faEdit,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import img from "../../Image/Rectangle1.png";
import types from "../../util/ProjectsType";
import Swal from "sweetalert2";
import axios from "axios";

const baseBtn = {
  minWidth: '38px',
  height: '38px',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  background: 'white',
  color: '#374151',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'all 0.2s ease',
};

const activeBtn = {
  background: '#185FA5',
  color: 'white',
  border: 'none',
  boxShadow: '0 4px 10px rgba(24,95,165,0.3)'
};

const CompletedUi = ({
  filteredProjects,
  setCompleted,
  noDataImage,
  office,
  setOffice,
  handleDelete,
  allCount,
  userData,
  filters, setFilters, page, setPage, pageSize, setPageSize, totalPages
}) => {

  const isContractor = userData?.userType === "contractor";

  // searchTerm داخلي — مش محتاج يجي من برا
  const [searchTerm, setSearchTerm] = useState("");

  // ① State محلي للـ inputs — لا يؤثر على الفلترة إلا عند الضغط على الزرار
  // فلترة محلية بالـ searchTerm
  const displayedProjects = filteredProjects.filter(p =>
    !searchTerm ||
    (p.faultType && p.faultType.includes(searchTerm)) ||
    (p.faultNumber && p.faultNumber.toString().includes(searchTerm)) ||
    (p.orderNumber && p.orderNumber.toString().includes(searchTerm)) ||
    (p.district && p.district.includes(searchTerm)) ||
    (p.office && p.office.includes(searchTerm))
  );

  const [localFilters, setLocalFilters] = useState({
    faultNumber: filters.faultNumber || '',
    office: filters.office || '',
    branchName: filters.branchName || '',
    workOrderType: filters.workOrderType || '',
    situation: filters.situation || '',
  });

  // ② لما يضغط "فلترة" — نحدث الـ filters الحقيقية دفعة واحدة
  const handleApplyFilters = () => {
    setFilters({ ...localFilters });
    setPage(1); // نرجع للصفحة الأولى
  };

  // ③ إعادة تعيين الكل
  const handleResetFilters = () => {
    const empty = { faultNumber: '', office: '', branchName: '', workOrderType: '', situation: '' };
    setLocalFilters(empty);
    setFilters(empty);
    setPage(1);
  };

  const handleUpdateExcavationLength = async (id) => {
    const { value: formValues } = await Swal.fire({
      title: "تحديث الحفريه والكيبل المنفذ يوميا",
      html: `
        <input id="excavation-input" class="swal2-input" placeholder="أدخل الحفريه المنفذه يوميا">
        <input id="cable-input" class="swal2-input" placeholder="أدخل طول الكيبل المنفذ يوميا">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "تأكيد",
      cancelButtonText: "إلغاء",
      preConfirm: async () => {
        const excavationLength = document.getElementById("excavation-input").value;
        const cableLength = document.getElementById("cable-input").value;

        if (!excavationLength || !cableLength) {
          return Swal.showValidationMessage("يجب إدخال جميع القيم!");
        }

        Swal.showLoading();
        await axios.put(Url + `Construction/${id}/update-excavation-length`, {
          projectExcavationLengthEnd: excavationLength,
          cableLengthEnd: cableLength,
        });

        return { excavationLength, cableLength };
      },
    });

    if (formValues) {
      Swal.fire({
        title: "تم التحديث!",
        text: `تم تحديث الحفريه إلى: ${formValues.excavationLength} وطول الكيبل إلى: ${formValues.cableLength}`,
        icon: "success",
        confirmButtonText: "حسنًا",
      });
    }
  };

  const [isGridView, setIsGridView] = useState(true);

  const getPageRange = (current, total) => {
    const delta = 2;
    let start = Math.max(1, current - delta);
    let end = Math.min(total, current + delta);
    if (end - start < 4) {
      if (start === 1) end = Math.min(total, start + 4);
      else start = Math.max(1, end - 4);
    }
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    return { start, end, pages };
  };
  console.log("project types:", filteredProjects.map(p => ({ id: p.id, type: p.type })));

  return (
    <div className="container mx-auto p-4">

      {/* ====== قسم الفلترة ====== */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'flex-end' }}>
        <input
          placeholder="رقم أمر العمل"
          value={localFilters.faultNumber}
          onChange={e => setLocalFilters({ ...localFilters, faultNumber: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
          className="border p-2 rounded"
        />
        <input
          placeholder="المكتب"
          value={localFilters.office}
          onChange={e => setLocalFilters({ ...localFilters, office: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
          className="border p-2 rounded"
        />
        <input
          placeholder="الفرع"
          value={localFilters.branchName}
          onChange={e => setLocalFilters({ ...localFilters, branchName: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
          className="border p-2 rounded"
        />
        <input
          placeholder="نوع أمر العمل"
          value={localFilters.workOrderType}
          onChange={e => setLocalFilters({ ...localFilters, workOrderType: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
          className="border p-2 rounded"
        />
        <select
          value={localFilters.situation}
          onChange={e => setLocalFilters({ ...localFilters, situation: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">كل الحالات</option>
          <option value="تحت التنفيذ">تحت التنفيذ</option>
          <option value="تم التنفيذ">تم التنفيذ</option>
        </select>

        {/* ✅ زرار الفلترة الرئيسي */}
        <button
          onClick={handleApplyFilters}
          style={{
            height: '38px',
            padding: '0 20px',
            borderRadius: '8px',
            background: '#185FA5',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 10px rgba(24,95,165,0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#0f4a85'}
          onMouseLeave={e => e.currentTarget.style.background = '#185FA5'}
        >
          <FontAwesomeIcon icon={faSearch} />
          فلترة
        </button>

        {/* زرار إعادة التعيين */}
        <button
          onClick={handleResetFilters}
          style={{
            height: '38px',
            padding: '0 16px',
            borderRadius: '8px',
            background: 'white',
            color: '#6b7280',
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          إعادة تعيين
        </button>
      </div>

      {/* Top Section */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        {/* <input
          type="text"
          placeholder="ابحث عن مشروع..."
          className="border p-2 rounded-md w-1/3 min-w-[200px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        /> */}
        <h4 className="text-gray-700 font-medium">
          عدد الطلبات ({displayedProjects.length})
        </h4>
        <div className="flex gap-4">
          <button
            onClick={() => setIsGridView(!isGridView)}
            className="p-2 border rounded-md hover:bg-gray-100 transition"
          >
            <FontAwesomeIcon icon={isGridView ? faBars : faThLarge} />
          </button>
          <button
            onClick={() => setCompleted(null)}
            className="p-2 border rounded-md text-indigo-500 hover:bg-indigo-50 transition"
          >
            العوده
          </button>
        </div>
      </div>

      {/* No Data Found */}
      {displayedProjects.length === 0 && (
        <div className="text-center" dir="rtl">
          <img
            src={noDataImage}
            alt="No data available"
            className="mx-auto h-40"
          />
          <p>
            {searchTerm
              ? "لا توجد مشاريع مطابقة لبحثك."
              : "لا يوجد بيانات للعرض"}
          </p>
        </div>
      )}

      <div
        className={
          isGridView
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6"
            : "flex flex-col space-y-6 mt-6"
        }
      >
        {displayedProjects.map((project, index) => (
          <div
            key={index}
            className={`bg-white shadow-lg rounded-xl overflow-hidden relative ${
              isGridView ? "" : "flex items-center "
            }`}
          >
            <div className="relative"></div>

            <div className={`p-4 flex-1 ${!isGridView ? " gap-4" : ""}`}>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {project.faultType || "مشروع"}
              </h3>

              {project.type === "الإنشاءات" && !isContractor && (
                <button
                  onClick={() => handleUpdateExcavationLength(project.id)}
                  className="absolute top-2 right-0 text-sm bg-green-500 text-white p-2 rounded-full"
                >
                  <FontAwesomeIcon icon={faEdit} size="lg" className="text-blue-500" />
                </button>
              )}

              <div
                className={`${
                  !isGridView ? "flex flex-wrap gap-2" : "flex flex-col gap-2"
                } text-sm text-gray-700`}
              >
                <p className={`${!isGridView ? "flex flex-col" : "flex"}`}>
                  <span className="font-medium">القسم:</span>{" "}
                  {project.type || "غير محدد"}
                </p>
                <p className={`${!isGridView ? "flex flex-col" : "flex"}`}>
                  <span className="font-medium">رقم امر العمل:</span>{" "}
                  {project.faultNumber || project.orderNumber}
                </p>
                <p className={`${!isGridView ? "flex flex-col" : "flex"}`}>
                  <span className="font-medium"> رقم الطلب:</span>{" "}
                  {project.id || project.id}
                </p>
                <p className={`${!isGridView ? "flex flex-col" : "flex"}`}>
                  <span className="font-medium">نوع امر العمل:</span>{" "}
                  {project.workOrderType || "غير متاح"}
                </p>
                <p className={`${!isGridView ? "flex flex-col" : "flex"}`}>
                  <span className="font-medium">الفرع:</span>{" "}
                  {project.branchName || "غير متاح"}
                </p>
                <p className={`${!isGridView ? "flex flex-col" : "flex"}`}>
                  <span className="font-medium">المكتب:</span>{" "}
                  {project.office || "غير متاح"}
                </p>
                <p className={`${!isGridView ? "flex flex-col" : "flex"}`}>
                  <span className="font-medium">موقف المشروع:</span>{" "}
                </p>
                <p className={`${!isGridView ? "flex flex-col" : "flex"}`}>
                  <span className="font-medium">الحالة:</span>{" "}
                  {project.isArchived ? "تحت التنفيذ" : "تم التنفيذ"}
                </p>
                <p className={`${!isGridView ? "flex flex-col" : "flex"}`}>
                  <span className="font-medium">تاريخ استلام امر العمل:</span>{" "}
                  {new Date(project.receiveDateTime).toLocaleDateString()}
                </p>
                <p className={`${!isGridView ? "flex flex-col" : "flex"}`}>
                  <span className="font-medium">الحي:</span>{" "}
                  {project.district || "غير متاح"}
                </p>

                {project.type === "الإنشاءات" && (
                  <>
                    <p className={`${!isGridView ? "flex flex-col" : "flex"}`}>
                      <span className="font-medium">طول الحفريه للمشروع:</span>{" "}
                      {project.projectExcavationLength || "غير متاح"}
                    </p>
                    <p className={`${!isGridView ? "flex flex-col" : "flex"}`}>
                      <span className="font-medium">طول الحفريه المنفذه:</span>{" "}
                      {project.excavationLength || "غير متاح"}
                    </p>
                    <p className={`${!isGridView ? "flex flex-col" : "flex"}`}>
                      <span className="font-medium"> نسبه الانجاز</span>{" "}
                      {project.completionStatusReport || "غير متاح"}
                    </p>
                  </>
                )}

                <a
                  className="col-span-2 text-center text-blue-600 font-medium hover:underline"
                  href={project.coordinates || "#"}
                >
                  📍 الاحداثيات
                </a>
              </div>

              <div
                className={`flex items-end justify-end gap-4 ${isGridView && "mt-5"} justify-center`}
              >
               <Link
  to={
    project.type === types.construction
      ? `/construction-projects/${project.id}`
      : project.type === types.maintenance
      ? `/maintain-projects/${project.id}`
      : project.type === types.emergency
      ? `/emergency-projects/${project.id}`
      : project.type === types.rehabilitation_work
      ? `/rehabilitation-works/${project.id}`
      : project.type === types.special_projects
      ? `/special-projects/${project.id}`
      : `/construction-projects/${project.id}`
  }
  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
>
  {isContractor ? "رفع ملف" : "تعديل الطلب"}
</Link>

                {!isContractor && (
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                    onClick={() => handleDelete(project.id, project.type)}
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '24px',
        padding: '14px 18px',
        width: 'fit-content',
        marginInline: 'auto',
        background: '#f9fafb',
        borderRadius: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{ ...baseBtn, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
        >
          ‹
        </button>

        {getPageRange(page, totalPages).start > 1 && (
          <>
            <button onClick={() => setPage(1)} style={baseBtn}>1</button>
            {getPageRange(page, totalPages).start > 2 && (
              <span style={{ color: '#9ca3af', padding: '0 4px' }}>...</span>
            )}
          </>
        )}

        {getPageRange(page, totalPages).pages.map(n => (
          <button
            key={n}
            onClick={() => setPage(n)}
            style={{ ...baseBtn, ...(n === page ? activeBtn : {}) }}
            onMouseEnter={e => { if (n !== page) e.target.style.background = '#f3f4f6'; }}
            onMouseLeave={e => { if (n !== page) e.target.style.background = 'white'; }}
          >
            {n}
          </button>
        ))}

        {getPageRange(page, totalPages).end < totalPages && (
          <>
            {getPageRange(page, totalPages).end < totalPages - 1 && (
              <span style={{ color: '#9ca3af', padding: '0 4px' }}>...</span>
            )}
            <button onClick={() => setPage(totalPages)} style={baseBtn}>{totalPages}</button>
          </>
        )}

        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          style={{ ...baseBtn, opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
        >
          ›
        </button>
      </div>

    </div>
  );
};

export default CompletedUi;