import React from "react";
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import img from "../../Image/fLogo.png";
import { getUserSession } from "../../function/AuthStorage";

const Header = () => {
  const userData = getUserSession();

 const getImageUrl = (url) => {
  if (!url) return null;

  // Google Drive: /file/d/FILE_ID/view
  const match = url.match(/\/file\/d\/([^/]+)/);

  if (match?.[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w200`;
  }

  return url;
};

  return (
    <header className="bg-white shadow-sm z-50 px-6 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">

        {/* Logo */}
        <Link to="/home-page" className="group">
          <img
            src={img}
            alt="Logo"
            className="h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Profile */}
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-xl
                     hover:bg-gray-50 transition-all duration-300 group"
        >
          {/* Image */}
          <div className="relative">
            {userData?.userImage ? (
  <img
    src={getImageUrl(userData.userImage)}
    alt={userData?.displayName || "User"}
    className="w-11 h-11 rounded-full object-cover border-2 border-gray-200"
    onError={(e) => {
      e.currentTarget.style.display = "none";
      e.currentTarget.nextElementSibling.style.display = "flex";
    }}
  />
) : null}

<div
  className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center border-2 border-gray-200"
  style={{
    display: userData?.userImage ? "none" : "flex",
  }}
>
  <FaUser className="text-gray-500 text-lg" />
</div>
            <span
              className="absolute bottom-0 right-0 w-3 h-3
                         bg-green-500 border-2 border-white rounded-full"
            />
          </div>

          {/* Name */}
          <div className="hidden sm:block text-right">
            <p className="text-xs text-gray-400">
              مرحباً بك
            </p>

            <p
              className="text-sm font-bold text-gray-800
                         group-hover:text-mainColor
                         transition-colors"
            >
              {userData?.displayName || userData?.userName || "المستخدم"}
            </p>
          </div>
        </Link>

      </div>
    </header>
  );
};

export default Header;