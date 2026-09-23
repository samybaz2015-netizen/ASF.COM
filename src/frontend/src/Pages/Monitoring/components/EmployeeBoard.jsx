import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faUserClock } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";

import { fmtDate, num } from "../utils/format";

/**
 * مؤشّرات الموظفين.
 *
 * ما يُقاس هو الأثر على أوامر العمل: نقلٌ بين المراحل، وإنجاز مهامّ داخلها،
 * وعدد أوامر العمل المختلفة التي لمسها. لا «عدد مرات الدخول» — فهو يقيس فتح
 * الشاشة لا العمل.
 *
 * النشاط محسوب على أوامر العمل الظاهرة وحدها، فلا يُنسب لموظّف عملٌ على ما لا
 * يحقّ للقارئ رؤيته.
 */
export function EmployeeBoard({ employees }) {
  const rows = employees || [];

  const exportRows = () => {
    const header = [
      "الموظف", "نقل بين المراحل", "مهام منجزة", "أوامر عمل لمسها",
      "إجمالي الإجراءات", "آخر نشاط",
    ];

    const body = rows.map((e) => [
      e.userName || e.userId,
      e.moves,
      e.tasksDone,
      e.ordersTouched,
      e.totalActions,
      fmtDate(e.lastActivityAt),
    ]);

    const sheet = XLSX.utils.aoa_to_sheet([header, ...body]);
    sheet["!cols"] = header.map(() => ({ wch: 18 }));

    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "مؤشرات الموظفين");
    XLSX.writeFile(book, "مؤشرات-الموظفين.xlsx");
  };

  const top = Math.max(...rows.map((e) => e.totalActions), 1);

  return (
    <section className="asf-panel">
      <header className="asf-panel__head">
        <div>
          <h3>مؤشّرات الموظفين</h3>
          <p>التفاعل والتحديثات على أوامر العمل خلال الفترة المختارة.</p>
        </div>
        <button
          type="button"
          className="asf-btn asf-btn--sm"
          onClick={exportRows}
          disabled={rows.length === 0}
        >
          <FontAwesomeIcon icon={faFileExcel} /> تصدير إكسل
        </button>
      </header>

      <div className="asf-panel__body">
        {rows.length === 0 ? (
          <div className="asf-empty">
            <FontAwesomeIcon icon={faUserClock} />
            <strong>لا نشاط مسجّل في هذه الفترة</strong>
            <span>وسّع فترة النشاط، أو تأكّد أن أوامر العمل تتحرّك بين المراحل.</span>
          </div>
        ) : (
          <div className="asf-table__scroll">
            <table className="asf-table">
              <thead>
                <tr>
                  <th>الموظف</th>
                  <th style={{ width: 150 }}>النشاط</th>
                  <th style={{ width: 90 }}>نقل</th>
                  <th style={{ width: 90 }}>مهام</th>
                  <th style={{ width: 110 }}>أوامر لمسها</th>
                  <th style={{ width: 110 }}>آخر نشاط</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.userId}>
                    <td><b>{e.userName || e.userId}</b></td>
                    <td>
                      <div className="mon-mini" title={`${num(e.totalActions)} إجراء`}>
                        <span style={{ width: `${(e.totalActions / top) * 100}%` }} />
                      </div>
                    </td>
                    <td className="asf-num">{num(e.moves)}</td>
                    <td className="asf-num">{num(e.tasksDone)}</td>
                    <td className="asf-num">{num(e.ordersTouched)}</td>
                    <td className="asf-num">{fmtDate(e.lastActivityAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default EmployeeBoard;
