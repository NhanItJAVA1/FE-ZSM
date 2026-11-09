import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { rbacService } from "../../../services/api/rbacService.js";
import { authService } from "../../../services/api/authService.js";
import { useAppDispatch, useAppSelector } from "../../../stores/hook.js";
import { setAuth } from "../../../stores/slices/authSlice.js";
import { getApiErrorCode, getApiErrorMessage } from "../apiErrors.js";
import { RbacEmpty, RbacError, RbacLoading } from "./RbacStates.js";

export default function UserRoleAssignmentPanel() {
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
    const savedIds = useMemo(() => userRolesQuery.data?.map((role) => role.id) ?? [], [userRolesQuery.data]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
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
                    <button type="button" className="ghost-btn" onClick={() => void usersQuery.refetch()}>Làm mới</button>
                </div>

                {usersQuery.isLoading && <RbacLoading />}
                {usersQuery.isError && <RbacError error={usersQuery.error} action="tải Users" />}
                {usersQuery.data?.length === 0 && <RbacEmpty>Chưa có User nào.</RbacEmpty>}
                {usersQuery.data && usersQuery.data.length > 0 && (
                    <div className="rbac-user-list">
                        {usersQuery.data.map((item) => (
                            <article className="rbac-user-row" key={item.id}>
                                <div className="rbac-role-copy">
                                    <strong>{item.displayName || item.username}</strong>
                                    <p>{item.email} · {item.roles.join(", ") || item.role}</p>
                                </div>
                                <button type="button" className="ghost-btn" onClick={() => editUser(item.id)}>
                                    {editingUserId === item.id ? "Đang sửa" : "Sửa"}
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>}

            {user && (
                <section className="rbac-card rbac-user-editor-card">
                    <div className="rbac-section-heading">
                        <div>
                            <h2>Quyền của {user.displayName || user.username}</h2>
                            <p>Permission được kế thừa từ các Role. Thay đổi Role bên dưới để cập nhật quyền hiệu lực.</p>
                        </div>
                        <button type="button" className="ghost-btn" onClick={() => setEditingUserId(null)}>Đóng</button>
                    </div>

                    <div className="rbac-user-edit-grid">
                        <section>
                            <h3>Roles</h3>
                            {rolesQuery.isLoading && <RbacLoading />}
                            {rolesQuery.isError && <RbacError error={rolesQuery.error} action="tải Roles" />}
                            {rolesQuery.data?.length === 0 && <RbacEmpty>Chưa có Role để gán.</RbacEmpty>}
                            {userRolesQuery.isLoading && <RbacLoading />}
                            {userRolesQuery.isError && <RbacError error={userRolesQuery.error} action="tải Roles của User" />}
                            {rolesQuery.data && rolesQuery.data.length > 0 && !userRolesQuery.isLoading && !userRolesQuery.isError && (
                                <div className="rbac-user-role-list">
                                    {rolesQuery.data.map((role) => (
                                        <label className="rbac-permission-item" key={role.id}>
                                            <input
                                                type="checkbox"
                                                checked={selectedRoleIds.includes(role.id)}
                                                onChange={(event) => setSelectedRoleIds((current) => event.target.checked
                                                    ? [...new Set([...current, role.id])]
                                                    : current.filter((id) => id !== role.id))}
                                            />
                                            <span>
                                                <strong>{role.name}</strong>
                                                <small>{role.description || "Chưa có mô tả"}</small>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section>
                            <h3>Permissions hiệu lực</h3>
                            {user.permissions.length > 0 ? (
                                <ul className="rbac-effective-permissions">
                                    {user.permissions.map((permission) => <li key={permission}>{permission}</li>)}
                                </ul>
                            ) : <RbacEmpty>User chưa có Permission hiệu lực.</RbacEmpty>}
                            <p className="rbac-user-summary">Để chỉnh Permission, mở tab Roles và cập nhật danh sách Permission của Role tương ứng.</p>
                        </section>
                    </div>

                    {selectedRoleIds.length === 0 && <p className="rbac-inline-error" role="alert">Phải chọn ít nhất một Role trước khi lưu.</p>}
                    {lastAdminError && <p className="rbac-inline-error" role="alert">Không thể bỏ các quyền quản trị RBAC khỏi Admin cuối cùng.</p>}
                    {saveError && !lastAdminError && <p className="rbac-inline-error" role="alert">{saveError}</p>}
                    <div className="rbac-footer-actions">
                        <span>{selectedRoleIds.length} Role được chọn</span>
                        <button
                            type="button"
                            className="rbac-primary-button"
                            disabled={!dirty || selectedRoleIds.length === 0 || saveMutation.isPending || rolesQuery.isLoading || rolesQuery.isError || userRolesQuery.isLoading || userRolesQuery.isError}
                            onClick={() => saveMutation.mutate()}
                        >{saveMutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}</button>
                    </div>
                </section>
            )}
        </div>
    );
}
