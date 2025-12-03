import axios from "axios";

const API_BASE_URL = "http://localhost:5000"; // change if needed

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};
