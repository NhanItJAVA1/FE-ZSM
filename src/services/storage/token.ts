const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const LEGACY_ACCESS_TOKEN_KEY = "access_token";

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

    getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    set(accessToken: string, refreshToken: string): void {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    },

    remove(): void {
        this.clear();
    },

    clear(): void {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    },
};
