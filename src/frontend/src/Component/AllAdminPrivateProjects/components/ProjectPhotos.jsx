import React from "react";
import {
  Image as ImageIcon,
  Trash2,
  ExternalLink,
} from "lucide-react";

const getImageUrl = (photo) => {
  const url =
    typeof photo === "string"
      ? photo
      : photo?.url ||
        photo?.imageUrl ||
        photo?.path ||
        photo?.fileUrl;

  if (!url) return null;

  // Google Drive:
  // https://drive.google.com/file/d/FILE_ID/view
  const driveMatch = url.match(
    /drive\.google\.com\/file\/d\/([^/]+)/
  );

  if (driveMatch?.[1]) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
  }

  // Google Drive:
  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID
  const idMatch = url.match(/[?&]id=([^&]+)/);

  if (
    idMatch?.[1] &&
    url.includes("drive.google.com")
  ) {
    return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
  }

  // أي رابط صورة عادي
  return url;
};

const getOriginalUrl = (photo) => {
  return typeof photo === "string"
    ? photo
    : photo?.url ||
        photo?.imageUrl ||
        photo?.path ||
        photo?.fileUrl ||
        null;
};

const getPhotoId = (photo) => {
  if (typeof photo === "string") {
    return photo;
  }

  return (
    photo?.id ||
    photo?.Id ||
    photo?.photoId ||
    photo?.PhotoId ||
    null
  );
};

const ProjectPhotos = ({
  title,
  photos = [],
  onDelete,
  readonly = false,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F766E]/10">
          <ImageIcon
            size={18}
            className="text-[#0F766E]"
          />
        </div>

        <h3 className="font-bold text-slate-700">
          {title}
        </h3>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {photos.length}
        </span>
      </div>

      {/* Empty */}
      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
          <ImageIcon
            size={30}
            className="mx-auto mb-2 text-slate-300"
          />

          <p className="text-sm text-slate-400">
            لا توجد صور
          </p>
        </div>
      ) : (
        /* Photos */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo, index) => {
            const imageUrl = getImageUrl(photo);
            const originalUrl =
              getOriginalUrl(photo);
            const photoId = getPhotoId(photo);

            return (
              <div
                key={photoId || index}
                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`صورة ${index + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";

                      const parent =
                        e.currentTarget.parentElement;

                      if (parent) {
                        parent
                          .querySelector(
                            ".image-error"
                          )
                          ?.classList.remove("hidden");
                      }
                    }}
                  />
                ) : null}

                {/* Image Error */}
                <div
                  className={`image-error ${
                    imageUrl ? "hidden" : ""
                  } absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-center`}
                >
                  <ImageIcon
                    size={28}
                    className="mb-2 text-slate-300"
                  />

                  <span className="px-2 text-xs text-slate-400">
                    تعذر تحميل الصورة
                  </span>
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 flex items-start justify-between bg-gradient-to-b from-black/50 via-transparent to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                  {/* Open */}
                  {originalUrl && (
                    <a
                      href={originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="فتح الصورة"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-600 shadow transition hover:bg-white hover:text-[#0F766E]"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}

                  {/* Delete */}
                  {!readonly && onDelete && (
                    <button
                      type="button"
                      title="حذف الصورة"
                      onClick={() =>
                        onDelete(photo)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white shadow transition hover:bg-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Image Number */}
                <div className="absolute bottom-2 right-2 rounded-md bg-black/50 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                  {index + 1}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectPhotos;