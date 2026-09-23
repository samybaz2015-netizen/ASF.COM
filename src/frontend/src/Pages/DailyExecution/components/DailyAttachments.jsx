import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faFileLines,
  faTrash,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

const PHOTO_CATEGORIES = [
  { value: "Before", label: "قبل التنفيذ" },
  { value: "During", label: "أثناء التنفيذ" },
  { value: "After", label: "بعد التنفيذ" },
  { value: "Other", label: "أخرى" },
];

/** صور التنفيذ اليومية — البند 7. */
export function ExecutionPhotos({
  photos,
  onAdd,
  onUpdate,
  onRemove,
  items,
  required,
  disabled,
}) {
  const inputRef = useRef(null);

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length) onAdd(files);
    event.target.value = "";
  };

  return (
    <section className="de-card">
      <h2 className="de-card__title">
        <FontAwesomeIcon icon={faCamera} />
        صور التنفيذ اليومية
        {required && <span className="de-required">إلزامية</span>}
      </h2>

      {required && photos.length === 0 && (
        <p className="de-warning">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          أدخلت كمية تنفيذ لليوم — لا يمكن الإرسال بدون إرفاق صورة واحدة على
          الأقل.
        </p>
      )}

      <button
        type="button"
        className="de-btn de-btn--ghost"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        <FontAwesomeIcon icon={faCamera} />
        إضافة صور
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFiles}
      />

      {photos.length > 0 && (
        <div className="de-photos">
          {photos.map((photo) => (
            <figure key={photo.id} className="de-photo">
              <img
                src={photo.previewUrl}
                alt={photo.description || photo.file.name}
              />

              <figcaption>
                <input
                  type="text"
                  placeholder="وصف الصورة"
                  value={photo.description}
                  disabled={disabled}
                  onChange={(e) =>
                    onUpdate(photo.id, { description: e.target.value })
                  }
                />

                <select
                  value={photo.category}
                  disabled={disabled}
                  onChange={(e) =>
                    onUpdate(photo.id, { category: e.target.value })
                  }
                >
                  {PHOTO_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <select
                  value={photo.pricingItemId || ""}
                  disabled={disabled}
                  onChange={(e) =>
                    onUpdate(photo.id, {
                      pricingItemId: e.target.value || null,
                    })
                  }
                >
                  <option value="">غير مرتبطة ببند</option>
                  {items.map((item) => (
                    <option key={item.pricingItemId} value={item.pricingItemId}>
                      {item.itemNumber} — {item.description?.slice(0, 40)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="de-icon-btn de-icon-btn--danger"
                  onClick={() => onRemove(photo.id)}
                  disabled={disabled}
                  aria-label="حذف الصورة"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}

/** نماذج الإشراف — البند 8. */
export function SupervisionForms({
  forms,
  onAdd,
  onUpdate,
  onRemove,
  disabled,
}) {
  const inputRef = useRef(null);

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length) onAdd(files);
    event.target.value = "";
  };

  return (
    <section className="de-card">
      <h2 className="de-card__title">
        <FontAwesomeIcon icon={faFileLines} />
        نماذج الإشراف
      </h2>

      <p className="de-hint">
        إلزامية النموذج حسب نوع العمل والعقد والمرحلة تُطبَّق في الخلفية — غير
        مفعّلة بعد. راجع <code>docs/daily-execution-update.md</code> القسم 3.
      </p>

      <button
        type="button"
        className="de-btn de-btn--ghost"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        <FontAwesomeIcon icon={faFileLines} />
        إرفاق نموذج
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        multiple
        hidden
        onChange={handleFiles}
      />

      {forms.length > 0 && (
        <table className="de-forms">
          <thead>
            <tr>
              <th>الملف</th>
              <th>اسم النموذج</th>
              <th>نوع النموذج</th>
              <th>تاريخ النموذج</th>
              <th>ملاحظات</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.id}>
                <td className="de-mono">{form.file.name}</td>
                <td>
                  <input
                    type="text"
                    value={form.formName}
                    disabled={disabled}
                    onChange={(e) =>
                      onUpdate(form.id, { formName: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={form.formType}
                    disabled={disabled}
                    onChange={(e) =>
                      onUpdate(form.id, { formType: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={form.formDate}
                    disabled={disabled}
                    onChange={(e) =>
                      onUpdate(form.id, { formDate: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={form.notes}
                    disabled={disabled}
                    onChange={(e) =>
                      onUpdate(form.id, { notes: e.target.value })
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="de-icon-btn de-icon-btn--danger"
                    onClick={() => onRemove(form.id)}
                    disabled={disabled}
                    aria-label="حذف النموذج"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
