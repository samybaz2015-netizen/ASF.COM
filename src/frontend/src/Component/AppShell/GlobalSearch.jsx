import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faSpinner } from "@fortawesome/free-solid-svg-icons";

import { searchWorkOrderAcrossTypes, WORK_ORDER_TYPES } from "../../services/DailyExecutionApi";
import { useDropdown } from "./useDropdown";

/**
 * البحث السريع في الهيدر — يبحث عن أمر العمل برقمه عبر الأنواع المدعومة.
 * الخلفية تفلتر بالصلاحية، فلا تظهر نتائج خارج نطاق المستخدم.
 */
export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { open, setOpen, close, containerRef } = useDropdown();

  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const requestId = useRef(0);

  const runSearch = useCallback(
    async (event) => {
      event.preventDefault();
      const trimmed = term.trim();
      if (!trimmed) return;

      const current = ++requestId.current;
      setSearching(true);
      setOpen(true);

      try {
        const hits = await searchWorkOrderAcrossTypes(trimmed);
        if (current === requestId.current) setResults(hits);
      } catch {
        if (current === requestId.current) setResults([]);
      } finally {
        if (current === requestId.current) setSearching(false);
      }
    },
    [term, setOpen]
  );

  const openHit = (hit) => {
    close();
    setTerm("");
    setResults([]);
    navigate(`/daily-execution?type=${hit.type}&orderId=${hit.workOrder.id ?? hit.workOrder.orderId}`);
  };

  return (
    <div className="ah-search" ref={containerRef}>
      <form onSubmit={runSearch} className="ah-search__form" role="search">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="ah-search__icon" />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={t("header.quickSearchPlaceholder")}
          aria-label={t("common.search")}
        />
        {searching && <FontAwesomeIcon icon={faSpinner} spin className="ah-search__spinner" />}
      </form>

      {open && (searching || results.length > 0 || term.trim()) && (
        <div className="ah-menu ah-menu--search" role="listbox">
          {searching && <p className="ah-menu__empty">{t("header.searching")}</p>}

          {!searching && results.length === 0 && (
            <p className="ah-menu__empty">{t("common.noResults")}</p>
          )}

          {!searching &&
            results.map((hit) => (
              <button
                key={hit.type}
                type="button"
                className="ah-menu__item ah-menu__item--stack"
                role="option"
                onClick={() => openHit(hit)}
              >
                <span className="ah-notif__title">
                  {hit.workOrder.orderId ?? hit.workOrder.id}
                </span>
                <span className="ah-notif__time">
                  {WORK_ORDER_TYPES[hit.type]?.label || hit.type}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
