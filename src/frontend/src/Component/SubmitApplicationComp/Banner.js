import React from 'react';
import './Banner.css'; 
import  img2 from '../../Image/img3.jpeg'

function Banner({ img, title, Description }) {
  return (
    <div
      className="SubmitApplication"
      style={{
        backgroundImage: `url(${img2})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      dir="rtl"
    >
        <div className="image-cover">
          <div className="text-content">
            <h1 className="welcome-text mx-4">{title}</h1>
            <p className="description">
              {Description}
            </p>
        </div>
      </div>
    </div>
  );
}

export default Banner;
