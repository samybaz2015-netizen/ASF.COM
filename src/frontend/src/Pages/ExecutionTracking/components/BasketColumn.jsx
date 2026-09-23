import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronLeft } from "@fortawesome/free-solid-svg-icons";

import * as api from "../../../services/ExecutionTrackingApi";

/** مفتاح المسار في الواجهة لكل نوع مشروع، ليفتح أمر العمل في صفحته. */
const ROUTE_BY_TYPE = {
  Construction: "construction",
  Maintenance: "maintenance",
  Emergency: "emergency",
  NewProject: "rehabilitationWorks",
  PrivateProject: "privateproject",
};

/**
 * عمود سلة: الاسم والعدد، وأوامر العمل بداخلها عند الفتح.
 *
 * أوامر العمل تُحمَّل عند أول فتح فقط، فلا تُجلب بطاقات كل السلال دفعةً واحدة.
 */
export function BasketColumn({ departmentId, basket }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next || items !== null) return;

    setLoading(true);
    setError(null);
    try {
      setItems(await api.fetchBasketWorkOrders(departmentId, basket.basketStableKey));
    } catch (err) {
      setError(api.errorMessage(err, "تعذّر تحميل أوامر العمل."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className={"et-col" + (basket.workOrdersCount > 0 ? "" : " et-col--empty")}>
      <button type="button" className="et-col__head" onClick={toggle}>
        <span className="et-col__order">{basket.order}</span>
        <span className="et-col__name">{basket.basketName}</span>
        <span className="et-col__count">{basket.workOrdersCount}</span>
        <FontAwesomeIcon icon={open ? faChevronDown : faChevronLeft} className="et-col__chev" />
      </button>

      {open && (
        <div className="et-col__body">
          {loading && <p className="et-empty et-empty--sm">جارٍ التحميل…</p>}
          {error && <p className="et-error">{error}</p>}

          {!loading && !error && items?.length === 0 && (
            <p className="et-empty et-empty--sm">لا أوامر عمل.</p>
          )}

          {items?.map((item) => {
            const route = ROUTE_BY_TYPE[item.projectTypeCode];
            const card = (
              <>
                <span className="et-card__num">{item.orderNumber || `#${item.workOrderId}`}</span>
                {item.title && <span className="et-card__title">{item.title}</span>}
                <span className="et-card__meta">
                  {item.district && <span>{item.district}</span>}
                  {item.contractor && <span>{item.contractor}</span>}
                  <span>منذ {item.daysInBasket} يوم</span>
                </span>
                {item.mandatoryTasksTotal > 0 && (
                  <span
                    className={
                      "et-card__tasks" +
                      (item.mandatoryTasksDone >= item.mandatoryTasksTotal
                        ? " et-card__tasks--done"
                        : "")
                    }
                  >
                    المهام الإلزامية {item.mandatoryTasksDone}/{item.mandatoryTasksTotal}
                  </span>
                )}
              </>
            );

            return route ? (
              <Link
                key={`${item.projectTypeCode}-${item.workOrderId}`}
                className="et-card"
                to={`/project/${route}/${item.workOrderId}`}
              >
                {card}
              </Link>
            ) : (
              <div key={`${item.projectTypeCode}-${item.workOrderId}`} className="et-card">
                {card}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
