import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from "@fortawesome/free-regular-svg-icons";
import { faPhone } from "@fortawesome/free-solid-svg-icons";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Map.css";
import markerIconUrl from "../../../Image/location.png";

const MapComponent = () => {
  const position = [24.704111, 46.68025];

  const myIcon = L.icon({
    iconUrl: markerIconUrl,
    iconSize: [40, 40],
    shadowSize: [41, 41],
    iconAnchor: [12, 41],
    shadowAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  return (
    <div className="map-component">
      <div className="container">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={position} icon={myIcon}>
            <Popup>موقع محدد</Popup>
          </Marker>
        </MapContainer>

        <div className="card-container" dir="rtl">
          <div className="address">
            <div className="card-content">
              <p>عنوان الشركة</p>
              <h3>مقر الشركة في الرياض</h3>
            </div>
          </div>
          <div className="Message">
            <span>
              <FontAwesomeIcon icon={faCommentDots} size="2x" />
            </span>
            <div className="card-content">
              <p> البريد الإلكتروني </p>
              <h6>
                <a
                  href="mailto:m.saeed@rasmconsulting.com"
                  className="link-email"
                >
                  info@asf.com{" "}
                </a>
              </h6>
            </div>
          </div>
          <div className="phone">
            <span>
              <FontAwesomeIcon icon={faPhone} size="2x" />
            </span>
            <div className="card-content">
              <p>هواتف الشركة</p>
              <h6>
                <a href="tel:0590888692" className="link-phone">
                  12351235
                </a>
              </h6>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
