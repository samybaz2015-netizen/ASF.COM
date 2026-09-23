import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./Form.css";
import UploadIcon from "../../../Image/UploadIcon.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { Url } from "../../../function/FunctionApi";
import { Modal, Button, ProgressBar } from "react-bootstrap";
import Swal from "sweetalert2";

const createUrl = `${Url}OrderForSubscribe/create-order-subscribe`;
const updateUrl = `${Url}OrderForSubscribe/update`;

const Form = ({ userData, apiData }) => {
  const [formData, setFormData] = useState({
    ProjectType: "",
    orderType: "",
    OrderNumber: "",
    Contractor: "",
    District: "",
    executeTime: "",
    receiveDateTime: "", 
    station: "",
    Station: "",
    Consultant: userData.displayName,
    Note: "",
    safetyViolation: "",
    EstimatedValue: "",
    ActualValue: "",
    ExtractNumber: "",
  });

  const [fileData, setFileData] = useState({
    ModelPhotos: [],
    SitePhotos: [],
    SafetyWastePhotos: [],
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const fileInputRefs = {
    ModelPhotos: useRef(null),
    SitePhotos: useRef(null),
    SafetyWastePhotos: useRef(null),
  };
  const [errorMessage, setErrorMessage] = useState("");
  const token = userData?.token;
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event, fileType) => {
    const uploadedFiles = Array.from(event.target.files);
    const newFiles = uploadedFiles.filter((file) => {
      if (file.type === "application/pdf") return true;
      return file.size <= 1 * 1024 * 1024 * 1024;
    });
    const rejectedFiles = uploadedFiles.filter((file) => {
      return (
        file.type !== "application/pdf" && file.size > 1 * 1024 * 1024 * 1024
      );
    });

    setErrorMessage(
      rejectedFiles.length ? "بعض الملفات كانت كبيرة جدًا ولا يمكن رفعها." : ""
    );

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

  const handleSubmit = async (isArchive) => {
    const submissionData = new FormData();

    submissionData.append("OrderNumber", formData.OrderNumber);

    if (apiData) {
      if (formData.ProjectType !== apiData.projectType) {
        submissionData.append("ProjectType", formData.ProjectType);
      }
      if (formData.Contractor !== apiData.contractor) {
        submissionData.append("Contractor", formData.Contractor);
      }
      if (formData.District !== apiData.district) {
        submissionData.append("District", formData.District);
      }
      if (formData.Station !== apiData.station) {
        submissionData.append("Station", formData.Station);
      }
      if (formData.Consultant !== apiData.consultant) {
        submissionData.append("Consultant", formData.Consultant);
      }
      if (formData.Note !== apiData.note) {
        submissionData.append("Note", formData.Note);
      }
      if (formData.safetyViolation !== apiData.isExist) {
        submissionData.append("safetyViolation", formData.safetyViolation);
      }
      if (formData.EstimatedValue !== apiData.EstimatedValue) {
        submissionData.append("EstimatedValue", formData.EstimatedValue);
      }
      if (formData.ActualValue !== apiData.ActualValue) {
        submissionData.append("ActualValue", formData.ActualValue);
      }
      if (formData.ExtractNumber !== apiData.ExtractNumber) {
        submissionData.append("ExtractNumber", formData.ExtractNumber);
      }
    } else {
      submissionData.append("ProjectType", formData.ProjectType);
      submissionData.append("Contractor", formData.Contractor);
      submissionData.append("District", formData.District);
      submissionData.append("Station", formData.Station);
      submissionData.append("Consultant", formData.Consultant);
      submissionData.append("Note", formData.Note);
      submissionData.append("safetyViolation", formData.safetyViolation);
      submissionData.append("EstimatedValue", formData.EstimatedValue);
      submissionData.append("ActualValue", formData.ActualValue);
      submissionData.append("ExtractNumber", formData.ExtractNumber);
    }

    Object.entries(fileData).forEach(([key, files]) => {
      files.forEach((file) => {
        submissionData.append(key, file);
      });
    });

    submissionData.append("isArchive", isArchive);

    if (isArchive) {
      setLoadingArchive(true);
    } else {
      setLoadingSubmit(true);
    }

    setShowProgressModal(true);
    try {
      const response = apiData
        ? await axios.put(updateUrl, submissionData, {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);

              if (progress === 100) {
                setTimeout(() => {
                  setShowProgressModal(false);
                  // If the upload is complete, hide the progress bar
                  // and reset the upload progress state after 1 second
                  setUploadProgress(0);
                }, 1000);
              }
            },
          })
        : await axios.post(createUrl, submissionData, {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);

              if (progress === 100) {
                setTimeout(() => {
                  setShowProgressModal(false);
                  setUploadProgress(0);
                }, 1000);
              }
            },
          });
      if (apiData) {
        setSuccessMessage("تم تحديث الطلب بنجاح.");
      } else {
        setSuccessMessage("تم إرسال الطلب بنجاح.");
      }
      setShowSuccessModal(true);
    } catch (error) {
      let errorMessage =
        error?.response?.data?.data ||
        "فشل إرسال النموذج. يرجى المحاولة مرة أخرى.";
      setErrorMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setLoadingSubmit(false);
      setLoadingArchive(false);
      setShowProgressModal(false);
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
          onChange={(e) => handleFileChange(e, fileType)}
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
                  <a
                    href={URL.createObjectURL(file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-link"
                  >
                    {file.name}
                  </a>
                ) : (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Uploaded file"
                    className="uploaded-image"
                  />
                )
              ) : null}
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
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-link"
                  >
                    {item.url.split("/").pop() || "ملف"}
                  </a>
                ) : (
                  <img
                    src={item.url}
                    className="uploaded-image"
                    alt="uploaded-image"
                  />
                ))}
              {item instanceof File ? (
                item.type === "application/pdf" ? (
                  <a
                    href={URL.createObjectURL(item)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-link"
                  >
                    {item.name}
                  </a>
                ) : (
                  <img
                    src={URL.createObjectURL(item)}
                    alt="Uploaded file"
                    className="uploaded-image"
                  />
                )
              ) : null}
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

  const handleApiFileDelete = async (fileType, fileId) => {
    const endpointMap = {
      ModelPhotos: "OrderForSubscribe/model-photo",
      SitePhotos: "OrderForSubscribe/site-photo",
      SafetyWastePhotos: "OrderForSubscribe/safety-photo",
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
          title: "تم حذف الطلب بنجاح.",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    } catch (error) {
      Swal.fire({
        position: "center",
        icon: "error",
        text: "يرجى المحاولة مرة أخرى.",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };

  useEffect(() => {
    if (apiData) {
      setFormData({
        ProjectType: apiData.projectType == 2 ? "2" : "1",
        OrderNumber: apiData.orderNumber || "",
        Contractor: apiData.contractor || "",
        District: apiData.district || "",
        Station: apiData.station || "",
        Consultant: apiData.consultant || "",
        Note: apiData.note || "",
        safetyViolation:
          apiData.safetyWastePhotos.length > 0 ? "exists" : "not-exists",
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

  return (
    <div className="form-container" dir="rtl">
      <div className="radio-container">
        <div className="container">
          <h2>قم بتحديد نوع المشروع</h2>
          <div className="radio-group">
            {["1", "2"].map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  name="ProjectType"
                  value={type}
                  checked={formData.ProjectType === type}
                  onChange={handleChange}
                />
                <span className="radio-circle" />
                <span>{type === "1" ? "تنفيذ شبكة" : "عداد"}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="FormData">
        <div className="container">
          <dir className="mb-3">
            <h3>بيانات الطلب</h3>
            <p>Get a Quote Immediately Upon Form Submission</p>
          </dir>
          <div className="input-group">
            {["OrderNumber", "Contractor"].map((field) => (
              <div className="groub_fe" key={field}>
                <label>
                  {field === "OrderNumber" ? "رقم الطلب" : "المقاول"}
                </label>
                <input
                  key={field}
                  type="text"
                  name={field}
                  placeholder={
                    field === "OrderNumber" ? "رقم الطلب" : "المقاول"
                  }
                  value={formData[field]}
                  onChange={handleChange}
                  required
                  readOnly={field === "OrderNumber" && !!apiData}
                />
              </div>
            ))}
          </div>
          <div className="input-group">
            {["District", "Station"].map((field) => (
              <div className="groub_fe">
                <label>{field === "District" ? "الحي" : "المحطة"}</label>
                <input
                  key={field}
                  type="text"
                  name={field}
                  placeholder={field === "District" ? "الحي" : "المحطة"}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </div>
          <div className="input-group">
            {["EstimatedValue", "ActualValue"].map((field) => (
              <div className="groub_fe">
                <label>
                  {field === "EstimatedValue"
                    ? "القيمة المقدرة"
                    : "القيمة الفعلية"}
                </label>
                <input
                  key={field}
                  type="text"
                  name={field}
                  placeholder={
                    field === "EstimatedValue"
                      ? "القيمة المقدرة"
                      : "القيمة الفعلية"
                  }
                  value={formData[field]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </div>
          <div className="input-group">
            <div className="groub_fe">
              <label>نوع الطلب </label>
              <input
                key={"orderType"}
                type="text"
                name={"orderType"}
                placeholder={"نوع الطلب"}
                value={formData["orderType"]}
                onChange={handleChange}
                required
              />
            </div>
            <div className="groub_fe">
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
            </div>
          </div>
          <div className="input-group">
            <div className="groub_fe">
              <label> تاريح استلام امر الطلب</label>
              <input
                key={"receiveDateTime"}
                type="date"
                name={"receiveDateTime"}
                placeholder={"تاريخ استلام امر الطلب"}
                value={formData["receiveDateTime"]}
                onChange={handleChange}
                required
              />
            </div>
            <div className="groub_fe">
              <label>موقف التنفيذ</label>
              <select id="situation" 
              name="situation" 
      className="selectSituation"
              onChange={handleChange}
              value={formData.c}
              > 
                
                <option checked value="finish">
                  {" "}
                  منتهي
                </option>
                <option value="pending">جاري</option>
                <option value="notFinished">لم يتم التنفيذ</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <div className="groub_fe">
              <label>الاستشاري</label>
              <input
                type="text"
                name="Consultant"
                placeholder="الاستشاري"
                value={formData.Consultant}
                onChange={handleChange}
                required
              />
            </div>
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
          </div>

          {renderUploadSection(
            "النموزج",
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
                    name="safetyViolation"
                    value={value}
                    checked={formData.safetyViolation === value}
                    onChange={handleChange}
                  />
                  <span className="radio-circle" />
                  {value === "exists" ? "يوجد" : "لا يوجد"}
                </label>
              ))}
            </div>
          </div>

          {formData.safetyViolation === "exists" &&
            renderUploadSection(
              "صور مخالفات السلامة",
              "SafetyWastePhotos",
              "صور المخالفات"
            )}

          <div className="input-group">
            <textarea
              name="Note"
              placeholder="ملاحظات"
              value={formData.Note}
              onChange={handleChange}
            />
          </div>
          <div className="button-group">
            <button
              type="button"
              className="submit-button"
              style={{ background: "rgba(76, 175, 79, 1)", color: "white" }}
              onClick={() => handleSubmit(false)}
              disabled={loadingSubmit || loadingArchive}
            >
              {loadingSubmit ? "جاري التحميل..." : "إرسال"}
            </button>
            <button
              type="button"
              className="submit-button"
              style={{ background: "rgba(244, 67, 54, 1)", color: "white" }}
              onClick={() => handleSubmit(true)}
              disabled={loadingArchive || loadingSubmit}
            >
              {loadingArchive ? "جاري التحميل..." : "إرسال مع الأرشفة"}
            </button>
          </div>
        </div>
      </div>

      <Modal show={showProgressModal}>
        <Modal.Header>
          <Modal.Title>جارٍ رفع البيانات</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>جاري رفع البيانات، الرجاء الانتظار...</p>
          <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
        </Modal.Body>
      </Modal>
      {/* Success Modal */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>نجاح</Modal.Title>
        </Modal.Header>
        <Modal.Body>{successMessage}</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowSuccessModal(false)}
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
        <Modal.Body>{errorMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowErrorModal(false)}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Form;
