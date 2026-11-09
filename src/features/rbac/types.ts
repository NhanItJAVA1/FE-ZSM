export interface RoleDto {
    id: number;
    name: string;
    description: string;
}

export interface SaveRoleDto {
    name: string;
    description: string;
}

export interface PermissionDto {
    id: number;
    code: string;
    description: string;
}

export interface UserDto {
    id: number;
    username: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    role: string;
    roles: string[];
    permissions: string[];
    createdAt: string;
    updatedAt: string;
    isSystemOwner: boolean;
}

export interface ReplaceRolePermissionsDto {
    permissionIds: number[];
}

export interface ReplaceUserRolesDto {
    roleIds: number[];
}
