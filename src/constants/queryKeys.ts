export const QUERY_KEYS = {
    todos: (userId: number) => ["todos", "user", userId] as const,
    todoCategories: (userId: number) => ["todo-categories", "user", userId] as const,
    rbacRoles: ["rbac", "roles"] as const,
    rbacPermissions: ["rbac", "permissions"] as const,
    rolePermissions: (roleId: number) => ["rbac", "roles", roleId, "permissions"] as const,
    users: ["rbac", "users"] as const,
    userRoles: (userId: number) => ["rbac", "users", userId, "roles"] as const,
};
