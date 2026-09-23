import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Link, useNavigate } from "react-router-dom";
import { Url } from "../../function/FunctionApi";
import axios from "axios";
import Swal from "sweetalert2";
import { officeNameMap } from "../../util/officeConstants";
import PrivateProjectData from "./PrivateProjectData";
import OperationProjectData from "./OperationProjectData";
import MantainsProjectData from "./MantainsProjectData";
import MainProjectData from "./MainProjectData";
import usePrintHandler from "../../hooks/HandlePrintOrder";
import WorkOrderFlowPanel from "../../Component/WorkOrderFlow/WorkOrderFlowPanel";
const Form = ({ ApiData, id, type }) => {
  const navigate = useNavigate();
  const { handlePrint } = usePrintHandler(ApiData);
  console.log(type);
  const {
    projectType,
    orderNumber,
    contractor,
    district,
    station,
    modelPhotos,
    sitePhotos,
    safetyWastePhotos,
    note,
    isExist,
  } = ApiData;

  let orderId =
    ApiData.faultNumber || ApiData.orderNumber || ApiData.projectName;

  const [showModal, setShowModal] = useState(false);

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "نوع المشروع": ApiData.type,
        "اسم الفرع": ApiData.branchName,
        الاستشاري: ApiData.consultant,
        المقاول: ApiData.contractor,
        الحي: ApiData.district,
        "رقم المحطه": ApiData.stationNumber,
        "تاريخ الطلب": new Date(ApiData.orderDate).toLocaleDateString("ar-EG"),
        "رقم الطلب": ApiData.orderNumber || ApiData.faultNumber,
        المهندس: ApiData.userName,
        أرشيف: ApiData.isArchive ? "نعم" : "لا",
        // "تنفيذ الشبكة": ApiData.isNetworkImplemented ? "نعم" : "لا",
        // "عدد صور الموقع": ApiData.sitePhotos.length,
        // "عدد صور السلامة": ApiData.safetyWastePhotos.length,
        // "عدد صور النماذج": ApiData.modelPhotos.length,
        ملاحظات: ApiData.note || "لا توجد ملاحظات",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلب");
    XLSX.writeFile(wb, "order.xlsx");
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(
        `${Url}Search/delete-by-orderidWithType?orderId=${orderId}&type=${type}`,
        {
          params: {
            orderId: id,
            type: type,
          },
        }
      );

      if (response.status === 200) {
        setShowModal(false);
        showCustomAlert("تم حذف الطلب بنجاح");
        navigate("/search-requests");
      } else {
        showCustomAlert("حدث خطأ أثناء حذف الطلب");
      }
    } catch (error) {
      showCustomAlert("حدث خطأ أثناء حذف الطلب");
      console.error(error);
    }
  };
  const handlePrintFunc = () => {
    handlePrint();
  };

  const showCustomAlert = (message) => {
    Swal.fire({
      text: message,
      icon: "success",
      confirmButtonText: "موافق",
    });
  };

  const ShowDataMaintains = (data) => {
    return <MantainsProjectData data={data} />;
  };

  const ShowDataOperations = (data) => {
    return <OperationProjectData data={data} />;
  };

  const ShowDataPrivateProject = (data) => {
    return <PrivateProjectData data={data} />;
  };

  const ShowDataProjects = (data) => {
    return <MainProjectData data={data} />;
  };

  return (
    <div className="form-container" id="form-container" dir="rtl">
      <div className="FormData">
        <div className="container">
          <h3>بيانات الطلب</h3>
          <p>Quote is generated upon loading the form</p>
          {ApiData.type === "المشاريع الخاصة"
            ? ShowDataPrivateProject(ApiData)
            : ShowDataProjects(ApiData)}

          {/* وسيط المسار id هو معرّف الصف نفسه: البحث يستعلم بـ p.Id == orderId. */}
          <WorkOrderFlowPanel routeType={type} workOrderId={id} />

          <div className="button-group">
            <button
              type="button"
              className="export-button"
              onClick={handlePrintFunc}
              style={{ background: "rgba(76, 175, 79, 1)", color: "white" }}
            >
              طباعة
            </button>
            <button
              type="button"
              className="export-button"
              onClick={handleExportExcel}
              style={{ background: "rgba(76, 175, 79, 1)", color: "white" }}
            >
              تصدير إلى إكسل
            </button>
            <button
              type="button"
              className="export-button"
              onClick={() => setShowModal(true)}
              style={{ background: "rgba(244, 67, 54, 1)", color: "white" }}
            >
              حذف الطلب
            </button>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="modal-open">
          <div className="modal-content">
            <h2>تأكيد الحذف</h2>
            <p>هل أنت متأكد أنك تريد حذف هذا الطلب؟</p>
            <button className="close-modal-button" onClick={handleDelete}>
              نعم
            </button>
            <button
              className="close-modal-button"
              onClick={() => setShowModal(false)}
            >
              لا
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Form;
