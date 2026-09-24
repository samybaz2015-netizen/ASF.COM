import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./Subscribers.css";
import img1 from "../../Image/12.jpeg";
import img2 from "../../Image/13.jpeg";
import img3 from "../../Image/eng4.jpeg";
import officeImage from "../../Image/engineer-workers-icon 1.png";
import { useNavigate } from "react-router-dom";
import { Riyadh, Hail } from "../../util/officeConstants.js";

function Subscribers() {
  const navigate = useNavigate();
  const { name } = useParams();
  let cards = [];

  useEffect(() => {
    if (name === "Operations-Maintenance-all") {
    }
  }, [name]);
  const [isoffices, setIsOffices] = useState(false);
  const toggleIsOffices = () => setIsOffices(!isoffices);
  let title = "";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  switch (name) {
    case "maintains":
      cards = [
        {
          id: 1,
          image: img1,
          text: "اضافة طلب",
          link: "/maintain-projects",
          office: true,
        },
        {
          id: 2,
          image: img2,
          text: "الطلبات تحت التنفيذ",
          link: "/requests/Archived/maintains",
        },
        {
          id: 3,
          image: img3,
          text: " (تم التنفيذ)  الطلبات المكتملة",
          link: "/requests/Completed/maintains",
        },
      ];
      title = "الصيانه";
      break;
    case "rehabilitation":
      cards = [
        {
          id: 1,
          image: img1,
          text: "اضافة طلب",
          link: "/rehabilitation-works",
          office: true,
        },
        {
          id: 2,
          image: img2,
          text: "الطلبات تحت التنفيذ",
          link: "/requests/Archived/Rehabilitation-Works",
        },
        {
          id: 3,
          image: img3,
          text: " (تم التنفيذ)  الطلبات المكتملة",
          link: "/requests/Completed/Rehabilitation-Works",
        },
      ];
      title = "أعمال التأهيل";
      break;
    case "emergency":
      cards = [
        {
          id: 1,
          image: img1,
          text: "اضافة طلب",
          link: "/emergency-projects",
          office: true,
        },
        {
          id: 2,
          image: img2,
          text: "الطلبات تحت التنفيذ",
          link: "/requests/Archived/Emergencies",
        },
        {
          id: 3,
          image: img3,
          text: " (تم التنفيذ)  الطلبات المكتملة",
          link: "/requests/Completed/Emergencies",
        },
      ];
      title = "الطوارئ";
      break;
    case "construction":
      cards = [
        {
          id: 1,
          image: img1,
          text: "اضافة طلب",
          link: "/construction-projects",
          office: true,
        },
        {
          id: 2,
          image: img2,
          text: "الطلبات تحت التنفيذ",
          link: "/requests/Archived/Constructions",
        },
        {
          id: 3,
          image: img3,
          text: " (تم التنفيذ)  الطلبات المكتملة",
          link: "/requests/Completed/Constructions",
        },
      ];
      title = "الإنشاءات";
      break;
    default:
      cards = [
        {
          id: 1,
          image: img1,
          text: "اضافة طلب",
          link: "/special-projects",
          office: true,
        },
        {
          id: 2,
          image: img2,
          text: "الطلبات تحت التنفيذ",
          link: "/requests/Archived/special-projects",
        },
        {
          id: 3,
          image: img3,
          text: " (تم التنفيذ)  الطلبات المكتملة",
          link: "/requests/Completed/special-projects",
        },
      ];
      title = "المشاريع الخاصه";
  }

  return (
    <div className="subscribers-container min-h-[68vh]  flex items-center justify-center" dir="rtl">
    <div>
    <div style={{ marginBottom: "70px" }}>
        <h2 className="title">{title} </h2>
        <p className="description">لبدء مشروعك، نحتاج إلى تخصيص تفضيلاتك.</p>
      </div>

      <div className="cards-container">
        {cards.map((card) => {
          return (
            <Link to={card.link} key={card.id} className="card-link">
              <div className="card">
                <img src={card.image} alt={card.text} className="card-image" />
                <p className="card-text">{card.text}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
    </div>
  );
}

export default Subscribers;
