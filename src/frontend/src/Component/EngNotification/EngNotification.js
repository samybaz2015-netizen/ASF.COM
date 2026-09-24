import React, { useState, useEffect } from "react";
import { domain, fetchDataWithRetries } from "../../function/FunctionApi";
import { useNavigate } from "react-router-dom";
import { LoadingModal } from "../Common/ModelComponents";

// Project types
const types = {
  maintenance: "maintenance",
  emergency: "emergency",
  rehabilitation_work: "rehabilitation_work",
  construction: "construction",
};

// Style config per notification type (color accents + icon)
const typeStyles = {
  "تحديث طلب الاجازة": {
    accent: "border-r-4 border-blue-400",
    badge: "bg-blue-50 text-blue-600",
    icon: "🗓️",
  },
  "رفض مشروع": {
    accent: "border-r-4 border-red-400",
    badge: "bg-red-50 text-red-600",
    icon: "⛔",
  },
  "إغلاق عهدة": {
    accent: "border-r-4 border-amber-400",
    badge: "bg-amber-50 text-amber-600",
    icon: "📦",
  },
  default: {
    accent: "border-r-4 border-gray-300",
    badge: "bg-gray-50 text-gray-600",
    icon: "🔔",
  },
};

// Build a working image URL from whatever the backend sends
const resolveImageSrc = (rawUrl) => {
  if (!rawUrl) return null;

  // Convert Google Drive "view" share links into a directly-renderable image URL
  const driveMatch = rawUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    const fileId = driveMatch[1];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Relative paths coming from the API need the domain prefixed
  if (rawUrl.startsWith("/")) {
    return `${domain}${rawUrl}`;
  }

  // Already an absolute usable URL
  return rawUrl;
};

function Avatar({ userName, userImage }) {
  const [failed, setFailed] = useState(false);
  const src = resolveImageSrc(userImage);

  if (!src || failed) {
    return (
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-primary font-semibold text-lg">
          {userName?.charAt(0) || "U"}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={userName || "user"}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-100"
    />
  );
}

function EngNotificationContent() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      await fetchDataWithRetries("Notification/all", (response) => {
        if (response?.data) {
          setNotifications(
            response.data.map((notif) => ({
              id: notif.id,
              title: notif.notificationType,
              message: notif.message,
              date: notif.createdAt,
              userName: notif.userName,
              userImage: notif.userImage,
              projectId: notif.projectId,
              target: notif.target,
              projectType: notif.projectType,
            }))
          );
        }
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to fetch notifications. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleProjectClick = (notification) => {
    if (!notification.projectId) return;
    let path = null;
    switch (notification.projectType) {
      case types.maintenance:
        path = `/maintain-projects/${notification.projectId}`;
        break;
      case types.emergency:
        path = `/emergency-projects/${notification.projectId}`;
        break;
      case types.rehabilitation_work:
        path = `/rehabilitation-works/${notification.projectId}`;
        break;
      case types.construction:
        path = `/construction-projects/${notification.projectId}`;
        break;
      default:
        path = `/special-projects/${notification.projectId}`;
    }
    navigate(path);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-4">
        <LoadingModal />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-red-200 max-w-md w-full">
          <p className="text-red-500 text-center text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-800">
        اشعارات المهندس
      </h1>

      {notifications.length > 0 ? (
        <ul className="space-y-3">
          {notifications.map((notification) => {
            const style = typeStyles[notification.title] || typeStyles.default;
            return (
              <li
                key={notification.id}
                className={`bg-white p-4 md:p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 ${style.accent}`}
              >
                <div className="flex items-start gap-4">
                  <Avatar
                    userName={notification.userName}
                    userImage={notification.userImage}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}
                          >
                            <span>{style.icon}</span>
                            {notification.title}
                          </span>
                          <small className="text-xs text-gray-400">
                            {formatDate(notification.date)}
                          </small>
                        </div>

                        <p className="text-gray-700 text-sm md:text-base leading-relaxed break-words">
                          {notification.message}
                        </p>

                        <p className="text-xs text-gray-500 mt-1.5">
                          بواسطة <strong className="text-gray-700">{notification.userName}</strong>
                        </p>
                      </div>

                      {notification.projectId && (
                        <button
                          onClick={() => handleProjectClick(notification)}
                          className="w-full md:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-200 text-sm font-medium whitespace-nowrap"
                        >
                          عرض المشروع
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 text-lg">لا يوجد اشعارات</p>
        </div>
      )}
    </div>
  );
}

export default EngNotificationContent;