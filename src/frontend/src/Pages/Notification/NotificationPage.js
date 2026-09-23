import React, { useEffect, useState } from "react";
import Sidebar from "../../Component/Sidebar/Sidebar";
import Header from "../../Component/Header/Header";
import axiosInstance  from "../../api/apiClient";
import { getDriveImageUrl } from "../../util/Driveimage";
import defaultAvatar from "../../Image/team-01.png"; 
import ImagePreview from "../../Component/ImagePreview/ImagePreview";

function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axiosInstance.get(`/Notification/all`);
        if (response.status === 200) {
          setNotifications(response.data.data);
          setFilteredNotifications(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, []);

  const handleFilterChange = (e) => {
    const value = e.target.value.toLowerCase();
    setFilterText(value);

    const filtered = notifications.filter(
      (notification) =>
        notification.message.toLowerCase().includes(value) ||
        notification.userName.toLowerCase().includes(value)
    );
    setFilteredNotifications(filtered);
  };

  return (
    <div  className="apDiv">
      <div className="body_container">

       
        
        <div dir="rtl" className="p-8">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-6">
            📢 الإشعارات
          </h1>
          <div className="flex items-center mb-6">
            <input
              type="text"
              placeholder="🔍 ابحث عن إشعار..."
              value={filterText}
              onChange={handleFilterChange}
              className="w-full p-2 text-lg border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="space-y-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start bg-white shadow-lg p-6 rounded-lg border border-gray-200 hover:shadow-2xl transition-shadow duration-300"
                >
                  <ImagePreview
                     src={getDriveImageUrl(notification.userImage) || defaultAvatar}
                    alt={notification.userName}
                    className="w-20 h-20 rounded-full object-cover border border-gray-300 shadow-md"
                    onError={(e) => { e.currentTarget.src = defaultAvatar; }}
                  />

                  <div className="mr-6 flex-1">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">
                      {notification.userName}
                    </h2>
                    <p className="text-gray-700 mb-2">{notification.message}</p>
                    <p className="text-sm text-gray-500 mt-3 flex items-center">
                      🕒{" "}
                      <span className="ml-1">
                        {new Date(notification.createdAt).toLocaleString(
                          "ar-EG"
                        )}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                      {notification.notificationType}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center text-lg font-semibold">
                لا توجد إشعارات مطابقة لبحثك.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationPage;
