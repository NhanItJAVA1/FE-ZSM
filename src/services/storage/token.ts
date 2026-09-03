const ACCESS_TOKEN_KEY = "accessToken";
const LEGACY_ACCESS_TOKEN_KEY = "access_token";
const LEGACY_REFRESH_TOKEN_KEY = "refreshToken";

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
