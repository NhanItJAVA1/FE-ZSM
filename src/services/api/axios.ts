import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ROUTES } from "../../constants/routes.js";
import { normalizeUserRole } from "../../constants/roles.js";
import { tokenStorage } from "../storage/token.js";
import { userStorage } from "../storage/user.js";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function flushRefreshQueue(token: string | null) {
    refreshQueue.forEach((callback) => callback(token));
    refreshQueue = [];
}

function clearSession() {
    tokenStorage.clear();
    userStorage.remove();
}

function isAuthRequest(url?: string) {
    return (
        url?.includes("/Users/login") ||
        url?.includes("/Users/register") ||
        url?.includes("/Users/refresh")
    );
}

async function refreshAccessToken(): Promise<string> {
    const refreshToken = tokenStorage.getRefreshToken();

    if (!refreshToken) {
        throw new Error("Refresh token not found");
    }

    const { data } = await axios.post<{
        accessToken: string;
        user?: {
            id: number;
            username: string;
            email: string;
            displayName: string;
            avatarUrl: string | null;
            Role?: string;
            role?: string;
        };
    }>(`${baseURL}/Users/refresh-token`, { refreshToken });

    tokenStorage.set(data.accessToken, refreshToken);

    if (data.user) {
        userStorage.set({
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            displayName: data.user.displayName,
            avatarUrl: data.user.avatarUrl,
            role: normalizeUserRole(data.user.role ?? data.user.Role),
        });
    }

    return data.accessToken;
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
                return api(originalRequest);
            } catch (refreshError) {
                flushRefreshQueue(null);
                clearSession();

                if (window.location.pathname !== ROUTES.login) {
                    window.location.href = ROUTES.login;
                }

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
