import React from 'react';
import './Banner.css';

function Banner({ img, title, Description }) {
    return (
        <div
            className="ArchivedRequests"
            style={{
                backgroundImage: `url(${img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
            
        >
            <div className="text-content">
                <h1 className="welcome-text">{title}</h1>
                <p className="description">
                    {Description}
                </p>
            </div>
        </div>
    );
}

export default Banner;
