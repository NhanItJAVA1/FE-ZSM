export type UserRole = "User" | "Admin";

export function isAdminRole(role: UserRole | undefined | null): boolean {
    return role === "Admin";
}

export function normalizeUserRole(role: unknown): UserRole {
    return role === "Admin" ? "Admin" : "User";
}
