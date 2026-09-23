import axios from "axios";
import { Url } from "../../../function/FunctionApi";


import axiosInstance from "../../../api/apiClient";

export const buildOrdersParams = (filters, filterConfig, { pageIndex, pageSize, searchQuery }) => {
  const params = { PageIndex: pageIndex, PageSize: pageSize };

  filterConfig.forEach(({ key, type }) => {
    const val = filters[key];
    if (val === "" || val === null || val === undefined) return;
    params[key] = type === "date" ? new Date(val).toISOString() : val;
  });

  if (searchQuery && !params.FaultNumber) {
    params.FaultNumber = searchQuery;
  }

  return params;
};

export const fetchOrders = async (params) => {
  const response = await axiosInstance.get("Admin/AllOrders", { params });

  const d = response.data;
  const groups = [
    d.emergencies,
    d.rehabilitationWorks,
    d.maintenances,
    d.constructions,
    d.privateProjects,
  ];

  const data = groups.flatMap((g) => g?.data || []);
  const totalCount = groups.reduce((sum, g) => sum + (g?.totalCount || 0), 0);

  return { data, totalCount };
};