import axios from "axios";
import api from "./axios.js";
import { tokenStorage } from "../storage/token.js";
import { userStorage } from "../storage/user.js";
import { normalizeUserRole } from "../../constants/roles.js";

import type {
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

type RefreshSessionResponseRaw = {
    accessToken?: string;
    AccessToken?: string;
    user?: LoginResponseRaw["user"];
    User?: LoginResponseRaw["user"];
};

const baseURL = import.meta.env.VITE_API_URL || "/api";

function normalizeLoginUser(
    user: LoginResponseRaw["user"]
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
            "/Users/login",
            data
        );

        const user = normalizeLoginUser(response.data.user);

        tokenStorage.set(response.data.accessToken);

        return {
            ...response.data,
            user,
        };
    },

    async refreshSession(): Promise<User> {
        const response = await axios.post<RefreshSessionResponseRaw>(
            `${baseURL}/Users/refresh-token`,
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

        await api.post("/Users/register", {
            username: data.username.trim(),
            email: data.email.trim(),
            password: data.password,
            displayName,
            avatarUrl,
        });
    },

    async logout() {
        try {
            await api.post("/Users/logout");
        } finally {
            tokenStorage.clear();
            userStorage.remove();
        }
    },
};
