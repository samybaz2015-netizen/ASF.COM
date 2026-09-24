import React, { useState } from "react";
import "../Dashboard.css";

import OverviewPage from "../Pages/OverviewPage";
import JeddahPage from "../Pages/JeddahPage";
import RiyadhPage from "../Pages/RiyadhPage";

const PAGES = [
  {
    key: "overview",
    label: "ملخص عام",
  },
  {
    key: "jeddah",
    label: "فرع جدة",
  },
  {
    key: "riyadh",
    label: "فرع الرياض",
  },
];

export default function DashboardShell() {
  const [activeIndex, setActiveIndex] = useState(0);

  const goNext = () => {
    setActiveIndex((prev) =>
      prev === PAGES.length - 1 ? 0 : prev + 1
    );
  };

  const goPrevious = () => {
    setActiveIndex((prev) =>
      prev === 0 ? PAGES.length - 1 : prev - 1
    );
  };

  return (
    <div className="dashboard-shell">

      <main className="dashboard-content">

        {activeIndex === 0 && <OverviewPage />}

        {activeIndex === 1 && <JeddahPage />}

        {activeIndex === 2 && <RiyadhPage />}

      </main>

      {/* Power BI Page Navigation */}
      <nav className="dashboard-page-nav">

        <button
          className="dashboard-nav-arrow"
          onClick={goPrevious}
          aria-label="الصفحة السابقة"
        >
          ‹
        </button>

        <div className="dashboard-page-indicator">

          <strong>
            {activeIndex + 1} of {PAGES.length}
          </strong>

          <div className="dashboard-page-tabs">

            {PAGES.map((page, index) => (
              <button
                key={page.key}
                className={
                  activeIndex === index
                    ? "active"
                    : ""
                }
                onClick={() => setActiveIndex(index)}
              >
                {page.label}
              </button>
            ))}

          </div>

        </div>

        <button
          className="dashboard-nav-arrow"
          onClick={goNext}
          aria-label="الصفحة التالية"
        >
          ›
        </button>

      </nav>

    </div>
  );
}