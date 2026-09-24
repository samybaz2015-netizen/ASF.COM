import { useEffect, useState } from "react";
import { postData } from "../../function/FunctionApi";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../Image/fLogo.png";
import backgroundImage from "../../Image/loginside.jpeg";
import {
  setUserSession,
  isUserSessionValid,
} from "../../function/AuthStorage";
import "./Login.css";

// ─── Mapping: permission → أول route مناسب ────────────────────────────────
const PERM_ROUTE_MAP = [
  { perm: "Construction.View", route: "/search-requests" },
  { perm: "Emergency.View", route: "/search-requests" },
  { perm: "Maintenance.View", route: "/search-requests" },
  { perm: "NewProject.View", route: "/search-requests" },
  { perm: "PrivateProject.View", route: "/all-admin-private-project" },
  { perm: "Users.View", route: "/accounts" },
  { perm: "Employees.View", route: "/employees" },
  { perm: "Branch.View", route: "/branches" },
  { perm: "Office.View", route: "/offices" },
  { perm: "Custody.View", route: "/custodies" },
  { perm: "Attendance.View", route: "/check-attendance" },
  { perm: "LeaveRequest.View", route: "/vacations" },
  { perm: "Notifications.View", route: "/notification" },
  { perm: "Neighborhood.View", route: "/district" },
  { perm: "Consultant.View", route: "/consultants" },
  { perm: "WorkOrderType.View", route: "/tasktype" },
];

function getRedirectAfterLogin(userData) {
  const { userType, permissions = [] } = userData;

  if (userType === "admin") return "/home-page";
  if (userType === "supervisor") return "/home-page";
  if (userType === "officeManager") return "/home-page";
  if (userType === "eng") return "/main-page";
  if (userType === "contractor") return "/projects";

  for (const { perm, route } of PERM_ROUTE_MAP) {
    if (permissions.includes(perm)) return route;
  }

  return "/no-access";
}

function Login({ setUserData }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const [data, setData] = useState({
    UserName: "",
    Password: "",
  });

  useEffect(() => {
    if (isUserSessionValid()) {
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { id, value } = e.target;

    setData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  /**
   * يقرأ الموقع إن أمكن، ويعيد null إن تعذّر.
   *
   * بمهلة: المتصفّح لا يُحدّد وقتاً لانتظار جواب المستخدم، فبلا مهلة يبقى
   * الانتظار إلى الأبد.
   */
  const readLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const timer = setTimeout(() => finish(null), 8000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timer);
          finish({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          clearTimeout(timer);
          finish(null);
        },
        { timeout: 8000, maximumAge: 300000 }
      );
    });

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // الموقع محاولةٌ لا شرط.
      //
      // كان الدخول ينتظر إذن الموقع: من رفضه لم يدخل، ومن لم يجب على السؤال
      // بقي أمام شاشة صامتة بلا رسالة — الوعد لا يُحسم فلا يُرسل الطلب ولا
      // يظهر خطأ. والموقع لا يُستعمل في الدخول أصلاً، بل في إجراء واحد لاحق
      // يتحقّق منه بنفسه ويقول «لم يتم العثور على الموقع».
      const location = await readLocation();
      if (location) localStorage.setItem("userLocation", JSON.stringify(location));

      // البيانات في جسم الطلب لا في الرابط: كلمة المرور في سلسلة الاستعلام
      // تُسجَّل في سجلّ الخادم وسجلّ المتصفّح وأيّ وسيط بينهما.
      const result = await postData("Account/login", data, setError);

      if (result) {
        // عدم تخزين الباسورد على الفرونت
        const { password, ...safeUserData } = result.data;

        const saved = setUserSession(safeUserData);

        if (!saved) {
          setError(
            "حدث خطأ أثناء حفظ جلسة الدخول. حاول مرة أخرى."
          );
          return;
        }

        setUserData(safeUserData);

        const userType = safeUserData.userType;

        localStorage.setItem("userType", userType);
        localStorage.setItem(
          "IsRiyadh",
          safeUserData.branchName !== "جدة"
        );
        localStorage.setItem(
          "isAllowed",
          safeUserData.userCanCreateProjectOutsideCityType
        );
        localStorage.setItem("branchId", safeUserData.branchId);

        navigate(getRedirectAfterLogin(safeUserData));
      }
    } catch (error) {
      if (error.code === error.PERMISSION_DENIED) {
        setError(error.response?.data?.message);
      } else {
        const errorMessage =
          error.response?.data?.message ||
          "البيانات غير صحيحة، حاول مرة أخرى";

        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

return (
  <div
    className="Login"
    dir="rtl"
    style={{
      backgroundImage: `url("${backgroundImage}")`,
    }}
  >
    {/* Dark cinematic overlay */}
    <div className="login-background-overlay" />

    {/* Subtle animated light */}
    <div className="login-background-glow" />

    {/* Center Login */}
    <div className="login-center">

      {/* BIG LOGO */}
      <div className="login-logo-wrapper">
        <img
          src={logo}
          alt="عصف"
          className="login-logo"
        />
      </div>

      {/* Login Card */}
      <div className="login-card">

        <div className="login-card-top">
          <span>ASF</span>
          <span>ENGINEERING & CONSTRUCTION</span>
        </div>

        <div className="login-header">
          <span>مرحبًا بعودتك</span>

          <h2>تسجيل الدخول</h2>

          <p>
            أدخل بياناتك للوصول إلى النظام
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleFormSubmit}
        >

          {/* Username */}
          <div className="login-field">

            <label htmlFor="UserName">
              اسم المستخدم
            </label>

            <input
              type="text"
              id="UserName"
              value={data.UserName}
              onChange={handleChange}
              disabled={loading}
              autoComplete="username"
              placeholder="أدخل اسم المستخدم"
            />

          </div>

          {/* Password */}
          <div className="login-field">

            <label htmlFor="Password">
              كلمة المرور
            </label>

            <div className="password-input">

              <input
                type={showPassword ? "text" : "password"}
                id="Password"
                value={data.Password}
                onChange={handleChange}
                disabled={loading}
                autoComplete="current-password"
                placeholder="أدخل كلمة المرور"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                disabled={loading}
              >
                {showPassword ? "إخفاء" : "إظهار"}
              </button>

            </div>

          </div>

          {/* Forgot */}
          <div className="login-forgot">
            <Link to="/reset-password">
              نسيت كلمة المرور؟
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading
              ? "جاري تسجيل الدخول..."
              : "تسجيل الدخول"}
          </button>

          {/* Error */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

        </form>

      </div>
    </div>
  </div>
);

}

export default Login;