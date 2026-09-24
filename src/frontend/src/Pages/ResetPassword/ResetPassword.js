import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/apiClient";
import logo from "../../Image/logo.png";
import backgroundImage from "../../Image/loginside.jpeg";
import "./ResetPassword.css";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { id, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();

    setLoading(true);
    clearMessages();

    const formDataToSend = new FormData();
    formDataToSend.append("email", formData.email);

    try {
      await axiosInstance.post(
        "/Account/forgetPassword",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
      setStep(2);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "حدث خطأ أثناء إرسال رمز التحقق"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setLoading(true);
    clearMessages();

    const formDataToSend = new FormData();

    formDataToSend.append("email", formData.email);
    formDataToSend.append("otp", formData.otp);

    try {
      await axiosInstance.post(
        "/Account/verifyOtp",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess("تم التحقق من الرمز بنجاح");
      setStep(3);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "رمز التحقق غير صحيح"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setLoading(true);
    clearMessages();

    if (
      formData.newPassword !==
      formData.confirmPassword
    ) {
      setError("كلمات المرور غير متطابقة");
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();

    formDataToSend.append(
      "email",
      formData.email
    );

    formDataToSend.append(
      "newPassword",
      formData.newPassword
    );

    try {
      await axiosInstance.post(
        "/Account/resetPassword",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(
        "تم إعادة تعيين كلمة المرور بنجاح"
      );

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "حدث خطأ أثناء إعادة تعيين كلمة المرور"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="ResetPassword"
      dir="rtl"
      style={{
        backgroundImage: `url("${backgroundImage}")`,
      }}
    >
      {/* Background */}
      <div className="reset-background-overlay" />

      <div className="reset-background-glow" />

      {/* Center */}
      <div className="reset-center">

        {/* Logo */}
        <div className="reset-logo-wrapper">
          <img
            src={logo}
            alt="عصف"
            className="reset-logo"
          />
        </div>

        {/* Card */}
        <div className="reset-card">

          {/* Top bar */}
          <div className="reset-card-top">
            <span>ASF</span>

            <span>
              ACCOUNT RECOVERY
            </span>
          </div>

          {/* Progress */}
          <div className="reset-progress">

            <div
              className={`reset-step ${
                step >= 1 ? "active" : ""
              }`}
            >
              <span>1</span>
              <small>البريد</small>
            </div>

            <div
              className={`reset-line ${
                step >= 2 ? "active" : ""
              }`}
            />

            <div
              className={`reset-step ${
                step >= 2 ? "active" : ""
              }`}
            >
              <span>2</span>
              <small>التحقق</small>
            </div>

            <div
              className={`reset-line ${
                step >= 3 ? "active" : ""
              }`}
            />

            <div
              className={`reset-step ${
                step >= 3 ? "active" : ""
              }`}
            >
              <span>3</span>
              <small>كلمة المرور</small>
            </div>

          </div>

          {/* Header */}
          <div className="reset-header">

            <span>
              استعادة الحساب
            </span>

            <h2>
              {step === 1 &&
                "إعادة تعيين كلمة المرور"}

              {step === 2 &&
                "تحقق من هويتك"}

              {step === 3 &&
                "أنشئ كلمة مرور جديدة"}
            </h2>

            <p>
              {step === 1 &&
                "أدخل بريدك الإلكتروني لإرسال رمز التحقق"}

              {step === 2 &&
                "أدخل رمز التحقق المرسل إلى بريدك الإلكتروني"}

              {step === 3 &&
                "أدخل كلمة المرور الجديدة لحسابك"}
            </p>

          </div>

          {/* Messages */}
          {success && (
            <div className="reset-message success">
              <span className="message-icon">
                ✓
              </span>

              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="reset-message error">
              <span className="message-icon">
                !
              </span>

              <span>{error}</span>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <form
              className="reset-form"
              onSubmit={handleRequestOTP}
            >

              <div className="reset-field">

                <label htmlFor="email">
                  البريد الإلكتروني
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="أدخل بريدك الإلكتروني"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="email"
                />

              </div>

              <button
                type="submit"
                className="reset-submit"
                disabled={loading}
              >
                {loading
                  ? "جاري الإرسال..."
                  : "إرسال رمز التحقق"}

                {!loading && (
                  <span>←</span>
                )}
              </button>

            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form
              className="reset-form"
              onSubmit={handleVerifyOTP}
            >

              <div className="reset-field">

                <label htmlFor="otp">
                  رمز التحقق
                </label>

                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="أدخل رمز التحقق"
                  value={formData.otp}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="one-time-code"
                  className="otp-input"
                />

              </div>

              <div className="otp-hint">
                تم إرسال الرمز إلى:
                <strong>
                  {formData.email}
                </strong>
              </div>

              <button
                type="submit"
                className="reset-submit"
                disabled={loading}
              >
                {loading
                  ? "جاري التحقق..."
                  : "تحقق من الرمز"}

                {!loading && (
                  <span>←</span>
                )}
              </button>

            </form>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <form
              className="reset-form"
              onSubmit={handleResetPassword}
            >

              <div className="reset-field">

                <label htmlFor="newPassword">
                  كلمة المرور الجديدة
                </label>

                <div className="reset-password-wrapper">

                  <input
                    id="newPassword"
                    name="newPassword"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    required
                    placeholder="أدخل كلمة المرور الجديدة"
                    value={formData.newPassword}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="reset-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (prev) => !prev
                      )
                    }
                    disabled={loading}
                  >
                    {showPassword
                      ? "إخفاء"
                      : "إظهار"}
                  </button>

                </div>

              </div>

              <div className="reset-field">

                <label htmlFor="confirmPassword">
                  تأكيد كلمة المرور
                </label>

                <div className="reset-password-wrapper">

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    required
                    placeholder="أعد إدخال كلمة المرور"
                    value={
                      formData.confirmPassword
                    }
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="reset-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                    disabled={loading}
                  >
                    {showConfirmPassword
                      ? "إخفاء"
                      : "إظهار"}
                  </button>

                </div>

              </div>

              <button
                type="submit"
                className="reset-submit"
                disabled={loading}
              >
                {loading
                  ? "جاري إعادة التعيين..."
                  : "إعادة تعيين كلمة المرور"}

                {!loading && (
                  <span>←</span>
                )}
              </button>

            </form>
          )}

          {/* Back */}
          <div className="reset-back">

            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
            >
              <span>→</span>

              العودة لتسجيل الدخول
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;