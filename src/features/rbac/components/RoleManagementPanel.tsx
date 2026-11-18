import { Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { RBAC_ADMIN_PAGE_ACCESS_PERMISSIONS } from "../../../constants/rbacPermissions.js";
import { rbacService } from "../../../services/api/rbacService.js";
import { getApiErrorMessage } from "../apiErrors.js";
import type { PermissionDto, RoleDto, SaveRoleDto } from "../types.js";
import PermissionManagementPanel from "./PermissionManagementPanel.js";
import { RbacEmpty, RbacError, RbacLoading } from "./RbacStates.js";
import type { RbacToastType } from "./RbacStates.js";
import TodoPagination from "../../todo/components/TodoPagination.js";

const ASSIGNED_USERS_PAGE_SIZE = 20;

interface BulkRemoveConfirmation {
    roleId: number;
    roleName: string;
    userIds: number[];
}

function isProtectedRole(role: RoleDto) {
    return role.id === 1 || role.id === 2 || ["user", "admin"].includes(role.name.trim().toLowerCase());
}

interface RoleManagementPanelProps {
    canReadRoles: boolean;
    canCreateRole: boolean;
    canUpdateRole: boolean;
    canDeleteRole: boolean;
    canManagePermissions: boolean;
    canManageUserRoles: boolean;
    onToast: (message: string, type?: RbacToastType) => void;
}

export default function RoleManagementPanel({
    canReadRoles,
    canCreateRole,
    canUpdateRole,
    canDeleteRole,
    canManagePermissions,
    canManageUserRoles,
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
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [assignedUsersPage, setAssignedUsersPage] = useState(1);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(() => new Set());
    const [bulkRemoveConfirmation, setBulkRemoveConfirmation] = useState<BulkRemoveConfirmation | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const selectedRole = rolesQuery.data?.find((role) => role.id === selectedRoleId) ?? null;
    const assignedUsersQuery = useQuery({
        queryKey: selectedRoleId === null
            ? ["rbac", "roles", "none", "users", assignedUsersPage, ASSIGNED_USERS_PAGE_SIZE]
            : QUERY_KEYS.roleUsers(selectedRoleId, assignedUsersPage, ASSIGNED_USERS_PAGE_SIZE),
        queryFn: ({ signal }) => rbacService.getRoleUsers(selectedRoleId!, assignedUsersPage, ASSIGNED_USERS_PAGE_SIZE, signal),
        enabled: canReadRoles && selectedRoleId !== null,
        retry: false,
    });
    const assignedUsersTotalPages = assignedUsersQuery.data
        ? Math.max(1, Math.ceil(assignedUsersQuery.data.totalItems / ASSIGNED_USERS_PAGE_SIZE))
        : assignedUsersPage;

    useEffect(() => {
        if (assignedUsersQuery.data && assignedUsersPage > assignedUsersTotalPages) {
            setAssignedUsersPage(assignedUsersTotalPages);
        }
    }, [assignedUsersPage, assignedUsersQuery.data, assignedUsersTotalPages]);
    const createPermissionGroups = useMemo(() => {
        const groups = new Map<string, PermissionDto[]>();
        for (const permission of permissionsQuery.data ?? []) {
            const [module] = permission.code.split(".");
            const normalizedModule = module === "todos" ? "todo" : module;
            const groupName = normalizedModule?.replaceAll("-", " ") || "other";
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
            return { roleName, roleId: id };
        },
        onSuccess: ({ roleName, roleId }) => {
            onToast(roleName ? `Đã xóa Role “${roleName}”.` : "Đã xóa Role thành công.");
            if (selectedRoleId === roleId) {
                setSelectedRoleId(null);
                setAssignedUsersPage(1);
                setSelectedUserIds(new Set());
            }
            void refreshRoles();
        },
        onError: (error) => onToast(getApiErrorMessage(error, "xóa Role"), "error"),
    });
    const bulkRemoveUsersMutation = useMutation({
        mutationFn: ({ roleId, userIds }: BulkRemoveConfirmation) =>
            rbacService.bulkRemoveUsersFromRole(roleId, userIds),
        onSuccess: async (_result, { roleId, roleName, userIds }) => {
            const currentTotal = selectedRoleId === roleId ? assignedUsersQuery.data?.totalItems : undefined;
            setSelectedUserIds(new Set());
            if (currentTotal !== undefined) {
                const nextTotalPages = Math.max(1, Math.ceil(Math.max(0, currentTotal - userIds.length) / ASSIGNED_USERS_PAGE_SIZE));
                setAssignedUsersPage((page) => Math.min(page, nextTotalPages));
            }
            setBulkRemoveConfirmation(null);
            onToast(`Đã gỡ Role “${roleName}” khỏi ${userIds.length} User.`);
            await queryClient.invalidateQueries({ queryKey: ["rbac", "roles", roleId, "users"] });
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
        },
        onError: (error) => {
            setBulkRemoveConfirmation(null);
            onToast(getApiErrorMessage(error, "gỡ Role khỏi Users"), "error");
        },
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

    function selectRoleForUsers(role: RoleDto) {
        if (selectedRoleId !== role.id) setSelectedUserIds(new Set());
        setSelectedRoleId(role.id);
        setAssignedUsersPage(1);
    }

    const currentPageUserIds = assignedUsersQuery.data?.items.map((user) => user.userId) ?? [];
    const allCurrentPageUsersSelected = currentPageUserIds.length > 0 &&
        currentPageUserIds.every((userId) => selectedUserIds.has(userId));
    const someCurrentPageUsersSelected = currentPageUserIds.some((userId) => selectedUserIds.has(userId));

    function toggleUserSelection(userId: number) {
        setSelectedUserIds((current) => {
            const next = new Set(current);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    }

    function toggleCurrentPageUsers(checked: boolean) {
        setSelectedUserIds((current) => {
            const next = new Set(current);
            currentPageUserIds.forEach((userId) => {
                if (checked) next.add(userId);
                else next.delete(userId);
            });
            return next;
        });
    }

    function beginBulkRemove() {
        if (!selectedRole || selectedUserIds.size === 0 || !canManageUserRoles) return;
        setBulkRemoveConfirmation({
            roleId: selectedRole.id,
            roleName: selectedRole.name,
            userIds: [...selectedUserIds],
        });
    }

    function confirmBulkRemove() {
        if (!bulkRemoveConfirmation || bulkRemoveUsersMutation.isPending) return;
        bulkRemoveUsersMutation.mutate(bulkRemoveConfirmation);
    }

    return (
        <div className="rbac-panel-grid rbac-role-master-detail">
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
                                <article className={`rbac-role-row${selectedRoleId === role.id ? " rbac-role-row--selected" : ""}`} key={role.id}>
                                    {canEditRole ? <button
                                        type="button"
                                        className="rbac-role-row-main"
                                        onClick={() => beginEdit(role)}
                                        aria-label={`Sửa Role ${role.name}`}
                                    >{roleCopy}</button> : roleCopy}
                                    <div className="rbac-row-actions rbac-role-row-actions">
                                        <button
                                            type="button"
                                            className={`rbac-icon-button${selectedRoleId === role.id ? " active" : ""}`}
                                            aria-label={`Xem người dùng có Role ${role.name}`}
                                            aria-pressed={selectedRoleId === role.id}
                                            title="Xem người dùng có Role này"
                                            disabled={bulkRemoveUsersMutation.isPending}
                                            onClick={() => selectRoleForUsers(role)}
                                        ><Eye size={17} aria-hidden="true" /></button>
                                        {canDeleteRole && <button
                                            type="button"
                                            className="ghost-btn danger"
                                            disabled={protectedRole || deleteMutation.isPending || bulkRemoveUsersMutation.isPending}
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

            {!editorOpen && <section className="rbac-card rbac-role-users-panel" aria-live="polite">
                <div className="rbac-section-heading">
                    <div>
                        <h2>{selectedRole ? `Người dùng · ${selectedRole.name}` : "Người dùng được gán Role"}</h2>
                        {selectedRole && <p>
                            {assignedUsersQuery.isLoading
                                ? "Đang tải danh sách người dùng…"
                                : assignedUsersQuery.data
                                    ? `${assignedUsersQuery.data.totalItems} người dùng`
                                    : assignedUsersQuery.isError ? "Không tải được danh sách" : ""}
                        </p>}
                    </div>
                </div>

                {!canReadRoles && <RbacEmpty>Bạn cần quyền roles.read để xem danh sách người dùng.</RbacEmpty>}
                {canReadRoles && !selectedRole && <RbacEmpty>Chọn một Role để xem danh sách người dùng.</RbacEmpty>}
                {canReadRoles && selectedRole && canManageUserRoles && <div className="rbac-role-users-selection">
                    <label className="rbac-role-users-select-all">
                        <input
                            type="checkbox"
                            checked={allCurrentPageUsersSelected}
                            ref={(input) => {
                                if (input) input.indeterminate = someCurrentPageUsersSelected && !allCurrentPageUsersSelected;
                            }}
                            disabled={currentPageUserIds.length === 0 || assignedUsersQuery.isFetching || bulkRemoveUsersMutation.isPending}
                            onChange={(event) => toggleCurrentPageUsers(event.target.checked)}
                        />
                        <span>Chọn tất cả</span>
                    </label>
                    <span className="rbac-role-users-selected-count">Đã chọn {selectedUserIds.size} User</span>
                    <div className="rbac-row-actions">
                        {selectedUserIds.size > 0 && <button
                            type="button"
                            className="rbac-link-button"
                            disabled={bulkRemoveUsersMutation.isPending}
                            onClick={() => setSelectedUserIds(new Set())}
                        >Bỏ chọn tất cả</button>}
                        <button
                            type="button"
                            className="rbac-primary-button"
                            disabled={selectedUserIds.size === 0 || bulkRemoveUsersMutation.isPending}
                            onClick={beginBulkRemove}
                        >Gỡ Role ({selectedUserIds.size})</button>
                    </div>
                </div>}
                {canReadRoles && selectedRole && assignedUsersQuery.isLoading && <RbacLoading />}
                {canReadRoles && selectedRole && assignedUsersQuery.isError && <RbacError error={assignedUsersQuery.error} action="tải người dùng của Role" />}
                {canReadRoles && selectedRole && assignedUsersQuery.data?.items.length === 0 && <RbacEmpty>Role này chưa được gán cho User nào.</RbacEmpty>}
                {canReadRoles && selectedRole && assignedUsersQuery.data && assignedUsersQuery.data.items.length > 0 && (
                    <div className="rbac-role-assigned-users">
                        {assignedUsersQuery.data.items.map((user) => (
                            <article className="rbac-role-assigned-user" key={user.userId}>
                                {canManageUserRoles && <input
                                    type="checkbox"
                                    checked={selectedUserIds.has(user.userId)}
                                    disabled={assignedUsersQuery.isFetching || bulkRemoveUsersMutation.isPending}
                                    aria-label={`Chọn ${user.displayName}`}
                                    onChange={() => toggleUserSelection(user.userId)}
                                />}
                                <span>{user.displayName}</span>
                            </article>
                        ))}
                        {assignedUsersTotalPages > 1 && <TodoPagination
                            onSetPage={setAssignedUsersPage}
                            pagination={{ page: assignedUsersPage, totalPages: assignedUsersTotalPages }}
                        />}
                    </div>
                )}
            </section>}

            {bulkRemoveConfirmation && <div
                className="modal-backdrop todo-dialog-backdrop"
                role="presentation"
                onClick={() => {
                    if (!bulkRemoveUsersMutation.isPending) setBulkRemoveConfirmation(null);
                }}
            >
                <section
                    className="modal-panel todo-dialog rbac-bulk-remove-dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="rbac-bulk-remove-title"
                    aria-describedby="rbac-bulk-remove-message"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="todo-dialog-copy">
                        <h2 id="rbac-bulk-remove-title">Xác nhận gỡ Role</h2>
                        <p id="rbac-bulk-remove-message">
                            Bạn có chắc muốn gỡ Role {bulkRemoveConfirmation.roleName} khỏi {bulkRemoveConfirmation.userIds.length} người dùng đã chọn không?
                        </p>
                    </div>
                    <div className="todo-dialog-actions">
                        <button
                            type="button"
                            className="ghost-btn"
                            disabled={bulkRemoveUsersMutation.isPending}
                            onClick={() => setBulkRemoveConfirmation(null)}
                        >Hủy</button>
                        <button
                            type="button"
                            className="todo-danger-btn"
                            disabled={bulkRemoveUsersMutation.isPending}
                            onClick={confirmBulkRemove}
                        >{bulkRemoveUsersMutation.isPending ? "Đang gỡ…" : "Xác nhận gỡ"}</button>
                    </div>
                </section>
            </div>}

            {editorOpen && <section className="rbac-card rbac-form-card rbac-editor-card">
                <button type="button" className="rbac-link-button rbac-back-button" onClick={closeEditor}>← Danh sách Roles</button>
                <div className="rbac-section-heading">
                    <div>
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
                            <legend>
                                Permissions cho Role
                            </legend>
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
                                                            <span className="rbac-permission-title">
                                                                <strong>{permission.description || permission.code}</strong>
                                                                {RBAC_ADMIN_PAGE_ACCESS_PERMISSIONS.some((code) => code === permission.code) && (
                                                                    <small className="rbac-admin-access-badge">Có thể vào AdminPage</small>
                                                                )}
                                                            </span>
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
