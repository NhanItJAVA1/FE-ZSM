export const RBAC_PERMISSIONS = {
    todoRead: "todo.read",
    todoWrite: "todo.write",
    todoCategoryRead: "todo-category.read",
    todoCategoryCreate: "todo-category.create",
    todoCategoryUpdate: "todo-category.update",
    todoCategoryDelete: "todo-category.delete",
    rolesRead: "roles.read",
    rolesCreate: "roles.create",
    rolesUpdate: "roles.update",
    rolesDelete: "roles.delete",
    rolesManagePermissions: "roles.manage-permissions",
    usersManageRoles: "users.manage-roles",
} as const;
