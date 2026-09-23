import React from "react";
import noDataImage from "../../Image/App Illustrations.jpg";
import { domain, Url } from "../../function/FunctionApi";

const ChangesOrder = ({ changesData }) => {
  console.log("changessssssssssssssss");
  console.log(changesData);
  if (!changesData || changesData.length === 0) {
    return (
      <div className="changes-order-container">
        <h2 className="changes-title">التغيرات التي طرأت على الطلب</h2>
        <div className="changes-cards-container">
          <img style={{ width: "250px" }} src={noDataImage} alt="No Data" />
          <div>لا توجد تغييرات متوفرة لهذا الطلب.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="changes-order-container">
      <h2 className="changes-title">التغيرات التي طرأت على الطلب</h2>
      <div className="changes-cards-container">
        {changesData.map((change) => (
          <div key={change.id} className="change-card">
            <div className="change-details">
              <p>{change.userName}</p>
              <h6>
                {new Date(change.changeDate).toLocaleString("ar-EG", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </h6>
              <p>{change.changeDescription}</p>
            </div>
            <img
              src={ domain +change.userProfileImage}
              alt={change.userName}
              className="change-image"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChangesOrder;
