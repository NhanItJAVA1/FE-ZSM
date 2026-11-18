import api from "./axios.js";
import type {
    PermissionDto,
    ReplaceRolePermissionsDto,
    ReplaceUserRolesDto,
    RoleDto,
    RoleUsersPageDto,
    SaveRoleDto,
    UserDto,
} from "../../features/rbac/types.js";

export const rbacService = {
    async getRoles(): Promise<RoleDto[]> {
        const response = await api.get<RoleDto[]>("/roles");
        return response.data;
    },

    async createRole(payload: SaveRoleDto): Promise<RoleDto> {
        const response = await api.post<RoleDto>("/roles", payload);
        return response.data;
    },

    async updateRole(id: number, payload: SaveRoleDto): Promise<RoleDto> {
        const response = await api.put<RoleDto>(`/roles/${id}`, payload);
        return response.data;
    },

    async deleteRole(id: number): Promise<void> {
        await api.delete(`/roles/${id}`);
    },

    async getRoleUsers(roleId: number, page: number, pageSize: number, signal?: AbortSignal): Promise<RoleUsersPageDto> {
        const response = await api.get<RoleUsersPageDto>(`/roles/${roleId}/users`, {
            params: { page, pageSize },
            ...(signal ? { signal } : {}),
        });
        return response.data;
    },

    async bulkRemoveUsersFromRole(roleId: number, userIds: number[]): Promise<void> {
        await api.post<void>(`/roles/${roleId}/users/bulk-remove`, { userIds });
    },

    async getPermissions(): Promise<PermissionDto[]> {
        const response = await api.get<PermissionDto[]>("/permissions");
        return response.data;
    },

    async getRolePermissions(roleId: number): Promise<PermissionDto[]> {
        const response = await api.get<PermissionDto[]>(`/roles/${roleId}/permissions`);
        return response.data;
    },

    async replaceRolePermissions(
        roleId: number,
        payload: ReplaceRolePermissionsDto
    ): Promise<PermissionDto[]> {
        const response = await api.put<PermissionDto[]>(
            `/roles/${roleId}/permissions`,
            payload
        );
        return response.data;
    },

    async getUsers(): Promise<UserDto[]> {
        const response = await api.get<UserDto[]>("/users");
        return response.data;
    },

    async getUserRoles(userId: number): Promise<RoleDto[]> {
        const response = await api.get<RoleDto[]>(`/users/${userId}/roles`);
        return response.data;
    },

    async replaceUserRoles(
        userId: number,
        payload: ReplaceUserRolesDto
    ): Promise<RoleDto[]> {
        const response = await api.put<RoleDto[]>(`/users/${userId}/roles`, payload);
        return response.data;
    },
};
