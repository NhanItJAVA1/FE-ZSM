import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { rbacService } from "../../../services/api/rbacService.js";
import { getApiErrorMessage } from "../apiErrors.js";
import type { PermissionDto } from "../types.js";
import { RbacEmpty, RbacError, RbacLoading } from "./RbacStates.js";

function moduleName(permission: PermissionDto) {
    const [module] = permission.code.split(".");
    return module?.replaceAll("-", " ") || "other";
}

export default function PermissionManagementPanel() {
    const queryClient = useQueryClient();
    const rolesQuery = useQuery({ queryKey: QUERY_KEYS.rbacRoles, queryFn: rbacService.getRoles });
    const permissionsQuery = useQuery({ queryKey: QUERY_KEYS.rbacPermissions, queryFn: rbacService.getPermissions });
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const role = rolesQuery.data?.find((item) => item.id === selectedRoleId) ?? rolesQuery.data?.[0];
    const selectedId = role?.id;
    const rolePermissionsQuery = useQuery({
        queryKey: selectedId ? QUERY_KEYS.rolePermissions(selectedId) : ["rbac", "role-permissions", "none"],
        queryFn: () => rbacService.getRolePermissions(selectedId!),
        enabled: selectedId !== undefined,
    });
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
    const [saveError, setSaveError] = useState<string | null>(null);
    const savedIds = useMemo(
        () => rolePermissionsQuery.data?.map((permission) => permission.id) ?? [],
        [rolePermissionsQuery.data]
    );

    useEffect(() => {
        setSelectedPermissionIds(savedIds);
        setSaveError(null);
    }, [selectedId, rolePermissionsQuery.data]);

    const groups = useMemo(() => {
        const grouped = new Map<string, PermissionDto[]>();
        for (const permission of permissionsQuery.data ?? []) {
            const module = moduleName(permission);
            grouped.set(module, [...(grouped.get(module) ?? []), permission]);
        }
        return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right));
    }, [permissionsQuery.data]);
    const dirty = [...selectedPermissionIds].sort((a, b) => a - b).join(",") !== [...savedIds].sort((a, b) => a - b).join(",");

    const saveMutation = useMutation({
        mutationFn: () => rbacService.replaceRolePermissions(selectedId!, { permissionIds: selectedPermissionIds }),
        onSuccess: async () => {
            setSaveError(null);
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rolePermissions(selectedId!) });
        },
        onError: (error) => setSaveError(getApiErrorMessage(error, "cập nhật Permissions")),
    });

    function togglePermission(id: number, checked: boolean) {
        setSelectedPermissionIds((current) => checked
            ? [...new Set([...current, id])]
            : current.filter((permissionId) => permissionId !== id));
    }

    return (
        <section className="rbac-card">
            <div className="rbac-section-heading">
                <div>
                    <h2>Permissions theo Role</h2>
                    <p>Chọn Role rồi cấu hình quyền hiệu lực của Role đó.</p>
                </div>
                {role && <button type="button" className="ghost-btn" onClick={() => void rolePermissionsQuery.refetch()}>Tải lại</button>}
            </div>

            {rolesQuery.isLoading && <RbacLoading />}
            {rolesQuery.isError && <RbacError error={rolesQuery.error} action="tải Roles" />}
            {rolesQuery.data && rolesQuery.data.length === 0 && <RbacEmpty>Tạo Role trước khi cấu hình Permissions.</RbacEmpty>}

            {rolesQuery.data && rolesQuery.data.length > 0 && (
                <>
                    <label className="rbac-role-select">
                        Role
                        <select value={role?.id ?? ""} onChange={(event) => setSelectedRoleId(Number(event.target.value))}>
                            {rolesQuery.data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    </label>

                    <div className="rbac-replace-warning" role="note">
                        <strong>Lưu sẽ thay thế toàn bộ danh sách Permission hiện tại của Role.</strong>
                        <span>Quyền không được chọn sẽ bị thu hồi. Kiểm tra kỹ trước khi lưu.</span>
                    </div>

                    {permissionsQuery.isLoading && <RbacLoading />}
                    {permissionsQuery.isError && <RbacError error={permissionsQuery.error} action="tải Permissions" />}
                    {rolePermissionsQuery.isLoading && <RbacLoading />}
                    {rolePermissionsQuery.isError && <RbacError error={rolePermissionsQuery.error} action="tải Permissions của Role" />}
                    {permissionsQuery.data?.length === 0 && <RbacEmpty>Backend chưa có Permissions.</RbacEmpty>}

                    {permissionsQuery.data && permissionsQuery.data.length > 0 && !rolePermissionsQuery.isLoading && !rolePermissionsQuery.isError && (
                        <div className="rbac-permission-groups">
                            {groups.map(([module, permissions]) => {
                                const allChecked = permissions.every((permission) => selectedPermissionIds.includes(permission.id));
                                return (
                                    <section className="rbac-permission-group" key={module}>
                                        <div className="rbac-group-heading">
                                            <h3>{module}</h3>
                                            <button
                                                type="button"
                                                className="rbac-link-button"
                                                onClick={() => {
                                                    for (const permission of permissions) togglePermission(permission.id, !allChecked);
                                                }}
                                            >{allChecked ? "Bỏ chọn nhóm" : "Chọn cả nhóm"}</button>
                                        </div>
                                        <div className="rbac-permission-list">
                                            {permissions.map((permission) => (
                                                <label className="rbac-permission-item" key={permission.id}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPermissionIds.includes(permission.id)}
                                                        onChange={(event) => togglePermission(permission.id, event.target.checked)}
                                                    />
                                                    <span>
                                                        <strong>{permission.code}</strong>
                                                        <small>{permission.description}</small>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    )}

                    {saveError && <p className="rbac-inline-error" role="alert">{saveError}</p>}
                    <div className="rbac-footer-actions">
                        <span>{selectedPermissionIds.length} Permission được chọn</span>
                        <button
                            type="button"
                            className="rbac-primary-button"
                            disabled={!dirty || saveMutation.isPending || rolePermissionsQuery.isLoading || permissionsQuery.isLoading || permissionsQuery.isError || rolePermissionsQuery.isError}
                            onClick={() => saveMutation.mutate()}
                        >{saveMutation.isPending ? "Đang lưu…" : "Lưu Permissions"}</button>
                    </div>
                </>
            )}
        </section>
    );
}
