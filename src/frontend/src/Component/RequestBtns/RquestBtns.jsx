import React, { useEffect } from "react";
import Swal from "sweetalert2";
import isWithinCity from "../../util/deteminLocation";
function RequestBtns({ loading, Situation, handleSubmit }) {
  const city = localStorage.getItem("IsRiyadh") === "false" ? "جده" : "الرياض";

  let location = localStorage.getItem("userLocation");
  if (location) {
    location = JSON.parse(location);
  }
 


   useEffect(() =>{ 

   } ,[])
  const latitude = location?.latitude;
  const longitude = location?.longitude;

  const handleAction = async (isFinishAction) => {
    if (!latitude || !longitude) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "لم يتم العثور على الموقع",
      });
      return;
    }
    const isAllowed =
      localStorage.getItem("isAllowed") === "true";
    const validLocation = isWithinCity(city, latitude, longitude, isAllowed);

    // if (!validLocation) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "خطأ",
    //     text: `الموقع الحالي لا يتطابق فرع  ${city}`,
    //   });
    //   return;
    // }

    if (isFinishAction) {
      if (Situation !== "finish") {
        handleSubmit(true);
      } else {
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text: "عذرا الطلب منتهي",
        });
      }
    } else {
      if (Situation !== "finish") {
        handleSubmit(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text: "عذرا الطلب تحت التنفيذ",
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        className={`submit-button hover:scale-105 transition-all px-4 py-2 rounded ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-secondaryColor"
        } text-white`}
        onClick={() => handleSubmit(false)}
        // disabled={loading}
      >
        {loading ? "جاري التحميل..." : "تم التنفيذ"}
      </button>

      <button
        type="button"
        className={`submit-button hover:scale-105 transition-all bg-mainColor !hover:bg-mainColor/90 px-4 py-2 rounded ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-mainText"
        } text-white`}
        onClick={() => handleSubmit(true)}
        // disabled={loading}
      >
        {loading ? "جاري التحميل..." : "تحت التنفيذ"}
      </button>
    </div>
  );
}

export default RequestBtns;
