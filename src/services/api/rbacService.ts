import api from "./axios.js";
import type {
    PermissionDto,
    ReplaceRolePermissionsDto,
    ReplaceUserRolesDto,
    RoleDto,
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
