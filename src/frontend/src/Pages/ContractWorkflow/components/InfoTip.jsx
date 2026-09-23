import { useId, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

/**
 * علامة معلومات ⓘ تشرح الغرض من الحقل أو السلة.
 *
 * تفتح بالمرور وبالتركيز معاً، ليصل إليها مستخدم لوحة المفاتيح مثل مستخدم
 * الفأرة.
 */
export function InfoTip({ text, label = "شرح" }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  if (!text) return null;

  return (
    <span className="cw-tip">
      <button
        type="button"
        className="cw-tip__btn"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <FontAwesomeIcon icon={faCircleInfo} />
      </button>

      {open && (
        <span role="tooltip" id={id} className="cw-tip__bubble">
          {text}
        </span>
      )}
    </span>
  );
}
