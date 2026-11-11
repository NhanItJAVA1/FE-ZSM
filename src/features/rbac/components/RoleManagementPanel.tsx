import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { rbacService } from "../../../services/api/rbacService.js";
import { getApiErrorMessage } from "../apiErrors.js";
import type { PermissionDto, RoleDto, SaveRoleDto } from "../types.js";
import PermissionManagementPanel from "./PermissionManagementPanel.js";
import { RbacEmpty, RbacError, RbacLoading } from "./RbacStates.js";
import type { RbacToastType } from "./RbacStates.js";

function isProtectedRole(role: RoleDto) {
    return role.id === 1 || role.id === 2 || ["user", "admin"].includes(role.name.trim().toLowerCase());
}

interface RoleManagementPanelProps {
    canReadRoles: boolean;
    canCreateRole: boolean;
    canUpdateRole: boolean;
    canDeleteRole: boolean;
    canManagePermissions: boolean;
    onToast: (message: string, type?: RbacToastType) => void;
}

export default function RoleManagementPanel({
    canReadRoles,
    canCreateRole,
    canUpdateRole,
    canDeleteRole,
    canManagePermissions,
    onToast,
}: RoleManagementPanelProps) {
    const queryClient = useQueryClient();
    const rolesQuery = useQuery({
        queryKey: QUERY_KEYS.rbacRoles,
        queryFn: rbacService.getRoles,
        enabled: canReadRoles,
    });
    const permissionsQuery = useQuery({
        queryKey: QUERY_KEYS.rbacPermissions,
        queryFn: rbacService.getPermissions,
        enabled: canManagePermissions && canCreateRole,
    });
    const [editorOpen, setEditorOpen] = useState(false);
    const [creatingRole, setCreatingRole] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const createPermissionGroups = useMemo(() => {
        const groups = new Map<string, PermissionDto[]>();
        for (const permission of permissionsQuery.data ?? []) {
            const [module] = permission.code.split(".");
            const groupName = module?.replaceAll("-", " ") || "other";
            groups.set(groupName, [...(groups.get(groupName) ?? []), permission]);
        }

        return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
    }, [permissionsQuery.data]);

    const refreshRoles = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rbacRoles });
    const saveMutation = useMutation({
        mutationFn: async (payload: SaveRoleDto) => {
            if (editingRole) {
                return {
                    role: await rbacService.updateRole(editingRole.id, payload),
                    permissionError: null,
                    action: "updated" as const,
                    permissionCount: 0,
                };
            }

            const role = await rbacService.createRole(payload);
            if (!canManagePermissions || selectedPermissionIds.length === 0) {
                return { role, permissionError: null, action: "created" as const, permissionCount: 0 };
            }

            try {
                await rbacService.replaceRolePermissions(role.id, { permissionIds: selectedPermissionIds });
                return { role, permissionError: null, action: "created" as const, permissionCount: selectedPermissionIds.length };
            } catch (error) {
                return {
                    role,
                    permissionError: `Role đã được tạo nhưng chưa gán được Permissions: ${getApiErrorMessage(error, "cập nhật Permissions")}`,
                    action: "created" as const,
                    permissionCount: 0,
                };
            }
        },
        onSuccess: async ({ role, permissionError, action, permissionCount }) => {
            setName(role.name);
            setDescription(role.description);
            setSelectedPermissionIds([]);
            setFormError(permissionError);
            await Promise.all([
                refreshRoles(),
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rolePermissions(role.id) }),
            ]);

            if (permissionError) {
                onToast(permissionError, "error");
                setEditingRole(role);
                setCreatingRole(false);
                setEditorOpen(true);
                return;
            }

            setEditingRole(null);
            setCreatingRole(false);
            setEditorOpen(false);
            onToast(action === "created"
                ? permissionCount > 0 ? "Đã tạo Role và gán Permissions thành công." : "Đã tạo Role thành công."
                : "Đã cập nhật Role thành công.");
        },
        onError: (error) => setFormError(getApiErrorMessage(error, "lưu Role")),
    });
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const roleName = rolesQuery.data?.find((role) => role.id === id)?.name;
            await rbacService.deleteRole(id);
            return roleName;
        },
        onSuccess: (roleName) => {
            onToast(roleName ? `Đã xóa Role “${roleName}”.` : "Đã xóa Role thành công.");
            void refreshRoles();
        },
        onError: (error) => setFormError(getApiErrorMessage(error, "xóa Role")),
    });

    const roleDetailsChanged = Boolean(editingRole && (
        name.trim() !== editingRole.name || description.trim() !== editingRole.description
    ));

    async function saveRoleDetailsBeforePermissions() {
        if (!editingRole || !canUpdateRole || isProtectedRole(editingRole) || !roleDetailsChanged) {
            return false;
        }
        if (!name.trim()) {
            throw new Error("Tên Role không được để trống.");
        }

        let updatedRole: RoleDto;
        try {
            updatedRole = await rbacService.updateRole(editingRole.id, {
                name: name.trim(),
                description: description.trim(),
            });
        } catch (error) {
            throw new Error(getApiErrorMessage(error, "cập nhật tên và mô tả Role"));
        }

        setEditingRole(updatedRole);
        setName(updatedRole.name);
        setDescription(updatedRole.description);
        await refreshRoles();
        return true;
    }

    function beginCreate() {
        setEditingRole(null);
        setCreatingRole(true);
        setEditorOpen(true);
        setName("");
        setDescription("");
        setSelectedPermissionIds([]);
        setFormError(null);
    }

    function beginEdit(role: RoleDto) {
        setEditingRole(role);
        setCreatingRole(false);
        setEditorOpen(true);
        setName(role.name);
        setDescription(role.description);
        setFormError(null);
    }

    function closeEditor() {
        setEditorOpen(false);
        setCreatingRole(false);
        setEditingRole(null);
        setFormError(null);
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (editingRole && canManagePermissions) return;
        setFormError(null);
        saveMutation.mutate({ name: name.trim(), description: description.trim() });
    }

    function toggleCreatePermission(permission: PermissionDto, checked: boolean) {
        setSelectedPermissionIds((current) => checked
            ? [...new Set([...current, permission.id])]
            : current.filter((id) => id !== permission.id));
    }

    return (
        <div className="rbac-panel-grid">
            {!editorOpen && <section className="rbac-card">
                <div className="rbac-section-heading">
                    <div>
                        <h2>Roles</h2>
                        <p>Tạo vai trò, quản lý thông tin và Permissions được cấp cho từng Role.</p>
                    </div>
                    <div className="rbac-row-actions">
                        {canCreateRole && <button type="button" className="rbac-primary-button" onClick={beginCreate} aria-label="Tạo Role" title="Tạo Role">+</button>}
                    </div>
                </div>
                {canReadRoles && rolesQuery.isLoading && <RbacLoading />}
                {canReadRoles && rolesQuery.isError && <RbacError error={rolesQuery.error} action="tải Roles" />}
                {!canReadRoles && <p role="status">Bạn cần quyền roles.read để xem danh sách Role.</p>}
                {canReadRoles && rolesQuery.data?.length === 0 && <RbacEmpty>Chưa có Role nào.</RbacEmpty>}
                {canReadRoles && rolesQuery.data && rolesQuery.data.length > 0 && (
                    <div className="rbac-role-list">
                        {rolesQuery.data.map((role) => {
                            const protectedRole = isProtectedRole(role);
                            const canEditRole = canManagePermissions || (canUpdateRole && !protectedRole);
                            const roleCopy = (
                                <div className="rbac-role-copy">
                                    <div className="rbac-role-title">
                                        <strong>{role.name}</strong>
                                        {protectedRole && <span className="rbac-badge">Mặc định · khóa tên</span>}
                                    </div>
                                    <p>{role.description || "Chưa có mô tả"}</p>
                                </div>
                            );
                            return (
                                <article className="rbac-role-row" key={role.id}>
                                    {canEditRole ? <button
                                        type="button"
                                        className="rbac-role-row-main"
                                        onClick={() => beginEdit(role)}
                                        aria-label={`Sửa Role ${role.name}`}
                                    >{roleCopy}</button> : roleCopy}
                                    {canDeleteRole && <div className="rbac-row-actions">
                                        <button
                                            type="button"
                                            className="ghost-btn danger"
                                            disabled={protectedRole || deleteMutation.isPending}
                                            onClick={() => {
                                                if (window.confirm(`Xóa Role “${role.name}”? Thao tác này không thể hoàn tác.`)) {
                                                    setFormError(null);
                                                    deleteMutation.mutate(role.id);
                                                }
                                            }}
                                        >Xóa</button>
                                    </div>}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>}

            {editorOpen && <section className="rbac-card rbac-form-card rbac-editor-card">
                <div className="rbac-section-heading">
                    <div>
                        <button type="button" className="rbac-link-button" onClick={closeEditor}>← Danh sách Roles</button>
                        <h2>{creatingRole ? "Tạo Role" : `Sửa ${editingRole?.name ?? "Role"}`}</h2>
                        <p>{creatingRole ? "Có thể gán Permissions ngay khi tạo Role." : "Cập nhật thông tin và Permissions của Role."}</p>
                    </div>
                </div>

                {(creatingRole || (editingRole && canUpdateRole && !isProtectedRole(editingRole))) && <form className="rbac-form" onSubmit={submit}>
                    <label>
                        Tên Role
                        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={50} required disabled={Boolean(editingRole && isProtectedRole(editingRole))} />
                    </label>
                    <label>
                        Mô tả
                        <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={3} />
                    </label>
                    {creatingRole && canManagePermissions && (
                        <fieldset className="rbac-create-permissions">
                            <legend>Permissions cho Role</legend>
                            {permissionsQuery.isLoading && <RbacLoading />}
                            {permissionsQuery.isError && <RbacError error={permissionsQuery.error} action="tải Permissions" />}
                            {permissionsQuery.data?.length === 0 && <RbacEmpty>Backend chưa có Permissions.</RbacEmpty>}
                            {permissionsQuery.data && permissionsQuery.data.length > 0 && (
                                <div className="rbac-permission-groups">
                                    {createPermissionGroups.map(([groupName, permissions]) => (
                                        <section className="rbac-permission-group" key={groupName}>
                                            <div className="rbac-group-heading">
                                                <h3>{groupName}</h3>
                                                <button
                                                    type="button"
                                                    className="rbac-link-button"
                                                    onClick={() => setSelectedPermissionIds((current) => {
                                                        const groupIds = permissions.map((permission) => permission.id);
                                                        return permissions.every((permission) => current.includes(permission.id))
                                                            ? current.filter((id) => !groupIds.includes(id))
                                                            : [...new Set([...current, ...groupIds])];
                                                    })}
                                                >{permissions.every((permission) => selectedPermissionIds.includes(permission.id)) ? "Bỏ chọn" : "Chọn nhanh"}</button>
                                            </div>
                                            <div className="rbac-permission-list">
                                                {permissions.map((permission) => (
                                                    <label className="rbac-permission-item" key={permission.id}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPermissionIds.includes(permission.id)}
                                                            onChange={(event) => toggleCreatePermission(permission, event.target.checked)}
                                                        />
                                                        <span>
                                                            <strong>{permission.description || permission.code}</strong>
                                                            <small>{permission.code}</small>
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            )}
                        </fieldset>
                    )}
                    {formError && <p className="rbac-inline-error" role="alert">{formError}</p>}
                    {(creatingRole || !canManagePermissions) && <div className="rbac-row-actions">
                        {creatingRole && <button type="button" className="ghost-btn" onClick={closeEditor}>Hủy</button>}
                        <button type="submit" className="rbac-primary-button" disabled={saveMutation.isPending || !name.trim()}>
                            {saveMutation.isPending ? "Đang lưu…" : creatingRole ? "Tạo Role" : "Lưu"}
                        </button>
                    </div>}
                </form>}

                {editingRole && canManagePermissions && (
                    <PermissionManagementPanel
                        roleId={editingRole.id}
                        roleName={editingRole.name}
                        onToast={onToast}
                        onCancel={closeEditor}
                        onBeforeSave={saveRoleDetailsBeforePermissions}
                        hasAdditionalChanges={roleDetailsChanged && Boolean(name.trim())}
                    />
                )}
                {editingRole && isProtectedRole(editingRole) && !canUpdateRole && <p className="rbac-user-summary">Role mặc định không thể đổi tên hoặc mô tả.</p>}
                {editingRole && isProtectedRole(editingRole) && canUpdateRole && <p className="rbac-user-summary">Role mặc định được khóa thông tin; chỉ có thể chỉnh Permissions.</p>}
                {formError && !(creatingRole || (editingRole && canUpdateRole && !isProtectedRole(editingRole))) && <p className="rbac-inline-error" role="alert">{formError}</p>}
            </section>}
        </div>
    );
}
