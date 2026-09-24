import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {  Url } from "../../function/FunctionApi";
import Swal from "sweetalert2";
import { useParams, useSearchParams } from "react-router-dom";
import endpointMap from "../../util/ModelsProjectsUrls";
import FomInputs from "./EmergencyFormInputs";

const Form = ({ userData, apiData }) => {
 const {id} = useParams();
  const createUrl = `${Url}Emergency/create-emergency`;
const updateUrl = `${Url}Emergency/update/${id}`;
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    WorkOrderType: "",
    FaultNumber: "",
    FaultType: "",
    District: "",
    StationNumber:"",
    Office: "",
    OrderDate: "",
    WorkDescription: "",
    DurationOfImplementation: "",
    DescriptionViolation: "",
    ReceiveDateTime: "",
    Situation: "",
    Contractor: "",
    Engineer: "",        
    Supervisor: "",      
    ProjectOwner: "", 
    Consultant: "",
    Note: "",
    SafetyViolationsExist: false,
    EstimatedValue: "",
    ActualValue: "",
    ExtractNumber: "",
    TypeOfStomachTest: "",
    TaskNumber: "",
    NumberOfEquipment: "",
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
      setFormData({
        WorkOrderType: apiData.workOrderType || "",
        Office: apiData.office || "",
        ReceiveDateTime: apiData.receiveDateTime.split("T")[0] || "",
        FaultType: apiData.faultType || "",
        FaultNumber: apiData.faultNumber || "",
        Contractor: apiData.contractor || "",
        Engineer: apiData.engineer || "",          
        Supervisor: apiData.supervisor || "",       
        ProjectOwner: apiData.projectOwner || "",
        District: apiData.district || "",
        Consultant: apiData.consultant || "",
        OrderDate: apiData?.orderDate?.split("T")[0] || "",
        Note: apiData.note || "",
        OrderType: apiData.orderType || "",
        WorkDescription: apiData.workDescription || "",
        StationNumber: apiData.stationNumber || "",
        DurationOfImplementation: apiData.durationOfImplementation || "",
        Situation: apiData.situation || "",
        SafetyViolationsExist: apiData.safetyViolationsExist,
        EstimatedValue: apiData.estimatedValue,
        ActualValue: apiData.actualValue,
        ExtractNumber: apiData.extractNumber,
        DescriptionViolation: apiData.descriptionViolation || '',
        ImplementationPhase: apiData.implementationPhase || "",
        TypeOfStomachTest: apiData.typeOfStomachTest,
        TaskNumber: apiData.taskNumber,
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
    if (formData.District === "") fieldErrors.push("  الحي");
    if (formData.WorkDescription === "") fieldErrors.push(" وصف المشروع");
    // if (formData.OrderDate === "") fieldErrors.push("تاريخ التنفيذ");
    if (formData.Contractor === "") fieldErrors.push(" المقاول");
    // if (formData.EstimatedValue === "") fieldErrors.push(" القيمه التقديريه ");
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
      submissionData.append(`PricingItems[${index}].executionPercentage`, dto.executionPercentage?? 0);
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
      console.log(error);
      console.log(error);

      let errorMessage =
        error.response?.data?.message || "يرجي  التاكد من البيانات";

      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(", ");
        errorMessage = errorMessages || errorMessage;
      } else if (error?.response?.data?.data) {
        errorMessage = error.response.data.data;
      }

      setErrorMessage(errorMessage);

      setShowModal({ success: false, error: true });
    } finally {
      setLoading(false);
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const handleApiFileDelete = async (fileType, fileId) => {
    const endpoint = `${Url}${endpointMap.Emergency[fileType]}?photoId=${fileId}`;
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
          // Use the token from the user's profile
        }));
        Swal.fire({
          position: "center",

          icon: "success",
          // Update the state with the new list of files
          title: "تم حذف الصوره بنجاح.",
          showConfirmButton: false,
          timer: 1500,
        });

        // Show a success message to the user
      }
    } catch (error) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "فشل حذف الصورة",
        text: "يرجى المحاولة مرة أخرى.",
        showConfirmButton: false,
        timer: 1500,
        // Show an error message to the user if there was a problem
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
