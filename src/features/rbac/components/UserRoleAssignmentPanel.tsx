import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { rbacService } from "../../../services/api/rbacService.js";
import { authService } from "../../../services/api/authService.js";
import { useAppDispatch, useAppSelector } from "../../../stores/hook.js";
import { setAuth } from "../../../stores/slices/authSlice.js";
import { getApiErrorCode, getApiErrorMessage } from "../apiErrors.js";
import { RbacEmpty, RbacError, RbacLoading } from "./RbacStates.js";
import type { RbacToastType } from "./RbacStates.js";
import type { PermissionDto } from "../types.js";

export default function UserRoleAssignmentPanel({ onToast }: { onToast: (message: string, type?: RbacToastType) => void }) {
    const dispatch = useAppDispatch();
    const currentUserId = useAppSelector((state) => state.auth.user?.id);
    const queryClient = useQueryClient();
    const usersQuery = useQuery({ queryKey: QUERY_KEYS.users, queryFn: rbacService.getUsers });
    const rolesQuery = useQuery({ queryKey: QUERY_KEYS.rbacRoles, queryFn: rbacService.getRoles });
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const user = usersQuery.data?.find((item) => item.id === editingUserId);
    const userRolesQuery = useQuery({
        queryKey: user ? QUERY_KEYS.userRoles(user.id) : ["rbac", "user-roles", "none"],
        queryFn: () => rbacService.getUserRoles(user!.id),
        enabled: user !== undefined,
    });
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const selectedRoles = useMemo(
        () => (rolesQuery.data ?? []).filter((role) => selectedRoleIds.includes(role.id)),
        [rolesQuery.data, selectedRoleIds]
    );
    const rolePermissionQueries = useQueries({
        queries: selectedRoles.map((role) => ({
            queryKey: QUERY_KEYS.rolePermissions(role.id),
            queryFn: () => rbacService.getRolePermissions(role.id),
        })),
    });
    const effectivePermissions = useMemo(() => {
        const permissionsById = new Map<number, { permission: PermissionDto; roles: string[] }>();
        selectedRoles.forEach((role, index) => {
            for (const permission of rolePermissionQueries[index]?.data ?? []) {
                const existing = permissionsById.get(permission.id);
                if (existing) {
                    existing.roles.push(role.name);
                } else {
                    permissionsById.set(permission.id, { permission, roles: [role.name] });
                }
            }
        });

        return [...permissionsById.values()].sort((left, right) =>
            (left.permission.description || left.permission.code).localeCompare(
                right.permission.description || right.permission.code
            )
        );
    }, [rolePermissionQueries, selectedRoles]);
    const savedIds = useMemo(() => userRolesQuery.data?.map((role) => role.id) ?? [], [userRolesQuery.data]);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [lastAdminError, setLastAdminError] = useState(false);

    useEffect(() => {
        setSelectedRoleIds(savedIds);
        setSaveError(null);
        setLastAdminError(false);
    }, [user?.id, savedIds]);

    const dirty = [...selectedRoleIds].sort((a, b) => a - b).join(",") !== [...savedIds].sort((a, b) => a - b).join(",");
    const saveMutation = useMutation({
        mutationFn: () => rbacService.replaceUserRoles(user!.id, { roleIds: selectedRoleIds }),
        onSuccess: async (roles) => {
            setSelectedRoleIds(roles.map((role) => role.id));
            setSaveError(null);
            setLastAdminError(false);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userRoles(user!.id) }),
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users }),
            ]);
            onToast(`Đã cập nhật Roles cho User “${user!.displayName || user!.username}”.`);
            if (user!.id === currentUserId) {
                try {
                    dispatch(setAuth(await authService.refreshSession()));
                } catch {
                    setSaveError("Roles đã lưu nhưng không thể làm mới quyền phiên hiện tại. Hãy tải lại trang.");
                }
            }
        },
        onError: (error) => {
            setSaveError(getApiErrorMessage(error, "cập nhật Roles của User"));
            setLastAdminError(getApiErrorCode(error) === "LAST_ADMIN_PROTECTED");
        },
    });

    function editUser(userId: number) {
        setEditingUserId(userId);
        setSaveError(null);
        setLastAdminError(false);
    }

    return (
        <div className="rbac-panel-grid">
            {!user && <section className="rbac-card">
                <div className="rbac-section-heading">
                    <div>
                        <h2>Users</h2>
                        <p>Chọn User để thay Role và xem Permissions hiệu lực được kế thừa.</p>
                    </div>
                </div>

                {usersQuery.isLoading && <RbacLoading />}
                {usersQuery.isError && <RbacError error={usersQuery.error} action="tải Users" />}
                {usersQuery.data?.length === 0 && <RbacEmpty>Chưa có User nào.</RbacEmpty>}
                {usersQuery.data && usersQuery.data.length > 0 && (
                    <div className="rbac-user-list">
                        {usersQuery.data.map((item) => (
                            <button
                                type="button"
                                className="rbac-user-row"
                                key={item.id}
                                onClick={() => editUser(item.id)}
                                aria-label={`Sửa quyền của ${item.displayName || item.username}`}
                            >
                                <div className="rbac-role-copy">
                                    <strong>{item.displayName || item.username}</strong>
                                    <p>{item.email} · {item.roles.join(", ") || item.role}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>}

            {user && (
                <section className="rbac-card rbac-user-editor-card">
                    <div className="rbac-user-edit-grid">
                        <section>
                            <div className="rbac-user-editor-title">
                                <h2>Chỉnh quyền truy cập</h2>
                                <p>{user.displayName || user.username} · {user.email}</p>
                            </div>
                            <div className="rbac-user-subsection-heading">
                                <h3>Roles</h3>
                                <button type="button" className="rbac-link-button" onClick={() => setEditingUserId(null)}>← Quay lại</button>
                            </div>
                            {rolesQuery.isLoading && <RbacLoading />}
                            {rolesQuery.isError && <RbacError error={rolesQuery.error} action="tải Roles" />}
                            {rolesQuery.data?.length === 0 && <RbacEmpty>Chưa có Role để gán.</RbacEmpty>}
                            {userRolesQuery.isLoading && <RbacLoading />}
                            {userRolesQuery.isError && <RbacError error={userRolesQuery.error} action="tải Roles của User" />}
                            {rolesQuery.data && rolesQuery.data.length > 0 && !userRolesQuery.isLoading && !userRolesQuery.isError && (
                                <div className="rbac-user-table-wrap">
                                    <table className="rbac-user-table rbac-user-roles-table">
                                        <thead><tr><th scope="col">Role</th><th scope="col">Mô tả</th></tr></thead>
                                        <tbody>
                                            {rolesQuery.data.map((role) => (
                                                <tr key={role.id}>
                                                    <td>
                                                        <label className="rbac-role-check">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedRoleIds.includes(role.id)}
                                                                onChange={(event) => setSelectedRoleIds((current) => event.target.checked
                                                                    ? [...new Set([...current, role.id])]
                                                                    : current.filter((id) => id !== role.id))}
                                                            />
                                                            <strong>{role.name}</strong>
                                                        </label>
                                                    </td>
                                                    <td>{role.description || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        <section>
                            {userRolesQuery.isLoading && <RbacLoading />}
                            {userRolesQuery.isError && <RbacError error={userRolesQuery.error} action="tải Roles của User" />}
                            {!userRolesQuery.isLoading && selectedRoles.length === 0 && <RbacEmpty>Tick Role để xem Permissions tương ứng.</RbacEmpty>}
                            {rolePermissionQueries.map((query, index) => query.isLoading && <RbacLoading key={selectedRoles[index]?.id ?? index} />)}
                            {rolePermissionQueries.map((query, index) => query.isError && <RbacError key={selectedRoles[index]?.id ?? index} error={query.error} action={`tải Permissions của ${selectedRoles[index]?.name ?? "Role"}`} />)}
                            {selectedRoles.length > 0 && !rolePermissionQueries.some((query) => query.isLoading || query.isError) && effectivePermissions.length === 0 && <RbacEmpty>Các Role đã chọn chưa có Permission.</RbacEmpty>}
                            {effectivePermissions.length > 0 && (
                                <div className="rbac-user-table-wrap">
                                    <table className="rbac-user-table rbac-effective-permissions-table">
                                        <thead><tr><th scope="col">Permission</th><th scope="col">Được cấp bởi</th></tr></thead>
                                        <tbody>
                                            {effectivePermissions.map(({ permission, roles }) => (
                                                <tr key={permission.id}>
                                                    <td>{permission.description || permission.code}</td>
                                                    <td><div className="rbac-role-source-list">{roles.map((roleName) => <span key={roleName}>{roleName}</span>)}</div></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>

                    {selectedRoleIds.length === 0 && <p className="rbac-inline-error" role="alert">Phải chọn ít nhất một Role trước khi lưu.</p>}
                    {lastAdminError && <p className="rbac-inline-error" role="alert">Không thể bỏ các quyền quản trị RBAC khỏi Admin cuối cùng.</p>}
                    {saveError && !lastAdminError && <p className="rbac-inline-error" role="alert">{saveError}</p>}
                    <div className="rbac-footer-actions rbac-user-save-actions">
                        <button
                            type="button"
                            className="rbac-primary-button"
                            disabled={!dirty || selectedRoleIds.length === 0 || saveMutation.isPending || rolesQuery.isLoading || rolesQuery.isError || userRolesQuery.isLoading || userRolesQuery.isError}
                            onClick={() => saveMutation.mutate()}
                        >{saveMutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}</button>
                        <span>{selectedRoleIds.length} Role được chọn</span>
                    </div>
                </section>
            )}
        </div>
    );
}
