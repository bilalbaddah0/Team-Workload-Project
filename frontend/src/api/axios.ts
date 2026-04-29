import axios from "axios";
import { clearAuth, getToken } from "../utils/auth";

const api = axios.create({
    baseURL: "https://localhost:7103/api",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearAuth();
        }

        return Promise.reject(error);
    }
);

export default api;