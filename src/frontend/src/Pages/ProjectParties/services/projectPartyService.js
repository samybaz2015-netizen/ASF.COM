import axiosInstance from "../../../api/apiClient";

export const getProjectParties = async ({ type, branchId } = {}) => {
  const params = {};
  if (type) params.type = type;
  if (branchId) params.branchId = branchId;

  const res = await axiosInstance.get("/ProjectParty", { params });
  return res.data?.data || [];
};

export const getProjectPartyById = async (id) => {
  const res = await axiosInstance.get(`/ProjectParty/${id}`);
  return res.data?.data;
};

export const createProjectParty = (payload) =>
  axiosInstance.post("/ProjectParty", payload);

export const updateProjectParty = (id, payload) =>
  axiosInstance.put(`/ProjectParty/${id}`, payload);

export const deleteProjectParty = (id) =>
  axiosInstance.delete(`/ProjectParty/${id}`);