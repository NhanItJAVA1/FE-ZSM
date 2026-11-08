import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { rbacService } from "../../../services/api/rbacService.js";
import { getApiErrorCode, getApiErrorMessage } from "../apiErrors.js";
import { RbacEmpty, RbacError, RbacLoading } from "./RbacStates.js";

export default function UserRoleAssignmentPanel() {
    const queryClient = useQueryClient();
    const usersQuery = useQuery({ queryKey: QUERY_KEYS.users, queryFn: rbacService.getUsers });
    const rolesQuery = useQuery({ queryKey: QUERY_KEYS.rbacRoles, queryFn: rbacService.getRoles });
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const user = usersQuery.data?.find((item) => item.id === selectedUserId) ?? usersQuery.data?.[0];
    const userId = user?.id;
    const userRolesQuery = useQuery({
        queryKey: userId ? QUERY_KEYS.userRoles(userId) : ["rbac", "user-roles", "none"],
        queryFn: () => rbacService.getUserRoles(userId!),
        enabled: userId !== undefined,
    });
    const savedIds = useMemo(() => userRolesQuery.data?.map((role) => role.id) ?? [], [userRolesQuery.data]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [lastAdminError, setLastAdminError] = useState(false);

    useEffect(() => {
        setSelectedRoleIds(savedIds);
        setSaveError(null);
        setLastAdminError(false);
    }, [userId, savedIds]);

    const dirty = [...selectedRoleIds].sort((a, b) => a - b).join(",") !== [...savedIds].sort((a, b) => a - b).join(",");
    const saveMutation = useMutation({
        mutationFn: () => rbacService.replaceUserRoles(userId!, { roleIds: selectedRoleIds }),
        onSuccess: async (roles) => {
            setSelectedRoleIds(roles.map((role) => role.id));
            setSaveError(null);
            setLastAdminError(false);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userRoles(userId!) }),
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users }),
            ]);
        },
        onError: (error) => {
            setSaveError(getApiErrorMessage(error, "cập nhật Roles của User"));
            setLastAdminError(getApiErrorCode(error) === "LAST_ADMIN_PROTECTED");
        },
    });

    return (
        <section className="rbac-card">
            <div className="rbac-section-heading">
                <div>
                    <h2>Gán Roles cho User</h2>
                    <p>Mỗi User phải giữ ít nhất một Role. PUT thay thế toàn bộ danh sách đang gán.</p>
                </div>
                {user && <button type="button" className="ghost-btn" onClick={() => void userRolesQuery.refetch()}>Tải lại</button>}
            </div>

            {usersQuery.isLoading && <RbacLoading />}
            {usersQuery.isError && <RbacError error={usersQuery.error} action="tải Users" />}
            {usersQuery.data?.length === 0 && <RbacEmpty>Chưa có User nào.</RbacEmpty>}

            {usersQuery.data && usersQuery.data.length > 0 && (
                <>
                    <label className="rbac-role-select">
                        User
                        <select value={user?.id ?? ""} onChange={(event) => setSelectedUserId(Number(event.target.value))}>
                            {usersQuery.data.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.displayName || item.username} · {item.email}
                                </option>
                            ))}
                        </select>
                    </label>
                    {user && <p className="rbac-user-summary">Đang chỉnh sửa <strong>{user.username}</strong> · Role legacy: {user.role}</p>}

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
                        >{saveMutation.isPending ? "Đang lưu…" : "Lưu Roles"}</button>
                    </div>
                </>
            )}
        </section>
    );
}
