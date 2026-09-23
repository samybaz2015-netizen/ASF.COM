import React, { useEffect, useState } from "react";
import axios from "axios";
import { Url } from "../../function/FunctionApi";

function OfficeSelect({
  selectedOffice,
  onOfficeChange,
  global = false,
  branchId,
}) {
  const localBranchId = localStorage.getItem("branchId") || 1;

  // لو branchId اتبعت من الأب نستخدمه،
  // ولو مش اتبعت نرجع لسلوك الـEngineer القديم
  const effectiveBranchId =
    branchId !== undefined ? branchId : localBranchId;

  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Admin ولسه مختارش فرع
    if (!global && !effectiveBranchId) {
      setOffices([]);
      return;
    }

    const fetchOffices = async () => {
      try {
        setLoading(true);

        const uri =
          global === true
            ? `${Url}Office`
            : `${Url}Office/offices/${effectiveBranchId}`;

        const response = await axios.get(uri);

        if (
          response.data &&
          response.data.statusCode === 200
        ) {
          setOffices(response.data.data || []);
        } else {
          setOffices([]);
        }
      } catch (error) {
        console.error("Error fetching offices:", error);
        setOffices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOffices();
  }, [global, effectiveBranchId]);

  return (
    <div className="groub_fe">
      <label>الميسكتب</label>

      <select
        name="Office"
        value={selectedOffice || ""}
        onChange={onOfficeChange}
        disabled={loading || (!global && !effectiveBranchId)}
      >
        <option value="">
          {!effectiveBranchId && !global
            ? "اختر الفرع أولًا"
            : loading
            ? "جاري تحميل المكاتب..."
            : "اختر المكتب"}
        </option>

        {offices.map((office) => (
          <option
            key={office.id}
            value={office.name}
          >
            {office.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default OfficeSelect;