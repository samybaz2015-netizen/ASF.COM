import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookF,
  faTwitter,
  faLinkedinIn,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";
import img from "../../Image/logoo.png";
import img2 from "../../Image/logoo.png";
import "./Footer.css";
const SocialMediaIcon = ({ icon, link }) => {
  // Function to determine the color based on the icon
  const getColorByIcon = (icon) => {
    switch (icon.iconName) {
      case "facebook-f":
        return "rgba(59, 89, 152, 1)";
      case "twitter":
        return "rgba(29, 161, 242, 1)";
      case "linkedin-in":
        return "rgba(0, 119, 181, 1)";
      case "youtube":
        return "rgba(255, 0, 0, 1)";
      default:
        return "rgba(76, 175, 79, 1)";
    }
  };

  const color = getColorByIcon(icon);

  return (
    <a href={link} className="text-decoration-none mx-3">
      <div className="rounded-circle bg-white p-3 d-flex justify-content-center align-items-center transition-all transform hover:scale-110 shadow-lg">
        <FontAwesomeIcon icon={icon} style={{ color }} className="fs-4" />
      </div>
    </a>
  );
};

const Footer = () => {
  return (
    <footer className="footer mt-5" dir="rtl">
      <div className="container-fluid">
        <div className="row ">
          <div
            className="col-md-3 text-center py-3 bg-secondaryColor "
            style={{ color: "white" }}
          >
            <div className=" flex items-center justify-center">
              <img
                src={img}
                alt="Footer Image"
                className="img-fluid mb-2 !h-36"
              />
            </div>
            <p className="Contactus">اتصل بنا اليوم</p>
            <p className="phoneNumber">112759717</p>
            <div className="d-flex justify-content-center">
              <div className="d-flex justify-content-center">
                <SocialMediaIcon
                  icon={faFacebookF}
                  link="#"
                  color="rgba(76, 175, 79, 1)"
                />
                <SocialMediaIcon
                  icon={faTwitter}
                  link="#"
                  color="rgba(76, 175, 79, 1)"
                />
                <SocialMediaIcon
                  icon={faLinkedinIn}
                  link="#"
                  color="rgba(76, 175, 79, 1)"
                />
                <SocialMediaIcon
                  icon={faYoutube}
                  link="#"
                  color="rgba(76, 175, 79, 1)"
                />
              </div>
            </div>
          </div>

          <div
            className="col-md-9 py-4 pr-5"
            style={{
              backgroundColor: "rgba(103, 103, 105, 1)",
              color: "white",
            }}
          >
            <div className="row">
              <div className="col-md-4 py-4">
                <h5>الشركة</h5>
                <ul className="list-unstyled">
                  <li>
                    <Link
                      to="/about"
                      className="text-white text-decoration-none"
                    >
                      عن الشركة
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/projects"
                      className="text-white text-decoration-none"
                    >
                      مشاريعنا
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contactus"
                      className="text-white text-decoration-none"
                    >
                      اتصالات
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="col-md-4 py-4">
                <h5>خدماتنا</h5>
                <ul className="list-unstyled">
                  <li>
                    <Link
                      to="/Sub-page/Operations-Maintenance"
                      className="text-white text-decoration-none"
                    >
                      العمليات والصيانة
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/Sub-page/Projects"
                      className="text-white text-decoration-none"
                    >
                      المشاريع
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="col-md-4 flex-col-reverse items-center  flex  py-4 text-center">
                <p>
                  Created by :{" "}
                  <span
                    className=" text-secondaryColor"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      (window.location.href = "https://wa.me/201026270790")
                    }
                  >
                    NG-Technology
                  </span>
                </p>
                <img
                  src={img2}
                  alt="Footer Image"
                  className="img-fluid mb-2 !h-28 "
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
