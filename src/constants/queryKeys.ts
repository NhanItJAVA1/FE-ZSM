export const QUERY_KEYS = {
    todos: (userId: number) => ["todos", "user", userId] as const,
    todoShares: (todoId: number) => ["todos", "shares", todoId] as const,
    todoNotes: (todoId: number) => ["todos", "notes", todoId] as const,
    todoUsersSummary: (search: string, page: number, pageSize: number) =>
        ["todos", "users-summary", search, page, pageSize] as const,
    todoCategories: (userId: number) => ["todo-categories", "user", userId] as const,
    rbacRoles: ["rbac", "roles"] as const,
    roleUsers: (roleId: number, page: number, pageSize: number) =>
        ["rbac", "roles", roleId, "users", page, pageSize] as const,
    rbacPermissions: ["rbac", "permissions"] as const,
    rolePermissions: (roleId: number) => ["rbac", "roles", roleId, "permissions"] as const,
    users: ["rbac", "users"] as const,
    userRoles: (userId: number) => ["rbac", "users", userId, "roles"] as const,
    adminRecoveryUsers: (search: string, page: number, pageSize: number) =>
        ["admin-recovery", "users", search, page, pageSize] as const,
};
