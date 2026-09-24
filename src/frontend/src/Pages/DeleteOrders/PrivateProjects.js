import React from "react";
import img from "../../Image/Rectangle1.png";
import ActionButtons from "./ActionsBtns";
import axios from "axios";
import Swal from "sweetalert2";
import { Url } from "../../function/FunctionApi";


const PrivateProjects = ({ privateProjects, type }) => {
  const handleDelete = async (projectId) => {
    try {
      // Show confirmation dialog in Arabic
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
          `${Url}Search/delete-project-from-trash/${projectId}?type=privateproject`
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
        قائمة المشاريع الخاصة المحذوفة
      </h2>
      {privateProjects.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          لا توجد مشاريع خاصة محذوفة.
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {privateProjects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col items-center bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300 w-full sm:w-96"
            >
              <img
                src={img}
                alt="صورة المشروع"
                // alt={`صورة ${operation.userName}`}
                className="w-full h-48 rounded mb-4 object-cover"
              />
              {/* <h3 className="text-lg font-semibold text-center mb-2 text-gray-700">
                {project.projectName}
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                {project.projectPlace}
              </p> */}
              <div className="text-sm text-gray-600 space-y-1 w-full">
                <p>
                  <span className="font-bold">القيمة:</span>{" "}
                  {project.projectValue}
                </p>
                <p>
                  <span className="font-bold">المنطقة:</span> {project.district}
                </p>
                <p>
                  <span className="font-bold">العميل:</span> {project.customer}
                </p>
                <p>
                  <span className="font-bold">المستشار:</span>{" "}
                  {project.consultant}
                </p>
                <p>
                  <span className="font-bold">المقاول:</span>{" "}
                  {project.contractor}
                </p>
                <p>
                  <span className="font-bold">تاريخ الطلب:</span>{" "}
                  {new Date(project.orderDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-bold">الفرع:</span> {project.branchName}
                </p>
                <p>
                  <span className="font-bold">انتهاكات السلامة:</span>{" "}
                  {project.safetyViolationsExist ? "نعم" : "لا"}
                </p>
                <p>
                  <span className="font-bold">ملاحظات:</span> {project.note}
                </p>
                <p>
                  <span className="font-bold">أرشيف:</span>{" "}
                  {project.isArchived ? "نعم" : "لا"}
                </p>
                <p>
                  <span className="font-bold">تاريخ الإنشاء:</span>{" "}
                  {new Date(project.createAt).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-bold">تاريخ الحذف:</span>{" "}
                  {new Date(project.deletedAt).toLocaleDateString()}
                </p>
              </div>
              {/* <div className="mt-4 flex items-center">
                <img
                  src={project.userImage}
                  alt={project.userName}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <p className="text-sm text-gray-600">
                  <span className="font-bold">المستخدم:</span>{" "}
                  {project.userName}
                </p>
              </div> */}

              <ActionButtons
                onRetrieve={() => {}}
                onDelete={() => {
                  handleDelete(project.id);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrivateProjects;
