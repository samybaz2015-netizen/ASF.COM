import React, { useState } from "react";
import { Link } from "react-router-dom"; 
import "./SubscribersComp.css"; 
import img1 from "../../Image/Frame.png";
import img2 from "../../Image/Frame (1).png";
import img3 from "../../Image/Group (1).png";

function Subscribers({NamePage}) {
  const cards = [
    { id: 1, image: img1, text: "اضافة طلب", link: "/new-request" }, 
    { id: 2, image: img2, text: "الطلبات المؤرشفة", link: "/archived-requests" },
    { id: 3, image: img3, text: "الطلبات المكتملة", link: "/completed-requests" }, 
  ];

  return (
    <div className="subscribers-container">
      <h2 className="title">{NamePage}</h2>
      <p className="description">
        لبدء مشروعك، نحتاج إلى تخصيص تفضيلاتك.
      </p>
      
      <div className="cards-container">
        {cards.map((card) => (
          <Link to={card.link} key={card.id} className="card-link"> 
            <div className="card">
              <img src={card.image} alt={card.text} />
              <p>{card.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Subscribers;
