import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { rbacService } from "../../../services/api/rbacService.js";
import { getApiErrorMessage } from "../apiErrors.js";
import type { PermissionDto, RoleDto, SaveRoleDto } from "../types.js";
import PermissionManagementPanel from "./PermissionManagementPanel.js";
import { RbacEmpty, RbacError, RbacLoading } from "./RbacStates.js";

function isProtectedRole(role: RoleDto) {
    return role.id === 1 || role.id === 2 || ["user", "admin"].includes(role.name.trim().toLowerCase());
}

interface RoleManagementPanelProps {
    canReadRoles: boolean;
    canCreateRole: boolean;
    canUpdateRole: boolean;
    canDeleteRole: boolean;
    canManagePermissions: boolean;
}

export default function RoleManagementPanel({
    canReadRoles,
    canCreateRole,
    canUpdateRole,
    canDeleteRole,
    canManagePermissions,
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

    const refreshRoles = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rbacRoles });
    const saveMutation = useMutation({
        mutationFn: async (payload: SaveRoleDto) => {
            if (editingRole) {
                return { role: await rbacService.updateRole(editingRole.id, payload), permissionError: null };
            }

            const role = await rbacService.createRole(payload);
            if (!canManagePermissions || selectedPermissionIds.length === 0) {
                return { role, permissionError: null };
            }

            try {
                await rbacService.replaceRolePermissions(role.id, { permissionIds: selectedPermissionIds });
                return { role, permissionError: null };
            } catch (error) {
                return {
                    role,
                    permissionError: `Role đã được tạo nhưng chưa gán được Permissions: ${getApiErrorMessage(error, "cập nhật Permissions")}`,
                };
            }
        },
        onSuccess: async ({ role, permissionError }) => {
            setName(role.name);
            setDescription(role.description);
            setSelectedPermissionIds([]);
            setFormError(permissionError);
            await Promise.all([
                refreshRoles(),
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rolePermissions(role.id) }),
            ]);

            if (permissionError) {
                setEditingRole(role);
                setCreatingRole(false);
                setEditorOpen(true);
                return;
            }

            setEditingRole(null);
            setCreatingRole(false);
            setEditorOpen(false);
        },
        onError: (error) => setFormError(getApiErrorMessage(error, "lưu Role")),
    });
    const deleteMutation = useMutation({
        mutationFn: rbacService.deleteRole,
        onSuccess: () => void refreshRoles(),
        onError: (error) => setFormError(getApiErrorMessage(error, "xóa Role")),
    });

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
                        {canCreateRole && <button type="button" className="rbac-primary-button" onClick={beginCreate}>Tạo Role</button>}
                        {canReadRoles && <button type="button" className="ghost-btn" onClick={() => void rolesQuery.refetch()}>Làm mới</button>}
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
                            return (
                                <article className="rbac-role-row" key={role.id}>
                                    <div className="rbac-role-copy">
                                        <div className="rbac-role-title">
                                            <strong>{role.name}</strong>
                                            {protectedRole && <span className="rbac-badge">Mặc định · khóa tên</span>}
                                        </div>
                                        <p>{role.description || "Chưa có mô tả"}</p>
                                    </div>
                                    <div className="rbac-row-actions">
                                        {(canManagePermissions || (canUpdateRole && !protectedRole)) && <button type="button" className="ghost-btn" onClick={() => beginEdit(role)}>Sửa</button>}
                                        {canDeleteRole && <button
                                            type="button"
                                            className="ghost-btn danger"
                                            disabled={protectedRole || deleteMutation.isPending}
                                            onClick={() => {
                                                if (window.confirm(`Xóa Role “${role.name}”? Thao tác này không thể hoàn tác.`)) {
                                                    setFormError(null);
                                                    deleteMutation.mutate(role.id);
                                                }
                                            }}
                                        >Xóa</button>}
                                    </div>
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
                                <div className="rbac-user-role-list">
                                    {permissionsQuery.data.map((permission) => (
                                        <label className="rbac-permission-item" key={permission.id}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPermissionIds.includes(permission.id)}
                                                onChange={(event) => toggleCreatePermission(permission, event.target.checked)}
                                            />
                                            <span>
                                                <strong>{permission.code}</strong>
                                                <small>{permission.description}</small>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </fieldset>
                    )}
                    {formError && <p className="rbac-inline-error" role="alert">{formError}</p>}
                    <div className="rbac-row-actions">
                        <button type="button" className="ghost-btn" onClick={closeEditor}>Hủy</button>
                        <button type="submit" className="rbac-primary-button" disabled={saveMutation.isPending || !name.trim()}>
                            {saveMutation.isPending ? "Đang lưu…" : creatingRole ? "Tạo Role" : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>}

                {editingRole && canManagePermissions && (
                    <PermissionManagementPanel roleId={editingRole.id} roleName={editingRole.name} />
                )}
                {editingRole && isProtectedRole(editingRole) && !canUpdateRole && <p className="rbac-user-summary">Role mặc định không thể đổi tên hoặc mô tả.</p>}
                {editingRole && isProtectedRole(editingRole) && canUpdateRole && <p className="rbac-user-summary">Role mặc định được khóa thông tin; chỉ có thể chỉnh Permissions.</p>}
                {formError && !(creatingRole || (editingRole && canUpdateRole && !isProtectedRole(editingRole))) && <p className="rbac-inline-error" role="alert">{formError}</p>}
            </section>}
        </div>
    );
}
