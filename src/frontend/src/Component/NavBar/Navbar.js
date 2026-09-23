import React, { useState, useEffect } from "react";
import logo from "../../Image/fLogo.png";
import NavDropdown from "react-bootstrap/NavDropdown";
import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { fetchDataWithRetries, domain } from "../../function/FunctionApi";
import { FaSearch, FaRobot, FaClock, FaCalendarAlt, FaFolderOpen } from "react-icons/fa";
import { clearUserSession } from "../../function/AuthStorage";


const resolveImageUrl = (raw) => {
  if (!raw) return null;

  const driveMatch = raw.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}=w200`;
  }

  if (raw.startsWith("http")) return raw;
  return `${domain}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

function NavBar({ userData }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);
  const [imgError, setImgError] = useState(false);
  const isContractor = userData?.userType === "contractor";

   const handleLogout = () => {
   clearUserSession();
   navigate("/");
    setExpanded(false);
  };

  const resolvedImage = resolveImageUrl(userData?.userImage);
  const userImages = imgError || !resolvedImage ? logo : resolvedImage;

    useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".navbar-container")) {
        setExpanded(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setImgError(false);
  }, [userData?.userImage]);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        await fetchDataWithRetries("Notification/count", (response) => {
          if (response?.data) {
            setNotificationCount(response.data);
          }
        });
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    fetchNotificationCount();
    // Refresh count every minute
    const interval = setInterval(fetchNotificationCount, 60000);
    return () => clearInterval(interval);
  }, []);
if (isContractor) {
  return (
    <nav
      className="navbar-container bg-white shadow-lg top-0 fixed w-full z-50"
      dir="rtl"
    >
      <div className="w-[90vw] mx-auto flex items-center justify-between px-4 py-3">
        
        {/* اللوجو */}
        <Link to="/projects" className="flex items-center">
          <img src={logo} alt="Logo" className="h-16" />
        </Link>

        {/* بيانات المستخدم + تسجيل خروج */}
        <div className="flex items-center gap-3">
          <img
            className="w-10 h-10 rounded-full object-cover border"
            src={userImages}
            alt="User"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />

          <span className="text-gray-700 font-medium">
            {userData?.displayName}
          </span>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </nav>
  );
}
  return (
    <nav
      className="navbar-container  bg-white shadow-lg top-0 fixed w-full z-50"
      dir="rtl"
    >
      <div className=" w-[85vw] mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          to="/main-page"
          className="flex items-center"
          onClick={() => setExpanded(false)}
        >
          <img src={logo} alt="Logo" className="h-24" />
        </Link>

        <button
          className=" text-gray-700 focus:outline-none"
          onClick={() => setExpanded(!expanded)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={expanded ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            ></path>
          </svg>
        </button>

        <div
           className={`
            ${expanded ? "block" : "hidden"}
            absolute
            top-24
            right-0
            w-full
            bg-white
            shadow-lg
            z-40
          `}
        >
          <Link
            to="/main-page"
            className="block px-3 text-mainColor py-2 text-gray-700 hover:text-secondaryColor lg:mx-2"
            onClick={() => setExpanded(false)}
          >
            الرئيسية
          </Link>
          <NavDropdown
            title="الاقسام"
            // id="collapsible-nav-dropdown"
            className="block px-3 py-2 text-gray-700 lg:mx-2"
          >
            {/* <NavDropdown.Item
              as={Link}
              to="/Sub-page/Projects"
              onClick={() => setExpanded(false)}
            > 

              المشاريع
            </NavDropdown.Item> */}
            <NavDropdown.Item
              as={Link}
              to="/electricRequests"
              onClick={() => setExpanded(false)}
            >
              الكهرباء
            </NavDropdown.Item>

            <NavDropdown.Item
              as={Link}
              to="/Sub-page/special-projects"
              onClick={() => setExpanded(false)}
            >
              المشاريع الخاصه
            </NavDropdown.Item>
          </NavDropdown>

          <Link
            to="/statics"
            className="block px-3 text-mainColor py-2 text-gray-700 hover:text-secondaryColor lg:mx-2"
            onClick={() => setExpanded(false)}
          >
            الاحصائيات
          </Link>
          <Link
            to="/projects"
            className="block px-3 text-mainColor py-2 text-gray-700 hover:text-secondaryColor lg:mx-2"
            onClick={() => setExpanded(false)}
          >
            جميع الطلبات
          </Link>

          <Link
            to="/contactus"
            className="block px-3 text-mainColor py-2 text-gray-700 hover:text-secondaryColor lg:mx-2"
            onClick={() => setExpanded(false)}
          >
            تواصل معنا
          </Link>

          <Link
            to="/about"
            className="block px-3 text-mainColor py-2 text-gray-700 hover:text-secondaryColor lg:mx-2"
            onClick={() => setExpanded(false)}
          >
            من نحن
          </Link>
          <Link
            to="/boot-info"
            className="block px-3 text-mainColor py-2 text-gray-700 hover:text-secondaryColor lg:mx-2"
            onClick={() => setExpanded(false)}
          >
            <div className="flex items-center gap-2">
              <div className="bg-mainColor rounded-full p-2">
                <FaRobot className="text-white text-xl" />
              </div>
              <span>بوت</span>
            </div>
          </Link>

          <Link
            to="/eng-notification"
            className="block px-3 text-mainColor py-2 text-gray-700 hover:text-secondaryColor lg:mx-2 relative"
          >
            🔔
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-7 w-7 flex items-center justify-center">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </Link>
          <Link
            to="/eng-attendance"
            className="block px-3 text-mainColor py-2 text-gray-700 hover:text-secondaryColor lg:mx-2"
            onClick={() => setExpanded(false)}
          >
            <FaClock className="inline-block ml-1" />
            الحضور
          </Link>
          <Link
            to="/myvacations"
            className="block px-3 text-mainColor py-2 text-gray-700 hover:text-secondaryColor lg:mx-2"
            onClick={() => setExpanded(false)}
          >
            <FaCalendarAlt  className="inline-block ml-1" />
               الاجازات
          </Link>
          <Link
            to="/custodieseng"
            className="block px-3 text-mainColor py-2 text-gray-700 hover:text-secondaryColor lg:mx-2"
            onClick={() => setExpanded(false)}
          >
            <FaFolderOpen   className="inline-block ml-1" />
               العهد
          </Link>
          <a
            href="/eng-profile"
            className="block px-3 text-mainColor py-2 text-gray-700 hover:text-secondaryColor lg:mx-2"
          >
            الملف الشخصي
          </a>
        </div>

        <div className="user-info-dropdown flex items-center space-x-2">
          <NavDropdown
            title={
              <span className="flex items-center  space-x-2">
                <img
                  className="w-8 h-8 rounded-full"
                  src={userImages}
                  alt="User"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                />
                <span className="text-gray-700">
                  {userData && userData.displayName}
                </span>
              </span>
            }
            id="user-dropdown"
          >
            <NavDropdown.Item onClick={handleLogout}>
              تسجيل الخروج
            </NavDropdown.Item>
          </NavDropdown>
        </div>
      </div>
      
    </nav>
  );
}

export default NavBar;