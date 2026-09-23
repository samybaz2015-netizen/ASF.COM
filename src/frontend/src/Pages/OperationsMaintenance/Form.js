import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { domain, Url } from "../../function/FunctionApi";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, ProgressBar } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import UploadIcon from "../../Image/UploadIcon.png";
import Swal from "sweetalert2";
import { useSearchParams } from "react-router-dom";
import SelectConsultant from "../../Component/SelectConsultant/SelectConusltant";
import SelectDistrict from "../../Component/SelectDistrict/SelectDistrict";

const createUrl = `${Url}OperationsAndMaintenaceRequest/create-operation`;
const updateUrl = `${Url}OperationsAndMaintenaceRequest/update`;

const Form = ({ userData, apiData }) => {
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    WorkOrderType: "",
    FaultNumber: "",
    FaultType: "",
    FaultDate: "",
    WorkDescription: "",
    OrderDate: " ",

    StationNumber: "",
    DurationOfImplementation: "",
    Office: "",
    ReceiveDateTime: "",
    Situation: "",
    District: "",
    Resources: "",
    Contractor: "",
    Consultant: "",
    Note: "",
    SafetyViolationsExist: "",
    EstimatedValue: "",
    ActualValue: "",
    ExtractNumber: "",
  });

  const [fileData, setFileData] = useState({
    ModelPhotos: [],
    SitePhotos: [],
    SafetyWastePhotos: [],
  });

  const fileInputRefs = {
    ModelPhotos: useRef(null),
    SitePhotos: useRef(null),
    SafetyWastePhotos: useRef(null),
  };

  const [errorMessage, setErrorMessage] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  const token = userData?.token;

  const projectTypeMapping = {
    طوارئ: 1,
    احلال: 2,
    التعزيز: 3,
    "الجهد المتوسط": 4,
  };

  const refreshPage = () => {
    setFormData({
      WorkOrderType: "",
      FaultNumber: "",
      FaultType: "",
      OrderType: "",
      Office: "",
      FaultDate: "",
      WorkDescription: "",
      StationNumber: "",
      OrderDate: "",
      DurationOfImplementation: "",
      ReceiveDateTime: "",
      Situation: "",
      District: "",
      Resources: "",
      Contractor: "",
      Consultant: "",
      Note: "",
      SafetyViolationsExist: "",
      EstimatedValue: "",
      ActualValue: "",
      ExtractNumber: "",
    });
    setFileData({
      ModelPhotos: [],
      SitePhotos: [],
      SafetyWastePhotos: [],
    });
    window.location.reload();
  };
  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "ProjectType") {
      setFormData((prev) => ({
        ...prev,
        ProjectType: projectTypeMapping[value],
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    if (apiData) {
      setFormData({
        WorkOrderType: apiData.workOrderType || "",
        FaultNumber: apiData.faultNumber || "",
        FaultType: apiData.faultType || "",
        FaultDate: apiData.faultDate.split("T")[0] || "",
        OrderDate: apiData?.orderDate?.split("T")[0] || "",
        Contractor: apiData.contractor || "",
        District: apiData.district || "",
        Resources: apiData.resources || "",
        Station: apiData.station || "",
        Consultant: apiData.consultant || "",
        FaultDate: apiData.faultDate.split("T")[0] || "",
        OrderType: apiData.orderType,
        Situation: apiData.situation || "",
        Office: apiData.office || "",
        WorkDescription: apiData.workDescription || "",
        StationNumber: apiData.stationNumber || "",
        DurationOfImplementation: apiData.durationOfImplementation,
        ReceiveDateTime: apiData.receiveDateTime.split("T")[0] || "",
        Note: apiData.note || "",
        SafetyViolationsExist: apiData.safetyViolationsExist
          ? "exists"
          : "not-exists",
        EstimatedValue: apiData.estimatedValue,
        ActualValue: apiData.actualValue,
        ExtractNumber: apiData.extractNumber,
      });
      setFileData({
        ModelPhotos: apiData.modelPhotos || [],
        SitePhotos: apiData.sitePhotos || [],
        SafetyWastePhotos: apiData.safetyWastePhotos || [],
      });
    }
  }, [apiData]);

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

  const handleFileDelete = (fileType, fileName) => {
    setFileData((prev) => ({
      ...prev,
      [fileType]: prev[fileType].filter((file) => file.name !== fileName),
    }));
  };

  const openFileSelector = (fileType) => {
    fileInputRefs[fileType].current.click();
  };

  const handleApiFileDelete = async (fileType, fileId) => {
    const endpointMap = {
      ModelPhotos: "OperationsAndMaintenaceRequest/model-photo",
      SitePhotos: "OperationsAndMaintenaceRequest/site-photo",
      SafetyWastePhotos: "OperationsAndMaintenaceRequest/safety-photo",
    };

    const endpoint = `${Url}${endpointMap[fileType]}?photoId=${fileId}`;

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
      console.error("Error deleting file", error);
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

  const handleSubmit = async (isArchive) => {
    let fieldErrors = [];
    if (formData.Office === "") fieldErrors.push("المكتب");
    if (formData.FaultDate === "") fieldErrors.push("تاريخ العطل ");
    if (formData.FaultType === "") fieldErrors.push("نوع العطل ");
    if (formData.FaultNumber === "") fieldErrors.push("رقم العطل ");
    // if (formData.WorkOrderType === "") fieldErrors.push("نوع  امر العمل");
    if (formData.DurationOfImplementation === "")
      fieldErrors.push("مدة التنفيذ");

    // if (formData.Situation === "") fieldErrors.push("الحالة");
    if (formData.ReceiveDateTime === "")
      fieldErrors.push(" تاريخ استلام امر العمل");
    if (formData.ExtractNumber === "") fieldErrors.push("رقم  المستخلص");
    // // if (   formData.ActualValue === "") fieldErrors.push("القيمة الفعلية");
    if (formData.StationNumber === "") fieldErrors.push(" رقم المحطه");
    if (formData.District === "") fieldErrors.push("  الحي");
    if (formData.WorkDescription === "") fieldErrors.push(" وصف المشروع");
    if (formData.OrderDate === "") fieldErrors.push("تاريخ التنفيذ");
    if (formData.WorkOrderType === "") fieldErrors.push("رقم امر العمل  ");
    if (formData.WorkDescription === "") fieldErrors.push(" وصف المشروع");
    // if (formData.EstimatedValue === "") fieldErrors.push(" القيمه التقديريه ");
    if (formData.Contractor === "") fieldErrors.push(" المقاول");
    if (formData.SafetyViolationsExist === "")
      fieldErrors.push("هل اخطاء السلامه موجوده ");
    if (fileData.ModelPhotos.length === 0) fieldErrors.push("المتسندات ");

    if (fieldErrors.length > 0) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        html: `يرجى ملء الحقول التالية: <br> ${fieldErrors.join(", ")}`,
      });
      return;
    }
    fieldErrors = [];
    setLoadingSave(true);
    setUploadProgress(0);

    const submissionData = new FormData();
    const changedData = {};

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "SafetyViolationsExist") {
        const mappedValue =
          value === "exists" ? true : value === "not-exists" ? false : value;

        if (!apiData || mappedValue !== apiData[key]) {
          changedData[key] = mappedValue;
          submissionData.append(key, mappedValue);
        }
      } else {
        if (!apiData || value !== apiData[key]) {
          changedData[key] = value;
          submissionData.append(key, value);
        }
      }
    });

    console.log(submissionData);
    Object.entries(fileData).forEach(([key, files]) => {
      files.forEach((file) => {
        submissionData.append(key, file);
      });
    });
    submissionData.append("isArchive", isArchive);
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          const percent = Math.floor((loaded * 100) / total);
          setUploadProgress(percent);
        },
      };
      if (apiData) {
        submissionData.append("OrderNumber", apiData.faultNumber);
        await axios.put(updateUrl, submissionData, config);
      } else {
        await axios.post(createUrl, submissionData, config);
      }
      if (apiData) {
        setSuccessMessage("تم تحديث الطلب بنجاح.");
      } else {
        setSuccessMessage("تم إرسال الطلب بنجاح.");
      }
      setShowSuccessModal(true);
    } catch (error) {
      console.log(error.response.data.errors);

      let errorMessage =
        error.response?.data?.message || "يرجي  التاكد من البيانات";

      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(", ");
        errorMessage = errorMessages || errorMessage;
      } else if (error?.response?.data?.data) {
        // Use the data field if present
        errorMessage = error.response.data.data;
      }

      setErrorMessage(errorMessage);

      setShowErrorModal(true);
    } finally {
      setLoadingSave(false);
    }
  };

  const renderUploadSection = (
    label,
    fileType,
    buttonLabel,
    multiple = true
  ) => (
    <div className="upload-section">
      <h4>{label}</h4>
      <div className="upload-box">
        <span className="upload-icon">
          <img src={UploadIcon} alt="Upload" />
        </span>
        <p>{buttonLabel}</p>
        <input
          type="file"
          onChange={(e) => handleFileChange(e, fileType)} // Ensure file is added correctly to state
          multiple={multiple}
          ref={fileInputRefs[fileType]}
          style={{ display: "none" }}
          accept=".jpg,.jpeg,.png,.pdf"
        />
        <div className="button-group">
          <button
            type="button"
            className="upload-button"
            onClick={() => openFileSelector(fileType)}
          >
            رفع ملف
          </button>
        </div>
      </div>
      <div className="file-list">
        {!apiData &&
          fileData[fileType].map((file, index) => (
            <div key={index} className="file-item">
              {file instanceof File ? (
                file.type === "application/pdf" ? (
                  <embed
                    src={URL.createObjectURL(file)} // Create an object URL for local files
                    type="application/pdf"
                    width="100%"
                    height="500px"
                  />
                ) : (
                  <img
                    src={URL.createObjectURL(file)} // Create an object URL for images
                    alt="Uploaded file"
                    className="uploaded-image"
                  />
                )
              ) : (
                <div>
                  {file.url && file.url.endsWith(".pdf") ? (
                    <embed
                      src={
                        file.url.startsWith("http")
                          ? file.url
                          : `https://www.rasmconsult.com/${file.url}`
                      }
                      type="application/pdf"
                      width="100%"
                      height="500px"
                    />
                  ) : (
                    <img
                      src={
                        file.url.startsWith("http")
                          ? file.url
                          : `https://www.rasmconsult.com/${file.url}`
                      }
                      alt="Uploaded file"
                      className="uploaded-image"
                    />
                  )}
                </div>
              )}
              <button
                className="delete-button"
                onClick={() => handleFileDelete(fileType, file.name)}
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            </div>
          ))}
        {apiData &&
          fileData[fileType]?.map((item, index) => (
            <div key={index} className="file-item">
              {item.url &&
                (item.url.endsWith(".pdf") ? (
                  <embed
                    src={
                      item.url.startsWith("http")
                        ? item.url
                        : `${domain}/${item.url}`
                    }
                    type="application/pdf"
                    width="100%"
                    height="500px"
                  />
                ) : (
                  <img
                    src={
                      item.url.startsWith("http")
                        ? item.url
                        : `https://www.rasmconsult.com/${item.url}`
                    }
                    className="uploaded-image"
                    alt="uploaded-image"
                  />
                ))}
              <button
                className="delete-button"
                onClick={() => handleApiFileDelete(fileType, item.id)}
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="form-container" dir="rtl">
      <div className="radio-container">
        {/* <div className="container">
          <h2>قم بتحديد نوع المشروع</h2>
          <div className="radio-group">
            {Object.keys(projectTypeMapping).map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  name="ProjectType"
                  value={type}
                  checked={formData.ProjectType === projectTypeMapping[type]}
                  onChange={handleChange}
                />
                <span className="radio-circle" />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </div> */}
      </div>

      <div className="FormData">
        <div className="container">
          <h3>بيانات الطلب</h3>
          <p>Get a Quote Immediately Upon Form Submission</p>

          <div className="input-group">
            <div className="groub_fe">
              <label>المكتب</label>
              <select
                id="Office"
                name="Office"
                className="selectSituation"
                onChange={handleChange}
                value={formData.Office}
              >
                <option value="" disabled>
                  اختر المكتب
                </option>
                {localStorage.getItem("IsRiyadh") === "true" ? (
                  <>
                    <option value="Khurais">خريص</option>
                    <option value="North">الشمال</option>
                    <option value="East">الشرق</option>
                    <option value="South">الجنوب</option>
                    <option value="Diriyah">الدرعية</option>
                  </>
                ) : (
                  <>
                    <option value="Hail">الحائل</option>
                    <option value="Baqaa">بقعاء</option>
                    <option value="Al Ghazalah">الغزاله</option>
                    <option value="Al Hulayfah">الحليفه</option>
                    <option value="Moqaq">موقق</option>
                    <option value="Al Shumli">الشملي</option>
                    <option value="Al Shanan">الشنان</option>
                    <option value="Al Qaed">القاعد</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <div className="input-group">
            <div className="groub_fe">
              <label> رقم العطل</label>
              <input
                type="text"
                name="FaultNumber"
                placeholder="نوع العطل"
                value={formData.FaultNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="groub_fe">
              <label> تاريخ العطل</label>
              <input
                type="date"
                name="FaultDate"
                placeholder="تاريخ العطل"
                value={formData.FaultDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="input-group">
            <div className="groub_fe">
              <label> نوع العطل</label>
              <input
                type="text"
                name="FaultType"
                placeholder="نوع العطل"
                value={formData.FaultType}
                onChange={handleChange}
                required
              />
            </div>
            <div className="groub_fe">
              <label> رقم امر العمل</label>
              <input
                type="text"
                name="WorkOrderType"
                placeholder="رقم امر العمل"
                value={formData.WorkOrderType}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="input-group">
            <div className="groub_fe">
              <label> رقم المحطه</label>
              <input
                type="text"
                name="StationNumber"
                placeholder="رقم المحطه"
                value={formData.StationNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="groub_fe">
              <label> مده التنفيذ</label>
              <input
                type="text"
                name="DurationOfImplementation"
                value={formData.DurationOfImplementation}
                onChange={handleChange}
                placeholder="مده التنفيذ"
              />
            </div>
          </div>
          <div className="input-group">
            <SelectDistrict value={formData.District} onChange={handleChange} />
            <div className="groub_fe">
              <label>وصف العمل</label>
              <input
                type="text"
                name="WorkDescription"
                placeholder="وصف العمل"
                value={formData.WorkDescription}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="input-group">
            <div className="groub_fe">
              <label> المقاول</label>
              <input
                type="text"
                name="Contractor"
                placeholder="المقاول"
                value={formData.Contractor}
                onChange={handleChange}
                required
              />
            </div>
            <SelectConsultant
              value={formData.Consultant}
              onChange={handleChange}
            />
          </div>
          <div className="input-group">
            <div className="groub_fe">
              <label>رقم المستخلص</label>
              <input
                type="text"
                name="ExtractNumber"
                placeholder="رقم المستخلص"
                value={formData.ExtractNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="groub_fe">
              <label> تاريخ التنفيذ</label>
              <input
                type="date"
                name="OrderDate"
                placeholder="تاريخ التنفيذ"
                value={formData.OrderDate || ""}
                onChange={handleChange}
                required
              />
            </div>

            {/* <div className="groub_fe">
              <label> مده التنفيذ</label>
              <input
                datepicker
                key={"executeTime"}
                name={"executeTime"}
                value={formData["executeTime"]}
                type="text"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="مده التنفيذ"
              />
            </div> */}
          </div>
          <div className="input-group">
            <div className="groub_fe">
              <label> تاريح استلام امر الطلب</label>
              <input
                key={"ReceiveDateTime"}
                type="date"
                name={"ReceiveDateTime"}
                placeholder={"تاريخ استلام امر الطلب"}
                value={formData["ReceiveDateTime"]}
                onChange={handleChange}
                required
              />
            </div>
            <div className="groub_fe">
              <label>موقف التنفيذ</label>
              <select
                id="Situation"
                name="Situation"
                className="selectSituation"
                onChange={handleChange}
                value={formData.Situation}
              >
                <option value="" disabled>
                  اختر الحالة
                </option>
                <option value="pending">جاري</option>
                <option value="finish">منتهي</option>
                <option value="notFinished">لم يتم التنفيذ</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <div className="groub_fe">
              <label>القيمه المقدرة</label>
              <input
                type="text"
                name="EstimatedValue"
                placeholder="القيمة المقدرة"
                value={formData.EstimatedValue}
                onChange={handleChange}
                required
              />
            </div>

            <div className="groub_fe">
              <label>القيمه الفعلية</label>
              <input
                type="text"
                name="ActualValue"
                placeholder="القيمة الفعلية"
                value={formData.ActualValue}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {renderUploadSection(
            "المستندات",
            "ModelPhotos",
            "تصوير مستندات مع الختم"
          )}
          {renderUploadSection("صور الموقع", "SitePhotos", "صور الموقع")}

          <div className="violations">
            <h4>مخالفات السلامة</h4>
            <div className="radio-group">
              {["exists", "not-exists"].map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="SafetyViolationsExist"
                    value={value}
                    checked={formData.SafetyViolationsExist === value}
                    onChange={handleChange}
                  />
                  <span className="radio-circle" />
                  {value === "exists" ? "يوجد" : "لا يوجد"}
                </label>
              ))}
            </div>
          </div>

          {formData.SafetyViolationsExist === "exists" &&
            renderUploadSection(
              "صور مخالفات السلامة",
              "SafetyWastePhotos",
              "صور المخالفات"
            )}

          <textarea
            name="Note"
            placeholder="ملاحظات"
            value={formData.Note}
            onChange={handleChange}
            rows="4"
          ></textarea>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button
              className={`submit-button px-4 py-2 rounded ${
                loadingSave ? "bg-gray-400 cursor-not-allowed" : "bg-green-600"
              } text-white`}
              onClick={() => {
                if (formData.Situation === "finish") {
                  handleSubmit(false); // Continue process
                } else {
                  Swal.fire({
                    icon: "error",
                    title: "خطأ",
                    text: "  عذرا الطلب تحت التنفيذ  ",
                  });
                }
              }}
              disabled={loadingSave}
            >
              {loadingSave ? "جاري التحميل..." : "تم التنفيذ"}
            </button>

            <button
              type="button"
              className={`submit-button px-4 py-2 rounded ${
                loadingSave ? "bg-gray-400 cursor-not-allowed" : "bg-green-600"
              } text-white`}
              style={{ background: "rgba(244, 67, 54, 1)", color: "white" }}
              onClick={() => {
                if (formData.Situation !== "finish") {
                  handleSubmit(true);
                } else {
                  Swal.fire({
                    icon: "error",
                    title: "خطأ",
                    text: "عذرا الطلب منتهي",
                  });
                }
              }}
              disabled={loadingSave}
            >
              {loadingSave ? "جاري التحميل..." : "تحت التنفيذ"}
            </button>
          </div>
        </div>
      </div>

      <Modal show={loadingSave} onHide={() => setLoadingSave(false)}>
        <Modal.Header>
          <Modal.Title>جارٍ رفع البيانات</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>جاري رفع البيانات، الرجاء الانتظار...</p>
          <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
        </Modal.Body>
      </Modal>
      {/* Success Modal */}
      <Modal show={showSuccessModal} onHide={() => refreshPage()}>
        <Modal.Header closeButton>
          <Modal.Title>نجاح</Modal.Title>
        </Modal.Header>
        <Modal.Body>{successMessage}</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              refreshPage();
            }}
          >
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Error Modal */}
      <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>خطأ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{errorMessage}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowErrorModal(false);
            }}
          >
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Form;
