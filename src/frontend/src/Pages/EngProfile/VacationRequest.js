import React from "react";
import Swal from "sweetalert2";
import { FaCalendarPlus, FaUpload } from "react-icons/fa";
import { postData } from "../../function/FunctionApi";

function VacationRequest() {
   

  const requestVacation = () => {
    Swal.fire({
      title: "طلب إجازة",
      html: `
        <div class="flex flex-col gap-3 text-right">
          <div class="flex flex-col">
            <label for="vacationFrom" class="font-semibold text-gray-700">تاريخ البدء:</label>
            <input id="vacationFrom" type="date" class="swal2-input p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>

          <div class="flex flex-col">
            <label for="vacationTo" class="font-semibold text-gray-700">تاريخ الانتهاء:</label>
            <input id="vacationTo" type="date" class="swal2-input p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>

          <div class="flex flex-col">
              <label class="font-semibold text-gray-700">عدد الأيام:</label>
              <input
                id="vacationDays"
                type="text"
                readonly
                class="swal2-input p-2 border rounded-lg bg-gray-100 text-center font-bold"
                placeholder="--"
              />
            </div>

          <div class="flex flex-col">
            <label for="vacationReason" class="font-semibold text-gray-700">سبب الإجازة:</label>
            <input id="vacationReason" type="text" class="swal2-input p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="سبب الإجازة">
          </div>

          <div class="flex flex-col">
            <label for="vacationFile" class="font-semibold text-gray-700">المرفقات:</label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
              <input id="vacationFile" type="file" class="hidden">
              <label for="vacationFile" class="cursor-pointer block">
                <FaUpload class="mx-auto text-2xl text-gray-400 mb-2" />
                <span class="text-gray-600">اضغط لرفع الملف</span>
              </label>
            </div>
          </div>
        </div>
      `,
      didOpen: () => {
        const fromInput = document.getElementById("vacationFrom");
        const toInput = document.getElementById("vacationTo");
        const daysInput = document.getElementById("vacationDays");

        const calculateDays = () => {
          if (fromInput.value && toInput.value) {
            const fromDate = new Date(fromInput.value);
            const toDate = new Date(toInput.value);

            if (fromDate > toDate) {
              daysInput.value = "تاريخ غير صحيح";
              return;
            }

            const diffTime = toDate - fromDate;
            const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            daysInput.value = `${days} يوم`;
          } else {
            daysInput.value = "--";
          }
        };

        fromInput.addEventListener("change", calculateDays);
        toInput.addEventListener("change", calculateDays);
      }
      ,
          showCancelButton: true,
          confirmButtonText: "إرسال الطلب",
          cancelButtonText: "إلغاء",
        preConfirm: () => {
          const fromInput = document.getElementById("vacationFrom").value;
          const toInput = document.getElementById("vacationTo").value;
          const reason = document.getElementById("vacationReason").value;
          const file = document.getElementById("vacationFile").files[0];

          if (!fromInput || !toInput || !reason) {
            Swal.showValidationMessage("يرجى إدخال جميع الحقول المطلوبة");
            return false;
          }

        if (!file) {
            Swal.showValidationMessage("يرجى إرفاق ملف – المرفقات إجبارية");
            return false;
      }

  const fromDate = new Date(fromInput);
  const toDate = new Date(toInput);

  if (fromDate > toDate) {
    Swal.showValidationMessage("تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء");
    return false;
  }

    const diffTime = toDate.getTime() - fromDate.getTime();
    const numberOfDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return {
      from: fromInput,
      to: toInput,
      days: numberOfDays,
      reason,
      file,
    };
  }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const formData = new FormData();
          formData.append('from', new Date(result.value.from).toISOString());
          formData.append('to', new Date(result.value.to).toISOString());
          formData.append('numberOfDays', result.value.days);
          formData.append('reason', result.value.reason);
          if (result.value.file) {
            formData.append('file', result.value.file);
          }

          await postData("leaverequests/request", formData, {
            
          });

          Swal.fire(
            "تم الإرسال!",
            `تم إرسال طلب إجازة من ${result.value.from} إلى ${result.value.to} لمدة ${result.value.days} يوم بسبب "${result.value.reason}"`,
            "success"
          );
        } catch (error) {
          console.error('Error submitting leave request:', error);
          Swal.fire(
            "خطأ!",
            "حدث خطأ أثناء إرسال طلب الإجازة",
            "error"
          );
        }
      }
    });
  };

  return (
    <button
      onClick={requestVacation}
      className="p-6 mt-6 w-full bg-mainColor hover:bg-mainColor/90 text-white py-3 rounded-lg flex items-center justify-center gap-2 text-lg transition"
    >
      <FaCalendarPlus /> طلب إجازة
    </button>
  );
}

export default VacationRequest;
