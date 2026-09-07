import axios from "axios";
import api from "./axios.js";
import { tokenStorage } from "../storage/token.js";
import { userStorage } from "../storage/user.js";
import { normalizeUserRole } from "../../constants/roles.js";

import type {
    GoogleLoginRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    User,
} from "../../features/auth/types.js";

type LoginResponseRaw = Omit<LoginResponse, "user"> & {
    user: Omit<User, "role"> & {
        role?: User["role"];
        Role?: User["role"];
    };
};

type UserResponseRaw = LoginResponseRaw["user"];

type ExternalLoginResponseRaw = {
    accessToken?: string;
    AccessToken?: string;
    user?: UserResponseRaw;
    User?: UserResponseRaw;
    userId?: number;
    UserId?: number;
    email?: string;
    Email?: string;
    message?: string;
};

type RefreshSessionResponseRaw = {
    accessToken?: string;
    AccessToken?: string;
    user?: UserResponseRaw;
    User?: UserResponseRaw;
};

const baseURL = import.meta.env.VITE_API_URL || "/api";

function normalizeLoginUser(
    user: UserResponseRaw
): User {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: normalizeUserRole(user.role ?? user.Role),
    };
}

export const authService = {

    async login(data: LoginRequest): Promise<LoginResponse> {

        const response = await api.post<LoginResponseRaw>(
            "/auth/login",
            data
        );

        const user = normalizeLoginUser(response.data.user);

        tokenStorage.set(response.data.accessToken);

        return {
            ...response.data,
            user,
        };
    },

    async loginWithGoogle(data: GoogleLoginRequest): Promise<LoginResponse> {
        const response = await api.post<ExternalLoginResponseRaw>(
            "/auth/external-login",
            data
        );

        const accessToken = response.data.accessToken ?? response.data.AccessToken;

        if (!accessToken) {
            throw new Error("Google login response did not include access token.");
        }

        tokenStorage.set(accessToken);

        const user = await resolveAuthUser(response.data);

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

        const response = await axios.post<RefreshSessionResponseRaw>(
            `${baseURL}/auth/refresh-token`,
            {},
            { withCredentials: true }
        );

        const accessToken = response.data.accessToken ?? response.data.AccessToken;
        const user = response.data.user ?? response.data.User;

        if (!accessToken) {
            throw new Error("Refresh token response did not include access token.");
        }

        tokenStorage.set(accessToken);

        if (user) {
            return normalizeLoginUser(user);
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

async function resolveAuthUser(response: ExternalLoginResponseRaw): Promise<User> {
    const inlineUser = response.user ?? response.User;

    if (inlineUser) {
        return normalizeLoginUser(inlineUser);
    }

    const userId = response.userId ?? response.UserId;

    if (!userId) {
        throw new Error("Google login response did not include user data.");
    }

    const userResponse = await api.get<UserResponseRaw>(`/Users/${userId}`);

    return normalizeLoginUser(userResponse.data);
}
