const ACCESS_TOKEN_KEY = "accessToken";
const LEGACY_ACCESS_TOKEN_KEY = "access_token";
const LEGACY_REFRESH_TOKEN_KEY = "refreshToken";
const LOGGED_OUT_KEY = "auth:logged-out";

interface TokenStorage {
    get(): string | null;
    getAccessToken(): string | null;
    isExpired(accessToken?: string | null): boolean;
    hasUsableAccessToken(): boolean;
    set(accessToken: string): void;
    wasLoggedOut(): boolean;
    markLoggedOut(): void;
    remove(): void;
    clear(): void;
}

function decodeJwtPayload(token: string): { exp?: number } | null {
    const payload = token.split(".")[1];

    if (!payload) {
        return null;
    }

    try {
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(
            normalized.length + ((4 - normalized.length % 4) % 4),
            "="
        );

        return JSON.parse(atob(padded)) as { exp?: number };
    } catch {
        return null;
    }
}

export const tokenStorage: TokenStorage = {
    get(): string | null {
        return (
            localStorage.getItem(ACCESS_TOKEN_KEY) ??
            localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY)
        );
    },

    getAccessToken(): string | null {
        return this.get();
    },

    isExpired(accessToken = tokenStorage.get()): boolean {
        if (!accessToken) {
            return true;
        }

        const payload = decodeJwtPayload(accessToken);

        if (!payload?.exp) {
            return true;
        }

        return payload.exp * 1000 <= Date.now();
    },

    hasUsableAccessToken(): boolean {
        return !this.isExpired();
    },

    set(accessToken: string): void {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
        localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
        localStorage.removeItem(LOGGED_OUT_KEY);
    },

    wasLoggedOut(): boolean {
        return localStorage.getItem(LOGGED_OUT_KEY) === "true";
    },

    markLoggedOut(): void {
        localStorage.setItem(LOGGED_OUT_KEY, "true");
    },

    remove(): void {
        this.clear();
    },

    clear(): void {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
        localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
    },
};
