import React from "react";
import { useNavigate } from "react-router-dom";
import types from "../../util/ProjectsType";
import { FaEye } from "react-icons/fa";

function RequestsTable({
  filteredRequests,
  selectedRequests,
  handleCheckboxChange,
  handleViewRequest,
}) {
  const navigate = useNavigate();

  const getProjectTypeRoute = (orderType) => {
    switch (orderType) {
      case types.construction:
        return "construction";
      case types.emergency:
        return "emergency";
      case types.rehabilitation_work:
        return "rehabilitationworks";

      case types.maintenance:
        return "maintenance";
      default:
        return "privateproject";
    }
  };

  return (
    <div className="overflow-x-auto h-[50vh] relative">
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-mainColor text-white sticky top-0 z-10">
          {" "}
          <tr className="bg-secondaryColor text-white">
            {/* <th className="p-1 text-sm text-center">اختيار</th> */}
            <th className="p-1 text-sm text-center">عرض</th>
            <th className="p-1 text-sm text-center">رقم الطلب</th>
            <th className="p-1 text-sm text-center">نوع المشروع</th>
            <th className="p-1 text-sm text-center">المقاول</th>
            <th className="p-1 text-sm text-center">الاستشاري</th>
            <th className="p-1 text-sm text-center">رقم المحطة</th>
            <th className="p-1 text-sm text-center">المنطقة</th>
            <th className="p-1 text-sm text-center">حالة الطلب</th>
            <th className="p-1 text-sm text-center">وصف العمل</th>
            <th className="p-1 text-sm text-center">رقم امر العمل</th>
            <th className="p-1 text-sm text-center">موقف التنفيذ</th>
            <th className="p-1 text-sm text-center">المكتب</th>
            <th className="p-1 text-sm text-center">القيمه الفعليه</th>
            <th className="p-1 text-sm text-center">رقم المستخلص</th>
            <th className="p-1 text-sm text-center">القيمه التقديريه</th>
            <th className="p-1 text-sm text-center">تاريخ التنفيذ</th>
            <th className="p-1 text-sm text-center">تاريخ الاستلام</th>
            <th className="p-1 text-sm text-center">الوصف</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests?.map((request, index) => (
            <tr
              key={index}
              className="border border-gray-300 text-center cursor-pointer"
            >
              {/* <td className="p-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedRequests.includes(index)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleCheckboxChange(index);
                  }}
                />
              </td> */}
              <td className="p-2">
                <button
                  className="view-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewRequest(request);
                  }}
                >
                  <FaEye />
                </button>
              </td>
              <td className="p-2">{request.requestNumber || "لا يوجد"}</td>
              <td className="p-2">{request.projectType || "لا يوجد"}</td>
              <td className="p-2">{request.contractor || "لا يوجد"}</td>
              <td className="p-2">{request.consultant || "لا يوجد"}</td>
              <td className="p-2">{request.stationNumber || "لا يوجد"}</td>
              <td className="p-2">{request.district || "لا يوجد"}</td>
              <td className="p-2">
                {request.situation === "finish"
                  ? "تم التنفيذ"
                  : request.situation === "notFinished"
                  ? "تحت التنفيذ"
                  : "جاري"}
              </td>
              <td className="p-2">{request.orderType || "لا يوجد"}</td>
              <td className="p-2">{request.faultNumber || "لا يوجد"}</td>
              <td className="p-2">
                {request.situation === "finish"
                  ? "تم التنفيذ"
                  : request.situation === "notFinished"
                  ? "تحت التنفيذ"
                  : "جاري"}
              </td>
              <td className="p-2">{request.office || "لا يوجد"}</td>
              <td className="p-2">{request.actualValue || "لا يوجد"}</td>
              <td className="p-2">{request.extractValue || "لا يوجد"}</td>
              <td className="p-2">{request.estimatedValue || "لا يوجد"}</td>
              <td className="p-2">
                {request.orderDate?.split("T")[0] || "لا يوجد"}
              </td>
              <td className="p-2">
                {request.receiveDate?.split("T")[0] || "لا يوجد"}
              </td>
              <td className="p-2">{request.jobDescription || "لا يوجد"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RequestsTable;
