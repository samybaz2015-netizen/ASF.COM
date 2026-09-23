import { useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInbox, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

import * as api from "../../../services/ExecutionTrackingApi";

/**
 * ما يمنع ظهور أوامر العمل في السلال، ومعه الإجراء الذي يحلّه.
 *
 * أكثر ما يربك المستخدم أن يعرّف السلال ثم لا يراها. السبب أن المسار ما زال
 * مسودة، فتُقال العبارة صراحةً ويُوضع زر الاعتماد هنا بدل إرساله يبحث عنه في
 * شاشة أخرى.
 */
export function DepartmentNotice({ section, onDone }) {
  const [working, setWorking] = useState(false);

  const fail = (err, fallback) =>
    Swal.fire({ icon: "error", title: "تعذّر التنفيذ", text: api.errorMessage(err, fallback) });

  const publish = async () => {
    const confirmed = await Swal.fire({
      icon: "question",
      title: "اعتماد مسار هذا القسم؟",
      html:
        `سيصير المسار بسلاله الـ <b>${section.draftBasketsCount}</b> هو المعتمد، ` +
        "وتدخل أوامر العمل القائمة أول سلة مباشرةً.",
      showCancelButton: true,
      confirmButtonText: "اعتماد",
      cancelButtonText: "إلغاء",
    });
    if (!confirmed.isConfirmed) return;

    setWorking(true);
    try {
      await api.publishDepartmentWorkflow(section.draftWorkflowId, "اعتُمد من شاشة المتابعة");
      Swal.fire({ icon: "success", title: "اعتُمد المسار", timer: 1600, showConfirmButton: false });
      await onDone();
    } catch (err) {
      fail(err, "تعذّر اعتماد المسار.");
    } finally {
      setWorking(false);
    }
  };

  const place = async (includeUnassigned) => {
    setWorking(true);
    try {
      const placed = await api.placeUnplaced(section.departmentId, includeUnassigned);
      if (placed === 0) {
        Swal.fire({
          icon: "info",
          title: "لم يُوضع شيء",
          text: includeUnassigned
            ? "لا توجد أوامر عمل خارج السلال لهذا القسم."
            : "أوامر العمل المتبقّية لا تحمل رقم هذا العقد. جرّب «ضمّ ما بلا رقم عقد».",
        });
      } else {
        Swal.fire({ icon: "success", title: `وُضع ${placed} أمر عمل`, timer: 1800, showConfirmButton: false });
      }
      await onDone();
    } catch (err) {
      fail(err, "تعذّر وضع أوامر العمل.");
    } finally {
      setWorking(false);
    }
  };

  // مسودة غير معتمدة — أهم سبب، ويُعرض وحده.
  if (section.hasUnpublishedDraft && !section.hasPublishedWorkflow) {
    return (
      <div className="et-notice et-notice--warn">
        <FontAwesomeIcon icon={faTriangleExclamation} />
        <div>
          <strong>سلال هذا القسم لم تُعتمد بعد</strong>
          <span>
            عرّفت {section.draftBasketsCount} سلة في المسودة. لا تسري على أوامر العمل حتى تُعتمد.
          </span>
        </div>
        <button type="button" className="asf-btn asf-btn--primary" onClick={publish} disabled={working}>
          {working ? "…" : "اعتماد المسار الآن"}
        </button>
      </div>
    );
  }

  if (!section.hasPublishedWorkflow) {
    return (
      <div className="et-notice">
        <FontAwesomeIcon icon={faInbox} />
        <div>
          <strong>لا سلال لهذا القسم</strong>
          <span>عرّف سلاله من إعدادات العقد ← الأقسام والسلال، ثم اعتمدها.</span>
        </div>
      </div>
    );
  }

  if (section.unplacedWorkOrders > 0) {
    return (
      <div className="et-notice et-notice--warn">
        <FontAwesomeIcon icon={faTriangleExclamation} />
        <div>
          <strong>{section.unplacedWorkOrders} أمر عمل خارج السلال</strong>
          <span>أُنشئت قبل تعريف المسار، فلم تدخل أي سلة.</span>
        </div>
        <button type="button" className="asf-btn asf-btn--primary" onClick={() => place(false)} disabled={working}>
          ضعها في أول سلة
        </button>
        <button
          type="button"
          className="asf-btn"
          onClick={() => place(true)}
          disabled={working}
          title="يضمّ أوامر العمل التي لا تحمل رقم عقد"
        >
          ضمّ ما بلا رقم عقد
        </button>
      </div>
    );
  }

  // الحالة السليمة لا تحتاج شريطاً: الجدول نفسه يقول إن كل شيء في مكانه،
  // وشريط أخضر دائم يزحم الشاشة بلا معلومة.
  return null;
}
