import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useParams } from "react-router-dom";
import ednpointMap from "../../util/ModelsProjectsUrls";
import ConstructionFormInput from "./ConstructionFormInput";
import { Url } from "../../function/FunctionApi";

const Form = ({ userData, apiData }) => {
  const { id } = useParams();
  const token = userData?.token;

  const createUrl = `${Url}Construction/create-construction`;
  const updateUrl = `${Url}Construction/update/${id}`;

  const initialFormState = {
    BranchId: "",
    WorkOrderType: "",
    FaultNumber: "",
    FaultType: "",
    District: "",
    Office: "",
    OrderDate: "",
    WorkDescription: "",
    StationNumber: "",
    DurationOfImplementation: "",
    TypeOfStomachTest: "",
    ReceiveDateTime: "",
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
    ImplementationPhase: "",
    CompletionDate: "",
    NumberOfDaysDelayed: "",
    NumberOfDaysRemaining: "",
    CompletionStatusReport: "",
    DailyExcavationLength: null,
    ExcavationLength: "",
    DescriptionViolation: "",
    Situation: "",
    NumberOfEquipment: "",
    ProjectCableLength: null,
    DailyCableLength: null,
    CableLength: "",
    CableCompletion: "",
    PricingItemIds: [],
    pricingItemsObjects: [],
  };

  const [formData, setFormData] = useState(initialFormState);

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
  const [showModal, setShowModal] = useState({
    success: false,
    error: false,
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (apiData) {
      const formattedData = {
        BranchId: apiData.branchId || "",
        WorkOrderType: apiData.workOrderType || "",
        Office: apiData.office || "",
        ReceiveDateTime: apiData.receiveDateTime
          ? apiData.receiveDateTime.split("T")[0]
          : "",
        FaultType: apiData.faultType || "",
        FaultNumber: apiData.faultNumber || "",
        Contractor: apiData.contractor || "",
        Engineer: apiData.engineer || "",
        Supervisor: apiData.supervisor || "",
        ProjectOwner: apiData.projectOwner || "",
        District: apiData.district || "",
        Consultant: apiData.consultant || "",
        OrderDate: apiData.orderDate
          ? apiData.orderDate.split("T")[0]
          : "",
        Note: apiData.note || "",
        OrderType: apiData.orderType || "",
        WorkDescription: apiData.workDescription || "",
        StationNumber: apiData.stationNumber || "",
        DurationOfImplementation:
          apiData.durationOfImplementation || "",
        TypeOfStomachTest: apiData.typeOfStomachTest || "",
        Situation: apiData.situation || "",
        NumberOfEquipment: apiData.numberOfEquipment || "",
        SafetyViolationsExist: apiData.safetyViolationsExist,
        EstimatedValue: apiData.estimatedValue || "",
        ActualValue: apiData.actualValue || "",
        ExtractNumber: apiData.extractNumber || "",
        DescriptionViolation: apiData.descriptionViolation || "",
        ImplementationPhase: apiData.implementationPhase || "",
        CompletionDate: apiData.completionDate || "",
        NumberOfDaysDelayed: apiData.numberOfDaysDelayed || "",
        NumberOfDaysRemaining: apiData.numberOfDaysRemaining || "",
        CompletionStatusReport: apiData.completionStatusReport || "",
        DailyExcavationLength: apiData.dailyExcavationLength || "",
        ExcavationLength: apiData.excavationLength || "",
        ProjectExcavationLength:
          apiData.projectExcavationLength || "",
        ProjectCableLength: apiData.projectCableLength || "",
        DailyCableLength: apiData.dailyCableLength || "",
        CableLength: apiData.cableLength || "",
        CableCompletion: apiData.cableCompletion || "",

        PricingItemIds:
          apiData.pricingItems?.map((i) => i.id) || [],

        pricingItemsObjects:
          apiData.pricingItems?.map((item) => ({
            pricingItemId: item.id,
            estimatedQuantity: item.estimatedQuantity ?? "",
            executedQuantity: item.executedQuantity ?? "",
            totalPrice: item.totalPrice ?? 0,
            executedWorksValue: item.executedWorksValue ?? 0,
            executionPercentage: item.executionPercentage ?? 0,
            id: item.id,
            itemNumber: item.itemNumber,
            shortDescription: item.shortDescription,
            uom: item.uom,
            unitPrice: item.unitPrice,
          })) || [],
      };

      setFormData(formattedData);

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

  const handleFileChange = (event, fileType) => {
    const uploadedFiles = Array.from(event.target.files);

    const newFiles = uploadedFiles.filter((file) => {
      if (file.type === "application/pdf") return true;
      return file.size <= 1 * 1024 * 1024 * 1024;
    });

    const rejectedFiles = uploadedFiles.filter((file) => {
      return (
        file.type !== "application/pdf" &&
        file.size > 1 * 1024 * 1024 * 1024
      );
    });

    if (rejectedFiles.length) {
      setErrorMessage(
        "بعض الملفات كانت كبيرة جدًا ولا يمكن رفعها."
      );
    } else {
      setErrorMessage("");
    }

    setFileData((prev) => ({
      ...prev,
      [fileType]: [...prev[fileType], ...newFiles],
    }));
  };

  const openFileSelector = (fileType) => {
    fileInputRefs[fileType].current.click();
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

    const isAdmin =
      userData?.userType?.toLowerCase() === "admin";

    if (isAdmin && formData.BranchId === "") {
      fieldErrors.push("الفرع");
    }

    if (formData.Office === "") fieldErrors.push("المكتب");
    if (formData.WorkOrderType === "")
      fieldErrors.push("نوع امر العمل");
    if (formData.DurationOfImplementation === "")
      fieldErrors.push("مدة التنفيذ");
    if (formData.Situation === "")
      fieldErrors.push("الحالة");
    if (formData.District === "")
      fieldErrors.push("الحي");
    if (formData.WorkDescription === "")
      fieldErrors.push("وصف المشروع");
    if (formData.FaultNumber === "")
      fieldErrors.push("رقم امر العمل");
    if (formData.Contractor === "")
      fieldErrors.push("المقاول");
    if (formData.SafetyViolationsExist === "")
      fieldErrors.push("هل اخطاء السلامه موجوده");

    if (fieldErrors.length > 0) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        html: `يرجى ملء الحقول التالية: <br> ${fieldErrors.join(
          ", "
        )}`,
      });
      return;
    }

    const submissionData = new FormData();

    const skipKeys = new Set([
      "PricingItemIds",
      "pricingItemsObjects",
      "CompletionDate",
      "ProjectExcavationLength",
      "ProjectCableLength",
      "EstimatedValue",
      "ActualValue",
    ]);

    Object.entries(formData).forEach(([key, value]) => {
      if (skipKeys.has(key)) return;

      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        value !== "null"
      ) {
        submissionData.append(key, value);
      }
    });

    formData.pricingItemsObjects?.forEach((dto, index) => {
      submissionData.append(
        `PricingItems[${index}].pricingItemId`,
        dto.pricingItemId
      );

      submissionData.append(
        `PricingItems[${index}].estimatedQuantity`,
        dto.estimatedQuantity ?? 0
      );

      submissionData.append(
        `PricingItems[${index}].totalPrice`,
        dto.totalPrice ?? 0
      );

      submissionData.append(
        `PricingItems[${index}].executedQuantity`,
        dto.executedQuantity ?? 0
      );

      submissionData.append(
        `PricingItems[${index}].executedWorksValue`,
        dto.executedWorksValue ?? 0
      );

      submissionData.append(
        `PricingItems[${index}].executionPercentage`,
        dto.executionPercentage ?? 0
      );
    });

    submissionData.append(
      "CompletionDate",
      formData.CompletionDate ||
        new Date().toISOString()
    );

    submissionData.append(
      "ProjectExcavationLength",
      0
    );

    submissionData.append(
      "ProjectCableLength",
      0
    );

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
          Authorization: `Bearer ${userData?.token}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) /
              progressEvent.total
          );

          setUploadProgress(percentCompleted);
        },
      });

      setSuccessMessage(
        apiData
          ? "تم تحديث الطلب بنجاح."
          : "تم إرسال الطلب بنجاح."
      );

      setShowModal({
        success: true,
        error: false,
      });
    } catch (error) {
      console.error(
        "Error submitting form:",
        error
      );

      const message =
        error.response?.data?.message ||
        "يرجى التاكد من البيانات";

      setErrorMessage(message);

      setShowModal({
        success: false,
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApiFileDelete = async (
    fileType,
    fileId
  ) => {
    const endpoint =
      `${Url}${ednpointMap.Construction[fileType]}` +
      `?photoId=${fileId}`;

    try {
      const response = await axios.delete(
        endpoint,
        {
          headers: {
            Authorization: `Bearer ${userData?.token}`,
          },
        }
      );

      if (response.status === 200) {
        setFileData((prev) => ({
          ...prev,
          [fileType]: prev[fileType].filter(
            (item) => item.id !== fileId
          ),
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
      console.error(
        "Error deleting file:",
        error
      );

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
    <ConstructionFormInput
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
      refreshPage={() => window.location.reload()}
      uploadProgress={uploadProgress}
      setLoading={setLoading}
      loading={loading}
      formData={formData}
      apiData={apiData}
      isUpdate={!!apiData}
      handleSubmit={handleSubmit}
      userData={userData}
      id={id}
      token={token}
      setFormData={setFormData}
    />
  );
};

export default Form;