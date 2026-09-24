
import React from "react";
import { FaTimes, FaImage } from "react-icons/fa";
import { getArabicFieldName, formatFieldValue } from "../utils/Formatters";
import { toDirectDriveImageUrl } from "../utils/DriveImage";
import StatusBadge from "./StatusBadge";
import ImagePreview from "../../../Component/ImagePreview/ImagePreview";

const HIDDEN_KEYS = new Set([
  "pricingItems",
  "logs",
  "modelPhotos",
  "sitePhotos",
  "safetyWastePhotos",
  "coordinates",
  "situation",
  "appUserId",
  "userApproveId",
  "userImage",
]);

function PhotoStrip({ title, photos }) {
  if (!photos?.length) return null;

  return (
    <div>
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
        <FaImage size={12} /> {title}
      </h4>

      <div className="flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <ImagePreview
            key={p.id || i}
            src={toDirectDriveImageUrl(p.url)}
            alt={`${title} ${i + 1}`}
            className="h-20 w-20"
          />
        ))}
      </div>
    </div>
  );
}

function PricingTable({ items }) {
  if (!items?.length) return null;

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-slate-600">
        بنود التسعير
      </h4>

      <div className="overflow-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[500px] text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-2 text-center">البند</th>
              <th className="p-2 text-center">الوحدة</th>
              <th className="p-2 text-center">سعر الوحدة</th>
              <th className="p-2 text-center">الكمية المنفذة</th>
              <th className="p-2 text-center">نسبة التنفيذ</th>
              <th className="p-2 text-center">القيمة المنفذة</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it) => (
              <tr
                key={it.id}
                className="border-t border-slate-100 text-center text-slate-600"
              >
                <td className="p-2">
                  {it.shortDescription || it.itemNumber}
                </td>
                <td className="p-2">{it.uom || "—"}</td>
                <td className="p-2">{it.unitPrice ?? "—"}</td>
                <td className="p-2">{it.executedQuantity ?? "—"}</td>
                <td className="p-2">
                  {it.executionPercentage != null
                    ? `${it.executionPercentage}%`
                    : "—"}
                </td>
                <td className="p-2">{it.executedWorksValue ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LogsTimeline({ logs }) {
  if (!logs?.length) return null;

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-slate-600">
        سجل التعديلات
      </h4>

      <ul className="space-y-2 border-r-2 border-slate-100 pr-4">
        {logs.map((log) => (
          <li key={log.id} className="text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              {log.userName}
            </span>
            {" — "}
            {log.changeDescription}

            <span className="block text-slate-400">
              {log.changeDate}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RequestDetailsModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const fields = Object.entries(data).filter(([key, value]) => {
    if (HIDDEN_KEYS.has(key)) return false;
    if (typeof value === "object" && value !== null) return false;
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-7xl overflow-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">
              تفاصيل الطلب
            </h2>

            {data.situation && (
              <StatusBadge situation={data.situation} />
            )}
          </div>

          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="إغلاق"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {fields.map(([key, value]) => (
              <div
                key={key}
                className="flex items-baseline justify-between gap-3 border-b border-slate-50 pb-2"
              >
                <span className="text-xs text-slate-400">
                  {getArabicFieldName(key)}
                </span>

                <span className="text-sm font-medium text-slate-700">
                  {key === "receiveDateTime" ||
                  key === "createAt" ||
                  key === "orderDate"
                    ? value ?? "—"
                    : formatFieldValue(key, value)}
                </span>
              </div>
            ))}
          </div>

          <PricingTable items={data.pricingItems} />

          <PhotoStrip
            title="صور الموقع"
            photos={data.sitePhotos}
          />

          <PhotoStrip
            title="صور النموذج"
            photos={data.modelPhotos}
          />

          <PhotoStrip
            title="صور مخالفات السلامة"
            photos={data.safetyWastePhotos}
          />

          <LogsTimeline logs={data.logs} />
        </div>
      </div>
    </div>
  );
}

export default RequestDetailsModal;
