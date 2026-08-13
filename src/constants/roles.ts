export type UserRole = "User" | "Admin";

export function isAdminRole(role: UserRole | undefined | null): boolean {
    return String(role).toLowerCase() === "admin";
}

export function normalizeUserRole(role: unknown): UserRole {
    return String(role).toLowerCase() === "admin" ? "Admin" : "User";
}
