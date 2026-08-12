import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ROUTES } from "../../constants/routes.js";
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

    const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${baseURL}/Users/refresh`,
        { refreshToken }
    );

    tokenStorage.set(data.accessToken, data.refreshToken);
    return data.accessToken;
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

        const data = axiosError.response?.data as
            | {
                  message?: string;
                  title?: string;
                  detail?: string;
                  errors?: Record<string, string[]>;
              }
            | string
            | undefined;
        const validationMessage =
            typeof data === "object" && data?.errors
                ? Object.values(data.errors).flat().join("\n")
                : null;
        const message =
            validationMessage ||
            (typeof data === "object" && (data.message || data.detail || data.title)) ||
            (typeof data === "string" ? data : axiosError.message);

        return Promise.reject(new Error(message));
    }
);

export default api;
