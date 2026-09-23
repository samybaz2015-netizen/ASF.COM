import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faEye, faEyeSlash, faSpinner } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { Url } from "../../function/FunctionApi";
import BranchSelect from "../../Component/SelectBranch/SelectBranch";
import Swal from "sweetalert2";
import { authHeaders } from "../Accounts/AccountsConstants";

// ── user type maps ────────────────────────────────────────────────────────────
const TYPE_TO_API = {
  "مسؤول":     "admin",
  "مشرف":      "supervisor",
  "مهندس":     "eng",
  "مدير مكتب": "officeManager",
  "Contractor": "contractor",
};

const API_TO_LABEL = {
  admin:         "مسؤول",
  supervisor:    "مشرف",
  eng:           "مهندس",
  officemanager: "مدير مكتب",
  officeManager: "مدير مكتب",
  contractor:    "Contractor",
};

// ── shared input style ────────────────────────────────────────────────────────
const inputStyle = (hasError) => ({
  width: "100%",
  padding: "0.65rem 1rem",
  borderRadius: "8px",
  border: `1.5px solid ${hasError ? "#EF4444" : "rgba(42,56,91,0.15)"}`,
  fontFamily: "'Cairo', sans-serif",
  fontSize: "0.9rem",
  color: "#2A385B",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
  transition: "border-color 0.2s",
});

const labelStyle = {
  display: "block",
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "#2A385B",
  marginBottom: "0.4rem",
};

const errorStyle = {
  color: "#EF4444",
  fontSize: "0.78rem",
  marginTop: "0.25rem",
};

