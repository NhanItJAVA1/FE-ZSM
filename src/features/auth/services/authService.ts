import api from "../../../services/api/axios.js";
import { tokenStorage } from "../../../services/storage/token.js";
import { normalizeUserRole } from "../../../constants/roles.js";

import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    User,
} from "../types.js";

type LoginResponseRaw = Omit<LoginResponse, "user"> & {
    user: Omit<User, "role"> & {
        role?: User["role"];
        Role?: User["role"];
    };
};

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

        // LƯU CẢ ACCESS TOKEN + REFRESH TOKEN
        tokenStorage.set(
            response.data.accessToken,
            response.data.refreshToken
        );

        return {
            ...response.data,
            user,
        };
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

    logout() {
        tokenStorage.clear();
    },
};