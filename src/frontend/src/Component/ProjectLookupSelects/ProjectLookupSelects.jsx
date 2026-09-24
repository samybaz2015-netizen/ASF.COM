import React, {
  useEffect,
  useState,
  useCallback,
} from "react";
import axiosInstance from "../../api/apiClient";

const partiesCacheByBranch = {};
const partiesPromiseByBranch = {};

const ownersCacheByBranch = {};
const ownersPromiseByBranch = {};

function fetchParties(branchId) {
  if (!branchId) {
    return Promise.resolve([]);
  }

  if (partiesCacheByBranch[branchId]) {
    return Promise.resolve(
      partiesCacheByBranch[branchId]
    );
  }

  if (!partiesPromiseByBranch[branchId]) {
    partiesPromiseByBranch[branchId] = axiosInstance
      .get("/ProjectParty", {
        params: { branchId },
      })
      .then((res) => {
        const data = Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        partiesCacheByBranch[branchId] = data;

        return data;
      })
      .catch((err) => {
        partiesPromiseByBranch[branchId] = null;
        throw err;
      });
  }

  return partiesPromiseByBranch[branchId];
}

function fetchOwners(branchId) {
  if (!branchId) {
    return Promise.resolve([]);
  }

  if (ownersCacheByBranch[branchId]) {
    return Promise.resolve(
      ownersCacheByBranch[branchId]
    );
  }

  if (!ownersPromiseByBranch[branchId]) {
    ownersPromiseByBranch[branchId] = axiosInstance
      .get("/ProjectOwner", {
        params: { branchId },
      })
      .then((res) => {
        const data = Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        ownersCacheByBranch[branchId] = data;

        return data;
      })
      .catch((err) => {
        ownersPromiseByBranch[branchId] = null;
        throw err;
      });
  }

  return ownersPromiseByBranch[branchId];
}

export function clearLookupsCache() {
  Object.keys(partiesCacheByBranch).forEach(
    (key) => delete partiesCacheByBranch[key]
  );

  Object.keys(partiesPromiseByBranch).forEach(
    (key) => delete partiesPromiseByBranch[key]
  );

  Object.keys(ownersCacheByBranch).forEach(
    (key) => delete ownersCacheByBranch[key]
  );

  Object.keys(ownersPromiseByBranch).forEach(
    (key) => delete ownersPromiseByBranch[key]
  );
}

function useAsyncList(fetcher, enabled = true) {
  const [state, setState] = useState({
    data: [],
    loading: false,
    error: "",
  });

  useEffect(() => {
    let mounted = true;

    if (!enabled) {
      setState({
        data: [],
        loading: false,
        error: "",
      });

      return () => {
        mounted = false;
      };
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: "",
    }));

    fetcher()
      .then((data) => {
        if (mounted) {
          setState({
            data,
            loading: false,
            error: "",
          });
        }
      })
      .catch(() => {
        if (mounted) {
          setState({
            data: [],
            loading: false,
            error: "تعذر تحميل البيانات",
          });
        }
      });

    return () => {
      mounted = false;
    };
  }, [fetcher, enabled]);

  return state;
}

function BaseSelect({
  label,
  name,
  value,
  onChange,
  options,
  loading,
  error,
  valueKey = "name",
}) {
  return (
    <div className="groub_fe">
      <label>{label}</label>

      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={loading}
      >
        <option value="">
          {loading
            ? "جاري التحميل..."
            : error
            ? "تعذر تحميل البيانات"
            : `اختر ${label}`}
        </option>

        {options.map((item, index) => {
          const optionValue =
            typeof valueKey === "function"
              ? valueKey(item)
              : item?.[valueKey];

          return (
            <option
              key={item?.id ?? index}
              value={optionValue ?? ""}
            >
              {item?.name ?? optionValue ?? ""}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function PartySelect({
  type,
  label,
  name,
  value,
  onChange,
  valueKey = "name",
  branchId: branchIdProp,
}) {
  // لو الـbranchId جاي من الأب نستخدمه.
  // لو undefined نستخدم localStorage عشان الـEngineer.
  const branchId =
    branchIdProp !== undefined
      ? branchIdProp
      : localStorage.getItem("branchId") || 1;

  const fetcher = useCallback(
    () => fetchParties(branchId),
    [branchId]
  );

  const { data, loading, error } =
    useAsyncList(fetcher, !!branchId);

  const filtered = data.filter(
    (party) => party.type === type
  );

  return (
    <BaseSelect
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      options={filtered}
      loading={loading}
      error={error}
      valueKey={valueKey}
    />
  );
}

export function OwnerSelect({
  label = "مالك المشروع",
  name = "ProjectOwner",
  value,
  onChange,
  valueKey = "name",
  branchId: branchIdProp,
}) {
  // نفس الفكرة:
  // Admin → branchId من formData
  // Engineer → localStorage
  const branchId =
    branchIdProp !== undefined
      ? branchIdProp
      : localStorage.getItem("branchId") || 1;

  const fetcher = useCallback(
    () => fetchOwners(branchId),
    [branchId]
  );

  const { data, loading, error } =
    useAsyncList(fetcher, !!branchId);

  return (
    <BaseSelect
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      options={data}
      loading={loading}
      error={error}
      valueKey={valueKey}
    />
  );
}