import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsis, faEdit, faTrash, faShieldAlt,
  faLock, faUnlock, faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import profilePlaceholder from "../../Image/team-01.png";
import { Url } from "../../function/FunctionApi";
import { TYPE_BADGE, arType } from "./AccountsConstants";
import ImagePreview from "../../Component/ImagePreview/ImagePreview";

const resolveImageUrl = (raw) => {
  if (!raw) return null;

  const driveMatch = raw.match(/drive.google.com\/file\/d\/([^/]+)/);

  if (driveMatch) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}=w200`;
  }

  if (raw.startsWith("http")) return raw;

  return `${Url}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

export default function AccountRow({
  acc, isLast, togglingId, popup, setPopup,
  onToggle, onDeleteClick, onPermClick,
}) {
  const badgeClass = TYPE_BADGE[acc.userType?.toLowerCase()] || TYPE_BADGE.eng;
  const toggling = togglingId === acc.id;

  return (
    <tr
      className={`transition-colors duration-150 hover:bg-[#F4F6FA]
        ${isLast ? "border-b-0" : "border-b border-[rgba(42,56,91,0.08)]"}
        ${acc.emailConfirmed ? "opacity-100" : "opacity-65"}`}
    >
      {/* user */}
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-3">
          <ImagePreview
            src={resolveImageUrl(acc.userImage) || profilePlaceholder}
            alt={acc.displayName || acc.userName}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = profilePlaceholder;
            }}
            className="w-10 h-10 rounded-full object-cover border-2 border-[rgba(42,56,91,0.08)] shrink-0"
          />
          <div className="min-w-0">
            <div className="font-bold text-sm text-mainColor whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
              {acc.displayName || acc.userName}
            </div>
            <div className="text-xs text-[rgba(42,56,91,0.3)]">@{acc.userName}</div>
          </div>
        </div>
      </td>

      {/* email */}
      <td className="py-3.5 px-5 text-sm text-[rgba(42,56,91,0.3)] max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
        {acc.email}
      </td>

      {/* type badge */}
      <td className="py-3.5 px-5">
        <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${badgeClass}`}>
          {arType(acc.userType)}
        </span>
      </td>

      {/* status */}
      <td className="py-3.5 px-5">
        <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap
          ${acc.emailConfirmed ? "bg-[rgba(34,197,94,0.1)] text-green-500" : "bg-[rgba(239,68,68,0.1)] text-red-500"}`}>
          {acc.emailConfirmed ? "نشط" : "مجمّد"}
        </span>
      </td>

      {/* permissions count */}
      <td className="py-3.5 px-5">
        <button
          onClick={onPermClick}
          className="flex items-center gap-1.5 bg-[rgba(42,56,91,0.08)] border-none rounded-lg px-3 py-1.5 cursor-pointer text-mainColor font-cairo font-semibold text-xs"
        >
          <FontAwesomeIcon icon={faShieldAlt} />
          {acc.permissions?.length ?? 0} صلاحية
        </button>
      </td>

      {/* actions */}
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(acc)}
            disabled={toggling}
            title={acc.emailConfirmed ? "تجميد" : "تفعيل"}
            className={`flex items-center gap-1.5 border-none rounded-lg px-3.5 py-2 font-cairo font-semibold text-xs whitespace-nowrap transition-opacity
              ${acc.emailConfirmed ? "bg-[rgba(239,68,68,0.1)] text-red-500" : "bg-[rgba(34,197,94,0.1)] text-green-500"}
              ${toggling ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <FontAwesomeIcon icon={toggling ? faSpinner : acc.emailConfirmed ? faLock : faUnlock} spin={toggling} />
            {acc.emailConfirmed ? "تجميد" : "تفعيل"}
          </button>

          <div className="relative">
            <button
              data-popup-btn
              onClick={(e) => { e.stopPropagation(); setPopup(popup === acc.id ? null : acc.id); }}
              className="bg-[rgba(42,56,91,0.08)] border-none rounded-lg px-2.5 py-2 cursor-pointer text-mainColor"
            >
              <FontAwesomeIcon icon={faEllipsis} />
            </button>

            {popup === acc.id && (
              <div
                data-popup
                className="absolute top-[calc(100%+6px)] left-0 bg-white rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1.5 z-50 min-w-[140px]"
              >
                <Link
                  to={`/add-account/${acc.id}`}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-md text-mainColor no-underline text-sm font-semibold hover:bg-[rgba(42,56,91,0.08)]"
                >
                  <FontAwesomeIcon icon={faEdit} /> تعديل
                </Link>

                <button
                  onClick={onPermClick}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-md text-mainColor bg-transparent border-none w-full cursor-pointer font-cairo text-sm font-semibold hover:bg-[rgba(42,56,91,0.08)]"
                >
                  <FontAwesomeIcon icon={faShieldAlt} /> الصلاحيات
                </button>

                <button
                  onClick={onDeleteClick}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-md text-red-500 bg-transparent border-none w-full cursor-pointer font-cairo text-sm font-semibold hover:bg-[rgba(239,68,68,0.1)]"
                >
                  <FontAwesomeIcon icon={faTrash} /> حذف
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}