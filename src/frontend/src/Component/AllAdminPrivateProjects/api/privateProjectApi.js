import axios from "../../../api/apiClient";
import { domain } from "../../../function/FunctionApi";

const BASE_URL = domain;

export const privateProjectApi = {
  getAll: async (params = {}) => {
    const response = await axios.get(
      `${BASE_URL}/api/Admin/AllPrivateOrders`,
      { params }
    );

    return response.data;
  },

  getAllPrivateProjects: async () => {
    const response = await axios.get(
      `${BASE_URL}/api/PrivateProject/get-all-privateProjects`
    );

    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(
      `${BASE_URL}/api/PrivateProject/get-privateProject/${id}`
    );

    return response.data;
  },

  create: async (formData) => {
    const response = await axios.post(
      `${BASE_URL}/api/PrivateProject/CreatePrivateProject`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },

  update: async (formData) => {
    const response = await axios.put(
      `${BASE_URL}/api/PrivateProject/update`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(
      `${BASE_URL}/api/PrivateProject/${id}`
    );

    return response.data;
  },

  deleteModelPhoto: async (payload) => {
    const response = await axios.delete(
      `${BASE_URL}/api/PrivateProject/model-photo`,
      {
        data: payload,
      }
    );

    return response.data;
  },

  deleteSitePhoto: async (payload) => {
    const response = await axios.delete(
      `${BASE_URL}/api/PrivateProject/site-photo`,
      {
        data: payload,
      }
    );

    return response.data;
  },

  deleteSafetyPhoto: async (payload) => {
    const response = await axios.delete(
      `${BASE_URL}/api/PrivateProject/safety-photo`,
      {
        data: payload,
      }
    );

    return response.data;
  },
};