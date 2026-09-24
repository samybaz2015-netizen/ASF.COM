import { useState, useEffect } from "react";

export const CloseIcon = ({ size = 24, color = "currentColor", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 6L6 18" />
    <path d="M6 6L18 18" />
  </svg>
);

const ImagePreview = ({ src, alt = "", className = "w-10 h-10" }) => {
  const [open, setOpen] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src) {
    return <span className="text-gray-400 text-xs">No image</span>;
  }

  if (errored) {
    return (
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className={`${className} flex items-center justify-center rounded-lg border border-dashed border-red-300 bg-red-50 p-1 text-center text-[10px] leading-tight text-red-500 hover:bg-red-100`}
      >
        تعذر تحميل الصورة
      </a>
    );
  }

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`${className} object-cover rounded-lg cursor-pointer hover:opacity-80 transition`}
        onClick={() => setOpen(true)}
        onError={() => setErrored(true)}
        referrerPolicy="no-referrer"
      />

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/90 hover:bg-white transition cursor-pointer"
          >
            <CloseIcon size={24} color="#1f2937" />
          </button>

          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-xl object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </>
  );
};

export default ImagePreview;