const ACCESS_TOKEN_KEY = "accessToken";
const LEGACY_ACCESS_TOKEN_KEY = "access_token";
const LEGACY_REFRESH_TOKEN_KEY = "refreshToken";
const LOGGED_OUT_KEY = "auth:logged-out";

export const tokenStorage = {
    get(): string | null {
        return (
            localStorage.getItem(ACCESS_TOKEN_KEY) ??
            localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY)
        );
    },

    getAccessToken(): string | null {
        return this.get();
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
