import React, { useState } from "react";
import { Link } from "react-router-dom";

const SharedFiles = ({ data }) => {
  const [note, setNote] = useState(data.note || "");

  return (
    <div>
      {/* Models Section */}
      <div className="upload-section">
        <h4>النماذج</h4>
        {data.modelPhotos && data.modelPhotos.length > 0 ? (
          <div className="file-list">
            {data.modelPhotos.map((photo, index) => {
              const fileUrl = `https://www.rasmconsult.com${photo.url}`;
              const isPdf = fileUrl.endsWith(".pdf");
              return isPdf ? (
                <div key={index} className="file-item">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "block", margin: "10px 0" }}
                  >
                    اضغط لرؤيه الملف
                  </a>
                </div>
              ) : (
                <div key={index} className="file-item">
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={fileUrl}
                      alt={`Model Photo ${index + 1}`}
                      style={{
                        width: "100px",
                        height: "100px",
                        margin: "10px 0",
                      }}
                    />
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <p>لا توجد نماذج.</p>
        )}
      </div>

      {/* Site Photos Section */}
      <div className="upload-section">
        <h4>صور الموقع</h4>
        {data.sitePhotos && data.sitePhotos.length > 0 ? (
          <div className="file-list">
            {data.sitePhotos.map((photo, index) => {
              const fileUrl = `https://www.rasmconsult.com${photo.url}`;
              const isPdf = fileUrl.endsWith(".pdf");
              return isPdf ? (
                <div key={index} className="file-item">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "block", margin: "10px 0" }}
                  >
                    اضغط لرؤيه الملف
                  </a>
                </div>
              ) : (
                <div key={index} className="file-item">
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={fileUrl}
                      alt={`Site Photo ${index + 1}`}
                      style={{
                        width: "100px",
                        height: "100px",
                        margin: "10px 0",
                      }}
                    />
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <p>لا توجد صور للموقع.</p>
        )}
      </div>

      {/* Safety Waste Photos Section */}
      <div className="upload-section">
        <h4>مخالفات السلامة</h4>
        {data.safetyWastePhotos && data.safetyWastePhotos.length > 0 ? (
          <div className="file-list">
            {data.safetyWastePhotos.map((photo, index) => {
              const fileUrl = `https://www.rasmconsult.com${photo.url}`;
              const isPdf = fileUrl.endsWith(".pdf");
              return isPdf ? (
                <div key={index} className="file-item">
                  <Link
                    to={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "block", margin: "10px 0" }}
                  >
                    اضغط لرؤيه الملف
                  </Link>
                </div>
              ) : (
                <div key={index} className="file-item">
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={fileUrl}
                      alt={`Safety Photo ${index + 1}`}
                      style={{
                        width: "100px",
                        height: "100px",
                        margin: "10px 0",
                      }}
                    />
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <p>لا توجد مخالفات سلامة.</p>
        )}
      </div>

      {/* Note Section */}
    </div>
  );
};

export default SharedFiles;
