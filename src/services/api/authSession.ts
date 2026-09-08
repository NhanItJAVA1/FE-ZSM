import axios from "axios";
import { normalizeUserRole } from "../../constants/roles.js";
import type { User } from "../../features/auth/types.js";
import { tokenStorage } from "../storage/token.js";
import { userStorage } from "../storage/user.js";

export type UserResponseRaw = Omit<User, "role"> & {
    role?: User["role"];
};

export type TokenResponseRaw = {
    accessToken: string;
    user?: UserResponseRaw;
};

const baseURL = import.meta.env.VITE_API_URL || "/api";

export function normalizeAuthUser(user: UserResponseRaw): User {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: normalizeUserRole(user.role),
    };
}

export function getAccessToken(response: TokenResponseRaw): string {
    if (!response.accessToken) {
        throw new Error("Auth response did not include access token.");
    }

    return response.accessToken;
}

export async function refreshAccessToken(): Promise<string> {
    const { data } = await axios.post<TokenResponseRaw>(
        `${baseURL}/auth/refresh-token`,
        {},
        { withCredentials: true }
    );

    const accessToken = getAccessToken(data);
    tokenStorage.set(accessToken);

    if (data.user) {
        userStorage.set(normalizeAuthUser(data.user));
    }

    return accessToken;
}

export async function fetchAuthUser(userId: number, accessToken: string): Promise<User> {
    const { data } = await axios.get<UserResponseRaw>(
        `${baseURL}/Users/${userId}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true,
        }
    );

    return normalizeAuthUser(data);
}
