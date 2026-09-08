import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ROUTES } from "../../constants/routes.js";
import { isUnrecoverableRefreshError, refreshAccessToken } from "./authSession.js";
import { tokenStorage } from "../storage/token.js";
import { userStorage } from "../storage/user.js";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];
let hasRedirectedToLogin = false;

function flushRefreshQueue(token: string | null) {
    refreshQueue.forEach((callback) => callback(token));
    refreshQueue = [];
}

function clearSession() {
    tokenStorage.clear();
    userStorage.remove();
}

function redirectToLoginOnce() {
    if (hasRedirectedToLogin || window.location.pathname === ROUTES.login) {
        return;
    }

    hasRedirectedToLogin = true;
    window.location.href = ROUTES.login;
}

function isAuthRequest(url?: string) {
    return (
        url?.includes("/auth/login") ||
        url?.includes("/auth/register") ||
        url?.includes("/auth/refresh-token") ||
        url?.includes("/auth/external-login") ||
        url?.includes("/auth/logout")
    );
}

function parseAxiosErrorMessage(axiosError: AxiosError): string {
    const data = axiosError.response?.data as
        | {
              message?: string;
              title?: string;
              detail?: string;
              errors?: Record<string, string[]>;
          }
        | string
        | undefined;

    if (typeof data === "object" && data !== null && data.errors) {
        const validationMessages = Object.values(data.errors).flat();
        if (validationMessages.length > 0) {
            return validationMessages.join("\n");
        }
    }

    if (typeof data === "object" && data !== null) {
        if (data.message) return data.message;
        if (data.detail) return data.detail;
        if (data.title) return data.title;
    }

    if (typeof data === "string" && data.trim()) {
        return data;
    }

    return axiosError.message || "Đã xảy ra lỗi không xác định.";
}

api.interceptors.request.use(
    (config) => {
        const token = tokenStorage.get();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
        if (!axios.isAxiosError(error)) {
            return Promise.reject(error);
        }

        const axiosError = error as AxiosError;
        const originalRequest = axiosError.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        if (
            axiosError.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !isAuthRequest(originalRequest.url)
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push((token) => {
                        if (!token) {
                            reject(error);
                            return;
                        }

                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newToken = await refreshAccessToken();
                flushRefreshQueue(newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                hasRedirectedToLogin = false;
                return api(originalRequest);
            } catch (refreshError) {
                flushRefreshQueue(null);
                clearSession();

                if (isUnrecoverableRefreshError(refreshError)) {
                    tokenStorage.markLoggedOut();
                }

                redirectToLoginOnce();

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (
            axiosError.response?.status === 403 &&
            originalRequest?.url?.includes("/Records/admin/")
        ) {
            return Promise.reject(
                new Error(
                    "Tài khoản hiện tại không có quyền admin. Hãy đăng xuất và đăng nhập lại bằng user `admin` sau khi BE đã restart."
                )
            );
        }

        return Promise.reject(new Error(parseAxiosErrorMessage(axiosError)));
    }
);

export default api;
