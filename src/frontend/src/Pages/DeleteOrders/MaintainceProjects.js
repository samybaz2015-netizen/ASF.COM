import React from "react";
import img from "../../Image/Rectangle1.png";
import { FaEdit, FaTrash } from "react-icons/fa";
import ActionButtons from "./ActionsBtns";
import Swal from "sweetalert2";
import { Url } from "../../function/FunctionApi";
import axios from "axios";
const MaintenanceRequests = ({ maintenanceRequests }) => {
  const handleDelete = async (projectId) => {
    try {
      const result = await Swal.fire({
        title: "هل أنت متأكد؟",
        text: "  لن تتمكن من استرجاع هذا المشروع!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "نعم، احذف!",
        cancelButtonText: "إلغاء",
      });

      if (result.isConfirmed) {
        const response = await axios.delete(
          `${Url}Search/delete-project-from-trash/${projectId}?type=ordermaintenance`
        );

        if (response.status === 200) {
          Swal.fire("تم الحذف!", "تم حذف المشروع بنجاح.", "success");
        } else {
          Swal.fire(
            "فشل الحذف",
            "حدث خطأ أثناء الحذف. حاول مرة أخرى.",
            "error"
          );
        }
        window.location.reload();
      }
    } catch (error) {
      Swal.fire("خطأ", "حدث خطأ أثناء التواصل مع الخادم.", "error");
    }
  };
  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        قائمة طلبات الصيانة المحذوفة
      </h2>
      {maintenanceRequests.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          لا توجد طلبات صيانة محذوفة.
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {maintenanceRequests.map((operation) => (
            <div
              key={operation.id}
              className="flex flex-col items-center bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300 w-full sm:w-96"
            >
              {/* Image Section */}
              <img
                src={img}
                alt={`صورة ${operation.userName}`}
                className="w-full h-48 rounded mb-4 object-cover"
              />

              {/* Maintenance Request Details */}
              {/* <h3 className="text-lg font-semibold text-center mb-2 text-gray-700">
                {operation.workOrderType}
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                {operation.workDescription}
              </p> */}
              <div className="text-sm text-gray-600 space-y-1 w-full">
                <p>
                  <span className="font-bold">رقم المحطة:</span>{" "}
                  {operation.stationNumber}
                </p>
                <p>
                  <span className="font-bold">المنطقة:</span>{" "}
                  {operation.district}
                </p>
                <p>
                  <span className="font-bold">المقاول:</span>{" "}
                  {operation.contractor}
                </p>
                <p>
                  <span className="font-bold">المستشار:</span>{" "}
                  {operation.consultant}
                </p>
                <p>
                  <span className="font-bold">تاريخ الطلب:</span>{" "}
                  {new Date(operation.orderDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-bold">الفرع:</span>{" "}
                  {operation.branchName}
                </p>
                <p>
                  <span className="font-bold">انتهاكات السلامة:</span>{" "}
                  {operation.safetyViolationsExist ? "نعم" : "لا"}
                </p>
                <p>
                  <span className="font-bold">ملاحظات:</span> {operation.note}
                </p>
                <p>
                  <span className="font-bold">القيمة التقديرية:</span>{" "}
                  {operation.estimatedValue}
                </p>
                <p>
                  <span className="font-bold">القيمة الفعلية:</span>{" "}
                  {operation.actualValue}
                </p>
                <p>
                  <span className="font-bold">مكان المشروع:</span>{" "}
                  {operation.projectPlace}
                </p>
                <p>
                  <span className="font-bold">الوضع:</span>{" "}
                  {operation.situation}
                </p>
                <p>
                  <span className="font-bold">تاريخ الاستلام:</span>{" "}
                  {new Date(operation.receiveDateTime).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-bold">تاريخ الإنشاء:</span>{" "}
                  {new Date(operation.createAt).toLocaleString()}
                </p>
                <p>
                  <span className="font-bold">تاريخ الحذف:</span>{" "}
                  {new Date(operation.deletedAt).toLocaleString()}
                </p>
              </div>

              {/* User Section */}
              {/* <div className="mt-4 flex items-center">
                <img
                  src={img}
                  alt={`صورة المستخدم ${operation.userName}`}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <p className="text-sm">
                  <span className="font-bold">المستخدم:</span> {operation.userName}
                </p>
              </div> */}
              <ActionButtons
                onRetrieve={() => {}}
                onDelete={() => {
                  handleDelete(operation.id);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaintenanceRequests;
