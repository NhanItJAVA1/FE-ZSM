import api from "./axios.js";
import { tokenStorage } from "../storage/token.js";
import { userStorage } from "../storage/user.js";
import {
    fetchAuthUser,
    getAccessToken,
    isUnrecoverableRefreshError,
    normalizeAuthUser,
    refreshAccessToken,
    type UserResponseRaw,
} from "./authSession.js";

import type {
    GoogleLoginRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    User,
} from "../../features/auth/types.js";

type LoginResponseRaw = Omit<LoginResponse, "user"> & {
    user: UserResponseRaw;
};

type ExternalLoginResponseRaw = {
    accessToken: string;
    user?: UserResponseRaw;
    userId?: number;
    email?: string;
    message?: string;
};

export const authService = {

    async login(data: LoginRequest): Promise<LoginResponse> {

        const response = await api.post<LoginResponseRaw>(
            "/auth/login",
            data
        );

        const user = normalizeAuthUser(response.data.user);
        const accessToken = getAccessToken(response.data);

        tokenStorage.set(accessToken);

        return {
            ...response.data,
            accessToken,
            user,
        };
    },

    async loginWithGoogle(data: GoogleLoginRequest): Promise<LoginResponse> {
        const response = await api.post<ExternalLoginResponseRaw>(
            "/auth/external-login",
            data
        );

        const accessToken = getAccessToken(response.data);
        const user = await resolveAuthUser(response.data, accessToken);

        tokenStorage.set(accessToken);

        return {
            message: response.data.message ?? "Đăng nhập Google thành công.",
            accessToken,
            user,
        };
    },

    async refreshSession(): Promise<User> {
        if (tokenStorage.wasLoggedOut()) {
            throw new Error("User logged out explicitly.");
        }

        try {
            await refreshAccessToken();
        } catch (error) {
            if (isUnrecoverableRefreshError(error)) {
                tokenStorage.markLoggedOut();
            }

            throw error;
        }

        const storedUser = userStorage.get();

        if (!storedUser) {
            throw new Error("Refresh token response did not include user data.");
        }

        return storedUser;
    },

    async register(data: RegisterRequest): Promise<void> {

        const displayName = data.displayName.trim();

        const avatarUrl =
            data.avatarUrl.trim() ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                displayName
            )}&background=111827&color=fff`;

        await api.post("/auth/register", {
            username: data.username.trim(),
            email: data.email.trim(),
            password: data.password,
            displayName,
            avatarUrl,
        });
    },

    async logout() {
        try {
            await api.post("/auth/logout", {});
        } finally {
            tokenStorage.clear();
            tokenStorage.markLoggedOut();
            userStorage.remove();
        }
    },
};

async function resolveAuthUser(
    response: ExternalLoginResponseRaw,
    accessToken: string
): Promise<User> {
    const inlineUser = response.user;

    if (inlineUser) {
        return normalizeAuthUser(inlineUser);
    }

    const userId = response.userId;

    if (!userId) {
        throw new Error("Google login response did not include user data.");
    }

    return fetchAuthUser(userId, accessToken);
}
