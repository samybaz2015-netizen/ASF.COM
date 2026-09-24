import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import UploadIcon from "../../Image/UploadIcon.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { Modal, Button, ProgressBar } from "react-bootstrap";
import { domain, Url } from "../../function/FunctionApi";
import Swal from "sweetalert2";
import { useSearchParams } from "react-router-dom";
import SelectConsultant from "../../Component/SelectConsultant/SelectConusltant";
import SelectDistrict from "../../Component/SelectDistrict/SelectDistrict";

const createUrl = `${Url}NewProject/create-newProject`;
const updateUrl = `${Url}NewProject/update`;

const RadioGroup = ({ label, options, name, selectedValue, onChange }) => (
  <div className="violations">
    <h4>{label}</h4>
    <div className="radio-group">
      {options.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={
              selectedValue === (option.value === "exists" ? true : false)
            }
            onChange={onChange}
          />
          <span className="radio-circle" />
          {option.label}
        </label>
      ))}
    </div>
  </div>
);

const Form = ({ userData, apiData }) => {
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    WorkOrderType: "",
    FaultNumber: "",
    FaultType: "",
    District: "",
    Office: "",
    OrderDate: "",
    WorkDescription: "",
    StationNumber: "",
    DurationOfImplementation: "",

    ReceiveDateTime: "",
    Situation: "",
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
        Office: apiData.office || "",
        ReceiveDateTime: apiData.receiveDateTime.split("T")[0] || "",
        FaultType: apiData.faultType || "",
        FaultNumber: apiData.faultNumber || "",
        Contractor: apiData.contractor || "",
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
      });
      setFileData({
        ModelPhotos: apiData.modelPhotos || [],
        SitePhotos: apiData.sitePhotos || [],
        SafetyWastePhotos: apiData.safetyWastePhotos || [],
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
    if (formData.StationNumber === "") fieldErrors.push(" رقم المحطه");
    if (formData.District === "") fieldErrors.push("  الحي");
    if (formData.WorkDescription === "") fieldErrors.push(" وصف المشروع");
    if (formData.OrderDate === "") fieldErrors.push("تاريخ التنفيذ");
    if (formData.FaultNumber === "") fieldErrors.push("رقم امر العمل  ");
    if (formData.Contractor === "") fieldErrors.push(" المقاول");
    if (formData.WorkDescription === "") fieldErrors.push(" وصف المشروع");
    // if (formData.EstimatedValue === "") fieldErrors.push(" القيمه التقديريه ");
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
    const submissionData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submissionData.append(key, value);
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
    setFormData({
      WorkOrderType: "",
      WorkDescription: "",
      StationNumber: "",
      DurationOfImplementation: "",
      FaultNumber: "",
      OrderDate: "",

      FaultType: "",
      District: "",
      Office: "",

      OrderType: "",
      ReceiveDateTime: "",
      Situation: "",
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
          onChange={(e) => handleFileChange(e, fileType)} // Add files to the state
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
        {fileData[fileType]?.map((file, index) => (
          <div key={index} className="file-item">
            {file instanceof File ? (
              file.type === "application/pdf" ? (
                <embed
                  src={URL.createObjectURL(file)}
                  type="application/pdf"
                  width="100%"
                  height="500px"
                />
              ) : (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Uploaded file"
                  className="uploaded-image"
                />
              )
            ) : file.url?.endsWith(".pdf") ? (
              <embed
                src={
                  file.url.startsWith("http")
                    ? file.url
                    : `${domain}/${file.url}`
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
                    : `${domain}/${file.url}`
                }
                alt="Uploaded file"
                className="uploaded-image"
              />
            )}
            <button
              className="delete-button"
              onClick={
                () =>
                  file instanceof File
                    ? handleFileDelete(fileType, file) // Delete local file
                    : handleApiFileDelete(fileType, file.id) // Delete server file
              }
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
      ModelPhotos: "NewProject/model-photo",
      SitePhotos: "NewProject/site-photo",
      SafetyWastePhotos: "NewProject/safety-photo",
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
    <div className="form-container" dir="rtl">
      <div className="container">
        <div className="FormData">
          <div sx={{ textAlign: "center", marginBottom: "30px" }}>
            <h3>بيانات الطلب</h3>
            <p>Get a Quote Immediately Upon Form Submission</p>
          </div>

          <div className="input-group">
            {/* المكتب */}
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
            {/* نوع امر العمل */}
            <div className="groub_fe">
              <label>نوع امر العمل</label>
              <input
                type="text"
                name="WorkOrderType"
                placeholder="نوع امر العمل"
                value={formData.WorkOrderType || ""}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            {/* رقم امر العمل */}
            <div className="groub_fe">
              <label>رقم امر العمل</label>
              <input
                type="text"
                name="FaultNumber"
                placeholder="رقم امر العمل"
                value={formData.FaultNumber || ""}
                onChange={handleChange}
                required
              />
            </div>
            {/* الحي */}
            <SelectDistrict value={formData.District} onChange={handleChange} />
          </div>

          <div className="input-group">
            {/* اسم المقاول */}
            <div className="groub_fe">
              <label>اسم المقاول</label>
              <input
                type="text"
                name="Contractor"
                placeholder="اسم المقاول"
                value={formData.Contractor || ""}
                onChange={handleChange}
                required
              />
            </div>
            {/* رقم المحطة */}
            <div className="groub_fe">
              <label>رقم المحطة</label>
              <input
                type="text"
                name="StationNumber"
                placeholder="رقم المحطة"
                value={formData.StationNumber || ""}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            {/* وصف المشروع */}
            <div className="groub_fe">
              <label>وصف المشروع</label>
              <input
                type="text"
                name="WorkDescription"
                placeholder="وصف المشروع"
                value={formData.WorkDescription || ""}
                onChange={handleChange}
                required
              />
            </div>
            {/* تاريخ استلام امر الطلب */}
            <div className="groub_fe">
              <label>تاريخ استلام امر الطلب</label>
              <input
                type="date"
                name="ReceiveDateTime"
                placeholder="تاريخ استلام امر الطلب"
                value={formData.ReceiveDateTime || ""}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            {/* مدة التنفيذ */}
            <div className="groub_fe">
              <label>مدة التنفيذ</label>
              <input
                type="text"
                name="DurationOfImplementation"
                placeholder="مدة التنفيذ"
                value={formData.DurationOfImplementation || ""}
                onChange={handleChange}
                required
              />
            </div>
            {/* الاستشاري */}
            <SelectConsultant
              value={formData.Consultant}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            {/* تاريخ التنفيذ */}
            <div className="groub_fe">
              <label>تاريخ التنفيذ</label>
              <input
                type="date"
                name="OrderDate"
                placeholder="تاريخ التنفيذ"
                value={formData.OrderDate || ""}
                onChange={handleChange}
                required
              />
            </div>
            {/* القيمة التقديرية */}
            <div className="groub_fe">
              <label>القيمة التقديرية</label>
              <input
                type="text"
                name="EstimatedValue"
                placeholder="القيمة التقديرية"
                value={formData.EstimatedValue || ""}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            {/* القيمة الفعلية */}
            <div className="groub_fe">
              <label>القيمة الفعلية</label>
              <input
                type="text"
                name="ActualValue"
                placeholder="القيمة الفعلية"
                value={formData.ActualValue || ""}
                onChange={handleChange}
                required
              />
            </div>
            {/* رقم المستخلص */}
            <div className="groub_fe">
              <label>رقم المستخلص</label>
              <input
                type="text"
                name="ExtractNumber"
                placeholder="رقم المستخلص"
                value={formData.ExtractNumber || ""}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            {/* موقف التنفيذ */}
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

          {renderUploadSection(
            "المستندات ",
            "ModelPhotos",
            "تصوير مستندات مع الختم"
          )}
          {renderUploadSection("صور الموقع", "SitePhotos", "صور الموقع")}

          <RadioGroup
            label="مخالفات السلامة"
            options={[
              { label: "يوجد", value: "exists" },
              { label: "لا يوجد", value: "not-exists" },
            ]}
            name="SafetyViolationsExist"
            selectedValue={formData.SafetyViolationsExist}
            onChange={handleChange}
          />

          {formData.SafetyViolationsExist &&
            renderUploadSection(
              "صور مخالفات السلامة",
              "SafetyWastePhotos",
              "صور المخالفات"
            )}

          <div className="input-group">
            <textarea
              name="Note"
              placeholder="الملاحظات"
              value={formData.Note}
              onChange={handleChange}
            />
          </div>

          <div className="button-group">
            <button
              className={`submit-button px-4 py-2 rounded ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600"
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
              disabled={loading}
            >
              {loading ? "جاري التحميل..." : "تم التنفيذ"}
            </button>

            <button
              type="button"
              className={`submit-button px-4 py-2 rounded ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600"
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
              disabled={loading}
            >
              {loading ? "جاري التحميل..." : "تحت التنفيذ"}
            </button>
          </div>
        </div>
      </div>
      {/* Progress Modal */}
      <Modal show={loading} onHide={() => setLoading(false)}>
        <Modal.Header>
          <Modal.Title>جارٍ رفع البيانات</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>جاري رفع البيانات، الرجاء الانتظار...</p>
          <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
        </Modal.Body>
      </Modal>
      {/* Modals for Success and Error */}
      <Modal show={showModal.success} onHide={() => refreshPage()}>
        <Modal.Header closeButton>
          <Modal.Title>نجاح</Modal.Title>
        </Modal.Header>
        <Modal.Body>{successMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => refreshPage()}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={showModal.error}
        onHide={() => setShowModal({ error: false, success: false })}
      >
        <Modal.Header closeButton>
          <Modal.Title>خطأ</Modal.Title>
        </Modal.Header>
        <Modal.Body>{errorMessage}</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal({ error: false, success: false })}
          >
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Form;
