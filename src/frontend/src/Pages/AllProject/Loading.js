import React from 'react'
import Skeleton from 'react-loading-skeleton'

function Loading({searchTerm, setSearchTerm}) {
  return (
    <div>  <div className="latest-projects-container projects-page" dir="rtl">
    <div className="container">
      <div className="search-container">
        <input
          type="text"
          placeholder="ابحث عن مشروع..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="cards-container">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
          <div key={index} className="project-card">
            <Skeleton height={200} width={250} />
            <div className="project-info">
              <h3 className="project-title">
                <Skeleton width={150} />
              </h3>
              <p className="order-number">
                <Skeleton width={100} />
              </p>
              <p className="project-date">
                <Skeleton width={120} />
              </p>
              <Skeleton height={30} width={100} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div></div>
  )
}

export default Loading