import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Url } from "../../function/FunctionApi";
import Swal from "sweetalert2";
import endpointMap from "../../util/ModelsProjectsUrls";
import FomInputs from "./FomInputs";
import { useParams } from "react-router-dom";

const Form = ({ userData, apiData }) => { 
  const {id} =useParams() 
  const createUrl = `${Url}Maintenance/create-maintenance`;
const updateUrl = `${Url}Maintenance/update/${id}`;
  const [formData, setFormData] = useState({
    WorkOrderType: "",
    FaultNumber: "",
    District: "",
    Office: "",
    WorkDescription: "",
    StationNumber: "",
    DurationOfImplementation: "",
    OrderDate: " ",
    ReceiveDateTime: "",
    Situation: "",
    Contractor: "",
    Engineer: "",        
    Supervisor: "",      
    ProjectOwner: "", 
    Consultant: "",
    Note: "",
    SafetyViolationsExist: "",
    EstimatedValue: "",
    ActualValue: "",
    ExtractNumber: "",
    DescriptionViolation: "",
    NumberOfEquipment: "",
    TypeOfStomachTest: "",
    TaskNumber: "",
    NotificationNumber: "",
    ImplementationPhase: "",
    PricingItemIds: [],
    pricingItemsObjects: [],
  });

  const [fileData, setFileData] = useState({
    ModelPhotos: [],
    SitePhotos: [],
    SafetyWastePhotos: [],
    TestModels: [],
  });

  const fileInputRefs = {
    ModelPhotos: useRef(null),
    SitePhotos: useRef(null),
    SafetyWastePhotos: useRef(null),
    TestModels: useRef(null),
  };

  const [errorMessage, setErrorMessage] = useState("");
  const token = userData?.token;
  const [showModal, setShowModal] = useState({ success: false, error: false });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (apiData) {
      console.log(apiData);
      setFormData({
        WorkOrderType: apiData.workOrderType || "",
        FaultNumber: apiData.faultNumber || "",
        Contractor: apiData.contractor || "",
        Engineer: apiData.engineer || "",          
        Supervisor: apiData.supervisor || "",       
        ProjectOwner: apiData.projectOwner || "",
        District: apiData.district || "",
        Consultant: apiData.consultant || "",
        Resources: apiData.resources || "",
        Note: apiData.note || "",
        OrderDate: apiData?.orderDate?.split("T")[0] || "",
        OrderType: apiData.orderType || "",
        Office: apiData.office || "",
        WorkDescription: apiData.workDescription || "",
        StationNumber: apiData.stationNumber || "",
        DurationOfImplementation: apiData.durationOfImplementation || "0",
        ReceiveDateTime: apiData.receiveDateTime.split("T")[0] || "",
        Situation: apiData.situation || "",
        SafetyViolationsExist: apiData.safetyViolationsExist,
        EstimatedValue: apiData.estimatedValue,
        ActualValue: apiData.actualValue,
        ExtractNumber: apiData.extractNumber,
        ImplementationPhase: apiData.implementationPhase || "",
        TypeOfStomachTest: apiData.typeOfStomachTest,
        TaskNumber: apiData.taskNumber,
        DescriptionViolation: apiData.descriptionViolation || "",
        NotificationNumber: apiData.notificationNumber,
        NumberOfEquipment: apiData.numberOfEquipment,
        PricingItemIds: apiData.pricingItems?.map(i => i.id) || [],
        pricingItemsObjects: apiData.pricingItems || [],
      });
      setFileData({
        ModelPhotos: apiData.modelPhotos || [],
        SitePhotos: apiData.sitePhotos || [],
        SafetyWastePhotos: apiData.safetyWastePhotos || [],
        TestModels: apiData.testModels || [],
      });
    }
  }, [apiData]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "SafetyViolationsExist"
          ? value === "exists"
            ? true
            : false
          : value,
    }));
  };

  const openFileSelector = (fileType) => {
    fileInputRefs[fileType].current.click();
  };

  const handleFileChange = (event, fileType) => {
    const uploadedFiles = Array.from(event.target.files);
    const newFiles = uploadedFiles.filter((file) => {
      if (file.type === "application/pdf") {
        return true;
      }
      return file.size <= 1 * 1024 * 1024 * 1024;
    });
    const rejectedFiles = uploadedFiles.filter((file) => {
      return (
        file.type !== "application/pdf" && file.size > 1 * 1024 * 1024 * 1024
      );
    });

    if (rejectedFiles.length) {
      setErrorMessage("بعض الملفات كانت كبيرة جدًا ولا يمكن رفعها.");
    } else {
      setErrorMessage("");
    }

    setFileData((prev) => ({
      ...prev,
      [fileType]: [...prev[fileType], ...newFiles],
    }));
  };

  const handleFileDelete = (fileType, fileToDelete) => {
    setFileData((prev) => ({
      ...prev,
      [fileType]: prev[fileType].filter(
        (file) => file.name !== fileToDelete.name
      ),
    }));
  };

  const handleSubmit = async (isArchive) => {
    let fieldErrors = [];
    if (formData.Office === "") fieldErrors.push("المكتب");
    if (formData.WorkOrderType === "") fieldErrors.push("نوع  امر العمل");
    if (formData.DurationOfImplementation === "")
      fieldErrors.push("مدة التنفيذ");

    // if (formData.Situation === "") fieldErrors.push("الحالة");
    if (formData.ReceiveDateTime === "")
      fieldErrors.push(" تاريخ استلام امر العمل");
    // if ( formData.ExtractNumber === "") fieldErrors.push("رقم  المستخلص");
    // if (   formData.ActualValue === "") fieldErrors.push("القيمة الفعلية");
    // if (formData.StationNumber === "") fieldErrors.push(" رقم المحطه");
    if (formData.District === "") fieldErrors.push("  الحي");
    if (formData.WorkDescription === "") fieldErrors.push(" وصف المشروع");
    // if (formData.OrderDate === "") fieldErrors.push("تاريخ التنفيذ");
    if (formData.FaultNumber === "") fieldErrors.push("رقم امر العمل  ");
    if (formData.WorkDescription === "") fieldErrors.push(" وصف المشروع");
    // if (formData.EstimatedValue === "") fieldErrors.push(" القيمه التقديريه ");
    if (formData.Contractor === "") fieldErrors.push(" المقاول");
    if (formData.SafetyViolationsExist === "")
      fieldErrors.push("هل اخطاء السلامه موجوده ");
    // if (fileData.ModelPhotos.length === 0) fieldErrors.push("المتسندات ");

    if (fieldErrors.length > 0) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        html: `يرجى ملء الحقول التالية: <br> ${fieldErrors.join(", ")}`,
      });
      return;
    }
    fieldErrors = [];
    
   const submissionData = new FormData();

    const skipKeys = new Set([
      "PricingItemIds",
      "pricingItemsObjects",
      "EstimatedValue",   
      "ActualValue",     
    ]);
    Object.entries(formData).forEach(([key, value]) => {
      if (skipKeys.has(key)) return;
      if (value !== null && value !== undefined && value !== "" && value !== "null") {
        submissionData.append(key, value);
      }
    });

    formData.pricingItemsObjects?.forEach((dto, index) => {
      submissionData.append(`PricingItems[${index}].pricingItemId`,       dto.pricingItemId);
      submissionData.append(`PricingItems[${index}].estimatedQuantity`,   dto.estimatedQuantity  ?? 0);
      submissionData.append(`PricingItems[${index}].totalPrice`,          dto.totalPrice         ?? 0);
      submissionData.append(`PricingItems[${index}].executedQuantity`,    dto.executedQuantity   ?? 0);
      submissionData.append(`PricingItems[${index}].executedWorksValue`,  dto.executedWorksValue ?? 0);
      submissionData.append(`PricingItems[${index}].executionPercentage`, dto.executionPercentage ?? 0);
    });

    submissionData.append("isArchive", isArchive);

    Object.entries(fileData).forEach(([key, files]) => {
      files.forEach((file) => {
        submissionData.append(key, file);
      });
    });

    setLoading(true);
    setUploadProgress(0);

    try {
      const url = apiData ? updateUrl : createUrl;
      const method = apiData ? "PUT" : "POST";

      await axios({
        method,
        url,
        data: submissionData,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });
      if (apiData) {
        setSuccessMessage("تم تحديث الطلب بنجاح.");
      } else {
        setSuccessMessage("تم إرسال الطلب بنجاح.");
      }
      setShowModal({ success: true, error: false });
    } catch (error) {
  console.log(error.response?.data?.errors); // ← optional chaining
 console.log("STATUS:", error.response?.status);
  console.log("DATA:", JSON.stringify(error.response?.data));
  console.log("FULL ERROR:", error);
  let errorMessage =
    error.response?.data?.message || "يرجي التاكد من البيانات";

  if (error?.response?.data?.errors) {
    const errors = error.response.data.errors;
    const errorMessages = Object.values(errors).flat().join(", ");
    errorMessage = errorMessages || errorMessage;
  } else if (error?.response?.data?.data) {
    errorMessage = error.response.data.data;
  }

  setErrorMessage(errorMessage);
  setShowModal({ success: false, error: true });
}finally {
      setLoading(false);
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const handleApiFileDelete = async (fileType, fileId) => {
    const endpoint = `${Url}${endpointMap.Maintenance[fileType]}?photoId=${fileId}`;
    try {
      const response = await axios.delete(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setFileData((prev) => ({
          ...prev,
          [fileType]: prev[fileType].filter((item) => item.id !== fileId),
        }));
        Swal.fire({
          position: "center",
          icon: "success",
          title: "تم حذف الصوره بنجاح.",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    } catch (error) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "فشل حذف الصورة",
        text: "يرجى المحاولة مرة أخرى.",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };
  return (
    <FomInputs
      handleChange={handleChange}
      handleFileChange={handleFileChange}
      fileInputRefs={fileInputRefs}
      openFileSelector={openFileSelector}
      fileData={fileData}
      handleApiFileDelete={handleApiFileDelete}
      handleFileDelete={handleFileDelete}
      errorMessage={errorMessage}
      setShowModal={setShowModal}
      showModal={showModal}
      successMessage={successMessage}
      refreshPage={refreshPage}
      uploadProgress={uploadProgress}
      setLoading={setLoading}
      loading={loading}
      formData={formData}
      handleSubmit={handleSubmit}
      apiData={apiData}
      id={id}                   
      token={token}              
      setFormData={setFormData}  
    />
  );
};

export default Form;
