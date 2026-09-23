import React from "react";
import img from "../../Image/Rectangle1.png";
import ActionButtons from "./ActionsBtns";
import axios from "axios";
import { Url } from "../../function/FunctionApi";
import Swal from "sweetalert2";

const DeletedProjects = ({ projects, type }) => {
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
          `${Url}Search/delete-project-from-trash/${projectId}?type=${type}`
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

  const handleRetrieve = async (projectId) => {
    const result = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: "سيتم استرجاع المشروع من سلة المهملات!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "نعم، استرجع المشروع",
      cancelButtonText: "إلغاء",
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.post(
          `${Url}Search/restore-project-from-trash/${projectId}?type=${type}`
        );

        if (response.status === 200) {
          Swal.fire("تم الاسترجاع!", "تم استرجاع المشروع بنجاح.", "success");
        } else {
          Swal.fire("فشل الاسترجاع", "تعذر استرجاع المشروع.", "error");
        }

        window.location.reload();
      } catch (error) {
        Swal.fire("خطأ", "حدث خطأ أثناء استرجاع المشروع.", "error");
      }
    }
  };

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        قائمة المشاريع المحذوفة
      </h2>
      {projects.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          لا توجد مشاريع محذوفة.
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col items-center bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300 w-full sm:w-96"
            >
              <img
                src={img}
                alt={`صورة ${project.userName}`}
                className=" w-full  h-48 rounded mb-4 object-cover"
              />
              {/* <h3 className="text-lg font-semibold text-center mb-2 text-gray-700">
                {project.workOrderType}
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                {project.workDescription}
              </p> */}
              <div className="text-sm text-gray-600 space-y-1 w-full">
                <p>
                  <span className="font-bold">رقم المحطة:</span>{" "}
                  {project.stationNumber}
                </p>
                <p>
                  <span className="font-bold">المدة:</span>{" "}
                  {project.durationOfImplementation}
                </p>
                <p>
                  <span className="font-bold">رقم العطل:</span>{" "}
                  {project.faultNumber}
                </p>
                <p>
                  <span className="font-bold">الموقع:</span>{" "}
                  {project.projectPlace}
                </p>
                <p>
                  <span className="font-bold">القيمة التقديرية:</span>{" "}
                  {project.estimatedValue}
                </p>
                <p>
                  <span className="font-bold">القيمة الفعلية:</span>{" "}
                  {project.actualValue}
                </p>
                <p>
                  <span className="font-bold">رقم الاستخراج:</span>{" "}
                  {project.extractNumber}
                </p>
                <p>
                  <span className="font-bold">الوضع:</span> {project.situation}
                </p>
                <p>
                  <span className="font-bold">تاريخ الاستلام:</span>{" "}
                  {new Date(project.receiveDateTime).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-bold">ملاحظات:</span> {project.note}
                </p>
                <p>
                  <span className="font-bold">تاريخ الإنشاء:</span>{" "}
                  {new Date(project.createAt).toLocaleDateString()}
                </p>
              </div>
              <div className="w-full">
                {/* <p
                  className={`text-sm font-medium ${
                    project.safetyViolationsExist
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {project.safetyViolationsExist
                    ? "يوجد انتهاك للسلامة"
                    : "لا توجد انتهاكات للسلامة"}
                </p> */}

                <ActionButtons
                  data={project}
                  onRetrieve={() => handleRetrieve(project.id)}
                  onDelete={() => {
                    handleDelete(project.id);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeletedProjects;
