import React, { useState, useRef, useEffect } from "react";
import { FaExpand, FaCompress, FaExclamationTriangle } from "react-icons/fa";

const PowerBiEmbed = ({ src, title = "تقرير Power BI" }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // متابعة أي خروج من fullscreen (مثلاً بزرار Esc) عشان الأيقونة تتزامن صح
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // الارتفاع الافتراضي بقى كبير من الأول، بيتجاوب لوحده مع الشاشة
  const dynamicHeight = isFullscreen ? "100vh" : "calc(100vh - 60px)";

  return (
  <div
  ref={containerRef}
  className="relative w-full h-full bg-white overflow-hidden"
>
  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
    <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
        >
          {isFullscreen ? <FaCompress /> : <FaExpand />}
          <span className="hidden sm:inline">{isFullscreen ? "تصغير" : "ملء الشاشة"}</span>
        </button>
      </div>

      <div className="relative w-full" style={{ height: dynamicHeight }}>
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">جاري تحميل التقرير...</p>
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <FaExclamationTriangle className="text-3xl text-amber-500" />
              <p className="text-sm text-gray-600">تعذّر تحميل التقرير، تأكد من صلاحية اللينك أو من اتصال الإنترنت</p>
            </div>
          </div>
        )}

        <iframe
          title={title}
          src={src}
          className="w-full h-full border-0"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      </div>
    </div>
  );
};

export default PowerBiEmbed;