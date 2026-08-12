import type { User } from "../../features/auth/types.js";
import { normalizeUserRole } from "../../constants/roles.js";

const USER_KEY = "current_user";

function normalizeUser(raw: Partial<User> & { Role?: string }): User | null {
    if (typeof raw.id !== "number" || typeof raw.username !== "string") {
        return null;
    }

    return {
        id: raw.id,
        username: raw.username,
        email: raw.email ?? "",
        displayName: raw.displayName ?? raw.username,
        avatarUrl: raw.avatarUrl ?? null,
        role: normalizeUserRole(raw.role ?? raw.Role),
    };
}

export const userStorage = {
    get(): User | null {
        const raw = localStorage.getItem(USER_KEY);

        if (!raw) {
            return null;
        }

        try {
            return normalizeUser(JSON.parse(raw) as Partial<User> & { Role?: string });
        } catch {
            return null;
        }
    },

    set(user: User): void {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    remove(): void {
        localStorage.removeItem(USER_KEY);
    },
};
