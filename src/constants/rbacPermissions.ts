export const RBAC_PERMISSIONS = {
    todoRead: "todo.read",
    todoWrite: "todo.write",
    todosReadAll: "todos.read-all",
    todoCategoryRead: "todo-category.read",
    todoCategoryCreate: "todo-category.create",
    todoCategoryUpdate: "todo-category.update",
    todoCategoryDelete: "todo-category.delete",
    rolesRead: "roles.read",
    permissionsRead: "permissions.read",
    rolesCreate: "roles.create",
    rolesUpdate: "roles.update",
    rolesDelete: "roles.delete",
    rolesManagePermissions: "roles.manage-permissions",
    usersManageRoles: "users.manage-roles",
} as const;

export const RBAC_ADMIN_PAGE_ACCESS_PERMISSIONS = [
    RBAC_PERMISSIONS.rolesRead,
    RBAC_PERMISSIONS.permissionsRead,
    RBAC_PERMISSIONS.rolesCreate,
    RBAC_PERMISSIONS.rolesUpdate,
    RBAC_PERMISSIONS.rolesDelete,
    RBAC_PERMISSIONS.rolesManagePermissions,
    RBAC_PERMISSIONS.usersManageRoles,
] as const;