// ══════════════════════════════════════════════════════════════════════════════
export default function AddAccount({ accountData }) {
  const isEdit = !!accountData;

  const [formData, setFormData] = useState({
    image:       null,
    name:        "",
    email:       "",
    branch:      "",
    phone:       "",
    userType:    "",
    password:    "",
    displayName: "",
    officeId:    "",
  });

  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [offices,      setOffices]      = useState([]);
  const [filteredOffices, setFilteredOffices] = useState([]);

  // ── populate form on edit ─────────────────────────────────────────────────
  useEffect(() => {
    if (accountData) {
      setFormData({
        image:       accountData.userImage || null,
        name:        accountData.userName  || "",
        email:       accountData.email     || "",
        branch:      accountData.branchId  || "",
        phone:       accountData.phoneNumber || "",
        userType:    API_TO_LABEL[accountData.userType?.toLowerCase()] || "",
        password:    "",
        displayName: accountData.displayName || "",
        officeId:    accountData.officeId    || "",
      });
      setImagePreview(
        accountData.userImage
          ? `${Url.replace("/api/", "")}${accountData.userImage}`
          : null
      );
    } else {
      resetForm();
    }
  }, [accountData]);

  // ── fetch offices ─────────────────────────────────────────────────────────
  useEffect(() => { fetchOffices(); }, []);

  useEffect(() => {
    if (formData.branch) {
      const filtered = offices.filter(
        (o) => o.branchId === parseInt(formData.branch)
      );
      setFilteredOffices(filtered);
      if (!filtered.some((o) => o.id === parseInt(formData.officeId))) {
        setFormData((prev) => ({ ...prev, officeId: "" }));
      }
    } else {
      setFilteredOffices([]);
      setFormData((prev) => ({ ...prev, officeId: "" }));
    }
  }, [formData.branch, offices]);

  const fetchOffices = async () => {
    try {
      const res = await axios.get(`${Url}Office`);
      if (res.data.statusCode === 200) setOffices(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  // ── validation ────────────────────────────────────────────────────────────
  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim())        errs.name        = "الاسم مطلوب";
    if (!formData.displayName.trim()) errs.displayName = "اسم العرض مطلوب";
    if (!formData.email.trim())       errs.email       = "البريد الإلكتروني مطلوب";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
                                      errs.email       = "البريد الإلكتروني غير صالح";
    if (!formData.branch)             errs.branch      = "الفرع مطلوب";
    if (!formData.userType)           errs.userType    = "نوع المستخدم مطلوب";
    if (!isEdit && !formData.password)
                                      errs.password    = "كلمة المرور مطلوبة";
    else if (formData.password && formData.password.length < 6)
                                      errs.password    = "كلمة المرور 6 أحرف على الأقل";
    if (formData.userType === "مدير مكتب" && !formData.officeId)
                                      errs.officeId    = "الرجاء اختيار المكتب";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "userType" && value !== "مدير مكتب" ? { officeId: "" } : {}),
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return Swal.fire({ title: "خطأ", text: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت", icon: "error", confirmButtonText: "حسناً" });
    }
    if (!file.type.startsWith("image/")) {
      return Swal.fire({ title: "خطأ", text: "الملف يجب أن يكون صورة", icon: "error", confirmButtonText: "حسناً" });
    }
    setFormData((prev) => ({ ...prev, image: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setFormData({ image: null, name: "", email: "", branch: "", phone: "", userType: "", password: "", displayName: "", officeId: "" });
    setImagePreview(null);
    setErrors({});
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSaveAccount = async () => {
    if (!validateForm()) {
      return Swal.fire({ title: "خطأ", text: "الرجاء تصحيح الأخطاء في النموذج", icon: "error", confirmButtonText: "حسناً" });
    }
    if (isSubmitting) return;

    const confirmed = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: isEdit ? "سيتم تحديث بيانات الحساب" : "سيتم إنشاء حساب جديد",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: isEdit ? "نعم، قم بالتحديث" : "نعم، قم بإنشاء الحساب",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
    });
    if (!confirmed.isConfirmed) return;

    setIsSubmitting(true);
    const apiType = TYPE_TO_API[formData.userType] || "eng";

    try {
      const form = new FormData();

      if (isEdit) {
        // ── PUT /api/Account/update-account ──────────────────────────────
        // always send email (required by API)
        form.append("email",       accountData.email);
        form.append("UserName",    formData.name);
        form.append("DisplayName", formData.displayName);
        form.append("BranchId",    formData.branch);
        form.append("UserType",    apiType);
        if (formData.phone)    form.append("PhoneNumber", formData.phone);
        if (formData.password) form.append("Password",    formData.password);
        // only append new image file, not the old URL string
        if (formData.image && typeof formData.image !== "string") {
          form.append("UserImage", formData.image);
        }
        if (formData.officeId) form.append("OfficeId", formData.officeId);

        const response = await axios.put(
          `${Url}Account/update-account`,
          form,
          {
            // API expects userName as query param
            params:  { userName: accountData.userName },
            headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
          }
        );

        if (response.status === 200) {
          await Swal.fire({ title: "تم بنجاح", text: "تم تحديث الحساب بنجاح", icon: "success", confirmButtonText: "حسناً" });
          window.location.reload();
        }

      } else {
        // ── POST /api/Account/register ───────────────────────────────────
        form.append("Email",       formData.email);
        form.append("DisplayName", formData.displayName);
        form.append("UserName",    formData.name);
        form.append("BranchId",    formData.branch);
        form.append("UserType",    apiType);
        form.append("PhoneNumber", formData.phone);
        form.append("Password",    formData.password);
        if (formData.image)   form.append("UserImage", formData.image);
        if (formData.officeId) form.append("OfficeId", formData.officeId);

        const response = await axios.post(`${Url}Account/register`, form, {
          headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
        });

        if (response.status === 200) {
          await Swal.fire({ title: "تم بنجاح", text: "تم إضافة الحساب بنجاح", icon: "success", confirmButtonText: "حسناً" });
          resetForm();
        }
      }
    } catch (error) {
      console.error(error);
      await Swal.fire({
        title: "خطأ",
        text: error.response?.data?.message || "حدث خطأ أثناء حفظ الحساب",
        icon: "error",
        confirmButtonText: "حسناً",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  const navy    = "#2A385B";
  const navyA15 = "rgba(42,56,91,0.15)";
  const gold    = "#BC915C";

  return (
    <div style={{
      width: "100%",
      maxWidth: "760px",
      margin: "0 auto",
      padding: "2rem 1.5rem",
      background: "#fff",
      borderRadius: "16px",
      boxShadow: "0 4px 24px rgba(42,56,91,0.08)",
      fontFamily: "'Cairo', sans-serif",
      direction: "rtl",
      boxSizing: "border-box",
      // ← key fix: allow the card to scroll on small screens
      overflowY: "auto",
    }}>

      {/* ── title ── */}
      <h2 style={{ margin: "0 0 1.75rem", color: navy, fontWeight: 800, fontSize: "1.3rem" }}>
        {isEdit ? "تعديل الحساب" : "إضافة حساب جديد"}
      </h2>

      {/* ── avatar ── */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
        <label style={{
          position: "relative", width: "110px", height: "110px",
          borderRadius: "50%", cursor: "pointer",
          border: `2px dashed ${navyA15}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", flexShrink: 0,
          background: "#F4F6FA",
        }}>
          {imagePreview
            ? <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <FontAwesomeIcon icon={faCamera} style={{ fontSize: "2rem", color: navyA15 }} />
          }
          <input type="file" accept="image/*" onChange={handleImageChange}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
        </label>
      </div>

      {/* ── grid fields ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "1.25rem",
      }}>

        {/* username */}
        <Field label="الاسم (Username)" error={errors.name}>
          <input name="name" value={formData.name} onChange={handleInputChange}
            style={inputStyle(errors.name)} />
        </Field>

        {/* display name */}
        <Field label="اسم العرض" error={errors.displayName}>
          <input name="displayName" value={formData.displayName} onChange={handleInputChange}
            style={inputStyle(errors.displayName)} />
        </Field>

        {/* email */}
        <Field label="البريد الإلكتروني" error={errors.email}>
          <input name="email" type="email" value={formData.email} onChange={handleInputChange}
            readOnly={isEdit}
            style={{ ...inputStyle(errors.email), background: isEdit ? "#F4F6FA" : "#fff" }} />
        </Field>

        {/* phone */}
        <Field label="رقم الهاتف" error={errors.phone}>
          <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange}
            style={inputStyle(errors.phone)} />
        </Field>

        {/* user type */}
        <Field label="نوع المستخدم" error={errors.userType}>
          <select name="userType" value={formData.userType} onChange={handleInputChange}
            style={inputStyle(errors.userType)}>
            <option value="">اختر نوع المستخدم</option>
            {localStorage.getItem("userType") === "admin" && (
              <>
                <option value="مسؤول">مسؤول</option>
                <option value="مشرف">مشرف</option>
              </>
            )}
            <option value="مهندس">مهندس</option>
            <option value="مدير مكتب">مدير مكتب</option>
            <option value="Contractor">مقاول</option>
          </select>
        </Field>

        {/* branch */}
        <Field label="الفرع" error={errors.branch}>
          <BranchSelect
            value={formData.branch}
            onChange={handleInputChange}
            className=""
            style={inputStyle(errors.branch)}
          />
        </Field>

        {/* office — only for officeManager / eng */}
        {(formData.userType === "مدير مكتب" || formData.userType === "مهندس") && (
          <Field label="المكتب" error={errors.officeId}>
            <select name="officeId" value={formData.officeId} onChange={handleInputChange}
              disabled={!formData.branch}
              style={{ ...inputStyle(errors.officeId), background: !formData.branch ? "#F4F6FA" : "#fff" }}>
              <option value="">اختر المكتب</option>
              {filteredOffices.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </Field>
        )}

        {/* password — full width */}
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label={isEdit ? "كلمة المرور (اتركه فارغاً إذا لم ترد تغييره)" : "كلمة المرور"} error={errors.password}>
            <div style={{ position: "relative" }}>
              <input
                name="password" type={showPassword ? "text" : "password"}
                value={formData.password} onChange={handleInputChange}
                style={{ ...inputStyle(errors.password), paddingLeft: "2.5rem" }}
              />
              <button type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute", left: "0.75rem", top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(42,56,91,0.4)", fontSize: "1rem",
                }}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </Field>
        </div>

      </div>

      {/* ── submit ── */}
      <button
        onClick={handleSaveAccount}
        disabled={isSubmitting}
        style={{
          width: "100%", marginTop: "2rem",
          padding: "0.85rem",
          background: isSubmitting ? "rgba(42,56,91,0.4)" : gold,
          color: "#fff", border: "none", borderRadius: "10px",
          fontFamily: "'Cairo', sans-serif", fontWeight: 700, fontSize: "1rem",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          transition: "opacity 0.2s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
        }}
      >
        {isSubmitting
          ? <><FontAwesomeIcon icon={faSpinner} spin /> جارٍ الحفظ...</>
          : isEdit ? "تعديل الحساب" : "إضافة حساب"
        }
      </button>
    </div>
  );
}

// ── tiny field wrapper ────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}